import React from 'react';

// Define the structure for the audit data prop
interface AuditData {
  platform: string;
  totalEarnings: number; // Total amount worker received (or expected)
  missingAmount: number; // Amount determined to be unfairly withheld
  penaltyMismatch: boolean; // True if penalties deducted seem non-compliant
  ratingIssue: boolean; // True if rating system shows irregularities
  explanation: string; // Detailed summary of findings
  auditTimestamp: string; // Date/time of the audit
}

export default function AuditReportCard({ data }: { data: AuditData }) {
  const { 
    platform, 
    totalEarnings, 
    missingAmount, 
    penaltyMismatch, 
    ratingIssue, 
    explanation,
    auditTimestamp
  } = data;

  // Determine the overall compliance status
  const isCompliant = missingAmount === 0 && !penaltyMismatch && !ratingIssue;
  
  const statusClasses = isCompliant
    ? "bg-green-100 text-green-800 border-green-300"
    : "bg-red-100 text-red-800 border-red-300";
    
  const statusText = isCompliant ? "COMPLIANT" : "NON-COMPLIANT";

  const renderIssueChip = (isIssue: boolean, label: string) => (
    <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${
      isIssue ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
    }`}>
      {isIssue ? '⚠️ ' + label : '✅ ' + label}
    </span>
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-6 transition-all duration-300 hover:shadow-xl">
      
      {/* Header and Compliance Status */}
      <div className="flex justify-between items-start border-b pb-4 mb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-900">
            Fairness Audit Report
          </h2>
          <p className="text-sm text-gray-500">
            Platform: <span className="font-semibold capitalize">{platform}</span> | 
            Audited on: {new Date(auditTimestamp).toLocaleDateString()}
          </p>
        </div>
        <div className={`px-4 py-1.5 text-lg font-bold rounded-full border ${statusClasses}`}>
          {statusText}
        </div>
      </div>

      {/* Financial Summary Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CardStat title="Total Earnings Analyzed" value={`₹${totalEarnings.toFixed(2)}`} />
        <CardStat 
          title="Potential Missing Pay" 
          value={`₹${missingAmount.toFixed(2)}`} 
          isAlert={missingAmount > 0} 
        />
        <CardStat 
          title="Net Compliance Status" 
          value={isCompliant ? "OK" : "CHECK REQUIRED"} 
          isAlert={!isCompliant} 
        />
      </div>

      {/* Issue Summary */}
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-800 border-t pt-4">Key Issue Flags</h3>
        <div className="flex flex-wrap gap-3">
          {renderIssueChip(missingAmount > 0, 'Pay Discrepancy')}
          {renderIssueChip(penaltyMismatch, 'Penalty Mismatch')}
          {renderIssueChip(ratingIssue, 'Rating System Irregularity')}
        </div>
      </div>
      
      {/* Detailed Explanation */}
      <div className="pt-4 border-t">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">Detailed Audit Findings</h3>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{explanation}</p>
        </div>
      </div>
    </div>
  );
}

// Sub-component for clean rendering of statistics
const CardStat = ({ title, value, isAlert = false }: { title: string, value: string, isAlert?: boolean }) => (
    <div className={`p-4 rounded-lg transition-colors ${isAlert ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'}`}>
        <p className={`text-2xl font-extrabold ${isAlert ? 'text-red-600' : 'text-blue-600'}`}>{value}</p>
        <p className="text-sm font-medium text-gray-500 mt-1">{title}</p>
    </div>
);