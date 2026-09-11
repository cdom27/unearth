type QuoteDetails = {
  text: string | null;
  speaker: string | null;
};

type SummaryDetails = {
  tldr: string | null;
  insights: string[];
  quotes: QuoteDetails[];
} | null;

type FramingDetails = {
  narrative: string | null;
  terms: {
    term: string;
    tone: "negative" | "neutral" | "positive";
    analysis: string;
  }[];
  devices: {
    device: string;
    example: string;
    explanation: string;
  }[];
  sourcing: {
    balance: "one-sided" | "mostly-one-sided" | "balanced" | null;
    notes: string | null;
  } | null;
} | null;

type ClaimDetails = {
  content: string;
  verification: {
    output: {
      content: {
        verdict: "true" | "false" | "mixed" | "unverifiable";
        findings: {
          statement: string;
        }[];
      } | null;
      grounding: {
        field: string;
        citations: {
          url: string;
          title: string;
        }[];
        confidence: "low" | "medium" | "high";
      }[];
    } | null;
  } | null;
};

export type AnalysisDetails = {
  analysis: {
    summary: SummaryDetails;
    sentiment: string | null;
    framing: FramingDetails;
    claims: ClaimDetails[] | null;
    factualScore: number | null;
    biasScore: number | null;
    updatedAt: string;
  };
  article: {
    url: string;
    title: string;
    byline: string;
    publishedTime: string;
    thumbnailUrl: string | null;
  };
  source: {
    name: string;
    url: string;
    bias: string;
    factualReporting: string | null;
    credibility: string | null;
  };
};
