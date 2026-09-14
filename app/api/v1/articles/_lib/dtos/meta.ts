export type MetaDTO = {
  summary: JSON | null;
  analysis: JSON | null;
  claimExtraction: JSON | null;
  claimVerification: ClaimVerificationMetaDTO | null;
  pipeline?: PipelineMetaDTO | null;
  factualScore?: FactualScoreMetaDTO | null;
};

export type ClaimVerificationMetaDTO = {
  model: string;
  durationMs: number;
  requestCount: number;
  requests: {
    requestId: string;
    durationMs: number;
    searchTime?: number;
    costDollars?: {
      total: number;
    };
    resolvedSearchType?: string;
    dateGeneratedISO: string;
  }[];
};

export type PipelineMetaDTO = {
  totalDurationMs: number;
  parsingDurationMs?: number;
  completedAtISO: string;
};

export type FactualScoreMetaDTO = {
  durationMs: number;
};
