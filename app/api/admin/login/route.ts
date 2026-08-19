export const dynamic = "force-dynamic";
import { BUSINESS } from "../../../../lib/config";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = (body.email || "").toLowerCase().trim();
  const password = body.password || "";

  /* Server-side email whitelist */
  if(!(BUSINESS.adminEmails as readonly string[]).includes(email)) {
    return Response.json({ error: "Access denied. This email is not authorized." }, { status: 403 });
  }

  /* Server-side password check */
  const adminPassword = process.env.ADMIN_PASSWORD || "zavelia2026";
  if (password !== adminPassword) {
    return Response.json({ error: "Invalid password." }, { status: 401 });
  }

  /* Generate deterministic token (must match encodeAdminToken in chatgpt-auth.ts) */
  let hash = 5381;
  for (let i = 0; i < adminPassword.length; i++) {
    hash = ((hash << 5) + hash + adminPassword.charCodeAt(i)) | 0;
  }
  const token = `tok_${Math.abs(hash).toString(36)}_${adminPassword.length}`;

  return Response.json(
    { ok: true, user: { email, name: email.split("@")[0] } },
    {
      status: 200,
      headers: {
        "Set-Cookie": `zavelia_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
      },
    },
  );
}
