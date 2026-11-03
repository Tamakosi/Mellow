import type { Metadata } from "next";
import Link from "next/link";
import { Mel } from "@/components/mel";
import { Logo, cx, pill, primary } from "@/components/ui";

export const metadata: Metadata = { title: "Page not found · Mellow" };

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-4 md:px-10 py-4">
        <Logo href="/" />
      </header>
      <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center gap-5 px-6 pb-24 text-center">
        <Mel mood="unsure" size={140} />
        <h1 className="text-4xl font-semibold tracking-[-0.025em]">We couldn’t find that page</h1>
        <p className="text-[1.0625rem] text-muted">The link may be old or mistyped. Your decks are safe; pick up where you left off below.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/create" className={primary}>
            Go to my decks
          </Link>
          <Link href="/" className={cx(pill, "press min-h-12 px-5")}>
            Back to the home page
          </Link>
        </div>
      </main>
    </div>
  );
}
