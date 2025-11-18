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

// POST - Import existing leads (bulk import)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leads, overwrite = false } = body;

    if (!Array.isArray(leads)) {
      return NextResponse.json(
        {
          success: false,
          error: "leads must be an array",
        },
        { status: 400 },
      );
    }

    // Read existing leads
    const existingLeads = overwrite ? [] : await readLeads();
    const existingIds = new Set(
      existingLeads.map((lead) => lead.uniqueId),
    );
    const existingPhones = new Set(
      existingLeads.map((lead) => lead.phoneNumber),
    );

    let added = 0;
    let skipped = 0;

    // Process each lead
    for (const lead of leads) {
      // Validate lead structure
      if (!lead.uniqueId || !lead.phoneNumber) {
        skipped++;
        continue;
      }

      // Check for duplicates
      if (
        existingIds.has(lead.uniqueId) ||
        existingPhones.has(lead.phoneNumber)
      ) {
        skipped++;
        continue;
      }

      // Add lead
      const newLead: Lead = {
        uniqueId: lead.uniqueId,
        phoneNumber: lead.phoneNumber,
        offer: lead.offer || "Unknown",
        timestamp: lead.timestamp || new Date().toISOString(),
      };

      existingLeads.push(newLead);
      existingIds.add(lead.uniqueId);
      existingPhones.add(lead.phoneNumber);
      added++;
    }

    // Write updated leads
    await writeLeads(existingLeads);

    return NextResponse.json(
      {
        success: true,
        total: existingLeads.length,
        added,
        skipped,
        message: `Imported ${added} leads. ${skipped} duplicates skipped.`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error importing leads:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to import leads",
      },
      { status: 500 },
    );
  }
}

// GET - Get import format example
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      format: {
        leads: [
          {
            uniqueId: "unique-id-1",
            phoneNumber: "9876543210",
            offer: "Flat ₹1000 off",
            timestamp: "2024-01-15T10:30:00.000Z", // Optional
          },
          {
            uniqueId: "unique-id-2",
            phoneNumber: "9876543211",
            offer: "Flat ₹1500 off",
          },
        ],
        overwrite: false, // Set to true to replace all existing leads
      },
      instructions:
        "POST to this endpoint with an array of leads. Each lead must have uniqueId and phoneNumber. Duplicates will be automatically skipped.",
    },
    { status: 200 },
  );
}

