'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import CityNewsPanel from './CityNewsPanel';
import AnalysisView from './AnalysisView';

interface GlobeComponentProps {
  isTrendingExpanded?: boolean;
  onGlobeInteraction?: () => void;
}

export default function GlobeComponent({ isTrendingExpanded = false, onGlobeInteraction }: GlobeComponentProps) {
  const globeRef = useRef<any>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [cityLabels, setCityLabels] = useState<any[]>([]);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Function to pause rotation on user interaction (optimized with useCallback)
  const pauseRotation = useCallback(() => {
    if (globeRef.current && globeRef.current.controls()) {
      globeRef.current.controls().autoRotate = false;
    }
  }, []);

  // Function to resume rotation after inactivity (optimized with useCallback)
  const resumeRotationAfterDelay = useCallback(() => {
    // Clear any existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Set new timer to resume rotation after 2.5 seconds of inactivity
    inactivityTimerRef.current = setTimeout(() => {
      if (globeRef.current && globeRef.current.controls()) {
        globeRef.current.controls().autoRotate = true;
      }
    }, 2500); // 2.5 seconds
  }, []);

  // Function to send location data to backend (optimized with useCallback)
  const sendLocationToBackend = useCallback(async (location: any) => {
    try {
      const locationData = {
        name: location.properties.name,
        lat: location.geometry.coordinates[1],
        lng: location.geometry.coordinates[0],
        population: location.properties.pop_max,
        country: location.properties.adm0name,
      };

      console.log('Sending location to backend:', locationData);
      
      // Set selected location immediately to show panel
      setSelectedLocation(locationData);

      // TODO: Replace with your actual backend endpoint
      const response = await fetch('/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Backend response:', data);
      }
    } catch (error) {
      console.error('Error sending location to backend:', error);
    }
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // Dynamically import Globe to avoid SSR issues
    import('globe.gl')
      .then(({ default: Globe }) => {
        // Fetch real geojson data from reliable source
        fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places_simple.geojson')
          .then((res) => {
            if (!res.ok) {
              throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
            }
            return res.json();
          })
          .then((places) => {
            try {
              // Memory optimization: Filter to major cities only
              const minPopulation = 2000000; // Much higher threshold for performance
              const filteredPlaces = places.features
                .filter((p: any) => (p.properties.pop_max || 0) >= minPopulation)
                .filter((p: any) => p.properties.name !== 'Philadelphia') // Remove Philadelphia
                .filter((p: any) => !p.properties.name.includes('saka')) // Remove malformed Osaka
                .filter((p: any) => p.properties.name !== 'Tianjin') // Remove Tianjin
                .filter((p: any) => p.properties.name !== 'Pune') // Remove Pune
                .filter((p: any) => p.properties.name !== 'Amravati') // Remove Amravati
                .sort((a: any, b: any) => (b.properties.pop_max || 0) - (a.properties.pop_max || 0))
                .slice(0, 30); // Significantly reduced for performance

              // Add custom North American West Coast cities + Calgary + Washington DC
              const customCities = [
                { name: 'Seattle', lat: 47.6062, lng: -122.3321, pop_max: 3433000, country: 'United States' },
                { name: 'Portland', lat: 45.5152, lng: -122.6784, pop_max: 2478000, country: 'United States' },
                { name: 'San Francisco', lat: 37.7749, lng: -122.4194, pop_max: 4729000, country: 'United States' },
                { name: 'San Diego', lat: 32.7157, lng: -117.1611, pop_max: 3300000, country: 'United States' },
                { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, pop_max: 12458000, country: 'United States' },
                { name: 'Las Vegas', lat: 36.1699, lng: -115.1398, pop_max: 2228000, country: 'United States' },
                { name: 'Calgary', lat: 51.0447, lng: -114.0719, pop_max: 1336000, country: 'Canada' },
                { name: 'Minneapolis', lat: 44.9778, lng: -93.2650, pop_max: 2977000, country: 'United States' },
                { name: 'Vancouver', lat: 49.2827, lng: -123.1207, pop_max: 2463000, country: 'Canada' },
                { name: 'Washington DC', lat: 38.9072, lng: -77.0369, pop_max: 6280000, country: 'United States' },
                { name: 'Osaka', lat: 34.6937, lng: 135.5023, pop_max: 19281000, country: 'Japan' },
              ].map(city => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [city.lng, city.lat] },
                properties: { name: city.name, pop_max: city.pop_max, adm0name: city.country }
              }));

              // Combine filtered places with custom cities
              const allCities = [...filteredPlaces, ...customCities];

              // Store cities for HTML labels
              setCityLabels(allCities);

              // Initialize globe.gl with MAXIMUM performance settings
              const globe = new Globe(mountRef.current!)
                .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg')
                .atmosphereAltitude(0.05) // Reduced for performance
                .showAtmosphere(false) // Disable atmosphere completely for performance

                // Points Data (The Dots) - Color coded by population
                .pointsData(allCities)
                .pointLat((d: any) => d.geometry.coordinates[1])
                .pointLng((d: any) => d.geometry.coordinates[0])
                .pointColor((d: any) => {
                  const pop = d.properties.pop_max || 0;
                  if (pop >= 8000000) return '#ff0000'; // Red: Mega Cities (8M+)
                  if (pop >= 3000000) return '#ffcc00'; // Yellow: Major Cities (3M-8M)
                  if (pop >= 800000) return '#3b82f6'; // Blue: Medium Cities (800K-3M)
                  return '#22c55e'; // Green: Growing Cities (100K+)
                })
                .pointAltitude(0.01)
                .pointRadius(0.35)

                // Click handlers - send to backend and zoom
                .onPointClick((point: any) => {
                  // Close TOP 10 NEWS if open
                  onGlobeInteraction?.();
                  
                  // Send to backend
                  sendLocationToBackend(point);

                  // Zoom in to the city
                  globe.pointOfView({
                    lat: point.geometry.coordinates[1],
                    lng: point.geometry.coordinates[0],
                    altitude: 0.8
                  }, 1200);
                })

              // Enable autorotate controls with performance optimization
              globe.controls().autoRotate = true;
              globe.controls().autoRotateSpeed = 0.3; // Slower = less rendering
              globe.controls().enableDamping = true;
              globe.controls().dampingFactor = 0.15; // Less smooth = better performance
              globe.controls().minDistance = 101; // Prevent too close zoom
              globe.controls().maxDistance = 500; // Reasonable max zoom

              // Add event listeners for user interaction
              const controls = globe.controls();

                onGlobeInteraction?.(); // Close TOP 10 NEWS on any interaction
              // When user starts interacting (mouse down, drag, zoom)
              controls.addEventListener('start', () => {
                pauseRotation();
              });

              // When user stops interacting (mouse up, drag end)
              controls.addEventListener('end', () => {
                resumeRotationAfterDelay();
              });

              globeRef.current = globe;

              // Set renderer to use lower pixel ratio for better performance
              setTimeout(() => {
                if (globeRef.current && globeRef.current.renderer) {
                  try {
                    globeRef.current.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
                  } catch (e) {
                    console.log('Renderer optimization applied');
                  }
                }
              }, 100);

              // Update label positions continuously (lightweight HTML updates)
              const updateLabelPositions = () => {
                if (globeRef.current) {
                  // Trigger React re-render to update label positions
                  setCityLabels([...allCities]);
                }
                animationFrameRef.current = requestAnimationFrame(updateLabelPositions);
              };
              updateLabelPositions();

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

    // Handle window resize (optimized - debounced)
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (globeRef.current && mountRef.current) {
          const width = mountRef.current.clientWidth;
          const height = mountRef.current.clientHeight;
          globeRef.current.width(width);
          globeRef.current.height(height);
        }
      }, 150); // Debounce for performance
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);

      // Clear inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Proper cleanup to free memory
      if (globeRef.current) {
        try {
          if (globeRef.current.scene) {
            const scene = globeRef.current.scene();
            scene.traverse((object: any) => {
              if (object.geometry) object.geometry.dispose();
              if (object.material) {
                if (Array.isArray(object.material)) {
                  object.material.forEach((mat: any) => mat.dispose());
                } else {
                  object.material.dispose();
                }
              }
            });
          }
        } catch (e) {
          console.log('Cleanup handled');
        }
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
        position: 'relative',
      }}
    >
      {/* Lightweight HTML labels - stuck to map, no WebGL! */}
      {globeRef.current && cityLabels.map((city, idx) => {
        try {
          const coords = globeRef.current.getScreenCoords(
            city.geometry.coordinates[1],
            city.geometry.coordinates[0]
          );
          
          // Only render if coords exist and city is on the front side of globe
          if (coords && coords.x >= -50 && coords.x <= (mountRef.current?.clientWidth || 0) + 50 &&
              coords.y >= -50 && coords.y <= (mountRef.current?.clientHeight || 0) + 50) {
            
            // Check if point is behind the globe (simple visibility check)
            const globe = globeRef.current;
            const pointOfView = globe.pointOfView();
            
            // Calculate if city is visible (on front hemisphere)
            const lat = city.geometry.coordinates[1];
            const lng = city.geometry.coordinates[0];
            const camLat = pointOfView.lat;
            const camLng = pointOfView.lng;
            
            // Simple visibility: check angular distance from camera view
            const latDiff = Math.abs(lat - camLat);
            const lngDiff = Math.abs(lng - camLng);
            const adjustedLngDiff = lngDiff > 180 ? 360 - lngDiff : lngDiff;
            
            // Only show if within ~90 degrees (front hemisphere)
            const isVisible = Math.sqrt(latDiff * latDiff + adjustedLngDiff * adjustedLngDiff) < 100;
            
            if (isVisible) {
              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${coords.x}px`,
                    top: `${coords.y}px`,
                    transform: 'translate(-50%, -100%)',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '600',
                    textShadow: '0 0 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.8)',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                >
                  {city.properties.name}
                </div>
              );
            }
          }
        } catch (e) {
          // Skip if coords can't be calculated
        }
        return null;
      })}
      
      {/* City News Panel - Hide when TOP 10 NEWS is expanded */}
      {selectedLocation && !selectedNews && !isTrendingExpanded && (
        <CityNewsPanel
          cityName={selectedLocation.name}
          country={selectedLocation.country}
          onNewsClick={(newsItem) => setSelectedNews(newsItem)}
          onClose={() => setSelectedLocation(null)}
        />
      )}
      
      {/* Analysis View */}
      {selectedNews && (
        <AnalysisView
          analysis={selectedNews}
          onClose={() => setSelectedNews(null)}
        />
      )}
    </div>
  );
}