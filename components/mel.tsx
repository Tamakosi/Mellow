/* Mel, the help mascot: a small sage slide with a leaf on top. */

export function MelFace({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <path d="M32 16V9" fill="none" stroke="#3D5A49" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 10c0-6 5-9 12-8 0 6-5 10-12 8z" fill="#8FAE97" />
      <rect x="7" y="15" width="50" height="40" rx="15" fill="#BCD9C4" />
      <ellipse cx="24" cy="33" rx="3" ry="4" fill="#1F2A24" />
      <ellipse cx="40" cy="33" rx="3" ry="4" fill="#1F2A24" />
      <circle cx="17" cy="41" r="4" fill="#EBCDBB" />
      <circle cx="47" cy="41" r="4" fill="#EBCDBB" />
      <path d="M27 41c2.5 3.5 7.5 3.5 10 0" fill="none" stroke="#1F2A24" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export type MelMood = "hello" | "thinking" | "found" | "unsure";

const LABELS: Record<MelMood, string> = {
  hello: "Mel waving hello",
  thinking: "Mel looking up and thinking",
  found: "Mel cheering with both arms up",
  unsure: "Mel looking unsure, leaf drooping",
};

export function Mel({ mood = "hello", size = 96, className }: { mood?: MelMood; size?: number; className?: string }) {
  const armsUp = mood === "found";
  const waving = mood === "hello" || armsUp;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label={LABELS[mood]} className={className}>
      <ellipse cx="30" cy="66" rx="7" ry="5" fill="#8FAE97" />
      <ellipse cx="50" cy="66" rx="7" ry="5" fill="#8FAE97" />
      {armsUp ? (
        <ellipse cx="10" cy="32" rx="4.5" ry="8" transform="rotate(-30 10 32)" fill="#8FAE97" />
      ) : (
        <ellipse cx="11" cy="48" rx="4.5" ry="8" transform="rotate(15 11 48)" fill="#8FAE97" />
      )}
      {waving ? (
        <ellipse cx="70" cy="32" rx="4.5" ry="8" transform="rotate(30 70 32)" fill="#8FAE97" />
      ) : (
        <ellipse cx="69" cy="48" rx="4.5" ry="8" transform="rotate(-15 69 48)" fill="#8FAE97" />
      )}
      <path d="M40 20v-8" fill="none" stroke="#3D5A49" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M40 13c0-7 6-10 14-9 0 7-6 11-14 9z"
        fill="#8FAE97"
        transform={mood === "unsure" ? "rotate(38 40 13)" : undefined}
      />
      {armsUp && (
        <path d="M28 11l-3-5M22 18l-5-3M61 15l5-3" fill="none" stroke="#8FAE97" strokeWidth="2.5" strokeLinecap="round" />
      )}
      <rect x="12" y="19" width="56" height="46" rx="17" fill="#BCD9C4" />

      {mood === "hello" && (
        <>
          <ellipse cx="31" cy="40" rx="3.2" ry="4.2" fill="#1F2A24" />
          <ellipse cx="49" cy="40" rx="3.2" ry="4.2" fill="#1F2A24" />
          <circle cx="32.2" cy="38.4" r="1.1" fill="#FFFFFF" />
          <circle cx="50.2" cy="38.4" r="1.1" fill="#FFFFFF" />
          <path d="M35 49c3 4 7 4 10 0" fill="none" stroke="#1F2A24" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      {mood === "thinking" && (
        <>
          <ellipse cx="33.5" cy="37.5" rx="3" ry="3.6" fill="#1F2A24" />
          <ellipse cx="51.5" cy="37.5" rx="3" ry="3.6" fill="#1F2A24" />
          <path d="M37 50h6" fill="none" stroke="#1F2A24" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="62" cy="17" r="1.8" fill="#8FAE97" />
          <circle cx="67" cy="12" r="2.6" fill="#8FAE97" />
          <circle cx="73" cy="6" r="3.4" fill="#8FAE97" />
        </>
      )}
      {mood === "found" && (
        <>
          <path
            d="M27 41c1.5-3.5 6.5-3.5 8 0M45 41c1.5-3.5 6.5-3.5 8 0"
            fill="none"
            stroke="#1F2A24"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path d="M34 47h12c-1 6-11 6-12 0z" fill="#1F2A24" stroke="#1F2A24" strokeWidth="1.6" strokeLinejoin="round" />
        </>
      )}
      {mood === "unsure" && (
        <>
          <path d="M26 34l9-3M54 34l-9-3" fill="none" stroke="#1F2A24" strokeWidth="2.2" strokeLinecap="round" />
          <ellipse cx="31" cy="41" rx="3.2" ry="4" fill="#1F2A24" />
          <ellipse cx="49" cy="41" rx="3.2" ry="4" fill="#1F2A24" />
          <path d="M34 52c2-2.5 4 2.5 6 0s4-2.5 6 0" fill="none" stroke="#1F2A24" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      <circle cx="23" cy={mood === "unsure" ? 50 : 49} r="4.5" fill="#EBCDBB" />
      <circle cx="57" cy={mood === "unsure" ? 50 : 49} r="4.5" fill="#EBCDBB" />
    </svg>
  );
}
