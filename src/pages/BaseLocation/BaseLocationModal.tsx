import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import axios from 'axios';


const BaseLocationModal = ({ onClose, setBaseLocation, pickupLocation }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState([]);
    const db = getFirestore();
    const [distances, setDistances] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
              console.log('Fetching base locations from Firestore...');
              const querySnapshot = await getDocs(collection(db, 'baselocation'));
              const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
              setItems(data);
              console.log('Base locations fetched:', data);
          
              const [locationName, lat, lng] = pickupLocation.split(',').map(part => part.trim());
              const parsedPickupLocation = {
                lat: parseFloat(lat),
                lng: parseFloat(lng)
              };
          
              console.log('Parsed pickup location:', parsedPickupLocation);
          
              if (!isNaN(parsedPickupLocation.lat) && !isNaN(parsedPickupLocation.lng)) {
                console.log('Pickup location is valid and set:', parsedPickupLocation);
                const distancePromises = data.map((item) =>
                  getDistanceAndDuration(parsedPickupLocation, { lat: item.lat, lng: item.lng }, item.id)
                );
                console.log('Fetching distances for each base location...');
                const distanceResults = await Promise.all(distancePromises);
                console.log('Distances fetched:', distanceResults);
                const distancesObj = distanceResults.reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {});
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
    }, [db, pickupLocation]);

    const getDistanceAndDuration = async (origin, destination, id) => {
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
                'X-Request-Id': 'YOUR_REQUEST_ID', // Replace with your actual request ID
              }
            }
          );
      
          if (response.status === 200) {
            const data = response.data;
            console.log('Distance response:', data);
      
            if (data.routes && data.routes.length > 0) {
              const route = data.routes[0];
              console.log('Route:', route);
      
              if (route.legs && route.legs.length > 0) {
                const leg = route.legs[0];
                console.log('Leg:', leg);
      
                const distanceInfo = {
                  id,
                  distance: leg.distance !== undefined ? (leg.distance / 1000).toFixed(2) : null, // Convert to km and format
                  duration: formatDuration(leg.duration !== undefined ? leg.duration : null) // Convert to readable format
                };
      
                console.log('Distance info:', distanceInfo);
                return distanceInfo;
              } else {
                console.error('No legs found in the route:', route);
                return { id, distance: null, duration: null };
              }
            } else {
              console.error('No routes found in the response:', data);
              return { id, distance: null, duration: null };
            }
          } else {
            console.error('Error fetching directions:', response.statusText);
            return { id, distance: null, duration: null };
          }
        } catch (error) {
          console.error('Error fetching distance data:', error);
          return { id, distance: null, duration: null };
        }
    };

    const formatDuration = (seconds) => {
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

    const filteredItems = items
    .filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
        const distanceA = distances[a.id]?.distance || Infinity; // Use Infinity for items without a calculated distance
        const distanceB = distances[b.id]?.distance || Infinity;
        return distanceA - distanceB; // Sort by distance
    });
    const handleSelect = (item) => {
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
            <div className="search-container mb-4">
                <input
                    type="text"
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 rounded border border-gray-300 w-full"
                />
            </div>
            <div className="table-responsive">
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="px-4 py-2">Start Location</th>
                            <th className="px-4 py-2">Distance</th>
                            <th className="px-4 py-2">Duration</th>
                            <th className="px-4 py-2 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                <td className="px-4 py-2">{item.name}</td>
                                <td className="px-4 py-2">{distances[item.id]?.distance || 'Calculating...'} km</td>
                                <td className="px-4 py-2">{distances[item.id]?.duration || 'Calculating...'}</td>
                                <td className="px-4 py-2 text-center">
                                    <Tippy content="Select">
                                        <button
                                            type="button"
                                            className="btn btn-primary text-blue-600 hover:text-blue-800"
                                            onClick={() => handleSelect(item)}
                                        >
                                            Select
                                        </button>
                                    </Tippy>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);
};
export default BaseLocationModal;
