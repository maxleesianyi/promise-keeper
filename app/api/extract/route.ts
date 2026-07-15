import { NextResponse } from "next/server";

type ExtractedPromise = {
  title: string;
  category: "Errand" | "Preparation" | "Important date" | "Promise";
  dueText: string;
  relevantPerson: string;
  preparation: string;
  confidence: "High" | "Medium" | "Needs your input";
};

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["hasPromise", "message", "promise"],
  properties: {
    hasPromise: { type: "boolean" },
    message: { type: "string" },
    promise: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: ["title", "category", "dueText", "relevantPerson", "preparation", "confidence"],
          properties: {
            title: { type: "string" },
            category: { type: "string", enum: ["Errand", "Preparation", "Important date", "Promise"] },
            dueText: { type: "string" },
            relevantPerson: { type: "string" },
            preparation: { type: "string" },
            confidence: { type: "string", enum: ["High", "Medium", "Needs your input"] },
          },
        },
      ],
    },
  },
};

function demoExtraction(message: string): ExtractedPromise | null {
  const text = message.toLowerCase();
  if (text.includes("swimming")) return { title: "Pack Jason’s swimming gear", category: "Preparation", dueText: "Tomorrow · Singapore time", relevantPerson: "Jason", preparation: "Find swimsuit, towel, goggles, and a change of clothes.", confidence: "High" };
  if (text.includes("dog food")) return { title: "Buy dog food before coming home", category: "Errand", dueText: "Before coming home", relevantPerson: "Maya", preparation: "Pick up the usual brand.", confidence: "High" };
  if (text.includes("restaurant") || text.includes("birthday")) return { title: "Book the birthday restaurant", category: "Important date", dueText: "No date yet", relevantPerson: "Maya", preparation: "Ask for the preferred date, time, and restaurant.", confidence: "Needs your input" };
  return null;
}

export async function POST(request: Request) {
  const { message } = await request.json() as { message?: string };
  if (!message?.trim()) return NextResponse.json({ message: "Please paste a message first." }, { status: 400 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const promise = demoExtraction(message);
    return promise ? NextResponse.json({ promise, mode: "demo" }) : NextResponse.json({ message: "I couldn’t find a clear promise to save. Try one of the fictional sample messages." }, { status: 422 });
  }
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", dateStyle: "full" }).format(new Date());
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-5.6",
      instructions: `You extract commitments from everyday messages for Promise Keeper. Today in Singapore is ${today}. Every commitment is automatically assigned to the app user; never infer another responsible person. Detect a clear promise or task, classify it, resolve dates only when supported by the text, otherwise use \"No date yet\". Use the name stated in the message for relevantPerson, otherwise \"Maya\". Be concise. Return no promise for ordinary chat.`,
      input: message,
      text: { format: { type: "json_schema", name: "promise_draft", strict: true, schema } },
    }),
  });
  if (!response.ok) return NextResponse.json({ message: "The AI service could not analyse that message. Please try again." }, { status: 502 });
  const result = await response.json() as { output_text?: string };
  try {
    const parsed = JSON.parse(result.output_text || "{}");
    return parsed.hasPromise && parsed.promise ? NextResponse.json({ promise: parsed.promise }) : NextResponse.json({ message: parsed.message || "I couldn’t find a clear promise to save." }, { status: 422 });
  } catch {
    return NextResponse.json({ message: "The AI returned an unusable draft. Please try again." }, { status: 502 });
  }
}
