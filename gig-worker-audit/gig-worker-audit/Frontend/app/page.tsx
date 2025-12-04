import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 text-center space-y-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
          Gig Worker Rights <span className="text-blue-600">Verification System</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
          Empowering gig workers with data transparency. Upload your earnings or ratings 
          screenshot and let our AI-powered audit verify fairness and compliance.
        </p>
      </div>

      <div className="pt-4">
        <Link
          href="/upload"
          className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Upload Screenshot
        </Link>
      </div>
    </div>
  );
}   