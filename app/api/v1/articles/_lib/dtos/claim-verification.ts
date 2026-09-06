export type ClaimVerificationDTO = {
  requestId: string;
  resolvedSearchType?: string;
  output?: {
    content: {
      verdict: "true" | "false" | "mixed" | "unverifiable";
      findings: {
        statement: string;
      }[];
    };
    grounding?: {
      field: string;
      citations: {
        url: string;
        title: string;
      }[];
      confidence: "low" | "medium" | "high";
    }[];
  };
  results: {
    id: string;
    title: string | null;
    url: string;
    publishedDate?: string;
    author?: string;
    image?: string;
  }[];
  searchTime?: number;
  costDollars?: {
    total: number;
  };
};
