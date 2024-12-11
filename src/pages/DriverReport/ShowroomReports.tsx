import React, { useState, useEffect, ChangeEvent } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';

interface Showroom {
    id: string;
    ShowRoom: string;  // This is the correct field for the showroom name
    location: string;
    manager: string;
    contactNumber: string;
    wholeBalance: number;
}

const ShowroomReports: React.FC = () => {
    const [showrooms, setShowrooms] = useState<Showroom[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');

    const db = getFirestore();
    const uid = sessionStorage.getItem('uid');

    useEffect(() => {
        const fetchShowrooms = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, `user/${uid}/showroom`));
                const showroomList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Showroom[];
                setShowrooms(showroomList);
            } catch (error) {
                console.error('Error fetching showrooms: ', error);
            }
        };

        fetchShowrooms();
    }, [db, uid]);

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    // Filter based on the 'name' field instead of 'showroomName'
    const filteredShowrooms = showrooms.filter((showroom) =>
        (showroom.ShowRoom || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-4">Showroom Reports</h2>
            <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="p-2 border border-gray-300 rounded w-full outline-none mb-4"
            />
            <table className="min-w-full bg-white">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="py-2 px-4">Showroom Name</th>
                        <th className="py-2 px-4">Remaining Balance To be Paid</th>
                        <th className="py-2 px-4">Details</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredShowrooms.map(showroom => (
                        <tr key={showroom.id} className="hover:bg-gray-50">
                            <td className="border px-4 py-2">{showroom.ShowRoom}</td> 
                            <td className="border px-4 py-2">{showroom.wholeBalance}</td>             
               <td className="border px-4 py-2">
    <Link
        to={`/showroomreport/showroomcashcollection/${showroom.id}`}
        state={{ showroomName: showroom.ShowRoom }}  // Pass the state separately
        className="text-blue-500 hover:text-blue-700 bg-blue-100 px-2 py-1 rounded-md shadow-md"
    >
        View Cash Collection Report
    </Link>
</td>


                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ShowroomReports;
