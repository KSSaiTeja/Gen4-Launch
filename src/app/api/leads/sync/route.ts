import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const GOOGLE_SHEET_ID = "1pSuU0B8f9k7A_ST0qc7Oq3yEONAS4eHRJkSsZXNykUE";
// Try multiple export URL formats
const GOOGLE_SHEET_URLS = [
  `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv`,
  `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=0`,
  `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv`,
];

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

// Parse CSV line
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Parse CSV data
function parseCSV(csvData: string): Record<string, string>[] {
  const lines = csvData.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index] || "";
      });
      rows.push(row);
    }
  }

  return rows;
}

// GET - Sync leads from Google Sheets
export async function GET() {
  try {
    console.log("🔄 Starting Google Sheets sync...");

    // Try multiple URL formats
    let csvData = "";
    let lastError: Error | null = null;

    for (const url of GOOGLE_SHEET_URLS) {
      try {
        const response = await fetch(url, {
          cache: "no-store",
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
        });

        if (response.ok) {
          csvData = await response.text();
          console.log("✅ Fetched CSV data from Google Sheets");
          break;
        } else {
          lastError = new Error(
            `Failed with ${response.status}: ${response.statusText}`,
          );
        }
      } catch (error) {
        lastError =
          error instanceof Error
            ? error
            : new Error("Unknown error fetching sheet");
        continue;
      }
    }

    if (!csvData) {
      throw new Error(
        `Failed to fetch Google Sheet. Make sure it's publicly viewable. Error: ${
          lastError?.message || "Unknown"
        }`,
      );
    }

    // Parse CSV
    const rows = parseCSV(csvData);
    console.log(`📊 Found ${rows.length} rows in Google Sheet`);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "No data found in Google Sheet",
          total: 0,
          added: 0,
          skipped: 0,
        },
        { status: 200 },
      );
    }

    // Read existing leads
    const existingLeads = await readLeads();
    const existingIds = new Set(existingLeads.map((lead) => lead.uniqueId));
    const existingPhones = new Set(
      existingLeads.map((lead) => lead.phoneNumber),
    );

    let added = 0;
    let skipped = 0;
    const newLeads: Lead[] = [];

    // Process each row
    for (const row of rows) {
      // Try to find phone number and unique ID in various column formats
      const phoneNumber =
        row["Phone Number"] ||
        row["entry.924906700"] ||
        row["PhoneNumber"] ||
        row["phone"] ||
        "";

      const uniqueId =
        row["Unique ID"] ||
        row["entry.299128917"] ||
        row["UniqueID"] ||
        row["uniqueId"] ||
        row["Timestamp"] || // Use timestamp as fallback unique ID
        "";

      const offer =
        row["Offer"] || row["entry.855479267"] || row["offer"] || "Unknown";

      const timestamp =
        row["Timestamp"] || row["entry.0"] || new Date().toISOString();

      // Skip if missing required fields
      if (!phoneNumber || !uniqueId) {
        skipped++;
        continue;
      }

      // Clean phone number (remove non-digits)
      const cleanPhone = phoneNumber.replace(/\D/g, "");

      // Skip if phone number is too short
      if (cleanPhone.length < 10) {
        skipped++;
        continue;
      }

      // Check for duplicates
      if (existingIds.has(uniqueId) || existingPhones.has(cleanPhone)) {
        skipped++;
        continue;
      }

      // Add new lead
      const newLead: Lead = {
        uniqueId,
        phoneNumber: cleanPhone,
        offer: offer || "Unknown",
        timestamp: timestamp || new Date().toISOString(),
      };

      newLeads.push(newLead);
      existingIds.add(uniqueId);
      existingPhones.add(cleanPhone);
      added++;
    }

    // Add new leads to existing ones
    const allLeads = [...existingLeads, ...newLeads];

    // Write updated leads
    await writeLeads(allLeads);

    console.log(
      `✅ Sync complete: Added ${added} new leads, skipped ${skipped} duplicates`,
    );

    return NextResponse.json(
      {
        success: true,
        total: allLeads.length,
        added,
        skipped,
        message: `Synced ${added} new leads from Google Sheets. ${skipped} duplicates skipped.`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error syncing from Google Sheets:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to sync from Google Sheets",
        message:
          "Make sure your Google Sheet is publicly accessible (View permission).",
      },
      { status: 500 },
    );
  }
}

// POST - Force sync (same as GET)
export async function POST() {
  return GET();
}