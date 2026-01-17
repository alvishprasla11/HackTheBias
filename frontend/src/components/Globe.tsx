'use client';

import { useEffect, useRef } from 'react';

export default function GlobeComponent() {
  const mountRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Dynamically import Globe to avoid SSR issues
    import('globe.gl')
      .then(({ default: Globe }) => {
        // Fetch real geojson data from reliable source
        fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_populated_places_simple.geojson')
          .then((res) => {
            if (!res.ok) {
              throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
            }
            return res.json();
          })
          .then((places) => {
            try {
              // Initialize globe.gl with the exact same configuration as reference
              const globe = new Globe(mountRef.current!)
                .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg')
                .backgroundImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
                .labelsData(places.features)
                .labelLat((d: any) => d.properties.latitude)
                .labelLng((d: any) => d.properties.longitude)
                .labelText((d: any) => d.properties.name)
                .labelSize((d: any) => Math.sqrt(d.properties.pop_max) * 4e-4)
                .labelDotRadius((d: any) => Math.sqrt(d.properties.pop_max) * 4e-4)
                .labelColor(() => 'rgba(255, 165, 0, 0.75)')
                .labelResolution(2);

              globeRef.current = globe;
            } catch (err) {
              console.error('Error initializing globe:', err instanceof Error ? err.message : String(err));
            }
          })
          .catch((err) => {
            console.error('Error loading geojson:', err instanceof Error ? err.message : String(err));
          });
      })
      .catch((err) => {
        console.error('Error importing globe.gl:', err instanceof Error ? err.message : String(err));
      });

    // Handle window resize
    const handleResize = () => {
      if (globeRef.current && mountRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        globeRef.current.width(width);
        globeRef.current.height(height);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
    />
  );
}
