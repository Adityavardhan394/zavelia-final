import { desc } from "drizzle-orm";
import { getDb } from "../../../../db";
import { customers } from "../../../../db/schema";
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
    if (!db) return Response.json({ customers: [] });
    const rows = await db.select().from(customers).orderBy(desc(customers.id));
    return Response.json({ customers: rows });
  } catch {
    return Response.json({ customers: [] });
  }
}
