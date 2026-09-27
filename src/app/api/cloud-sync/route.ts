import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Internal fallback sync mirror for The Cozy Crochet
// Allows sync to operate even if external networks are slow
let memorySyncData: any = null;

const SYNC_FILE = path.join(
  typeof process !== "undefined" && process.platform === "win32" ? process.cwd() : "/tmp",
  "cozy_sync_mirror.json"
);

function loadMirrorData() {
  if (memorySyncData) return memorySyncData;
  try {
    if (fs.existsSync(SYNC_FILE)) {
      const raw = fs.readFileSync(SYNC_FILE, "utf-8");
      memorySyncData = JSON.parse(raw);
      return memorySyncData;
    }
  } catch {}
  return null;
}

function saveMirrorData(data: any) {
  memorySyncData = data;
  try {
    fs.writeFileSync(SYNC_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {}
}

export async function GET() {
  const data = loadMirrorData();
  return NextResponse.json(data || { name: "cozy_crochet_sync", updatedAt: 0 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body && typeof body === "object") {
      const current = loadMirrorData() || {};
      const merged = {
        ...current,
        ...body,
        updatedAt: Date.now(),
        overrides: { ...(current.overrides || {}), ...(body.overrides || {}) },
        orderUpdates: { ...(current.orderUpdates || {}), ...(body.orderUpdates || {}) },
        deletedSlugs: Array.from(new Set([...(current.deletedSlugs || []), ...(body.deletedSlugs || [])])),
        deletedMsgIds: Array.from(new Set([...(current.deletedMsgIds || []), ...(body.deletedMsgIds || [])])),
        deletedMsgSigs: Array.from(new Set([...(current.deletedMsgSigs || []), ...(body.deletedMsgSigs || [])])),
      };
      saveMirrorData(merged);
      return NextResponse.json({ success: true, data: merged });
    }
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ message: "Error saving sync", error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
