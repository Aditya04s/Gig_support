"use client";

import React, { useState, useEffect } from 'react';

// Define a structured interface for the data we expect to review and edit
interface ExtractedData {
  platform: string; // The selected platform (e.g., 'swiggy')
  dateRange: string; // The period covered by the screenshot
  basePay: number;
  bonus: number;
  incentives: number;
  penalties: number;
  totalDeductions: number;
  totalPayout: number; // The final amount paid to the worker
}

interface ExtractedFieldsReviewProps {
  // Data received from the OCR/AI extraction process
  extracted: ExtractedData;
  // Function to call when the user confirms the data, passing the final, edited data
  onConfirm: (data: ExtractedData) => void;
  // Loading state indication
  isLoading: boolean;
}

export default function ExtractedFieldsReview({ extracted, onConfirm, isLoading }: ExtractedFieldsReviewProps) {
  // Use state to manage the potentially edited data
  const [editedData, setEditedData] = useState<ExtractedData>(extracted);
  const [localMessage, setLocalMessage] = useState<{ type: 'error'; text: string } | null>(null);

  // Initialize state when the component mounts or 'extracted' prop changes
  useEffect(() => {
    setEditedData(extracted);
  }, [extracted]);

  // Handle changes in input fields
  const handleFieldChange = (field: keyof ExtractedData, value: string) => {
    setLocalMessage(null);
    
    // Only allow numeric fields to update, and convert string to number
    if (typeof editedData[field] === 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) && value !== '') {
        setLocalMessage({ type: 'error', text: 'Please enter a valid number for monetary fields.' });
        return;
      }
      setEditedData(prev => ({
        ...prev,
        [field]: numValue || 0, // Default to 0 if input is empty or just '.'
      }));
    } else {
      // Handle string fields if needed (e.g., dateRange, platform)
      setEditedData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };
  
  // Calculate the total amount earned (before deductions) and final net pay
  const calculatedTotalGross = editedData.basePay + editedData.bonus + editedData.incentives;
  const calculatedNetPay = calculatedTotalGross - editedData.totalDeductions;


  // Component for a reusable editable field
  const EditableField = ({ label, field, value }: { label: string, field: keyof ExtractedData, value: number }) => (
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
          onChange={(e) => handleFieldChange(field, e.target.value)}
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
          The fields below were extracted from your screenshot. Please review and correct any values before proceeding.
        </p>
      </div>

      {localMessage && (
        <div className="p-3 rounded-lg text-sm bg-red-100 text-red-700 border border-red-300" role="alert">
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
        <EditableField label="Base Pay / Trip Pay" field="basePay" value={editedData.basePay} />
        <EditableField label="Incentives" field="incentives" value={editedData.incentives} />
        <EditableField label="Bonus / Tips" field="bonus" value={editedData.bonus} />
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
        <EditableField label="Penalties / Fines" field="penalties" value={editedData.penalties} />
        <EditableField label="Other Total Deductions" field="totalDeductions" value={editedData.totalDeductions} />
      </div>

      {/* Final Summary Check */}
      <div className="space-y-2 border-t pt-4">
         <StaticField 
            label="Calculated Net Pay (Gross - Deductions)" 
            value={`₹${calculatedNetPay.toFixed(2)}`} 
            isHighlight={true} 
        />
        <StaticField 
            label="Original Final Payout (from Screenshot)" 
            value={`₹${editedData.totalPayout.toFixed(2)}`} 
            isHighlight={true} 
        />
      </div>

      {/* Action Button */}
      <div className="pt-4">
        <button
          onClick={() => onConfirm(editedData)}
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