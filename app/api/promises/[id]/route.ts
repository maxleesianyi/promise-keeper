import { eq } from "drizzle-orm";
import { ensurePromiseSchema, getDb } from "../../../../db";
import { promises } from "../../../../db/schema";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { status, title } = await request.json() as { status?: string; title?: string };
  const cleanTitle = typeof title === "string" ? title.trim() : undefined;

  if (status !== undefined && status !== "completed" && status !== "missed") {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }
  if (title !== undefined && !cleanTitle) {
    return Response.json({ error: "Task title is required" }, { status: 400 });
  }
  if (status === undefined && title === undefined) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    await ensurePromiseSchema();
    await getDb().update(promises).set({
      ...(status ? { status } : {}),
      ...(cleanTitle ? { title: cleanTitle } : {}),
      updatedAt: new Date().toISOString(),
    }).where(eq(promises.id, id));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false });
  }
}
