import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { products } from "../../../../../db/schema";
import { getChatGPTUser } from "../../../../chatgpt-auth";
const admins=new Set(["padbhog@gmail.com","adityavardhan394@gmail.com"]);
async function ok(){const u=await getChatGPTUser();return Boolean(u&&admins.has(u.email.toLowerCase()));}
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){if(!await ok())return Response.json({error:"Unauthorized"},{status:401});const {id}=await params;const body=await request.json() as {published?:boolean;stock?:number};const update:Record<string,unknown>={updatedAt:sql`CURRENT_TIMESTAMP`};if(typeof body.published==="boolean")update.published=body.published;if(Number.isInteger(body.stock)&&Number(body.stock)>=0)update.stock=Number(body.stock);const db=await getDb();const [product]=await db.update(products).set(update).where(eq(products.id,Number(id))).returning();return Response.json({product});}
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){if(!await ok())return Response.json({error:"Unauthorized"},{status:401});const {id}=await params;const db=await getDb();await db.delete(products).where(eq(products.id,Number(id)));return Response.json({ok:true});}
