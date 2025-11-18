import { NextResponse } from "next/server";

const GOOGLE_SHEET_ID = "1pSuU0B8f9k7A_ST0qc7Oq3yEONAS4eHRJkSsZXNykUE";
// Try multiple export URL formats
const GOOGLE_SHEET_URLS = [
  `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv`,
  `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=0`,
  `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv`,
];

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

    // Count unique leads from Google Sheets
    const uniquePhones = new Set<string>();
    let validRows = 0;

    // Process each row to count unique leads
    for (const row of rows) {
      // Try to find phone number in various column formats
      const phoneNumber =
        row["Phone Number"] ||
        row["entry.924906700"] ||
        row["PhoneNumber"] ||
        row["phone"] ||
        "";

      // Clean phone number (remove non-digits)
      const cleanPhone = phoneNumber.replace(/\D/g, "");

      // Skip if phone number is too short or missing
      if (cleanPhone.length < 10) {
        continue;
      }

      // Count unique phone numbers
      uniquePhones.add(cleanPhone);
      validRows++;
    }

    const totalCount = uniquePhones.size;

    console.log(
      `✅ Sync complete: Found ${totalCount} unique leads in Google Sheets`,
    );

    return NextResponse.json(
      {
        success: true,
        count: totalCount,
        uniqueLeads: totalCount,
        totalRows: rows.length,
        validRows: validRows,
        message: `Found ${totalCount} unique leads in Google Sheets. Set this as your LEAD_BASE_COUNT environment variable.`,
        instructions: [
          `1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables`,
          `2. Add new variable: LEAD_BASE_COUNT = ${totalCount}`,
          `3. Redeploy your project`,
          `4. New leads will automatically increment from ${totalCount}`,
        ],
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
