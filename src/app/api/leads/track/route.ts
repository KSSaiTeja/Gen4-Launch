import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

interface Lead {
  uniqueId: string;
  phoneNumber: string;
  timestamp: string;
  offer: string;
}

// Ensure data directory exists
async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

// Read all leads
async function readLeads(): Promise<Lead[]> {
  await ensureDataDir();
  try {
    if (existsSync(LEADS_FILE)) {
      const data = await readFile(LEADS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading leads file:", error);
  }
  return [];
}

// Write leads
async function writeLeads(leads: Lead[]): Promise<void> {
  await ensureDataDir();
  await writeFile(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");
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

    // Read existing leads
    const leads = await readLeads();

    // Check if this lead already exists (by uniqueId or phoneNumber)
    const existingLead = leads.find(
      (lead) => lead.uniqueId === uniqueId || lead.phoneNumber === phoneNumber,
    );

    if (existingLead) {
      // Lead already exists, return current count without incrementing
      return NextResponse.json(
        {
          success: true,
          count: leads.length,
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

    leads.push(newLead);

    // Write updated leads
    await writeLeads(leads);

    return NextResponse.json(
      {
        success: true,
        count: leads.length,
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

// GET - Get all leads (for admin/debugging)
export async function GET() {
  try {
    const leads = await readLeads();
    return NextResponse.json(
      {
        success: true,
        count: leads.length,
        leads: leads,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error reading leads:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to read leads",
        count: 0,
        leads: [],
      },
      { status: 500 },
    );
  }
}
