// backend/routes/audit.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "../utils/dbConnect";
import { fairnessEngine } from "../services/fairnessEngine"; // Import the actual service

// --- REAL IMPORTS ---
import EarningsRecord from "../models/EarningsRecord"; // Import the actual EarningsRecord model
import AuditResultModel from "../models/AuditResult"; // Import the actual AuditResult model
// --- End REAL IMPORTS ---

// Define the expected request body types for clarity
interface AuditRequestBody {
    recordId?: string;
    parsedData?: any; // The structure of the parsed data object
    context?: any;     // Optional context data to pass to the fairness engine
}

/**
 * Next.js API route to trigger a fairness audit on earnings data,
 * either fetched from a stored record or provided directly.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        await dbConnect();

        const { recordId, parsedData, context } = req.body as AuditRequestBody;

        let parsed = parsedData;

        // 1. Load data if recordId is provided
        if (recordId) {
            // FindById is safer than relying solely on the parsedData from the FE
            const record = await EarningsRecord.findById(recordId).lean();

            if (!record) {
                return res.status(404).json({ error: `EarningsRecord with ID ${recordId} not found.` });
            }
            
            // Prioritize the data stored in the DB, but allow FE to override with minor corrections.
            // Merge the two, prioritizing the explicitly provided `parsedData` (from FE review)
            parsed = {
                ...(record.parsedData || {}),
                ...(parsedData || {})
            };
        } else if (!parsed || Object.keys(parsed).length === 0) {
             // 2. Validate data presence if no recordId was given
            return res.status(400).json({ error: "No parsed data found or provided for audit." });
        }


        // 3. Call Fairness Engine
        const auditResult = await fairnessEngine.auditEarnings(parsed, context);

        // 4. Persist Audit Result
        // Destructure properties from the audit result, providing safe defaults (e.g., 0/false)
        const saved = await AuditResultModel.create({
            recordId: recordId || null, // Link to the EarningsRecord if used
            parsedSnapshot: parsed,      // Save a snapshot of the data that was audited
            contextSnapshot: context || {},
            fairnessScore: auditResult.fairnessScore,
            missingAmount: auditResult.missingAmount ?? 0,
            penaltyMismatch: auditResult.penaltyMismatch ?? false,
            ratingIssue: auditResult.ratingIssue ?? false,
            explanation: auditResult.explanation,
            // createdAt and updatedAt are handled by the Mongoose schema `timestamps: true`
        });

        // 5. Return Audit Result
        return res.status(200).json({
            audit: auditResult,
            auditRecordId: saved._id,
            message: "Fairness audit completed and saved."
        });

    } catch (e: any) {
        // 6. Error Handling
        console.error("Audit handler error:", e);
        return res.status(500).json({ error: e?.message || "Internal server error during audit processing." });
    }
}