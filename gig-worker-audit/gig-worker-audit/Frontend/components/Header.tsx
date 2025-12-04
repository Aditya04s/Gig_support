import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-10 bg-white shadow-md border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo/Branding */}
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900 hover:text-blue-600 transition duration-150">
            Gig Worker Audit
          </Link>
          
          {/* Navigation Links (minimal for this app) */}
          <nav>
            <Link 
              href="/" 
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition duration-150 p-2 rounded-lg"
            >
              Home
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}