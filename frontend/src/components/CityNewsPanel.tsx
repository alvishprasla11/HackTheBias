'use client';

import { useState, useEffect, useRef } from 'react';

interface CityNewsPanelProps {
  cityName: string;
  country: string;
  cachedNews?: any[];
  onNewsFetched: (news: any[]) => void;
  onNewsClick: (topic: string, location: string) => void;
  onClose: () => void;
}

export default function CityNewsPanel({ cityName, country, cachedNews, onNewsFetched, onNewsClick, onClose }: CityNewsPanelProps) {
  const [news, setNews] = useState<any[]>(cachedNews || []);
  const [loading, setLoading] = useState(!cachedNews);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  const currentCityRef = useRef(`${cityName}-${country}`);

  useEffect(() => {
    const cityKey = `${cityName}-${country}`;
    
    // If city changed, reset fetch flag
    if (currentCityRef.current !== cityKey) {
      currentCityRef.current = cityKey;
      hasFetchedRef.current = false;
    }
    
    // If we have cached news, use it and don't fetch
    if (cachedNews && cachedNews.length > 0) {
      setNews(cachedNews);
      setLoading(false);
      hasFetchedRef.current = true;
      return;
    }
    
    // Prevent duplicate fetches
    if (hasFetchedRef.current) {
      return;
    }
    
    hasFetchedRef.current = true;

    const fetchCityNews = async () => {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching news for ${cityKey}`);
      
      try {
        // Call backend /search endpoint with city name
        const API_URLS = [
          process.env.NEXT_PUBLIC_API_URL,
          'http://localhost:8000'
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
              body: JSON.stringify({ 
                topic: `${cityName} ${country}` 
              }),
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
        
        if (response && response.ok) {
          const data = await response.json();
          // Map headlines to news format
          const headlines = data.headlines.map((item: any, index: number) => ({
            id: index + 1,
            title: item.headline,
            source: item.source,
            url: item.url,
            time: 'Recent'
          }));
          const topNews = headlines.slice(0, 10);
          setNews(topNews);
          onNewsFetched(topNews); // Store in cache
        } else {
          throw new Error('API not available');
        }
      } catch (err) {
        console.error('Error fetching city news:', err);
        setError('Failed to load news for this city');
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCityNews();
  }, [cityName, country, cachedNews]);

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
              onClick={() => onNewsClick(item.title, `${cityName}, ${country}`)}
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
