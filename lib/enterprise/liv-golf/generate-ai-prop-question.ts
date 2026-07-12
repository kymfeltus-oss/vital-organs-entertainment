import OpenAI from "openai";
import type { AiPropGenerationInput } from "@/lib/enterprise/liv-golf/map-sportradar-shot-feed";

const SYSTEM_PROMPT =
  "You are an expert sports betting odds maker for LIV Golf. Your task is to output a single, highly engaging binary (Yes/No) live proposition question based on a player's real-time course telemetry. Keep questions concise and under 80 characters. Do not output conversational text—return ONLY the final question string.";

function buildFallbackQuestion(input: AiPropGenerationInput): string {
  const hole = input.hole_number ? ` on hole ${input.hole_number}` : "";
  const distance = input.distance_to_hole ? ` from ${input.distance_to_hole} yards` : "";
  return `Will ${input.player_name} save par${distance} from the ${input.lie_type}${hole}?`;
}

/** Generate a context-aware Yes/No prop question from Sportradar shot telemetry. */
export async function generateAiPropQuestion(input: AiPropGenerationInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return buildFallbackQuestion(input);
  }

  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_PROP_MODEL?.trim() || "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Player: ${input.player_name}. Lie Type: ${input.lie_type}. Distance to Hole: ${input.distance_to_hole ?? "unknown"} yards. Hole Number: ${input.hole_number ?? "unknown"}.`,
      },
    ],
    max_tokens: 40,
    temperature: 0.7,
  });

  const formulatedQuestion = completion.choices[0]?.message?.content?.trim();
  if (!formulatedQuestion) {
    throw new Error("AI failed to output a valid question string.");
  }

  return formulatedQuestion.slice(0, 120);
}

export function computeAiPropPayout(lieType: string, baseStake = 10): number {
  const liveOddsMultiplier = lieType === "bunker" ? 4.5 : 3.0;
  return Math.floor(baseStake * liveOddsMultiplier);
}
