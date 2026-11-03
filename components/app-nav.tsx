import Link from "next/link";
import { cx } from "./ui";

/** [label, href, shown on phones]. My decks and Themes are sections of the Create page, and My decks is also in the account menu. */
const ITEMS = [
  ["Create", "/create", true],
  ["My decks", "/create#recent", false],
  ["Themes", "/create#themes", false],
  ["Brand kit", "/brand-kit", true],
] as const;

/** Main app navigation. `current` is the label of the page being shown. */
export function AppNav({ current }: { current?: (typeof ITEMS)[number][0] }) {
  return (
    <nav aria-label="Main" className="flex flex-wrap gap-1">
      {ITEMS.map(([label, href, onPhones]) => {
        const on = label === current;
        return (
          <Link
            key={label}
            href={href}
            aria-current={on ? "page" : undefined}
            className={cx(
              "flex min-h-11 items-center rounded-full px-3 sm:px-[18px]",
              on ? "bg-surface font-semibold shadow-xs" : "font-medium text-muted",
              !onPhones && "max-sm:hidden",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
