import { desc, eq } from "drizzle-orm";
import { ensurePromiseSchema, getDb } from "../../../db";
import { promises } from "../../../db/schema";
export async function GET() { try { await ensurePromiseSchema(); const rows = await getDb().select().from(promises).where(eq(promises.approvalState, "saved")).orderBy(desc(promises.createdAt)); return Response.json({ promises: rows }); } catch { return Response.json({ promises: [] }); } }

export async function DELETE() {
  try {
    await ensurePromiseSchema();
    await getDb().delete(promises);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "Could not reset the demo." }, { status: 500 });
  }
}
