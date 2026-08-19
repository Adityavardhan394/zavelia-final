import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { products } from "../../../../db/schema";
import { getChatGPTUser } from "../../../chatgpt-auth";

const admins=new Set(["padbhog@gmail.com","adityavardhan394@gmail.com"]);
async function authorized(){const user=await getChatGPTUser();return user&&admins.has(user.email.toLowerCase())?user:null;}
function clean(value:unknown){return typeof value==="string"?value.trim():"";}

const seed = [
  { id:1, name:"Saanjh Pearl Hoops", slug:"saanjh-pearl-hoops", category:"Jewellery" as const, description:"Lightweight pearl-accent hoops with a polished gold-tone finish.", price:1299, compareAtPrice:1599, image:"https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85", tag:"BESTSELLER", stock:18, published:true, featured:true },
  { id:2, name:"Noor Layered Necklace", slug:"noor-layered-necklace", category:"Jewellery" as const, description:"A delicate layered necklace designed for everyday styling and gifting.", price:1899, compareAtPrice:2299, image:"https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85", tag:"NEW", stock:12, published:true, featured:true },
  { id:3, name:"Luma Dew Serum", slug:"luma-dew-serum", category:"Beauty" as const, description:"A lightweight hydrating face serum for a fresh, dewy finish.", price:899, compareAtPrice:null, image:"https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85", tag:"BEAUTY", stock:25, published:true, featured:true },
  { id:4, name:"Mira Mini Bag", slug:"mira-mini-bag", category:"Accessories" as const, description:"A compact statement bag with a structured silhouette and versatile strap.", price:2199, compareAtPrice:2699, image:"https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85", tag:"LIMITED", stock:9, published:true, featured:true },
  { id:5, name:"Velvet Bloom Lip Tint", slug:"velvet-bloom-lip-tint", category:"Beauty" as const, description:"A soft-focus lip tint with comfortable colour for day-to-evening wear.", price:649, compareAtPrice:799, image:"https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=85", tag:"TRENDING", stock:30, published:true, featured:false },
  { id:6, name:"Aira Hair Claw Set", slug:"aira-hair-claw-set", category:"Accessories" as const, description:"Three polished hair claws in versatile neutral tones.", price:499, compareAtPrice:599, image:"https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?auto=format&fit=crop&w=900&q=85", tag:"NEW", stock:40, published:true, featured:false },
];

export async function GET(){
  if(!await authorized())return Response.json({error:"Unauthorized"},{status:401});
  try{
    const db=await getDb();
    if(!db)return Response.json({products:seed,fallback:true});
    let rows=await db.select().from(products).orderBy(asc(products.id));
    if(rows.length===0){await db.insert(products).values(seed).onConflictDoNothing();rows=await db.select().from(products).orderBy(asc(products.id));}
    return Response.json({products:rows});
  }catch{return Response.json({products:seed,fallback:true});}
}

export async function POST(request:Request){
  if(!await authorized())return Response.json({error:"Unauthorized"},{status:401});
  const body=await request.json() as Record<string,unknown>;
  const name=clean(body.name),category=clean(body.category),description=clean(body.description),image=clean(body.image).replace(/\?$/,""),tag=clean(body.tag)||"NEW",price=Number(body.price),stock=Number(body.stock);
  if(name.length<2)return Response.json({error:"Enter a product name."},{status:400});
  if(!["Jewellery","Beauty","Accessories"].includes(category))return Response.json({error:"Select a valid category."},{status:400});
  if(description.length<5)return Response.json({error:"Add a useful product description."},{status:400});
  if(!Number.isInteger(price)||price<=0)return Response.json({error:"Price must be greater than ₹0."},{status:400});
  if(!Number.isInteger(stock)||stock<0)return Response.json({error:"Stock cannot be negative."},{status:400});
  try{new URL(image.replace(/\?$/,""))}catch{return Response.json({error:"Enter a valid product image URL."},{status:400});}
  const slug=`${name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")}-${Date.now().toString().slice(-5)}`;
  const compareAtPrice=body.compareAtPrice?Number(body.compareAtPrice):null;
  const discount=body.discount?Number(body.discount):0;
  try{
    const db=await getDb();
    if(!db)return Response.json({error:"Database not available"},{status:503});
    const [product]=await db.insert(products).values({name,slug,category:category as "Jewellery"|"Beauty"|"Accessories",description,price,compareAtPrice,image,tag,stock,published:Boolean(body.published),featured:Boolean(body.featured)}).returning();
    return Response.json({product},{status:201});
  }catch{
    // Fallback: return a synthetic product for client-side management
    const product={id:Date.now(),name,slug,category,description,price,compareAtPrice,image,tag,stock,published:Boolean(body.published),featured:Boolean(body.featured),discount,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    return Response.json({product,fallback:true},{status:201});
  }
}
