// backend/routes/audit.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "../utils/dbConnect";

// --- Mocked Services and Models for illustration ---
// TODO: Ensure these imports point to your actual files
// Assume fairnessEngine: { auditEarnings: (parsedData: any, context?: any) => Promise<{ fairnessScore: number, missingAmount?: number, penaltyMismatch?: boolean, ratingIssue?: boolean, explanation: string }> }
import { fairnessEngine } from "../services/fairnessEngine";
// Assume EarningsRecord: { findById: (id: string) => { lean: () => Promise<{ _id: string, parsedData: any } | null> } }
// import EarningsRecord from "../models/EarningsRecord";
const EarningsRecord = {
    findById: (id: string) => ({
        lean: async () => {
            console.log(`Mock DB Lookup EarningsRecord by ID: ${id}`);
            if (id.startsWith("mock_record_")) {
                return {
                    _id: id,
                    parsedData: {
                        platform: "mock_platform",
                        earnings: 100,
                        hours: 5,
                        rate: 20,
                        context: { userTier: "Gold" }
                    }
                };
            }
            return null;
        }
    })
};
// Assume AuditResultModel: { create: (data: any) => Promise<{ _id: string, [key: string]: any }> }
// import AuditResultModel from "../models/AuditResult";
const AuditResultModel = {
    create: async (data: any) => {
        console.log("Mock DB Save AuditResult:", data);
        return {
            _id: "mock_audit_" + Date.now(),
            ...data
        };
    }
};
// Assume dbConnect: () => Promise<void>
// import dbConnect from "../utils/dbConnect";
const dbConnect = async () => { console.log("Mock DB Connect"); };
// --- End Mocked Services and Models ---

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
        if (!parsed && recordId) {
            const record = await EarningsRecord.findById(recordId).lean();

            if (!record) {
                return res.status(404).json({ error: `EarningsRecord with ID ${recordId} not found.` });
            }
            
            // Extract the parsedData from the stored record
            parsed = record.parsedData;
        }

        // 2. Validate data presence
        if (!parsed || Object.keys(parsed).length === 0) {
            return res.status(400).json({ error: "No parsed data found or provided for audit." });
        }

        // 3. Call Fairness Engine
        // Use the parsed data and any optional context provided in the body
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
            createdAt: new Date(),
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