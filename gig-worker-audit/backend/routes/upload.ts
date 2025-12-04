// backend/routes/upload.ts
import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import path from "path";

// TODO: Replace with actual utility for uploading to Cloudinary/S3/etc.
// export const uploadToCloudinary = async (filepath: string, filename: string): Promise<string> => { /* ... */ };
const uploadToCloudinary = async (filepath: string, filename: string): Promise<string> => {
    // --- TODO: REAL IMPLEMENTATION: Upload 'filepath' content to Cloudinary (or S3) and return the public URL ---
    // Example using Cloudinary SDK:
    // const result = await cloudinary.uploader.upload(filepath, { public_id: filename });
    // return result.secure_url;
    console.log(`Mock Uploading ${filename} from ${filepath} to Cloudinary...`);
    return `https://mock-cdn.com/uploads/${filename}-${Date.now()}`;
};

// --- Mocked Services and Model for illustration ---
// TODO: Ensure these imports point to your actual files
// Assume ocrService: { extract: (url: string) => Promise<{ rawText: string }> }
import { ocrService } from "../services/ocrService";
// Assume parserService: { parse: (text: string, options?: { platform: string }) => Promise<any> }
import { parserService } from "../services/parserService";
// Assume EarningsRecord: { create: (data: any) => Promise<{ _id: string, [key: string]: any }> }
// import EarningsRecord from "../models/EarningsRecord";
const EarningsRecord = {
    create: async (data: any) => {
        console.log("Mock DB Save:", data);
        return {
            _id: "mock_record_" + Date.now(),
            ...data
        };
    }
};
// Assume dbConnect: () => Promise<void>
// import dbConnect from "../utils/dbConnect";
const dbConnect = async () => { console.log("Mock DB Connect"); };
// --- End Mocked Services and Model ---


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
    if (process.env.CLOUDINARY_URL) {
      // Flow A: Upload to Cloudinary (or similar)
      const filename = path.basename(file.originalFilename || file.newFilename || "upload");
      fileUrl = await uploadToCloudinary(tempPath, filename);
    } else {
      // Flow B: Local Fallback (for development/testing)
      // NOTE: In production serverless, this file may be inaccessible after the function ends.
      const destDir = path.join(process.cwd(), "tmp");
      const filename = path.basename(file.originalFilename || file.newFilename || `local_upload_${Date.now()}`);
      const dest = path.join(destDir, filename);

      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(tempPath, dest);

      // This URL will only work if a local server is configured to serve /tmp
      fileUrl = `/tmp/${filename}`; // Mock path for local access
      console.log(`Local file saved to: ${dest}`);
    }

    // 4. Process File: OCR and Parsing
    // Call OCR service to extract raw text
    const ocrResult = await ocrService.extract(fileUrl);
    const rawText = ocrResult.rawText ?? "";

    // Parse raw OCR text into structured fields
    const parsed = await parserService.parse(rawText, { platform });

    // 5. Persist Earnings Record to DB
    const record = await EarningsRecord.create({
      platform,
      screenshotUrl: fileUrl,
      rawText: rawText.substring(0, 1000), // Save first 1000 chars of raw text
      parsedData: parsed,
      uploadedAt: new Date(),
      // Add a userId or other relevant context here
    });

    // 6. Return Success Response
    return res.status(200).json({
      recordId: record._id,
      parsedData: parsed
    });

  } catch (e: any) {
    // 7. Robust Error Handling
    console.error("Upload handler critical error:", e);
    // Attempt to remove the temporary file if it still exists (optional cleanup)
    if (req.method === "POST") { // Only run if a POST request was attempted
        try {
            // Check if formidable created temp files (formidable usually handles this, but good practice)
            // Note: with formidable v3, file.filepath is the main temp path.
            // fs.promises.unlink(file.filepath).catch(() => {});
        } catch (cleanupError) {
            console.warn("Cleanup failed:", cleanupError);
        }
    }
    return res.status(500).json({ error: e?.message || "Internal server error during processing" });
  }
}