import Link from "next/link";
import { MelFace } from "@/components/mel";
import { MelDemo } from "@/components/mel-demo";
import { THEMES, ThemeThumb } from "@/components/themes";
import { Icon, Logo, card, cx, eyebrow, panel, pill, primary } from "@/components/ui";

const h2 = "text-4xl font-semibold leading-[1.2] tracking-[-0.025em]";
const tile = "flex size-11 items-center justify-center rounded-[14px] bg-accent-tint font-semibold";

const AUDIENCES = [
  ["Teachers", "Lesson decks with speaker notes and a quiz slide at the end.", "“A lesson on the water cycle for grade 5”"],
  ["Students", "Turn your research notes into a clear class presentation.", "“A book report on a novel I just finished”"],
  ["Founders", "Pitch decks that tell one story, from problem to ask.", "“A pitch for a neighborhood bike repair co-op”"],
  ["Teams", "Monthly updates and onboarding guides in your brand colors.", "“An onboarding guide for our remote team”"],
];

const QUESTIONS = [
  [
    "Do I need design skills?",
    "No. You write what the deck is about and Mellow handles layout, type and color. Every slide stays editable if you want to adjust it.",
  ],
  [
    "Can I change the slides after they are made?",
    "Yes. Edit text and layout directly, or ask Mel for a change. Every change Mel makes can be undone.",
  ],
  ["What can I start from?", "A one-sentence prompt, a pasted outline, a document, a web page, or a blank deck."],
  ["Which file formats can I download?", "PDF on every plan, and PowerPoint (.pptx) on Pro."],
  ["Which languages does Mellow write in?", "English for now. Bahasa Indonesia is next."],
];

const OUTLINE = ["Why a co-op, why now", "How membership works", "What we need by spring", "How you can help"];

