"use client";

import { useEffect, useRef, useState } from "react";
import { Mel, type MelMood } from "./mel";
import { cx } from "./ui";

const QUESTIONS = [
  {
    q: "What can Mellow make?",
    a: "Any deck you can describe in a sentence: a pitch, a lesson, a team update or a workshop. I draft an outline first so you can fix the story before any slide exists.",
  },
  {
    q: "Can you change a slide for me?",
    a: "Yes. Tell me what you want, like “make this simpler for fifth graders”, and I change the slide. Every change comes with an undo.",
  },
  {
    q: "What if I don’t know what to ask?",
    a: "That’s what I’m for. Tap me on any screen and I suggest the questions people usually have there.",
  },
];

/**
 * A small live conversation with Mel. Picking a question shows Mel thinking, then answering.
 * The pause is skipped for people who prefer reduced motion.
 */
export function MelDemo({ size = 160, className }: { size?: number; className?: string }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [mood, setMood] = useState<MelMood>("hello");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const ask = (i: number) => {
    if (timer.current) clearTimeout(timer.current);
    setPicked(i);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setMood("found");
      return;
    }
    setMood("thinking");
    timer.current = setTimeout(() => setMood("found"), 900);
  };

  const thinking = mood === "thinking";
  const answer = picked === null ? null : QUESTIONS[picked];

  return (
    <div className={cx("flex flex-wrap items-center gap-8", className)}>
      <div className="flex flex-[1_1_220px] flex-col items-center gap-2">
        <div className="flex aspect-square w-[min(220px,60vw)] items-center justify-center rounded-full bg-sage-50">
          <Mel key={mood} mood={mood} size={size} className={cx("h-auto w-[72%]", picked !== null && "settle")} />
        </div>
        <span className="text-[0.8125rem] font-semibold text-muted" aria-hidden="true">
          {thinking ? "Mel is thinking…" : picked === null ? "Mel is ready" : "Mel found an answer"}
        </span>
      </div>

      <div className="flex min-w-0 flex-[3_1_min(360px,100%)] flex-col gap-3">
        <div role="group" aria-label="Questions for Mel" className="flex flex-wrap gap-2">
          {QUESTIONS.map((item, i) => (
            <button
              key={item.q}
              type="button"
              aria-pressed={picked === i}
              onClick={() => ask(i)}
              className={cx(
                "min-h-11 rounded-full border-2 px-4 text-left font-medium",
                picked === i ? "border-ink bg-surface" : "border-line-strong bg-surface",
              )}
            >
              {item.q}
            </button>
          ))}
        </div>
        <div aria-live="polite" className="flex min-h-[132px] flex-col gap-2.5">
          {answer ? (
            <>
              <div key={`q${picked}`} className="in max-w-[88%] self-end rounded-[20px_20px_6px_20px] bg-accent-tint px-4 py-2.5">
                {answer.q}
              </div>
              {thinking ? (
                <div className="flex items-center gap-1.5 self-start rounded-[20px_20px_20px_6px] bg-ground px-4 py-3" aria-label="Mel is typing">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="soft-pulse size-2 rounded-full bg-muted" style={{ animationDelay: `${d * 150}ms` }} />
                  ))}
                </div>
              ) : (
                <div key={`a${picked}`} className="in max-w-[92%] self-start rounded-[20px_20px_20px_6px] bg-ground px-4 py-2.5">
                  {answer.a}
                </div>
              )}
            </>
          ) : (
            <p className="max-w-[460px] self-start rounded-[20px_20px_20px_6px] bg-ground px-4 py-2.5">
              Hi, I’m Mel. Pick a question and I’ll answer, the same way I do inside Mellow.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
