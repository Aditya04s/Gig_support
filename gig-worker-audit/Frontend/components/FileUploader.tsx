"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
// Placeholder icon imports (using inline SVGs for compatibility)

// Utility function to convert file size to a readable string
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function FileUploader() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState<string>("");
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Available gig worker platforms
  const platforms = [
    { value: "swiggy", label: "Swiggy" },
    { value: "zomato", label: "Zomato" },
    { value: "uber", label: "Uber" },
    { value: "rapido", label: "Rapido" },
    { value: "urban", label: "Urban Company" },
    { value: "other", label: "Other / Unlisted" },
  ];

  const handleFiles = (files: FileList | null) => {
    setMessage(null);
    if (files && files.length > 0) {
      const selectedFile = files[0];
      if (!selectedFile.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Invalid file type. Please select an image (PNG, JPG, JPEG).' });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>, isActive: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(isActive);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    handleDrag(e, false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleDrag]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const imagePreviewUrl = useMemo(() => {
    return file ? URL.createObjectURL(file) : null;
  }, [file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!file || !platform) {
      setMessage({ type: 'error', text: 'Please select both a screenshot file and a platform.' });
      return;
    }

    setIsLoading(true);

    // *** NOTE ON DATA PERSISTENCE: ***
    // In a production environment, 'localStorage' is insufficient and disallowed.
    // Data should be stored securely in a persistent database (e.g., Firestore) 
    // after successful API processing. The current structure is for front-end demonstration.
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("platform", platform);

    try {
      const res = await fetch("/api/upload", { 
        method: "POST", 
        body: formData 
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status: ${res.status}`);
      }

      const data = await res.json();
      
      // Temporary persistence method for demonstration only (SHOULD BE REPLACED)
      localStorage.setItem("extractedResult", JSON.stringify(data.result || { success: true, message: "Analysis complete." }));

      setMessage({ type: 'success', text: 'Analysis successful. Redirecting...' });
      
      // Delay redirection briefly to show success message
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);

    } catch (error) {
      console.error("Upload Error:", error);
      setMessage({ type: 'error', text: `Failed to process file. ${(error as Error).message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-8">
      
      {/* Platform Selection */}
      <div className="space-y-2">
        <label htmlFor="platform-select" className="block text-sm font-medium text-gray-700">
          1. Select Gig Platform
        </label>
        <select
          id="platform-select"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          required
        >
          <option value="" disabled>-- Choose Platform --</option>
          {platforms.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* File Upload Area */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          2. Upload Screenshot
        </label>
        
        <div 
          className={`flex flex-col items-center justify-center p-12 border-2 rounded-lg transition-all duration-200 
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 border-dashed bg-gray-50 hover:bg-gray-100'} 
            cursor-pointer`}
          onDragEnter={(e) => handleDrag(e, true)}
          onDragOver={(e) => handleDrag(e, true)}
          onDragLeave={(e) => handleDrag(e, false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          {/* SVG for Upload Icon (Placeholder - using a simple cloud icon) */}
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 014 4v1H8a3 3 0 00-3 3v2h2m-2-4a1 1 0 001 1h8a1 1 0 001-1v-1a1 1 0 00-1-1H9a1 1 0 00-1 1v1z"></path>
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive ? "Drop the file here..." : "Drag and drop your file, or click to select"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG, JPEG (Max 10MB recommended)
          </p>
          <input
            id="file-input"
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* File Preview */}
      {file && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-inner">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Selected File: {file.name}</h3>
          <p className="text-xs text-gray-500 mb-4">{formatFileSize(file.size)} - {file.type}</p>
          
          <div className="max-h-64 w-full overflow-hidden rounded-lg border border-gray-300">
            <img 
              src={imagePreviewUrl || undefined} 
              alt="Screenshot Preview" 
              className="w-full h-auto object-contain"
              onLoad={() => { 
                if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); 
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => { setFile(null); setMessage(null); }}
            className="mt-3 text-xs text-red-600 hover:text-red-800 transition duration-150"
          >
            Remove File
          </button>
        </div>
      )}

      {/* Message Box (Error/Success) */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-green-100 text-green-700 border border-green-300'}`} role="alert">
          {message.text}
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={!file || !platform || isLoading}
          className={`w-full flex items-center justify-center px-8 py-3 text-base font-semibold text-white rounded-lg shadow-md transition-all duration-200 
            ${!file || !platform || isLoading
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300'
            }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing Screenshot...
            </>
          ) : (
            '3. Upload & Start Audit'
          )}
        </button>
      </div>

    </form>
  );
}