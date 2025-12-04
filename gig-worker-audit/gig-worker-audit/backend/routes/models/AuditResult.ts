// backend/models/AuditResult.ts
import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * @interface IAuditResult
 * @extends {Document}
 * Defines the structure for an AuditResult document in MongoDB.
 */
export interface IAuditResult extends Document {
  recordId?: mongoose.Types.ObjectId | string; // Reference to the EarningsRecord
  parsedSnapshot?: any;                      // Snapshot of the parsed data that was audited (Mixed type)
  fairnessScore: number;                    // The computed fairness score (0.0 to 1.0)
  missingAmount?: number;                   // Calculated missing or unexplained money
  penaltyMismatch?: boolean;                // Flag for excessive penalty detection
  ratingIssue?: boolean;                    // Flag for recent rating drop detection
  explanation?: string;                     // Human-readable explanation of the audit findings
  createdAt: Date;                         // Timestamp of creation (automatically managed by timestamps)
  updatedAt: Date;                         // Timestamp of last update (automatically managed by timestamps)
}

/**
 * Mongoose Schema for the AuditResult entity.
 */
const AuditResultSchema = new Schema<IAuditResult>(
  {
    recordId: {
      // Use string for simplicity as requested, but Mongoose.Schema.Types.ObjectId is often preferred for refs
      type: Schema.Types.String,
      required: false,
      index: true,
      // If using ObjectId ref, it would look like: ref: 'EarningsRecord'
    },
    parsedSnapshot: {
      type: Schema.Types.Mixed, // Snapshot of the data at the time of audit
      required: false,
    },
    fairnessScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    missingAmount: {
      type: Number,
      required: false,
      default: 0,
    },
    penaltyMismatch: {
      type: Boolean,
      required: false,
      default: false,
    },
    ratingIssue: {
      type: Boolean,
      required: false,
      default: false,
    },
    explanation: {
      type: String,
      required: false,
      // Consider max length for LLM generated text
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    collection: "auditresults", // Explicitly set collection name
  }
);

// Check if the model already exists before creating it (necessary for Next.js hot reloading).
const AuditResult: Model<IAuditResult> = (mongoose.models.AuditResult as Model<IAuditResult>) || mongoose.model<IAuditResult>("AuditResult", AuditResultSchema);

export default AuditResult;