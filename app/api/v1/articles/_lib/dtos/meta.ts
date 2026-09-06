export type MetaDTO = {
  summary: JSON;
  analysis: JSON | null;
  claimExtraction: JSON | null;
  claimVerification: ClaimVerificationMetaDTO | null;
};

export type ClaimVerificationMetaDTO = {
  model: string;
  requests: {
    requestId: string;
    searchTime?: number;
    costDollars?: {
      total: number;
    };
    resolvedSearchType?: string;
    dateGeneratedISO: string;
  }[];
};
