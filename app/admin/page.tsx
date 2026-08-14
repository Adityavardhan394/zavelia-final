import { redirect } from "next/navigation";
import { requireChatGPTUser } from "../chatgpt-auth";
import AdminClient from "./admin-client";
export const dynamic="force-dynamic";
export default async function AdminPage(){const user=await requireChatGPTUser("/admin");if(!["padbhog@gmail.com","adityavardhan394@gmail.com"].includes(user.email.toLowerCase()))redirect("/");return <AdminClient user={user.displayName}/>;}
