import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data);
}
