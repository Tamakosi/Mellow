"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AppNav } from "@/components/app-nav";
import { AskMel } from "@/components/ask-mel";
import { THEMES, ThemeThumb, type ThemeId } from "@/components/themes";
import { AppHeader, Avatar, Icon, cx, eyebrow, pill, primary, sectionTitle, type IconName } from "@/components/ui";

const DEFAULT_PROMPT =
  "A 10-slide pitch for a neighborhood bike repair co-op: why it matters, how membership works, and what we need to open by spring.";

/* Each setting cycles through its options when clicked. Replace with real menus later. */
const SETTINGS: { icon: IconName; options: string[]; start: number }[] = [
  { icon: "slides", options: ["8 slides", "10 slides", "12 slides", "15 slides"], start: 1 },
  { icon: "users", options: ["For neighbors", "For investors", "For students", "For my team"], start: 0 },
  { icon: "smile", options: ["Friendly tone", "Formal tone", "Playful tone"], start: 0 },
  { icon: "lines", options: ["Brief text", "Medium text", "Detailed text"], start: 1 },
  { icon: "globe", options: ["English", "Bahasa Indonesia", "Español"], start: 0 },
];

const EXAMPLES = [
  ["Investor pitch", "A 12-slide investor pitch for a meal-kit startup: the problem, our solution, early traction, and what we are raising."],
  ["Grade 5 science lesson", "A 10-slide science lesson on the water cycle for grade 5, with a short quiz at the end."],
  ["Monthly team update", "A monthly team update: what shipped, what slipped, what is next, and where we need help."],
  ["Workshop agenda", "A 90-minute workshop on giving useful feedback, with two exercises and a wrap-up."],
  ["Book report", "A book report on a novel I just finished: plot, main characters, themes, and my opinion."],
];

type StartKind = "outline" | "document" | "web";

const START_TILES: { icon: IconName; title: string; hint: string; kind: StartKind | "blank" }[] = [
  { icon: "list", title: "Paste an outline", hint: "Bullets or meeting notes", kind: "outline" },
  { icon: "file", title: "Import a document", hint: "PDF, Word or text file", kind: "document" },
  { icon: "link", title: "Use a web page", hint: "Paste a link to an article", kind: "web" },
  { icon: "plus", title: "Start blank", hint: "Build the deck by hand", kind: "blank" },
];

const START_COPY: Record<StartKind, { title: string; label: string; hint: string; error: string }> = {
  outline: {
    title: "Paste an outline",
    label: "Your outline or notes",
    hint: "One line per section works best. Bullets are fine.",
    error: "Paste at least one line to build an outline from.",
  },
  document: {
    title: "Import a document",
    label: "Choose a file",
    hint: "PDF, Word or plain text, up to 10 MB.",
    error: "Choose a file to import.",
  },
  web: {
    title: "Use a web page",
    label: "Page address",
    hint: "For example https://example.com/article",
    error: "Enter a full address that starts with https://",
  },
};

/** Modal for the three "start from something you have" options. Uses the native dialog element. */
function StartDialog({ kind, onClose }: { kind: StartKind | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (kind && !dialog.open) dialog.showModal();
    if (!kind && dialog.open) dialog.close();
  }, [kind]);

  if (!kind) return <dialog ref={ref} />;
  const copy = START_COPY[kind];
  const valid = kind === "web" ? /^https?:\/\/\S+\.\S+/.test(value.trim()) : value.trim().length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid) {
      setError(true);
      return;
    }
    router.push("/outline");
  };

  const field = "w-full rounded-2xl border bg-surface px-4 py-3 text-base";

  return (
    <dialog
      ref={ref}
      onClose={() => {
        setValue("");
        setError(false);
        onClose();
      }}
      aria-labelledby="start-title"
      className="pop m-auto w-[min(520px,calc(100vw-32px))] rounded-[28px] border border-line bg-surface p-0 text-ink shadow-pop backdrop:bg-ink/30"
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id="start-title" className="text-xl font-semibold tracking-[-0.015em]">
            {copy.title}
          </h2>
          <button type="button" aria-label="Close" onClick={() => ref.current?.close()} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line-strong">
            <Icon name="close" stroke={2} />
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="start-input" className="text-[0.8125rem] font-semibold text-muted">
            {copy.label}
          </label>
          {kind === "outline" && (
            <textarea
              id="start-input"
              rows={6}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-invalid={error && !valid}
              aria-describedby="start-hint start-error"
              className={cx(field, "resize-y", error && !valid ? "border-danger" : "border-line-input")}
            />
          )}
          {kind === "document" && (
            <input
              id="start-input"
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={(e) => setValue(e.target.files?.[0]?.name ?? "")}
              aria-invalid={error && !valid}
              aria-describedby="start-hint start-error"
              className={cx(field, "file:mr-3 file:rounded-full file:border-0 file:bg-accent-tint file:px-4 file:py-2 file:font-medium", error && !valid ? "border-danger" : "border-line-input")}
            />
          )}
          {kind === "web" && (
            <input
              id="start-input"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://example.com/article"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-invalid={error && !valid}
              aria-describedby="start-hint start-error"
              className={cx(field, error && !valid ? "border-danger" : "border-line-input")}
            />
          )}
          <p id="start-hint" className="text-[0.8125rem] text-muted">
            {copy.hint}
          </p>
          <p id="start-error" role="status" className="text-[0.8125rem] font-semibold text-danger">
            {error && !valid ? copy.error : ""}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => ref.current?.close()} className={pill}>
            Cancel
          </button>
          <button type="submit" className={primary}>
            Draft outline
            <Icon name="arrow" stroke={2} />
          </button>
        </div>
      </form>
    </dialog>
  );
}

