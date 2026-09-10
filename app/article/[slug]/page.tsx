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

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const analysisDetails = await getAnalysis(slug);

  if (!analysisDetails) notFound();

  const { article, analysis, source } = analysisDetails;
  const shareUrl = `https://unearth.news/article/${slug}`;

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

  return (
    <>
      <section className="m-4 sm:my-6 sm:mx-12 md:my-10 xl:my-16 2xl:my-22 pb-8 sm:pb-12 md:pb-16 xl:pb-22 2xl:pb-28 lg:mx-18 xl:mx-24 2xl:mx-auto 2xl:max-w-325 flex flex-col gap-12 border-b border-clay-200">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm">
              <span>Published {timeSince(article.publishedTime)} ago</span>
              <div className="size-1.5 bg-clay-900 rounded-full" />
              <span>Analyzed {timeSince(analysis.updatedAt)} ago</span>
            </div>

            <ShareActions articleTitle={article.title} shareUrl={shareUrl} />
          </div>

          <h1 className="text-6xl lg:text-7xl font-serif">{article.title}</h1>

          <div className="flex items-center gap-1.5 text-sm">
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

          <section className="flex mt-12 gap-16">
            <h2 className="sr-only" id="summary">
              Summary &amp; Insights
            </h2>

            <div className="flex flex-col gap-12 justify-between w-2/3">
              {analysis.summary ? (
                <>
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

                    <p>{analysis.summary.tldr}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <ExplanationPopover
                      content={`Insights are key extractions from the article that help you understand the report.`}
                      className="self-start"
                    >
                      <h3
                        className="font-bold flex items-center gap-1.5"
                        id="key-insights"
                      >
                        <span>Key Insights</span>
                        <InfoIcon className="size-3.5 text-clay-500" />
                      </h3>
                    </ExplanationPopover>

                    <ul className="flex flex-col gap-4">
                      {analysis.summary.insights.map((insight, index) => (
                        <li
                          key={index}
                          className="bg-clay-100 p-8 rounded-sm border-clay-150 border flex flex-col gap-3"
                        >
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>

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

                    {analysis.summary.quotes.map((quote, index) => (
                      <figure
                        key={index}
                        className="bg-clay-100 p-8 rounded-sm border-clay-150 border flex flex-col gap-3"
                      >
                        <blockquote>
                          <p className="text-2xl font-serif">
                            &ldquo;{quote.text}&rdquo;
                          </p>
                        </blockquote>
                        <figcaption className="italic ml-auto">
                          &mdash; {quote.speaker}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </>
              ) : (
                <span>missing skeleton</span>
              )}
            </div>

            <div className="flex flex-col gap-6">
              <nav className="self-end text-clay-150 bg-clay-900 p-8 rounded-sm border-clay-900 border flex flex-col gap-3 mt-6">
                <h3 className="font-bold text-center text-2xl">
                  Table of Contents
                </h3>

                <article className="flex flex-col items-center gap-2 max-w-xs border-b border-clay-600 pb-6">
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
                          href="#summary"
                          className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                        >
                          Summary
                        </a>
                      </li>
                      <li className="pl-4">
                        <a
                          href="#general-summary"
                          className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                        >
                          General Summary
                        </a>
                      </li>
                      <li className="pl-4">
                        <a
                          href="key-insights"
                          className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                        >
                          Key Insights{" "}
                          {analysis.summary && (
                            <span>({analysis.summary.insights.length})</span>
                          )}
                        </a>
                      </li>
                      <li className="pl-4">
                        <a
                          href="#direct-quotes"
                          className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                        >
                          Direct Quotes{" "}
                          {analysis.summary && (
                            <span>({analysis.summary.quotes.length})</span>
                          )}
                        </a>
                      </li>
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
                      <li className="pl-4">
                        <a
                          href="#narrative"
                          className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                        >
                          Narrative
                        </a>
                      </li>
                      <li className="pl-4">
                        <a
                          href="#reporting-balance"
                          className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                        >
                          Reporting Balance
                        </a>
                      </li>
                      <li className="pl-4">
                        <a
                          href="#term-analysis"
                          className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                        >
                          Term Analysis{" "}
                          {analysis.framing && (
                            <span>({analysis.framing.terms.length})</span>
                          )}
                        </a>
                      </li>
                      <li className="pl-4">
                        <a
                          href="#rhetorical-devices"
                          className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                        >
                          Rhetorical Devices{" "}
                          {analysis.framing && (
                            <span>({analysis.framing.devices.length})</span>
                          )}
                        </a>
                      </li>
                    </ol>
                  </li>

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
                      <li className="pl-4">
                        <a
                          href="#fact-check"
                          className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                        >
                          Reported Claims{" "}
                          {analysis.claims && (
                            <span>({analysis.claims.length})</span>
                          )}
                        </a>
                      </li>
                    </ol>
                  </li>

                  <li>
                    <ol>
                      <li className="font-bold text-lg">
                        <a
                          href="#related-articles"
                          className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                        >
                          Related Articles
                        </a>
                      </li>
                      <li className="pl-4">
                        <a
                          href="#original-article"
                          className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                        >
                          Original Article
                        </a>
                      </li>
                      <li className="pl-4">
                        <a
                          href="#more-articles"
                          className="underline underline-offset-4 decoration-clay-700 hover:decoration-clay-500 hover:text-brand-500 transition-colors duration-300"
                        >
                          More Articles
                        </a>
                      </li>
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
                    <Scale
                      value={analysis.biasScore || 0.5}
                      scaleLabels={["Far Left", "Center", "Far Right"]}
                      colors={["left-500", "clay-200", "right-500"]}
                    />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-sm">
                      Factual Score ({(analysis.factualScore || 0.5) * 100}%)
                    </h4>
                    <Scale
                      value={analysis.factualScore || 0.5}
                      scaleLabels={["Very Low", "Mixed", "Very High"]}
                      colors={[
                        "rating-low",
                        "rating-mixed",
                        "rating-very-high",
                      ]}
                    />
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

        <div className="flex flex-col gap-12">
          {analysis.framing ? (
            <>
              <div className="flex gap-16">
                <div className="flex flex-col gap-2 py-2 border-r border-clay-200 pr-16">
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

                  <p>{analysis.framing.narrative}</p>
                </div>

                <div className="flex flex-col gap-2.5 py-2">
                  <h3
                    className="font-bold flex justify-between items-center gap-1.5"
                    id="reporting-balance"
                  >
                    <span>Reporting Balance</span>
                    <ArticleBadge
                      variant="sourcing"
                      value={formatValue(analysis.framing.sourcing.balance)}
                    />
                  </h3>

                  <p>{analysis.framing.sourcing.notes}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="font-serif text-3xl" id="term-analysis">
                  Term Analysis
                </h3>

                <p className="pb-4">something about something</p>

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
                            <th scope="row" className="px-4 py-4 font-semibold">
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

              <div className="flex flex-col gap-2">
                <h3 className="font-serif text-3xl" id="rhetorical-devices">
                  Rhetorical Devices
                </h3>

                <p className="pb-4">something about something</p>

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
                            <th scope="row" className="px-4 py-4 font-semibold">
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
            </>
          ) : (
            <span>skeleton</span>
          )}
        </div>
      </section>

      <section className="m-4 sm:my-6 sm:mx-12 md:mt-10 xl:mt-16 2xl:mt-28 pt-8 sm:pt-12 md:pt-16 xl:pt-22 2xl:pt-28 lg:mx-18 xl:mx-24 2xl:mx-auto 2xl:max-w-325 flex flex-col gap-2 border-t border-clay-200">
        <h2 className="font-serif text-4xl" id="fact-check">
          Fact Check
        </h2>

        <p className="pb-4">something about something</p>

        <div className="grid grid-cols-2 gap-12">
          {analysis.claims ? (
            <>
              {analysis.claims.map((claim, index) => (
                <div
                  key={index}
                  className={`flex flex-col gap-3 py-2 ${index % 2 != 0 && "pl-12 border-l border-clay-200"}`}
                >
                  <p className="font-bold text-lg">
                    {index + 1}. {claim.content}
                  </p>

                  <div className="pt-4 border-t border-clay-200">
                    <h3 className="font-bold flex items-center gap-1.5">
                      <span>Findings</span>
                      <ArticleBadge
                        variant="tf"
                        value={formatValue(
                          claim.verification?.output?.content.verdict ||
                            "Unverified",
                        )}
                      />
                    </h3>
                  </div>

                  <ul className="list-disc pl-4 flex flex-col gap-1.5">
                    {claim.verification ? (
                      <>
                        {claim.verification.output?.content.findings.map(
                          (finding, index) => (
                            <li key={index}>
                              {finding.statement}{" "}
                              {claim.verification?.output?.grounding
                                ?.filter(
                                  (grounding) =>
                                    grounding.field ===
                                    `findings[${index}].statement`,
                                )
                                .map((grounding) =>
                                  grounding.citations
                                    .slice(0, 4)
                                    .map((cit, index) => (
                                      <ExplanationPopover
                                        key={index}
                                        content={
                                          <div className="flex flex-col gap-2">
                                            {" "}
                                            <span>Go to article:</span>{" "}
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
                                          <div className="inline-block mr-0.5 text-clay-100 bg-clay-900 rounded-full text-sm size-5 text-center">
                                            {index + 1}
                                          </div>
                                        </a>
                                      </ExplanationPopover>
                                    )),
                                )}
                            </li>
                          ),
                        )}
                      </>
                    ) : (
                      <>skeleton</>
                    )}
                  </ul>
                </div>
              ))}
            </>
          ) : (
            <span>claim skeleton</span>
          )}
        </div>
      </section>
    </>
  );
}
