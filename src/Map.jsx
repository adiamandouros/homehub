import { useEffect, useRef } from 'react';
import './Map.css'

function Map() {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const pollingRef = useRef(null);
  const transportMarkersRef = useRef([]);
  
  useEffect(() => {
    let isMounted = true;

    // Helper: Load Google Maps script
    const loadGoogleMapsScript = () => {
      return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
          resolve();
          return;
        }
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
          // Wait for script to load
          const interval = setInterval(() => {
            if (window.google && window.google.maps) {
              clearInterval(interval);
              resolve();
            }
          }, 100);
          return;
        }
        const script = document.createElement('script');
        script.src =
          'https://maps.googleapis.com/maps/api/js?key=AIzaSyDH5CokCMZs5Fh_e0VCY38NoKPflfUD7ds&loading=async';
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    // Helper: Get device location as accurately as possible
    const getDeviceLocation = () => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Device location:', position);
            resolve(position);
          },
          (error) => {
            console.error('Error getting device location:', error);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          }
        );
      });
    };

    // Helper: Fetch transport data
    const fetchTransportData = async (lat, lng) => {
      const apiUrl = `https://sonovabitc.win/api/publicTransport/localInfo?x=${lat}&y=${lng}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          console.log('[Map] API success:', data);
          return data;
        }
        console.warn('[Map] API response not ok:', response.status);
        return null;
      } catch (err) {
        console.error('[Map] API fetch error:', err);
        clearTimeout(timeoutId);
        return null;
      }
    };

    // Helper: Draw or update map, marker, and accuracy circle
    const drawMap = (location, accuracy) => {
      if (!window.google || !window.google.maps) return;
      if (!mapRef.current) {
        mapRef.current = new window.google.maps.Map(document.getElementById('map'), {
          zoom: 18,
          center: location,
          mapTypeId: 'roadmap',
        });
      } else {
        mapRef.current.setCenter(location);
      }
      // Marker
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      markerRef.current = new window.google.maps.Marker({
        position: location,
        map: mapRef.current,
        title: 'Your Location',
        icon: {
          url:
            'data:image/svg+xml;charset=UTF-8,' +
            encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="blue" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`
            ),
          scaledSize: new window.google.maps.Size(24, 24),
        },
      });
      // Accuracy circle
      if (circleRef.current) {
        circleRef.current.setMap(null);
      }
      if (accuracy) {
        circleRef.current = new window.google.maps.Circle({
          strokeColor: '#4285F4',
          strokeOpacity: 0.4,
          strokeWeight: 1,
          fillColor: '#4285F4',
          fillOpacity: 0.1,
          map: mapRef.current,
          center: location,
          radius: accuracy,
        });
      }
    };

    // Helper: Draw transport markers
    const drawTransportMarkers = (transportData) => {
      // 1. Clear previous transport markers
      if (transportMarkersRef.current.length > 0) {
        transportMarkersRef.current.forEach(marker => marker.setMap(null));
        transportMarkersRef.current = [];
      }
      if (!window.google || !window.google.maps || !mapRef.current) return;
      // 2. Iterate through transport data
      if (Array.isArray(transportData)) {
        transportData.forEach(obj => {
          // 3. Check arrivals array
          if (Array.isArray(obj.arrivals) && obj.arrivals.length > 0) {
            console.log('Creating Marker for the stop:', obj.StopDescrEng);
            const marker = new window.google.maps.Marker({
              position: { lat: parseFloat(obj.StopLat), lng: parseFloat(obj.StopLng) },
              map: mapRef.current,
              title: obj.StopDescrEng,
              icon: {
                url:
                  'data:image/svg+xml;charset=UTF-8,' +
                  encodeURIComponent(
                    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`
                  ),
                scaledSize: new window.google.maps.Size(20, 20),
              },
            });

            // 1. InfoWindow content: show LineID, black text
            const lineId = obj.arrivals[0]?.LineID ?? '';
            const eta = obj.arrivals[0]?.btime2 ?? '';
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div class="infowindow-content">
                  <span class="infowindow-lineid">${lineId}</span>
                  <span class="infowindow-eta">${eta}'</span>
                </div>
              `,
              disableAutoPan: true,
            });

            // Open the InfoWindow above the marker
            infoWindow.open(mapRef.current, marker);

            // 3. Remove the close button (X) after InfoWindow is added to DOM
            window.google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
              // Hide all InfoWindow close buttons
              document.querySelectorAll('.gm-ui-hover-effect').forEach(btn => {
                btn.style.display = 'none';
              });
            });

            transportMarkersRef.current.push(marker);
          }
        });
      }
    };

    // Main polling function
    const poll = async () => {
      try {
        const position = await getDeviceLocation();
        if (!isMounted) return;
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const accuracy = position.coords.accuracy;
        drawMap(userLocation, accuracy);
        const transportData = await fetchTransportData(userLocation.lat, userLocation.lng);
        drawTransportMarkers(transportData);
      } catch {
        // Optionally handle error (e.g., fallback to default location)
      }
    };

    // Initialize
    loadGoogleMapsScript()
      .then(() => {
        if (!isMounted) return;
        poll();
        pollingRef.current = setInterval(poll, 20000);
      })
      .catch(() => {
        // Optionally handle script load error
      });

    // Cleanup
    return () => {
      isMounted = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (markerRef.current) markerRef.current.setMap(null);
      if (circleRef.current) circleRef.current.setMap(null);
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
  }, []);

  return (
    <div className="map-container">
      <div id="main">
        <div id="map"></div>
      </div>
    </div>
  );
}

export default Map;