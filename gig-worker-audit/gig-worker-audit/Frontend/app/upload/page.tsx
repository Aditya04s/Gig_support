import FileUploader from "@/components/FileUploader";

export default function UploadPage() {
  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Upload Your Screenshot
        </h1>
        <p className="text-gray-600 text-lg">
          Supported formats: PNG, JPG, JPEG. Please ensure all text in the image is clearly visible for accurate analysis.
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <FileUploader />
      </div>
    </div>
  );
}