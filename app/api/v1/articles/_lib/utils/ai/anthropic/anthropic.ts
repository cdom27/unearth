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
    case "analyze":
      return {
        name: "record_analysis",
        description:
          "Record the analysis of sentiment, framing, and bias for the article.",
        input_schema: {
          type: "object",
          properties: {
            sentiment: {
              type: "string",
              enum: ["mixed", "positive", "negative"],
              description: "The overall sentiment of the article.",
            },
            framing: {
              type: "object",
              properties: {
                narrative: {
                  type: "string",
                  description: "The overarching narrative presented.",
                },
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
              required: ["narrative", "terms", "devices", "sourcing"],
            },
            biasScore: {
              type: "number",
              description: "A score representing the level of bias.",
            },
          },
          required: ["sentiment", "framing", "biasScore"],
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
  mode: "summarize" | "analyze" | "extract",
  userMsg: string,
) {
  const anth = new Anthropic();

  const systemPrompt = await fs.readFile(
    path.join(
      process.cwd(),
      "app/api/v1/articles/_lib/utils/ai/anthropic/prompts",
      `${mode}.md`,
    ),
    "utf-8",
  );

  const tool = getToolForMode(mode);

  const msg = await anth.messages.create({
    model: model,
    max_tokens: 8192,
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

  const meta = {
    model: msg.model,
    usage: msg.usage,
    dateGeneratedISO: new Date().toISOString(),
  };

  const toolBlock = msg.content.find((block) => block.type === "tool_use");
  const data = toolBlock?.type === "tool_use" ? toolBlock.input : null;

  return { data, meta };
}
