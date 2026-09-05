import { getDatabase } from "@netlify/database";

export type Campaign = { id:string; title:string; message:string|null; buttonLabel:string|null; buttonUrl:string|null; imageUrl:string|null; theme:string; position:number; active:boolean; startsAt:string|null; endsAt:string|null };

function map(row:any): Campaign { return { id:String(row.id), title:String(row.title), message:row.message ? String(row.message) : null, buttonLabel:row.button_label ? String(row.button_label) : null, buttonUrl:row.button_url ? String(row.button_url) : null, imageUrl:row.image_url ? String(row.image_url) : null, theme:String(row.theme || "blue"), position:Number(row.position || 1), active:Boolean(row.active), startsAt:row.starts_at ? String(row.starts_at) : null, endsAt:row.ends_at ? String(row.ends_at) : null }; }

export async function getActiveCampaigns() {
  const db=getDatabase();
  const rows=await db.sql`SELECT * FROM campaigns WHERE active=TRUE AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW()) ORDER BY position ASC, created_at DESC LIMIT 4`;
  return rows.map(map);
}

export async function getAllCampaigns() {
  const db=getDatabase();
  const rows=await db.sql`SELECT * FROM campaigns ORDER BY active DESC, position ASC, created_at DESC`;
  return rows.map(map);
}
