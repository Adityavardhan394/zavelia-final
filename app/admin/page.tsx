import { redirect } from "next/navigation";
import { getChatGPTUser } from "../chatgpt-auth";
import { BUSINESS } from "../../lib/config";
import AdminClient from "./admin-client";
export const dynamic="force-dynamic";
export default async function AdminPage(){
  const user = await getChatGPTUser();
  if(!user) redirect("/admin/login");
  if(!(BUSINESS.adminEmails as readonly string[]).includes(user.email.toLowerCase())) redirect("/");
  return <AdminClient user={user.displayName}/>;
}
