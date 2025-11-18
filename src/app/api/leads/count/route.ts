import { NextResponse } from "next/server";
import { readFile, mkdir } from "fs/promises";
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

// Read all leads to get accurate count
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

// GET - Retrieve lead count (reads from actual leads data)
export async function GET() {
  try {
    const leads = await readLeads();
    const count = leads.length;

    // Get last updated timestamp from the most recent lead
    const lastUpdated =
      leads.length > 0
        ? leads[leads.length - 1].timestamp
        : new Date().toISOString();

    return NextResponse.json(
      {
        success: true,
        count: count,
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
        count: 0,
      },
      { status: 500 },
    );
  }
}
