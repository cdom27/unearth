import Anthropic from "@anthropic-ai/sdk";
import { Tool } from "@anthropic-ai/sdk/resources";
import fs from "fs/promises";
import path from "path";

function getToolForMode(mode: string): Tool {
  switch (mode) {
    case "summarize":
      return {
        name: "record_summary",
        description: "Record the summary and quotes for the article.",
        input_schema: {
          type: "object",
          properties: {
            tldr: {
              type: "string",
              description: "A single-sentence neutral summary.",
            },
            quotes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  speaker: { type: "string" },
                  text: { type: "string" },
                },
                required: ["speaker", "text"],
              },
              description: "1 to 2 pivotal, exact quotes from key figures.",
            },
          },
          required: ["tldr", "quotes"],
        },
      };
    case "rhetoricalFraming":
      return {
        name: "record_rhetorical_framing",
        description:
          "Record the article's narrative framing and sourcing balance.",
        input_schema: {
          type: "object",
          properties: {
            narrative: {
              type: "string",
              description: "The concise overarching narrative presented.",
            },
            sourcing: {
              type: "object",
              properties: {
                balance: {
                  type: "string",
                  enum: ["one-sided", "mostly-one-sided", "balanced"],
                },
                notes: { type: "string" },
              },
              required: ["balance", "notes"],
            },
          },
          required: ["narrative", "sourcing"],
        },
      };
    case "rhetoricalEvidence":
      return {
        name: "record_rhetorical_evidence",
        description:
          "Record high-confidence rhetorical terms and devices supported by the article.",
        input_schema: {
          type: "object",
          properties: {
            terms: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  term: { type: "string" },
                  tone: {
                    type: "string",
                    enum: ["negative", "neutral", "positive"],
                  },
                  analysis: { type: "string" },
                },
                required: ["term", "tone", "analysis"],
              },
              description: "Up to 5 high-signal rhetorical terms.",
            },
            devices: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  device: { type: "string" },
                  example: { type: "string" },
                  explanation: { type: "string" },
                },
                required: ["device", "example", "explanation"],
              },
              description: "Up to 3 high-confidence rhetorical devices.",
            },
          },
          required: ["terms", "devices"],
        },
      };
    case "rhetoricalSynthesis":
      return {
        name: "record_rhetorical_synthesis",
        description:
          "Record sentiment and bias calibrated from supplied rhetorical evidence.",
        input_schema: {
          type: "object",
          properties: {
            sentiment: {
              type: "string",
              enum: ["mixed", "positive", "negative"],
              description: "The article's cumulative sentiment.",
            },
            biasScore: {
              type: "number",
              description:
                "A 0.0 to 1.0 score for directional bias in article construction.",
            },
          },
          required: ["sentiment", "biasScore"],
        },
      };
    case "extract":
      return {
        name: "record_claims_extraction",
        description: "Record the claims extraction for the article",
        input_schema: {
          type: "object",
          properties: {
            claims: {
              type: "array",
              items: { type: "string" },
              description: "Up to 6 falsifiable claims made by the article",
            },
          },
          required: ["claims"],
        },
      };
    default:
      throw new Error(`Unsupported mode: ${mode}`);
  }
}

export async function anthropic(
  model: "claude-haiku-4-5" | "claude-sonnet-4-6",
  mode:
    | "summarize"
    | "rhetoricalFraming"
    | "rhetoricalEvidence"
    | "rhetoricalSynthesis"
    | "extract",
  userMsg: string,
) {
  const anth = new Anthropic();
  const maxTokens = 8192;

  const systemPrompt = await fs.readFile(
    path.join(
      process.cwd(),
      "app/api/v1/articles/_lib/utils/ai/anthropic/prompts",
      `${mode}.md`,
    ),
    "utf-8",
  );

  const tool = getToolForMode(mode);

  const startedAt = performance.now();
  const msg = await anth.messages.create({
    model: model,
    max_tokens: maxTokens,
    system: systemPrompt,
    tools: [tool],
    tool_choice: { type: "tool", name: tool.name },
    messages: [
      {
        role: "user",
        content: userMsg,
      },
    ],
  });
  const requestDurationMs =
    Math.round((performance.now() - startedAt) * 100) / 100;

  const meta = {
    model: msg.model,
    requestDurationMs,
    usage: msg.usage,
    dateGeneratedISO: new Date().toISOString(),
  };

  const toolBlock = msg.content.find((block) => block.type === "tool_use");
  const data = toolBlock?.type === "tool_use" ? toolBlock.input : null;

  return { data, meta };
}
