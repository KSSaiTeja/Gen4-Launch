import { NextResponse } from "next/server";

interface Lead {
  uniqueId: string;
  phoneNumber: string;
  timestamp: string;
  offer: string;
}

// Use environment variable for base count (manually set)
const BASE_COUNT = parseInt(process.env.LEAD_BASE_COUNT || "0", 10);
const LEADS_KEY = "gen4:new_leads";

// Try to use KV if available, otherwise use in-memory (for development)
let kv: any = null;
let memoryStore: Lead[] = [];

try {
  const kvModule = require("@vercel/kv");
  kv = kvModule.kv;
} catch (error) {
  console.log("KV not available, using memory store (development mode)");
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

// Write new leads
async function writeNewLeads(leads: Lead[]): Promise<void> {
  if (kv) {
    try {
      await kv.set(LEADS_KEY, leads);
      return;
    } catch (error) {
      console.error("Error writing to KV:", error);
    }
  }
  memoryStore = leads;
}

// POST - Track a new lead (only if unique)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uniqueId, phoneNumber, offer } = body;

    if (!uniqueId || !phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "uniqueId and phoneNumber are required",
        },
        { status: 400 },
      );
    }

    // Read existing new leads (only those tracked after base count)
    const newLeads = await readNewLeads();

    // Check if this lead already exists (by uniqueId or phoneNumber)
    const existingLead = newLeads.find(
      (lead) => lead.uniqueId === uniqueId || lead.phoneNumber === phoneNumber,
    );

    if (existingLead) {
      // Lead already exists, return current count without incrementing
      const totalCount = BASE_COUNT + newLeads.length;
      return NextResponse.json(
        {
          success: true,
          count: totalCount,
          baseCount: BASE_COUNT,
          newLeads: newLeads.length,
          isDuplicate: true,
          message: "Lead already tracked",
        },
        { status: 200 },
      );
    }

    // Add new lead
    const newLead: Lead = {
      uniqueId,
      phoneNumber,
      offer: offer || "Unknown",
      timestamp: new Date().toISOString(),
    };

    newLeads.push(newLead);

    // Write updated new leads
    await writeNewLeads(newLeads);

    const totalCount = BASE_COUNT + newLeads.length;

    return NextResponse.json(
      {
        success: true,
        count: totalCount,
        baseCount: BASE_COUNT,
        newLeads: newLeads.length,
        isDuplicate: false,
        message: "Lead tracked successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error tracking lead:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to track lead",
      },
      { status: 500 },
    );
  }
}

// GET - Get all new leads (for admin/debugging)
export async function GET() {
  try {
    const newLeads = await readNewLeads();
    const totalCount = BASE_COUNT + newLeads.length;
    return NextResponse.json(
      {
        success: true,
        count: totalCount,
        baseCount: BASE_COUNT,
        newLeads: newLeads.length,
        leads: newLeads,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error reading leads:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to read leads",
        count: BASE_COUNT,
        baseCount: BASE_COUNT,
        newLeads: 0,
        leads: [],
      },
      { status: 500 },
    );
  }
}
