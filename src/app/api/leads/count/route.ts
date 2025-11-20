import { NextResponse } from "next/server";
import { google } from "googleapis";

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Form Responses 1"; // Default to Form Responses 1 if not specified
const PHONE_COLUMN_INDEX = 2; // Column C (0-indexed: A=0, B=1, C=2, D=3)

// Initialize Google Sheets API with service account
async function getGoogleSheetsClient() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;

  if (!credentials) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_CREDENTIALS environment variable is not set",
    );
  }

  let serviceAccountKey;
  try {
    // Try to parse the credentials
    let cleanedCredentials = credentials.trim();

    // If it starts and ends with quotes, remove them (common in .env files)
    if (
      cleanedCredentials.startsWith('"') &&
      cleanedCredentials.endsWith('"')
    ) {
      cleanedCredentials = cleanedCredentials.slice(1, -1);
    }

    // Try parsing first (in case it's already properly formatted)
    try {
      serviceAccountKey = JSON.parse(cleanedCredentials);
    } catch {
      // If parsing fails, try to fix newline and control character issues
      // Split by backslash to handle escaped sequences properly
      let fixedCredentials = "";
      let i = 0;
      while (i < cleanedCredentials.length) {
        if (cleanedCredentials[i] === "\\") {
          // Preserve escape sequences
          fixedCredentials += cleanedCredentials[i];
          if (i + 1 < cleanedCredentials.length) {
            fixedCredentials += cleanedCredentials[i + 1];
            i += 2;
            continue;
          }
        } else if (
          cleanedCredentials[i] === "\n" ||
          cleanedCredentials[i] === "\r"
        ) {
          // Replace actual newlines with escaped newlines
          fixedCredentials += "\\n";
          // Skip \r\n pairs
          if (
            cleanedCredentials[i] === "\r" &&
            i + 1 < cleanedCredentials.length &&
            cleanedCredentials[i + 1] === "\n"
          ) {
            i += 2;
            continue;
          }
        } else if (cleanedCredentials[i] === "\t") {
          // Replace tabs with escaped tabs
          fixedCredentials += "\\t";
        } else {
          fixedCredentials += cleanedCredentials[i];
        }
        i++;
      }

      serviceAccountKey = JSON.parse(fixedCredentials);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown parsing error";
    throw new Error(
      `Failed to parse GOOGLE_SERVICE_ACCOUNT_CREDENTIALS: ${errorMessage}. Please ensure the JSON is valid. If using .env file, you may need to: 1) Put the entire JSON on a single line, or 2) Use escaped newlines (\\n), or 3) Use individual environment variables for each field.`,
    );
  }

  // Validate required fields
  if (!serviceAccountKey.client_email || !serviceAccountKey.private_key) {
    throw new Error(
      "Service account credentials missing required fields: client_email or private_key",
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccountKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  return sheets;
}

// Get unique lead count from Google Sheet
async function getUniqueLeadCount(): Promise<number> {
  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEET_ID environment variable is not set");
  }

  const sheets = await getGoogleSheetsClient();

  // Read all data from the sheet (excluding header)
  // Adjust the range based on your sheet structure
  const range = `${SHEET_NAME}!A:Z`; // Read columns A to Z, adjust as needed

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: range,
  });

  const rows = response.data.values;

  if (!rows || rows.length === 0) {
    return 0;
  }

  // Skip header row (first row)
  const dataRows = rows.slice(1);

  console.log(
    `[Lead Count API] Total rows in sheet: ${rows.length} (${dataRows.length} data rows)`,
  );

  // Extract phone numbers and count unique ones
  // Phone number is in column C (index 2)
  const phoneNumbers = new Set<string>();
  let skippedCount = 0;
  let invalidCount = 0;

  dataRows.forEach((row, index) => {
    // Check if row exists and has enough columns
    if (row && row.length > PHONE_COLUMN_INDEX) {
      const phoneValue = row[PHONE_COLUMN_INDEX];

      // Skip if phone value is undefined, null, or empty
      if (!phoneValue) {
        skippedCount++;
        return;
      }

      // Convert to string and clean
      const phone = String(phoneValue).trim();

      // Only count valid phone numbers:
      // - Must be at least 10 digits
      // - Must contain only digits (no letters or special chars except + at start)
      // - Must not be empty or just whitespace
      if (phone && phone.length >= 10) {
        // Remove any non-digit characters except leading +
        const cleanedPhone = phone.replace(/[^\d+]/g, "");
        // Remove + if present and check if it's a valid phone number
        const digitsOnly = cleanedPhone.replace(/^\+/, "");

        // Only add if it has at least 10 digits and is not all zeros or placeholder
        if (
          digitsOnly.length >= 10 &&
          digitsOnly !== "0000000000" &&
          digitsOnly !== "1234567890" &&
          !digitsOnly.match(/^0+$/) // Not all zeros
        ) {
          phoneNumbers.add(digitsOnly); // Store normalized phone (digits only)
        } else {
          invalidCount++;
          console.log(
            `[Lead Count API] Invalid phone in row ${
              index + 2
            }: ${phone} -> ${digitsOnly}`,
          );
        }
      } else {
        invalidCount++;
        if (phone) {
          console.log(
            `[Lead Count API] Phone too short in row ${
              index + 2
            }: "${phone}" (length: ${phone.length})`,
          );
        }
      }
    } else {
      skippedCount++;
    }
  });

  console.log(
    `[Lead Count API] Unique phone numbers: ${phoneNumbers.size}, Skipped: ${skippedCount}, Invalid: ${invalidCount}`,
  );
  console.log(
    `[Lead Count API] Sample phones (first 5):`,
    Array.from(phoneNumbers).slice(0, 5),
  );

  return phoneNumbers.size;
}

export async function GET() {
  try {
    // Always fetch fresh count from Google Sheets (no caching)
    const count = await getUniqueLeadCount();

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching lead count:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch lead count",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
