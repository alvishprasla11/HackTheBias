'use client';

import { useEffect, useRef, useState } from 'react';

export default function GlobeComponent() {
  const mountRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rotationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const rotationAngleRef = useRef(0);
  const isDraggingRef = useRef(false);
  const previousMousePosRef = useRef({ x: 0, y: 0 });
  const isAutoRotatingRef = useRef(true);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;

    // Handle mouse down - start dragging
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePosRef.current = { x: e.clientX, y: e.clientY };
      isAutoRotatingRef.current = false;
      setIsAutoRotating(false);
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
    };

    // Handle mouse move - rotate globe while dragging
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && globeRef.current) {
        const deltaX = e.clientX - previousMousePosRef.current.x;
        const deltaY = e.clientY - previousMousePosRef.current.y;

        // Get current point of view
        const pov = globeRef.current.pointOfView();
        
        // Calculate new position (note: positive deltaY = move down, so subtract to invert)
        const newLat = Math.max(-90, Math.min(90, pov.lat + deltaY * 0.3));
        const newLng = pov.lng - deltaX * 0.3;

        // Update globe immediately for responsive dragging
        globeRef.current.pointOfView({
          lat: newLat,
          lng: newLng,
          altitude: pov.altitude
        }, 0);

        // Update rotation angle to match current position
        rotationAngleRef.current = newLng;

        previousMousePosRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    // Handle mouse up - stop dragging
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      // Auto-rotation stays off once user clicks - they have full control now
    };

    // Add event listeners
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    if (mountRef.current) {
      mountRef.current.style.cursor = 'grab';
    }

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
              // Filter and sort places by population for cleaner visualization
              const minPopulation = 100000; // Only show cities with 100k+ population
              const filteredPlaces = places.features
                .filter((p: any) => (p.properties.pop_max || 0) >= minPopulation)
                .sort((a: any, b: any) => (b.properties.pop_max || 0) - (a.properties.pop_max || 0))
                .slice(0, 500); // Limit to top 500 cities for cleaner look
              
              // Initialize globe.gl with refined styling
              const globe = new Globe(mountRef.current!)
                .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg')
                .atmosphereColor('#ffffff')
                .atmosphereAltitude(0.1)
                .backgroundImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
                .labelsData(filteredPlaces)
                .labelLat((d: any) => d.properties.latitude)
                .labelLng((d: any) => d.properties.longitude)
                .labelText((d: any) => d.properties.name)
                .labelSize((d: any) => {
                  const pop = d.properties.pop_max || 0;
                  const normalizedPop = Math.log10(pop) / 8;
                  return Math.max(0.5, Math.min(1.5, normalizedPop)) * 3e-3;
                })
                .labelDotRadius((d: any) => {
                  const pop = d.properties.pop_max || 0;
                  const normalizedPop = Math.log10(pop) / 8;
                  return Math.max(0.3, Math.min(1.2, normalizedPop)) * 1.5e-3;
                })
                .labelColor((d: any) => {
                  const pop = d.properties.pop_max || 0;
                  if (pop > 8000000) return '#ff4757';
                  if (pop > 3000000) return '#ffa502';
                  if (pop > 800000) return '#00bcd4';
                  return '#4caf50';
                })
                .labelResolution(2)
                .labelAltitude(0.02);

              globeRef.current = globe;

              // Add clouds layer after globe is created
              setTimeout(() => {
                if (globeRef.current && globeRef.current.scene) {
                  try {
                    const scene = globeRef.current.scene();
                    const textureLoader = new (window as any).THREE.TextureLoader();
                    
                    textureLoader.load('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-clouds.png', (texture: any) => {
                      const cloudMesh = new (window as any).THREE.Mesh(
                        new (window as any).THREE.SphereGeometry(101, 40, 40),
                        new (window as any).THREE.MeshPhongMaterial({
                          map: texture,
                          transparent: true,
                          opacity: 0.6
                        })
                      );
                      scene.add(cloudMesh);
                    });
                  } catch (e) {
                    console.log('Cloud layer optional - may not be available');
                  }
                }
              }, 1000);

              // Auto-rotation animation using requestAnimationFrame for 60 FPS
              let animationId: number;
              const animate = () => {
                if (globeRef.current && isAutoRotatingRef.current) {
                  rotationAngleRef.current += 0.12;
                  globeRef.current.pointOfView({
                    lat: 0,
                    lng: rotationAngleRef.current,
                    altitude: 2.5
                  }, 0);
                }
                animationId = requestAnimationFrame(animate);
              };
              animationId = requestAnimationFrame(animate);
              animationIdRef.current = animationId;
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
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
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
