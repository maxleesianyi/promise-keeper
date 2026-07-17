async function callTelegram(method: string, body: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as { ok?: boolean; description?: string };
  if (!response.ok || !result.ok) throw new Error(result.description || "Telegram could not deliver the message.");
  return result;
}
export async function sendApprovalCard(promise: { id: string; title: string; dueText: string }) { await callTelegram("sendMessage", { chat_id: process.env.TELEGRAM_USER_ID, text: `I found a promise from Maya:\n\n*${promise.title}*\n${promise.dueText}\n\nSave it to Do Already?`, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "Save promise", callback_data: `save:${promise.id}` }, { text: "Not a promise", callback_data: `ignore:${promise.id}` }]] } }); }
export async function sendSetupReply(chatId: number) { await callTelegram("sendMessage", { chat_id: chatId, text: `Do Already? is connected to this group.\n\nGroup code: ${chatId}` }); }
export async function answerCallback(id: string, text: string) { await callTelegram("answerCallbackQuery", { callback_query_id: id, text }); }
export async function updateApprovalCard(chatId: number, messageId: number, text: string) { await callTelegram("editMessageText", { chat_id: chatId, message_id: messageId, text, parse_mode: "Markdown" }); }
