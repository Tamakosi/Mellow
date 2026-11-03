"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AskMel } from "@/components/ask-mel";
import { Mel } from "@/components/mel";
import { THEMES } from "@/components/themes";
import { AppHeader, Avatar, Icon, Stepper, cx, eyebrow, panel, pill, primary, sectionTitle } from "@/components/ui";

type Phase = "write" | "visuals" | "polish" | "ready";
type DeckColors = (typeof THEMES)[number]["deck"];

const TOTAL = 10;
const TICK_MS = 1600;
const NAMES = ["Cover", "Why now", "Audience", "Voice and tone", "Color and type", "Logo directions", "Packaging", "Rollout plan", "Budget", "Next steps"];
const PARTIAL = ["A warmer wel", "Why n", "Who we ba", "Like a note fr", "Color and ty", "Logo direc", "Packaging that tr", "Rollout in thr", "Bud", "Next st"];
const STEP_LABELS = ["Read the brief", "Drafted the outline", "Writing slides", "Choosing visuals", "Polishing layout"];
const PHASES: Phase[] = ["write", "visuals", "polish", "ready"];

const MEL_QUESTIONS = [
  { q: "Can I edit while this runs?", a: "Yes. Any finished slide opens in the editor straight away. The rest keep being written." },
  { q: "What happens if I stop?", a: "The finished slides are kept and the queued ones are not written. You can run it again later." },
  { q: "Can I change the theme later?", a: "Any time. Pick another theme below or in the editor. Your text stays the same." },
];

const title = "text-[0.8125rem] font-bold leading-[1.15]";

/** The small picture of one finished slide, coloured by the chosen theme. */
function SlideThumb({ index, c }: { index: number; c: DeckColors }) {
  const bar = (w: string, bg = c.soft) => <span className="h-1 rounded-sm" style={{ width: w, background: bg }} />;
  switch (index) {
    case 0:
      return (
        <span className="-m-3.5 flex flex-1 flex-col justify-end gap-1 p-3.5" style={{ background: c.cover, color: c.coverInk }}>
          <span className="text-[0.9375rem] font-bold leading-[1.15]">A warmer welcome</span>
          <span className="text-[0.625rem]">Brand refresh proposal</span>
        </span>
      );
    case 1:
      return (
        <span className="flex flex-col gap-1.5">
          <span className={title}>Why now</span>
          <span className="mt-1 flex flex-col gap-1.5">
            {bar("86%")}
            {bar("72%")}
            {bar("80%")}
          </span>
        </span>
      );
    case 2:
      return (
        <>
          <span className={title}>Who we bake for</span>
          <span className="mt-auto flex gap-2">
            {[c.cover, c.mid, c.ink].map((bg) => (
              <span key={bg} className="size-[30px] rounded-full" style={{ background: bg }} />
            ))}
          </span>
        </>
      );
    case 3:
      return (
        <span className="flex flex-1 flex-col justify-center gap-1.5">
          <span className="text-base font-semibold leading-[1.2] tracking-[-0.01em]">Like a note from a neighbor.</span>
          {bar("34%", c.mid)}
        </span>
      );
    case 4:
      return (
        <>
          <span className={title}>Color and type</span>
          <span className="mt-auto flex gap-1.5">
            {["#EFD9A0", "#EBCDBB", "#FFFFFF", "#6B4F3A"].map((bg) => (
              <span key={bg} className="h-[34px] flex-1 rounded-lg" style={{ background: bg }} />
            ))}
          </span>
        </>
      );
    case 5:
      return (
        <>
          <span className={title}>Logo directions</span>
          <span className="mt-auto flex gap-1.5">
            {["ring", "square", "dome"].map((shape) => (
              <span key={shape} className="flex h-10 flex-1 items-center justify-center rounded-lg" style={{ background: c.card }}>
                {shape === "ring" && <span className="size-[18px] rounded-full border-2" style={{ borderColor: c.ink }} />}
                {shape === "square" && <span className="size-[18px] rounded-[5px]" style={{ background: c.ink }} />}
                {shape === "dome" && <span className="h-[11px] w-[22px] rounded-t-full" style={{ background: c.ink }} />}
              </span>
            ))}
          </span>
        </>
      );
    case 6:
      return (
        <>
          <span className={title}>Packaging that travels well</span>
          <span className="mt-auto flex items-end gap-2">
            <span className="h-11 w-[34px] rounded-[6px_6px_8px_8px]" style={{ background: c.cover }} />
            <span className="h-[30px] w-[52px] rounded-md" style={{ background: c.mid }} />
            <span className="size-[26px] rounded-full" style={{ background: c.card }} />
          </span>
        </>
      );
    case 7:
      return (
        <>
          <span className={title}>Rollout in three steps</span>
          <span className="mt-auto flex items-center pb-1.5">
            <span className="size-3.5 shrink-0 rounded-full" style={{ background: c.ink }} />
            <span className="h-[3px] flex-1" style={{ background: c.soft }} />
            <span className="size-3.5 shrink-0 rounded-full" style={{ background: c.mid }} />
            <span className="h-[3px] flex-1" style={{ background: c.soft }} />
            <span className="size-3.5 shrink-0 rounded-full" style={{ background: c.cover }} />
          </span>
        </>
      );
    case 8:
      return (
        <>
          <span className={title}>Budget</span>
          <span className="mt-auto flex items-end gap-2">
            <span className="h-[22px] flex-1 rounded-t-md" style={{ background: c.soft }} />
            <span className="h-10 flex-1 rounded-t-md" style={{ background: c.mid }} />
            <span className="h-[30px] flex-1 rounded-t-md" style={{ background: c.cover }} />
          </span>
        </>
      );
    default:
      return (
        <>
          <span className={title}>Next steps</span>
          <span className="mt-auto flex flex-col gap-1.5">
            {["62%", "48%", "56%"].map((w) => (
              <span key={w} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px]" style={{ background: c.mid }} />
                {bar(w)}
              </span>
            ))}
          </span>
        </>
      );
  }
}

