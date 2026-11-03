/* The five starter themes and their small preview thumbnails. */

export type ThemeId = "meadow" | "paper" | "harbor" | "petal" | "night";

export const THEMES: {
  id: ThemeId;
  name: string;
  blurb: string;
  /** Colours used when a deck is rendered in this theme. */
  deck: { bg: string; cover: string; coverInk: string; ink: string; mid: string; soft: string; card: string };
  swatch: { inner: string; outer: string };
}[] = [
  {
    id: "meadow",
    name: "Meadow",
    blurb: "Soft and calm",
    deck: { bg: "#EDF3EC", cover: "#BCD9C4", coverInk: "#1F2A24", ink: "#1F2A24", mid: "#8FAE97", soft: "#B7C9BA", card: "#FFFFFF" },
    swatch: { inner: "#DCE9DD", outer: "#8FAE97" },
  },
  {
    id: "paper",
    name: "Paper",
    blurb: "Plain and centered",
    deck: { bg: "#F6F6F2", cover: "#E6E7E1", coverInk: "#1F2A24", ink: "#1F2A24", mid: "#9A9F97", soft: "#C9CEC6", card: "#FFFFFF" },
    swatch: { inner: "#FAFAF8", outer: "#C9CEC6" },
  },
  {
    id: "harbor",
    name: "Harbor",
    blurb: "Cool, image-led",
    deck: { bg: "#E6EDF3", cover: "#B9CADA", coverInk: "#1E2B38", ink: "#1E2B38", mid: "#8FA6BA", soft: "#B9CADA", card: "#FFFFFF" },
    swatch: { inner: "#DDE6EE", outer: "#8FA6BA" },
  },
  {
    id: "petal",
    name: "Petal",
    blurb: "Warm, card-based",
    deck: { bg: "#F8E9E7", cover: "#E6BFBD", coverInk: "#3A2528", ink: "#3A2528", mid: "#D9A9A6", soft: "#E6BFBD", card: "#FFFFFF" },
    swatch: { inner: "#F3DEDC", outer: "#D9A9A6" },
  },
  {
    id: "night",
    name: "Night",
    blurb: "Dark, for big rooms",
    deck: { bg: "#2B3237", cover: "#EFD58F", coverInk: "#252B2F", ink: "#F1F3F2", mid: "#EFD58F", soft: "#4A545B", card: "#3A4349" },
    swatch: { inner: "#252B2F", outer: "#EFD58F" },
  },
];

const bar = (width: string, color: string) => (
  <span className="h-[5px] rounded-[3px]" style={{ width, background: color }} />
);
const aa = (color: string) => (
  <span className="text-[0.9375rem] font-bold leading-[1.1]" style={{ color }}>
    Aa
  </span>
);

export function ThemeThumb({ id }: { id: ThemeId }) {
  const base = "flex aspect-video rounded-xl p-3.5";
  switch (id) {
    case "meadow":
      return (
        <span className={`${base} flex-col justify-end gap-1.5 bg-sage-100`}>
          {aa("#1F2A24")}
          {bar("62%", "#1F2A24")}
          {bar("40%", "#8FAE97")}
        </span>
      );
    case "paper":
      return (
        <span className={`${base} flex-col items-center justify-center gap-1.5 border border-line-select bg-[#FAFAF8]`}>
          {aa("#1F2A24")}
          {bar("46%", "#1F2A24")}
          {bar("30%", "#C9CEC6")}
        </span>
      );
    case "harbor":
      return (
        <span className={`${base} items-stretch gap-2.5 bg-[#DDE6EE]`}>
          <span className="flex flex-1 flex-col justify-center gap-1.5">
            {aa("#1E2B38")}
            {bar("90%", "#1E2B38")}
            {bar("60%", "#8FA6BA")}
          </span>
          <span className="flex-1 rounded-lg bg-[#B9CADA]" />
        </span>
      );
    case "petal":
      return (
        <span className={`${base} flex-col gap-1.5 bg-[#F3DEDC]`}>
          {aa("#3A2528")}
          {bar("70%", "#3A2528")}
          <span className="mt-auto flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-[18px] flex-1 rounded-md bg-[#E6BFBD]" />
            ))}
          </span>
        </span>
      );
    case "night":
      return (
        <span className={`${base} flex-col justify-end gap-1.5 bg-[#252B2F]`}>
          {aa("#F1F3F2")}
          {bar("58%", "#F1F3F2")}
          {bar("36%", "#EFD58F")}
        </span>
      );
  }
}
