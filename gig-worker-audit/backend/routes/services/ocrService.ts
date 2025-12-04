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
    if (!AI_API_KEY) {
      console.warn("AI_API_KEY not set. Returning mocked OCR text for demonstration.");
      // Mocked demo text - essential for testing the parsing service without a live API
      return {
        rawText: `
          Gig Platform Earnings Summary
          Platform: Deliveroo
          Date: 2025-12-05
          Total Earnings: ₹420.00
          Base Pay: ₹250.00
          Incentive/Bonus: ₹100.00
          Deduction/Penalty: ₹50.00
          Trip Count: 10
          Hours Logged: 2.5
        `.trim(),
        metadata: { source: "mocked" },
      };
    }

    // --- TODO: REAL IMPLEMENTATION: Integrate Gemini Pro Vision or other OCR API ---

    // 1. Prepare the request body (specific to your chosen API)
    // For Gemini Pro Vision (via SDK or REST API):
    /*
    const prompt = "Extract all text and numerical data from this earnings screenshot, including platform name, dates, all financial figures (base, bonus, penalty, total), and any work metrics (hours, trips). Output the raw text in a clean, easily pars