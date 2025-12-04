// backend/routes/upload.ts
import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import path from "path";

// --- REAL IMPORTS ---
import { uploadToCloudinary } from "../utils/storage"; // Import the actual storage utility
import { ocrService } from "../services/ocrService"; // Import the actual OCR service
import { parserService } from "../services/parserService"; // Import the actual parser service
import EarningsRecord from "../models/EarningsRecord"; // Import the actual EarningsRecord model
import dbConnect from "../utils/dbConnect"; // Import the actual DB connection utility
// --- End REAL IMPORTS ---


/**
 * Note: Next.js requires disabling the default bodyParser for formidable.
 * This is required to handle 'multipart/form-data'.
 */
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Next.js API route to handle file uploads, OCR, parsing, and data persistence.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS safety: Allow specific origins or all for development
  res.setHeader('Access-Control-Allow-Origin', '*'); // TODO: Restrict in production
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Connect to Database
    await dbConnect();

    // 2. Configure and Parse Form Data
    // Use formidable to parse 'multipart/form-data'
    const form = formidable({
      multiples: false,
      // Increase fileSize limit if needed (default is 200MB)
      maxFileSize: 5 * 1024 * 1024, // e.g., 5MB limit
      // On serverless environments like Vercel, files are stored in /tmp
    });

    // We wrap the form.parse logic in a Promise to use async/await
    const { fields, files } = await new Promise<{ fields: formidable.Fields, files: formidable.Files }>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) {
                console.error("Form parsing error:", err);
                return reject(err);
            }
            resolve({ fields, files });
        });
    });

    const platform = String(fields.platform?.[0] || "other"); // formidable v3 returns fields as arrays
    const file = files.file?.[0]; // formidable v3 returns files as arrays

    if (!file) {
      return res.status(400).json({ error: "No file uploaded with field name 'file'" });
    }

    // `file.filepath` is the temporary path where formidable stored the file.
    const tempPath = file.filepath;
    let fileUrl = "";

    // 3. File Storage Logic (Cloudinary vs. Local Fallback)
    // NOTE: Local fallback section removed as it is now handled by the imported `uploadToCloudinary` utility
    // which handles both Cloudinary upload and local mock storage.
    const filename = path.basename(file.originalFilename || file.newFilename || "upload");
    fileUrl = await uploadToCloudinary(tempPath, filename);


    // 4. Process File: OCR and Parsing
    // Call OCR service to extract raw text
    const ocrResult = await ocrService.extract(fileUrl);
    const rawText = ocrResult.rawText ?? "";

    // Parse raw OCR text into structured fields
    const parsed = await parserService.parse(rawText, { platform });

    // 5. Persist Earnings Record to DB
    // NOTE: The code still saves a snapshot of the parsed data.
    const record = await EarningsRecord.create({
      platform,
      // NOTE: We should probably link this record to a Worker, but Worker creation/lookup is not implemented in this flow.
      screenshotUrl: fileUrl,
      rawText: rawText.substring(0, 1000), // Save first 1000 chars of raw text
      parsedData: parsed,
      uploadedAt: new Date(),
      // Add a userId or other relevant context here
    });

    // 6. Return Success Response
    // We return the parsed data and the DB record ID for the next step (Review/Audit)
    return res.status(200).json({
      recordId: record._id,
      parsedData: parsed
    });

  } catch (e: any) {
    // 7. Robust Error Handling
    console.error("Upload handler critical error:", e);
    // Cleanup logic is generally handled within the `uploadToCloudinary` utility now.
    return res.status(500).json({ error: e?.message || "Internal server error during processing" });
  }
}