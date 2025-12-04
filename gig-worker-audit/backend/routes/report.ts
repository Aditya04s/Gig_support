SYSTEM: Senior TS backend engineer. Output only TypeScript file.

TASK: Create `backend/routes/report.ts` for generating PDF reports.

- Accept POST { auditRecordId }.
- Load AuditResult and associated EarningsRecord/Worker info.
- Call generatePDF(data) from scripts/generate_pdf.ts and return PDF buffer as downloadable response (set headers).
- Use dbConnect.
Description

Returns PDF report for an audit.

Code skeleton

ts
Copy code
// backend/routes/report.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "../utils/dbConnect";
import AuditResultModel from "../models/AuditResult";
import EarningsRecord from "../models/EarningsRecord";
import { generatePDF } from "../../scripts/generate_pdf";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    await dbConnect();
    const { auditRecordId } = req.body;
    const audit = await AuditResultModel.findById(auditRecordId).lean();
    if (!audit) return res.status(404).json({ error: "Audit not found" });

    const record = audit.recordId ? await EarningsRecord.findById(audit.recordId).lean() : null;

    const pdfBuffer = await generatePDF({ audit, record });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="audit-${audit._id}.pdf"`);
    res.send(pdfBuffer);
  } catch (e: any) {
    console.error("Report error:", e);
    res.status(500).json({ error: e?.message || "Internal error" });
  }
}