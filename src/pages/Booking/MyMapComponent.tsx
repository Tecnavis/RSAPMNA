import React, { useEffect, useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';

const MyMapComponent = ({ pickupLocation, dropoffLocation, baseLocation }) => {
    const [map, setMap] = useState(null);

    useEffect(() => {
        const initMap = () => {
            const googleMap = new window.google.maps.Map(document.getElementById('map'), {
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
                    onLoad={(map) => setMap(map)}
                >
                    {pickupLocation && typeof pickupLocation.lat === 'number' && typeof pickupLocation.lng === 'number' && (
                        <Marker
                            position={pickupLocation}
                            icon={{
                                url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                                scaledSize: new window.google.maps.Size(40, 40),
                            }}
                        />
                    )}
                    {dropoffLocation && typeof dropoffLocation.lat === 'number' && typeof dropoffLocation.lng === 'number' && (
                        <Marker position={dropoffLocation} />
                    )}
                    {baseLocation && typeof baseLocation.lat === 'number' && typeof baseLocation.lng === 'number' && (
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
