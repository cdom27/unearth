import { getAnalysis } from "@/app/_lib/db/queries";
import timeSince from "@/app/_lib/utils/timeSince";
import ShareActions from "./_components/share-actions";
import { notFound } from "next/navigation";
import Placeholder from "@/app/_assets/images/placeholder.webp";
import Image from "next/image";
import Scale from "@/app/_components/ui/scale/scale";
import InfoIcon from "@/app/_components/icons/info";
import ArticleBadge from "@/app/_components/ui/article-cards/article-badge";
import Table from "@/app/_components/ui/table/table";
import CollapsibleTableRow from "@/app/_components/ui/table/collapsible-table-row";
import ExplanationPopover from "@/app/_components/ui/tooltip/explanation-popover";
import ArticleTimeline, {
  TableOfContentsItem,
} from "./_components/article-timeline";
import ExpandableContent from "./_components/expandable-content";
import ExpandableCard from "@/app/_components/ui/expandable-card/expandable-card";
import { getRelatedArticles } from "./related-articles";
import RelatedArticleCard from "@/app/_components/ui/article-cards/related-article-card";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const analysisDetails = await getAnalysis(slug);

  if (!analysisDetails) notFound();

  const { article, analysis, source } = analysisDetails;
  const relatedArticles = getRelatedArticles(
    analysis.claims?.flatMap((claim) => claim.verification?.results ?? []) ??
      [],
    article.url,
  );
  const shareUrl = `https://unearth.news/article/${slug}`;
  const hasText = (value: string | null | undefined): value is string =>
    Boolean(value?.trim());
  const hasQuotes = Boolean(analysis.summary?.quotes.length);
  const hasNarrative = hasText(analysis.framing?.narrative);
  const hasBalance = Boolean(
    analysis.framing?.sourcing?.balance ||
    hasText(analysis.framing?.sourcing?.notes),
  );
  const hasTerms = Boolean(analysis.framing?.terms.length);
  const hasDevices = Boolean(analysis.framing?.devices.length);
  const hasClaims = Boolean(analysis.claims?.length);
  const hasValidScore = (value: number | null) =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1;
  const biasScore = hasValidScore(analysis.biasScore)
    ? analysis.biasScore
    : null;
  const factualScore = hasValidScore(analysis.factualScore)
    ? analysis.factualScore
    : null;
  const tableOfContentsItems: TableOfContentsItem[] = [
    { id: "summary", label: "Summary", main: true },
    ...(hasText(analysis.summary?.tldr)
      ? [{ id: "general-summary", label: "General Summary" }]
      : []),
    ...(hasQuotes ? [{ id: "direct-quotes", label: "Direct Quotes" }] : []),
    { id: "fact-check", label: "Fact Check", main: true },
    ...(hasClaims ? [{ id: "reported-claims", label: "Reported Claims" }] : []),
    { id: "rhetorical-analysis", label: "Rhetorical Analysis", main: true },
    ...(hasNarrative ? [{ id: "narrative", label: "Narrative" }] : []),
    ...(hasBalance
      ? [{ id: "reporting-balance", label: "Reporting Balance" }]
      : []),
    ...(hasTerms ? [{ id: "term-analysis", label: "Term Analysis" }] : []),
    ...(hasDevices
      ? [{ id: "rhetorical-devices", label: "Rhetorical Devices" }]
      : []),
  ];

  let formattedSentiment = "Unverified";

  if (analysis.sentiment) {
    formattedSentiment =
      analysis.sentiment.slice(0, 1).toUpperCase() +
      analysis.sentiment.slice(1).toLowerCase();
  }

  function formatValue(sourcing: string) {
    const words = sourcing.split("-");
    return (
      words[0].charAt(0).toUpperCase() +
      words[0].slice(1) +
      " " +
      words.slice(1).join(" ").trim()
    );
  }

  const analyzedTime = timeSince(analysis.updatedAt);
  const publishedTime = timeSince(article.publishedTime);

  return (
    <>
      <section className="m-4 sm:my-6 sm:mx-12 md:my-10 xl:my-16 2xl:my-22 pb-8 sm:pb-12 md:pb-16 xl:pb-22 2xl:pb-28 lg:mx-18 xl:mx-24 2xl:mx-auto 2xl:max-w-325 flex flex-col gap-8 sm:gap-12 border-b border-clay-200">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5 text-sm">
              <span>
                Published{" "}
                {publishedTime === "Now" ? "just now" : `${publishedTime} ago`}
              </span>
              <div className="size-1.5 bg-clay-900 rounded-full" />
              <span>
                Analyzed{" "}
                {analyzedTime === "Now" ? "just now" : `${analyzedTime} ago`}
              </span>
            </div>

            <ShareActions articleTitle={article.title} shareUrl={shareUrl} />
          </div>

          <h1 className="text-4xl leading-tight sm:text-5xl lg:text-7xl font-serif">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span>{article.byline}</span>
            <div className="size-1.5 bg-clay-900 rounded-full" />
            <a
              href={`https://${source.url}?ref=unearth.news`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline underline-offset-4 decoration-clay-200 hover:decoration-clay-400 transition-colors duration-300"
            >
              {source.name}
            </a>
          </div>

          <section className="mt-8 flex flex-col gap-10 sm:mt-12 lg:flex-row lg:gap-16">
            <h2 className="sr-only" id="summary">
              Summary
            </h2>

            <div className="flex min-w-0 w-full flex-col gap-10 sm:gap-12 lg:sticky lg:top-6 lg:self-start lg:w-2/3">
              <div className="flex flex-col gap-2">
                <ExplanationPopover
                  content={`Neutral summaries are based on AI-assisted methods in an attempt to extract the core idea of the article.`}
                  className="self-start"
                >
                  <h3
                    className="font-bold flex items-center gap-1.5"
                    id="general-summary"
                  >
                    <span>Summary</span>
                    <InfoIcon className="size-3.5 text-clay-500" />
                  </h3>
                </ExplanationPopover>

                {hasText(analysis.summary?.tldr) ? (
                  <p>{analysis.summary.tldr}</p>
                ) : (
                  <p className="text-clay-500">Not available</p>
                )}
              </div>

              {hasQuotes && analysis.summary ? (
                <div className="flex flex-col gap-4">
                  <ExplanationPopover
                    content={`Direct quotes are the exact words spoken by the speaker, or excerpts, in the article.`}
                    className="self-start"
                  >
                    <h3
                      className="font-bold flex items-center gap-1.5"
                      id="direct-quotes"
                    >
                      <span>Direct Quotes</span>
                      <InfoIcon className="size-3.5 text-clay-500" />
                    </h3>
                  </ExplanationPopover>

                  <ExpandableContent>
                    {analysis.summary.quotes.map((quote, index) => (
                      <figure
                        key={index}
                        className="bg-clay-100 p-4 sm:p-8 rounded-sm border-clay-150 border flex flex-col gap-3"
                      >
                        <blockquote>
                          {hasText(quote.text) ? (
                            <p className="text-2xl font-serif">
                              &ldquo;{quote.text}&rdquo;
                            </p>
                          ) : (
                            <p className="text-clay-500">Quote not available</p>
                          )}
                        </blockquote>
                        {hasText(quote.speaker) ? (
                          <figcaption className="italic ml-auto">
                            &mdash; {quote.speaker}
                          </figcaption>
                        ) : (
                          <figcaption className="italic ml-auto text-clay-500">
                            Speaker not available
                          </figcaption>
                        )}
                      </figure>
                    ))}
                  </ExpandableContent>
                </div>
              ) : null}

              <div className="flex flex-col gap-4" id="fact-check">
                <ExplanationPopover
                  content="Fact checks compare reported claims with available evidence and identify the verdict and supporting findings."
                  className="self-start"
                >
                  <h3 className="font-bold flex items-center gap-1.5">
                    <span>Fact Check</span>
                    <InfoIcon className="size-3.5 text-clay-500" />
                  </h3>
                </ExplanationPopover>

                <div
                  className="grid grid-cols-1 items-start gap-4 xl:gap-6"
                  id="reported-claims"
                >
                  {hasClaims && analysis.claims ? (
                    analysis.claims.map((claim, index) => (
                      <ExpandableCard
                        key={index}
                        defaultOpen={index < 2}
                        summary={
                          <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                            <span className="font-bold text-lg">
                              {claim.content}
                            </span>
                            <ArticleBadge
                              variant="tf"
                              value={formatValue(
                                claim.verification?.output?.content?.verdict ||
                                  "Unverified",
                              )}
                            />
                          </div>
                        }
                      >
                        <h4 className="mb-2 font-bold">Findings</h4>
                        <ul className="list-disc pl-4 flex flex-col gap-1.5">
                          {claim.verification?.output?.content &&
                          claim.verification.output.content.findings.length >
                            0 ? (
                            claim.verification.output.content.findings.map(
                              (finding, findingIndex) => (
                                <li key={findingIndex}>
                                  {finding.statement}{" "}
                                  {claim.verification?.output?.grounding
                                    ?.filter(
                                      (grounding) =>
                                        grounding.field ===
                                        `findings[${findingIndex}].statement`,
                                    )
                                    .map((grounding) =>
                                      grounding.citations
                                        .slice(0, 4)
                                        .map((cit, citationIndex) => (
                                          <ExplanationPopover
                                            key={citationIndex}
                                            content={
                                              <div className="flex flex-col gap-2">
                                                <span>Go to article:</span>
                                                <span className="underline underline-offset-4">
                                                  {cit.title}
                                                </span>
                                              </div>
                                            }
                                          >
                                            <a
                                              href={`${cit.url}?ref=unearth.news`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              <span className="mr-0.5 inline-block size-5 rounded-full bg-clay-900 text-center text-sm text-clay-100">
                                                {citationIndex + 1}
                                              </span>
                                            </a>
                                          </ExplanationPopover>
                                        )),
                                    )}
                                </li>
                              ),
                            )
                          ) : (
                            <li className="list-none text-clay-500">
                              Not available
                            </li>
                          )}
                        </ul>
                      </ExpandableCard>
                    ))
                  ) : (
                    <span className="text-clay-500">Not available</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex min-w-0 w-full flex-col gap-6 lg:sticky lg:top-6 lg:self-start lg:w-1/3">
              <nav
                id="article-table-of-contents"
                className="self-stretch text-clay-150 bg-clay-900 p-4 sm:p-8 rounded-sm border-clay-900 border flex flex-col gap-3 mt-0 lg:mt-6"
              >
                <h3 className="font-bold text-center text-xl sm:text-2xl">
                  Table of Contents
                </h3>

                <article className="flex flex-col items-center gap-2 border-b border-clay-600 pb-6">
                  <Image
                    src={article.thumbnailUrl || Placeholder}
                    alt={article.title}
                    width={400}
                    height={100}
                    className="w-full rounded-sm"
                    loading="eager"
                  />

                  <div>
                    <p className="font-bold">{article.title}</p>

                    <div className="flex flex-col pt-2 gap-2 text-sm">
                      <span className="text-clay-400">
                        Published {timeSince(article.publishedTime)} ago
                      </span>

                      <span>{article.byline}</span>

                      <a
                        href={`https://${source.url}?ref=unearth.news`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="self-start font-bold underline underline-offset-4 decoration-clay-200 hover:decoration-clay-400 transition-colors duration-300"
                      >
                        {source.name}
                      </a>
                    </div>
                  </div>
                </article>

                <ol className="flex flex-col gap-6">
                  <li>
                    <ol>
                      <li className="font-bold text-lg">
                        <a
                          href="#fact-check"
                          className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                        >
                          Fact Check
                        </a>
                      </li>
                      {hasClaims && (
                        <li className="pl-4">
                          <a
                            href="#reported-claims"
                            className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                          >
                            Reported Claims{" "}
                            <span>({analysis.claims?.length})</span>
                          </a>
                        </li>
                      )}
                    </ol>
                  </li>

                  <li>
                    <ol>
                      <li className="font-bold text-lg">
                        <a
                          href="#summary"
                          className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                        >
                          Summary
                        </a>
                      </li>
                      {hasText(analysis.summary?.tldr) || hasQuotes ? (
                        <>
                          {hasText(analysis.summary?.tldr) && (
                            <li className="pl-4">
                              <a
                                href="#general-summary"
                                className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                              >
                                General Summary
                              </a>
                            </li>
                          )}
                          {hasQuotes && analysis.summary && (
                            <li className="pl-4">
                              <a
                                href="#direct-quotes"
                                className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                              >
                                Direct Quotes{" "}
                                <span>({analysis.summary.quotes.length})</span>
                              </a>
                            </li>
                          )}
                        </>
                      ) : null}
                    </ol>
                  </li>

                  <li>
                    <ol>
                      <li className="font-bold text-lg">
                        <a
                          href="#rhetorical-analysis"
                          className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                        >
                          Rhetorical Analysis
                        </a>
                      </li>
                      {(hasNarrative ||
                        hasBalance ||
                        hasTerms ||
                        hasDevices) && (
                        <>
                          {hasNarrative && (
                            <li className="pl-4">
                              <a
                                href="#narrative"
                                className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                              >
                                Narrative
                              </a>
                            </li>
                          )}
                          {hasBalance && (
                            <li className="pl-4">
                              <a
                                href="#reporting-balance"
                                className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                              >
                                Reporting Balance
                              </a>
                            </li>
                          )}
                          {hasTerms && analysis.framing && (
                            <li className="pl-4">
                              <a
                                href="#term-analysis"
                                className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                              >
                                Term Analysis{" "}
                                <span>({analysis.framing.terms.length})</span>
                              </a>
                            </li>
                          )}
                          {hasDevices && analysis.framing && (
                            <li className="pl-4">
                              <a
                                href="#rhetorical-devices"
                                className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                              >
                                Rhetorical Devices{" "}
                                <span>({analysis.framing.devices.length})</span>
                              </a>
                            </li>
                          )}
                        </>
                      )}
                    </ol>
                  </li>
                </ol>
              </nav>

              <div className="flex flex-col gap-2.5 w-full">
                <ExplanationPopover
                  className="self-start"
                  content="Bias Score, Factual Score, and Rhetorical Sentiment are partially AI-assisted estimates of this article's framing, claims, and tone. They evaluate this article, not the source as a whole."
                >
                  <h3 className="font-bold flex items-center gap-1.5">
                    <span>At a glance</span>

                    <InfoIcon className="size-3.5 text-clay-500" />
                  </h3>
                </ExplanationPopover>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-sm">Bias Score</h4>
                    {biasScore !== null ? (
                      <Scale
                        value={biasScore}
                        scaleLabels={["Far Left", "Center", "Far Right"]}
                        colors={["left-500", "clay-200", "right-500"]}
                      />
                    ) : (
                      <p className="text-clay-500">Not available</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-sm">
                      Factual Score{" "}
                      {factualScore !== null
                        ? `(${factualScore * 100}%)`
                        : "(Not available)"}
                    </h4>
                    {factualScore !== null ? (
                      <Scale
                        value={factualScore}
                        scaleLabels={["Very Low", "Mixed", "Very High"]}
                        colors={[
                          "rating-low",
                          "rating-mixed",
                          "rating-very-high",
                        ]}
                      />
                    ) : (
                      <p className="text-clay-500">Not available</p>
                    )}
                  </div>

                  <p>
                    Rhetorical Sentiment:{" "}
                    <span className="font-bold">{formattedSentiment}</span>
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="mx-4 sm:mx-12 pt-4 lg:mx-18 xl:mx-24 2xl:mx-auto 2xl:max-w-325 flex flex-col gap-12">
        <h2 className="font-serif text-4xl" id="rhetorical-analysis">
          Rhetorical Analysis
        </h2>
        <div className="flex flex-col gap-10 sm:gap-12">
          {analysis.framing ? (
            <>
              <div className="flex flex-col gap-8 lg:flex-row lg:gap-16">
                <div className="flex flex-col gap-2 py-2 lg:border-r lg:border-clay-200 lg:pr-16 lg:w-1/2">
                  <ExplanationPopover
                    content={`The narrative is the story told by the author, reflecting their perspective and beliefs.`}
                    className="self-start"
                  >
                    <h3
                      className="font-bold flex justify-between items-center gap-1.5"
                      id="narrative"
                    >
                      <span>The Narrative</span>
                      <InfoIcon className="size-3.5 text-clay-500" />
                    </h3>
                  </ExplanationPopover>

                  {hasNarrative ? (
                    <p>{analysis.framing.narrative}</p>
                  ) : (
                    <p className="text-clay-500">Not available</p>
                  )}
                </div>

                <div className="flex flex-col gap-2.5 py-2 lg:w-1/2">
                  <h3
                    className="font-bold flex justify-between items-center gap-1.5"
                    id="reporting-balance"
                  >
                    <span>Reporting Balance</span>
                    {analysis.framing.sourcing?.balance ? (
                      <ArticleBadge
                        variant="sourcing"
                        value={formatValue(analysis.framing.sourcing.balance)}
                      />
                    ) : (
                      <span className="text-clay-500">Not available</span>
                    )}
                  </h3>

                  {hasText(analysis.framing.sourcing?.notes) ? (
                    <p>{analysis.framing.sourcing.notes}</p>
                  ) : (
                    <p className="text-clay-500">Not available</p>
                  )}
                </div>
              </div>

              {hasTerms ? (
                <div className="flex flex-col gap-2">
                  <h3 className="font-serif text-3xl pb-4" id="term-analysis">
                    Term Analysis
                  </h3>

                  <Table
                    caption="Term analysis"
                    tableClassName="min-w-212.5 table-fixed"
                    columns={[
                      { label: "Term", className: "w-1/4" },
                      { label: "Usage", className: "w-1/2" },
                      { label: "Analysis", className: "w-1/4" },
                    ]}
                  >
                    <tbody>
                      {analysis.framing.terms.map((term) => (
                        <CollapsibleTableRow
                          key={term.term}
                          colSpan={3}
                          summary={
                            <>
                              <th
                                scope="row"
                                className="px-4 py-4 font-semibold"
                              >
                                {term.term}
                              </th>
                              <td className="px-4 py-4 capitalize flex">
                                <ArticleBadge
                                  variant="tone"
                                  value={formatValue(term.tone)}
                                />
                              </td>
                            </>
                          }
                          expandedContent={term.analysis}
                          defaultExpanded
                        />
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : null}

              {hasDevices ? (
                <div className="flex flex-col gap-2">
                  <h3
                    className="font-serif text-3xl pb-4"
                    id="rhetorical-devices"
                  >
                    Rhetorical Devices
                  </h3>

                  <Table
                    caption="Rhetorical Devices"
                    tableClassName="min-w-212.5 table-fixed"
                    columns={[
                      { label: "Device", className: "w-1/4" },
                      { label: "Example in text", className: "w-1/2" },
                      { label: "Analysis", className: "w-1/4" },
                    ]}
                  >
                    <tbody>
                      {analysis.framing.devices.map((device) => (
                        <CollapsibleTableRow
                          key={device.device}
                          colSpan={3}
                          summary={
                            <>
                              <th
                                scope="row"
                                className="px-4 py-4 font-semibold"
                              >
                                {device.device}
                              </th>
                              <td className="px-4 py-4 capitalize flex">
                                {device.example}
                              </td>
                            </>
                          }
                          expandedContent={device.explanation}
                          defaultExpanded
                        />
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : null}
            </>
          ) : (
            <span className="text-clay-500">Not available</span>
          )}
        </div>
      </section>

      <section className="gap-12 m-4 sm:my-6 sm:mx-12 md:mt-10 xl:mt-16 2xl:mt-28 pt-8 sm:pt-12 md:pt-16 xl:pt-22 2xl:pt-28 lg:mx-18 xl:mx-24 2xl:mx-auto 2xl:max-w-325 flex flex-col border-t border-clay-200">
        <h2 className="font-serif text-4xl" id="fact-check">
          Related Articles
        </h2>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 xl:grid-cols-3">
          {relatedArticles.map((article) => (
            <RelatedArticleCard key={article.url} article={article} />
          ))}
        </div>
      </section>

      <ArticleTimeline items={tableOfContentsItems} />
    </>
  );
}
