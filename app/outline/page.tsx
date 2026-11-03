"use client";

import Link from "next/link";
import { useState } from "react";
import { AskMel } from "@/components/ask-mel";
import { AppHeader, Icon, Stepper, cx, eyebrow, panel, pill, primary } from "@/components/ui";

type Section = { id: number; title: string; points: string[]; more: string; alt: string; expanded?: boolean };

const INITIAL: Section[] = [
  { id: 1, title: "Welcome", points: ["Who we are", "How this guide works"], more: "What to expect in your first month", alt: "Welcome to the team" },
  { id: 2, title: "Your first week", points: ["A day-by-day plan", "People to meet"], more: "Your first small task", alt: "What your first week looks like" },
  { id: 3, title: "Tools and access", points: ["Accounts to set up", "Where files and conversations live"], more: "Who fixes access problems", alt: "Getting set up" },
  { id: 4, title: "How we communicate", points: ["Written first", "When a meeting is the better choice"], more: "Expected reply times", alt: "How we talk to each other" },
  { id: 5, title: "Working hours and time zones", points: ["Overlap hours", "Calendar etiquette"], more: "Booking time off", alt: "When we work" },
  { id: 6, title: "Getting help", points: ["Your onboarding buddy", "Who to ask for what"], more: "Where to ask in public", alt: "Where to get help" },
  { id: 7, title: "Feedback and growth", points: ["Your first check-in", "How feedback works"], more: "Setting first goals", alt: "How you will grow here" },
  { id: 8, title: "Useful links", points: ["Team handbook", "Benefits", "Key contacts"], more: "Glossary of team terms", alt: "Where to find things" },
];

const LAYOUTS = ["Two columns", "Checklist", "Big statement"];
const FONTS = [
  { label: "Rounded sans", title: "var(--font-figtree), system-ui, sans-serif", body: "var(--font-figtree), system-ui, sans-serif" },
  { label: "Serif headlines", title: "Georgia, 'Times New Roman', serif", body: "var(--font-figtree), system-ui, sans-serif" },
  { label: "Mono details", title: "var(--font-figtree), system-ui, sans-serif", body: "ui-monospace, Menlo, Consolas, monospace" },
];
const PALETTES = [
  { name: "Meadow", swatch: "#BCD9C4", bg: "#DCE9DD", ink: "#1F2A24", card: "#FFFFFF" },
  { name: "Harbor", swatch: "#BFD4EA", bg: "#DDE6EE", ink: "#1E2B38", card: "#FFFFFF" },
  { name: "Petal", swatch: "#EBCDBB", bg: "#F3DEDC", ink: "#3A2528", card: "#FFFFFF" },
  { name: "Lilac", swatch: "#D7CBEE", bg: "#E9E2F5", ink: "#2A2338", card: "#FFFFFF" },
  { name: "Night", swatch: "#252B2F", bg: "#252B2F", ink: "#F1F3F2", card: "#3A4349" },
];

const MEL_QUESTIONS = [
  { q: "What is the outline for?", a: "It is the plan for your deck: one line per section. Fixing the order here is faster than redoing slides later." },
  { q: "How many sections should I have?", a: "Aim for one idea per section. Most decks work with 5 to 8. If a section holds two ideas, use Split in two." },
  { q: "What happens when I choose Design slides?", a: "I write and lay out each slide from this outline. You can watch, pause, and edit finished slides while the rest are written." },
];

const action = cx(pill, "whitespace-nowrap px-4");

