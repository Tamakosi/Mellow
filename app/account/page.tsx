"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AppNav } from "@/components/app-nav";
import { AskMel } from "@/components/ask-mel";
import { Field, SaveBar, describedBy, fakeSave, inputClass, isEmail, type SaveState } from "@/components/form";
import { AppHeader, Avatar, Icon, cx, eyebrow, panel, pill } from "@/components/ui";
import { initials } from "@/lib/initials";
import { saveProfile, useProfile, type Profile } from "@/lib/profile";

const ROLES = ["Teacher", "Student", "Founder", "Team member", "Something else"];
const LANGUAGES = ["English", "Bahasa Indonesia", "Español"];

const MEL_QUESTIONS = [
  { q: "Who sees my name?", a: "People you share a deck with see your name and photo next to it. Your email stays private." },
  { q: "Why do you ask what I do?", a: "So I can suggest better examples and defaults, like lesson layouts for teachers. It’s optional." },
  { q: "How do I change my password?", a: "Use “Send a reset link” in the Password section. The link comes to the email shown on this page." },
];

const noSubscribe = () => () => {};

export default function AccountPage() {
  const { name, email, role, language } = useProfile();
  // The server renders the defaults; once in the browser the form starts again, once, from the saved
  // profile. Later saves don't restart it, so "Changes saved" stays on screen.
  const inBrowser = useSyncExternalStore(noSubscribe, () => true, () => false);
  return <ProfileForm key={inBrowser ? "browser" : "server"} initial={{ name, email, role, language }} />;
}

function ProfileForm({ initial }: { initial: Profile }) {
  const [saved, setSaved] = useState(initial);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [state, setState] = useState<SaveState>("idle");
  const [photo, setPhoto] = useState<string | null>(null);
  const [resetStatus, setResetStatus] = useState("");

  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo);
  }, [photo]);

  const dirty = (Object.keys(form) as (keyof Profile)[]).some((k) => form[k] !== saved[k]);
  const update = (key: keyof Profile, value: string) => {
    setForm({ ...form, [key]: value });
    if (state === "saved") setState("idle");
  };

  const save = async () => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Enter your name.";
    if (!isEmail(form.email)) next.email = "Enter an email address, like name@example.com.";
    setErrors(next);
    if (next.name || next.email) {
      document.getElementById(next.name ? "name" : "email")?.focus();
      return;
    }
    setState("saving");
    try {
      await fakeSave();
      setSaved(form);
      saveProfile(form);
      setState("saved");
      setTimeout(() => setState((s) => (s === "saved" ? "idle" : s)), 3000);
    } catch {
      setState("error");
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader center={<AppNav />}>
        <AskMel intro="Questions about your profile?" questions={MEL_QUESTIONS} />
        <Avatar />
      </AppHeader>

      <main className="mx-auto flex w-full max-w-[880px] flex-col gap-6 px-4 pb-16 pt-8 md:px-6">
        <div className="flex flex-col gap-2">
          <div className={eyebrow}>Account</div>
          <h1 className="text-[2.5rem] font-semibold leading-[1.15] tracking-[-0.025em] max-md:text-3xl">Your profile</h1>
          <p className="text-[1.0625rem] text-muted">How you appear to people you share decks with.</p>
        </div>

        <section aria-labelledby="details-title" className={cx(panel, "in flex flex-col gap-6 p-6 md:p-8")}>
          <h2 id="details-title" className="sr-only">
            Profile details
          </h2>
          <div className="flex flex-wrap items-center gap-5">
            <span className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-accent-tint text-3xl font-semibold">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- local preview of a file the user picked
                <img src={photo} alt="Your profile photo" className="size-full object-cover" />
              ) : (
                <span aria-hidden="true">{initials(form.name) || <Icon name="smile" size={36} />}</span>
              )}
            </span>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <label className={cx(pill, "cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink")}>
                  {photo ? "Change photo" : "Upload a photo"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setPhoto(URL.createObjectURL(file));
                    }}
                  />
                </label>
                {photo && (
                  <button type="button" onClick={() => setPhoto(null)} className={pill}>
                    Remove photo
                  </button>
                )}
              </div>
              <p className="text-[0.8125rem] text-muted">A square PNG or JPG works best. Your initials show until you add one.</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field id="name" label="Full name" error={errors.name}>
              <input
                id="name"
                autoComplete="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={describedBy("name")}
                className={inputClass(!!errors.name)}
              />
            </Field>
            <Field id="email" label="Email" hint="Log-in links and receipts go here." error={errors.email}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={describedBy("email")}
                className={inputClass(!!errors.email)}
              />
            </Field>
            <Field id="role" label="What you do" hint="Helps Mel suggest better examples." optional>
              <select id="role" value={form.role} onChange={(e) => update("role", e.target.value)} aria-describedby={describedBy("role")} className={inputClass()}>
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field id="language" label="Interface language">
              <select id="language" value={form.language} onChange={(e) => update("language", e.target.value)} aria-describedby={describedBy("language")} className={inputClass()}>
                {LANGUAGES.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <section aria-labelledby="password-title" className={cx(panel, "in d1 flex flex-wrap items-center justify-between gap-4 p-6 md:p-8")}>
          <div>
            <h2 id="password-title" className="text-xl font-semibold tracking-[-0.015em]">
              Password
            </h2>
            <p className="text-muted">We’ll email you a link to choose a new one.</p>
            <p role="status" className="mt-1 text-sm font-semibold text-green-deep">
              {resetStatus}
            </p>
          </div>
          <button type="button" onClick={() => setResetStatus(`Reset link sent to ${saved.email}.`)} className={pill}>
            Send a reset link
          </button>
        </section>

        <SaveBar
          dirty={dirty}
          state={state}
          onSave={save}
          onDiscard={() => {
            setForm(saved);
            setErrors({});
            setState("idle");
          }}
        />
      </main>
    </div>
  );
}
