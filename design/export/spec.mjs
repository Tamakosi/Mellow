// What the Mellow FigCraft file contains: screen rows, prototype routes, tokens, text styles and component rules.

// ---------- screens ----------
export const ROWS = [
  { label: "Marketing", keys: ["landing", "landing-mel", "mel", "mel-answer", "not-found"] },
  { label: "Log in and sign up", keys: ["login", "login-errors", "login-wrong", "login-reset", "login-sent", "signup", "signup-errors", "signup-taken"] },
  { label: "Create a deck", keys: ["create", "create-error", "create-paste", "create-menu", "create-askmel", "outline", "generate", "generate-done"] },
  { label: "Edit and share", keys: ["editor", "editor-layout", "editor-quiz", "editor-present", "export", "export-copied"] },
  { label: "Account", keys: ["account", "account-dirty", "account-saved", "settings", "settings-delete", "brand-kit", "brand-kit-contrast"] },
];
export const MOBILE_ROW = { label: "Phone · 375", keys: ["m-landing", "m-mel", "m-login", "m-signup", "m-create", "m-outline", "m-generate", "m-editor", "m-export", "m-account", "m-settings", "m-brand-kit", "m-not-found"] };

// Links go to the screen for their route; anything else is wired per screen below.
export const HREF = {
  "/": "landing", "/create": "create", "/create#recent": "create", "/create#themes": "create", "/outline": "outline", "/generate": "generate",
  "/editor": "editor", "/editor#present": "editor-present", "/export": "export", "/mel": "mel", "/login": "login", "/signup": "signup",
  "/account": "account", "/settings": "settings", "/brand-kit": "brand-kit", "/#pricing": "landing",
};
// Per screen: control name (exact, or /regex/) -> destination screen key ("BACK" goes back).
export const ROUTES = {
  landing: { "Can you change a slide for me?": "landing-mel" },
  "landing-mel": {},
  mel: { "What can Mellow make?": "mel-answer" },
  "mel-answer": {},
  login: { "Log in": "login-wrong", "Forgot your password?": "login-reset" },
  "login-errors": { "Log in": "login-wrong", "Forgot your password?": "login-reset" },
  "login-wrong": { "Log in": "create", "Forgot your password?": "login-reset" },
  "login-reset": { "Send reset link": "login-sent", "/^Back to log in/": "login" },
  "login-sent": { "/^Back to log in/": "login" },
  signup: { "Create account": "signup-taken" },
  "signup-errors": { "Create account": "signup-taken" },
  "signup-taken": { "Create account": "create", "/^Log in with/": "login" },
  create: { "Draft outline": "outline", Account: "create-menu", "Ask Mel": "create-askmel", "/^Paste an outline/": "create-paste" },
  "create-error": { "Draft outline": "outline", Account: "create-menu", "Ask Mel": "create-askmel" },
  "create-paste": { "Draft outline": "outline", Account: "create-menu", "Ask Mel": "create-askmel", "/^Paste an outline/": "create" },
  "create-menu": { Account: "create" },
  "create-askmel": { "Ask Mel": "create", "/^Close/": "create", Account: "create-menu" },
  outline: { "Design slides": "generate" },
  generate: { "Run in background": "create" },
  "generate-done": {},
  editor: { Present: "editor-present", Layout: "editor-layout", "Add a quick quiz slide": "editor-quiz" },
  "editor-layout": { Layout: "editor", Present: "editor-present" },
  "editor-quiz": { Present: "editor-present", Layout: "editor-layout" },
  "editor-present": { "Exit presentation": "editor" },
  export: { "Copy link": "export-copied" },
  "export-copied": {},
  account: { "#name": "account-dirty", "Full name": "account-dirty" },
  "account-dirty": { "Save changes": "account-saved", Discard: "account" },
  "account-saved": {},
  settings: { "Delete account…": "settings-delete" },
  "settings-delete": { "Keep my account": "settings" },
  "brand-kit": { "#hex-text": "brand-kit-contrast" },
  "brand-kit-contrast": { Discard: "brand-kit" },
  "not-found": {},
};
export const FLOWS = [
  ["Main flow: landing to export", "landing"],
  ["Log in", "login"],
  ["Sign up", "signup"],
  ["Create a deck", "create"],
  ["Account and settings", "account"],
];

