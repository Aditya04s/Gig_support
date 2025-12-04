Generate dashboard/page.tsx for Next.js that:
- Loads extracted results from localStorage (client-side only).
- Renders AuditReportCard for each audit field.
- Provides a Download PDF button that calls /api/report.
- Shows a clean layout.
B) Description
Displays:

✔ Parsed data
✔ Audit results
✔ Button to generate PDF

C) Code Skeleton
tsx
Copy code
"use client";

import { useEffect, useState } from "react";
import AuditReportCard from "@/components/AuditReportCard";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("extracted");
    if (saved) setData(JSON.parse(saved));
  }, []);

  if (!data) return <p>No audit data found.</p>;

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">Audit Results</h1>
      <AuditReportCard data={data} />
    </div>
  );
}