'use client';

import { useState, useRef, useEffect } from 'react';

interface SearchResult {
  headline: string;
  source: string;
  url: string;
}

interface SearchResponse {
  topic: string;
  searched_at: string;
  count: number;
  headlines: SearchResult[];
}

interface SearchBarProps {
  onAnalyze?: (topic: string) => void;
}

export default function SearchBar({ onAnalyze }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    try {
      const API_URLS = [
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      ];
      
      let response;
      let lastError;
      
      for (const API_URL of API_URLS) {
        try {
          response = await fetch(`${API_URL}/search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ topic: searchQuery }),
          });
          
          if (response.ok) {
            break;
          }
          lastError = new Error('Search failed');
        } catch (err) {
          lastError = err;
          continue;
        }
      }
      
      if (!response || !response.ok) {
        throw lastError || new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setResults(data.headlines);
      setIsOpen(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce search - wait 500ms after user stops typing
    timeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 500);
  };

  const handleResultClick = (url: string, headline: string) => {
    if (onAnalyze) {
      onAnalyze(headline);
    }
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <div ref={searchRef} className="relative">
      {/* Mobile: Icon Button */}
      <button
        onClick={() => setIsMobileExpanded(!isMobileExpanded)}
        className="md:hidden w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-yellow-600/30 
                   flex items-center justify-center text-yellow-500 hover:border-yellow-500/60 
                   transition-all duration-300 shadow-lg shadow-black/50"
        aria-label="Search"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>

      {/* Mobile Expanded Search */}
      {isMobileExpanded && (
        <div className="md:hidden fixed inset-x-4 top-20 z-50">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Search news..."
              className="w-full px-6 py-3 rounded-full bg-black/95 backdrop-blur-md border border-yellow-600/30 
                         text-white placeholder-gray-400 outline-none focus:border-yellow-500/60 
                         transition-all duration-300 font-mono text-sm tracking-wider
                         shadow-lg shadow-black/50"
              onFocus={() => results.length > 0 && setIsOpen(true)}
              autoFocus
            />
            
            {/* Close button for mobile */}
            <button
              onClick={() => {
                setIsMobileExpanded(false);
                setQuery('');
                setResults([]);
                setIsOpen(false);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Results Dropdown */}
          <div
            className={`mt-2 rounded-2xl bg-black/95 backdrop-blur-xl 
                        border border-yellow-600/30 shadow-2xl shadow-black/70 overflow-hidden
                        transition-all duration-300 ease-out origin-top
                        ${(isOpen && results.length > 0) || isLoading
                          ? 'opacity-100 scale-100 max-h-96' 
                          : 'opacity-0 scale-95 max-h-0 pointer-events-none'
                        }`}
          >
            {isLoading && (
              <div className="p-8 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p 
                  className="text-yellow-500 text-sm tracking-wider"
                  style={{ fontFamily: 'monospace, Courier New, Courier' }}
                >
                  Loading results...
                </p>
              </div>
            )}

            {!isLoading && (
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {results.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      handleResultClick(result.url, result.headline);
                      setIsMobileExpanded(false);
                    }}
                    className="p-4 border-b border-yellow-600/10 hover:bg-yellow-600/10 
                               cursor-pointer transition-all duration-200 group"
                    style={{ color: '#ffffff' }}
                  >
                    <h3 className="text-sm leading-relaxed group-hover:text-yellow-400 
                                   transition-colors duration-200"
                        style={{ 
                          fontFamily: 'monospace, Courier New, Courier',
                          color: 'inherit'
                        }}>
                      {result.headline}
                    </h3>
                    <p className="text-xs mt-1 tracking-wide"
                       style={{ 
                         fontFamily: 'monospace, Courier New, Courier',
                         color: '#9ca3af'
                       }}>
                      {result.source}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && results.length > 0 && (
              <div className="px-4 py-2 bg-black/50 border-t border-yellow-600/20">
                <p className="text-xs tracking-wider"
                   style={{ 
                     fontFamily: 'monospace, Courier New, Courier',
                     color: '#6b7280'
                   }}>
                  {results.length} result{results.length !== 1 ? 's' : ''} found
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop: Full Search Input */}
      <div className="hidden md:block relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search news..."
          className="w-80 px-6 py-3 rounded-full bg-black/40 backdrop-blur-md border border-yellow-600/30 
                     text-white placeholder-gray-400 outline-none focus:border-yellow-500/60 
                     transition-all duration-300 font-mono text-sm tracking-wider
                     shadow-lg shadow-black/50"
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
        
        {/* Search Icon */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Desktop Results Dropdown */}
      <div
        className={`hidden md:block absolute top-full mt-2 w-full rounded-2xl bg-black/90 backdrop-blur-xl 
                    border border-yellow-600/30 shadow-2xl shadow-black/70 overflow-hidden
                    transition-all duration-300 ease-out origin-top z-50
                    ${(isOpen && results.length > 0) || isLoading
                      ? 'opacity-100 scale-100 max-h-96' 
                      : 'opacity-0 scale-95 max-h-0 pointer-events-none'
                    }`}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p 
              className="text-yellow-500 text-sm tracking-wider"
              style={{ fontFamily: 'monospace, Courier New, Courier' }}
            >
              Loading results...
            </p>
          </div>
        )}

        {/* Results List */}
        {!isLoading && (
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
          {results.map((result, index) => (
            <div
              key={index}
              onClick={() => handleResultClick(result.url, result.headline)}
              className="p-4 border-b border-yellow-600/10 hover:bg-yellow-600/10 
                         cursor-pointer transition-all duration-200 group"
              style={{ color: '#ffffff' }}
            >
              <h3 className="text-sm leading-relaxed group-hover:text-yellow-400 
                             transition-colors duration-200"
                  style={{ 
                    fontFamily: 'monospace, Courier New, Courier',
                    color: 'inherit'
                  }}>
                {result.headline}
              </h3>
              <p className="text-xs mt-1 tracking-wide"
                 style={{ 
                   fontFamily: 'monospace, Courier New, Courier',
                   color: '#9ca3af'
                 }}>
                {result.source}
              </p>
            </div>
          ))}
        </div>
        )}

        {/* Results count footer */}
        {!isLoading && results.length > 0 && (
          <div className="px-4 py-2 bg-black/50 border-t border-yellow-600/20">
            <p className="text-xs tracking-wider"
               style={{ 
                 fontFamily: 'monospace, Courier New, Courier',
                 color: '#6b7280'
               }}>
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
