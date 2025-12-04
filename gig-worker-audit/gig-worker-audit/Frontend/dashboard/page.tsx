"use client";

import { useEffect, useState } from "react";
import AuditReportCard from "@/components/AuditReportCard";

// Define the expected structure saved in localStorage
interface AuditData {
    platform: string;
    totalEarnings: number;
    missingAmount: number;
    penaltyMismatch: boolean;
    ratingIssue: boolean;
    explanation: string;
    auditTimestamp: string;
    auditRecordId: string; // The ID needed for the PDF route
}

export default function DashboardPage() {
  const [data, setData] = useState<AuditData | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);

  useEffect(() => {
    // FIX: Read from the correct key: "extractedResult"
    const saved = localStorage.getItem("extractedResult");
    if (saved) {
        setData(JSON.parse(saved));
    }
  }, []);

  const handleDownloadPdf = async () => {
    if (!data || !data.auditRecordId) {
        alert("Audit record ID is missing. Cannot generate PDF.");
        return;
    }

    setIsLoadingPdf(true);
    try {
      // Call the backend /api/report route
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditRecordId: data.auditRecordId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `PDF generation failed with status: ${res.status}`);
      }

      // 1. Get the PDF blob
      const blob = await res.blob();
      
      // 2. Extract filename from headers (or use a default)
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = "audit-report.pdf";
      if (contentDisposition) {
          const match = contentDisposition.match(/filename="(.+)"/);
          if (match) {
              filename = match[1];
          }
      }

      // 3. Create a temporary link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (e) {
      console.error("PDF Download Error:", e);
      alert(`Failed to download report: ${(e as Error).message}`);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  if (!data) return (
    <div className="text-center p-10 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-semibold mb-3">No Audit Data Found</h1>
        <p className="text-gray-600">Please go back to the <a href="/upload" className="text-blue-600 hover:text-blue-700 font-medium">Upload Page</a> to begin an audit.</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Audit Results</h1>
        <button
          onClick={handleDownloadPdf}
          disabled={isLoadingPdf || !data.auditRecordId}
          className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-all duration-200 
            ${isLoadingPdf
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300'
            }`}
        >
          {isLoadingPdf ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating PDF...
            </>
          ) : (
            'Download PDF Report'
          )}
        </button>
      </div>

      <AuditReportCard data={data} />
    </div>
  );
}