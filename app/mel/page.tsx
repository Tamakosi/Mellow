import type { Metadata } from "next";
import Link from "next/link";
import { Mel, MelFace, type MelMood } from "@/components/mel";
import { MelDemo } from "@/components/mel-demo";
import { Icon, Logo, card, cx, eyebrow, panel, pill, primary } from "@/components/ui";

export const metadata: Metadata = { title: "Meet Mel · Mellow" };

const MOODS: [MelMood, string, string][] = [
  ["hello", "Hello", "Ready to help"],
  ["thinking", "Thinking", "Working on an answer"],
  ["found", "Found it", "Has an answer for you"],
  ["unsure", "Not sure", "Needs a little more detail"],
];

const HELPS: [string, string][] = [
  ["Explains", "How a screen works, what a setting does, what to try next."],
  ["Edits", "Changes the slide you are on when you ask in plain words."],
  ["Undoes", "Every change Mel makes can be taken back in one step."],
];

/** Mel's own page: try a conversation, then see how Mel looks and where Mel lives. */
export default function MelPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-10">
        <Logo href="/" />
        <Link href="/" className={cx(pill, "px-[18px]")}>
          <Icon name="left" stroke={2} />
          Back to home
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[1168px] flex-col gap-16 px-4 pb-16 pt-6 md:gap-20 md:px-6">
        <section aria-labelledby="mel-title" className={cx(panel, "flex flex-col gap-8 p-6 md:p-10")}>
          <div className="flex flex-col gap-3">
            <div className={eyebrow}>Your helper</div>
            <h1 id="mel-title" className="text-5xl font-semibold leading-[1.15] tracking-[-0.025em] max-md:text-[2.5rem]">
              Meet <span className="rounded-xl bg-accent px-2.5">Mel</span>
            </h1>
            <p className="max-w-[560px] text-[1.0625rem] text-muted">
              Not sure what to ask? Mel is one tap away on every screen. Pick a question to see how Mel answers.
            </p>
          </div>
          <MelDemo size={200} />
        </section>

        <section aria-labelledby="does-title" className="reveal flex flex-col gap-6">
          <h2 id="does-title" className="text-3xl font-semibold tracking-[-0.02em]">
            What Mel does
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
            {HELPS.map(([title, body]) => (
              <div key={title} className={cx(card, "flex flex-col gap-1.5 p-6")}>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="moods-title" className="reveal flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h2 id="moods-title" className="text-3xl font-semibold tracking-[-0.02em]">
              Moods
            </h2>
            <p className="text-muted">Mel’s face tells you what is happening, and the words next to it say the same thing.</p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
            {MOODS.map(([mood, name, hint]) => (
              <div key={mood} className={cx(card, "flex flex-col items-center gap-2.5 px-4 py-6 text-center")}>
                <Mel mood={mood} />
                <div>
                  <div className="font-semibold">{name}</div>
                  <div className="text-[0.8125rem] text-muted">{hint}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="lives-title" className="reveal flex flex-col gap-6">
          <h2 id="lives-title" className="text-3xl font-semibold tracking-[-0.02em]">
            Where Mel lives
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
            <div className={cx(card, "flex flex-col items-center gap-3 p-6 text-center")}>
              <span className={cx(pill, "pl-2")} aria-hidden="true">
                <MelFace />
                Ask Mel
              </span>
              <div className="text-muted">In the top bar of every screen</div>
            </div>
            <div className={cx(card, "flex flex-col items-center gap-3 p-6 text-center")}>
              <span className="flex size-[68px] items-center justify-center rounded-full border border-line bg-surface shadow-pop" aria-hidden="true">
                <MelFace size={46} />
              </span>
              <div className="text-muted">A floating button on phones</div>
            </div>
            <div className={cx(card, "flex flex-col items-center gap-3 p-6 text-center")}>
              <div className="flex items-end gap-2" aria-hidden="true">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-50">
                  <MelFace size={26} />
                </span>
                <span className="rounded-[20px_20px_20px_6px] bg-ground px-3.5 py-2 text-left">Here is a tip.</span>
              </div>
              <div className="text-muted">Next to Mel’s answers and tips</div>
            </div>
          </div>
        </section>

        <section className="reveal flex flex-col items-center gap-4 rounded-[28px] bg-accent-tint px-6 py-14 text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.02em]">Mel is waiting inside Mellow</h2>
          <p className="max-w-[480px] text-[1.0625rem]">Start a deck and tap Ask Mel whenever you get stuck.</p>
          <Link href="/signup" className={cx(primary, "mt-2")}>
            Try Mellow
            <Icon name="arrow" stroke={2} />
          </Link>
        </section>
      </main>
    </div>
  );
}
