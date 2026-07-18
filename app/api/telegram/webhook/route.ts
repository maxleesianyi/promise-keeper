import { and, eq, inArray } from "drizzle-orm";
import { ensurePromiseSchema, getDb } from "../../../../db";
import { promises } from "../../../../db/schema";
import { extractPromise } from "../../../../lib/promise-extraction";
import { answerCallback, sendApprovalCard, sendSetupReply, updateApprovalCard } from "../../../../lib/telegram";

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
  if (message?.text === "/doalready_setup" && same(message.from?.id, process.env.TELEGRAM_USER_ID)) {
    try {
      await sendSetupReply(message.chat.id);
      return Response.json({ ok: true, outcome: "setup_reply_sent" });
    } catch (error) {
      return Response.json({ ok: true, outcome: "setup_reply_failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
  const isApprovedSender = same(message?.from?.id, process.env.TELEGRAM_WIFE_USER_ID);
  const isConfiguredDemoGroup = same(message?.chat.id, process.env.TELEGRAM_DEMO_CHAT_ID);
  const isYourTemporaryTestGroup = same(message?.from?.id, process.env.TELEGRAM_USER_ID) && Boolean(message?.chat && message.chat.id < 0);
  if (!message?.text || !isApprovedSender || (!isConfiguredDemoGroup && !isYourTemporaryTestGroup)) {
    return Response.json({ ok: true });
  }

  try {
    await ensurePromiseSchema();
    const db = getDb();
    const activeTasks = await db
      .select()
      .from(promises)
      .where(and(eq(promises.approvalState, "saved"), inArray(promises.status, ["due", "needs-date"])));
    const extracted = await extractPromise(message.text, activeTasks.map((task) => ({
      id: task.id,
      title: task.title,
      category: task.category as "Errand" | "Preparation" | "Important date" | "Promise",
      dueText: task.dueText,
      relevantPerson: task.relevantPerson,
      preparation: task.preparation,
    })));
    if (!extracted.promise || extracted.promise.confidence === "Low") return Response.json({ ok: true, outcome: "not_confident_enough" });

    if (extracted.promise.action === "update") {
      const target = activeTasks.find((task) => task.id === extracted.promise?.targetPromiseId);
      if (!target || extracted.promise.confidence !== "High") {
        return Response.json({ ok: true, outcome: "update_not_clear_enough" });
      }

      await db.update(promises).set({
        title: extracted.promise.title,
        category: extracted.promise.category,
        dueText: extracted.promise.dueText || target.dueText,
        relevantPerson: extracted.promise.relevantPerson || target.relevantPerson,
        preparation: extracted.promise.preparation || target.preparation,
        confidence: extracted.promise.confidence,
        updatedAt: new Date().toISOString(),
      }).where(eq(promises.id, target.id));
      return Response.json({ ok: true, outcome: "active_task_updated", taskId: target.id });
    }

    const id = crypto.randomUUID();
    await db.insert(promises).values({
      id,
      ...extracted.promise,
      status: extracted.promise.dueText === "No date yet" ? "needs-date" : "due",
      approvalState: extracted.promise.confidence === "High" ? "saved" : "pending",
    });
    if (extracted.promise.confidence === "High") {
      return Response.json({ ok: true, outcome: "auto_approved" });
    }
    await sendApprovalCard({ id, title: extracted.promise.title, dueText: extracted.promise.dueText });
    return Response.json({ ok: true, outcome: "medium_confidence_approval_card_sent" });
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
