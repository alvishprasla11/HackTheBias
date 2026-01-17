'use client';

import { useState } from 'react';

interface NewsItem {
  id: number;
  title: string;
  location: string;
  category: string;
  timestamp: string;
  views: string;
}

export default function TrendingNews() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Top 10 trending news - can be replaced with backend API call
  const [newsItems] = useState<NewsItem[]>([
    {
      id: 1,
      title: "Global Climate Summit Reaches Historic Agreement",
      location: "Paris, France",
      category: "Environment",
      timestamp: "2 hours ago",
      views: "12.4K"
    },
    {
      id: 2,
      title: "Tech Giants Announce AI Safety Partnership",
      location: "San Francisco, USA",
      category: "Technology",
      timestamp: "4 hours ago",
      views: "8.9K"
    },
    {
      id: 3,
      title: "Breakthrough in Renewable Energy Storage",
      location: "Tokyo, Japan",
      category: "Science",
      timestamp: "6 hours ago",
      views: "15.2K"
    },
    {
      id: 4,
      title: "International Trade Agreement Signed",
      location: "Geneva, Switzerland",
      category: "Economy",
      timestamp: "8 hours ago",
      views: "6.7K"
    },
    {
      id: 5,
      title: "Major Archaeological Discovery in Egypt",
      location: "Cairo, Egypt",
      category: "Culture",
      timestamp: "10 hours ago",
      views: "11.3K"
    },
    {
      id: 6,
      title: "Space Agency Announces Mars Mission Timeline",
      location: "Houston, USA",
      category: "Space",
      timestamp: "12 hours ago",
      views: "19.8K"
    },
    {
      id: 7,
      title: "New Medical Breakthrough in Cancer Treatment",
      location: "Boston, USA",
      category: "Health",
      timestamp: "14 hours ago",
      views: "22.1K"
    },
    {
      id: 8,
      title: "Global Markets Rally on Economic Recovery",
      location: "New York, USA",
      category: "Economy",
      timestamp: "16 hours ago",
      views: "9.5K"
    },
    {
      id: 9,
      title: "Revolutionary AI Model Surpasses Human Performance",
      location: "London, UK",
      category: "Technology",
      timestamp: "18 hours ago",
      views: "31.2K"
    },
    {
      id: 10,
      title: "Historic Peace Agreement Signed in Middle East",
      location: "Dubai, UAE",
      category: "Politics",
      timestamp: "20 hours ago",
      views: "45.8K"
    }
  ]);

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Environment': '#10b981',
      'Technology': '#3b82f6',
      'Science': '#8b5cf6',
      'Economy': '#f59e0b',
      'Culture': '#ec4899',
      'Space': '#6366f1',
      'Health': '#ef4444',
      'Politics': '#f97316'
    };
    return colors[category] || '#6b7280';
  };

  const togglePopup = () => {
    if (isOpen && !isMinimized) {
      setIsMinimized(true);
    } else if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(true);
    }
  };

  const closePopup = () => {
    setIsMinimized(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsMinimized(false);
    }, 300);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={togglePopup}
        className="trending-news-button"
        aria-label="Open trending news"
      >
        <span className="button-icon">🔥</span>
        <span className="button-text">Trending News</span>
        <span className="news-badge">{newsItems.length}</span>
      </button>

      {/* Popup Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className={`trending-news-backdrop ${isMinimized ? 'hidden' : ''}`}
            onClick={closePopup}
          />

          {/* Modal */}
          <div className={`trending-news-modal ${isMinimized ? 'minimized' : ''}`}>
            <div className="modal-header">
              <div className="header-content">
                <h2>🔥 Top 10 Trending News</h2>
                <p className="subtitle">Today's most important stories</p>
              </div>
              <div className="header-actions">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="action-button minimize-button"
                  aria-label="Minimize"
                >
                  {isMinimized ? '□' : '−'}
                </button>
                <button
                  onClick={closePopup}
                  className="action-button close-button"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="news-list">
              {newsItems.map((item, index) => (
                <div key={item.id} className="news-item">
                  <div className="news-rank">#{index + 1}</div>
                  <div className="news-content">
                    <div className="news-category" style={{ backgroundColor: getCategoryColor(item.category) }}>
                      {item.category}
                    </div>
                    <h3 className="news-title">{item.title}</h3>
                    <div className="news-meta">
                      <span className="news-location">📍 {item.location}</span>
                      <span className="news-time">🕒 {item.timestamp}</span>
                    </div>
                    <div className="news-views">👁️ {item.views} views</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        /* Floating Button */
        .trending-news-button {
          position: fixed;
          bottom: 24px;
          left: 24px;
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 50px;
          padding: 14px 24px;
          color: white;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          box-shadow: 0 8px 32px rgba(239, 68, 68, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: pulse 2s infinite;
        }

        .trending-news-button:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 12px 48px rgba(239, 68, 68, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2) inset;
          background: linear-gradient(135deg, rgba(239, 68, 68, 1) 0%, rgba(220, 38, 38, 1) 100%);
        }

        .trending-news-button:active {
          transform: translateY(-2px) scale(1.02);
        }

        .button-icon {
          font-size: 20px;
          animation: flicker 1.5s infinite;
        }

        .button-text {
          letter-spacing: 0.3px;
        }

        .news-badge {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 13px;
          font-weight: 700;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 8px 32px rgba(239, 68, 68, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
          }
          50% {
            box-shadow: 0 8px 32px rgba(239, 68, 68, 0.6), 0 0 20px rgba(239, 68, 68, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
          }
        }

        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        /* Backdrop */
        .trending-news-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 60;
          animation: fadeIn 0.3s ease;
        }

        .trending-news-backdrop.hidden {
          animation: fadeOut 0.3s ease;
          pointer-events: none;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        /* Modal */
        .trending-news-modal {
          position: fixed;
          left: 24px;
          bottom: 90px;
          width: 420px;
          max-height: 70vh;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
          z-index: 70;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .trending-news-modal.minimized {
          animation: slideOutDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateY(100%);
          opacity: 0;
        }

        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideOutDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0;
          }
        }

        /* Modal Header */
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%);
        }

        .header-content h2 {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 6px 0;
          letter-spacing: -0.5px;
        }

        .subtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .action-button {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-button:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .close-button:hover {
          background: rgba(239, 68, 68, 0.8);
          border-color: rgba(239, 68, 68, 0.5);
        }

        /* News List */
        .news-list {
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .news-item {
          display: flex;
          gap: 12px;
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(51, 65, 85, 0.4) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .news-item:hover {
          transform: translateX(6px);
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.6) 100%);
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .news-rank {
          font-size: 18px;
          font-weight: 700;
          color: rgba(239, 68, 68, 0.8);
          min-width: 32px;
          text-align: center;
          padding-top: 2px;
        }

        .news-content {
          flex: 1;
        }

        .news-category {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .news-title {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 10px 0;
          line-height: 1.4;
        }

        .news-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 6px;
        }

        .news-location,
        .news-time {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.65);
        }

        .news-views {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
        }

        /* Custom scrollbar */
        .news-list::-webkit-scrollbar {
          width: 6px;
        }

        .news-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .news-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .news-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .trending-news-modal {
            left: 12px;
            right: 12px;
            width: auto;
            max-height: 60vh;
          }

          .trending-news-button {
            bottom: 16px;
            left: 16px;
            padding: 12px 20px;
            font-size: 14px;
          }
        }
      `}</style>
    </>
  );
}
