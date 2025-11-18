import { NextResponse } from "next/server";

// Use environment variable for base count (manually set)
const BASE_COUNT = parseInt(process.env.LEAD_BASE_COUNT || "0", 10);
const LEADS_KEY = "gen4:new_leads";

// Try to use KV if available, otherwise use in-memory
let kv: any = null;
let memoryStore: any[] = [];

try {
  const kvModule = require("@vercel/kv");
  kv = kvModule.kv;
} catch (error) {
  // KV not available, using memory store
}

interface Lead {
  uniqueId: string;
  phoneNumber: string;
  timestamp: string;
  offer: string;
}

// Read new leads (tracked after base count was set)
async function readNewLeads(): Promise<Lead[]> {
  if (kv) {
    try {
      const leads = await kv.get<Lead[]>(LEADS_KEY);
      return leads || [];
    } catch (error) {
      console.error("Error reading from KV:", error);
    }
  }
  return memoryStore;
}

// GET - Retrieve lead count (base count + new leads)
export async function GET() {
  try {
    const newLeads = await readNewLeads();
    const totalCount = BASE_COUNT + newLeads.length;
    
    // Get last updated timestamp from the most recent new lead
    const lastUpdated =
      newLeads.length > 0
        ? newLeads[newLeads.length - 1].timestamp
        : new Date().toISOString();

    return NextResponse.json(
      {
        success: true,
        count: totalCount,
        baseCount: BASE_COUNT,
        newLeads: newLeads.length,
        lastUpdated: lastUpdated,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error reading lead count:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to read lead count",
        count: BASE_COUNT,
        baseCount: BASE_COUNT,
        newLeads: 0,
      },
      { status: 500 },
    );
  }
}
