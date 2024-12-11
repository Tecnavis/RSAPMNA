import React from 'react';

interface Location {
  lat: number;
  lng: number;
}

interface MapWithRoutesProps {
  baseLocation: Location;
  pickupLocation: Location;
  dropoffLocation: Location;
}

const MapWithRoutes: React.FC<MapWithRoutesProps> = ({ baseLocation, pickupLocation, dropoffLocation }) => {
  // Check if all locations are defined
  if (
    !baseLocation || 
    !pickupLocation || 
    !dropoffLocation || 
    baseLocation.lat === null || 
    pickupLocation.lat === null || 
    dropoffLocation.lat === null
  ) {
    return <div>Loading map...</div>; // Or any other loading state indicator
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${baseLocation.lat},${baseLocation.lng}&destination=${dropoffLocation.lat},${dropoffLocation.lng}&waypoints=${pickupLocation.lat},${pickupLocation.lng}|${baseLocation.lat},${baseLocation.lng}`;

  return (
    <div>
      <div style={{ width: '100%', marginTop: '20px' }}>
        <iframe
          width="100%"
          height="500"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={directionsUrl}
        ></iframe>
      </div>
    </div>
  );
};

export default MapWithRoutes;