// ---------- tokens ----------
export const COLOR_GROUPS = [
  ["Surface", ["ground", "surface", "white"]],
  ["Text", ["ink", "muted", "green-deep"]],
  ["Line", ["line", "line-strong", "line-select", "line-input", "divider", "dash"]],
  ["Accent", ["accent", "accent-tint", "accent-deep", "sage-100", "sage-50"]],
  ["Feedback", ["danger"]],
];
export const COLOR_NOTES = {
  ground: "Page background", surface: "Cards, panels, inputs", white: "Text on ink buttons", ink: "Text, primary buttons", muted: "Secondary text, placeholders",
  "green-deep": "Links, icons on tint", line: "Card borders", "line-strong": "Button and chip borders", "line-select": "Unselected option borders", "line-input": "Input borders (3:1)",
  divider: "Dividers inside cards", dash: "Dashed outlines", accent: "Brand sage, highlights", "accent-tint": "Tiles, avatar, chat bubbles", "accent-deep": "Progress, Mel's leaf",
  "sage-100": "Slide preview fills", "sage-50": "Selected rows", danger: "Errors, destructive actions",
};
export const SPACE = [4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64];
export const RADIUS = [["sm", 8], ["logo", 10], ["md", 12], ["tile", 14], ["input", 16], ["card", 20], ["card-lg", 22], ["panel", 28], ["full", 9999]];
export const MOTION = [["dur-fast", 150, "Press feedback, small fades"], ["dur-normal", 200, "Menus, pop-overs"], ["dur-moderate", 300, "Entrances, sheets"]];
export const EASING = [["ease-standard", "cubic-bezier(0.2, 0, 0, 1)", "Moves and resizes"], ["ease-enter", "cubic-bezier(0, 0, 0.2, 1)", "Things arriving"]];

// [style name, weight, size, line height, letter spacing, text case, where it is used]
export const TYPE = [
  ["Display/Hero", 600, 64, 70.4, -1.92, null, "Landing page headline"],
  ["Display/Page", 600, 48, 55.2, -1.2, null, "Create page headline"],
  ["Heading/1", 600, 40, 46, -1, null, "Page titles"],
  ["Heading/2", 600, 36, 43.2, -0.9, null, "Landing section titles"],
  ["Heading/2 tight", 600, 36, 41.4, -0.9, null, "Status headlines"],
  ["Heading/3", 600, 30, 36, -0.6, null, "Dialog and panel titles"],
  ["Heading/Section", 600, 20, 28, -0.3, null, "Section titles"],
  ["Heading/Section tight", 600, 20, 26, -0.3, null, "Card section titles"],
  ["Heading/Card", 600, 18, 28, 0, null, "Card titles"],
  ["Wordmark", 700, 18, 28, -0.18, null, "Mellow logo"],
  ["Body/Large", 400, 17, 25.5, 0, null, "Lead paragraphs"],
  ["Body/Large strong", 600, 17, 25.5, 0, null, "Questions, emphasis"],
  ["Body/16", 400, 16, 24, 0, null, "Form text"],
  ["Body", 400, 15, 22.5, 0, null, "Default text"],
  ["Body/Medium", 500, 15, 22.5, 0, null, "Buttons, navigation"],
  ["Body/Strong", 600, 15, 22.5, 0, null, "Titles in lists"],
  ["Button/Large", 600, 16, 24, 0, null, "Primary buttons"],
  ["Input/Value", 400, 16, 19.2, 0, null, "Values inside inputs"],
  ["Label", 600, 14, 20, 0, null, "Field labels"],
  ["Small", 400, 14, 20, 0, null, "Hints, small text"],
  ["Small/Medium", 500, 14, 20, 0, null, "Chips"],
  ["Caption", 400, 13, 19.5, 0, null, "Metadata"],
  ["Caption/Medium", 500, 13, 19.5, 0, null, "Badges"],
  ["Caption/Strong", 600, 13, 19.5, 0, null, "Errors, short labels"],
  ["Eyebrow", 600, 13, 19.5, 1.04, "UPPER", "Small capitals above titles"],
  ["Micro/Strong", 600, 12, 16, 0, null, "Tags"],
];

