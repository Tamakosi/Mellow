"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AppNav } from "@/components/app-nav";
import { AskMel } from "@/components/ask-mel";
import { Field, Toggle, describedBy, fakeSave, inputClass, type SaveState } from "@/components/form";
import { THEMES } from "@/components/themes";
import { AppHeader, Avatar, Icon, card, cx, eyebrow, pill } from "@/components/ui";

const SECTIONS = [
  ["defaults", "Deck defaults"],
  ["notifications", "Notifications"],
  ["sharing", "Sharing"],
  ["plan", "Plan"],
  ["delete", "Delete account"],
] as const;

const MEL_QUESTIONS = [
  { q: "Do these settings change my old decks?", a: "No. Deck defaults only apply to new decks. Each existing deck keeps its own settings." },
  { q: "Do I need to press Save?", a: "Not here. Each setting saves as soon as you change it, and a note confirms it." },
  { q: "What happens if I delete my account?", a: "Your decks, brand kit and shared links are removed for good. Download anything you want to keep first." },
];

const CONFIRM_WORD = "DELETE";

export default function SettingsPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState({
    slides: "10 slides",
    tone: "Friendly",
    text: "Medium",
    language: "English",
    theme: "meadow",
    notifyDone: true,
    notifyNews: false,
    notifyTips: true,
    access: "link",
    downloads: true,
  });
  const [status, setStatus] = useState<{ section: string; state: SaveState; retry?: () => void }>({ section: "", state: "idle" });
  const dialog = useRef<HTMLDialogElement>(null);
  const [confirmText, setConfirmText] = useState("");
  const [confirmError, setConfirmError] = useState("");

  // Marks the last section whose heading has passed the top third of the screen, so the side links
  // show where you are. At the very bottom the last section wins, since it may never reach that line.
  const [inView, setInView] = useState<string>(SECTIONS[0][0]);
  // A clicked link stays marked even when the page can't scroll its section to the top, until the person scrolls.
  const pinned = useRef<string | null>(null);
  const pick = (id: string) => {
    pinned.current = id;
    setInView(id);
  };
  useEffect(() => {
    let frame = 0;
    const unpin = () => {
      pinned.current = null;
    };
    const update = () => {
      frame = 0;
      if (pinned.current) return;
      const line = innerHeight / 3;
      const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
      let active: string = SECTIONS[0][0];
      for (const [id] of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) active = id;
      }
      setInView(atBottom ? SECTIONS[SECTIONS.length - 1][0] : active);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    // Only the person's own scrolling releases a clicked link; the jump it caused does not.
    const userInput = ["wheel", "touchmove", "keydown"] as const;
    userInput.forEach((type) => addEventListener(type, unpin, { passive: true }));
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      userInput.forEach((type) => removeEventListener(type, unpin));
      cancelAnimationFrame(frame);
    };
  }, []);

  // Every change saves straight away; a failed save rolls back and offers a retry.
  const change = async <K extends keyof typeof prefs>(section: string, key: K, value: (typeof prefs)[K]) => {
    const before = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setStatus({ section, state: "saving" });
    try {
      await fakeSave(450);
      setStatus({ section, state: "saved" });
    } catch {
      setPrefs(before);
      setStatus({ section, state: "error", retry: () => change(section, key, value) });
    }
  };

  const note = (section: string) => {
    const on = status.section === section;
    return (
      <p role="status" className={cx("flex min-h-6 items-center gap-2 text-sm font-medium", on && status.state === "error" ? "text-danger" : "text-muted")}>
        {on && status.state === "saving" && "Saving…"}
        {on && status.state === "saved" && (
          <>
            <Icon name="check" size={14} stroke={2.6} /> Saved
          </>
        )}
        {on && status.state === "error" && (
          <>
            Couldn’t save that change. Check your connection.
            <button type="button" onClick={status.retry} className="font-semibold underline underline-offset-4">
              Try again
            </button>
          </>
        )}
      </p>
    );
  };

  const select = (id: string, label: string, key: "slides" | "tone" | "text" | "language", options: string[]) => (
    <Field id={id} label={label}>
      <select id={id} value={prefs[key]} onChange={(e) => change("defaults", key, e.target.value)} aria-describedby={describedBy(id)} className={inputClass()}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </Field>
  );

  const confirmDelete = (event: FormEvent) => {
    event.preventDefault();
    if (confirmText.trim() !== CONFIRM_WORD) {
      setConfirmError(`Type ${CONFIRM_WORD} in capital letters to confirm.`);
      return;
    }
    router.push("/");
  };

  const section = "scroll-mt-6 flex flex-col gap-4";

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader center={<AppNav />}>
        <AskMel intro="Questions about settings?" questions={MEL_QUESTIONS} />
        <Avatar />
      </AppHeader>

      <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-start gap-8 px-4 pb-16 pt-8 md:px-6">
        <div className="flex w-full flex-col gap-2">
          <div className={eyebrow}>Account</div>
          <h1 className="text-[2.5rem] font-semibold leading-[1.15] tracking-[-0.025em] max-md:text-3xl">Settings</h1>
          <p className="text-[1.0625rem] text-muted">Changes save as soon as you make them.</p>
        </div>

        <nav aria-label="Settings sections" className="flex flex-[1_1_200px] flex-wrap gap-1 md:sticky md:top-6 md:flex-col">
          {SECTIONS.map(([id, label]) => {
            const on = id === inView;
            return (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => pick(id)}
                aria-current={on ? "location" : undefined}
                className={cx(
                  "flex min-h-11 shrink-0 items-center rounded-full px-4",
                  on ? "bg-surface font-semibold shadow-xs" : "font-medium",
                  id === "delete" ? "text-danger" : on ? "text-ink" : "text-muted",
                )}
              >
                {label}
              </a>
            );
          })}
        </nav>

        <main className="in flex min-w-0 flex-[999_1_min(560px,100%)] flex-col gap-10">
          <section id="defaults" aria-labelledby="defaults-title" className={section}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="defaults-title" className="text-xl font-semibold tracking-[-0.015em]">
                Deck defaults
              </h2>
              {note("defaults")}
            </div>
            <p className="-mt-2 text-muted">Used for new decks. You can still change them on the prompt screen.</p>
            <div className={cx(card, "grid gap-5 p-6 md:grid-cols-2")}>
              {select("pref-slides", "Length", "slides", ["8 slides", "10 slides", "12 slides", "15 slides"])}
              {select("pref-tone", "Tone", "tone", ["Friendly", "Formal", "Playful"])}
              {select("pref-text", "Text on each slide", "text", ["Brief", "Medium", "Detailed"])}
              {select("pref-language", "Language", "language", ["English", "Bahasa Indonesia", "Español"])}
              <fieldset className="flex flex-col gap-2 md:col-span-2">
                <legend className="mb-2 text-sm font-semibold">Theme</legend>
                <div className="flex flex-wrap gap-2">
                  {THEMES.map((t) => {
                    const on = prefs.theme === t.id;
                    return (
                      <label
                        key={t.id}
                        className={cx(
                          "flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 bg-surface pl-2.5 pr-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink",
                          on ? "border-ink font-semibold" : "border-line-select font-medium",
                        )}
                      >
                        <input type="radio" name="theme" value={t.id} checked={on} onChange={() => change("defaults", "theme", t.id)} className="sr-only" />
                        <span className="size-[22px] rounded-full border-[5px]" style={{ background: t.swatch.inner, borderColor: t.swatch.outer }} />
                        {t.name}
                        {on && <Icon name="check" size={14} stroke={2.6} />}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          </section>

          <section id="notifications" aria-labelledby="notifications-title" className={section}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="notifications-title" className="text-xl font-semibold tracking-[-0.015em]">
                Notifications
              </h2>
              {note("notifications")}
            </div>
            <div className={cx(card, "flex flex-col divide-y divide-divider px-6 py-2")}>
              <Toggle id="n-done" label="Email me when a deck is ready" hint="Handy when you run generation in the background." checked={prefs.notifyDone} onChange={(v) => change("notifications", "notifyDone", v)} />
              <Toggle id="n-tips" label="Show tips from Mel" hint="Short suggestions inside the editor." checked={prefs.notifyTips} onChange={(v) => change("notifications", "notifyTips", v)} />
              <Toggle id="n-news" label="Send product news" hint="A few emails a year about new features." checked={prefs.notifyNews} onChange={(v) => change("notifications", "notifyNews", v)} />
            </div>
          </section>

          <section id="sharing" aria-labelledby="sharing-title" className={section}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="sharing-title" className="text-xl font-semibold tracking-[-0.015em]">
                Sharing
              </h2>
              {note("sharing")}
            </div>
            <div className={cx(card, "flex flex-col gap-4 p-6")}>
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm font-semibold">Who can open new share links</legend>
                {[
                  ["link", "Anyone with the link", "No account needed to view"],
                  ["invite", "Only people I invite", "Viewers log in with their email"],
                ].map(([id, label, hint]) => (
                  <label key={id} className={cx("flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-2", prefs.access === id ? "border-ink" : "border-line-select")}>
                    <input type="radio" name="access" value={id} checked={prefs.access === id} onChange={() => change("sharing", "access", id)} className="size-4 accent-ink" />
                    <span className="flex flex-col">
                      <span className="font-semibold">{label}</span>
                      <span className="text-[0.8125rem] text-muted">{hint}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <Toggle id="s-downloads" label="Let viewers download a copy" checked={prefs.downloads} onChange={(v) => change("sharing", "downloads", v)} />
            </div>
          </section>

          <section id="plan" aria-labelledby="plan-title" className={section}>
            <h2 id="plan-title" className="text-xl font-semibold tracking-[-0.015em]">
              Plan
            </h2>
            <div className={cx(card, "flex flex-wrap items-center justify-between gap-4 p-6")}>
              <div>
                <div className="font-semibold">Pro</div>
                <div className="text-muted">Unlimited decks, up to 50 slides each · Renews 1 December 2026</div>
              </div>
              <Link href="/#pricing" className={pill}>
                Compare plans
              </Link>
            </div>
          </section>

          <section id="delete" aria-labelledby="delete-title" className={section}>
            <h2 id="delete-title" className="text-xl font-semibold tracking-[-0.015em] text-danger">
              Delete account
            </h2>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border-2 border-danger bg-surface p-6">
              <p className="max-w-[460px] text-muted">
                Removes your decks, brand kit and every share link for good. Download anything you want to keep first.
              </p>
              <button
                type="button"
                onClick={() => {
                  setConfirmText("");
                  setConfirmError("");
                  dialog.current?.showModal();
                }}
                className="min-h-11 rounded-full border-2 border-danger px-5 font-semibold text-danger"
              >
                Delete account…
              </button>
            </div>
          </section>
        </main>
      </div>

      <dialog
        ref={dialog}
        aria-labelledby="delete-dialog-title"
        className="pop m-auto w-[min(480px,calc(100vw-32px))] rounded-[28px] border border-line bg-surface p-0 text-ink shadow-pop backdrop:bg-ink/40"
      >
        <form onSubmit={confirmDelete} noValidate className="flex flex-col gap-4 p-6">
          <h2 id="delete-dialog-title" className="text-xl font-semibold tracking-[-0.015em]">
            Delete your Mellow account?
          </h2>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-muted">
            <li>All your decks and outlines are deleted.</li>
            <li>Your brand kit is deleted.</li>
            <li>Every share link stops working.</li>
          </ul>
          <p className="font-semibold">This can’t be undone.</p>
          <Field id="confirm" label={`Type ${CONFIRM_WORD} to confirm`} error={confirmError}>
            <input
              id="confirm"
              value={confirmText}
              autoComplete="off"
              onChange={(e) => {
                setConfirmText(e.target.value);
                setConfirmError("");
              }}
              aria-invalid={!!confirmError}
              aria-describedby={describedBy("confirm")}
              className={inputClass(!!confirmError)}
            />
          </Field>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => dialog.current?.close()} className={pill}>
              Keep my account
            </button>
            <button type="submit" className="min-h-11 rounded-full bg-danger px-5 font-semibold text-white">
              Delete account
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
