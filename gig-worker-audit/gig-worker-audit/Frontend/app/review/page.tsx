"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ExtractedFieldsReview from "@/components/ExtractedFieldsReview";

// Define the expected structure from the FileUploader's localStorage save
interface UploadResult {
    recordId: string;
    parsedData: any; // Using 'any' as the structure is complex and validated in the component
}

export default function ReviewPage() {
    const router = useRouter();
    const [uploadData, setUploadData] = useState<UploadResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load the result saved by FileUploader
        const saved = localStorage.getItem("uploadResult");
        if (saved) {
            try {
                const data: UploadResult = JSON.parse(saved);
                if (data.recordId && data.parsedData) {
                    setUploadData(data);
                } else {
                    // Incomplete data, redirect
                    router.push("/upload");
                }
            } catch (e) {
                console.error("Failed to parse upload result:", e);
                router.push("/upload");
            }
        } else {
            // No data found, redirect
            router.push("/upload");
        }
        setLoading(false);
    }, [router]);

    // Handler passed to ExtractedFieldsReview to redirect upon successful audit completion
    const handleAuditComplete = (auditRecordId: string) => {
        // Clear the intermediate upload result
        localStorage.removeItem("uploadResult");
        // Redirect to the dashboard with the final audit data
        router.push("/dashboard");
    };
    
    // Handler for audit start (optional: useful for parent component state)
    const handleAuditStart = () => {
        // Optionally set a global loading state here
    };


    if (loading || !uploadData) {
        return (
            <div className="text-center p-10">
                <h1 className="text-2xl font-semibold text-gray-700">Loading data...</h1>
                <p className="text-gray-500 mt-2">Checking for extracted screenshot data.</p>
            </div>
        );
    }

    // Render the review component with the loaded data
    return (
        <div className="max-w-2xl mx-auto py-10">
            <ExtractedFieldsReview 
                extracted={{ 
                    // Spread the parsed data, and provide default dateRange for the FE component
                    ...uploadData.parsedData, 
                    dateRange: uploadData.parsedData.date || 'N/A' 
                }}
                recordId={uploadData.recordId}
                onAuditStart={handleAuditStart}
                onAuditComplete={handleAuditComplete}
            />
        </div>
    );
}