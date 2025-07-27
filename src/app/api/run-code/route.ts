import { runCodeOnPiston } from "@/lib/functions";
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

    const result = await runCodeOnPiston(language, code);

    return new NextResponse(
      JSON.stringify({
        output: result.output?.trim(),
        error: result.error?.trim(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
