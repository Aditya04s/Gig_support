import { NextApiRequest, NextApiResponse } from "next";
// Assuming Mongoose models are set up in a typical Next.js project structure
// Replace these with actual imports based on your database setup (e.g., Firestore utilities)
// For this example, we assume a MongoDB/Mongoose setup for structure demonstration.
import dbConnect from "../utils/dbConnect"; 
import AuditResultModel from "../models/AuditResult";
import EarningsRecordModel from "../models/EarningsRecord";
import { generatePDF } from "../../scripts/generate_pdf";
import type { AuditResult, EarningsRecord } from "../types"; // Assuming types are defined

/**
 * API handler for POST /api/report
 * Generates a PDF report based on an audit record ID.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Method Check
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 2. Input Validation
  const { auditRecordId } = req.body;

  if (!auditRecordId || typeof auditRecordId !== 'string') {
    return res.status(400).json({ error: "Missing or invalid auditRecordId in request body." });
  }

  try {
    // 3. Database Connection
    // NOTE: This assumes a traditional database connection (e.g., MongoDB). 
    // If using Firebase/Firestore, this step would involve initializing the Firestore client.
    await dbConnect(); 

    // 4. Data Fetching
    const audit: AuditResult | null = await AuditResultModel.findById(auditRecordId).lean();
    
    if (!audit) {
      return res.status(404).json({ error: "Audit result not found for the provided ID." });
    }

    // Fetch the original earnings record associated with the audit
    const record: EarningsRecord | null = audit.recordId 
      ? await EarningsRecordModel.findById(audit.recordId).lean() 
      : null;

    // 5. PDF Generation
    // The generatePDF function is responsible for structuring the report content
    const pdfBuffer: Buffer = await generatePDF({ audit, record });

    // 6. Response Headers for Downloadable PDF
    res.setHeader("Content-Type", "application/pdf");
    // Force the browser to download the file with a specific filename
    res.setHeader("Content-Disposition", `attachment; filename="gig-audit-report-${auditRecordId}.pdf"`);
    // Set content length for better download predictability
    res.setHeader("Content-Length", pdfBuffer.length); 

    // 7. Send the PDF Buffer
    res.send(pdfBuffer);
    
  } catch (e: unknown) {
    const error = e as Error;
    console.error(`[PDF_REPORT_ERROR]: Failed to generate report for ID ${auditRecordId}.`, error);
    // 8. Error Handling
    return res.status(500).json({ 
      error: "Failed to generate report due to an internal server error.", 
      details: error.message 
    });
  }
}