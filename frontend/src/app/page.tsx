'use client';

import Globe from '@/components/Globe';
import TrendingNews from '@/components/TrendingNews';
import SearchBar from '@/components/SearchBar';
import { useEffect, useRef } from 'react';

export default function Home() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (parallaxRef.current) {
        const x = (e.clientX / window.innerWidth - 0.5) * 40;
        const y = (e.clientY / window.innerHeight - 0.5) * 40;
        parallaxRef.current.style.transform = `translate(${x}px, ${y}px)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <main className="w-full h-screen overflow-hidden relative">
      {/* Parallax Starfield Background */}
      <div
        ref={parallaxRef}
        className="absolute inset-0 z-0 transition-transform duration-100 ease-out"
        style={{
          backgroundImage: 'url(//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          pointerEvents: 'none',
        }}
      />
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent p-6">
        <div className="flex justify-between items-start">
          <div className="pointer-events-none">
            <h1 className="text-4xl font-bold text-white tracking-wider" style={{ fontFamily: 'monospace, Courier New, Courier' }}>
              TRUTH<span className="text-red-500">UNFILTERED</span>
            </h1>
            <p className="text-gray-300 text-sm mt-2" style={{ fontFamily: 'monospace, Courier New, Courier', letterSpacing: '0.3px' }}>Global News Network • Amplify the Silenced • Question the Powerful</p>
          </div>
          
          {/* Search Bar - Top Right */}
          <div className="pointer-events-auto">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Trending News Sidebar */}
      <TrendingNews />

      {/* Globe Component */}
      <div className="absolute inset-0 z-10">
        <Globe />
      </div>

      {/* Legend Overlay - Bottom Right */}
      <div className="absolute bottom-6 right-6 z-30 bg-black/75 backdrop-blur-sm rounded-lg p-4 text-white text-xs border border-yellow-600/30" style={{ fontFamily: 'monospace, Courier New, Courier' }}>
        <h3 className="font-bold mb-3 text-yellow-500" style={{ letterSpacing: '0.5px' }}>NEWS HUB IMPORTANCE</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span style={{ letterSpacing: '0.3px' }}>Mega Cities (8M+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span style={{ letterSpacing: '0.3px' }}>Major Cities (3M-8M)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
            <span style={{ letterSpacing: '0.3px' }}>Medium Cities (800K-3M)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span style={{ letterSpacing: '0.3px' }}>Growing Cities (100K+)</span>
          </div>
        </div>
      </div>
    </main>
  );
}
