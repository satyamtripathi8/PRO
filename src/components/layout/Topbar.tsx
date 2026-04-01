import React, { useState, useEffect, useRef } from "react";
import { Search, Bell, RefreshCw, Shuffle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { marketApi } from "../../lib/api";

interface TopbarProps {
  value?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  onShuffle?: () => void;
  onRefresh?: () => void;
}

export default function Topbar({
  value = "",
  onSearchChange,
  onSearchSubmit,
  onShuffle,
  onRefresh,
}: TopbarProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState(value);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (search.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await marketApi.search(search);
        setSearchResults(res.data ?? []);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    onSearchChange?.(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      onSearchSubmit?.(search);
      navigate("/Home/trade", { state: { searchQuery: search } });
      setShowResults(false);
    }
  };

  const handleResultClick = (symbol: string) => {
    setSearch("");
    setSearchResults([]);
    setShowResults(false);
    navigate("/Home/trade", { state: { searchQuery: symbol } });
  };

  return (
    <div className="sticky top-0 z-40 px-3 sm:px-4 md:px-8 py-3 md:py-4 bg-white/70 backdrop-blur-xl border-b border-gray-200 shadow-sm">
      
      <div className="flex items-center gap-2 md:gap-4">
        
        {/* ============================== */}
        {/* 🔹 Search (Flexible Full Width) */}
        {/* ============================== */}
        <div ref={searchRef} className="relative flex-1 max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 sm:gap-3 bg-white shadow-sm px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 
                       focus-within:ring-2 focus-within:ring-blue-400 transition-all duration-300"
          >
            <Search size={18} className="text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={handleChange}
              placeholder="Search stocks, indices..."
              className="outline-none w-full text-sm md:text-base bg-transparent placeholder:text-gray-400"
            />

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSearchResults([]);
                  setShowResults(false);
                  onSearchChange?.("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </form>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
              {searchResults.map((result: any, idx: number) => (
                <button
                  key={result.symbol + idx}
                  onClick={() => handleResultClick(result.symbol)}
                  className="w-full px-5 py-3 hover:bg-blue-50 flex items-center justify-between text-left border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{result.symbol}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{result.name}</p>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{result.exchange}</span>
                </button>
              ))}
            </div>
          )}

          {showResults && search.length >= 2 && searchResults.length === 0 && (
            <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-4 text-center text-sm text-gray-400">
              No results found for "{search}"
            </div>
          )}
        </div>

        {/* ============================== */}
        {/* 🔹 Actions */}
        {/* ============================== */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">
          
          <div className="hidden sm:block">
            <IconButton onClick={onShuffle}>
              <Shuffle size={18} />
            </IconButton>
          </div>

          <div className="hidden sm:block">
            <IconButton onClick={onRefresh} rotate>
              <RefreshCw size={18} />
            </IconButton>
          </div>

          {/* Notification Button */}
          <div ref={notifRef} className="relative">
            <IconButton onClick={() => setShowNotifications(!showNotifications)}>
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </IconButton>

            {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-800 font-medium">Welcome to Trevoros!</p>
                      <p className="text-xs text-gray-500 mt-0.5">Start trading with ₹1,00,000 virtual balance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-800 font-medium">Market Hours</p>
                      <p className="text-xs text-gray-500 mt-0.5">NSE: 9:15 AM – 3:30 PM IST</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-400">You're all caught up!</p>
                </div>
              </div>
            )}
          </div>

          {/* Profile Button */}
          <div className="hidden sm:flex items-center pl-2 border-l border-gray-200">
            <button
              onClick={() => navigate("/Home/Profile")}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm shadow hover:shadow-md hover:scale-105 transition-all cursor-pointer"
            >
              U
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ============================== */
/* 🔹 Icon Button */
/* ============================== */
function IconButton({
  children,
  onClick,
  rotate = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  rotate?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "relative p-3 rounded-xl bg-white border border-gray-200 shadow-sm",
        "hover:shadow-md hover:-translate-y-0.5 active:scale-90",
        "transition-all duration-200",
        rotate && "hover:rotate-180 duration-300"
      )}
    >
      {children}
    </button>
  );
}