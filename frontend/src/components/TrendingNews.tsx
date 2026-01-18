'use client';

import { useState, useEffect } from 'react';

interface NewsItem {
  rank: number;
  headline: string;
  analysis: {
    location: string;
    topic: string;
    headline: string;
    date_analyzed: string;
    perspectives: any[];
    common_facts: string[];
    key_disagreements: string[];
    social_media_voices: any[];
    summary: string;
    information_quality: string;
  };
}

interface DailyNewsResponse {
  date: string;
  fetched_at: string;
  count: number;
  news: NewsItem[];
}

interface TrendingNewsProps {
  onAnalyze?: (analysis: any) => void;
  onExpandChange?: (isExpanded: boolean) => void;
  forceCollapse?: number;
}

export default function TrendingNews({ onAnalyze, onExpandChange, forceCollapse }: TrendingNewsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Notify parent when expanded state changes
  useEffect(() => {
    onExpandChange?.(isExpanded);
  }, [isExpanded, onExpandChange]);

  // Collapse when parent requests
  useEffect(() => {
    if (forceCollapse) {
      setIsExpanded(false);
    }
  }, [forceCollapse]);

  // Fetch daily news from backend
  useEffect(() => {
    const fetchDailyNews = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const API_URLS = [
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        ];
        
        let response;
        let lastError;
        
        for (const API_URL of API_URLS) {
          try {
            response = await fetch(`${API_URL}/daily-news`);
            
            if (response.ok) {
              break;
            }
            lastError = new Error('Failed to fetch daily news');
          } catch (err) {
            lastError = err;
            continue;
          }
        }
        
        if (!response || !response.ok) {
          throw lastError || new Error('Failed to fetch daily news');
        }
        
        const data: DailyNewsResponse = await response.json();
        setNewsItems(data.news);
      } catch (err) {
        console.error('Error fetching daily news:', err);
        setError('Failed to load news');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDailyNews();
  }, []);

  return (
    <>
      {/* Sidebar Container */}
      <div className={`sidebar-container ${isExpanded ? 'expanded' : ''}`}>
        {/* Header */}
        <div className="sidebar-header" onClick={() => setIsExpanded(!isExpanded)}>
          <span className="header-text">TOP 10 NEWS</span>
          <span className="expand-icon">{isExpanded ? '▼' : '▲'}</span>
        </div>

        {/* News List */}
        <div className="sidebar-content">
          {isLoading ? (
            <div className="loading-state">Loading...</div>
          ) : error ? (
            <div className="error-state">Error</div>
          ) : newsItems.length === 0 ? (
            <div className="empty-state">No news</div>
          ) : (
            newsItems.map((item) => (
              <div 
                key={item.rank} 
                className="news-item"
                onClick={() => onAnalyze && onAnalyze(item.analysis)}
              >
                <div className="news-rank">#{item.rank}</div>
                <div className="news-content">
                  <h3 className="news-title">{item.analysis.headline}</h3>
                  <div className="news-meta">
                    <span className="news-location">{item.analysis.location}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        /* Sidebar Container */
        .sidebar-container {
          position: fixed;
          left: 24px;
          bottom: 24px;
          z-index: 40;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(234, 179, 8, 0.3);
          border-radius: 12px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          width: 280px;
          height: 50px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sidebar-container.expanded {
          height: 600px;
          max-height: 80vh;
        }

        /* Header */
        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          background: rgba(0, 0, 0, 0.5);
          border-bottom: 1px solid rgba(234, 179, 8, 0.2);
          cursor: pointer;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .sidebar-header:hover {
          background: rgba(234, 179, 8, 0.1);
        }

        .header-text {
          font-family: monospace, 'Courier New', Courier;
          font-size: 12px;
          font-weight: 700;
          color: #eab308;
          letter-spacing: 1.5px;
        }

        .expand-icon {
          font-size: 12px;
          color: rgba(234, 179, 8, 0.6);
          transition: transform 0.3s ease;
        }

        .sidebar-container.expanded .expand-icon {
          transform: rotate(180deg);
        }

        /* Content */
        .sidebar-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* News Items */
        .news-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(234, 179, 8, 0.2);
          border-radius: 6px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .news-item:hover {
          background: rgba(234, 179, 8, 0.1);
          border-color: rgba(234, 179, 8, 0.5);
        }

        .news-rank {
          font-size: 12px;
          font-weight: 700;
          color: #eab308;
          min-width: 24px;
          font-family: monospace, 'Courier New', Courier;
          flex-shrink: 0;
        }

        .news-content {
          flex: 1;
          min-width: 0;
        }

        .news-title {
          font-size: 11px;
          font-weight: 500;
          color: #ffffff;
          margin: 0 0 6px 0;
          line-height: 1.4;
          font-family: monospace, 'Courier New', Courier;
          letter-spacing: 0.2px;
        }

        .news-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .news-location {
          font-size: 9px;
          color: rgba(255, 255, 255, 0.4);
          font-family: monospace, 'Courier New', Courier;
          letter-spacing: 0.3px;
        }

        .loading-state,
        .error-state,
        .empty-state {
          padding: 20px 12px;
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          font-family: monospace, 'Courier New', Courier;
          font-size: 10px;
          letter-spacing: 0.5px;
        }

        .error-state {
          color: rgba(239, 68, 68, 0.8);
        }

        /* Custom scrollbar */
        .sidebar-content::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-content::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 2px;
        }

        .sidebar-content::-webkit-scrollbar-thumb {
          background: rgba(234, 179, 8, 0.3);
          border-radius: 2px;
        }

        .sidebar-content::-webkit-scrollbar-thumb:hover {
          background: rgba(234, 179, 8, 0.5);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .sidebar-container.expanded {
            width: 320px;
          } {
            width: calc(100vw - 48px);
            left: 24px;
            right: 24px;
          }
          
          .sidebar-container.expanded {
            height: 50
      `}</style>
    </>
  );
}
