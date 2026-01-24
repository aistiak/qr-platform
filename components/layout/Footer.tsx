'use client';

export function Footer() {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} QR Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
