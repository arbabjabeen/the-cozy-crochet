import { NextRequest, NextResponse } from "next/server";
import { POST as authHandler } from "../route";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const modifiedReq = new NextRequest(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({ ...body, action: "login" }),
  });
  return authHandler(modifiedReq);
}
