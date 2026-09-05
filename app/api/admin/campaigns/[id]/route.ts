import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
const themes=["blue","red","green","amber"];
function value(data:FormData,key:string){return String(data.get(key)||"").trim();}
function dateOrNull(v:string){if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d.toISOString();}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!(await isAdminAuthenticated())) return NextResponse.json({error:"Não autorizado"},{status:401}); const {id}=await params; const data=await request.formData(); const title=value(data,"title"); const theme=value(data,"theme")||"blue"; const position=Number(value(data,"position")||1); const active=data.get("active")==="on";
 if(!title||!themes.includes(theme)||!Number.isInteger(position)||position<1||position>4)return NextResponse.json({error:"Dados inválidos"},{status:400}); const startsAt=dateOrNull(value(data,"startsAt"));const endsAt=dateOrNull(value(data,"endsAt"));if(startsAt&&endsAt&&new Date(endsAt)<=new Date(startsAt))return NextResponse.json({error:"A data final deve ser posterior à inicial."},{status:400});
 const db=getDatabase(); if(active){const count=await db.sql`SELECT COUNT(*)::int AS total FROM campaigns WHERE active=TRUE AND id<>${id}`;if(Number(count[0]?.total||0)>=4)return NextResponse.json({error:"O limite é de 4 banners ativos."},{status:400});}
 await db.sql`UPDATE campaigns SET title=${title},message=${value(data,"message")||null},button_label=${value(data,"buttonLabel")||null},button_url=${value(data,"buttonUrl")||null},image_url=${value(data,"imageUrl")||null},theme=${theme},position=${position},active=${active},starts_at=${startsAt},ends_at=${endsAt},updated_at=NOW() WHERE id=${id}`; return NextResponse.redirect(new URL("/admin/campanhas?saved=1",request.url),303);
}
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){if(!(await isAdminAuthenticated()))return NextResponse.json({error:"Não autorizado"},{status:401});const {id}=await params;const db=getDatabase();await db.sql`DELETE FROM campaigns WHERE id=${id}`;return NextResponse.json({ok:true});}
