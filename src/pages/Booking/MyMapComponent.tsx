import React, { useEffect, useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';

interface Location {
  lat: number;
  lng: number;
}

interface MyMapComponentProps {
  pickupLocation?: Location;
  dropoffLocation?: Location;
  baseLocation?: Location;
}

const MyMapComponent: React.FC<MyMapComponentProps> = ({ pickupLocation, dropoffLocation, baseLocation }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    const initMap = () => {
      const googleMap = new window.google.maps.Map(document.getElementById('map') as HTMLElement, {
        center: { lat: 10.8505, lng: 76.2711 },
        zoom: 8,
      });
      setMap(googleMap);
    };

    if (window.google) {
      initMap();
    } else {
      console.error('Google Maps API not loaded.');
    }
  }, []);

  return (
    <div id="map" style={{ height: '400px', width: '100%' }}>
      {map && (
        <GoogleMap
          mapContainerStyle={{ height: '100%', width: '100%' }}
          center={{ lat: 10.8505, lng: 76.2711 }}
          zoom={8}
          onLoad={(mapInstance) => setMap(mapInstance)}
        >
          {pickupLocation && (
            <Marker
              position={pickupLocation}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                scaledSize: new window.google.maps.Size(40, 40),
              }}
            />
          )}
          {dropoffLocation && <Marker position={dropoffLocation} />}
          {baseLocation && (
            <Marker
              position={baseLocation}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new window.google.maps.Size(40, 40),
              }}
            />
          )}
        </GoogleMap>
      )}
    </div>
  );
};

export default MyMapComponent;
