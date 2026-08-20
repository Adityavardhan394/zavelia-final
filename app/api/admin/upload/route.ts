import { put } from "@vercel/blob";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { BUSINESS } from "../../../../lib/config";

const admins = new Set<string>(BUSINESS.adminEmails);
async function authorized() {
  const user = await getChatGPTUser();
  return user && admins.has(user.email.toLowerCase()) ? user : null;
}

export async function POST(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    /* Validate file type */
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: "Only JPEG, PNG, WebP, or GIF images are allowed." }, { status: 400 });
    }

    /* Validate file size (max 5MB) */
    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ error: "Image must be under 5MB." }, { status: 400 });
    }

    /* Upload to Vercel Blob storage */
    const blob = await put(`products/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    return Response.json({ url: blob.url }, { status: 201 });
  } catch (error) {
    console.error("[API] Upload failed:", error);
    return Response.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
