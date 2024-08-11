import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

const BaseLocationWithout = ({ onClose, setBaseLocation }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState([]);
    const db = getFirestore();
    const [distances, setDistances] = useState({});

    console.log('distances', distances);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'baselocation'));
                const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setItems(data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [db]);

    const filteredItems = items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleSelect = (item) => {
        setBaseLocation(item); // Update the base location in the parent component
        onClose(); // Close the modal
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
                <div className="mb-2 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Select Base Location</h2>
                    <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="search-container mb-2">
                    <input type="text" placeholder="Search locations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-2 rounded border border-gray-300 w-full" />
                </div>
                <div className="table-responsive max-h-80 overflow-y-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="px-4 py-2">Start Location</th>
                                <th className="px-4 py-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <td className="px-4 py-2">{item.name}</td>
                                    <td className="px-4 py-2 text-center">
                                        <Tippy content="Select">
                                            <button type="button" className="btn btn-primary text-blue-600 hover:text-blue-200" onClick={() => handleSelect(item)}>
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

export default BaseLocationWithout;
