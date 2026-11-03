import Link from "next/link";
import type { ReactNode } from "react";

/* Shared class recipes, so every screen uses the same shapes. */
export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

export const pill =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-4 font-medium";
export const primary =
  "press inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-ink px-[22px] text-base font-semibold text-white";
export const card = "rounded-[20px] border border-line bg-surface";
export const panel = "rounded-[28px] border border-line bg-surface shadow-soft";
export const eyebrow = "text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-muted";
export const sectionTitle = "text-xl font-semibold leading-[1.3] tracking-[-0.015em]";

const PATHS = {
  slides: "M5 5h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM7 19h12a2 2 0 0 0 2-2V9",
  chevron: "M6 9l6 6 6-6",
  users:
    "M12.5 8a3.5 3.5 0 1 1-7 0a3.5 3.5 0 0 1 7 0zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8",
  smile: "M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0zM8.5 14.5a4.5 4.5 0 0 0 7 0M9 10h.01M15 10h.01",
  lines: "M4 6h16M4 12h16M4 18h10",
  globe: "M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
  arrow: "M5 12h14M13 6l6 6-6 6",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  plus: "M12 5v14M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7.5",
  close: "M6 6l12 12M18 6L6 18",
  up: "M12 19V5M6 11l6-6 6 6",
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
  share: "M12 15V4M8 8l4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5",
  pause: "M9 5v14M15 5v14",
  stop: "M8 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",
  play: "M7 5l12 7-12 7z",
  layout: "M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM3 10h18M10 10v10",
  theme: "M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0zM12 3v18",
  text: "M5 6h14M12 6v13M9 19h6",
  image: "M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM21 16l-5-5-8 8",
  chart: "M5 20V10M12 20V4M19 20v-7",
  eye: "M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0z",
  "eye-off":
    "M3 3l18 18M10.6 5.6c.5-.1.9-.1 1.4-.1 6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.9 3.7M6.6 6.6C4 8.3 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.8 0 3.4-.6 4.7-1.4M9.9 9.9a3 3 0 0 0 4.2 4.2",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 18,
  stroke = 1.8,
  filled = false,
  className,
}: {
  name: IconName;
  size?: number;
  stroke?: number;
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cx("shrink-0", className)}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/**
 * `compact` shows only the mark on phones (the name stays for screen readers), so app headers fit one row.
 * `"narrow"` does the same only below 360px, for the landing page where the wordmark matters more.
 */
export function Logo({ href = "/create", compact = false }: { href?: string; compact?: boolean | "narrow" }) {
  return (
    <Link href={href} className="flex min-h-11 min-w-11 items-center gap-2.5 text-lg font-bold tracking-[-0.01em]">
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-accent">
        <Icon name="slides" stroke={2} />
      </span>
      <span className={cx(compact === true && "max-sm:sr-only", compact === "narrow" && "max-[359px]:sr-only")}>Mellow</span>
    </Link>
  );
}

export { AccountMenu as Avatar } from "./account-menu";

export function AppHeader({
  logoHref,
  center,
  children,
}: {
  logoHref?: string;
  center?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 max-sm:gap-y-2 max-sm:py-3 md:px-10">
      <Logo href={logoHref} compact />
      {center}
      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
}

const STEPS = ["Prompt", "Outline", "Design", "Export"];

/**
 * Four-step progress bar. `current` is the zero-based index of the active step.
 * On phones it collapses to one short label ("Outline · 2 of 4") so the header fits; the other steps stay
 * in the list for screen readers.
 */
export function Stepper({ current }: { current: number }) {
  return (
    <ol aria-label="Progress" className="flex flex-wrap items-center gap-1">
      {STEPS.map((label, i) => {
        const on = i === current;
        const done = i < current;
        return (
          <li
            key={label}
            aria-current={on ? "step" : undefined}
            className={cx(
              "flex min-h-11 items-center gap-2 rounded-full pl-2.5",
              on ? "bg-surface pr-[18px] font-semibold shadow-xs max-sm:pl-4" : "pr-4 font-medium text-muted max-sm:sr-only",
            )}
          >
            {done ? (
              <span className="flex size-6 items-center justify-center rounded-full bg-ink text-white">
                <Icon name="check" size={12} stroke={3} />
              </span>
            ) : (
              <span
                className={cx(
                  "flex size-6 items-center justify-center rounded-full text-[0.8125rem]",
                  on ? "bg-accent font-bold max-sm:hidden" : "border border-dash font-semibold",
                )}
              >
                {i + 1}
              </span>
            )}
            {label}
            {on && (
              <span className="font-medium text-muted sm:hidden">
                · {i + 1} of {STEPS.length}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
