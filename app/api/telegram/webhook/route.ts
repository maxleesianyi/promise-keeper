import { eq } from "drizzle-orm";
import { ensurePromiseSchema, getDb } from "../../../../db";
import { promises } from "../../../../db/schema";
import { extractPromise } from "../../../../lib/promise-extraction";
import { answerCallback, sendApprovalCard, updateApprovalCard } from "../../../../lib/telegram";

type Update = {
  message?: { chat: { id: number }; from?: { id: number }; text?: string };
  callback_query?: { id: string; data?: string; from: { id: number }; message?: { chat: { id: number }; message_id: number } };
};

const same = (a: number | string | undefined, b: string | undefined) => String(a) === String(b);

export async function POST(request: Request) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_WEBHOOK_SECRET) return Response.json({ ok: true });
  if (request.headers.get("x-telegram-bot-api-secret-token") !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update = (await request.json()) as Update;
  if (update.callback_query) return callback(update);

  const message = update.message;
  if (!message?.text || !same(message.chat.id, process.env.TELEGRAM_DEMO_CHAT_ID) || !same(message.from?.id, process.env.TELEGRAM_WIFE_USER_ID)) {
    return Response.json({ ok: true });
  }

  try {
    await ensurePromiseSchema();
    const extracted = await extractPromise(message.text);
    if (!extracted.promise || extracted.promise.confidence !== "High") return Response.json({ ok: true, outcome: "not_a_high_confidence_promise" });

    const id = crypto.randomUUID();
    await getDb().insert(promises).values({
      id,
      ...extracted.promise,
      status: extracted.promise.dueText === "No date yet" ? "needs-date" : "due",
      approvalState: "pending",
    });
    await sendApprovalCard({ id, title: extracted.promise.title, dueText: extracted.promise.dueText });
    return Response.json({ ok: true, outcome: "approval_card_sent" });
  } catch (error) {
    console.error("Telegram promise capture failed", error);
    return Response.json({ ok: true, outcome: "delivery_failed", error: error instanceof Error ? error.message : "Unknown error" });
  }
}

async function callback(update: Update) {
  const cb = update.callback_query!;
  if (!same(cb.from.id, process.env.TELEGRAM_USER_ID) || !cb.data) return Response.json({ ok: true });

  const [action, id] = cb.data.split(":");
  if (!id || (action !== "save" && action !== "ignore")) return Response.json({ ok: true });

  try {
    await ensurePromiseSchema();
    const state = action === "save" ? "saved" : "ignored";
    await getDb().update(promises).set({ approvalState: state, updatedAt: new Date().toISOString() }).where(eq(promises.id, id));
    await answerCallback(cb.id, action === "save" ? "Saved to Do Already?" : "Ignored");
    if (cb.message) {
      await updateApprovalCard(
        cb.message.chat.id,
        cb.message.message_id,
        action === "save" ? "*Saved to Do Already?*" : "Ignored - no promise saved."
      );
    }
  } catch (error) {
    console.error("Telegram promise approval failed", error);
  }

  return Response.json({ ok: true });
}
