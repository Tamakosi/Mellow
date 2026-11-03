"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { MelFace } from "@/components/mel";
import { THEMES } from "@/components/themes";
import { Avatar, Icon, Logo, cx, panel, pill, type IconName } from "@/components/ui";
import { useDismiss } from "@/components/use-dismiss";

type PictureSide = "right" | "left" | "none";
type DeckColors = (typeof THEMES)[number]["deck"];

const LAYOUTS: { id: PictureSide; label: string }[] = [
  { id: "right", label: "Picture on the right" },
  { id: "left", label: "Picture on the left" },
  { id: "none", label: "Text only" },
];

const BLANK: Slide = {
  eyebrow: "New slide",
  title: "Add a title",
  bullets: ["Add your first point"],
  art: { sun: true, water: true },
  artLabel: "Sun over the sea",
  notes: "Add speaker notes for this slide.",
};

const subscribeToHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};

/** A toolbar button that opens a small menu below it. */
function ToolMenu({ icon, label, children }: { icon: IconName; label: string; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(wrapper, open, close, trigger);
  return (
    <div ref={wrapper} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
       
        onClick={() => setOpen(!open)}
        className={cx("flex min-h-11 items-center gap-2 rounded-full px-4 font-medium", open && "bg-accent-tint")}
      >
        <Icon name={icon} />
        {label}
      </button>
      {open && (
        <div role="group" aria-label={label} className="pop absolute left-0 top-12 z-30 flex w-60 flex-col gap-0.5 rounded-[20px] border border-line bg-surface p-2 shadow-pop">
          {children(close)}
        </div>
      )}
    </div>
  );
}

type Slide = { eyebrow: string; title: string; bullets: string[]; art: Art; artLabel: string; notes: string };
type Art = { sun?: boolean; cloud?: boolean; up?: boolean; rain?: boolean; water?: boolean };
type Message = { from: "user" | "mel"; text: string };

const SIMPLE = [
  "The sun warms water in oceans, lakes and rivers.",
  "Warm water turns into a gas called water vapor.",
  "The vapor rises up into the air.",
];
const ORIGINAL = [
  "Heat energy from the sun raises the temperature of surface water in oceans, lakes and rivers.",
  "As it warms, liquid water changes state and becomes an invisible gas known as water vapor.",
  "Because warm vapor is lighter than the surrounding air, it rises into the atmosphere.",
];
const QUIZ: Slide = {
  eyebrow: "Check your understanding",
  title: "Quick quiz",
  bullets: ["What makes water rise into the air?", "What is a cloud made of?", "Name two kinds of precipitation."],
  art: { sun: true, cloud: true },
  artLabel: "Sun and a cloud",
  notes: "Give pairs two minutes to answer, then share.",
};

const NOT_YET: [IconName, string][] = [
  ["text", "Text"],
  ["image", "Image"],
  ["chart", "Chart"],
];

function buildDeck(simplified: boolean, playful: boolean, quiz: boolean, added: number): Slide[] {
  const deck: Slide[] = [
    {
      eyebrow: "Science · Grade 5",
      title: "The Water Cycle",
      bullets: ["How water travels from the sea to the sky and back again."],
      art: { sun: true, cloud: true, water: true },
      artLabel: "Sun, a cloud and the sea",
      notes: "Start by asking who has seen rain today or this week.",
    },
    {
      eyebrow: "The big picture",
      title: "Where is Earth’s water?",
      bullets: [
        "Most of Earth’s water is salty ocean water.",
        "A small part is fresh water in ice, rivers and lakes.",
        "The same water keeps moving around the planet.",
      ],
      art: { sun: true, water: true },
      artLabel: "Sun over the sea",
      notes: "Hold up a full glass and a teaspoon to compare salt water with fresh water.",
    },
    {
      eyebrow: "Stage 1 of 4",
      title: playful ? "Up, up and away" : "Evaporation",
      bullets: simplified ? SIMPLE : ORIGINAL,
      art: { sun: true, cloud: true, up: true, water: true },
      artLabel: "Sun warming the sea while vapor rises toward a cloud",
      notes: "Ask the class: where does a puddle go on a sunny day? Let two or three students guess before revealing the answer.",
    },
    {
      eyebrow: "Stage 2 of 4",
      title: "Condensation",
      bullets: ["High in the sky the air is cold.", "Cold air turns water vapor back into tiny drops.", "Many tiny drops together make a cloud."],
      art: { cloud: true, up: true, water: true },
      artLabel: "Vapor rising into a cloud",
      notes: "Breathe on a cold window or mirror to show drops forming.",
    },
    {
      eyebrow: "Stage 3 of 4",
      title: "Precipitation",
      bullets: ["Drops in a cloud bump together and grow.", "When they get heavy, they fall.", "They fall as rain, snow or hail."],
      art: { cloud: true, rain: true, water: true },
      artLabel: "Rain falling from a cloud into the sea",
      notes: "Ask which kinds of precipitation the class has seen.",
    },
    {
      eyebrow: "Stage 4 of 4",
      title: "Collection",
      bullets: ["Rain flows into rivers, lakes and the sea.", "Some soaks into the ground.", "Then the sun warms it and the cycle starts again."],
      art: { sun: true, cloud: true, water: true },
      artLabel: "Sun, a cloud and the sea",
      notes: "Trace the full loop on the board with one finger.",
    },
  ];
  if (quiz) deck.push(QUIZ);
  for (let i = 0; i < added; i++) deck.push(BLANK);
  return deck;
}

function SlideArt({ art, label }: { art: Art; label?: string }) {
  const arrows = [90, 160, 230];
  return (
    <svg
      viewBox="0 0 320 300"
      preserveAspectRatio="xMidYMax slice"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className="block size-full"
    >
      {art.sun && <circle cx="238" cy="78" r="34" fill="#F1E2B0" />}
      {art.cloud && (
        <g fill="#FFFFFF">
          <ellipse cx="96" cy="76" rx="46" ry="19" />
          <ellipse cx="74" cy="64" rx="24" ry="18" />
          <ellipse cx="112" cy="58" rx="28" ry="22" />
        </g>
      )}
      {art.up && (
        <g fill="none" stroke="#3D5A49" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          {arrows.map((x) => (
            <g key={x}>
              <path d={`M${x} 208c-10-14 10-22 0-36s10-22 0-36`} />
              <path d={`M${x - 7} 146l7-10 8 9`} />
            </g>
          ))}
        </g>
      )}
      {art.rain && (
        <path
          d="M70 112l-8 22M96 116l-8 22M122 112l-8 22M82 156l-8 22M108 160l-8 22M134 156l-8 22"
          fill="none"
          stroke="#3D5A49"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
      {art.water && (
        <>
          <path d="M0 236c27-12 53-12 80 0s53 12 80 0 53-12 80 0 53 12 80 0v64H0z" fill="#BCD9C4" />
          <path d="M0 262c27-12 53-12 80 0s53 12 80 0 53-12 80 0 53 12 80 0v38H0z" fill="#8FAE97" />
        </>
      )}
    </svg>
  );
}

/** One slide at any size: text on the left, picture on the right. Sizes scale with the slide's width. */
function SlideView({
  slide,
  colors,
  side = "right",
  highlight = false,
  decorative = false,
  className,
}: {
  slide: Slide;
  colors: DeckColors;
  side?: PictureSide;
  highlight?: boolean;
  decorative?: boolean;
  className?: string;
}) {
  const picture = (
    <div className="m-[2.4cqw] overflow-hidden rounded-lg" style={{ background: colors.bg }}>
      <SlideArt art={slide.art} label={decorative ? undefined : slide.artLabel} />
    </div>
  );
  return (
    <div
      className={cx(
        "@container grid aspect-video w-full overflow-hidden",
        side === "none" ? "grid-cols-1" : side === "left" ? "grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]" : "grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]",
        className,
      )}
      style={{ background: colors.card, color: colors.ink }}
    >
      {side === "left" && picture}
      <div className={cx("flex flex-col justify-center gap-[2.2cqw] py-[6cqw] pl-[6cqw] pr-[4cqw]", side === "none" && "max-w-[80%]")}>
        <div className="text-[1.5cqw] font-semibold uppercase tracking-[0.08em] opacity-75">{slide.eyebrow}</div>
        <h2 className="text-[5.2cqw] font-semibold leading-[1.05] tracking-[-0.025em]">{slide.title}</h2>
        <div
          className={cx("relative -mx-[1.4cqw] rounded-[1.6cqw] p-[1.4cqw]", highlight && "outline-2 outline-accent")}
          style={highlight ? { background: "color-mix(in srgb, var(--color-accent) 18%, transparent)" } : undefined}
        >
          {highlight && (
            <span className="grow-in absolute -top-[1.5cqw] right-[1.4cqw] rounded-full bg-accent px-[1.1cqw] py-[0.3cqw] text-[1.25cqw] font-semibold">
              Simplified just now
            </span>
          )}
          <ul className="flex list-disc flex-col gap-[1.1cqw] pl-[2.4cqw] text-[2.05cqw] leading-[1.4]">
            {slide.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      </div>
      {side === "right" && picture}
    </div>
  );
}

export default function EditorPage() {
  const [current, setCurrent] = useState(2);
  const [simplified, setSimplified] = useState(true);
  const [playful, setPlayful] = useState(false);
  const [quiz, setQuiz] = useState(false);
  const [used, setUsed] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [freeTextTries, setFreeTextTries] = useState(0);
  const [presenting, setPresenting] = useState(false);
  // "/editor#present" (linked from the export screen) opens the presentation straight away.
  const hash = useSyncExternalStore(subscribeToHash, () => window.location.hash, () => "");
  const [hashDismissed, setHashDismissed] = useState(false);
  const showPresentation = presenting || (hash === "#present" && !hashDismissed);
  const stopPresenting = () => {
    setPresenting(false);
    setHashDismissed(true);
  };
  // Present mode is a native modal dialog: it takes focus, keeps Tab inside, closes on Escape
  // and hands focus back to the Present button.
  const presentDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = presentDialog.current;
    if (!dialog) return;
    if (showPresentation && !dialog.open) {
      dialog.showModal();
      // Start on Next, the button presenters press most.
      dialog.querySelector<HTMLButtonElement>("[data-autofocus]")?.focus();
    }
    if (!showPresentation && dialog.open) dialog.close();
  }, [showPresentation]);
  const [added, setAdded] = useState(0);
  const [themeIndex, setThemeIndex] = useState(0);
  const [side, setSide] = useState<PictureSide>("right");
  const [notice, setNotice] = useState("");

  const deck = buildDeck(simplified, playful, quiz, added);
  const colors = THEMES[themeIndex].deck;
  const addSlide = () => {
    setAdded(added + 1);
    setCurrent(deck.length);
  };
  const index = Math.min(current, deck.length - 1);
  const slide = deck[index];
  const go = (step: number) => setCurrent(Math.max(0, Math.min(deck.length - 1, index + step)));
  const say = (question: string, reply: string) =>
    setMessages((list) => [...list, { from: "user", text: question }, { from: "mel", text: reply }]);

  // Scripted suggestions. Each one changes the deck and adds a short exchange to the chat.
  const suggestions = [
    {
      label: "Add a quick quiz slide",
      run: () => {
        setQuiz(true);
        setCurrent(6);
        say("Add a quick quiz slide", "Added a quiz slide at the end with three questions from the deck.");
      },
    },
    {
      label: "Suggest a hands-on activity",
      run: () =>
        say(
          "Suggest a hands-on activity",
          "Try this: leave a shallow dish of water on a sunny windowsill and mark the water line each day. The class can watch it evaporate.",
        ),
    },
    {
      label: "Make the title more playful",
      run: () => {
        setPlayful(true);
        setCurrent(2);
        say("Make the title more playful", "Changed the title on slide 3 to “Up, up and away”.");
      },
    },
  ].filter((item) => !used.includes(item.label));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    // Each reply adds something new instead of repeating itself: first the limit, then the options by name, then a way out.
    const options = suggestions.map((item) => `“${item.label}”`).join(", ");
    const replies = [
      "In this prototype I can only make the suggested changes. Pick one under Try next.",
      options ? `I can’t do that one yet. I can do these: ${options}. Tap one under Try next.` : "I’ve made all the changes I know in this prototype. Try Undo changes to see the slide before.",
      "That’s outside what I can do here. Use Layout, Theme or Text above the slide to change it by hand.",
    ];
    say(text, replies[Math.min(freeTextTries, replies.length - 1)]);
    setFreeTextTries((n) => n + 1);
    setDraft("");
  };

  return (
    <div className="relative flex min-h-[880px] flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 max-sm:gap-y-2 max-sm:py-3 md:px-10">
        <div className="flex flex-wrap items-center gap-4">
          <Logo compact />
          <span aria-hidden="true" className="h-6 w-px bg-line-strong" />
          <div className="flex flex-col leading-[1.3]">
            <h1 className="text-base font-semibold">The Water Cycle</h1>
            <span className="text-[0.8125rem] text-muted">Science · Grade 5</span>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-[0.8125rem] font-semibold text-muted shadow-xs max-sm:px-2">
            <Icon name="check" size={12} stroke={3} />
            {/* On phones the tick alone shows the state; screen readers still hear "Saved". */}
            <span className="max-sm:sr-only">Saved</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/export" className={cx(pill, "press whitespace-nowrap px-[18px]")}>
            <Icon name="share" />
            {/* One text item, so the button's icon gap doesn't also open up between the two words. */}
            <span>
              Share<span className="max-sm:hidden"> or export</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setPresenting(true)}
            className="flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 font-semibold text-white"
          >
            <Icon name="play" size={14} stroke={2} filled />
            Present
          </button>
          <Avatar />
        </div>
      </header>

      <div className="flex flex-1 flex-wrap items-stretch gap-5 px-4 md:px-10 pb-8 pt-2">
        <aside aria-label="Slides" className="in flex min-w-0 flex-[1_1_min(176px,100%)] flex-col gap-2.5">
          <div className="flex items-center justify-between px-0.5 pb-0.5">
            <h2 className="font-semibold">Slides</h2>
            <span className="text-[0.8125rem] text-muted tabular-nums">{deck.length}</span>
          </div>
          <div className="flex flex-col gap-2.5 max-md:flex-row max-md:overflow-x-auto max-md:pb-2">
          {deck.map((item, i) => {
            const on = i === index;
            return (
              <button
                key={item.title + i}
                type="button"
                aria-label={`Slide ${i + 1}, ${item.title}`}
                aria-current={on}
                onClick={() => setCurrent(i)}
                className="flex items-start gap-2 text-left max-md:w-40 max-md:shrink-0"
              >
                <span className={cx("w-3.5 text-[0.8125rem] tabular-nums", on ? "font-bold" : "font-medium text-muted")}>{i + 1}</span>
                <span
                  className={cx(
                    "flex aspect-video min-w-0 flex-1 gap-1.5 rounded-xl border-2 p-2.5",
                    i === 0 ? "bg-sage-100" : "bg-surface",
                    on ? "border-ink" : i === 0 ? "border-sage-100" : "border-line-select",
                  )}
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[0.5625rem] font-bold leading-[1.2]">{item.title}</span>
                    <span className="h-[3px] w-[90%] rounded-sm bg-[#C9CEC6]" />
                    <span className="h-[3px] w-[70%] rounded-sm bg-[#C9CEC6]" />
                  </span>
                  <span className={cx("flex-1 rounded-md", i === 0 ? "bg-accent" : "bg-sage-100")} />
                </span>
              </button>
            );
          })}
          </div>
          <button
            type="button"
            onClick={addSlide}
            className="mt-1 flex min-h-11 items-center justify-center gap-2 rounded-full border border-dashed border-dash font-medium text-muted"
          >
            <Icon name="plus" size={16} stroke={2} />
            Add slide
          </button>
        </aside>

        <main className="in d1 flex min-w-0 flex-[999_1_min(560px,100%)] flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[26px] border border-line bg-surface p-1">
            <div className="flex flex-wrap gap-0.5">
              <ToolMenu icon="layout" label="Layout">
                {(close) =>
                  LAYOUTS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      
                      aria-pressed={side === item.id}
                      onClick={() => {
                        setSide(item.id);
                        close();
                      }}
                      className="flex min-h-11 items-center justify-between rounded-xl px-3 text-left font-medium hover:bg-ground"
                    >
                      {item.label}
                      {side === item.id && <Icon name="check" size={16} stroke={2.4} />}
                    </button>
                  ))
                }
              </ToolMenu>
              <ToolMenu icon="theme" label="Theme">
                {(close) =>
                  THEMES.map((item, i) => (
                    <button
                      key={item.id}
                      type="button"
                      
                      aria-pressed={themeIndex === i}
                      onClick={() => {
                        setThemeIndex(i);
                        close();
                      }}
                      className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-left font-medium hover:bg-ground"
                    >
                      <span className="size-5 rounded-full border-[4px]" style={{ background: item.swatch.inner, borderColor: item.swatch.outer }} />
                      {item.name}
                      {themeIndex === i && <Icon name="check" size={16} stroke={2.4} className="ml-auto" />}
                    </button>
                  ))
                }
              </ToolMenu>
              {NOT_YET.map(([icon, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setNotice(`${label} editing isn’t part of this prototype yet.`)}
                  className="flex min-h-11 items-center gap-2 rounded-full px-4 font-medium"
                >
                  <Icon name={icon} />
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-0.5">
              <button type="button" aria-label="Previous slide" onClick={() => go(-1)} className="flex size-11 items-center justify-center rounded-full">
                <Icon name="left" stroke={2} />
              </button>
              <span className="min-w-14 text-center text-sm text-muted tabular-nums">
                {index + 1} of {deck.length}
              </span>
              <button type="button" aria-label="Next slide" onClick={() => go(1)} className="flex size-11 items-center justify-center rounded-full">
                <Icon name="right" stroke={2} />
              </button>
            </div>
          </div>

          <p role="status" className={cx("-mt-2 px-2 text-[0.8125rem] text-muted", !notice && "sr-only")}>
            {notice}
          </p>

          <SlideView
            slide={slide}
            colors={colors}
            side={side}
            highlight={index === 2 && simplified}
            className="rounded-[28px] border border-line shadow-soft"
          />

          <div className="flex flex-col gap-1 rounded-[20px] border border-line bg-surface px-5 py-4">
            <div className="text-[0.8125rem] font-semibold text-muted">Speaker notes</div>
            <p>{slide.notes}</p>
          </div>
        </main>

        <aside aria-label="Mel, your assistant" className={cx(panel, "in d2 flex min-h-[520px] min-w-0 flex-[1_1_min(320px,100%)] flex-col gap-4 p-5")}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sage-50">
                <MelFace size={30} />
              </span>
              <h2 className="text-[1.0625rem] font-semibold">Mel</h2>
            </div>
            <span className="rounded-full bg-ground px-3 py-1 text-[0.8125rem] font-semibold text-muted tabular-nums">On slide {index + 1}</span>
          </div>

          <div className="max-w-[88%] self-end rounded-[20px_20px_6px_20px] bg-accent-tint px-4 py-2.5">
            Make this slide simpler for fifth graders.
          </div>

          <div className="flex flex-col gap-3">
            <p>Done. I cut the text on slide 3 down to three short points.</p>
            <div className="flex flex-col gap-2.5 rounded-[20px] bg-ground p-4">
              {simplified ? (
                <>
                  <div className="text-[0.8125rem] font-semibold text-muted">Applied to slide 3</div>
                  <div className="flex items-center gap-2.5">
                    <Icon name="text" size={16} />
                    Shortened body text
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSimplified(false);
                      setCurrent(2);
                    }}
                    className={pill}
                  >
                    Undo changes
                  </button>
                </>
              ) : (
                <>
                  <div>Change undone. Slide 3 has its original text again.</div>
                  <button
                    type="button"
                    onClick={() => {
                      setSimplified(true);
                      setCurrent(2);
                    }}
                    className={pill}
                  >
                    Simplify again
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Messages are typed by people (links, codes), so long words break instead of pushing past the panel. */}
          <div role="log" aria-label="Conversation" className="flex min-w-0 flex-col gap-3 [overflow-wrap:anywhere]">
            {messages.map((message, i) =>
              message.from === "user" ? (
                <div key={i} className="in max-w-[88%] self-end rounded-[20px_20px_6px_20px] bg-accent-tint px-4 py-2.5">
                  {message.text}
                </div>
              ) : (
                <p key={i} className="in reply">
                  {message.text}
                </p>
              ),
            )}
          </div>

          <div className="mt-auto flex flex-col gap-2">
            {suggestions.length > 0 && <div className="text-[0.8125rem] font-semibold text-muted">Try next</div>}
            {suggestions.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setUsed((list) => [...list, item.label]);
                  item.run();
                }}
                className={cx(pill, "justify-start text-left")}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 rounded-full border border-line-input bg-ground py-1.5 pl-[18px] pr-1.5 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ink">
            <label htmlFor="ask" className="sr-only">
              Ask Mel for a change
            </label>
            <input
              id="ask"
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Try: make the title shorter"
              enterKeyHint="send"
              className="min-h-11 min-w-0 flex-1 bg-transparent text-base focus-visible:outline-none"
            />
            <button type="submit" aria-label="Send" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent">
              <Icon name="up" stroke={2} />
            </button>
          </form>
        </aside>
      </div>

      <dialog
        ref={presentDialog}
        aria-label="Presenting"
        onClose={stopPresenting}
        onKeyDown={(event: KeyboardEvent<HTMLDialogElement>) => {
          // Arrow keys, Page keys and Space move between slides, like every presentation tool.
          if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key) && !(event.target instanceof HTMLButtonElement && event.key === " ")) {
            event.preventDefault();
            go(1);
          } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
            event.preventDefault();
            go(-1);
          }
        }}
        className="fade m-0 size-full max-h-none max-w-none bg-ink p-0 text-white backdrop:bg-ink"
      >
        {showPresentation && (
          <div className="flex size-full flex-col items-center justify-center gap-5 p-8">
            <SlideView slide={slide} colors={colors} side={side} decorative className="max-w-[1120px] rounded-[20px]" />
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={() => go(-1)} className="min-h-11 rounded-full bg-white px-[18px] font-semibold text-ink">
                Previous
              </button>
              <span aria-live="polite" className="min-w-16 text-center tabular-nums">
                {index + 1} of {deck.length}
              </span>
              <button type="button" data-autofocus onClick={() => go(1)} className="min-h-11 rounded-full bg-white px-[18px] font-semibold text-ink">
                Next
              </button>
              <button type="button" onClick={() => presentDialog.current?.close()} className="min-h-11 rounded-full border border-white px-[18px] font-semibold">
                Exit presentation
              </button>
            </div>
            <p className="text-sm text-white/80">Use the arrow keys to move between slides. Press Esc to exit.</p>
          </div>
        )}
      </dialog>
    </div>
  );
}
