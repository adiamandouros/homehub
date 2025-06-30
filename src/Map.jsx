import { useEffect } from 'react';

function Map() {
  console.log('🚀 Map component is being rendered');
  
  useEffect(() => {
    console.log('🔥 Map component useEffect started - Attempt:', Date.now());
    
    // Define the initMap function FIRST before any checks
    window.initMap = function() {
      console.log('🗺️ initMap function called');
      
      // Prevent multiple initializations using global flag
      if (window.mapInitialized) {
        console.log('⚠️ initMap already called, skipping duplicate initialization');
        return;
      }
      
      console.log('🗺️ Google Maps object:', window.google);
      
      const mapElement = document.getElementById('map');
      console.log('🗺️ Map element found:', !!mapElement);
      
      if (!mapElement) {
        console.error('❌ Map element not found!');
        return;
      }
      
      // Mark as initialized at the start
      window.mapInitialized = true;
      console.log('🔒 Setting global initialized flag to prevent duplicates');
      
      // Default location (Athens) as fallback
      const defaultLocation = {lat: 37.976, lng: 23.648};
      
      // Function to create map with given location
      const createMap = (location, isUserLocation = false, accuracy = null) => {
        console.log('🗺️ Creating map with:', { location, isUserLocation, accuracy });
        
        try {
          const map = new window.google.maps.Map(mapElement, {
            zoom: 17, 
            center: location,
            mapTypeId: 'roadmap'
          });
          
          window.map = map;
          console.log('✅ Map created successfully');
          
          // Add marker
          new window.google.maps.Marker({
            position: location,
            map: map,
            title: isUserLocation ? 'Your Location' : 'Default Location',
            icon: isUserLocation ? {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="blue" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(24, 24)
            } : undefined
          });
          console.log('✅ Marker added');
          
          // Add accuracy circle if we have user location
          if (isUserLocation && accuracy) {
            new window.google.maps.Circle({
              strokeColor: '#4285F4',
              strokeOpacity: 0.4,
              strokeWeight: 1,
              fillColor: '#4285F4',
              fillOpacity: 0.1,
              map: map,
              center: location,
              radius: accuracy
            });
            console.log(`✅ Accuracy circle added with ${accuracy}m radius`);
          }
          
        } catch (error) {
          console.error('❌ Error creating map:', error);
        }
      };
      
      // Function to fetch transport data from API
      const fetchTransportData = async (lat, lng) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`🚌 [${timestamp}] Fetching transport data for: ${lat}, ${lng}`);
        
        try {
          const apiUrl = `https://sonovabitc.win/api/publicTransport/localInfo?x=${lat}&y=${lng}`;
          console.log('🚌 API URL:', apiUrl);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ [${timestamp}] Transport data received:`, data);
            window.transportData = data;
            
            // Trigger a custom event so other parts of the app can listen for updates
            window.dispatchEvent(new CustomEvent('transportDataUpdated', { 
              detail: { data, timestamp: Date.now() }
            }));
            
            return data;
          } else {
            console.warn(`⚠️ [${timestamp}] API response not OK: ${response.status} ${response.statusText}`);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            console.error(`⏰ [${timestamp}] API request timed out after 10 seconds`);
          } else {
            console.error(`❌ [${timestamp}] Transport API error:`, error.message);
          }
          return null;
        }
      };
      
      // Process user location and create map
      const processUserLocation = async (position) => {
        try {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          console.log('📍 User location:', userLocation);
          console.log('📍 Accuracy:', position.coords.accuracy + 'm');
          
          // Initial fetch of transport data
          await fetchTransportData(userLocation.lat, userLocation.lng);
          
          // Set up polling for transport data every 20 seconds
          const pollingInterval = setInterval(async () => {
            console.log('🔄 Polling transport data...');
            await fetchTransportData(userLocation.lat, userLocation.lng);
          }, 20000); // 20 seconds
          
          // Store interval ID globally so it can be cleared later
          window.transportPollingInterval = pollingInterval;
          console.log('⏰ Transport data polling started (every 20 seconds)');
          
          // Create map
          createMap(userLocation, true, position.coords.accuracy);
          
        } catch (error) {
          console.error('❌ Critical error in processUserLocation:', error);
          createMap(defaultLocation, false);
        }
      };
      
      // Get user location
      if (navigator.geolocation) {
        console.log('📍 Starting geolocation...');
        
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            console.log('📍 Position obtained - Accuracy:', position.coords.accuracy + 'm');
            await processUserLocation(position);
          },
          (error) => {
            console.warn('❌ Geolocation failed:', error.message);
            console.log('📍 Using default location');
            createMap(defaultLocation, false);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      } else {
        console.warn('❌ Geolocation not supported');
        createMap(defaultLocation, false);
      }
    };

    // Now do the checks after initMap is defined
    // Check if map is already initialized globally
    if (window.mapInitialized) {
      console.log('🗺️ Map already initialized globally, skipping useEffect');
      return;
    }
    
    // Check if script is already loading
    if (window.googleMapsScriptLoading) {
      console.log('⚠️ Google Maps script already loading, skipping duplicate load');
      return;
    }

    console.log('🔥 About to check Google Maps script loading...');
    
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    console.log('🔍 Existing Google Maps script:', !!existingScript);
    
    // Load Google Maps script if not already loaded
    if (!window.google && !existingScript) {
      console.log('📥 Loading Google Maps script...');
      
      // Set flag to prevent duplicate loads
      window.googleMapsScriptLoading = true;
      
      const script = document.createElement('script');
      script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDH5CokCMZs5Fh_e0VCY38NoKPflfUD7ds&loading=async&callback=initMap";
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('✅ Google Maps script loaded successfully');
        window.googleMapsScriptLoading = false;
      };
      
      script.onerror = (error) => {
        console.error('❌ Google Maps script failed to load:', error);
        window.googleMapsScriptLoading = false;
      };
      
      document.head.appendChild(script);
      console.log('📥 Script added to document head');
      
    } else if (window.google) {
      console.log('✅ Google Maps already loaded, calling initMap directly');
      window.initMap();
    } else {
      console.log('⏳ Google Maps script already exists, waiting for it to load');
    }

    console.log('🔥 useEffect setup complete');

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up Map component');
      
      // Clear transport data polling interval
      if (window.transportPollingInterval) {
        clearInterval(window.transportPollingInterval);
        console.log('⏹️ Transport data polling stopped');
        delete window.transportPollingInterval;
      }
      
      // Clear other global references
      delete window.initMap;
      if (window.mapInitialized) {
        window.mapInitialized = false;
      }
    };
  }, []);

  return (
    <div className='map-container' style={{ height: '100%', width: '100%' }}>
      <div id="main" style={{ height: '100%', width: '100%' }}>
        <div id="map" style={{ height: '100%', width: '100%', minHeight: '400px' }}></div>
      </div>
    </div>
  );
}

export default Map;