const MEL_QUESTIONS = [
  {
    q: "What can I make here?",
    a: "Any deck you can describe: a pitch, a lesson, a team update or a workshop. Write one or two sentences and I draft an outline first.",
  },
  {
    q: "How do I write a good prompt?",
    a: "Say who it is for, what you want them to do, and how long it should be. For example: a 10-slide pitch for neighbors, asking them to join.",
  },
  {
    q: "Can I start from my own file?",
    a: "Yes. Use Import a document for a PDF, Word or text file, or Paste an outline for your notes.",
  },
];

const recentCard = "lift flex flex-col gap-2.5 rounded-[22px] border border-line bg-surface p-2.5";
const recentMeta = "flex items-center gap-1.5 text-[0.8125rem] text-muted tabular-nums";

export default function PromptHomePage() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [settings, setSettings] = useState(SETTINGS.map((s) => s.start));
  const [theme, setTheme] = useState<ThemeId>("meadow");
  const [starting, setStarting] = useState<StartKind | null>(null);
  const [promptError, setPromptError] = useState(false);
  const router = useRouter();

  const draftOutline = (event: FormEvent) => {
    event.preventDefault();
    if (prompt.trim().length < 3) {
      setPromptError(true);
      document.getElementById("prompt")?.focus();
      return;
    }
    router.push("/outline");
  };

  const cycle = (i: number) =>
    setSettings((current) => current.map((value, k) => (k === i ? (value + 1) % SETTINGS[i].options.length : value)));

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        logoHref="/"
        center={<AppNav current="Create" />}
      >
        <AskMel intro="Not sure where to start? Pick a question." questions={MEL_QUESTIONS} />
        <Avatar />
      </AppHeader>

      <main className="mx-auto flex w-full max-w-[1088px] flex-col gap-10 px-6 pb-14 pt-12">
        <section className="flex flex-col items-center gap-3 text-center">
          <div className={eyebrow}>New deck</div>
          <h1 className="text-5xl font-semibold leading-[1.15] tracking-[-0.025em] max-md:text-4xl">
            What are we <span className="rounded-xl bg-accent px-2.5">presenting</span> today?
          </h1>
          <p className="max-w-[560px] text-[1.0625rem] text-muted">
            Describe the idea in a sentence or two. You review an outline first, then Mellow designs the slides.
          </p>
        </section>

        <div className="in d1 flex flex-col gap-3.5">
          <form
            onSubmit={draftOutline}
            noValidate
            className={cx(
              "flex flex-col gap-4 rounded-[28px] border bg-surface p-6 shadow-soft has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-ink",
              promptError ? "border-danger" : "border-line-input",
            )}
          >
            <label htmlFor="prompt" className="text-[0.8125rem] font-semibold text-muted">
              Describe your deck
            </label>
            <textarea
              id="prompt"
              rows={3}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                if (promptError && e.target.value.trim().length >= 3) setPromptError(false);
              }}
              aria-invalid={promptError}
              aria-describedby="prompt-error"
              placeholder="For example: a 10-slide pitch for a neighborhood bike repair co-op"
              className="min-h-[88px] w-full resize-none bg-transparent text-[1.1875rem] focus-visible:outline-none"
            />
            <p id="prompt-error" role="status" className={cx("text-[0.8125rem] font-semibold text-danger", !promptError && "hidden")}>
              Describe your deck in a sentence so Mellow knows what to draft.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider pt-4">
              <div role="group" aria-label="Deck settings" className="flex flex-wrap gap-2">
                {SETTINGS.map((setting, i) => (
                  <button key={setting.icon} type="button" onClick={() => cycle(i)} className={cx(pill, "px-3.5")}>
                    <Icon name={setting.icon} />
                    {setting.options[settings[i]]}
                    <Icon name="chevron" size={14} stroke={2} />
                  </button>
                ))}
              </div>
              <button type="submit" className={primary}>
                Draft outline
                <Icon name="arrow" stroke={2} />
              </button>
            </div>
          </form>

          <div role="group" aria-label="Example prompts" className="flex flex-wrap items-center gap-2 px-2">
            <span className="pr-1 text-[0.8125rem] font-semibold text-muted">Try an example</span>
            {EXAMPLES.map(([label, text]) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setPrompt(text);
                  setPromptError(false);
                }}
                className="min-h-11 rounded-full border border-line-strong px-3.5 text-sm font-medium"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <section className="in d2 flex flex-col gap-3.5">
          <h2 className={sectionTitle}>Or start from something you have</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-4">
            {START_TILES.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => (item.kind === "blank" ? router.push("/editor") : setStarting(item.kind))}
                className="lift flex min-h-20 items-center gap-3.5 rounded-[20px] border border-line bg-surface p-4 text-left"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-accent-tint">
                  <Icon name={item.icon} size={20} />
                </span>
                <span className="flex flex-col">
                  <span className="font-semibold">{item.title}</span>
                  <span className="text-[0.8125rem] text-muted">{item.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section id="recent" className="in d3 flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className={sectionTitle}>Pick up where you left off</h2>
            <a href="#" className="flex min-h-11 items-center text-sm font-semibold text-green-deep">
              View all decks
            </a>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-4">
            <Link href="/generate" className={recentCard}>
              <span className="flex aspect-video flex-col justify-end gap-1 rounded-xl bg-accent p-3.5">
                <span className="text-[0.9375rem] font-bold leading-[1.15]">A warmer welcome</span>
                <span className="text-[0.625rem]">Brand refresh proposal</span>
              </span>
              <span className="flex flex-col gap-1.5 px-1 pb-1">
                <span className="font-semibold">Bakery brand refresh</span>
                <span className={recentMeta}>
                  <span className="flex size-4 items-center justify-center rounded-full bg-accent">
                    <span className="size-1.5 rounded-full bg-ink" />
                  </span>
                  Writing slide 7 of 10
                </span>
              </span>
            </Link>

            <Link href="/outline" className={recentCard}>
              <span className="flex aspect-video flex-col gap-[7px] rounded-xl border border-line-select bg-[#FAFAF8] p-3.5">
                <span className="h-1.5 w-[54%] rounded-[3px] bg-ink" />
                {["58%", "44%", "66%", "50%"].map((w, i) => (
                  <span key={w} className={cx("flex items-center gap-1.5", i === 0 && "mt-1")}>
                    <span className="size-3 rounded bg-sage-100" />
                    <span className="h-1 rounded-sm bg-[#C9CEC6]" style={{ width: w }} />
                  </span>
                ))}
              </span>
              <span className="flex flex-col gap-1.5 px-1 pb-1">
                <span className="font-semibold">Remote Team Onboarding Guide</span>
                <span className={recentMeta}>
                  <Icon name="list" size={16} />
                  Outline waiting for review
                </span>
              </span>
            </Link>

            <Link href="/editor" className={recentCard}>
              <span className="flex aspect-video flex-col justify-end gap-1.5 rounded-xl bg-sage-100 p-3.5">
                <span className="text-[0.9375rem] font-bold leading-[1.15]">The Water Cycle</span>
                <span className="h-1 w-2/5 rounded-sm bg-accent-deep" />
              </span>
              <span className="flex flex-col gap-1.5 px-1 pb-1">
                <span className="font-semibold">The Water Cycle</span>
                <span className={recentMeta}>
                  <Icon name="check" size={16} stroke={2} />
                  Ready, 6 slides
                </span>
              </span>
            </Link>

            <a href="#" className={recentCard}>
              <span className="flex aspect-video items-stretch gap-2.5 rounded-xl bg-[#DDE6EE] p-3.5">
                <span className="flex flex-1 flex-col justify-center gap-1.5">
                  <span className="text-[0.8125rem] font-bold leading-[1.15] text-[#1E2B38]">Giving useful feedback</span>
                  <span className="h-1 w-3/5 rounded-sm bg-[#8FA6BA]" />
                </span>
                <span className="flex-1 rounded-lg bg-[#B9CADA]" />
              </span>
              <span className="flex flex-col gap-1.5 px-1 pb-1">
                <span className="font-semibold">Feedback workshop</span>
                <span className={recentMeta}>
                  <Icon name="check" size={16} stroke={2} />
                  Ready, 14 slides
                </span>
              </span>
            </a>
          </div>
        </section>

        <section id="themes" className="in d4 flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className={sectionTitle}>
              Pick a theme <span className="text-[0.9375rem] font-normal tracking-normal text-muted">(optional, you can change it any time)</span>
            </h2>
            <a href="#" className="flex min-h-11 items-center text-sm font-semibold text-green-deep">
              Browse all themes
            </a>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-4">
            {THEMES.map((item) => {
              const on = item.id === theme;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTheme(item.id)}
                  className={cx(
                    "lift relative flex flex-col gap-2.5 rounded-[22px] border-2 bg-surface p-2.5 text-left",
                    on ? "border-ink" : "border-line-select",
                  )}
                >
                  {on && (
                    <span className="grow-in absolute right-[18px] top-[18px] flex size-[22px] items-center justify-center rounded-full bg-ink text-white ring-2 ring-white">
                      <Icon name="check" size={13} stroke={3} />
                    </span>
                  )}
                  <ThemeThumb id={item.id} />
                  <span className="flex flex-col px-1 pb-0.5">
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-[0.8125rem] text-muted">{item.blurb}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </main>
      <StartDialog kind={starting} onClose={() => setStarting(null)} />
    </div>
  );
}
