import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { adminUsers } from "../../../../../db/schema";
import { getChatGPTUser } from "../../../../chatgpt-auth";

const admins = new Set(["padbhog@gmail.com", "adityavardhan394@gmail.com"]);
async function ok() { const u = await getChatGPTUser(); return Boolean(u && admins.has(u.email.toLowerCase())); }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await ok()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if (typeof body.name === "string") update.name = body.name;
  if (typeof body.role === "string") update.role = body.role;
  if (typeof body.modules === "string") update.modules = body.modules;
  if (typeof body.active === "boolean") update.active = body.active;
  if (typeof body.password === "string" && body.password.length >= 6) update.password = body.password;
  try {
    const db = await getDb();
    const [user] = await db.update(adminUsers).set(update).where(eq(adminUsers.id, Number(id))).returning();
    return Response.json({ user: { ...user, password: undefined } });
  } catch (error) {
    console.error("[API] Admin user PATCH failed:", error);
    return Response.json({ error: "Update failed." }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await ok()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const db = await getDb();
    await db.delete(adminUsers).where(eq(adminUsers.id, Number(id)));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[API] Admin user DELETE failed:", error);
    return Response.json({ error: "Delete failed." }, { status: 500 });
  }
}
