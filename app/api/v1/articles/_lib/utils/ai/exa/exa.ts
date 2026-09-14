import Exa from "exa-js";
import fs from "fs/promises";
import path from "path";

type ClaimVerificationContent = {
  verdict: "true" | "false" | "mixed" | "unverifiable";
  findings: {
    statement: string;
  }[];
};

const exa = new Exa(process.env.EXA_API_KEY);

export async function search(query: string) {
  const startedAt = performance.now();

  const systemPrompt = await fs.readFile(
    path.join(
      process.cwd(),
      "app/api/v1/articles/_lib/utils/ai/exa/prompts",
      "search.md",
    ),
    "utf-8",
  );

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
    systemPrompt: systemPrompt,
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
      durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
      dateGeneratedISO: new Date().toISOString(),
    },
  };
}
