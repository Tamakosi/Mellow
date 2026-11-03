// Measures the rendered page and returns it as a Figma REST-style FRAME (coordinates relative to the page).
// Loaded into the page by capture.mjs, then called as window.__capture(name).
(() => {
  const num = (v) => parseFloat(v) || 0;
  const r2 = (v) => Math.round(v * 100) / 100;
  const r4 = (v) => Math.round(v * 10000) / 10000;

  // ---------- colour: rgb(), color(srgb …) and anything else through a 1px canvas ----------
  const cv = document.createElement("canvas");
  cv.width = cv.height = 1;
  const g2 = cv.getContext("2d", { willReadFrequently: true });
  const colorCache = new Map();
  const parseColor = (s) => {
    if (!s || s === "none" || s === "transparent") return null;
    if (colorCache.has(s)) return colorCache.get(s);
    let c = null, m;
    if ((m = s.match(/^rgba?\(([^)]+)\)$/))) {
      const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      c = { r: p[0] / 255, g: p[1] / 255, b: p[2] / 255, a: p.length > 3 ? p[3] : 1 };
    } else if ((m = s.match(/^color\(srgb\s+([^)]+)\)$/))) {
      const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number);
      c = { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    } else {
      g2.clearRect(0, 0, 1, 1);
      g2.fillStyle = "#000";
      g2.fillStyle = s;
      g2.fillRect(0, 0, 1, 1);
      const d = g2.getImageData(0, 0, 1, 1).data;
      c = { r: d[0] / 255, g: d[1] / 255, b: d[2] / 255, a: d[3] / 255 };
    }
    if (c) c = { r: r4(c.r), g: r4(c.g), b: r4(c.b), a: r4(c.a) };
    if (c && c.a <= 0.001) c = null;
    colorCache.set(s, c);
    return c;
  };
  const solid = (c) => ({ type: "SOLID", color: { ...c, a: 1 }, ...(c.a < 1 ? { opacity: c.a } : {}) });
  const splitTop = (s) => {
    const out = [];
    let d = 0, cur = "";
    for (const ch of s) {
      if (ch === "(") d++;
      if (ch === ")") d--;
      if (ch === "," && d === 0) {
        out.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  };
  const COLOR_TOKEN = /(rgba?\([^)]*\)|color\([^)]*\)|okl(?:ab|ch)\([^)]*\)|#[0-9a-f]{3,8}\b)/i;
  const shadows = (bs) => {
    if (!bs || bs === "none") return [];
    return splitTop(bs)
      .map((s) => {
        const tok = (s.match(COLOR_TOKEN) || [])[0];
        const c = parseColor(tok);
        if (!c) return null;
        const inset = /\binset\b/.test(s);
        const n = s.replace(tok, "").replace("inset", "").trim().split(/\s+/).map(num);
        return { type: inset ? "INNER_SHADOW" : "DROP_SHADOW", visible: true, color: c, offset: { x: n[0] || 0, y: n[1] || 0 }, radius: n[2] || 0, spread: n[3] || 0, blendMode: "NORMAL" };
      })
      .filter(Boolean);
  };
  const radii = (cs, w, h) => {
    const f = (v) => {
      const first = String(v).split(" ")[0];
      return /%/.test(first) ? (Math.min(w, h) * num(first)) / 100 : Math.min(num(first), Math.min(w, h) / 2);
    };
    return [f(cs.borderTopLeftRadius), f(cs.borderTopRightRadius), f(cs.borderBottomRightRadius), f(cs.borderBottomLeftRadius)].map(r2);
  };
  const nameOf = (el) => {
    const a = el.getAttribute("aria-label") || el.getAttribute("data-name");
    if (a) return a.slice(0, 60);
    if (el.id) return "#" + el.id;
    const tag = el.tagName.toLowerCase();
    if (["button", "a", "summary", "label"].includes(tag)) {
      const t = el.textContent.trim().replace(/\s+/g, " ");
      if (t) return `${tag === "a" ? "link" : tag} · ${t.slice(0, 40)}`;
    }
    return tag;
  };
  const hidden = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || num(cs.opacity) < 0.01) return true;
    if (cs.display !== "contents" && !el.getClientRects().length) return true;
    const det = el.closest("details");
    if (det && !det.open && el !== det && !el.closest("summary")) return true;
    // Screen-reader-only content (Tailwind sr-only: 1px box, clipped).
    if (cs.position === "absolute" && el.getBoundingClientRect().width <= 1 && /rect\(0px|inset\(50%\)/.test(cs.clip + " " + cs.clipPath)) return true;
    return false;
  };

  // ---------- SVG paths: parse, convert arcs to cubics, apply the shape's screen matrix ----------
  const parsePath = (d) => {
    const segs = [];
    let i = 0, cmd = "";
    const ws = () => { while (i < d.length && /[\s,]/.test(d[i])) i++; };
    const number = () => {
      ws();
      const m = d.slice(i).match(/^[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/);
      if (!m) throw new Error("bad path at " + i);
      i += m[0].length;
      return +m[0];
    };
    const flag = () => { ws(); const c = d[i++]; return c === "1" ? 1 : 0; };
    let cx = 0, cy = 0, sx = 0, sy = 0, lc = null, lq = null;
    while (true) {
      ws();
      if (i >= d.length) break;
      if (/[a-zA-Z]/.test(d[i])) cmd = d[i++];
      else if (!cmd) break;
      const rel = cmd === cmd.toLowerCase();
      const C = cmd.toUpperCase();
      const px = (v) => (rel ? cx + v : v), py = (v) => (rel ? cy + v : v);
      if (C === "Z") { segs.push({ c: "Z" }); cx = sx; cy = sy; lc = lq = null; continue; }
      if (C === "M") { const x = px(number()), y = py(number()); segs.push({ c: "M", p: [x, y] }); cx = sx = x; cy = sy = y; cmd = rel ? "l" : "L"; lc = lq = null; continue; }
      if (C === "L") { const x = px(number()), y = py(number()); segs.push({ c: "L", p: [x, y] }); cx = x; cy = y; lc = lq = null; continue; }
      if (C === "H") { const x = rel ? cx + number() : number(); segs.push({ c: "L", p: [x, cy] }); cx = x; lc = lq = null; continue; }
      if (C === "V") { const y = rel ? cy + number() : number(); segs.push({ c: "L", p: [cx, y] }); cy = y; lc = lq = null; continue; }
      if (C === "C" || C === "S") {
        let x1, y1;
        if (C === "C") { x1 = px(number()); y1 = py(number()); } else { x1 = lc ? 2 * cx - lc[0] : cx; y1 = lc ? 2 * cy - lc[1] : cy; }
        const x2 = px(number()), y2 = py(number()), x = px(number()), y = py(number());
        segs.push({ c: "C", p: [x1, y1, x2, y2, x, y] }); lc = [x2, y2]; lq = null; cx = x; cy = y; continue;
      }
      if (C === "Q" || C === "T") {
        let x1, y1;
        if (C === "Q") { x1 = px(number()); y1 = py(number()); } else { x1 = lq ? 2 * cx - lq[0] : cx; y1 = lq ? 2 * cy - lq[1] : cy; }
        const x = px(number()), y = py(number());
        segs.push({ c: "C", p: [cx + (2 / 3) * (x1 - cx), cy + (2 / 3) * (y1 - cy), x + (2 / 3) * (x1 - x), y + (2 / 3) * (y1 - y), x, y] });
        lq = [x1, y1]; lc = null; cx = x; cy = y; continue;
      }
      if (C === "A") {
        const rx = number(), ry = number(), rot = number(), laf = flag(), sf = flag(), x = px(number()), y = py(number());
        segs.push(...arcToCubics(cx, cy, rx, ry, rot, laf, sf, x, y));
        cx = x; cy = y; lc = lq = null; continue;
      }
      i++;
    }
    return segs;
  };
  const arcToCubics = (x1, y1, rx, ry, phiDeg, fa, fs, x2, y2) => {
    if (!rx || !ry) return [{ c: "L", p: [x2, y2] }];
    rx = Math.abs(rx); ry = Math.abs(ry);
    const phi = (phiDeg * Math.PI) / 180, cos = Math.cos(phi), sin = Math.sin(phi);
    const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
    const x1p = cos * dx + sin * dy, y1p = -sin * dx + cos * dy;
    const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
    const sign = fa === fs ? -1 : 1;
    const num_ = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
    const co = sign * Math.sqrt(Math.max(0, num_ / (rx * rx * y1p * y1p + ry * ry * x1p * x1p)));
    const cxp = (co * rx * y1p) / ry, cyp = (-co * ry * x1p) / rx;
    const cx = cos * cxp - sin * cyp + (x1 + x2) / 2, cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
    const ang = (ux, uy, vx, vy) => { const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy); return a; };
    let t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
    if (!fs && dt > 0) dt -= 2 * Math.PI;
    if (fs && dt < 0) dt += 2 * Math.PI;
    const n = Math.ceil(Math.abs(dt) / (Math.PI / 2) - 1e-9) || 1;
    const step = dt / n, k = (4 / 3) * Math.tan(step / 4);
    const pt = (t) => [cx + rx * Math.cos(t) * cos - ry * Math.sin(t) * sin, cy + rx * Math.cos(t) * sin + ry * Math.sin(t) * cos];
    const dv = (t) => [-rx * Math.sin(t) * cos - ry * Math.cos(t) * sin, -rx * Math.sin(t) * sin + ry * Math.cos(t) * cos];
    const out = [];
    for (let j = 0; j < n; j++) {
      const a = t1 + j * step, b = a + step;
      const p0 = pt(a), p3 = pt(b), d0 = dv(a), d3 = dv(b);
      out.push({ c: "C", p: [p0[0] + k * d0[0], p0[1] + k * d0[1], p3[0] - k * d3[0], p3[1] - k * d3[1], j === n - 1 ? x2 : p3[0], j === n - 1 ? y2 : p3[1]] });
    }
    return out;
  };
  const fmt = (v) => String(Math.round(v * 1000) / 1000);
  const segsToD = (segs, m, ox, oy) => {
    const T = (x, y) => [m.a * x + m.c * y + m.e - ox, m.b * x + m.d * y + m.f - oy];
    return segs
      .map((s) => {
        if (s.c === "Z") return "Z";
        const out = [];
        for (let k = 0; k < s.p.length; k += 2) out.push(...T(s.p[k], s.p[k + 1]).map(fmt));
        return s.c + " " + out.join(" ");
      })
      .join(" ");
  };
  const shapeD = (el) => {
    const g = (a) => num(el.getAttribute(a));
    switch (el.tagName.toLowerCase()) {
      case "path": return el.getAttribute("d") || "";
      case "circle": { const cx = g("cx"), cy = g("cy"), r = g("r"); return `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z`; }
      case "ellipse": { const cx = g("cx"), cy = g("cy"), rx = g("rx"), ry = g("ry"); return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`; }
      case "rect": {
        const x = g("x"), y = g("y"), w = g("width"), h = g("height");
        const rx = Math.min(g("rx") || g("ry"), w / 2, h / 2);
        if (!rx) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
        return `M${x + rx} ${y}H${x + w - rx}A${rx} ${rx} 0 0 1 ${x + w} ${y + rx}V${y + h - rx}A${rx} ${rx} 0 0 1 ${x + w - rx} ${y + h}H${x + rx}A${rx} ${rx} 0 0 1 ${x} ${y + h - rx}V${y + rx}A${rx} ${rx} 0 0 1 ${x + rx} ${y}Z`;
      }
      case "line": return `M${g("x1")} ${g("y1")}L${g("x2")} ${g("y2")}`;
      case "polyline":
      case "polygon": {
        const p = (el.getAttribute("points") || "").trim().split(/[\s,]+/).map(Number);
        let d = "";
        for (let k = 0; k < p.length; k += 2) d += (k ? "L" : "M") + p[k] + " " + p[k + 1];
        return d + (el.tagName.toLowerCase() === "polygon" ? "Z" : "");
      }
    }
    return "";
  };
  const CAP = { round: "ROUND", square: "SQUARE" }, JOIN = { round: "ROUND", bevel: "BEVEL" };
  const svgNode = (svg, rect, origin) => {
    const scs = getComputedStyle(svg);
    const kids = [];
    let k = 0;
    for (const sh of svg.querySelectorAll("path, circle, rect, line, polyline, polygon, ellipse")) {
      const cs = getComputedStyle(sh);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const d = shapeD(sh);
      if (!d) continue;
      const m = sh.getScreenCTM();
      if (!m) continue;
      const op = num(cs.opacity) * (sh.closest("g[opacity]") ? num(sh.closest("g[opacity]").getAttribute("opacity")) : 1);
      const fill = parseColor(cs.fill), stroke = parseColor(cs.stroke);
      if (!fill && !stroke) continue;
      const scale = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
      const paint = (c, o) => { const p = solid({ ...c, a: c.a * o * op }); return p; };
      const node = {
        type: "VECTOR",
        name: sh.tagName.toLowerCase() + (k++ ? " " + k : ""),
        absoluteBoundingBox: { x: r2(rect.left - origin.left), y: r2(rect.top - origin.top), width: r2(rect.width), height: r2(rect.height) },
        fills: fill ? [paint(fill, num(cs.fillOpacity) || 1)] : [],
        strokes: stroke ? [paint(stroke, num(cs.strokeOpacity) || 1)] : [],
        strokeWeight: r2(num(cs.strokeWidth) * scale),
        strokeAlign: "CENTER",
        strokeCap: CAP[cs.strokeLinecap] || "NONE",
        strokeJoin: JOIN[cs.strokeLinejoin] || "MITER",
        fillGeometry: [{ path: segsToD(parsePath(d), m, rect.left, rect.top), windingRule: cs.fillRule === "evenodd" ? "EVENODD" : "NONZERO" }],
      };
      if (cs.strokeDasharray && cs.strokeDasharray !== "none") node.strokeDashes = cs.strokeDasharray.split(/[\s,]+/).map((v) => r2(num(v) * scale));
      kids.push(node);
    }
    if (!kids.length) return null;
    const o = num(scs.opacity);
    const first = svg.querySelector("path");
    const icon = first && svg.querySelectorAll("path").length === 1 && (window.__ICONS || {})[first.getAttribute("d")];
    const vb = svg.getAttribute("viewBox");
    const mel = vb === "0 0 64 64" ? "Mel/Face" : vb === "0 0 80 80" ? "Mel/" + ((svg.getAttribute("aria-label") || "").match(/waving|thinking|cheering|unsure/) || ["hello"])[0].replace("waving", "Hello").replace("thinking", "Thinking").replace("cheering", "Found").replace("unsure", "Unsure") : null;
    const keyName = icon ? "icon/" + icon + (scs.fill !== "none" ? " filled" : "") : mel;
    return {
      type: "FRAME",
      name: keyName || svg.getAttribute("aria-label") || "svg",
      absoluteBoundingBox: { x: r2(rect.left - origin.left), y: r2(rect.top - origin.top), width: r2(rect.width), height: r2(rect.height) },
      fills: [],
      clipsContent: scs.overflow !== "visible",
      ...(o < 1 ? { opacity: r2(o) } : {}),
      svgKey: keyName ? keyName + "@" + Math.round(rect.width) + (icon ? "/" + r2(num(getComputedStyle(first).strokeWidth)) : "") : null,
      children: kids,
    };
  };

  // ---------- text ----------
  const KNOWN = ["Figtree", "Georgia", "Trebuchet MS", "Courier New", "Consolas", "Segoe UI", "Arial", "Times New Roman", "Verdana"];
  const GENERIC = { "ui-monospace": "Consolas", monospace: "Consolas", "system-ui": "Segoe UI", "sans-serif": "Arial", serif: "Times New Roman", "ui-serif": "Georgia" };
  const famOf = (cs) => {
    for (const raw of cs.fontFamily.split(",")) {
      const f = raw.replace(/["']/g, "").trim();
      if (/^figtree$/i.test(f)) return "Figtree";
      const k = KNOWN.find((n) => n.toLowerCase() === f.toLowerCase());
      if (k) return k;
      if (GENERIC[f]) return GENERIC[f];
    }
    return "Figtree";
  };
  const CASE = { uppercase: "UPPER", lowercase: "LOWER", capitalize: "TITLE" };
  const styleOf = (el) => {
    const cs = getComputedStyle(el);
    const deco = /underline/.test(cs.textDecorationLine) ? "UNDERLINE" : /line-through/.test(cs.textDecorationLine) ? "STRIKETHROUGH" : undefined;
    return {
      fontFamily: famOf(cs),
      fontWeight: Math.round(num(cs.fontWeight) / 100) * 100,
      fontSize: num(cs.fontSize),
      italic: cs.fontStyle === "italic" || undefined,
      letterSpacing: cs.letterSpacing === "normal" ? 0 : r2(num(cs.letterSpacing)),
      lineHeightPx: cs.lineHeight === "normal" ? null : r2(num(cs.lineHeight)),
      textDecoration: deco,
      textCase: CASE[cs.textTransform],
      color: parseColor(cs.color) || { r: 0, g: 0, b: 0, a: 1 },
    };
  };
  const isInline = (el) => {
    const cs = getComputedStyle(el);
    if (!(cs.display === "inline" || cs.display === "contents")) return false;
    if (parseColor(cs.backgroundColor) || num(cs.borderTopWidth) || num(cs.borderBottomWidth) || cs.boxShadow !== "none") return false;
    if (el.matches("svg, img, input, select, textarea")) return false;
    // Links and buttons to real screens stay their own layer (so the prototype can wire them) when they sit on one line.
    if (el.matches("a[href^='/'], a[href^='#']:not([href='#']), button") && el.getClientRects().length === 1) return false;
    return [...el.childNodes].every((c) => c.nodeType === 3 || (c.nodeType === 1 && (c.tagName === "BR" || isInline(c) || hidden(c))));
  };
  // Text nodes (and <br>s) inside a range, clipped to its ends, skipping hidden inline parts.
  const piecesOf = (range, owner) => {
    const out = [];
    const tw = document.createTreeWalker(owner, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    const skip = (el) => { for (let e = el; e && e !== owner; e = e.parentElement) if (hidden(e)) return true; return false; };
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (!range.intersectsNode(n)) continue;
      if (n.nodeType === 3) {
        if (skip(n.parentElement)) continue;
        const s = n === range.startContainer ? range.startOffset : 0, e = n === range.endContainer ? range.endOffset : n.nodeValue.length;
        if (e > s) out.push({ node: n, s, e, t: n.nodeValue.slice(s, e), el: n.parentElement });
      } else if (n.tagName === "BR" && !skip(n)) out.push({ t: "\n", el: n.parentElement, br: true });
    }
    return out;
  };
  const linesOf = (range) => {
    const rects = [...range.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5);
    const lines = [];
    for (const r of rects) {
      const mid = (r.top + r.bottom) / 2;
      const line = lines.find((l) => Math.abs(l.mid - mid) < 4);
      if (line) { line.left = Math.min(line.left, r.left); line.right = Math.max(line.right, r.right); line.top = Math.min(line.top, r.top); line.bottom = Math.max(line.bottom, r.bottom); }
      else lines.push({ mid, left: r.left, right: r.right, top: r.top, bottom: r.bottom });
    }
    return lines.sort((a, b) => a.mid - b.mid);
  };
  const textRun = (nodes, owner, origin) => {
    const range = document.createRange();
    range.setStartBefore(nodes[0]);
    range.setEndAfter(nodes[nodes.length - 1]);
    // Measure without the collapsed spaces at either end.
    const texts = piecesOf(range, owner).filter((p) => p.node);
    const firstT = texts.find((p) => /\S/.test(p.t)), lastT = [...texts].reverse().find((p) => /\S/.test(p.t));
    if (!firstT) return [];
    range.setStart(firstT.node, firstT.s + firstT.t.search(/\S/));
    range.setEnd(lastT.node, lastT.s + lastT.t.trimEnd().length);
    const lines = linesOf(range);
    if (!lines.length) return [];
    // A run that starts part-way along its first line (after a highlighted word, say) can't be one text box:
    // split it into one box per line, so each line keeps its own start.
    const minLeft = Math.min(...lines.map((l) => l.left));
    if (lines.length > 1 && lines[0].left - minLeft > 2) {
      const words = [];
      for (const p of piecesOf(range, owner)) {
        if (!p.node) continue;
        for (const m of p.t.matchAll(/\S+/g)) {
          const wr = document.createRange();
          wr.setStart(p.node, p.s + m.index);
          wr.setEnd(p.node, p.s + m.index + m[0].length);
          const r = [...wr.getClientRects()].find((q) => q.width > 0);
          if (!r) continue;
          const mid = (r.top + r.bottom) / 2;
          let li = 0;
          lines.forEach((l, i) => { if (Math.abs(l.mid - mid) < Math.abs(lines[li].mid - mid)) li = i; });
          words.push({ node: p.node, s: p.s + m.index, e: p.s + m.index + m[0].length, li });
        }
      }
      const out = [];
      lines.forEach((_, i) => {
        const ws = words.filter((w) => w.li === i);
        if (!ws.length) return;
        const lr = document.createRange();
        lr.setStart(ws[0].node, ws[0].s);
        lr.setEnd(ws[ws.length - 1].node, ws[ws.length - 1].e);
        const t = textFromRange(lr, owner, origin);
        if (t) out.push(t);
      });
      return out;
    }
    const t = textFromRange(range, owner, origin, lines);
    return t ? [t] : [];
  };
  const textFromRange = (range, owner, origin, lines = linesOf(range)) => {
    if (!lines.length) return null;
    const pieces = piecesOf(range, owner);
    const ocs = getComputedStyle(owner);
    const pre = /pre/.test(ocs.whiteSpace);
    let chars = "", runs = [];
    for (const p of pieces) {
      let t = pre || p.br ? p.t : p.t.replace(/\s+/g, " ");
      if (!pre && (chars.endsWith(" ") || chars.endsWith("\n") || !chars) && t.startsWith(" ")) t = t.slice(1);
      if (p.br && chars.endsWith(" ")) chars = chars.slice(0, -1);
      if (!t) continue;
      runs.push({ start: chars.length, end: chars.length + t.length, el: p.el });
      chars += t;
    }
    const lead = chars.length - chars.trimStart().length;
    chars = chars.trim();
    if (!chars) return null;
    runs = runs.map((r) => ({ ...r, start: Math.max(0, r.start - lead), end: Math.min(chars.length, r.end - lead) })).filter((r) => r.end > r.start);
    const base = styleOf(runs[0].el);
    const contentH = lines[0].bottom - lines[0].top;
    let L = base.lineHeightPx;
    if (!L) L = lines.length > 1 ? (lines[lines.length - 1].mid - lines[0].mid) / (lines.length - 1) : contentH;
    L = r2(L);
    const top = lines[0].mid - L / 2;
    const left = Math.min(...lines.map((l) => l.left)), right = Math.max(...lines.map((l) => l.right));
    const align = { center: "CENTER", right: "RIGHT", end: "RIGHT", justify: "JUSTIFIED" }[ocs.textAlign] || "LEFT";
    const multi = lines.length > 1;
    // Multi-line text keeps the browser's line breaks: the box is as wide as the longest line plus a little slack.
    const slack = 3;
    const x = !multi ? left : align === "CENTER" ? left - slack / 2 : align === "RIGHT" ? left - slack : left;
    const width = right - left + (multi ? slack : 0);
    const node = {
      type: "TEXT",
      name: chars.slice(0, 40),
      characters: chars,
      absoluteBoundingBox: { x: r2(x - origin.left), y: r2(top - origin.top), width: r2(width), height: r2(L * lines.length) },
      style: {
        fontFamily: base.fontFamily, fontWeight: base.fontWeight, italic: base.italic, fontSize: base.fontSize, lineHeightPx: L, lineHeightUnit: "PIXELS",
        letterSpacing: base.letterSpacing, textAlignHorizontal: multi ? align : "LEFT", textAlignVertical: "TOP",
        textAutoResize: multi ? "HEIGHT" : "WIDTH_AND_HEIGHT", textDecoration: base.textDecoration, textCase: base.textCase,
      },
      fills: [solid(base.color)],
    };
    const table = {}, overrides = new Array(chars.length).fill(0);
    let nextId = 1;
    const keyOf = (s) => JSON.stringify([s.fontFamily, s.fontWeight, s.fontSize, s.italic, s.textDecoration, s.textCase, s.letterSpacing, s.color]);
    const ids = { [keyOf(base)]: 0 };
    for (const r of runs) {
      const st = styleOf(r.el), k = keyOf(st);
      if (!(k in ids)) {
        ids[k] = nextId;
        table[nextId] = { fontFamily: st.fontFamily, fontWeight: st.fontWeight, fontSize: st.fontSize, italic: st.italic, textDecoration: st.textDecoration, textCase: st.textCase, letterSpacing: st.letterSpacing, fills: [solid(st.color)] };
        nextId++;
      }
      for (let c = r.start; c < r.end; c++) overrides[c] = ids[k];
    }
    if (nextId > 1) { node.characterStyleOverrides = overrides; node.styleOverrideTable = table; }
    return node;
  };
  // A single line of text drawn by a form control (input value, placeholder, select option).
  const controlText = (chars, el, cs, colorCss, origin, opts = {}) => {
    const rect = el.getBoundingClientRect();
    const fs = num(cs.fontSize);
    const L = cs.lineHeight === "normal" ? r2(fs * 1.2) : num(cs.lineHeight);
    const cl = rect.left + num(cs.borderLeftWidth) + num(cs.paddingLeft);
    const ct = rect.top + num(cs.borderTopWidth) + num(cs.paddingTop);
    const ch = rect.height - num(cs.borderTopWidth) - num(cs.borderBottomWidth) - num(cs.paddingTop) - num(cs.paddingBottom);
    const cw = rect.width - num(cs.borderLeftWidth) - num(cs.borderRightWidth) - num(cs.paddingLeft) - num(cs.paddingRight);
    const st = styleOf(el);
    return {
      type: "TEXT",
      name: opts.name || "value",
      characters: chars,
      absoluteBoundingBox: { x: r2(cl - origin.left), y: r2((opts.multi ? ct : ct + (ch - L) / 2) - origin.top), width: r2(opts.multi ? cw : 10), height: L },
      style: {
        fontFamily: st.fontFamily, fontWeight: st.fontWeight, fontSize: fs, lineHeightPx: L, lineHeightUnit: "PIXELS", letterSpacing: st.letterSpacing,
        textAlignHorizontal: "LEFT", textAlignVertical: "TOP", textAutoResize: opts.multi ? "HEIGHT" : "WIDTH_AND_HEIGHT", textCase: st.textCase,
      },
      fills: [solid(parseColor(colorCss) || st.color)],
    };
  };

  // ---------- boxes ----------
  const box = (rect, origin) => ({ x: r2(rect.left - origin.left), y: r2(rect.top - origin.top), width: r2(rect.width), height: r2(rect.height) });
  const ctlOf = (el) => {
    if (!el.matches("a[href], button, summary, input, select, textarea, [role=switch], [role=tab], label")) return null;
    const name = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || el.id || "").trim().replace(/\s+/g, " ").slice(0, 80);
    return { tag: el.tagName.toLowerCase(), href: el.getAttribute("href") || undefined, name, type: el.getAttribute("type") || undefined, role: el.getAttribute("role") || undefined };
  };
  const visualFrame = (el, cs, rect, origin) => {
    const node = { type: "FRAME", name: nameOf(el), absoluteBoundingBox: box(rect, origin), fills: [], children: [] };
    const bg = parseColor(cs.backgroundColor);
    if (bg) node.fills.push(solid(bg));
    const bw = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(num);
    const bcs = [cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor].map(parseColor);
    const styles = [cs.borderTopStyle, cs.borderRightStyle, cs.borderBottomStyle, cs.borderLeftStyle];
    const sides = bw.map((w, i) => (styles[i] !== "none" && bcs[i] ? w : 0));
    if (sides.some(Boolean)) {
      node.strokes = [solid(bcs[sides.findIndex(Boolean)])];
      node.strokeAlign = "INSIDE";
      if (sides.every((v) => v === sides[0])) node.strokeWeight = sides[0];
      else { node.strokeWeight = Math.max(...sides); node.individualStrokeWeights = { top: sides[0], right: sides[1], bottom: sides[2], left: sides[3] }; }
      if (styles.includes("dashed")) node.strokeDashes = [6, 4];
    }
    const rr = radii(cs, rect.width, rect.height);
    if (rr.some(Boolean)) { if (rr.every((v) => v === rr[0])) node.cornerRadius = rr[0]; else node.rectangleCornerRadii = rr; }
    const sh = shadows(cs.boxShadow);
    if (sh.length) node.effects = sh;
    const o = num(cs.opacity);
    if (o < 1) node.opacity = r2(o);
    node.clipsContent = cs.overflowX !== "visible" || cs.overflowY !== "visible";
    if (/auto|scroll/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) node.overflowDirection = "VERTICAL_SCROLLING";
    else if (/auto|scroll/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1) node.overflowDirection = "HORIZONTAL_SCROLLING";
    const ctl = ctlOf(el);
    if (ctl) node.ctl = ctl;
    if (el.id) node.elId = el.id;
    node.cls = (el.getAttribute("class") || "").trim();
    // Flex settings, so the builder can turn simple rows and columns into auto layout.
    if (/flex/.test(cs.display)) {
      node.flex = {
        dir: /column/.test(cs.flexDirection) ? "V" : "H", wrap: cs.flexWrap !== "nowrap", gap: num(cs.columnGap) || 0, rowGap: num(cs.rowGap) || 0,
        pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(num), border: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(num),
        ai: cs.alignItems, jc: cs.justifyContent,
        inflow: [...el.children].filter((c) => !hidden(c)).every((c) => { const k = getComputedStyle(c); return k.position !== "absolute" && k.position !== "fixed" && !num(k.marginTop) && !num(k.marginLeft) && !num(k.marginRight) && !num(k.marginBottom); }),
      };
    }
    node.tag = el.tagName.toLowerCase();
    for (const a of ["aria-pressed", "aria-checked", "aria-current", "aria-expanded", "aria-selected"]) if (el.hasAttribute(a)) (node.aria = node.aria || {})[a.slice(5)] = el.getAttribute(a);
    if (el.matches("input[type=checkbox], input[type=radio]")) (node.aria = node.aria || {}).checked = String(el.checked);
    return node;
  };
  const outlineNode = (el, cs, rect, origin) => {
    const w = num(cs.outlineWidth), c = parseColor(cs.outlineColor);
    if (cs.outlineStyle === "none" || !w || !c) return null;
    const off = num(cs.outlineOffset);
    const rr = radii(cs, rect.width, rect.height).map((r) => (r ? r + off + w : 0));
    return {
      type: "RECTANGLE", name: "outline",
      absoluteBoundingBox: { x: r2(rect.left - off - w - origin.left), y: r2(rect.top - off - w - origin.top), width: r2(rect.width + 2 * (off + w)), height: r2(rect.height + 2 * (off + w)) },
      fills: [], strokes: [solid(c)], strokeWeight: w, strokeAlign: "INSIDE", ...(rr.every((v) => v === rr[0]) ? { cornerRadius: rr[0] } : { rectangleCornerRadii: rr }),
    };
  };
  const hasVisuals = (el, cs) =>
    !!(parseColor(cs.backgroundColor) || num(cs.borderTopWidth) || num(cs.borderBottomWidth) || num(cs.borderLeftWidth) || num(cs.borderRightWidth) || cs.boxShadow !== "none" || cs.overflowX !== "visible" || cs.overflowY !== "visible" || num(cs.opacity) < 1);
  const STRUCT = "a[href], button, summary, input, select, textarea, label, [role], header, nav, main, section, article, aside, footer, form, fieldset, details, dialog, ul, ol, li, h1, h2, h3, figure";
  const isGroup = (el, cs) => el.matches(STRUCT) || (/flex|grid/.test(cs.display) && [...el.children].filter((c) => !hidden(c)).length > 1) || (el.querySelector(":scope > input, :scope > select, :scope > textarea") && [...el.children].filter((c) => !hidden(c)).length > 1);

  // Native controls that the page does not draw itself.
  const nativeControl = (el, cs, rect, origin) => {
    const out = [];
    const b = box(rect, origin);
    const ink = parseColor(cs.accentColor) || parseColor(cs.color);
    if (el.type === "checkbox") {
      const on = el.checked;
      out.push({ type: "RECTANGLE", name: on ? "checkbox · checked" : "checkbox", absoluteBoundingBox: b, cornerRadius: 3, fills: [solid(on ? ink : { r: 1, g: 1, b: 1, a: 1 })], strokes: [solid(on ? ink : { r: 0.46, g: 0.46, b: 0.46, a: 1 })], strokeWeight: 1, strokeAlign: "INSIDE" });
      if (on) {
        const s = rect.width / 24;
        out.push({ type: "VECTOR", name: "check", absoluteBoundingBox: b, fills: [], strokes: [solid({ r: 1, g: 1, b: 1, a: 1 })], strokeWeight: r2(3 * s), strokeAlign: "CENTER", strokeCap: "ROUND", strokeJoin: "ROUND", fillGeometry: [{ path: `M ${fmt(6 * s)} ${fmt(12.5 * s)} L ${fmt(10 * s)} ${fmt(16.5 * s)} L ${fmt(18 * s)} ${fmt(8 * s)}`, windingRule: "NONZERO" }] });
      }
    } else if (el.type === "radio") {
      const on = el.checked;
      out.push({ type: "ELLIPSE", name: on ? "radio · selected" : "radio", absoluteBoundingBox: b, fills: [solid({ r: 1, g: 1, b: 1, a: 1 })], strokes: [solid(on ? ink : { r: 0.46, g: 0.46, b: 0.46, a: 1 })], strokeWeight: on ? 1.5 : 1, strokeAlign: "INSIDE" });
      if (on) { const d = rect.width * 0.5; out.push({ type: "ELLIPSE", name: "dot", absoluteBoundingBox: { x: r2(b.x + (b.width - d) / 2), y: r2(b.y + (b.height - d) / 2), width: r2(d), height: r2(d) }, fills: [solid(ink)] }); }
    } else if (el.type === "color") {
      const cl = rect.left + num(cs.borderLeftWidth) + num(cs.paddingLeft) + 2, ct = rect.top + num(cs.borderTopWidth) + num(cs.paddingTop) + 4;
      const cw = rect.right - num(cs.borderRightWidth) - num(cs.paddingRight) - 2 - cl, chh = rect.bottom - num(cs.borderBottomWidth) - num(cs.paddingBottom) - 4 - ct;
      out.push({ type: "RECTANGLE", name: "swatch", absoluteBoundingBox: { x: r2(cl - origin.left), y: r2(ct - origin.top), width: r2(cw), height: r2(chh) }, fills: [solid(parseColor(el.value))], strokes: [solid({ r: 0.467, g: 0.467, b: 0.467, a: 1 })], strokeWeight: 1, strokeAlign: "INSIDE" });
    }
    return out;
  };

  let hoisted = [];
  const modals = [];
  const zOf = (c) => {
    const ccs = getComputedStyle(c);
    if (ccs.position === "static") return 0;
    const z = parseInt(ccs.zIndex, 10);
    return isNaN(z) ? 0.5 : z + (z >= 0 ? 0.5 : 0);
  };
  const listMarker = (el, cs, origin) => {
    if (cs.display !== "list-item" || cs.listStylePosition !== "outside" || !/disc|circle|square|decimal/.test(cs.listStyleType)) return null;
    const range = document.createRange();
    range.selectNodeContents(el);
    const first = [...range.getClientRects()].find((r) => r.width > 0.5);
    if (!first) return null;
    if (cs.listStyleType !== "decimal") {
      const fs = num(cs.fontSize), d = r2(fs * 0.34), cxm = el.getBoundingClientRect().left + num(cs.paddingLeft) - fs * 0.9, cym = (first.top + first.bottom) / 2 + 0.25;
      return { type: "ELLIPSE", name: "bullet", absoluteBoundingBox: { x: r2(cxm - d / 2 - origin.left), y: r2(cym - d / 2 - origin.top), width: d, height: d }, fills: [solid(parseColor(cs.color))] };
    }
    g2.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const idx = [...el.parentElement.children].indexOf(el) + 1;
    const marker = cs.listStyleType === "decimal" ? idx + ". " : "• ";
    const w = g2.measureText(marker).width;
    const elRect = el.getBoundingClientRect();
    const L = cs.lineHeight === "normal" ? num(cs.fontSize) * 1.2 : num(cs.lineHeight);
    const st = styleOf(el);
    const mid = (first.top + first.bottom) / 2;
    return {
      type: "TEXT", name: "list marker", characters: marker.trim(),
      absoluteBoundingBox: { x: r2(elRect.left + num(cs.paddingLeft) - w - origin.left), y: r2(mid - L / 2 - origin.top), width: r2(w), height: r2(L) },
      style: { fontFamily: st.fontFamily, fontWeight: st.fontWeight, fontSize: st.fontSize, lineHeightPx: r2(L), lineHeightUnit: "PIXELS", letterSpacing: 0, textAlignHorizontal: "LEFT", textAlignVertical: "TOP", textAutoResize: "WIDTH_AND_HEIGHT" },
      fills: [solid(st.color)],
    };
  };

  const build = (el, origin) => {
    if (el.nodeType !== 1 || hidden(el)) return [];
    if (el.tagName === "DIALOG") { if (el.open && el.matches(":modal")) modals.push(el); return el.open && !el.matches(":modal") ? buildBox(el, origin) : []; }
    if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "TEMPLATE" || el.tagName === "NEXTJS-PORTAL") return [];
    return buildBox(el, origin);
  };
  const buildBox = (el, origin) => {
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (el instanceof SVGElement) {
      if (el.tagName.toLowerCase() !== "svg" || rect.width < 0.5) return [];
      const n = svgNode(el, rect, origin);
      return n ? [n] : [];
    }
    if (el.tagName === "IMG") return [];
    const kids = [];
    const passThrough = cs.display === "contents";
    const marker = listMarker(el, cs, origin);
    if (marker) kids.push(marker);
    if (el.tagName === "INPUT" && /^(checkbox|radio|color)$/.test(el.type)) {
      const f = visualFrame(el, cs, rect, origin);
      f.fills = []; delete f.strokes; delete f.strokeWeight; delete f.cornerRadius;
      if (el.type === "color") { const v = visualFrame(el, cs, rect, origin); Object.assign(f, { fills: v.fills, strokes: v.strokes, strokeWeight: v.strokeWeight, strokeAlign: v.strokeAlign, cornerRadius: v.cornerRadius }); }
      f.children = nativeControl(el, cs, rect, origin);
      f.name = el.getAttribute("aria-label") || (el.type + (el.value && el.type !== "color" ? " · " + el.value : ""));
      return [f];
    }
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      const val = el.value, ph = el.getAttribute("placeholder") || "";
      const shown = val ? (el.type === "password" ? "•".repeat(val.length) : val) : ph;
      if (shown && el.type !== "file") kids.push(controlText(shown, el, cs, val ? cs.color : getComputedStyle(el, "::placeholder").color, origin, { multi: el.tagName === "TEXTAREA", name: val ? "value" : "placeholder" }));
    }
    if (el.tagName === "SELECT") {
      const opt = el.selectedOptions[0];
      if (opt) kids.push(controlText(opt.textContent.trim(), el, cs, cs.color, origin, { name: "value" }));
      // The browser's own drop-down arrow.
      // Measured in Edge: an 8 × 4.5 chevron, centred 9px in from the right edge and 1px below the middle.
      const s = 12, x = rect.right - 9 - s / 2, y = rect.top + rect.height / 2 + 1 - s / 2;
      kids.push({ type: "FRAME", name: "Select arrow", absoluteBoundingBox: { x: r2(x - origin.left), y: r2(y - origin.top), width: s, height: s }, fills: [], clipsContent: false, svgKey: "Select arrow@12", children: [{ type: "VECTOR", name: "chevron", absoluteBoundingBox: { x: r2(x - origin.left), y: r2(y - origin.top), width: s, height: s }, fills: [], strokes: [solid(parseColor(cs.color))], strokeWeight: 1.5, strokeAlign: "CENTER", strokeCap: "ROUND", strokeJoin: "ROUND", fillGeometry: [{ path: "M 2 3.75 L 6 8.25 L 10 3.75", windingRule: "NONZERO" }] }] });
    }
    let run = [];
    const flush = () => { if (run.length) { kids.push(...textRun(run, el, origin)); run = []; } };
    if (el.tagName !== "SELECT" && el.tagName !== "TEXTAREA") {
      for (const c of el.childNodes) {
        if (c.nodeType === 3) { if (c.nodeValue.trim() || run.length) run.push(c); continue; }
        if (c.nodeType !== 1 || hidden(c)) continue;
        if (c.tagName === "BR") { run.push(c); continue; }
        if (isInline(c)) { run.push(c); continue; }
        flush();
        const ccs = getComputedStyle(c);
        const z = zOf(c);
        const lift = ccs.position === "fixed" || (ccs.position !== "static" && z >= 20);
        for (const n of build(c, origin)) {
          n.__z = z;
          if (lift) hoisted.push(n); else kids.push(n);
        }
      }
      flush();
    }
    kids.forEach((n, i) => { n.__i = i; if (n.__z == null) n.__z = 0; });
    kids.sort((a, b) => a.__z - b.__z || a.__i - b.__i);
    kids.forEach((n) => { delete n.__z; delete n.__i; });
    const out = [];
    if (passThrough) return kids;
    if (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA" || hasVisuals(el, cs) || isGroup(el, cs)) {
      const f = visualFrame(el, cs, rect, origin);
      f.children = kids;
      out.push(f);
      const ol = outlineNode(el, cs, rect, origin);
      if (ol) { if (f.clipsContent) out.push(ol); else f.children.unshift(ol); }
    } else {
      out.push(...kids);
      const ol = outlineNode(el, cs, rect, origin);
      if (ol) out.push(ol);
    }
    return out;
  };

  window.__capture = async (name) => {
    document.getAnimations().forEach((a) => { try { a.finish(); } catch { a.cancel(); } });
    await document.fonts.ready;
    hoisted = [];
    modals.length = 0;
    const origin = { left: 0, top: 0 };
    const body = document.body, bcs = getComputedStyle(body);
    const W = document.documentElement.clientWidth, H = Math.max(innerHeight, document.documentElement.scrollHeight);
    const children = [];
    [...body.children].map((c, i) => ({ c, i, z: zOf(c) })).sort((a, b) => a.z - b.z || a.i - b.i).forEach(({ c }) => children.push(...build(c, origin)));
    hoisted.sort((a, b) => a.__z - b.__z).forEach((n) => { delete n.__z; children.push(n); });
    for (const d of modals) {
      const bd = parseColor(getComputedStyle(d, "::backdrop").backgroundColor);
      if (bd) children.push({ type: "RECTANGLE", name: "backdrop", absoluteBoundingBox: { x: 0, y: 0, width: W, height: innerHeight }, fills: [solid(bd)] });
      hoisted = [];
      const built = buildBox(d, origin);
      built.forEach((n) => { n.name = n.name === "dialog" ? "Dialog" : n.name; n.modal = true; });
      children.push(...built, ...hoisted.map((n) => (delete n.__z, n)));
    }
    const frame = { type: "FRAME", name, absoluteBoundingBox: { x: 0, y: 0, width: W, height: H }, fills: [solid(parseColor(bcs.backgroundColor) || { r: 1, g: 1, b: 1, a: 1 })], clipsContent: true, children, viewportHeight: innerHeight };
    let count = 0;
    const walk = (n) => { count++; (n.children || []).forEach(walk); };
    walk(frame);
    return { frame, nodes: count };
  };
  return "capture ready";
})();
