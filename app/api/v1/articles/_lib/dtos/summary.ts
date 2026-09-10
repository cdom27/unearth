export type SummaryDTO = {
  tldr: string;
  insights: string[];
  quotes: {
    text: string;
    speaker: string;
  }[];
};
