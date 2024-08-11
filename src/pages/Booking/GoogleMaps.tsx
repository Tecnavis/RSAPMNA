import { useState, useEffect } from 'react';

declare global {
    interface Window {
        googleMapsInitialized: boolean;
        initMap: () => void;
    }
}

const useGoogleMaps = () => {
    const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

    useEffect(() => {
        // Check if Google Maps is already initialized
        if (window.googleMapsInitialized) {
            setGoogleMapsLoaded(true);
            return;
        }

        // Define the initMap function
        window.initMap = () => {
            console.log('Google Maps API loaded successfully');
            setGoogleMapsLoaded(true);
            window.googleMapsInitialized = true;
        };

        // Add a listener to check if Google Maps API is already loaded
        if (window.google && window.google.maps) {
            window.initMap();
        }

    }, []);

    return googleMapsLoaded;
};

export default useGoogleMaps;