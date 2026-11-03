import type { ReactNode } from "react";
import { Mel } from "./mel";
import { Logo } from "./ui";

/** Split layout for log in and sign up: the form on one side, a calm brand panel on the other. */
export function AuthShell({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-wrap">
      <div className="flex min-w-0 flex-[1_1_min(520px,100%)] flex-col px-4 py-4 md:px-10">
        <Logo href="/" />
        <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center gap-6 py-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-[2.25rem] font-semibold leading-[1.15] tracking-[-0.025em]">{title}</h1>
            {/* Intros can repeat what someone typed (the reset message echoes their email), so long words may break. */}
            <div className="text-[1.0625rem] text-muted [overflow-wrap:anywhere]">{intro}</div>
          </div>
          {children}
        </main>
      </div>
      <aside
        aria-hidden="true"
        className="flex flex-[1_1_min(440px,100%)] flex-col items-center justify-center gap-6 bg-sage-100 px-8 py-16 text-center max-md:hidden"
      >
        <div className="flex aspect-square w-[min(280px,70%)] items-center justify-center rounded-full bg-sage-50">
          <Mel size={200} className="h-auto w-[72%]" />
        </div>
        <p className="max-w-[340px] text-xl font-semibold leading-snug tracking-[-0.015em]">
          From one sentence to a deck you would actually present.
        </p>
        <p className="max-w-[320px] text-muted">You review the outline first. Nothing is designed until you say so.</p>
      </aside>
    </div>
  );
}
