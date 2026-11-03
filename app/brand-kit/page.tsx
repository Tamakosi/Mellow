"use client";

import { useState } from "react";
import { AppNav } from "@/components/app-nav";
import { AskMel } from "@/components/ask-mel";
import { Field, SaveBar, Toggle, describedBy, fakeSave, inputClass, type SaveState } from "@/components/form";
import { AppHeader, Avatar, Icon, card, cx, eyebrow, panel, pill } from "@/components/ui";
import { contrast, isHex } from "@/lib/contrast";

type Kit = {
  name: string;
  background: string;
  text: string;
  accent: string;
  heading: string;
  body: string;
  tone: string;
  voice: string;
  applyToNew: boolean;
};
type ColorKey = "background" | "text" | "accent";

const SAVED: Kit = {
  name: "Sunrise Elementary",
  background: "#F4F6F2",
  text: "#1F2A24",
  accent: "#3D5A49",
  heading: "Figtree",
  body: "Figtree",
  tone: "Friendly",
  voice: "",
  applyToNew: true,
};

const FONTS: [string, string][] = [
  ["Figtree", "var(--font-figtree), sans-serif"],
  ["Georgia", "Georgia, serif"],
  ["Trebuchet MS", "'Trebuchet MS', sans-serif"],
  ["Courier New", "'Courier New', monospace"],
];
const fontStack = (name: string) => FONTS.find(([n]) => n === name)?.[1] ?? "sans-serif";

const COLORS: [ColorKey, string, string][] = [
  ["background", "Background", "Most slides sit on this."],
  ["text", "Text", "Titles and body copy."],
  ["accent", "Accent", "Shapes, charts and highlights."],
];

const VOICE_MAX = 240;

const MEL_QUESTIONS = [
  { q: "What does a brand kit do?", a: "New decks start with your logo, colors and fonts, so you don’t restyle every slide by hand." },
  { q: "Why does it check contrast?", a: "Low contrast makes slides hard to read on projectors. I check text against your background so you know before you present." },
  { q: "Will it change decks I already made?", a: "No. The kit applies to new decks. You can still apply it to an older deck from the editor’s Theme menu." },
];

/** Pass/fail badge: icon plus words, never color alone. */
function Check({ ratio, min, label }: { ratio: number; min: number; label: string }) {
  const ok = ratio >= min;
  return (
    <li className="flex items-start gap-2.5">
      <span className={cx("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white", ok ? "bg-green-deep" : "bg-danger")}>
        <Icon name={ok ? "check" : "close"} size={11} stroke={3} />
      </span>
      <span>
        <span className="font-semibold">
          {label}: {ratio ? `${ratio.toFixed(1)}:1` : "–"}
        </span>{" "}
        <span className={ok ? "text-muted" : "font-semibold text-danger"}>
          {ok ? "Easy to read" : `Too faint. Aim for ${min}:1 or more.`}
        </span>
      </span>
    </li>
  );
}

function LogoSlot({ logo, dark }: { logo: string | null; dark?: boolean }) {
  return (
    <div className={cx("flex h-24 flex-1 items-center justify-center rounded-2xl border", dark ? "border-ink bg-ink" : "border-line bg-ground")}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- local preview of a file the user picked
        <img src={logo} alt={dark ? "Your logo on a dark slide" : "Your logo on a light slide"} className="max-h-14 max-w-[70%] object-contain" />
      ) : (
        <span className={cx("text-sm font-medium", dark ? "text-white/80" : "text-muted")}>{dark ? "On dark" : "On light"}</span>
      )}
    </div>
  );
}