export default function OutlinePage() {
  const [sections, setSections] = useState(INITIAL);
  const [selected, setSelected] = useState(3);
  const [nextId, setNextId] = useState(9);
  const [showAll, setShowAll] = useState(false);
  const [previous, setPrevious] = useState<{ sections: Section[]; selected: number } | null>(null);
  const [layout, setLayout] = useState(0);
  const [font, setFont] = useState(0);
  const [palette, setPalette] = useState(0);

  /** Apply an outline change and remember the state before it, so it can be undone. */
  const change = (next: Section[], select = selected) => {
    setPrevious({ sections, selected });
    setSections(next);
    setSelected(select);
  };
  const replaceAt = (i: number, section: Section) => sections.map((s, k) => (k === i ? section : s));

  const selectedIndex = sections.findIndex((s) => s.id === selected);
  const visible = showAll || selectedIndex >= 6 ? sections : sections.slice(0, 6);
  const current = sections[selectedIndex] ?? sections[0];
  const pal = PALETTES[palette];

  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...sections];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    change(next, sections[i].id);
  };
  const expand = (i: number) => {
    const s = sections[i];
    if (s.expanded || !s.more) return;
    change(replaceAt(i, { ...s, points: [...s.points, s.more], expanded: true }));
  };
  const shorten = (i: number) => {
    const s = sections[i];
    if (s.points.length < 2) return;
    change(replaceAt(i, { ...s, points: s.points.slice(0, 1), expanded: false }));
  };
  const split = (i: number) => {
    const s = sections[i];
    if (s.points.length < 2) return;
    const rest = s.points.slice(2);
    const fresh: Section = { id: nextId, title: s.points[1], points: rest.length ? rest : ["Details to fill in"], more: "", alt: s.points[1] };
    setNextId(nextId + 1);
    setShowAll(true);
    change([...sections.slice(0, i), { ...s, points: s.points.slice(0, 1), expanded: false }, fresh, ...sections.slice(i + 1)]);
  };
  const rewrite = (i: number) => change(replaceAt(i, { ...sections[i], title: sections[i].alt, alt: sections[i].title }));
  const remove = (i: number) => {
    if (sections.length < 2) return;
    const next = sections.filter((_, k) => k !== i);
    change(next, next[Math.min(i, next.length - 1)].id);
  };
  const add = () => {
    const fresh: Section = { id: nextId, title: "New section", points: ["Describe what this section covers"], more: "One more point to make", alt: "Untitled section" };
    setNextId(nextId + 1);
    setShowAll(true);
    change([...sections, fresh], fresh.id);
  };
  const undo = () => {
    if (!previous) return;
    setSections(previous.sections);
    setSelected(previous.selected);
    setPrevious(null);
  };

  const upButton = (i: number) => (
    <button
      type="button"
      aria-label={`Move section ${i + 1} up`}
      aria-disabled={i === 0}
      onClick={() => moveUp(i)}
      className={cx("flex size-11 shrink-0 items-center justify-center rounded-full text-muted", i === 0 && "opacity-35")}
    >
      <Icon name="up" stroke={2} />
    </button>
  );

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader center={<Stepper current={1} />}>
        <AskMel intro="Checking the outline? Pick a question." questions={MEL_QUESTIONS} />
        <Link href="/create" className={cx(pill, "px-[18px]")}>
          Back
        </Link>
        <Link href="/generate" className={cx(primary, "min-h-11 px-5 text-[0.9375rem]")}>
          Design slides
          <Icon name="arrow" stroke={2} />
        </Link>
      </AppHeader>

      <div className="flex flex-1 flex-wrap items-start gap-10 px-4 md:px-10 pb-12 pt-8">
        <main className="in flex min-w-0 flex-[999_1_min(480px,100%)] flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            <div className={eyebrow}>Review the outline</div>
            <h1 className="text-[2.75rem] font-semibold leading-[1.15] tracking-[-0.025em] max-md:text-3xl">Remote Team Onboarding Guide</h1>
            <p className="text-[1.0625rem] text-muted tabular-nums">
              {sections.length} sections · Friendly, practical tone · Written for new hires
            </p>
          </div>

          <ol className="flex flex-col gap-3">
            {visible.map((section, i) =>
              section.id === selected ? (
                <li
                  key={section.id}
                  aria-current="true"
                  className="flex items-start gap-3.5 rounded-[20px] border-2 border-ink bg-surface p-[15px] shadow-soft"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-accent font-bold">{i + 1}</span>
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div>
                      <div className="font-semibold">{section.title}</div>
                      <div className="text-[0.8125rem] text-muted">{section.points.join(" · ")}</div>
                    </div>
                    <div className="fade flex flex-wrap gap-2 max-sm:-ml-[58px]">
                      <button type="button" onClick={() => expand(i)} className={action}>Expand</button>
                      <button type="button" onClick={() => shorten(i)} className={action}>Shorten</button>
                      <button type="button" onClick={() => split(i)} className={action}>Split in two</button>
                      <button type="button" onClick={() => rewrite(i)} className={action}>Rewrite title</button>
                      <button type="button" onClick={() => remove(i)} className={action}>Remove section</button>
                    </div>
                  </div>
                  {upButton(i)}
                </li>
              ) : (
                <li key={section.id} className="flex items-center gap-2 rounded-[20px] border border-line bg-surface p-4">
                  <button
                    type="button"
                    onClick={() => setSelected(section.id)}
                    className="still flex min-h-11 min-w-0 flex-1 items-center gap-3.5 text-left"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-accent-tint font-semibold">{i + 1}</span>
                    <span className="flex min-w-0 flex-col">
                      <span className="font-semibold">{section.title}</span>
                      <span className="text-[0.8125rem] text-muted">{section.points.join(" · ")}</span>
                    </span>
                  </button>
                  {upButton(i)}
                </li>
              ),
            )}
          </ol>

          <div className="flex flex-wrap items-center gap-2">
            {visible.length < sections.length && (
              <button type="button" onClick={() => setShowAll(true)} className="min-h-11 px-3 text-sm font-semibold text-green-deep">
                Show {sections.length - 6} more sections
              </button>
            )}
            <button
              type="button"
              onClick={add}
              className="flex min-h-11 items-center gap-2 rounded-full border border-dashed border-dash px-4 font-medium text-muted"
            >
              <Icon name="plus" size={16} stroke={2} />
              Add a section
            </button>
            {previous && (
              <button type="button" onClick={undo} className={action}>
                Undo last change
              </button>
            )}
          </div>
        </main>

        <aside aria-label="Live preview" className={cx(panel, "in d2 flex min-w-0 flex-[1_1_min(500px,100%)] flex-col gap-6 p-6")}>
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Live preview</h2>
              <span className="text-[0.8125rem] text-muted">
                Section {selectedIndex + 1} · {LAYOUTS[layout]}
              </span>
            </div>
            <div
              className="@container flex aspect-video w-full flex-col gap-[4cqw] overflow-hidden rounded-2xl p-[6cqw]"
              style={{ background: pal.bg, color: pal.ink }}
            >
              {layout === 2 ? (
                <div className="flex flex-1 flex-col justify-center gap-[3cqw]">
                  <div className="text-[10cqw] font-semibold leading-none tracking-[-0.03em]" style={{ fontFamily: FONTS[font].title }}>
                    {current.title}
                  </div>
                  <div className="text-[3.6cqw] leading-[1.3]" style={{ fontFamily: FONTS[font].body }}>
                    {current.points[0]}
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-[7cqw] font-semibold leading-[1.05] tracking-[-0.025em]" style={{ fontFamily: FONTS[font].title }}>
                    {current.title}
                  </div>
                  {layout === 0 ? (
                    <div className="grid grid-cols-2 gap-[3cqw] text-[3cqw] leading-[1.35]" style={{ fontFamily: FONTS[font].body }}>
                      {current.points.map((point) => (
                        <div key={point} className="rounded-[3cqw] p-[3cqw] font-semibold" style={{ background: pal.card }}>
                          {point}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-[2.4cqw] text-[3.4cqw] leading-[1.3]" style={{ fontFamily: FONTS[font].body }}>
                      {current.points.map((point) => (
                        <div key={point} className="flex items-center gap-[2.4cqw]">
                          <span className="size-[4.4cqw] shrink-0 rounded-[1.2cqw]" style={{ background: pal.card }} />
                          {point}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <h3 className="font-semibold">Layout for this section</h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(96px,100%),1fr))] gap-3">
              {LAYOUTS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={layout === i}
                  onClick={() => setLayout(i)}
                  className={cx("flex min-w-0 flex-col gap-2 rounded-[20px] border-2 bg-surface p-2 text-left", layout === i ? "border-ink" : "border-line-select")}
                >
                  <span className={cx("flex aspect-video flex-col rounded-xl bg-sage-100 p-2.5", i === 2 ? "justify-center gap-1.5" : "gap-1.5")}>
                    {i === 0 && (
                      <>
                        <span className="h-[5px] w-1/2 rounded-[3px] bg-ink" />
                        <span className="flex flex-1 gap-1.5">
                          <span className="flex-1 rounded-[5px] bg-surface" />
                          <span className="flex-1 rounded-[5px] bg-surface" />
                        </span>
                      </>
                    )}
                    {i === 1 && (
                      <>
                        <span className="h-[5px] w-1/2 rounded-[3px] bg-ink" />
                        {["80%", "70%", "76%"].map((w) => (
                          <span key={w} className="h-[5px] rounded-[3px] bg-accent-deep" style={{ width: w }} />
                        ))}
                      </>
                    )}
                    {i === 2 && (
                      <>
                        <span className="h-2 w-[86%] rounded bg-ink" />
                        <span className="h-2 w-3/5 rounded bg-ink" />
                      </>
                    )}
                  </span>
                  <span className="px-1 pb-0.5 text-[0.8125rem] font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <h3 className="font-semibold">Deck style</h3>
            <div className="flex flex-wrap gap-2">
              {FONTS.map((item, i) => (
                <button
                  key={item.label}
                  type="button"
                  aria-pressed={font === i}
                  onClick={() => setFont(i)}
                  className={cx(
                    "min-h-11 rounded-full bg-surface px-4",
                    font === i ? "border-2 border-ink font-semibold" : "border border-line-strong font-medium",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {PALETTES.map((item, i) => (
                <button
                  key={item.name}
                  type="button"
                  aria-label={`${item.name} palette`}
                  aria-pressed={palette === i}
                  onClick={() => setPalette(i)}
                  className="flex size-11 items-center justify-center rounded-full"
                >
                  <span
                    className={cx("size-[30px] rounded-full", palette === i && "ring-2 ring-ink ring-offset-2")}
                    style={{ background: item.swatch }}
                  />
                </button>
              ))}
              <span className="pl-2 text-[0.8125rem] text-muted">{pal.name}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
