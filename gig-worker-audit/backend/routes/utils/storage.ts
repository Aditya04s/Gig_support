// backend/utils/storage.ts
import fs from "fs";
import path from "path";
// Uncomment and install the cloudinary SDK when deploying to production
import { v2 as cloudinary } from "cloudinary";

/**
 * @typedef {Object} CloudinaryUploadResult
 * @property {string} secure_url The publicly accessible HTTPS URL of the uploaded file.
 */

/**
 * Uploads a file at localPath to Cloudinary and returns the public URL.
 * If CLOUDINARY_URL is not set, it copies the file to the local /public/uploads/ directory
 * and returns a file:// path (intended for local development/mocking).
 *
 * @param {string} localPath The temporary file path on the serverless instance (e.g., /tmp/...).
 * @param {string} filename The desired name for the file in storage.
 * @returns {Promise<string>} The public URL or local file path.
 */
export async function uploadToCloudinary(localPath: string, filename: string): Promise<string> {
  // 1. Check for Cloudinary Environment Variable
  if (process.env.CLOUDINARY_URL) {
    try {
      // Configuration is automatically derived from CLOUDINARY_URL environment variable
      // cloudinary.config() is often not needed if CLOUDINARY_URL is set in the environment
      
      console.log(`Uploading file ${filename} to Cloudinary...`);

      // 2. Real Cloudinary Upload
      const resp = await cloudinary.uploader.upload(localPath, {
        public_id: `uploads/${filename}`, // Organize files under an 'uploads' folder
        // Optionally set resource type, tags, etc.
        resource_type: "auto",
      });

      // 3. Return secure URL
      return resp.secure_url;

    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      // Re-throw or handle the error gracefully
      throw new Error(`Failed to upload file to Cloudinary: ${(error as Error).message}`);
    }
  } else {
    // 4. Fallback for Local/Development Environment
    console.warn("CLOUDINARY_URL not set. Falling back to local file storage in /public/uploads.");
    
    try {
      // Define the destination directory within the Next.js /public folder
      const destDir = path.join(process.cwd(), "public", "uploads");
      
      // Ensure the directory exists recursively
      fs.mkdirSync(destDir, { recursive: true });
      
      // Define the final path
      const dest = path.join(destDir, filename);

      // Copy the file from the temporary location to the public folder
      fs.copyFileSync(localPath, dest);
      
      // Return a URL that the Next.js public server can serve
      // Note: This URL (e.g., /uploads/my_file.jpg) is accessible from the browser in dev/prod,
      // but the `upload.ts` route logic needs a full URL for the OCR service.
      // We return the local file path as requested in the initial route logic for consistency in dev/mock flow.
      return `file://${dest}`;
    } catch (e) {
      console.error("Local file copy failed:", e);
      throw new Error(`Failed to store file locally: ${(e as Error).message}`);
    } finally {
      // Best practice: clean up the formidable temporary file immediately
      try {
          fs.unlinkSync(localPath);
      } catch (cleanupError) {
          console.warn(`Failed to clean up local temp file ${localPath}:`, cleanupError);
      }
    }
  }
}