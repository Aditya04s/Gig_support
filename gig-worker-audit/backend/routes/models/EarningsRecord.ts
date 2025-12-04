// backend/models/EarningsRecord.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// Import the IWorker interface if you want to use a Mongoose ref type,
// but using a simple string reference (workerId) as per the task is sufficient.

/**
 * @typedef {Object} ParsedData
 * @property {string} [platform] The platform name.
 * @property {string} [date] The main earnings date.
 * @property {number} [total] The total earnings amount.
 * // ... other fields defined in parserService.ts
 */

/**
 * @interface IEarningsRecord
 * @extends {Document}
 * Defines the structure for an EarningsRecord document in MongoDB.
 */
export interface IEarningsRecord extends Document {
  workerId?: string;       // Reference to the Worker ID (string for loose coupling or simple string ref)
  platform?: string;       // Name of the platform (e.g., 'Swiggy', 'Uber')
  date?: string;           // Date of the earning record, preferably in ISO format
  screenshotUrl?: string;  // Public URL where the screenshot is stored
  rawText?: string;        // Raw text extracted via OCR
  parsedData?: any;        // Structured data output from the parsing service (Mixed type)
  createdAt: Date;        // Timestamp of creation (automatically managed by timestamps)
  updatedAt: Date;        // Timestamp of last update (automatically managed by timestamps)
}

/**
 * Mongoose Schema for the EarningsRecord entity.
 */
const EarningsRecordSchema = new Schema<IEarningsRecord>(
  {
    workerId: {
      type: String, // Storing as String to match the requirement, not a strict Mongoose.Schema.Types.ObjectId ref
      required: false,
      index: true,
    },
    platform: {
      type: String,
      required: false,
      index: true,
    },
    date: {
      type: String,
      required: false,
    },
    screenshotUrl: {
      type: String,
      required: false,
    },
    rawText: {
      type: String,
      required: false,
      // Consider setting max length if storing large OCR results
    },
    parsedData: {
      type: Schema.Types.Mixed, // Use Mixed for flexible, unstructured data output from parser
      required: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    collection: "earningsrecords", // Explicitly set collection name
  }
);

// Check if the model already exists before creating it (required for Next.js hot reloading).
const EarningsRecord: Model<IEarningsRecord> = (mongoose.models.EarningsRecord as Model<IEarningsRecord>) || mongoose.model<IEarningsRecord>("EarningsRecord", EarningsRecordSchema);

export default EarningsRecord;