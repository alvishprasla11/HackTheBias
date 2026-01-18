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
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedLocationString, setSelectedLocationString] = useState<string | null>(null);
  const [cityLabels, setCityLabels] = useState<any[]>([]);
  const [currentAltitude, setCurrentAltitude] = useState<number>(2.5); // Track zoom level
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const altitudeRef = useRef<number>(2.5);
  const isPanelOpenRef = useRef<boolean>(false);
  const newsCacheRef = useRef<Map<string, any[]>>(new Map());

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
    // Only resume if no city news panel is open
    inactivityTimerRef.current = setTimeout(() => {
      if (globeRef.current && globeRef.current.controls() && !isPanelOpenRef.current) {
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
      isPanelOpenRef.current = true;

      // Backend location tracking - currently not implemented
      // TODO: Implement backend endpoint if location tracking is needed
      /*
      
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
                .filter((p: any) => p.properties.name !== 'Bogota') // Remove duplicate Bogota
                .filter((p: any) => p.properties.name !== 'Shenzhen') // Remove Shenzhen
                .sort((a: any, b: any) => (b.properties.pop_max || 0) - (a.properties.pop_max || 0))
                .slice(0, 30); // Significantly reduced for performance

              // Add custom cities for better global coverage
              const customCities = [
                // North America
                { name: 'Seattle', lat: 47.6062, lng: -122.3321, pop_max: 3433000, country: 'United States' },
                { name: 'Portland', lat: 45.5152, lng: -122.6784, pop_max: 2478000, country: 'United States' },
                { name: 'San Francisco', lat: 37.7749, lng: -122.4194, pop_max: 4729000, country: 'United States' },
                { name: 'San Diego', lat: 32.7157, lng: -117.1611, pop_max: 3300000, country: 'United States' },
                { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, pop_max: 12458000, country: 'United States' },
                { name: 'Las Vegas', lat: 36.1699, lng: -115.1398, pop_max: 2228000, country: 'United States' },
                { name: 'Calgary', lat: 51.0447, lng: -114.0719, pop_max: 1336000, country: 'Canada' },
                { name: 'Edmonton', lat: 53.5461, lng: -113.4938, pop_max: 1418000, country: 'Canada' },
                { name: 'Minneapolis', lat: 44.9778, lng: -93.2650, pop_max: 2977000, country: 'United States' },
                { name: 'Vancouver', lat: 49.2827, lng: -123.1207, pop_max: 2463000, country: 'Canada' },
                { name: 'Washington DC', lat: 38.9072, lng: -77.0369, pop_max: 6280000, country: 'United States' },
                
                // Central America & Mexico
                { name: 'Guatemala City', lat: 14.6349, lng: -90.5069, pop_max: 2935000, country: 'Guatemala' },
                { name: 'San Salvador', lat: 13.6929, lng: -89.2182, pop_max: 1767000, country: 'El Salvador' },
                { name: 'Managua', lat: 12.1150, lng: -86.2362, pop_max: 1048000, country: 'Nicaragua' },
                { name: 'San Jose', lat: 9.9281, lng: -84.0907, pop_max: 1358000, country: 'Costa Rica' },
                { name: 'Panama City', lat: 8.9824, lng: -79.5199, pop_max: 1822000, country: 'Panama' },
                { name: 'Belize City', lat: 17.5045, lng: -88.1962, pop_max: 70000, country: 'Belize' },
                { name: 'Tegucigalpa', lat: 14.0723, lng: -87.1921, pop_max: 1363000, country: 'Honduras' },
                
                // Caribbean (West Indies)
                { name: 'Havana', lat: 23.1136, lng: -82.3666, pop_max: 2141000, country: 'Cuba' },
                { name: 'Kingston', lat: 17.9714, lng: -76.7931, pop_max: 1206000, country: 'Jamaica' },
                { name: 'Santo Domingo', lat: 18.4861, lng: -69.9312, pop_max: 3172000, country: 'Dominican Republic' },
                { name: 'Port-au-Prince', lat: 18.5944, lng: -72.3074, pop_max: 2618000, country: 'Haiti' },
                { name: 'San Juan', lat: 18.4655, lng: -66.1057, pop_max: 2448000, country: 'Puerto Rico' },
                { name: 'Bridgetown', lat: 13.1132, lng: -59.5988, pop_max: 110000, country: 'Barbados' },
                { name: 'Port of Spain', lat: 10.6596, lng: -61.5089, pop_max: 544000, country: 'Trinidad and Tobago' },
                
                // Asia
                { name: 'Osaka', lat: 34.6937, lng: 135.5023, pop_max: 19281000, country: 'Japan' },
                
                // Africa
                { name: 'Cairo', lat: 30.0444, lng: 31.2357, pop_max: 20900000, country: 'Egypt' },
                { name: 'Lagos', lat: 6.5244, lng: 3.3792, pop_max: 14368000, country: 'Nigeria' },
                { name: 'Johannesburg', lat: -26.2041, lng: 28.0473, pop_max: 9600000, country: 'South Africa' },
                { name: 'Nairobi', lat: -1.2864, lng: 36.8172, pop_max: 4735000, country: 'Kenya' },
                { name: 'Casablanca', lat: 33.5731, lng: -7.5898, pop_max: 3752000, country: 'Morocco' },
                { name: 'Addis Ababa', lat: 9.0320, lng: 38.7469, pop_max: 4794000, country: 'Ethiopia' },
                { name: 'Dar es Salaam', lat: -6.7924, lng: 39.2083, pop_max: 6702000, country: 'Tanzania' },
                { name: 'Accra', lat: 5.6037, lng: -0.1870, pop_max: 2475000, country: 'Ghana' },
                { name: 'Khartoum', lat: 15.5007, lng: 32.5599, pop_max: 5829000, country: 'Sudan' },
                { name: 'Cape Town', lat: -33.9249, lng: 18.4241, pop_max: 4618000, country: 'South Africa' },
                { name: 'Algiers', lat: 36.7538, lng: 3.0588, pop_max: 2768000, country: 'Algeria' },
                { name: 'Luanda', lat: -8.8383, lng: 13.2344, pop_max: 8330000, country: 'Angola' },
                { name: 'Tunis', lat: 36.8065, lng: 10.1815, pop_max: 2291000, country: 'Tunisia' },
                { name: 'Tripoli', lat: 32.8872, lng: 13.1913, pop_max: 1158000, country: 'Libya' },
                { name: 'Alexandria', lat: 31.2001, lng: 29.9187, pop_max: 5200000, country: 'Egypt' },
                { name: 'Rabat', lat: 34.0209, lng: -6.8416, pop_max: 1865000, country: 'Morocco' },
                
                // Arabian Peninsula & Middle East
                { name: 'Dubai', lat: 25.2048, lng: 55.2708, pop_max: 3478000, country: 'United Arab Emirates' },
                { name: 'Riyadh', lat: 24.7136, lng: 46.6753, pop_max: 7231000, country: 'Saudi Arabia' },
                { name: 'Doha', lat: 25.2854, lng: 51.5310, pop_max: 2382000, country: 'Qatar' },
                { name: 'Abu Dhabi', lat: 24.4539, lng: 54.3773, pop_max: 1482000, country: 'United Arab Emirates' },
                { name: 'Kuwait City', lat: 29.3759, lng: 47.9774, pop_max: 3052000, country: 'Kuwait' },
                { name: 'Muscat', lat: 23.5880, lng: 58.3829, pop_max: 1623000, country: 'Oman' },
                { name: 'Jeddah', lat: 21.5433, lng: 39.1728, pop_max: 4610000, country: 'Saudi Arabia' },
                { name: 'Jerusalem', lat: 31.7683, lng: 35.2137, pop_max: 936000, country: 'Israel' },
                { name: 'Gaza City', lat: 31.5000, lng: 34.4667, pop_max: 590000, country: 'Palestine' },
                { name: 'Kyiv', lat: 50.4501, lng: 30.5234, pop_max: 2950000, country: 'Ukraine' },
                
                // Australia & Oceania
                { name: 'Sydney', lat: -33.8688, lng: 151.2093, pop_max: 5312000, country: 'Australia' },
                { name: 'Melbourne', lat: -37.8136, lng: 144.9631, pop_max: 5078000, country: 'Australia' },
                { name: 'Brisbane', lat: -27.4698, lng: 153.0251, pop_max: 2514000, country: 'Australia' },
                { name: 'Perth', lat: -31.9505, lng: 115.8605, pop_max: 2125000, country: 'Australia' },
                { name: 'Auckland', lat: -36.8485, lng: 174.7633, pop_max: 1657000, country: 'New Zealand' },
                { name: 'Wellington', lat: -41.2865, lng: 174.7762, pop_max: 415000, country: 'New Zealand' },
                
                // South America
                { name: 'Bogota', lat: 4.7110, lng: -74.0721, pop_max: 10978000, country: 'Colombia' },
                { name: 'Santiago', lat: -33.4489, lng: -70.6693, pop_max: 6680000, country: 'Chile' },
                { name: 'Caracas', lat: 10.4806, lng: -66.9036, pop_max: 2935000, country: 'Venezuela' },
                { name: 'Lima', lat: -12.0464, lng: -77.0428, pop_max: 10719000, country: 'Peru' },
                { name: 'Quito', lat: -0.1807, lng: -78.4678, pop_max: 2781000, country: 'Ecuador' },
                { name: 'La Paz', lat: -16.5000, lng: -68.1500, pop_max: 1835000, country: 'Bolivia' },
                { name: 'Montevideo', lat: -34.9011, lng: -56.1645, pop_max: 1753000, country: 'Uruguay' },
                { name: 'Asuncion', lat: -25.2637, lng: -57.5759, pop_max: 2356000, country: 'Paraguay' },
                { name: 'Georgetown', lat: 6.8013, lng: -58.1551, pop_max: 110000, country: 'Guyana' },
                { name: 'Paramaribo', lat: 5.8520, lng: -55.2038, pop_max: 240000, country: 'Suriname' },
                
                // Europe
                { name: 'Rome', lat: 41.9028, lng: 12.4964, pop_max: 4257000, country: 'Italy' },
                { name: 'Madrid', lat: 40.4168, lng: -3.7038, pop_max: 6618000, country: 'Spain' },
                { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, pop_max: 2431000, country: 'Netherlands' },
                { name: 'London', lat: 51.5074, lng: -0.1278, pop_max: 9304000, country: 'United Kingdom' },
                { name: 'Paris', lat: 48.8566, lng: 2.3522, pop_max: 11027000, country: 'France' },
                { name: 'Berlin', lat: 52.5200, lng: 13.4050, pop_max: 3562000, country: 'Germany' },
                { name: 'Vienna', lat: 48.2082, lng: 16.3738, pop_max: 1915000, country: 'Austria' },
                { name: 'Brussels', lat: 50.8503, lng: 4.3517, pop_max: 2065000, country: 'Belgium' },
                { name: 'Lisbon', lat: 38.7223, lng: -9.1393, pop_max: 2927000, country: 'Portugal' },
                { name: 'Warsaw', lat: 52.2297, lng: 21.0122, pop_max: 1768000, country: 'Poland' },
                { name: 'Prague', lat: 50.0755, lng: 14.4378, pop_max: 1309000, country: 'Czech Republic' },
                { name: 'Budapest', lat: 47.4979, lng: 19.0402, pop_max: 1768000, country: 'Hungary' },
                
                // Northern Europe (Nordic/Viking Cities)
                { name: 'Copenhagen', lat: 55.6761, lng: 12.5683, pop_max: 1346000, country: 'Denmark' },
                { name: 'Stockholm', lat: 59.3293, lng: 18.0686, pop_max: 1608000, country: 'Sweden' },
                { name: 'Oslo', lat: 59.9139, lng: 10.7522, pop_max: 1041000, country: 'Norway' },
                { name: 'Helsinki', lat: 60.1695, lng: 24.9354, pop_max: 1279000, country: 'Finland' },
                { name: 'Reykjavik', lat: 64.1466, lng: -21.9426, pop_max: 216000, country: 'Iceland' },
                { name: 'Gothenburg', lat: 57.7089, lng: 11.9746, pop_max: 1015000, country: 'Sweden' },
                { name: 'Bergen', lat: 60.3913, lng: 5.3221, pop_max: 283000, country: 'Norway' },
              ].map(city => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [city.lng, city.lat] },
                properties: { name: city.name, pop_max: city.pop_max, adm0name: city.country }
              }));

              // Combine filtered places with custom cities
              const allCities = [...filteredPlaces, ...customCities];

              // Store cities for HTML labels
              setCityLabels(allCities);

              // Function to filter cities based on zoom level
              const getVisibleCitiesByZoom = (altitude: number) => {
                // altitude ranges: 2.5 (default), 0.8 (zoomed in), up to 500 (max zoom out)
                if (altitude > 2.0) {
                  // Zoomed out: only show mega cities (5M+)
                  return allCities.filter((c: any) => (c.properties.pop_max || 0) >= 5000000);
                } else if (altitude > 1.2) {
                  // Medium zoom: show major cities (2M+)
                  return allCities.filter((c: any) => (c.properties.pop_max || 0) >= 2000000);
                } else {
                  // Zoomed in: show all cities
                  return allCities;
                }
              };

              // Initialize globe.gl with MAXIMUM performance settings
              const globe = new Globe(mountRef.current!)
                .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg')
                .atmosphereAltitude(0.05) // Reduced for performance
                .showAtmosphere(false) // Disable atmosphere completely for performance

                // Points Data (The Dots) - Color coded by population
                .pointsData(getVisibleCitiesByZoom(2.5))
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
                  
                  // Clear any pending rotation resume timers
                  if (inactivityTimerRef.current) {
                    clearTimeout(inactivityTimerRef.current);
                    inactivityTimerRef.current = null;
                  }
                  
                  // Pause rotation when city is clicked
                  pauseRotation();
                  
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
                // Only resume rotation if no city panel is open
                if (!isPanelOpenRef.current) {
                  resumeRotationAfterDelay();
                }
              });

              // Update visible cities when zoom changes
              let lastUpdateTime = 0;
              controls.addEventListener('change', () => {
                const now = Date.now();
                // Throttle updates to every 100ms for performance
                if (now - lastUpdateTime < 100) return;
                lastUpdateTime = now;
                
                const pov = globe.pointOfView();
                const newAltitude = pov.altitude;
                
                // Update altitude ref and state for label filtering
                altitudeRef.current = newAltitude;
                setCurrentAltitude(newAltitude);
                
                // Update points data based on zoom level
                const visibleCities = getVisibleCitiesByZoom(newAltitude);
                globe.pointsData(visibleCities);
              });

              globeRef.current = globe;

              // Set renderer to use lower pixel ratio for better performance and transparent background
              setTimeout(() => {
                if (globeRef.current && globeRef.current.renderer) {
                  try {
                    const renderer = globeRef.current.renderer();
                    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
                    // Make background transparent so stars show through
                    renderer.setClearColor(0x000000, 0);
                  } catch (e) {
                    console.log('Renderer optimization applied');
                  }
                }
              }, 100);

              // Update label positions continuously (lightweight HTML updates)
              const updateLabelPositions = () => {
                if (globeRef.current) {
                  // Update altitude from current point of view
                  const pov = globe.pointOfView();
                  if (pov && pov.altitude !== undefined) {
                    const newAlt = pov.altitude;
                    if (Math.abs(newAlt - altitudeRef.current) > 0.1) {
                      altitudeRef.current = newAlt;
                      setCurrentAltitude(newAlt);
                    }
                  }
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
        background: 'transparent',
      }}
    >
      {/* Lightweight HTML labels - stuck to map, no WebGL! */}
      {globeRef.current && cityLabels
        .filter((city) => {
          // Filter labels based on zoom level
          const pop = city.properties.pop_max || 0;
          if (currentAltitude > 2.0) {
            return pop >= 5000000; // Zoomed out: only mega cities
          } else if (currentAltitude > 1.2) {
            return pop >= 2000000; // Medium: major cities
          }
          return true; // Zoomed in (altitude < 1.2): show all cities
        })
        .map((city, idx) => {
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
            
            // Only show if within ~70 degrees (front hemisphere, avoiding horizon)
            // Reduced from 100 to 70 to prevent clustering at horizon edges
            const isVisible = Math.sqrt(latDiff * latDiff + adjustedLngDiff * adjustedLngDiff) < 70;
            
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
      {selectedLocation && !selectedTopic && !isTrendingExpanded && (
        <CityNewsPanel
          cityName={selectedLocation.name}
          country={selectedLocation.country}
          cachedNews={newsCacheRef.current.get(`${selectedLocation.name}-${selectedLocation.country}`)}
          onNewsFetched={(news) => {
            newsCacheRef.current.set(`${selectedLocation.name}-${selectedLocation.country}`, news);
          }}
          onNewsClick={(topic, location) => {
            console.log('News clicked - Topic:', topic, 'Location:', location);
            setSelectedTopic(topic);
            setSelectedLocationString(location);
          }}
          onClose={() => {
            setSelectedLocation(null);
            isPanelOpenRef.current = false;
            // Resume rotation when panel is closed
            if (globeRef.current && globeRef.current.controls()) {
              globeRef.current.controls().autoRotate = true;
            }
          }}
        />
      )}
      
      {/* Analysis View */}
      {selectedTopic && (
        <AnalysisView
          topic={selectedTopic}
          location={selectedLocationString || undefined}
          onClose={() => {
            setSelectedTopic(null);
            setSelectedLocationString(null);
          }}
        />
      )}
    </div>
  );
}