export default function BrandKitPage() {
  const [saved, setSaved] = useState(SAVED);
  const [kit, setKit] = useState(SAVED);
  // Hex fields are edited as free text; only valid values reach the kit.
  const [hexDraft, setHexDraft] = useState<Record<ColorKey, string>>({ background: SAVED.background, text: SAVED.text, accent: SAVED.accent });
  const [state, setState] = useState<SaveState>("idle");
  const [logo, setLogo] = useState<string | null>(null);
  const [savedLogo, setSavedLogo] = useState<string | null>(null);

  const set = <K extends keyof Kit>(key: K, value: Kit[K]) => {
    setKit((k) => ({ ...k, [key]: value }));
    if (state === "saved") setState("idle");
  };

  const setColor = (key: ColorKey, value: string) => {
    setHexDraft((d) => ({ ...d, [key]: value }));
    if (isHex(value)) set(key, value.trim().toUpperCase());
  };

  const hexError = (key: ColorKey) => (isHex(hexDraft[key]) ? undefined : "Use a 6-digit color code, like #1F2A24.");
  const invalidColor = COLORS.some(([key]) => hexError(key));

  const dirty = logo !== savedLogo || (Object.keys(kit) as (keyof Kit)[]).some((k) => kit[k] !== saved[k]);

  const textRatio = contrast(kit.text, kit.background);
  const accentRatio = contrast(kit.accent, kit.background);

  const save = async () => {
    if (invalidColor) {
      const first = COLORS.find(([key]) => hexError(key));
      if (first) document.getElementById(`hex-${first[0]}`)?.focus();
      return;
    }
    setState("saving");
    try {
      await fakeSave();
      setSaved(kit);
      setSavedLogo(logo);
      setState("saved");
      setTimeout(() => setState((s) => (s === "saved" ? "idle" : s)), 3000);
    } catch {
      setState("error");
    }
  };

  const discard = () => {
    setKit(saved);
    setHexDraft({ background: saved.background, text: saved.text, accent: saved.accent });
    setLogo(savedLogo);
    setState("idle");
  };

  const sectionTitle = "text-xl font-semibold tracking-[-0.015em]";

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader center={<AppNav current="Brand kit" />}>
        <AskMel intro="Questions about your brand kit?" questions={MEL_QUESTIONS} />
        <Avatar />
      </AppHeader>

      <main className="mx-auto flex w-full max-w-[1168px] flex-col gap-8 px-4 pb-16 pt-8 md:px-6">
        <div className="flex flex-col gap-2">
          <div className={eyebrow}>Brand kit</div>
          <h1 className="text-[2.5rem] font-semibold leading-[1.15] tracking-[-0.025em] max-md:text-3xl">Make every deck look like you</h1>
          <p className="max-w-[620px] text-[1.0625rem] text-muted">Add your logo, colors and fonts once. New decks start with them.</p>
        </div>

        <div className="flex flex-wrap items-start gap-8">
          <div className="flex min-w-0 flex-[999_1_min(520px,100%)] flex-col gap-8">
            {/* Logo */}
            <section aria-labelledby="logo-title" className={cx(card, "in flex flex-col gap-4 p-6")}>
              <div>
                <h2 id="logo-title" className={sectionTitle}>
                  Logo
                </h2>
                <p className="text-muted">Check it reads on both light and dark slides.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <LogoSlot logo={logo} />
                <LogoSlot logo={logo} dark />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className={cx(pill, "cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink")}>
                  <Icon name="image" />
                  {logo ? "Replace logo" : "Upload logo"}
                  <input
                    type="file"
                    accept="image/png,image/svg+xml,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLogo(URL.createObjectURL(file));
                        if (state === "saved") setState("idle");
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
                {logo && (
                  <button type="button" onClick={() => setLogo(null)} className={pill}>
                    Remove
                  </button>
                )}
                <span className="text-[0.8125rem] text-muted">SVG or PNG with a transparent background works best.</span>
              </div>
              <Field id="brand-name" label="Brand name" hint="Shown on slides when there is no logo.">
                <input
                  id="brand-name"
                  value={kit.name}
                  onChange={(e) => set("name", e.target.value)}
                  autoComplete="organization"
                  aria-describedby={describedBy("brand-name")}
                  className={inputClass()}
                />
              </Field>
            </section>

            {/* Colors */}
            <section aria-labelledby="colors-title" className={cx(card, "in d1 flex flex-col gap-5 p-6")}>
              <div>
                <h2 id="colors-title" className={sectionTitle}>
                  Colors
                </h2>
                <p className="text-muted">Pick with the swatch or paste a color code.</p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-5">
                {COLORS.map(([key, label, hint]) => (
                  <Field key={key} id={`hex-${key}`} label={label} hint={hint} error={hexError(key)}>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        aria-label={`${label} color picker`}
                        value={kit[key].toLowerCase()}
                        onChange={(e) => setColor(key, e.target.value)}
                        className="size-12 shrink-0 cursor-pointer rounded-2xl border border-line-input bg-surface p-1"
                      />
                      <input
                        id={`hex-${key}`}
                        value={hexDraft[key]}
                        onChange={(e) => setColor(key, e.target.value)}
                        spellCheck={false}
                        autoComplete="off"
                        maxLength={7}
                        aria-invalid={!!hexError(key)}
                        aria-describedby={describedBy(`hex-${key}`)}
                        className={cx(inputClass(!!hexError(key)), "min-w-0 font-mono uppercase")}
                      />
                    </div>
                  </Field>
                ))}
              </div>
              <div className="rounded-2xl bg-ground p-4">
                <h3 className="mb-2 text-sm font-semibold">Readability</h3>
                <ul aria-live="polite" className="flex flex-col gap-2 text-sm">
                  <Check ratio={textRatio} min={4.5} label="Text on background" />
                  <Check ratio={accentRatio} min={3} label="Accent on background" />
                </ul>
              </div>
            </section>

            {/* Fonts */}
            <section aria-labelledby="fonts-title" className={cx(card, "in d2 flex flex-col gap-5 p-6")}>
              <h2 id="fonts-title" className={sectionTitle}>
                Fonts
              </h2>
              <div className="grid gap-5 md:grid-cols-2">
                {(
                  [
                    ["heading", "Headings"],
                    ["body", "Body text"],
                  ] as const
                ).map(([key, label]) => (
                  <Field key={key} id={`font-${key}`} label={label}>
                    <select
                      id={`font-${key}`}
                      value={kit[key]}
                      onChange={(e) => set(key, e.target.value)}
                      aria-describedby={describedBy(`font-${key}`)}
                      className={inputClass()}
                      style={{ fontFamily: fontStack(kit[key]) }}
                    >
                      {FONTS.map(([name, stack]) => (
                        <option key={name} style={{ fontFamily: stack }}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </Field>
                ))}
              </div>
            </section>

            {/* Voice */}
            <section aria-labelledby="voice-title" className={cx(card, "in d3 flex flex-col gap-5 p-6")}>
              <div>
                <h2 id="voice-title" className={sectionTitle}>
                  Voice
                </h2>
                <p className="text-muted">Mel writes slide text in this voice.</p>
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">Tone</legend>
                <div className="flex flex-wrap gap-2">
                  {["Friendly", "Formal", "Playful", "Bold"].map((tone) => {
                    const on = kit.tone === tone;
                    return (
                      <label
                        key={tone}
                        className={cx(
                          "flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 bg-surface px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink",
                          on ? "border-ink font-semibold" : "border-line-select font-medium",
                        )}
                      >
                        <input type="radio" name="tone" value={tone} checked={on} onChange={() => set("tone", tone)} className="sr-only" />
                        {on && <Icon name="check" size={14} stroke={2.6} />}
                        {tone}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <Field id="voice" label="Words to use or avoid" hint={`${kit.voice.length} of ${VOICE_MAX} characters`} optional>
                <textarea
                  id="voice"
                  rows={3}
                  maxLength={VOICE_MAX}
                  value={kit.voice}
                  onChange={(e) => set("voice", e.target.value)}
                  placeholder="Say “members”, not “customers”. Keep sentences short."
                  aria-describedby={describedBy("voice")}
                  className={cx(inputClass(), "py-3")}
                />
              </Field>
            </section>
          </div>

          {/* Live preview */}
          <aside aria-labelledby="preview-title" className="flex min-w-0 flex-[1_1_min(340px,100%)] flex-col gap-4 lg:sticky lg:top-6">
            <h2 id="preview-title" className={sectionTitle}>
              Preview
            </h2>
            <div className={cx(panel, "flex flex-col gap-3 p-4")}>
              <div
                className="flex aspect-video flex-col justify-between rounded-2xl p-[6%] motion-safe:transition-colors"
                style={{ background: kit.background, color: kit.text }}
              >
                <div className="flex items-center justify-between gap-2">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local preview
                    <img src={logo} alt="" className="max-h-7 max-w-[40%] object-contain" />
                  ) : (
                    <span className="text-[0.75rem] font-bold opacity-80" style={{ fontFamily: fontStack(kit.heading) }}>
                      {kit.name}
                    </span>
                  )}
                  <span className="h-2 w-10 rounded-full" style={{ background: kit.accent }} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="text-[clamp(1.125rem,3.2vw,1.5rem)] font-bold leading-[1.15]" style={{ fontFamily: fontStack(kit.heading) }}>
                    Quarterly update
                  </div>
                  <div className="text-[0.8125rem] leading-snug opacity-85" style={{ fontFamily: fontStack(kit.body) }}>
                    What we shipped, what we learned and what comes next.
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[0.9, 0.55, 0.75].map((h, i) => (
                  <div key={i} className="flex aspect-video items-end gap-1 rounded-xl p-2" style={{ background: kit.background }}>
                    {[h, h * 0.6, h * 0.8].map((b, j) => (
                      <span key={j} className="flex-1 rounded-sm" style={{ height: `${b * 100}%`, background: j === 0 ? kit.accent : kit.text, opacity: j === 0 ? 1 : 0.25 }} />
                    ))}
                  </div>
                ))}
              </div>
              <p className="text-[0.8125rem] text-muted">A cover and three chart slides, drawn with your kit.</p>
            </div>
            <div className={cx(card, "px-5 py-2")}>
              <Toggle
                id="apply-new"
                label="Use for new decks"
                hint="Turn off to start new decks from a plain theme."
                checked={kit.applyToNew}
                onChange={(v) => set("applyToNew", v)}
              />
            </div>
          </aside>
        </div>

        <SaveBar dirty={dirty} state={state} onSave={save} onDiscard={discard} label="Save brand kit" />
      </main>
    </div>
  );
}
