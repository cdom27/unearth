import type { Metadata } from "next";
import Link from "next/link";
import LinkButton from "../_components/ui/link-button/link-button";

export const metadata: Metadata = {
  title: "About Unearth News",
  description:
    "Learn how Unearth helps readers examine news reporting, investigate claims, and make up their own minds.",
  alternates: {
    canonical: "/about",
  },
};

const analysisSteps = [
  {
    number: "01",
    title: "Summary and quotes",
    text: "Our AI summarizes the article and selects a few quotes that help explain its central issue.",
  },
  {
    number: "02",
    title: "Framing and sourcing",
    text: "Our analysis examines the article’s framing, sourcing, language, and rhetorical choices. It focuses on what appears in the text rather than guessing at an author’s motives or ideology.",
  },
  {
    number: "03",
    title: "Claims and evidence",
    text: "Our AI identifies a few important factual claims, then searches the web for relevant evidence, prioritizing primary sources and independent reporting when available.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-4 sm:mx-12 lg:mx-18 xl:mx-24 2xl:mx-auto 2xl:max-w-325">
      <section className="flex flex-col items-start gap-7 border-b border-clay-200 py-12 sm:py-16 md:py-22">
        <h1 className="max-w-220 font-serif text-5xl leading-[1.05] sm:text-6xl md:text-7xl">
          A Closer Look at the News{" "}
          <br className="hidden lg:block" />
          You Read
        </h1>
        <p className="max-w-175 text-lg leading-relaxed">
          Unearth examines how articles are written, what claims they make, and
          what outside evidence supports them. Explore a story in more depth
          and decide for yourself what to make of it.
        </p>
        <LinkButton href="/register" className="mt-2 inline-flex items-center">
          Create your free account
        </LinkButton>
      </section>

      <section className="grid gap-8 border-b border-clay-200 py-12 sm:py-16 md:grid-cols-[0.8fr_1.2fr] md:gap-16 md:py-20">
        <div>
          <h2 className="font-serif text-4xl leading-tight sm:text-5xl">
            Tools for your own research
          </h2>
        </div>
        <div className="flex flex-col gap-5 text-lg leading-relaxed">
          <p>
            Unearth uses AI to summarize articles, examine their framing and
            sourcing, and find outside evidence related to important claims.
            These views can help you see what is being reported and what the
            available evidence supports.
          </p>
          <p>
            The analysis is a starting point for your own research. It does not
            replace reading carefully, thinking critically, or deciding what
            you believe.
          </p>
        </div>
      </section>

      <section className="border-b border-clay-200 py-12 sm:py-16 md:py-20">
        <div className="mb-10 max-w-180">
          <h2 className="font-serif text-4xl leading-tight sm:text-5xl">
            What an article analysis includes
          </h2>
        </div>
        <ol className="grid gap-0 md:grid-cols-3 md:divide-x md:divide-clay-200">
          {analysisSteps.map((step) => (
            <li
              key={step.number}
              className="border-t border-clay-200 py-7 md:border-t-0 md:px-7 md:py-0 first:md:pl-0 last:md:pr-0"
            >
              <span className="font-serif text-3xl text-clay-400">
                {step.number}
              </span>
              <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 leading-relaxed">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-8 border-b border-clay-200 py-12 sm:py-16 md:grid-cols-2 md:gap-16 md:py-20">
        <div>
          <h2 className="font-serif text-4xl leading-tight sm:text-5xl">
            Source ratings and article analysis
          </h2>
        </div>
        <div className="flex flex-col gap-5 leading-relaxed">
          <p>
            Unearth brings together breaking news, analyzed articles, and
            ratings for media sources. Ratings from organizations such as
            AllSides and Media Bias/Fact Check provide background on a
            publication.
          </p>
          <p>
            Source ratings describe a publication broadly. They do not tell you
            whether a particular article is accurate or complete, so consider
            them alongside the article and its evidence.
          </p>
          <Link
            href="/media-ratings"
            className="w-fit font-semibold underline decoration-clay-400 underline-offset-4 hover:decoration-clay-900"
          >
            Explore source ratings
          </Link>
        </div>
      </section>

      <section className="grid gap-8 border-b border-clay-200 py-12 sm:py-16 md:grid-cols-2 md:gap-16 md:py-20">
        <div>
          <h2 className="font-serif text-4xl leading-tight sm:text-5xl">
            Why some articles cannot be analyzed
          </h2>
        </div>
        <div className="flex flex-col gap-5 leading-relaxed">
          <p>
            Unearth analyzes article text that it can access and parse. Some
            publishers block automated access, use technical protections, set
            limits in their terms of use, or place articles behind a paywall.
            If the text is incomplete or unavailable, an analysis may be
            limited or may not be possible.
          </p>
          <p>
            We are working on improved ways to retrieve article text where
            access is permitted. This will not make every publisher or
            paywalled article available.
          </p>
        </div>
      </section>

      <section className="grid gap-8 py-12 sm:py-16 md:grid-cols-[0.8fr_1.2fr] md:gap-16 md:py-20">
        <div>
          <h2 className="font-serif text-4xl leading-tight sm:text-5xl">
            AI analysis has limits
          </h2>
        </div>
        <div className="flex flex-col gap-5 text-lg leading-relaxed">
          <p>
            AI can miss context, misread language, or get things wrong. Search
            results and source material may be incomplete. A claim’s assessment
            can change as new evidence becomes available, and credible sources
            may offer different interpretations.
          </p>
          <p>
            Follow the linked evidence and read beyond the summary. Use the
            analysis to guide your research, then make up your own mind.
          </p>
        </div>
      </section>

      <section className="mb-12 flex flex-col items-center gap-5 bg-clay-100 px-6 py-10 text-center sm:mb-16 sm:px-12 sm:py-14 md:mb-20">
        <h2 className="font-serif text-4xl sm:text-5xl">
          Explore how stories are built
        </h2>
        <p className="max-w-140 leading-relaxed">
          Analyze articles, explore claims, and see what the available evidence
          supports.
        </p>
        <LinkButton href="/register" className="inline-flex items-center">
          Sign up for free
        </LinkButton>
      </section>
    </div>
  );
}
