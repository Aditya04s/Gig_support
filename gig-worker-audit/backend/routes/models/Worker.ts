// backend/models/Worker.ts
import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * @interface IWorker
 * @extends {Document}
 * Defines the structure for a Worker document in MongoDB.
 */
export interface IWorker extends Document {
  workerId: string; // Unique identifier for the worker (e.g., provided by the client/platform)
  name?: string;    // Worker's optional name
  email?: string;   // Worker's optional email
  createdAt: Date;  // Timestamp of creation (automatically managed by timestamps)
  updatedAt: Date;  // Timestamp of last update (automatically managed by timestamps)
}

/**
 * Mongoose Schema for the Worker entity.
 */
const WorkerSchema = new Schema<IWorker>(
  {
    workerId: {
      type: String,
      required: true,
      unique: true,
      index: true, // Index for faster lookups
    },
    name: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    collection: "workers", // Explicitly set collection name
  }
);

// Check if the model already exists before creating it, which is necessary for Next.js API routes.
const Worker: Model<IWorker> = (mongoose.models.Worker as Model<IWorker>) || mongoose.model<IWorker>("Worker", WorkerSchema);

export default Worker;