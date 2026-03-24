import { Link, Outlet, useLocation } from "react-router-dom";
import { BookMarked, Home, Library, BookOpenCheck, Settings } from "lucide-react";
import { cn } from "../utils/cn";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Bookshelf", href: "/bookshelf", icon: BookMarked },
  { name: "Vocabulary", href: "/vocabulary", icon: Library },
  { name: "Flashcards", href: "/flashcards", icon: BookOpenCheck },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar Navigation */}
      <aside className="fixed inset-y-0 z-50 flex w-72 flex-col bg-slate-900 text-white shadow-xl transition-all duration-300">
        <div className="flex h-16 items-center px-6 border-b border-slate-800">
          <BookMarked className="h-8 w-8 text-primary-400 mr-3" />
          <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-primary-400 to-emerald-400 bg-clip-text text-transparent">WordShelf</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary-600 shadow-md shadow-primary-900/50 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-200",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-primary-400 group-hover:scale-110"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <Link
            to="/settings"
            className="group flex items-center px-4 py-3 text-sm font-medium rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Settings className="mr-3 h-5 w-5 text-slate-400 group-hover:text-white" />
            Settings
          </Link>
          <div className="mt-4 px-4 py-3 flex items-center gap-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary-500 to-emerald-500 flex items-center justify-center text-sm font-bold shadow-inner">
              US
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">User Student</p>
              <p className="text-xs text-slate-400 truncate">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col pl-72">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-md px-8 sticky top-0 z-40">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 capitalize tracking-tight">
              {location.pathname.split('/').pop() || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <button className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full transition-colors">
              <span className="sr-only">View notifications</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

