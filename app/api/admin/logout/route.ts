export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Set-Cookie":
        "zavelia_admin=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0",
    },
  });
}
