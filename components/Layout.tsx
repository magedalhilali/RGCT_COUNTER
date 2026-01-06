import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://static.wixstatic.com/media/756a6a_da52fb55ba344f6382055c1308c97eba~mv2.png" 
              alt="Ramah Logo" 
              className="h-10 w-auto object-contain"
            />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Ramah Counter
            </h1>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Frequency Analysis Tool
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 flex-grow flex flex-col">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} Ramah Counter. All rights reserved.
          </p>
          <p className="text-sm font-medium text-slate-500">
            Developed by: <span className="text-slate-700">Maged Al Hilali</span>
          </p>
        </div>
      </footer>
    </div>
  );
};