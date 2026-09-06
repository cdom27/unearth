import Exa from "exa-js";

type ClaimVerificationContent = {
  verdict: "true" | "false" | "mixed" | "unverifiable";
  findings: {
    statement: string;
  }[];
};

const exa = new Exa(process.env.EXA_API_KEY);

export async function search(query: string) {
  const result = await exa.search(query, {
    numResults: 10,
    outputSchema: {
      type: "object",
      properties: {
        verdict: {
          type: "string",
          enum: ["true", "false", "mixed", "unverifiable"],
        },
        findings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              statement: {
                type: "string",
              },
            },
            required: ["statement"],
          },
        },
      },
      required: ["verdict", "findings"],
    },
    systemPrompt:
      "You are a rigorous, non-partisan fact-checker. Analyze the following claim with strict neutrality — do not favor any political party, ideology, or agenda.",
    type: "deep-lite",
  });

  const content = result.output?.content as ClaimVerificationContent;

  return {
    data: {
      ...result,
      output: {
        ...result.output,
        content,
      },
    },
    meta: {
      model: "deep-lite",
      requestId: result.requestId,
      searchTime: result.searchTime,
      costDollars: result.costDollars,
      resolvedSearchType: result.resolvedSearchType,
      dateGeneratedISO: new Date().toISOString(),
    },
  };
}
