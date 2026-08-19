import { asc } from "drizzle-orm";
import { getDb } from "../../../../db";
import { adminUsers } from "../../../../db/schema";
import { getChatGPTUser } from "../../../chatgpt-auth";

const admins = new Set(["padbhog@gmail.com", "adityavardhan394@gmail.com"]);
async function authorized() {
  const user = await getChatGPTUser();
  return user && admins.has(user.email.toLowerCase()) ? user : null;
}

export async function GET() {
  if (!await authorized()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const db = await getDb();
    const rows = await db.select().from(adminUsers).orderBy(asc(adminUsers.id));
    return Response.json({ users: rows });
  } catch (error) {
    console.error("[API] Admin users GET failed:", error);
    return Response.json({ error: "Database connection failed. Please contact the administrator." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!await authorized()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { name?: string; email?: string; password?: string; role?: string; modules?: string };
  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const role = body.role || "staff";
  const modules = body.modules || "[]";

  if (name.length < 2) return Response.json({ error: "Name is required" }, { status: 400 });
  if (!email.includes("@")) return Response.json({ error: "Valid email is required" }, { status: 400 });
  if (password.length < 6) return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });

  try {
    const db = await getDb();
    const [user] = await db.insert(adminUsers).values({
      name, email, password, role: role as "super_admin" | "manager" | "staff", modules, active: true,
    }).returning();
    return Response.json({ user: { ...user, password: undefined } }, { status: 201 });
  } catch (error) {
    console.error("[API] Admin user POST failed:", error);
    return Response.json({ error: "Email already exists or insert failed." }, { status: 409 });
  }
}
