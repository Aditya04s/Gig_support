// backend/services/ocrService.ts

/**
 * @typedef {Object} OcrResult
 * @property {string} rawText The raw, extracted text content from the image.
 * @property {any} [metadata] Optional metadata returned by the OCR/Vision provider (e.g., confidence scores, block data).
 */
type OcrResult = {
  rawText: string;
  metadata?: any;
};

/**
 * Service responsible for communicating with the Vision/OCR provider (e.g., Gemini Pro Vision, Google Vision API, Tesseract).
 * It centralizes the logic for extracting text from an image URL.
 */
export const ocrService = {
  /**
   * Extracts raw text from an image file URL.
   *
   * @param {string} fileUrl The publicly accessible URL of the image file (e.g., Cloudinary, S3 URL).
   * @returns {Promise<OcrResult>} The extracted raw text and optional metadata.
   */
  async extract(fileUrl: string): Promise<OcrResult> {
    const AI_API_KEY = process.env.AI_API_KEY;

    // --- MOCK/DEMO FALLBACK ---
    // Keep a mock fallback for local development or when the AI key is missing/file is local.
    if (!AI_API_KEY || fileUrl.startsWith('file://')) {
      console.warn("AI_API_KEY not set or using local file. Returning mocked OCR text for demonstration.");
      // Ensure the mock text is rich enough for parserService.ts to successfully parse.
      return {
        rawText: `
          Gig Platform Earnings Summary
          Platform: Deliveroo
          Date: 2025-12-05
          Total Earnings: ₹420.00
          Base Pay: ₹250.00
          Incentive/Bonus: ₹100.00
          Distance Pay: ₹20.50
          Deduction/Penalty: ₹50.00 (Safety Fine)
          Trip Count: 10
          Hours Logged: 2.5
          Rating: 4.8/5
        `.trim(),
        metadata: { source: "mocked" },
      };
    }

    // --- REAL IMPLEMENTATION: Integrate AI/OCR API ---
    // The image URL must be publicly accessible (e.g., a Cloudinary or S3 URL).
    
    const prompt = "Extract all text and numerical data from this gig worker earnings screenshot. List all financial figures (Total Earnings, Base Pay, Bonus, Penalties) and key context (Platform, Date/Period) in a clean, easily readable list format.";
    
    try {
        // --- TODO: INSERT REAL AI/OCR API CALL LOGIC HERE ---
        // This is where you would use an SDK (e.g., for Gemini) to send the prompt 
        // and the `fileUrl` to the vision model and receive the extracted text.
        
        console.error("OCR Service is in placeholder mode. Real AI API implementation required.");
        // Throw an error to indicate missing implementation if the mock path is skipped
        throw new Error("OCR Service not fully implemented. Please configure AI_API_KEY and real vision API call logic.");
        
    } catch (error) {
        console.error("AI/OCR extraction failed:", error);
        throw new Error(`Failed to extract text from image: ${(error as Error).message}`);
    }
  },
};