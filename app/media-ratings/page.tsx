import type { Metadata } from "next";
import UsersAndCharts from "../_components/icons/users-and-charts";
import SourcesTable from "./_components/sources-table";
import { MediaRatingsProvider } from "./_components/media-ratings-provider";

export const metadata: Metadata = {
  title: "Unearth News - Media Ratings",
  description:
    "Browse source ratings for bias, factual reporting, and credibility.",
  alternates: {
    canonical: "/media-ratings",
  },
  openGraph: {
    title: "Unearth News - Media Ratings",
    description:
      "Browse source ratings for bias, factual reporting, and credibility.",
    url: "https://unearth.news/media-ratings",
  },
  twitter: {
    title: "Unearth News - Media Ratings",
    description:
      "Browse source ratings for bias, factual reporting, and credibility.",
  },
};

export default async function MediaRatings({
  searchParams,
}: PageProps<"/media-ratings">) {
  const params = await searchParams;
  const initialSearch = typeof params.q === "string" ? params.q : "";
  const parsedPage =
    typeof params.page === "string" ? Number(params.page) : Number.NaN;
  const initialPage =
    Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  return (
    <MediaRatingsProvider
      initialSearch={initialSearch}
      initialPage={initialPage}
    >
      <MediaRatingsContent />
    </MediaRatingsProvider>
  );
}

function MediaRatingsContent() {
  return (
    <>
      <section className="m-4 sm:my-6 sm:mx-12 md:my-10 xl:my-16 2xl:my-22 pb-8 sm:pb-12 md:pb-16 xl:pb-22 2xl:pb-28 lg:mx-18 xl:mx-24 2xl:mx-auto 2xl:max-w-325 grid grid-cols-1 items-center gap-8 border-b border-clay-200 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12">
        <div className="flex flex-col gap-6">
          <h1 className="text-6xl lg:text-7xl font-serif">Media Ratings</h1>
          <p className="text-lg font-sans max-w-150">
            Browse all rated sources. Each one carries two ratings: one from
            verified, trustworthy third-party sources, and one collected
            first-hand through our own fact-checking<sup>*</sup>.
            <br />
            <br />
            <span className="text-clay-400 italic text-sm">
              <sup>*</sup>A second rating may be unavailable if we have not
              collected enough material for a source.
            </span>
          </p>
        </div>
        <UsersAndCharts />
      </section>

      <article className="mx-4 mt-4 sm:mt-6 sm:mx-12 md:mt-10 xl:mt-16 2xl:mt-22 pt-4 sm:pt-6 lg:mx-18 xl:mx-24 2xl:mx-auto 2xl:max-w-325 flex flex-col gap-12">
        <SourcesTable />
      </article>
    </>
  );
}