export default function GeneratePage() {
  // The run starts part-way through so the screen shows all three slide states at once.
  const [done, setDone] = useState(6);
  const [phase, setPhase] = useState<Phase>("write");
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [themeIndex, setThemeIndex] = useState(0);

  const ended = stopped || phase === "ready";

  // Fake generation: one step per tick. Swap this for real progress events later.
  useEffect(() => {
    if (paused || ended) return;
    const timer = setTimeout(() => {
      if (phase === "write") {
        if (done + 1 >= TOTAL) {
          setDone(TOTAL);
          setPhase("visuals");
        } else {
          setDone(done + 1);
        }
      } else if (phase === "visuals") {
        setPhase("polish");
      } else {
        setPhase("ready");
      }
    }, TICK_MS);
    return () => clearTimeout(timer);
  }, [done, phase, paused, ended]);

  const theme = THEMES[themeIndex];
  const colors = theme.deck;
  const phaseIndex = PHASES.indexOf(phase);
  const writing = phase === "write" && !stopped;

  const head = stopped
    ? { kicker: "Stopped", a: "Stopped at", b: `${done} slides` }
    : phase === "ready"
      ? { kicker: "Done", a: "Your deck is", b: "ready" }
      : { kicker: paused ? "Paused" : "Generating", a: "Building your", b: "deck" };

  const status = stopped
    ? "Stopped"
    : paused
      ? "Paused"
      : phase === "write"
        ? `Writing slide ${done + 1}`
        : phase === "visuals"
          ? "Choosing visuals"
          : phase === "polish"
            ? "Polishing layout"
            : "All done";

  const note = stopped
    ? `The ${done} finished slides are kept. Run again to write the rest.`
    : phase === "ready"
      ? "All 10 slides are written. Open the editor to fine-tune them."
      : "Finished slides are already yours to edit. Stopping keeps them.";

  const restart = () => {
    setDone(0);
    setPhase("write");
    setPaused(false);
    setStopped(false);
  };

  const control = "flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface font-medium";

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader center={<Stepper current={2} />}>
        <AskMel intro="I am writing your slides. Pick a question while you wait." questions={MEL_QUESTIONS} />
        <Link href="/create" className={cx(pill, "px-[18px]")}>
          Run in background
        </Link>
        <Avatar />
      </AppHeader>

      <div className="flex flex-1 flex-wrap items-start gap-8 px-4 md:px-10 pb-10 pt-4">
        <aside aria-label="Progress" className={cx(panel, "in flex min-w-0 flex-[1_1_min(340px,100%)] flex-col gap-6 p-7")}>
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className={eyebrow}>{head.kicker}</div>
              <h1 className="text-[2rem] font-semibold leading-[1.2] tracking-[-0.025em]">
                {head.a} <span className="rounded-[10px] bg-accent px-2">{head.b}</span>
              </h1>
            </div>
            {phase === "ready" && !stopped && <Mel mood="found" size={64} className="grow-in shrink-0" />}
          </div>

          <div className="flex flex-col gap-2">
            <div
              role="progressbar"
              aria-label="Slides written"
              aria-valuemin={0}
              aria-valuemax={TOTAL}
              aria-valuenow={done}
              className="h-2.5 overflow-hidden rounded-full bg-line"
            >
              <div className="progress-fill h-full origin-left rounded-full bg-ink" style={{ transform: `scaleX(${done / TOTAL})` }} />
            </div>
            <div className="flex justify-between text-sm text-muted tabular-nums">
              <span>
                {done} of {TOTAL} slides ready
              </span>
              <span>{status}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 rounded-[20px] bg-ground p-4">
            <div className="text-[0.8125rem] font-semibold text-muted">Your brief</div>
            <p>
              A brand refresh proposal for a neighborhood bakery: warmer voice, updated colors, new packaging and a simple
              rollout plan.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["10 slides", "Friendly tone", `${theme.name} theme`].map((tag) => (
                <span key={tag} className="rounded-full border border-line-strong bg-surface px-3 py-1 text-[0.8125rem] font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <ol className="flex flex-col gap-3.5">
            {STEP_LABELS.map((label, i) => {
              const isDone = i < 2 || i - 2 < phaseIndex;
              const isOn = !isDone && i - 2 === phaseIndex && !stopped;
              return (
                <li key={label} className={cx("flex items-center gap-3", isOn ? "font-semibold" : "text-muted")}>
                  {isDone ? (
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-white">
                      <Icon name="check" size={12} stroke={3} />
                    </span>
                  ) : isOn ? (
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent">
                      <span className="size-2 rounded-full bg-ink" />
                    </span>
                  ) : (
                    <span className="size-6 shrink-0 rounded-full border-2 border-dash" />
                  )}
                  {label}
                </li>
              );
            })}
          </ol>

          <div className="flex flex-col gap-3">
            {ended ? (
              <div className="flex flex-wrap gap-2">
                <Link href="/editor" className={cx(primary, "flex-[1_1_min(150px,100%)] px-4 text-[0.9375rem]")}>
                  Open in editor
                  <Icon name="arrow" stroke={2} />
                </Link>
                <button type="button" onClick={restart} className={cx(control, "flex-[1_1_min(110px,100%)] px-4")}>
                  Run again
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                {paused ? (
                  <button
                    type="button"
                    onClick={() => setPaused(false)}
                    className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ink font-semibold text-white"
                  >
                    <Icon name="play" size={14} stroke={2} filled />
                    Resume
                  </button>
                ) : (
                  <button type="button" onClick={() => setPaused(true)} className={control}>
                    <Icon name="pause" size={16} stroke={2.4} />
                    Pause
                  </button>
                )}
                <button type="button" onClick={() => setStopped(true)} className={control}>
                  <Icon name="stop" size={16} stroke={2} />
                  Stop
                </button>
              </div>
            )}
            <p className="text-[0.8125rem] text-muted">{note}</p>
          </div>
        </aside>

        <main className="in d2 flex min-w-0 flex-[999_1_min(600px,100%)] flex-col gap-4">
          <div className="flex min-h-11 flex-wrap items-center justify-between gap-2">
            <h2 className={sectionTitle}>Bakery brand refresh</h2>
            <span className="text-sm text-muted">10 slides</span>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(200px,100%),1fr))] gap-4">
            {NAMES.map((name, i) => {
              const number = String(i + 1).padStart(2, "0");
              if (i < done) {
                return (
                  <Link
                    key={name}
                    href="/editor"
                    aria-label={`Open slide ${i + 1}, ${name}, in the editor`}
                    className="in lift flex flex-col gap-2.5 rounded-[22px] border-2 border-line-select bg-surface p-2.5"
                  >
                    <span className="flex aspect-video flex-col overflow-hidden rounded-xl p-3.5" style={{ background: colors.bg, color: colors.ink }}>
                      <SlideThumb index={i} c={colors} />
                    </span>
                    <span className="flex items-center gap-2 px-1 pb-0.5 font-semibold">
                      <span className="font-medium text-muted tabular-nums">{number}</span>
                      {name}
                    </span>
                  </Link>
                );
              }
              if (writing && i === done) {
                return (
                  <div key={name} aria-current="true" className="flex flex-col gap-2.5 rounded-[22px] border-2 border-ink bg-surface p-2.5 shadow-soft">
                    <span className="flex aspect-video flex-col gap-1.5 rounded-xl p-3.5" style={{ background: colors.bg, color: colors.ink }}>
                      <span className={cx(title, "flex items-center gap-[3px]")}>
                        {PARTIAL[i]}
                        <span className={cx("h-[15px] w-0.5", !paused && "caret")} style={{ background: colors.ink }} />
                      </span>
                      <span className={cx("mt-1 h-1 w-[64%] rounded-sm", !paused && "soft-pulse")} style={{ background: colors.soft }} />
                      <span className={cx("h-1 w-2/5 rounded-sm", !paused && "soft-pulse")} style={{ background: colors.soft }} />
                    </span>
                    <span className="flex items-center gap-2 px-1 pb-0.5 font-semibold">
                      <span className="font-medium text-muted tabular-nums">{number}</span>
                      {name}
                      <span className="ml-auto rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold">{paused ? "Paused" : "Writing…"}</span>
                    </span>
                  </div>
                );
              }
              return (
                <div key={name} className="flex flex-col gap-2.5 rounded-[22px] border-2 border-dashed border-dash p-2.5 text-muted">
                  <span className="flex aspect-video flex-col gap-1.5 rounded-xl bg-[#ECEFE9] p-3.5">
                    <span className="h-2 w-[46%] rounded bg-line-strong" />
                    <span className="mt-1 h-1 w-[78%] rounded-sm bg-line-strong" />
                    <span className="h-1 w-3/5 rounded-sm bg-line-strong" />
                  </span>
                  <span className="flex items-center gap-2 px-1 pb-0.5">
                    <span className="tabular-nums">{number}</span>
                    {name}
                    <span className="ml-auto text-xs">{stopped ? "Not written" : "Queued"}</span>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-line bg-surface px-5 py-3.5">
            <div className="flex flex-col">
              <span className="font-semibold">Pick a theme</span>
              <span className="text-[0.8125rem] text-muted">Swap any time. Your content stays put.</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={themeIndex === i}
                  onClick={() => setThemeIndex(i)}
                  className={cx(
                    "flex min-h-11 items-center gap-2 rounded-full border-2 bg-surface pl-2.5 pr-4",
                    themeIndex === i ? "border-ink font-semibold" : "border-line-select font-medium",
                  )}
                >
                  <span className="size-[22px] rounded-full border-[5px]" style={{ background: item.swatch.inner, borderColor: item.swatch.outer }} />
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
