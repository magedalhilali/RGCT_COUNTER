import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col text-slate-900 relative">
      {/* Glass Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://static.wixstatic.com/media/756a6a_da52fb55ba344f6382055c1308c97eba~mv2.png" 
              alt="Ramah Counter" 
              className="h-10 w-auto object-contain"
            />
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              Ramah <span className="text-slate-400 font-normal">Counter</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
             {/* NEW: Developer Credit Pill */}
             <div className="hidden sm:block text-xs font-medium text-slate-500 bg-slate-100/50 px-3 py-1 rounded-full border border-slate-200/50">
               Developed by: Maged Al-Hilali
             </div>

             {/* Existing Beta Pill */}
             <div className="text-xs font-medium text-slate-500 bg-slate-100/50 px-3 py-1 rounded-full border border-slate-200/50">
               v2.0 Beta
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col lg:overflow-hidden">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-6 flex-grow flex flex-col lg:h-full">
          {children}
        </div>
      </main>
    </div>
  );
};
