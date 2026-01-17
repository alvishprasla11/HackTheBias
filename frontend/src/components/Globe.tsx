'use client';

import { useEffect, useRef, useState } from 'react';

export default function GlobeComponent() {
  const globeRef = useRef<any>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to pause rotation on user interaction
  const pauseRotation = () => {
    if (globeRef.current && globeRef.current.controls()) {
      globeRef.current.controls().autoRotate = false;
    }
  };

  // Function to resume rotation after inactivity
  const resumeRotationAfterDelay = () => {
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
  };

  // Function to send location data to backend
  const sendLocationToBackend = async (location: any) => {
    try {
      const locationData = {
        name: location.properties.name,
        lat: location.geometry.coordinates[1],
        lng: location.geometry.coordinates[0],
        population: location.properties.pop_max,
        country: location.properties.adm0name,
      };

      console.log('Sending location to backend:', locationData);

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
        setSelectedLocation(locationData);
      }
    } catch (error) {
      console.error('Error sending location to backend:', error);
    }
  };

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
              const minPopulation = 500000; // Increased threshold for better performance
              const filteredPlaces = places.features
                .filter((p: any) => (p.properties.pop_max || 0) >= minPopulation)
                .sort((a: any, b: any) => (b.properties.pop_max || 0) - (a.properties.pop_max || 0))
                .slice(0, 80); // Reduced to 80 cities for memory optimization

              // Initialize globe.gl with optimized settings
              const globe = new Globe(mountRef.current!)
                .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg')
                .atmosphereColor('#ffffff')
                .atmosphereAltitude(0.1)
                .backgroundImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')

                // Points Data (The Dots) - Always visible
                .pointsData(filteredPlaces)
                .pointLat((d: any) => d.geometry.coordinates[1])
                .pointLng((d: any) => d.geometry.coordinates[0])
                .pointColor(() => '#ffcc00')
                .pointAltitude(0.01)
                .pointRadius(0.25)

                // Labels Data - Google Maps style (only visible when zoomed in)
                .labelsData(filteredPlaces)
                .labelLat((d: any) => d.geometry.coordinates[1])
                .labelLng((d: any) => d.geometry.coordinates[0])
                .labelText((d: any) => d.properties.name)
                .labelSize(1.5) // Larger base size for readability
                .labelDotRadius(0)
                .labelColor(() => 'rgba(255, 255, 255, 0.95)')
                .labelResolution(3) // Higher resolution for crisp text
                .labelAltitude(0.01)

                // Google Maps-style zoom behavior
                .onZoom(({ altitude }: { altitude: number }) => {
                  // Google Maps style: labels only appear when zoomed in
                  // altitude: ~2.5 (far) -> 0.1 (close)

                  // Show labels only when altitude < 1.5 (zoomed in)
                  if (altitude < 1.5) {
                    // The closer we are, the larger the label
                    // Inverse relationship: lower altitude = larger labels
                    const labelSize = Math.max(1.0, (1.5 - altitude) * 2);
                    const pointRadius = 0.3;

                    globe.labelSize(labelSize);
                    globe.pointRadius(pointRadius);
                  } else {
                    // Hide labels when zoomed out (set size to 0)
                    globe.labelSize(0);
                    globe.pointRadius(0.25);
                  }
                })

                // Click handlers - send to backend and zoom
                .onPointClick((point: any) => {
                  // Send to backend
                  sendLocationToBackend(point);

                  // Zoom in closer to show the label
                  globe.pointOfView({
                    lat: point.geometry.coordinates[1],
                    lng: point.geometry.coordinates[0],
                    altitude: 0.8 // Zoom in to show labels
                  }, 1200);
                })
                .onLabelClick((label: any) => {
                  // Send to backend
                  sendLocationToBackend(label);

                  // Zoom even closer when clicking label
                  globe.pointOfView({
                    lat: label.geometry.coordinates[1],
                    lng: label.geometry.coordinates[0],
                    altitude: 0.5
                  }, 1200);
                })

              // Enable autorotate controls
              globe.controls().autoRotate = true;
              globe.controls().autoRotateSpeed = 0.5; // Slow, smooth rotation
              globe.controls().enableDamping = true; // Smooth inertia
              globe.controls().dampingFactor = 0.1;

              // Add event listeners for user interaction
              const controls = globe.controls();

              // When user starts interacting (mouse down, drag, zoom)
              controls.addEventListener('start', () => {
                pauseRotation();
              });

              // When user stops interacting (mouse up, drag end)
              controls.addEventListener('end', () => {
                resumeRotationAfterDelay();
              });

              globeRef.current = globe;

              // Initial label visibility based on starting altitude
              setTimeout(() => {
                if (globeRef.current) {
                  const alt = globeRef.current.pointOfView().altitude;
                  if (alt < 1.5) {
                    const labelSize = Math.max(1.0, (1.5 - alt) * 2);
                    globeRef.current.labelSize(labelSize);
                  } else {
                    globeRef.current.labelSize(0);
                  }
                }
              }, 100);

              // Optional: Add atmosphere glow (lightweight)
              setTimeout(() => {
                if (globeRef.current && globeRef.current.scene) {
                  try {
                    const scene = globeRef.current.scene();
                    const textureLoader = new (window as any).THREE.TextureLoader();

                    // Only load clouds if memory allows (optional)
                    textureLoader.load('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-clouds.png', (texture: any) => {
                      const cloudMesh = new (window as any).THREE.Mesh(
                        new (window as any).THREE.SphereGeometry(101, 32, 32), // Reduced geometry for performance
                        new (window as any).THREE.MeshPhongMaterial({
                          map: texture,
                          transparent: true,
                          opacity: 0.4 // More subtle
                        })
                      );
                      scene.add(cloudMesh);
                    });
                  } catch (e) {
                    console.log('Cloud layer optional - skipping for performance');
                  }
                }
              }, 1000);

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
      }}
    />
  );
}
