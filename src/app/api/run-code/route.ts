import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { language, code } = body;

    if (!language || !code) {
      return new NextResponse(
        JSON.stringify({ error: "Missing language or code" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const pistonRes = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        version: "3.10.0",
        files: [{ name: "main.py", content: code }],
      }),
    });

    const pistonData = await pistonRes.json();

    return new NextResponse(
      JSON.stringify({ output: pistonData.run?.stdout || "No output" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new NextResponse(
      JSON.stringify({ error: "Failed to run code", detail: err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
