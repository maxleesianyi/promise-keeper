export type ExtractedPromise = {
  title: string;
  category: "Errand" | "Preparation" | "Important date" | "Promise";
  dueText: string;
  relevantPerson: string;
  preparation: string;
  confidence: "High" | "Medium" | "Low";
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
            confidence: { type: "string", enum: ["High", "Medium", "Low"] },
          },
        },
      ],
    },
  },
};

export function demoExtraction(message: string): ExtractedPromise | null {
  const text = message.toLowerCase();

  if (text.includes("swimming")) {
    return {
      title: "Pack Jason’s swimming gear",
      category: "Preparation",
      dueText: "Tomorrow · Singapore time",
      relevantPerson: "Jason",
      preparation: "Find swimsuit, towel, goggles, and a change of clothes.",
      confidence: "High",
    };
  }

  if (text.includes("dog food")) {
    return {
      title: "Buy dog food before coming home",
      category: "Errand",
      dueText: "Before coming home",
      relevantPerson: "The Wife",
      preparation: "Pick up the usual brand.",
      confidence: "Medium",
    };
  }

  if (text.includes("restaurant") || text.includes("birthday")) {
    return {
      title: "Book the birthday restaurant",
      category: "Important date",
      dueText: "No date yet",
      relevantPerson: "The Wife",
      preparation: "Ask for the preferred date, time, and restaurant.",
      confidence: "Low",
    };
  }

  return null;
}

export async function extractPromise(message: string): Promise<{
  promise: ExtractedPromise | null;
  message: string;
  mode: "ai" | "demo";
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      promise: demoExtraction(message),
      message: "I couldn’t find a clear promise to save.",
      mode: "demo",
    };
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    dateStyle: "full",
  }).format(new Date());

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5.6",
      instructions: `You extract commitments from everyday messages for Do Already?. Today in Singapore is ${today}. Every commitment is assigned to the app user. Detect a clear promise or task, classify it, resolve dates only when supported by the text, otherwise use "No date yet". Use the name stated in the message for relevantPerson, otherwise "The Wife". Be concise. Return no promise for ordinary chat. Set confidence to High only when the message clearly asks the app user to do a specific, actionable task and the essential context is explicit. Set Medium when it might be a task but the intent, ownership, timing, or details need the user's judgment. Set Low for vague, conversational, or incomplete items that should not become a promise automatically.`,
      input: message,
      text: {
        format: {
          type: "json_schema",
          name: "promise_draft",
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error("The AI service could not analyse that message.");
  }

  const result = await response.json() as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  const outputText = result.output_text
    || result.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text
    || "{}";
  const parsed = JSON.parse(outputText);

  return {
    promise: parsed.hasPromise ? parsed.promise : null,
    message: parsed.message || "I couldn’t find a clear promise to save.",
    mode: "ai",
  };
}
