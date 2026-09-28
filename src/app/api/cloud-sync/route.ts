import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const EXTENDSCLASS_BIN = "fdbebfe";
const CLOUD_BIN_URL = `https://extendsclass.com/api/json-storage/bin/${EXTENDSCLASS_BIN}`;

let memoryCache: any = null;
let lastFetchTime = 0;

const SYNC_FILE = path.join(
  typeof process !== "undefined" && process.platform === "win32" ? process.cwd() : "/tmp",
  "cozy_sync_mirror.json"
);

export async function fetchFromCloudBin(force = false): Promise<any> {
  const now = Date.now();
  // Return lightning-fast in-memory cache if queried within 1.6s
  if (!force && memoryCache && now - lastFetchTime < 1600) {
    return memoryCache;
  }

  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${CLOUD_BIN_URL}?_t=${now}`, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });
    clearTimeout(tid);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object") {
        memoryCache = data;
        lastFetchTime = Date.now();
        try {
          fs.writeFileSync(SYNC_FILE, JSON.stringify(data, null, 2), "utf-8");
        } catch {}
        return data;
      }
    }
  } catch (err: any) {
    console.warn("Could not fetch from cloud bin:", err.message);
  }

  // Fallback to local memory / file
  if (memoryCache) return memoryCache;
  try {
    if (fs.existsSync(SYNC_FILE)) {
      const raw = fs.readFileSync(SYNC_FILE, "utf-8");
      memoryCache = JSON.parse(raw);
      lastFetchTime = Date.now();
      return memoryCache;
    }
  } catch {}

  return { name: "cozy_crochet_sync", updatedAt: 0 };
}

export async function saveToCloudBin(payload: any): Promise<boolean> {
  memoryCache = payload;
  lastFetchTime = Date.now();

  try {
    fs.writeFileSync(SYNC_FILE, JSON.stringify(payload, null, 2), "utf-8");
  } catch {}

  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(CLOUD_BIN_URL, {
      method: "PUT",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    clearTimeout(tid);
    if (res.ok) {
      return true;
    }
  } catch (err: any) {
    console.warn("Could not push to cloud bin:", err.message);
  }
  return false;
}

export async function appendMessageToCloud(newMsg: any) {
  try {
    const current = (await fetchFromCloudBin()) || {};
    const existing: any[] = Array.isArray(current.messages) ? current.messages : [];
    const deletedSet = new Set(Array.isArray(current.deletedMsgIds) ? current.deletedMsgIds : []);
    const k = newMsg._id || newMsg.id;
    if (k && !deletedSet.has(k)) {
      const map = new Map<string, any>();
      map.set(k, newMsg);
      existing.forEach((m: any) => {
        const id = m && (m._id || m.id);
        if (id && !deletedSet.has(id)) map.set(id, m);
      });
      const merged = {
        ...current,
        updatedAt: Date.now(),
        messages: Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        ),
      };
      memoryCache = merged;
      lastFetchTime = Date.now();
      saveToCloudBin(merged).catch(() => {});
      return merged;
    }
  } catch {}
  return null;
}

export async function GET() {
  const data = await fetchFromCloudBin();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body && typeof body === "object") {
      // Get current fresh state from cache or cloud
      const current = (await fetchFromCloudBin()) || {};

      // 1. Per-slug deep merge of overrides
      const mergedOverrides = { ...(current.overrides || {}) };
      if (body.overrides && typeof body.overrides === "object") {
        for (const slug of Object.keys(body.overrides)) {
          mergedOverrides[slug] = {
            ...(mergedOverrides[slug] || {}),
            ...(body.overrides[slug] || {}),
          };
        }
      }

      // 2. Combine order updates from both keys
      const currentOrders = { ...(current.orderOverrides || {}), ...(current.orderUpdates || {}) };
      const bodyOrders = { ...(body.orderOverrides || {}), ...(body.orderUpdates || {}) };
      const mergedOrders = { ...currentOrders, ...bodyOrders };

      // 3. Deleted slugs
      const deletedSlugs = Array.from(
        new Set([
          ...(Array.isArray(current.deletedSlugs) ? current.deletedSlugs : []),
          ...(Array.isArray(body.deletedSlugs) ? body.deletedSlugs : []),
        ])
      );
      const deletedSet = new Set(deletedSlugs);

      // Purge deleted slugs from overrides
      for (const del of deletedSlugs) {
        delete mergedOverrides[del];
      }

      // 4. Local products (purge any deleted ones)
      const prodMap = new Map<string, any>();
      (current.localProducts || []).forEach((p: any) => {
        if (p && p.slug && !deletedSet.has(p.slug)) prodMap.set(p.slug, p);
      });
      (body.localProducts || []).forEach((p: any) => {
        if (p && p.slug && !deletedSet.has(p.slug)) {
          const existing = prodMap.get(p.slug) || {};
          prodMap.set(p.slug, { ...existing, ...p });
        }
      });
      const localProducts = Array.from(prodMap.values());

      // 5. Deleted messages
      const deletedMsgIds = Array.from(
        new Set([
          ...(Array.isArray(current.deletedMsgIds) ? current.deletedMsgIds : []),
          ...(Array.isArray(body.deletedMsgIds) ? body.deletedMsgIds : []),
        ])
      );
      const deletedMsgSigs = Array.from(
        new Set([
          ...(Array.isArray(current.deletedMsgSigs) ? current.deletedMsgSigs : []),
          ...(Array.isArray(body.deletedMsgSigs) ? body.deletedMsgSigs : []),
        ])
      );
      const deletedMsgSet = new Set(deletedMsgIds);

      // 6. Messages - persistently store contact messages in the cloud bin
      const isDeletedSig = (m: any) => {
        for (const sig of deletedMsgSigs) {
          if (sig && (m.message?.trim() === sig || `${m.name || ""}::${m.message?.trim()}` === sig)) {
            return true;
          }
        }
        return false;
      };

      const msgMap = new Map<string, any>();
      (current.messages || []).forEach((m: any) => {
        const k = m && (m._id || m.id);
        if (
          k &&
          !deletedMsgSet.has(k) &&
          !deletedMsgSet.has(m.id) &&
          !deletedMsgSet.has(m._id) &&
          !k.startsWith("msg-demo") &&
          !isDeletedSig(m)
        ) {
          msgMap.set(k, m);
        }
      });
      (body.messages || []).forEach((m: any) => {
        const k = m && (m._id || m.id);
        if (
          k &&
          !deletedMsgSet.has(k) &&
          !deletedMsgSet.has(m.id) &&
          !deletedMsgSet.has(m._id) &&
          !k.startsWith("msg-demo") &&
          !isDeletedSig(m)
        ) {
          msgMap.set(k, m);
        }
      });
      const messages = Array.from(msgMap.values()).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      const merged = {
        name: "cozy_crochet_sync",
        updatedAt: Date.now(),
        overrides: mergedOverrides,
        orderUpdates: mergedOrders,
        orderOverrides: mergedOrders,
        localProducts,
        deletedSlugs,
        messages,
        deletedMsgIds,
        deletedMsgSigs,
      };

      // Instantly update memoryCache and save to file + cloud
      memoryCache = merged;
      lastFetchTime = Date.now();
      saveToCloudBin(merged).catch(() => {});

      return NextResponse.json(
        { success: true, data: merged },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      );
    }
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ message: "Error saving sync", error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
