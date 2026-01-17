'use client';

import Globe from '@/components/Globe';
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
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent p-6 pointer-events-none">
        <h1 className="text-4xl font-bold text-white tracking-wider">
          TRUTH<span className="text-red-500">UNFILTERED</span>
        </h1>
        <p className="text-gray-300 text-sm mt-2">Global News Network • Amplify the Silenced • Question the Powerful</p>
      </div>

      {/* Globe Component */}
      <div className="absolute inset-0 z-10">
        <Globe />
      </div>

      {/* Legend Overlay - Bottom Right */}
      <div className="absolute bottom-6 right-6 z-30 bg-black/75 backdrop-blur-sm rounded-lg p-4 text-white text-xs border border-yellow-600/30">
        <h3 className="font-bold mb-3 text-yellow-500">NEWS HUB IMPORTANCE</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Mega Cities (8M+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Major Cities (3M-8M)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
            <span>Medium Cities (800K-3M)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Growing Cities (100K+)</span>
          </div>
        </div>
      </div>

      {/* Info Overlay - Bottom Left */}
      <div className="absolute bottom-6 left-6 z-30 bg-black/75 backdrop-blur-sm rounded-lg p-4 text-white text-xs max-w-sm border border-blue-600/30">
        <p className="text-gray-300 leading-relaxed">
          📍 Explore global news hubs. Larger dots indicate cities with more journalistic activity and news coverage.
        </p>
      </div>
    </main>
  );
}
