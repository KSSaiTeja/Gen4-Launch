import { NextResponse } from "next/server";

// POST - Set the base count manually
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { baseCount } = body;

    if (typeof baseCount !== "number" || baseCount < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "baseCount must be a non-negative number",
        },
        { status: 400 },
      );
    }

    // Note: In production, you'll need to set this as an environment variable
    // LEAD_BASE_COUNT in Vercel dashboard
    return NextResponse.json(
      {
        success: true,
        message: `Base count set to ${baseCount}. Please set LEAD_BASE_COUNT=${baseCount} as an environment variable in Vercel.`,
        baseCount,
        instructions: [
          "1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables",
          `2. Add new variable: LEAD_BASE_COUNT = ${baseCount}`,
          "3. Redeploy your project",
        ],
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error setting base count:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to set base count",
      },
      { status: 500 },
    );
  }
}

// GET - Get current base count
export async function GET() {
  const baseCount = parseInt(process.env.LEAD_BASE_COUNT || "0", 10);
  return NextResponse.json(
    {
      success: true,
      baseCount,
      newLeads: 0, // This will be calculated from actual new leads
      totalCount: baseCount,
    },
    { status: 200 },
  );
}

