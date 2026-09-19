export type Params = {
  pagination: {
    page: number;
    pageSize: number;
  };
  search?: string;
  filters?: {
    // analysis table
    minFactualScore?: number;
    maxFactualScore?: number;
    minBiasScore?: number;
    maxBiasScore?: number;
    sentiments?: string[];
    // article table
    minPublishedAt?: string;
    maxPublishedAt?: string;
    // source table
    sources?: string[]; // slugs
    biases?: string[];
    countries?: string[];
    mediaTypes?: string[];
    credibilities?: string[];
  };
  sorting: "newest" | "oldest" | "factualScore";
  includeUnanalyzed?: boolean;
};