function Heading({ title }: { kicker?: string; title: string }) {
  return <h2 className={h2}>{title}</h2>;
}

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col text-base">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-10 py-4">
        <Logo href="/" compact="narrow" />
        <nav aria-label="Main" className="hidden flex-wrap gap-1 text-[0.9375rem] lg:flex">
          {[
            ["How it works", "#how"],
            ["Why Mellow", "#why"],
            ["Themes", "#themes"],
            ["Who it is for", "#who"],
            ["Pricing", "#pricing"],
            ["Questions", "#faq"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="flex min-h-11 items-center rounded-full px-4 font-medium text-muted">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 text-[0.9375rem]">
          <Link href="/login" className="flex min-h-11 items-center px-4 font-semibold">
            Log in
          </Link>
          <Link href="/signup" className={cx(pill, "press px-5 font-semibold")}>
            Try Mellow
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1168px] flex-col gap-24 px-4 pb-24 pt-12 md:gap-32 md:px-6 md:pb-32 md:pt-16">
        {/* Hero */}
        <section className="flex flex-col gap-12">
          <div className="flex flex-col items-start gap-4">
            <div className={eyebrow}>AI slide maker</div>
            <h1 className="max-w-[880px] text-[4rem] font-semibold leading-[1.1] tracking-[-0.03em] max-md:text-[2.5rem]">
              From <span className="rounded-2xl bg-accent px-3">one sentence</span> to a deck you would actually present
            </h1>
            <p className="max-w-[620px] text-[1.1875rem] text-muted">
              Describe your idea. Mellow drafts an outline for you to review, then writes and designs the slides while you
              watch.
            </p>
            <div className="flex w-full max-w-[720px] flex-col gap-2 pt-3 text-left">
              <label htmlFor="idea" className="pl-[22px] text-[0.8125rem] font-semibold text-muted">
                Describe your deck
              </label>
              <div className="flex flex-wrap items-center gap-2 rounded-[34px] border border-line-input bg-surface py-2 pl-[22px] pr-2 shadow-soft has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ink">
                <input
                  id="idea"
                  type="text"
                  placeholder="A 10-slide pitch for a neighborhood bike repair co-op"
                  className="min-h-12 min-w-0 flex-[1_1_min(260px,100%)] bg-transparent text-[1.0625rem] focus-visible:outline-none"
                />
                <Link href="/create" className={primary}>
                  Draft my outline
                  <Icon name="arrow" stroke={2} />
                </Link>
              </div>
              <p className="pl-[22px] text-sm text-muted">
                No design skills needed. Nothing is designed until you approve the outline.
              </p>
            </div>
          </div>

          <div id="how" className={cx(panel, "in d2 grid scroll-mt-6 grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4 p-4 xl:-mx-12")}>
            <div className="flex flex-col gap-3 rounded-xl bg-ground p-4">
              <div className="text-[0.8125rem] font-semibold text-muted">1. Your prompt</div>
              <div className="text-[0.9375rem]">
                A 10-slide pitch for a neighborhood bike repair co-op: why it matters, how membership works, and what we need
                to open by spring.
              </div>
              <div className="mt-auto flex flex-wrap gap-1.5">
                {["10 slides", "Friendly tone"].map((t) => (
                  <span key={t} className="rounded-full border border-line-strong bg-surface px-3 py-1 text-[0.8125rem] font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-xl bg-ground p-4">
              <div className="pb-1 text-[0.8125rem] font-semibold text-muted">2. The outline you review</div>
              {OUTLINE.map((line, i) => (
                <div key={line} className="flex items-center gap-2.5 rounded-[10px] bg-surface px-2.5 py-2 text-sm font-medium">
                  <span className="flex size-6 items-center justify-center rounded-lg bg-accent-tint text-xs font-semibold">
                    {i + 1}
                  </span>
                  {line}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 rounded-xl bg-ground p-4">
              <div className="text-[0.8125rem] font-semibold text-muted">3. Finished slides</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex aspect-video flex-col justify-end gap-1 rounded-lg bg-accent p-2.5">
                  <span className="text-[0.6875rem] font-bold leading-[1.15]">Fix it together</span>
                  <span className="h-[3px] w-2/5 rounded-sm bg-ink" />
                </div>
                <div className="flex aspect-video flex-col gap-1 rounded-lg bg-surface p-2.5">
                  <span className="h-1 w-1/2 rounded-sm bg-ink" />
                  <span className="mt-[3px] h-[3px] w-[86%] rounded-sm bg-[#C9CEC6]" />
                  <span className="h-[3px] w-[70%] rounded-sm bg-[#C9CEC6]" />
                  <span className="h-[3px] w-[78%] rounded-sm bg-[#C9CEC6]" />
                </div>
                <div className="flex aspect-video gap-1.5 rounded-lg bg-surface p-2.5">
                  <span className="flex flex-1 flex-col gap-1">
                    <span className="h-1 w-[70%] rounded-sm bg-ink" />
                    <span className="mt-[3px] h-[3px] w-[90%] rounded-sm bg-[#C9CEC6]" />
                    <span className="h-[3px] w-3/5 rounded-sm bg-[#C9CEC6]" />
                  </span>
                  <span className="flex-1 rounded-[5px] bg-sage-100" />
                </div>
                <div className="flex aspect-video flex-col gap-1 rounded-lg bg-surface p-2.5">
                  <span className="h-1 w-[44%] rounded-sm bg-ink" />
                  <span className="mt-auto flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-[18px] flex-1 rounded bg-sage-100" />
                    ))}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-xl bg-ground p-4">
              <div className="pb-1 text-[0.8125rem] font-semibold text-muted">4. Share it</div>
              <div className="flex items-center gap-2.5 rounded-[10px] bg-surface px-2.5 py-2 text-sm font-medium">
                <Icon name="link" size={16} />
                {/* The link may only wrap after the slash, never at the hyphens. */}
                <span className="min-w-0">
                  <span className="whitespace-nowrap">mellow-romeo.vercel.app/</span>
                  <wbr />
                  <span className="whitespace-nowrap">d/bike-co-op</span>
                </span>
              </div>
              <div className="flex items-center gap-2.5 rounded-[10px] bg-surface px-2.5 py-2 text-sm font-medium">
                <Icon name="play" size={14} filled />
                Present in the browser
              </div>
              <div className="flex items-center gap-2.5 rounded-[10px] bg-surface px-2.5 py-2 text-sm font-medium">
                <Icon name="file" size={16} />
                Download as PDF or PowerPoint
              </div>
            </div>
          </div>
        </section>

        {/* Why Mellow */}
        <section id="why" className="reveal flex flex-col gap-8">
          <h2 className={h2}>Calm tools for people who are not designers</h2>

          <div className="grid items-center gap-8 md:grid-cols-2">
            <div aria-hidden="true" className="flex flex-col gap-3 rounded-[28px] border border-line bg-surface p-6 shadow-soft">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-sage-50">
                  <MelFace size={26} />
                </span>
                <span className="font-semibold">Mel</span>
              </div>
              <div className="max-w-[85%] self-end rounded-[20px_20px_6px_20px] bg-accent-tint px-4 py-2.5">
                Make this slide simpler for fifth graders.
              </div>
              <div className="max-w-[90%] rounded-[20px_20px_20px_6px] bg-ground px-4 py-2.5">
                Done. I cut the text down to three short points.
              </div>
              <span className="inline-flex min-h-10 items-center self-start rounded-full border border-line-strong px-4 text-sm font-medium">
                Undo changes
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-2xl font-semibold tracking-[-0.015em]">Change a slide by asking</h3>
              <p className="max-w-[460px] text-[1.0625rem] text-muted">
                Tell Mel what you want in plain words. Every change Mel makes comes with an undo, so trying an idea costs nothing.
              </p>
            </div>
          </div>

          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <h3 className="text-2xl font-semibold tracking-[-0.015em]">Start from what you already have</h3>
              <p className="max-w-[460px] text-[1.0625rem] text-muted">
                Meeting notes, a report or an article can all become the first draft of a deck. Or start blank and build it yourself.
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-3">
              {(
                [
                  ["list", "Notes or an outline"],
                  ["file", "A PDF or Word file"],
                  ["link", "A web page"],
                  ["plus", "A blank deck"],
                ] as const
              ).map(([icon, label]) => (
                <li key={label} className={cx(card, "flex min-h-24 flex-col justify-between gap-3 p-4")}>
                  <span className={tile}>
                    <Icon name={icon} size={20} />
                  </span>
                  <span className="font-semibold">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div id="themes" className="flex flex-col gap-3.5">
            <h3 className="text-lg font-semibold">Five themes to start with. Swap any time, your content stays put.</h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-4">
              {THEMES.map((theme) => (
                <div key={theme.id} className="flex flex-col gap-2.5 rounded-[22px] border border-line bg-surface p-2.5">
                  <ThemeThumb id={theme.id} />
                  <span className="flex flex-col px-1 pb-0.5 text-[0.9375rem]">
                    <span className="font-semibold">{theme.name}</span>
                    <span className="text-[0.8125rem] text-muted">{theme.blurb}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who it is for */}
        <section id="who" className="reveal flex flex-col gap-8">
          <Heading kicker="Who it is for" title="Made for the deck that is due tomorrow" />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
            {AUDIENCES.map(([title, text, example]) => (
              <figure key={title} className={cx(card, "m-0 flex flex-col gap-3 p-6")}>
                <figcaption className={eyebrow}>{title}</figcaption>
                <p className="text-lg font-medium leading-snug">{example}</p>
                <p className="mt-auto text-sm text-muted">{text}</p>
              </figure>
            ))}
          </div>
        </section>

        {/* Mel */}
        <section id="mel" aria-labelledby="mel-title" className={cx(panel, "reveal flex scroll-mt-6 flex-col gap-8 p-6 md:p-10")}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 flex-[1_1_min(360px,100%)] flex-col gap-3">
              <div className={eyebrow}>Your helper</div>
              <h2 id="mel-title" className={h2}>
                Stuck? Ask Mel.
              </h2>
              <p className="max-w-[560px] text-[1.0625rem] text-muted">
                Mel is the helper on every screen. Try it here: pick a question.
              </p>
            </div>
            <Link href="/mel" className={cx(pill, "press text-[0.9375rem] font-semibold")}>
              Meet Mel
              <Icon name="arrow" stroke={2} />
            </Link>
          </div>
          <MelDemo />
        </section>

        {/* Pricing: example plans for the prototype */}
        <section id="pricing" className="reveal flex flex-col gap-8">
          <Heading kicker="Pricing" title="Pick a plan when you are ready" />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4">
            <div className={cx(card, "flex flex-col gap-4 p-7")}>
              <h3 className="text-lg font-semibold">Free</h3>
              <div className={h2}>$0/month</div>
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[0.9375rem] text-muted">
                <li>3 decks a month</li>
                <li>Up to 15 slides per deck</li>
                <li>PDF downloads</li>
              </ul>
              <Link href="/signup" className={cx(pill, "press mt-auto min-h-12 font-semibold")}>
                Start with this plan
              </Link>
            </div>
            <div className="flex flex-col gap-4 rounded-[20px] border-2 border-ink bg-surface p-7">
              <h3 className="text-lg font-semibold">Pro</h3>
              <div className={h2}>$8/month</div>
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[0.9375rem] text-muted">
                <li>Unlimited decks</li>
                <li>Up to 50 slides per deck</li>
                <li>Brand kit and PowerPoint downloads</li>
              </ul>
              <Link href="/signup" className={cx(primary, "mt-auto")}>
                Choose this plan
              </Link>
            </div>
          </div>
        </section>

        {/* Questions */}
        <section id="faq" className="reveal flex flex-col gap-8">
          <Heading kicker="Questions" title="Things people ask before they start" />
          <div className="flex flex-col gap-2">
            {QUESTIONS.map(([question, answer], i) => (
              <details key={question} open={i === 0} className={cx(card, "px-6")}>
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 text-[1.0625rem] font-semibold [&::-webkit-details-marker]:hidden">
                  {question}
                  <Icon name="chevron" stroke={2} />
                </summary>
                <p className="max-w-[720px] pb-[22px] text-muted">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Closing */}
        <section className="reveal flex flex-col items-center gap-4 rounded-[28px] bg-accent-tint px-6 py-14 text-center">
          <h2 className={h2}>What will you present next?</h2>
          <p className="max-w-[520px] text-[1.0625rem]">Write one sentence and see the outline before anything is designed.</p>
          <Link href="/signup" className={cx(primary, "mt-2")}>
            Try Mellow
            <Icon name="arrow" stroke={2} />
          </Link>
        </section>
      </main>

      <footer className="mt-auto border-t border-line px-4 py-8 md:px-10">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-x-10 gap-y-4 text-[0.9375rem]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Logo href="/" />
            <p className="text-muted">Calm slides from a single sentence.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5">
            {[
              ["Pricing", "#pricing"],
              ["Questions", "#faq"],
              ["Meet Mel", "/mel"],
              ["Contact us", "#"],
              ["Privacy", "#"],
              ["Terms", "#"],
            ].map(([label, href]) => (
              <a key={label} href={href} className="flex min-h-11 items-center text-muted">
                {label}
              </a>
            ))}
          </nav>
          <p className="w-full text-[0.8125rem] text-muted">© 2026 Mellow</p>
        </div>
      </footer>
    </div>
  );
}
