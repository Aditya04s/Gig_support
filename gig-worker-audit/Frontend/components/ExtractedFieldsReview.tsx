"use client";

import React, { useState, useEffect, useMemo } from 'react';

// Define the penalty structure from the backend
interface Penalty {
  type?: string;
  amount: number;
}

// Define the structured interface for the data we expect to review and edit
// This MUST align with the backend's ParsedData and the audit route's expectation
interface ExtractedData {
  platform: string;
  dateRange: string; // Used for display only, pulled from date in FE logic later
  basePay: number;
  bonus: number;
  distancePay: number; // New field from backend
  penalties: Penalty[]; // Array structure from backend
  totalPayout: number; // The final amount paid to the worker (BE: total)
}

interface ExtractedFieldsReviewProps {
  // Data received from the OCR/AI extraction process
  extracted: Omit<ExtractedData, 'dateRange'> & { date?: string }; // Extracted data from the BE
  // The ID of the record saved in the DB
  recordId: string;
  // Function to call for redirection/state update in the parent
  onAuditStart: () => void;
  onAuditComplete: (auditRecordId: string) => void;
}

export default function ExtractedFieldsReview({ extracted, recordId, onAuditStart, onAuditComplete }: ExtractedFieldsReviewProps) {
  // Map the backend's structure to the frontend's editable state
  const initialData: ExtractedData = useMemo(() => ({
    platform: extracted.platform || 'unknown',
    dateRange: extracted.date || 'N/A',
    basePay: extracted.basePay || 0,
    bonus: extracted.bonus || 0,
    distancePay: extracted.distancePay || 0,
    penalties: extracted.penalties || [],
    totalPayout: extracted.total || 0,
  }), [extracted]);

  const [editedData, setEditedData] = useState<ExtractedData>(initialData);
  const [localMessage, setLocalMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);


  // Handle changes in input fields
  const handleFieldChange = (field: keyof Omit<ExtractedData, 'penalties' | 'dateRange' | 'platform'>, value: string) => {
    setLocalMessage(null);
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) && value !== '') {
      setLocalMessage({ type: 'error', text: 'Please enter a valid number for monetary fields.' });
      return;
    }
    
    setEditedData(prev => ({
      ...prev,
      [field]: numValue || 0, // Default to 0 if input is empty or just '.'
    }));
  };

  // Handle changes in penalty amounts (simple case: only one penalty)
  const handlePenaltyChange = (value: string) => {
    setLocalMessage(null);
    const numValue = parseFloat(value);
    
    if (isNaN(numValue) && value !== '') {
      setLocalMessage({ type: 'error', text: 'Please enter a valid number for penalty amount.' });
      return;
    }
    
    const amount = Math.abs(numValue) || 0;

    setEditedData(prev => ({
      ...prev,
      // Assuming only one penalty is editable for simplicity, or sum all into one editable field
      penalties: [{ type: prev.penalties[0]?.type || 'Deduction', amount: amount }]
    }));
  };

  // Calculate the total amount earned (before deductions) and final net pay
  const totalPenaltyAmount = editedData.penalties.reduce((sum, p) => sum + p.amount, 0);
  const calculatedTotalGross = editedData.basePay + editedData.bonus + editedData.distancePay;
  const calculatedNetPay = calculatedTotalGross - totalPenaltyAmount;

  // Function to call the audit API
  const startAudit = async () => {
    setLocalMessage(null);
    setIsLoading(true);
    onAuditStart();

    // Prepare the data payload for the audit API
    // The Audit API expects the recordId OR the full parsed data
    const payload = {
      recordId: recordId, // Use the stored record
      parsedData: { 
        // Pass the corrected/edited data as a potential override to the stored snapshot
        platform: editedData.platform,
        total: editedData.totalPayout,
        basePay: editedData.basePay,
        bonus: editedData.bonus,
        distancePay: editedData.distancePay,
        penalties: editedData.penalties,
      },
      // You could add worker context here if you had it
      context: {},
    };

    try {
      const res = await fetch("/api/audit", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Audit failed with status: ${res.status}`);
      }

      const data = await res.json();
      
      // Temporary persistence for demonstration only (SHOULD BE REPLACED by a proper state management)
      localStorage.setItem("extractedResult", JSON.stringify({
        ...data.audit,
        platform: editedData.platform,
        totalEarnings: editedData.totalPayout, // Map BE's total to FE's expected totalEarnings
        auditTimestamp: new Date().toISOString()
      }));

      setLocalMessage({ type: 'success', text: 'Audit successful. Redirecting to dashboard...' });
      
      // Delay redirection briefly to show success message
      setTimeout(() => {
        onAuditComplete(data.auditRecordId);
      }, 1000);

    } catch (error) {
      console.error("Audit Error:", error);
      setLocalMessage({ type: 'error', text: `Failed to run audit: ${(error as Error).message}` });
      setIsLoading(false);
    }
  };


  // Component for a reusable editable field
  const EditableField = ({ label, field, value, onChange }: { label: string, field: keyof ExtractedData, value: number, onChange: (value: string) => void }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <label htmlFor={field} className="text-sm font-medium text-gray-700 w-1/2">
        {label}
      </label>
      <div className="relative w-1/2">
        <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
        <input
          id={field}
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors text-right"
        />
      </div>
    </div>
  );
  
  // Component for a static display field
  const StaticField = ({ label, value, isHighlight = false }: { label: string, value: string, isHighlight?: boolean }) => (
    <div className="flex justify-between items-center py-2">
      <p className={`text-sm ${isHighlight ? 'font-bold text-gray-800' : 'text-gray-600'} w-1/2`}>{label}</p>
      <p className={`text-right w-1/2 ${isHighlight ? 'font-bold text-lg text-blue-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-6 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <div className="text-center border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Review Extracted Earning Data</h2>
        <p className="text-gray-600 mt-1">
          The fields below were extracted from your screenshot. Review and correct any values before proceeding to the compliance audit.
        </p>
      </div>

      {localMessage && (
        <div className={`p-3 rounded-lg text-sm ${localMessage.type === 'error' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-green-100 text-green-700 border border-green-300'}`} role="alert">
          {localMessage.text}
        </div>
      )}

      {/* Static Context Fields */}
      <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
        <StaticField label="Platform" value={editedData.platform.toUpperCase()} />
        <StaticField label="Earning Period" value={editedData.dateRange} />
      </div>

      {/* Editable Earning Fields */}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Earnings Components</h3>
        <EditableField 
          label="Base Pay / Trip Pay" 
          field="basePay" 
          value={editedData.basePay} 
          onChange={(v) => handleFieldChange('basePay', v)}
        />
        <EditableField 
          label="Bonus / Tips" 
          field="bonus" 
          value={editedData.bonus} 
          onChange={(v) => handleFieldChange('bonus', v)}
        />
        <EditableField 
          label="Distance / Fuel Pay" 
          field="distancePay" 
          value={editedData.distancePay} 
          onChange={(v) => handleFieldChange('distancePay', v)}
        />
      </div>
      
      {/* Calculated Gross */}
      <StaticField 
        label="Calculated Total Gross Pay" 
        value={`₹${calculatedTotalGross.toFixed(2)}`} 
        isHighlight={true} 
      />

      {/* Editable Deduction Fields */}
      <div className="space-y-1 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Deductions & Charges</h3>
        <EditableField 
          label="Total Penalties / Fines" 
          field="penalties" 
          value={totalPenaltyAmount} 
          onChange={handlePenaltyChange}
        />
        {/* Removed 'Other Total Deductions' to simplify model alignment */}
      </div>

      {/* Final Summary Check */}
      <div className="space-y-2 border-t pt-4">
         <StaticField 
            label="Calculated Net Pay (Gross - Penalties)" 
            value={`₹${calculatedNetPay.toFixed(2)}`} 
            isHighlight={true} 
        />
        <StaticField 
            label="Original Final Payout (from Screenshot)" 
            value={`₹${editedData.totalPayout.toFixed(2)}`} 
            isHighlight={true} 
        />
        <p className="text-sm text-gray-500 pt-1 text-center">
            Note: The Audit Engine will check if the difference between the two Net Pay values is justified.
        </p>
      </div>

      {/* Action Button */}
      <div className="pt-4">
        <button
          onClick={startAudit}
          disabled={isLoading}
          className={`w-full flex items-center justify-center px-8 py-3 text-lg font-semibold text-white rounded-lg shadow-md transition-all duration-200 
            ${isLoading
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-green-300'
            }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Starting Audit...
            </>
          ) : (
            'Confirm & Start Compliance Audit'
          )}
        </button>
      </div>
    </div>
  );
}