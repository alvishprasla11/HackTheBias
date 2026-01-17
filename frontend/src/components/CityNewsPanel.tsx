'use client';

import { useState, useEffect } from 'react';

interface CityNewsPanelProps {
  cityName: string;
  country: string;
  onNewsClick: (newsItem: any) => void;
  onClose: () => void;
}

export default function CityNewsPanel({ cityName, country, onNewsClick, onClose }: CityNewsPanelProps) {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCityNews = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // TODO: Replace with your actual backend endpoint
        const response = await fetch(`/api/news/city?name=${encodeURIComponent(cityName)}&country=${encodeURIComponent(country)}`);
        
        if (response.ok) {
          const data = await response.json();
          setNews(data.slice(0, 10)); // Top 10 news
        } else {
          // Use mock data if API not available
          throw new Error('API not available');
        }
      } catch (err) {
        console.log('Using mock data - API endpoint not configured yet');
        // Mock data for development
        setNews([
          { id: 1, title: `Breaking: Major development in ${cityName}`, source: 'Reuters', time: '2h ago' },
          { id: 2, title: `${cityName} announces new initiative`, source: 'AP News', time: '4h ago' },
          { id: 3, title: `Economic growth in ${cityName} region`, source: 'Bloomberg', time: '6h ago' },
          { id: 4, title: `Technology sector boom in ${cityName}`, source: 'TechCrunch', time: '5h ago' },
          { id: 5, title: `${cityName} weather update for the week`, source: 'Weather Network', time: '8h ago' },
          { id: 6, title: `Local news from ${cityName}`, source: 'Local Times', time: '10h ago' },
          { id: 7, title: `${cityName} transportation updates`, source: 'Transit News', time: '12h ago' },
          { id: 8, title: `Cultural events in ${cityName} this weekend`, source: 'Arts & Culture', time: '14h ago' },
          { id: 9, title: `${cityName} real estate market analysis`, source: 'Property Watch', time: '16h ago' },
          { id: 10, title: `Sports highlights from ${cityName}`, source: 'Sports Daily', time: '18h ago' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCityNews();
  }, [cityName, country]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '120px',
        left: '40px',
        width: '380px',
        maxHeight: '75vh',
        background: '#000',
        border: '1px solid #ffa500',
        borderRadius: '4px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(255, 165, 0, 0.2)',
        zIndex: 1000,
        overflow: 'hidden',
        fontFamily: 'monospace',
      }}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255, 165, 0, 0.3)',
      }}>
        <div>
          <h2 style={{ 
            color: '#ffa500', 
            margin: 0, 
            fontSize: '18px',
            fontWeight: '700',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            {cityName}
          </h2>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.6)', 
            margin: '4px 0 0 0',
            fontSize: '11px',
            fontFamily: 'monospace',
          }}>
            {country} • Top 10 News
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 165, 0, 0.3)',
            color: '#ffa500',
            fontSize: '20px',
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            fontFamily: 'monospace',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)';
            e.currentTarget.style.borderColor = '#ffa500';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(255, 165, 0, 0.3)';
          }}
        >
          ×
        </button>
      </div>

      {/* News List */}
      <div style={{
        maxHeight: 'calc(75vh - 100px)',
        overflowY: 'auto',
        paddingRight: '4px',
      }}>
        {loading ? (
          <div style={{ color: '#ffa500', textAlign: 'center', padding: '40px', fontFamily: 'monospace' }}>
            Loading news...
          </div>
        ) : error ? (
          <div style={{ color: '#ff4444', textAlign: 'center', padding: '40px', fontFamily: 'monospace' }}>
            {error}
          </div>
        ) : news.length === 0 ? (
          <div style={{ color: 'rgba(255, 165, 0, 0.5)', textAlign: 'center', padding: '40px', fontFamily: 'monospace' }}>
            No news available
          </div>
        ) : (
          news.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => onNewsClick(item)}
              style={{
                background: 'transparent',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: '1px solid rgba(255, 165, 0, 0.2)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 165, 0, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255, 165, 0, 0.2)';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}>
                <div style={{
                  color: '#ffa500',
                  fontSize: '12px',
                  fontWeight: '700',
                  flexShrink: 0,
                  marginTop: '2px',
                  fontFamily: 'monospace',
                }}>
                  #{idx + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    color: '#fff',
                    margin: '0 0 6px 0',
                    fontSize: '13px',
                    fontWeight: '400',
                    lineHeight: '1.4',
                    fontFamily: 'monospace',
                  }}>
                    {item.title}
                  </h3>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    fontSize: '11px',
                    color: 'rgba(255, 165, 0, 0.6)',
                    fontFamily: 'monospace',
                  }}>
                    <span>{item.source}</span>
                    <span>•</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Scrollbar styling */}
      <style jsx>{`
        div::-webkit-scrollbar {
          width: 4px;
        }
        div::-webkit-scrollbar-track {
          background: rgba(255, 165, 0, 0.1);
          border-radius: 2px;
        }
        div::-webkit-scrollbar-thumb {
          background: rgba(255, 165, 0, 0.3);
          border-radius: 2px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 165, 0, 0.5);
        }
      `}</style>
    </div>
  );
}