// ---------- components ----------
// Each rule picks frames by tag, classes, name or state. `prop` and `value` make variants of one component set.
const has = (n, ...c) => c.every((x) => (" " + (n.cls || "") + " ").includes(" " + x + " "));
const kids = (n) => n.children || [];
const content = (n) => kids(n).map((c) => (c.type === "TEXT" ? "Text" : c.svgKey ? "Icon" : "Frame")).join(" + ") || "Empty";
const valueText = (n) => kids(n).some((c) => c.name === "value");
const texts = (n, out = []) => { if (n.type === "TEXT") out.push(n.characters); kids(n).forEach((c) => texts(c, out)); return out; };
export const COMPONENTS = [
  { name: "Logo", prop: "Size", pick: (n) => n.tag === "a" && has(n, "text-lg", "font-bold", "min-w-11"), value: (n) => (kids(n).length > 1 ? "Full" : "Mark only"), auto: true },
  { name: "Avatar", pick: (n) => n.tag === "button" && n.ctl?.name === "Account" && has(n, "rounded-full", "bg-accent-tint"), auto: true },
  { name: "Ask Mel button", pick: (n) => n.tag === "button" && has(n, "pl-2", "rounded-full") && /Ask Mel/.test(n.ctl?.name || ""), auto: true },
  { name: "Nav item", prop: "State", pick: (n) => n.tag === "a" && has(n, "min-h-11", "rounded-full", "px-3", "sm:px-[18px]"), value: (n) => (n.aria?.current === "page" ? "Current" : "Default"), auto: true },
  { name: "Button", prop: "Type, Content",
    pick: (n) => (n.tag === "button" || n.tag === "a") && (has(n, "press", "bg-ink", "min-h-12") || has(n, "bg-danger", "rounded-full") || (has(n, "inline-flex", "border-line-strong", "bg-surface", "px-4", "font-medium", "rounded-full") && !has(n, "pl-2") && !has(n, "justify-start") && !has(n, "px-3.5"))),
    value: (n) => `Type=${has(n, "bg-ink") ? "Primary" : has(n, "bg-danger") ? "Danger" : "Secondary"}, Content=${content(n)}`, auto: true },
  { name: "Icon button", pick: (n) => n.tag === "button" && has(n, "size-11", "rounded-full") && kids(n).length === 1 && kids(n)[0].svgKey, value: () => "Default", auto: true },
  { name: "Chip/Setting", pick: (n) => n.tag === "button" && has(n, "inline-flex", "rounded-full", "border-line-strong", "px-3.5"), auto: true },
  { name: "Chip/Example", pick: (n) => n.tag === "button" && has(n, "min-h-11", "rounded-full", "border-line-strong", "px-3.5", "text-sm") && !has(n, "inline-flex"), auto: true },
  { name: "Chip/Question", prop: "State", pick: (n) => n.tag === "button" && has(n, "min-h-11", "rounded-full", "border-2", "px-4", "text-left"), value: (n) => (n.aria?.pressed === "true" ? "Asked" : "Default"), auto: true },
  { name: "Suggestion", pick: (n) => n.tag === "button" && has(n, "inline-flex", "rounded-full", "justify-start", "text-left"), auto: true },
  { name: "Toolbar button", prop: "State", pick: (n) => n.tag === "button" && has(n, "flex", "min-h-11", "items-center", "gap-2", "rounded-full", "px-4", "font-medium") && !has(n, "border"), value: (n) => (n.aria?.expanded === "true" ? "Open" : "Default"), auto: true },
  { name: "Badge", pick: (n) => n.tag === "span" && has(n, "rounded-full", "border", "px-3", "py-1"), auto: true },
  { name: "Input", prop: "State", pick: (n) => n.tag === "input" && has(n, "min-h-12", "rounded-2xl") && n.ctl?.type !== "password" && !/font-mono/.test(n.cls), value: (n) => (has(n, "border-danger") ? "Error" : valueText(n) ? "Filled" : "Empty") },
  { name: "Input/Color code", prop: "State", pick: (n) => n.tag === "input" && has(n, "font-mono"), value: (n) => (has(n, "border-danger") ? "Error" : "Default") },
  { name: "Select", pick: (n) => n.tag === "select" },
  { name: "Password input", prop: "State", pick: (n) => n.tag === "div" && kids(n).length === 2 && kids(n)[0].tag === "input" && kids(n)[1].ctl?.name === "Show password", value: (n) => (has(kids(n)[0], "border-danger") ? "Error" : valueText(kids(n)[0]) ? "Filled" : "Empty") },
  { name: "Checkbox", prop: "State", pick: (n) => n.tag === "input" && n.ctl?.type === "checkbox", value: (n) => (n.aria?.checked === "true" ? "Checked" : "Unchecked") },
  { name: "Radio", prop: "State", pick: (n) => n.tag === "input" && n.ctl?.type === "radio", value: (n) => (n.aria?.checked === "true" ? "Selected" : "Default") },
  { name: "Toggle", prop: "State", pick: (n) => n.tag === "button" && n.ctl?.role === "switch", value: (n) => (n.aria?.checked === "true" ? "On" : "Off") },
  { name: "Stepper step", prop: "State", pick: (n) => n.tag === "li" && has(n, "min-h-11", "rounded-full", "pl-2.5"), value: (n) => (n.aria?.current === "step" ? "Current" : kids(n)[0] && kids(n)[0].children && kids(n)[0].children.some((c) => c.svgKey) ? "Done" : "Upcoming") },
  { name: "Outline section", prop: "State", pick: (n) => n.tag === "li" && has(n, "flex", "rounded-[20px]", "bg-surface") && (n.aria?.current === "true" || JSON.stringify(kids(n).map((k) => k.ctl?.name || "")).match(/"\d/)), value: (n) => (n.aria?.current === "true" ? "Selected" : "Default") },
  { name: "Layout option", prop: "State", pick: (n) => n.tag === "button" && has(n, "flex-col", "rounded-[20px]", "border-2", "p-2", "text-left"), value: (n) => (n.aria?.pressed === "true" ? "Selected" : "Default") },
  { name: "Option chip", prop: "State", pick: (n) => n.tag === "button" && has(n, "min-h-11", "rounded-full", "bg-surface", "px-4") && !has(n, "inline-flex") && n.aria?.pressed !== undefined, value: (n) => (n.aria?.pressed === "true" ? "Selected" : "Default"), auto: true },
  { name: "Card/Start option", pick: (n) => n.tag === "button" && has(n, "lift", "min-h-20") },
  { name: "Card/Recent deck", prop: "Status", pick: (n) => n.tag === "a" && has(n, "lift", "rounded-[22px]", "p-2.5", "border", "border-line"), value: (n) => { const t = texts(n).join(" "); return /Writing slide/.test(t) ? "Writing" : /Outline waiting/.test(t) ? "Outline" : "Ready"; } },
  { name: "Card/Theme", prop: "State, Theme", pick: (n) => n.tag === "button" && has(n, "lift", "relative", "border-2", "rounded-[22px]"), value: (n) => `State=${has(n, "border-ink") ? "Selected" : "Default"}, Theme=${texts(n).find((t) => t !== "Aa") || "Theme"}` },
  { name: "Card/Slide", prop: "State", pick: (n) => n.tag === "a" && has(n, "lift", "rounded-[22px]", "border-2", "border-line-select"), value: (n) => (/Writing/.test(texts(n).join(" ")) ? "Writing" : "Done") },
  { name: "Slide thumbnail", prop: "State", pick: (n) => n.tag === "button" && has(n, "items-start", "gap-2", "text-left") && /^Slide \d/.test(n.ctl?.name || ""), value: (n) => (n.aria?.current === "true" || n.aria?.current === "page" ? "Current" : "Default") },
  { name: "FAQ item", prop: "State", pick: (n) => n.tag === "details", value: (n) => (kids(n).length > 1 ? "Open" : "Closed") },
  { name: "Save bar", prop: "State", pick: (n) => has(n, "sticky", "bottom-4", "z-20"), value: (n) => (/Changes saved/.test(JSON.stringify(n)) ? "Saved" : "Unsaved") },
  { name: "Account menu", pick: (n) => has(n, "pop", "absolute", "right-0", "top-14", "z-40") },
  { name: "Ask Mel panel", pick: (n) => has(n, "pop", "z-40") && /md:w-\[380px\]/.test(n.cls || "") },
  { name: "Chat bubble", pick: (n) => n.tag === "div" && /rounded-\[20px_20px_6px_20px\]/.test(n.cls || "") && has(n, "bg-accent-tint") },
];
