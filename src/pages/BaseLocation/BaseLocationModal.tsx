import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import axios from 'axios';

// Define interfaces for the component props
interface BaseLocation {
    id: string;
    name: string;
    lat: string;
    lng: string;
}

interface DistanceInfo {
    id: string;
    distance: string | null;
    duration: string | null;
}

interface BaseLocationModalProps {
    onClose: () => void;
    setBaseLocation: (location: BaseLocation) => void;
    pickupLocation: { lat: string; lng: string; name: string };
}

interface Distances {
    [key: string]: DistanceInfo;
}

const BaseLocationModal: React.FC<BaseLocationModalProps> = ({ onClose, setBaseLocation, pickupLocation }) => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [items, setItems] = useState<BaseLocation[]>([]);
    const [distances, setDistances] = useState<Distances>({});
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid') || '';

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('Fetching base locations from Firestore...');
                const querySnapshot = await getDocs(collection(db, `user/${uid}/baselocation`));
                const data: BaseLocation[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BaseLocation));
                setItems(data);
                console.log('Base locations fetched:', data);
    
                const parsedPickupLocation = {
                    ...pickupLocation,
                    lat: parseFloat(pickupLocation.lat),
                    lng: parseFloat(pickupLocation.lng),
                };
                if (!isNaN(parsedPickupLocation.lat) && !isNaN(parsedPickupLocation.lng)) {
                    console.log('Pickup location is valid and set:', parsedPickupLocation);
                    const distancePromises = data.map(item =>
                        getDistanceAndDuration(
                            parsedPickupLocation,
                            { lat: parseFloat(item.lat), lng: parseFloat(item.lng) },
                            item.id
                        )
                    );
                    console.log('Fetching distances for each base location...');
                    const distanceResults = await Promise.all(distancePromises);
                    console.log('Distances fetched:', distanceResults);
                    const distancesObj = distanceResults.reduce((acc, cur, index) => {
                        const key = cur.id || `fallbackKey-${index}`; // Fallback if id is empty
                        return { ...acc, [key]: cur };
                    }, {});
                    setDistances(distancesObj);
                    console.log('Distances set in state:', distancesObj);
                } else {
                    console.log('Pickup location is invalid or missing lat/lng');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
    
        fetchData();
    }, [db, pickupLocation, uid]);

    const getDistanceAndDuration = async (origin: { lat: number; lng: number }, destination: { lat: number; lng: number }, id: string): Promise<DistanceInfo> => {
        if (!origin || !destination) return { id, distance: null, duration: null };

        try {
            console.log(`Fetching distance between ${JSON.stringify(origin)} and ${JSON.stringify(destination)}...`);
            const response = await axios.post(
                `https://api.olamaps.io/routing/v1/directions`,
                null,
                {
                    params: {
                        origin: `${origin.lat},${origin.lng}`,
                        destination: `${destination.lat},${destination.lng}`,
                        api_key: import.meta.env.VITE_REACT_APP_API_KEY
                    },
                    headers: {
                        'X-Request-Id': 'YOUR_REQUEST_ID',
                    }
                }
            );

            if (response.status === 200) {
                const data = response.data;
                console.log('Distance response:', data);

                if (data.routes && data.routes.length > 0) {
                    const route = data.routes[0];

                    if (route.legs && route.legs.length > 0) {
                        const leg = route.legs[0];
                        const distance = leg.distance !== undefined ? (leg.distance / 1000).toFixed(2) : null; // Convert to km
                        const durationInSeconds = leg.duration !== undefined ? leg.duration : null; // Duration in seconds
                        const doubledDuration = durationInSeconds !== null ? durationInSeconds * 2 : null; // Double the duration

                        const distanceInfo: DistanceInfo = {
                            id,
                            distance,
                            duration: formatDuration(doubledDuration)
                        };
                        console.log("firstdistanceInfo",distanceInfo)

                        return distanceInfo;
                    } else {
                        return { id, distance: null, duration: null };
                    }
                } else {
                    return { id, distance: null, duration: null };
                }
            } else {
                return { id, distance: null, duration: null };
            }
        } catch (error) {
            console.error('Error fetching distance data:', error);
            return { id, distance: null, duration: null };
        }
    };

    const formatDuration = (seconds: number | null): string => {
        if (seconds === null) return 'Calculating...';

        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
        } else {
            return `${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
        }
    };

    const parseDistance = (distance: string | null): number => {
        return distance ? parseFloat(distance) : Infinity;
      };
      
      const filteredItems = items
        .filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
          const distanceA = parseDistance(distances[a.id]?.distance || null);
          const distanceB = parseDistance(distances[b.id]?.distance || null);
          return distanceA - distanceB;
        });
      
  

    const handleSelect = (item: BaseLocation) => {
        setBaseLocation(item); // Update the base location in the parent component
        onClose(); // Close the modal
    };

   return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="mb-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Select Base Location</h2>
                <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Log searchTerm */}
            <div className="search-container mb-4">
                <input
                    type="text"
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={(e) => {
                        console.log('Search Term:', e.target.value); // Log the search term
                        setSearchTerm(e.target.value);
                    }}
                    className="p-2 rounded border border-gray-300 w-full"
                />
            </div>

            <div className="table-responsive">
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="px-4 py-2">Base Location</th>
                            <th className="px-4 py-2">Distance (km)</th>
                            <th className="px-4 py-2">Duration</th>
                            <th className="px-4 py-2 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map(item => {
                            // Log filteredItems and each item
                            console.log('Filtered Item:', item);
                            console.log('Distances:', distances[item.id]);  // Log the distances for this item
                            const itemKey = item.id || `${item.name}-${Math.random()}`;

                            return (
                                <tr key={itemKey} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <td className="px-4 py-2">{item.name}</td>
                                    <td className="px-4 py-2">
                                        {distances[item.id]?.distance || 'Calculating...'}
                                    </td>
                                    <td className="px-4 py-2">
                                        {distances[item.id]?.duration || 'Calculating...'}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <button onClick={() => handleSelect(item)} className="text-blue-600">Select</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);
    
};

export default BaseLocationModal;
