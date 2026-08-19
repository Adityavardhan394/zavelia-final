export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: string };
  const password = body.password || "";
  const adminPassword = process.env.ADMIN_PASSWORD || "zavelia2026";

  if (password !== adminPassword) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Generate the same token as in chatgpt-auth.ts
  let hash = 0;
  for (let i = 0; i < adminPassword.length; i++) {
    hash = ((hash << 5) - hash + adminPassword.charCodeAt(i)) | 0;
  }
  const token = `tok_${Math.abs(hash).toString(36)}`;

  return Response.json(
    { ok: true },
    {
      status: 200,
      headers: {
        "Set-Cookie": `zavelia_admin=${token}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`,
      },
    },
  );
}
