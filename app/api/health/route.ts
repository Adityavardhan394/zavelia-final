import { getDb } from "../../../db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    /* Simple connectivity check — does not expose credentials or schema */
    await db.execute(sql`SELECT 1`);
    return Response.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("[Health] Database check failed:", error);
    return Response.json(
      { status: "error", database: "unavailable" },
      { status: 503 }
    );
  }
}
