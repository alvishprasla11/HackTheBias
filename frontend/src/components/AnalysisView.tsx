'use client';

import { useState, useEffect, useRef } from 'react';

interface Source {
  name: string;
  url: string;
  type: string;
  political_leaning: string;
}

interface SupporterInfo {
  supporters: string[];
  funding_sources: string[];
  ownership: string;
}

interface Perspective {
  side_name: string;
  summary: string;
  key_claims: string[];
  sources: Source[];
  supporter_info: SupporterInfo;
  bias_indicators: string[];
  bias_score: number;
}

interface Analysis {
  location: string;
  topic: string;
  headline: string;
  date_analyzed: string;
  perspectives: Perspective[];
  common_facts?: string[];
  key_disagreements?: string[];
  social_media_voices?: Source[];
  summary: string;
  information_quality: string;
}

interface AnalysisViewProps {
  analysis?: Analysis;
  topic?: string;
  location?: string;
  onClose: () => void;
}

const loadingMessages = [
  "Searching for latest news...",
  "Gathering multiple perspectives...",
  "Analyzing political viewpoints...",
  "Detecting bias patterns...",
  "Structuring analysis..."
];

export default function AnalysisView({ analysis: initialAnalysis, topic, location, onClose }: AnalysisViewProps) {
  const [analysis, setAnalysis] = useState<Analysis | null>(initialAnalysis || null);
  const [isLoading, setIsLoading] = useState(!initialAnalysis);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const hasFetchedRef = useRef(false);

  // Cycle through loading messages
  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Fetch analysis if not provided
  useEffect(() => {
    if (initialAnalysis || !topic || hasFetchedRef.current) return;

    hasFetchedRef.current = true;

    const fetchAnalysis = async () => {
      setIsLoading(true);
      setError(null);

      console.log('Fetching analysis with:', { topic, location });

      try {
        const requestBody = {
          location: location || 'Global',
          topic: topic,
        };
        console.log('Sending request:', requestBody);

        const response = await fetch('http://localhost:8000/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error('Analysis failed');
        }

        const data: Analysis = await response.json();
        setAnalysis(data);
      } catch (err) {
        console.error('Analysis error:', err);
        setError('Failed to analyze. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [initialAnalysis, topic, location]);

  const getBiasColor = (score: number) => {
    if (score >= 7) return '#ef4444';
    if (score >= 4) return '#eab308';
    return '#22c55e';
  };

  const getLeaningColor = (leaning: string) => {
    const leaningLower = leaning.toLowerCase();
    if (leaningLower.includes('left')) return '#3b82f6';
    if (leaningLower.includes('right')) return '#ef4444';
    return '#9ca3af';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ paddingTop: '120px' }}>
      {/* Backdrop - Semi-transparent to show globe */}
      <div 
        className="absolute inset-0 bg-black/40" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-black border border-yellow-600/30 rounded-lg max-w-5xl w-full max-h-[calc(100vh-140px)] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-black border-b border-yellow-600/30 p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 
                className="text-xl font-bold text-yellow-500 tracking-wider mb-1"
                style={{ fontFamily: 'monospace, Courier New, Courier', letterSpacing: '2px' }}
              >
                UNBIASED ANALYSIS
              </h1>
              {analysis && (
                <p 
                  className="text-xs text-gray-400"
                  style={{ fontFamily: 'monospace, Courier New, Courier', letterSpacing: '0.5px' }}
                >
                  {analysis.location} • {analysis.topic}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-black/40 border border-yellow-600/30 rounded
                       text-yellow-500 hover:bg-yellow-600/10 hover:border-yellow-600/60
                       transition-all duration-300 text-sm"
              style={{ fontFamily: 'monospace, Courier New, Courier', letterSpacing: '1px' }}
            >
            CLOSE
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto max-h-[calc(100vh-220px)] p-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p 
              className="text-yellow-500 text-lg animate-pulse"
              style={{ fontFamily: 'monospace, Courier New, Courier', letterSpacing: '1px' }}
            >
              {loadingMessages[loadingMessageIndex]}
            </p>
            <p 
              className="text-gray-500 text-xs mt-2"
              style={{ fontFamily: 'monospace, Courier New, Courier' }}
            >
              This may take 30-60 seconds...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <p 
              className="text-red-400"
              style={{ fontFamily: 'monospace, Courier New, Courier' }}
            >
              {error}
            </p>
          </div>
        )}

        {/* Analysis Content */}
        {analysis && !isLoading && (
          <div className="space-y-8">
            {/* Headline */}
            <div className="bg-black/40 border border-yellow-600/30 rounded-lg p-6">
              <h2 
                className="text-xl text-white leading-relaxed"
                style={{ fontFamily: 'monospace, Courier New, Courier', letterSpacing: '0.5px' }}
              >
                {analysis.headline}
              </h2>
              <p 
                className="text-xs text-gray-500 mt-2"
                style={{ fontFamily: 'monospace, Courier New, Courier' }}
              >
                Analyzed: {new Date(analysis.date_analyzed).toLocaleDateString()}
              </p>
            </div>

            {/* Summary */}
            <div className="bg-black/40 border border-yellow-600/30 rounded-lg p-6">
              <h3 
                className="text-sm text-yellow-500 mb-3 tracking-wider"
                style={{ fontFamily: 'monospace, Courier New, Courier' }}
              >
                EXECUTIVE SUMMARY
              </h3>
              <p 
                className="text-sm text-gray-300 leading-relaxed"
                style={{ fontFamily: 'monospace, Courier New, Courier', letterSpacing: '0.3px' }}
              >
                {analysis.summary}
              </p>
            </div>

            {/* Perspectives */}
            <div>
              <h3 
                className="text-sm text-yellow-500 mb-4 tracking-wider"
                style={{ fontFamily: 'monospace, Courier New, Courier' }}
              >
                MULTIPLE PERSPECTIVES
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analysis.perspectives?.map((perspective, index) => (
                  <div 
                    key={index}
                    className="bg-black/40 border border-yellow-600/30 rounded-lg p-6 space-y-4"
                  >
                    {/* Perspective Header */}
                    <div className="flex justify-between items-start">
                      <h4 
                        className="text-base text-white font-bold"
                        style={{ fontFamily: 'monospace, Courier New, Courier', letterSpacing: '0.5px' }}
                      >
                        {perspective.side_name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-xs"
                          style={{ 
                            fontFamily: 'monospace, Courier New, Courier',
                            color: getBiasColor(perspective.bias_score)
                          }}
                        >
                          BIAS: {perspective.bias_score}/10
                        </span>
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getBiasColor(perspective.bias_score) }}
                        />
                      </div>
                    </div>

                    {/* Summary */}
                    <p 
                      className="text-xs text-gray-300 leading-relaxed"
                      style={{ fontFamily: 'monospace, Courier New, Courier', letterSpacing: '0.3px' }}
                    >
                      {perspective.summary}
                    </p>

                    {/* Key Claims */}
                    {perspective.key_claims.length > 0 && (
                      <div>
                        <p 
                          className="text-xs text-yellow-500 mb-2"
                          style={{ fontFamily: 'monospace, Courier New, Courier' }}
                        >
                          KEY CLAIMS:
                        </p>
                        <ul className="space-y-1">
                          {perspective.key_claims?.map((claim, i) => (
                            <li 
                              key={i}
                              className="text-xs text-gray-400 pl-4"
                              style={{ fontFamily: 'monospace, Courier New, Courier', letterSpacing: '0.2px' }}
                            >
                              • {claim}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Sources */}
                    {perspective.sources.length > 0 && (
                      <div>
                        <p 
                          className="text-xs text-yellow-500 mb-2"
                          style={{ fontFamily: 'monospace, Courier New, Courier' }}
                        >
                          SOURCES:
                        </p>
                        <div className="space-y-2">
                          {perspective.sources?.map((source, i) => {
                            // Safely get hostname from URL with fallback
                            const getHostname = (url: string) => {
                              try {
                                return new URL(url).hostname.replace('www.', '');
                              } catch {
                                return 'source';
                              }
                            };

                            // Create safe URL with fallback to Google search
                            const safeUrl = (() => {
                              try {
                                new URL(source.url);
                                return source.url;
                              } catch {
                                return `https://www.google.com/search?q=${encodeURIComponent(source.name || 'news')}`;
                              }
                            })();

                            return (
                            <a
                              key={i}
                              href={safeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs hover:bg-yellow-600/10 p-2 rounded transition-colors border border-transparent hover:border-yellow-600/30 group"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span 
                                      className="text-gray-300 group-hover:text-yellow-500 transition-colors"
                                      style={{ fontFamily: 'monospace, Courier New, Courier' }}
                                    >
                                      {source.name}
                                    </span>
                                    <svg 
                                      className="w-3 h-3 text-gray-500 group-hover:text-yellow-500 transition-colors flex-shrink-0" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </div>
                                  {source.url && (
                                    <span 
                                      className="text-[10px] text-gray-600 group-hover:text-gray-500 transition-colors truncate block mt-1"
                                      style={{ fontFamily: 'monospace, Courier New, Courier' }}
                                    >
                                      {getHostname(source.url)}
                                    </span>
                                  )}
                                </div>
                                <span 
                                  className="text-xs px-2 py-1 rounded flex-shrink-0"
                                  style={{ 
                                    fontFamily: 'monospace, Courier New, Courier',
                                    backgroundColor: `${getLeaningColor(source.political_leaning)}20`,
                                    color: getLeaningColor(source.political_leaning)
                                  }}
                                >
                                  {source.political_leaning}
                                </span>
                              </div>
                            </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Bias Indicators */}
                    {perspective.bias_indicators.length > 0 && (
                      <div>
                        <p 
                          className="text-xs text-yellow-500 mb-2"
                          style={{ fontFamily: 'monospace, Courier New, Courier' }}
                        >
                          BIAS INDICATORS:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {perspective.bias_indicators?.map((indicator, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded"
                              style={{ fontFamily: 'monospace, Courier New, Courier', letterSpacing: '0.3px' }}
                            >
                              {indicator}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Supporters */}
                    {perspective.supporter_info.supporters.length > 0 && (
                      <div>
                        <p 
                          className="text-xs text-yellow-500 mb-2"
                          style={{ fontFamily: 'monospace, Courier New, Courier' }}
                        >
                          SUPPORTERS:
                        </p>
                        <p 
                          className="text-xs text-gray-400"
                          style={{ fontFamily: 'monospace, Courier New, Courier', letterSpacing: '0.2px' }}
                        >
                          {perspective.supporter_info.supporters.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Common Facts */}
            {analysis.common_facts?.length > 0 && (
              <div className="bg-black/40 border border-green-600/30 rounded-lg p-6">
                <h3 
                  className="text-sm text-green-500 mb-3 tracking-wider"
                  style={{ fontFamily: 'monospace, Courier New, Courier' }}
                >
                  COMMON GROUND (AGREED FACTS)
                </h3>
                <ul className="space-y-2">
                  {analysis.common_facts?.map((fact, i) => (
                    <li 
                      key={i}
                      className="text-sm text-gray-300 pl-4"
                      style={{ fontFamily: 'monospace, Courier New, Courier', letterSpacing: '0.3px' }}
                    >
                      ✓ {fact}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Disagreements */}
            {analysis.key_disagreements?.length > 0 && (
              <div className="bg-black/40 border border-red-600/30 rounded-lg p-6">
                <h3 
                  className="text-sm text-red-500 mb-3 tracking-wider"
                  style={{ fontFamily: 'monospace, Courier New, Courier' }}
                >
                  KEY DISAGREEMENTS
                </h3>
                <ul className="space-y-2">
                  {analysis.key_disagreements?.map((disagreement, i) => (
                    <li 
                      key={i}
                      className="text-sm text-gray-300 pl-4"
                      style={{ fontFamily: 'monospace, Courier New, Courier', letterSpacing: '0.3px' }}
                    >
                      ⚔️ {disagreement}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Social Media Voices */}
            {analysis.social_media_voices?.length > 0 && (
              <div className="bg-black/40 border border-blue-600/30 rounded-lg p-6">
                <h3 
                  className="text-sm text-blue-500 mb-3 tracking-wider"
                  style={{ fontFamily: 'monospace, Courier New, Courier' }}
                >
                  INDEPENDENT VOICES
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.social_media_voices?.map((voice, i) => (
                    <a
                      key={i}
                      href={voice.url !== 'N/A_Social_Media_Trend' ? voice.url : '#'}
                      target={voice.url !== 'N/A_Social_Media_Trend' ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className={`text-xs p-3 rounded transition-colors border group ${
                        voice.url !== 'N/A_Social_Media_Trend' 
                          ? 'hover:bg-blue-600/10 border-transparent hover:border-blue-600/30 cursor-pointer' 
                          : 'border-transparent cursor-default'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex-1 ${
                            voice.url !== 'N/A_Social_Media_Trend' 
                              ? 'text-gray-300 group-hover:text-blue-400' 
                              : 'text-gray-300'
                          }`}
                          style={{ fontFamily: 'monospace, Courier New, Courier', letterSpacing: '0.3px' }}
                        >
                          {voice.name}
                        </span>
                        {voice.url !== 'N/A_Social_Media_Trend' && (
                          <svg 
                            className="w-3 h-3 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        )}
                      </div>
                      {voice.url && voice.url !== 'N/A_Social_Media_Trend' && (
                        <span 
                          className="text-[10px] text-gray-600 group-hover:text-gray-500 transition-colors block mt-1"
                          style={{ fontFamily: 'monospace, Courier New, Courier' }}
                        >
                          {(() => {
                            try {
                              return new URL(voice.url).hostname.replace('www.', '');
                            } catch {
                              return voice.url;
                            }
                          })()}
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Information Quality */}
            <div className="bg-black/40 border border-yellow-600/30 rounded-lg p-6">
              <h3 
                className="text-sm text-yellow-500 mb-3 tracking-wider"
                style={{ fontFamily: 'monospace, Courier New, Courier' }}
              >
                INFORMATION QUALITY ASSESSMENT
              </h3>
              <p 
                className="text-sm text-gray-300 leading-relaxed"
                style={{ fontFamily: 'monospace, Courier New, Courier', letterSpacing: '0.3px' }}
              >
                {analysis.information_quality || 'Analysis in progress...'}
              </p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
