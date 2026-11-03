"use client";

import Link from "next/link";
import { useState } from "react";
import { AskMel } from "@/components/ask-mel";
import { Mel } from "@/components/mel";
import { AppHeader, Avatar, Icon, Stepper, card, cx, eyebrow, panel, pill, primary } from "@/components/ui";

const SHARE_LINK = "https://[YOUR-DOMAIN]/d/the-water-cycle";

const MEL_QUESTIONS = [
  { q: "Who can open my link?", a: "Whoever you choose above. “Anyone with the link” needs no account; “Only people I invite” asks them to log in first." },
  { q: "Can I keep editing after I share?", a: "Yes. The link always shows the latest version, so you never need to send it again." },
  { q: "Which file types can I download?", a: "That list isn’t final yet: [EXPORT FORMATS]." },
];

const ACCESS = [
  { id: "link", label: "Anyone with the link", hint: "No account needed to view" },
  { id: "invite", label: "Only people I invite", hint: "Viewers log in with their email" },
] as const;

export default function ExportPage() {
  const [access, setAccess] = useState<(typeof ACCESS)[number]["id"]>("link");
  const [status, setStatus] = useState("");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_LINK);
      setStatus("Link copied. Paste it into an email or chat.");
    } catch {
      setStatus("Couldn’t copy automatically. Select the link and copy it yourself.");
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader center={<Stepper current={3} />}>
        <AskMel intro="Ready to share? Pick a question." questions={MEL_QUESTIONS} />
        <Link href="/editor" className={cx(pill, "px-[18px]")}>
          Back to editor
        </Link>
        <Avatar />
      </AppHeader>

      <div className="flex flex-1 flex-wrap items-start gap-10 px-4 md:px-10 pb-12 pt-6 max-md:px-4">
        {/* The ending of the flow: celebrate the finished deck, then make sharing effortless. */}
        <section className={cx(panel, "flex min-w-0 flex-[1_1_min(380px,100%)] flex-col gap-6 p-8")}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className={eyebrow}>Ready to share</div>
              <h1 className="text-[2.5rem] font-semibold leading-[1.15] tracking-[-0.025em] max-md:text-3xl">
                Your deck is <span className="rounded-xl bg-accent px-2.5">ready</span>
              </h1>
              <p className="text-[1.0625rem] text-muted">The Water Cycle · 6 slides · Meadow theme</p>
            </div>
            <Mel mood="found" size={88} className="grow-in shrink-0 max-md:hidden" />
          </div>
          <div className="flex aspect-video flex-col justify-end gap-2 rounded-2xl bg-sage-100 p-8">
            <span className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-muted">Science · Grade 5</span>
            <span className="text-4xl font-semibold tracking-[-0.025em] max-md:text-2xl">The Water Cycle</span>
            <span className="h-1.5 w-1/4 rounded-full bg-accent-deep" />
          </div>
        </section>

        <main className="in d1 flex min-w-0 flex-[1_1_min(420px,100%)] flex-col gap-4">
          <section aria-labelledby="share-title" className={cx(card, "flex flex-col gap-4 p-6")}>
            <h2 id="share-title" className="text-xl font-semibold tracking-[-0.015em]">
              Share a link
            </h2>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[0.8125rem] font-semibold text-muted">Who can open it</legend>
              {ACCESS.map((item) => (
                <label
                  key={item.id}
                  className={cx(
                    "flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-2",
                    access === item.id ? "border-ink" : "border-line-select",
                  )}
                >
                  <input
                    type="radio"
                    name="access"
                    value={item.id}
                    checked={access === item.id}
                    onChange={() => setAccess(item.id)}
                    className="size-4 accent-ink"
                  />
                  <span className="flex flex-col">
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-[0.8125rem] text-muted">{item.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="share-link" className="text-[0.8125rem] font-semibold text-muted">
                Link
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  id="share-link"
                  readOnly
                  value={SHARE_LINK}
                  onFocus={(e) => e.target.select()}
                  className="min-h-12 min-w-0 flex-[1_1_min(220px,100%)] rounded-full border border-line-input bg-ground px-4 text-base"
                />
                <button type="button" onClick={copy} className={primary}>
                  Copy link
                </button>
              </div>
              <p role="status" className="min-h-5 text-[0.8125rem] text-muted">
                {status}
              </p>
            </div>
          </section>

          <section aria-labelledby="present-title" className={cx(card, "flex flex-wrap items-center justify-between gap-4 p-6")}>
            <div>
              <h2 id="present-title" className="text-lg font-semibold">
                Present from your browser
              </h2>
              <p className="text-[0.9375rem] text-muted">Full screen, with Previous and Next controls.</p>
            </div>
            <Link href="/editor#present" className={cx(pill, "press px-[18px]")}>
              <Icon name="play" size={14} stroke={2} filled />
              Present
            </Link>
          </section>

          <section aria-labelledby="download-title" className={cx(card, "flex flex-wrap items-center justify-between gap-4 p-6")}>
            <div>
              <h2 id="download-title" className="text-lg font-semibold">
                Download a file
              </h2>
              <p className="text-[0.9375rem] text-muted">Available as [EXPORT FORMATS].</p>
            </div>
            <button
              type="button"
              onClick={() => setStatus("Downloads aren’t part of this prototype yet.")}
              className={cx(pill, "px-[18px]")}
            >
              Download
            </button>
          </section>

          <p className="px-1 text-[0.9375rem] text-muted">
            Want another one?{" "}
            <Link href="/create" className="font-semibold text-green-deep underline underline-offset-4">
              Start a new deck
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
}
