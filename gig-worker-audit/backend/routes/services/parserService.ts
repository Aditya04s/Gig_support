// backend/services/parserService.ts

/**
 * @typedef {Object} Penalty
 * @property {string} [type] The type of penalty (e.g., 'fuel surcharge', 'late delivery').
 * @property {number} amount The monetary amount of the penalty.
 */
type Penalty = {
  type?: string;
  amount: number;
};

/**
 * @typedef {Object} ParsedData
 * @property {string} [platform] The platform name (e.g., 'Swiggy', 'Uber').
 * @property {string} [date] The main earnings date or period start date (ISO format preferred).
 * @property {number} [total] The total earnings amount.
 * @property {number} [basePay] The base earnings component.
 * @property {number} [bonus] The bonus/incentive component.
 * @property {number} [distancePay] Payment specifically for distance/fuel.
 * @property {Penalty[]} [penalties] An array of deductions or penalties.
 * @property {{ date?: string; rating?: number }[]} [ratings] An array of ratings received.
 * @property {string} [rawText] The raw text used for parsing (for debugging/audit).
 */
type ParsedData = {
  platform?: string;
  date?: string;
  total?: number;
  basePay?: number;
  bonus?: number;
  distancePay?: number;
  penalties?: Penalty[];
  ratings?: { date?: string; rating?: number }[];
  rawText?: string;
};

// --- Mocked LLM Call (to show integration point) ---
// Assume this function exists and uses the AI_API_KEY
const callLLMForParsing = async (text: string): Promise<Partial<ParsedData> | null> => {
    // In a real implementation, load the prompt template from ai/prompts/parse_earnings.prompt.md
    // const prompt = fs.readFileSync('ai/prompts/parse_earnings.prompt.md', 'utf-8')
    // and instruct the LLM (Gemini/GPT) to return a clean JSON object.

    console.log("Calling LLM for refinement...");

    // Mock LLM response to demonstrate merging/overriding
    return {
        total: 420.0,
        basePay: 250.0,
        bonus: 100.0,
        distancePay: 20.0, // LLM found an extra field
        date: "2025-12-05", // LLM standardized the date
        penalties: [{ type: "fine", amount: 50.0 }], // LLM structured the penalty better
    };
};
// --- End Mocked LLM Call ---

/**
 * Service responsible for converting raw OCR text into structured earnings data.
 * It uses simple regex heuristics as a primary pass and can optionally refine with an LLM.
 */
export const parserService = {
  /**
   * Converts raw text into a structured ParsedData object.
   *
   * @param {string} rawText The text extracted by the OCR service.
   * @param {any} [ctx] Optional context (e.g., { platform: 'Uber' }) to aid parsing.
   * @returns {Promise<ParsedData>} The structured earnings data.
   */
  async parse(rawText: string, ctx: any = {}): Promise<ParsedData> {
    const out: ParsedData = {
      rawText,
      penalties: [],
      ratings: [],
      platform: ctx.platform, // Start with platform from context if available
    };

    /** Utility to extract a number from a string, stripping common currency/separator characters. */
    const numFrom = (s: string): number | null => {
      // Remove commas, currency symbols ($, ₹, Rs, £), and look for a number
      const m = s.replace(/[,₹Rs$£]/g, "").match(/(\d+(\.\d{1,2})?)/);
      return m ? Number(m[1]) : null;
    };

    try {
      const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

      // --- 1. Regex Heuristics Pass ---
      for (const l of lines) {
        const low = l.toLowerCase();

        // Platform (prioritize context if available)
        if (!out.platform && low.includes("platform")) {
            out.platform = l.split(":")[1]?.trim() || out.platform;
        }

        // Dates
        if (!out.date && low.includes("date")) {
            // Regex for YYYY-MM-DD, MM/DD/YYYY, or DD/MM/YYYY formats
            const dateMatch = l.match(/(\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);
            if (dateMatch) {
                // TODO: Need robust date normalization (e.g., moment.js or native date parsing)
                out.date = dateMatch[0];
            }
        }

        // Financials (use `?? out.field` to ensure the first successful extraction is kept)
        if (low.match(/total|earned|net/i)) {
          out.total = numFrom(l) ?? out.total;
        }
        if (low.match(/base pay|basic|rate/i)) {
          out.basePay = numFrom(l) ?? out.basePay;
        }
        if (low.match(/bonus|incentive|extra/i)) {
          out.bonus = numFrom(l) ?? out.bonus;
        }
        if (low.match(/distanc|fuel|mileage/i)) {
          out.distancePay = numFrom(l) ?? out.distancePay;
        }
        
        // Penalties/Deductions
        if (low.match(/penalt|deduct|surcharge|fine/i)) {
          const amt = numFrom(l);
          if (amt !== null) {
            out.penalties!.push({ type: l.split(":")[0]?.trim() || "deduction", amount: amt });
          }
        }

        // Ratings (Simple extraction: look for X.X/5 or similar)
        if (low.match(/rating|feedback/i)) {
            const ratingMatch = l.match(/(\d\.\d|\d)\/\d/);
            if (ratingMatch) {
                out.ratings!.push({ rating: Number(ratingMatch[1]) });
            }
        }
      }

      // --- 2. LLM Refinement Pass (Optional) ---
      if (process.env.AI_API_KEY) {
        // This is where you call the LLM to take the raw text and return a canonical JSON object
        const llmResult = await callLLMForParsing(rawText);

        if (llmResult) {
            // Merge LLM result back into the output, prioritizing LLM's structured output
            Object.assign(out, llmResult);

            // Special handling for array fields (penalties, ratings) to ensure LLM's full array is used
            if (llmResult.penalties) out.penalties = llmResult.penalties;
            if (llmResult.ratings) out.ratings = llmResult.ratings;
        }
      }

      // 3. Post-processing/Cleanup (e.g., calculating total if missing)
      if (!out.total && out.basePay !== undefined && out.bonus !== undefined && out.penalties) {
          const totalPenalties = out.penalties.reduce((sum, p) => sum + p.amount, 0);
          out.total = (out.basePay + out.bonus + (out.distancePay ?? 0)) - totalPenalties;
          // Note: This calculation is heuristic and may not be accurate.
      }

      return out;

    } catch (e) {
      console.error("ParserService failed to process raw text:", e);
      // Return the partially parsed data on error
      return out;
    }
  },
};