/*
 *   always return a standardized structure regardless of the result
 *   in order to avoid throwing errors that ofuscate control flows
 */
export type AnalysisResultDTO =
  | {
      success: true;
      slug: string;
    }
  | { success: false; error: string; status?: number };
