import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const themes=["blue","red","green","amber"];
function value(data:FormData,key:string){return String(data.get(key)||"").trim();}
function dateOrNull(v:string){ if(!v) return null; const date=new Date(v); return Number.isNaN(date.getTime()) ? null : date.toISOString(); }

export async function POST(request:Request){
  if(!(await isAdminAuthenticated())) return NextResponse.json({error:"Não autorizado"},{status:401});
  const data=await request.formData(); const title=value(data,"title"); const theme=value(data,"theme")||"blue"; const position=Number(value(data,"position")||1);
  if(!title || !themes.includes(theme) || !Number.isInteger(position) || position<1 || position>4) return NextResponse.json({error:"Dados inválidos"},{status:400});
  const startsAt=dateOrNull(value(data,"startsAt")); const endsAt=dateOrNull(value(data,"endsAt")); if(startsAt&&endsAt&&new Date(endsAt)<=new Date(startsAt)) return NextResponse.json({error:"A data final deve ser posterior à inicial."},{status:400});
  const db=getDatabase(); const activeCount=await db.sql`SELECT COUNT(*)::int AS total FROM campaigns WHERE active=TRUE`;
  const active=data.get("active")==="on"; if(active && Number(activeCount[0]?.total||0)>=4) return NextResponse.json({error:"O limite é de 4 banners ativos."},{status:400});
  await db.sql`INSERT INTO campaigns (id,title,message,button_label,button_url,image_url,theme,position,active,starts_at,ends_at) VALUES (${crypto.randomUUID()},${title},${value(data,"message")||null},${value(data,"buttonLabel")||null},${value(data,"buttonUrl")||null},${value(data,"imageUrl")||null},${theme},${position},${active},${startsAt},${endsAt})`;
  return NextResponse.redirect(new URL("/admin/campanhas?created=1",request.url),303);
}
