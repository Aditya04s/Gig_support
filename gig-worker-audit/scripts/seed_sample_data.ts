SYSTEM: Senior TS dev. Output only TS file.

TASK: Create a small script to seed the DB with a sample Worker, EarningsRecord and AuditResult for local development. Use dbConnect and models.
Code skeleton

ts
Copy code
// scripts/seed_sample_data.ts
import dbConnect from "../backend/utils/dbConnect";
import Worker from "../backend/models/Worker";
import EarningsRecord from "../backend/models/EarningsRecord";
import AuditResult from "../backend/models/AuditResult";

async function seed() {
  await dbConnect();
  const w = await Worker.create({ workerId: "demo-worker-1", name: "Demo Worker" });
  const rec = await EarningsRecord.create({
    workerId: w.workerId,
    platform: "swiggy",
    date: "2025-12-01",
    screenshotUrl: "file://demo",
    rawText: "Total: ₹420\nBase: ₹250\nBonus: ₹100\nPenalty: ₹50",
    parsedData: { total: 420, basePay: 250, bonus: 100, penalties: [{ amount: 50 }] },
  });

  const audit = await AuditResult.create({
    recordId: rec._id,
    parsedSnapshot: rec.parsedData,
    fairnessScore: 0.7,
    missingAmount: 20,
    penaltyMismatch: true,
    explanation: "Demo explanation",
  });

  console.log("Seed complete:", { worker: w, record: rec, audit });
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });