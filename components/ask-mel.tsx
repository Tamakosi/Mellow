"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { MelFace } from "./mel";
import { Icon, pill } from "./ui";
import { useDismiss } from "./use-dismiss";

export type MelQuestion = { q: string; a: string };

/**
 * The "Ask Mel" entry point and the help panel it opens. Answers are scripted per screen.
 * Wide screens get a pill in the header; phones get a floating button in the bottom corner.
 */
export function AskMel({ intro, questions }: { intro: string; questions: MelQuestion[] }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(wrapper, open, close, trigger);

  useEffect(() => {
    if (open) panel.current?.focus();
  }, [open]);

  const answer = picked === null ? null : questions[picked];
  // Remember which of the two entry points was used, so focus returns to it on close.
  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    trigger.current = event.currentTarget;
    setOpen(!open);
    setPicked(null);
  };

  return (
    <div ref={wrapper} className="relative">
      <button type="button" aria-expanded={open} onClick={toggle} className={`${pill} pl-2 max-md:hidden`}>
        <MelFace />
        Ask Mel
      </button>
      <button
        type="button"
        aria-label="Ask Mel"
        aria-expanded={open}
        onClick={toggle}
        className="fixed bottom-4 right-4 z-30 flex size-16 items-center justify-center rounded-full border border-line bg-surface shadow-pop md:hidden"
      >
        <MelFace size={42} />
      </button>

      {open && (
        <div
          ref={panel}
          tabIndex={-1}
          role="dialog"
          aria-label="Ask Mel"
          className="pop z-40 flex flex-col gap-3.5 rounded-[28px] border border-line bg-surface p-5 shadow-pop outline-none max-md:fixed max-md:inset-x-3 max-md:bottom-24 md:absolute md:right-0 md:top-14 md:w-[380px]"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sage-50">
              <MelFace size={34} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[1.0625rem] font-semibold">Hi, I’m Mel</div>
              <div className="text-[0.8125rem] text-muted">Ask me about this screen</div>
            </div>
            <button
              type="button"
              aria-label="Close help"
              onClick={() => {
                close();
                trigger.current?.focus();
              }}
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface"
            >
              <Icon name="close" stroke={2} />
            </button>
          </div>

          {answer ? (
            <div className="fade flex flex-col gap-2.5" aria-live="polite">
              <div className="max-w-[88%] self-end rounded-[20px_20px_6px_20px] bg-accent-tint px-3.5 py-2.5">{answer.q}</div>
              <div className="max-w-[92%] self-start rounded-[20px_20px_20px_6px] bg-ground px-3.5 py-2.5">{answer.a}</div>
              <button type="button" onClick={() => setPicked(null)} className={`${pill} self-start`}>
                Ask something else
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-2">
              <div className="rounded-[20px_20px_20px_6px] bg-ground px-3.5 py-2.5">{intro}</div>
              {questions.map((item, i) => (
                <button
                  key={item.q}
                  type="button"
                  onClick={() => setPicked(i)}
                  className="min-h-11 rounded-[22px] border border-line-strong bg-surface px-4 py-2 text-left font-medium"
                >
                  {item.q}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
