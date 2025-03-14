import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, getFirestore, Timestamp, orderBy } from 'firebase/firestore';
import { NavLink } from 'react-router-dom';

interface Booking {
    id: string;
    fileNumber?: string;
    customerName?: string;
    serviceType?: string;
    phoneNumber?: string;
    status?: string;
    serviceCategory?:string;
    vehicleNumber?:string;
    createdAt?: string;
}

const ShowroomStaffDashboard: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedTab, setSelectedTab] = useState<'bookings' | 'completed'>('bookings');
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;

    const staffId = sessionStorage.getItem('staffId');
    const showroomId = sessionStorage.getItem('showroomId');
    const uid = sessionStorage.getItem('uid');
    const db = getFirestore();
console.log("staffId",uid)
    useEffect(() => {
        if (!uid || !showroomId || !staffId) {
            console.warn('Missing session storage values');
            setLoading(false);
            return;
        }

        const fetchBookings = async () => {
            try {
                const bookingsRef = collection(db, `user/${uid}/bookings`);
                const q = query(bookingsRef, where('showroomId', '==', showroomId), where('createdBy', '==', 'showroomStaff'));

                const querySnapshot = await getDocs(q);
                const bookingList: Booking[] = querySnapshot.docs.map((doc) => {
                    const data = doc.data();
                    const formattedCreatedAt = data.createdAt 
                    ? new Date((data.createdAt as Timestamp).toDate()).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                    })
                    : 'N/A';
                    return {
                        id: doc.id,
                        ...(data as Omit<Booking, 'id'>),
                        createdAt: formattedCreatedAt,

                    };
                });

                setBookings(bookingList);
                console.log("bookingList",bookings)
            } catch (error) {
                console.error('Error fetching bookings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [uid, showroomId, staffId]);

    // Filter bookings based on selected tab
  // Filter bookings based on selected tab
  const filteredBookings =
  selectedTab === "bookings"
      ? bookings.filter((booking) => booking.status !== "Order Completed")
      : bookings.filter((booking) => booking.status === "Order Completed");

// Pagination calculations
const indexOfLastRecord = currentPage * recordsPerPage;
const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
const currentRecords = filteredBookings.slice(indexOfFirstRecord, indexOfLastRecord);
const totalPages = Math.ceil(filteredBookings.length / recordsPerPage);

    return (
        <div >
            {/* Navbar */}
            <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-gray-900 to-black text-white shadow-lg py-5 z-50">
    <div className="max-w-6xl mx-auto flex justify-between items-center px-6">
        <div className="text-2xl font-bold tracking-wide uppercase">
            Showroom Dashboard
        </div>
        <ul className="flex space-x-8 text-lg font-medium">
            <li>
                <NavLink 
                    to="https://rsapmna-de966.web.app/showrooms/showroom/showroomDetails"
                    className={({ isActive }) => `relative pb-2 transition-all duration-300 ${isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}`}
                >
                    Home
                </NavLink>
            </li>
            <li>
                <NavLink 
                    to="/showroomstaffdashboard"
                    state={{ showroomId, staffId }}
                    className={({ isActive }) => `relative pb-2 transition-all duration-300 ${isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}`}
                >
                    Dashboard
                </NavLink>
            </li>
            <li>
                <NavLink 
                    to="/showroomstaffprofile"
                    className={({ isActive }) => `relative pb-2 transition-all duration-300 ${isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}`}
                >
                    Profile
                </NavLink>
            </li>
            <li>
                <NavLink 
                    to="/addbook"
                    className={({ isActive }) => `relative pb-2 transition-all duration-300 ${isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}`}
                >
                    Add Book
                </NavLink>
            </li>
            <li>
                <NavLink 
                    to="/showroomstaffreward"
                    className={({ isActive }) => `relative pb-2 transition-all duration-300 ${isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}`}
                >
                    Reward
                </NavLink>
            </li>
        </ul>
    </div>
</nav>

            <h2 className="text-2xl font-bold text-center text-gray-800 mt-28 mb-4">Showroom Staff Dashboard</h2>

         {/* Tabs */}
<div className="flex justify-center border-b border-gray-300 mb-6">
    <div
        onClick={() => setSelectedTab('bookings')}
        className={`cursor-pointer px-6 py-3 text-lg font-semibold transition-all duration-300 ${
            selectedTab === 'bookings' 
                ? 'text-blue-600 border-b-4 border-blue-600' 
                : 'text-gray-500 hover:text-blue-500'
        }`}
    >
        Bookings
    </div>
    <div
        onClick={() => setSelectedTab('completed')}
        className={`cursor-pointer px-6 py-3 text-lg font-semibold transition-all duration-300 ${
            selectedTab === 'completed' 
                ? 'text-blue-600 border-b-4 border-blue-600' 
                : 'text-gray-500 hover:text-blue-500'
        }`}
    >
        Completed Bookings
    </div>
</div>


            {loading ? (
                <p className="text-center text-gray-600">Loading bookings...</p>
            ) : filteredBookings.length === 0 ? (
                <p className="text-center text-gray-600">No {selectedTab === 'bookings' ? 'pending' : 'completed'} bookings found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="m-4 w-full border border-gray-200 shadow-lg rounded-lg">
                        <thead className="bg-gray-800 text-gray">
                            <tr>
                                <th className="py-3 px-4 border-b">Index</th>
                                <th className="py-3 px-4 border-b">CreatedAt</th>

                                <th className="py-3 px-4 border-b">File Number</th>
                                <th className="py-3 px-4 border-b">Customer Name</th>
                                <th className="py-3 px-4 border-b">Phone Number</th>
                                <th className="py-3 px-4 border-b">Vehicle Number</th>
                                <th className="py-3 px-4 border-b">Vehicle Section</th>

                                <th className="py-3 px-4 border-b">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentRecords.map((booking, index) => (
                                <tr key={booking.id} className="hover:bg-gray-100">
                                    <td className="py-3 px-4 border-b text-center">{index + 1}</td>
                                    <td className="py-3 px-4 border-b text-center">
    {booking.createdAt || 'N/A'}
</td>

                                    <td className="py-3 px-4 border-b text-center">{booking.fileNumber || 'N/A'}</td>
                                    <td className="py-3 px-4 border-b text-center">{booking.customerName || 'N/A'}</td>
                                    <td className="py-3 px-4 border-b text-center">{booking.phoneNumber || 'N/A'}</td>
                                    <td className="py-3 px-4 border-b text-center">{booking.vehicleNumber || 'N/A'}</td>
                                    <td className="py-3 px-4 border-b text-center">{booking.serviceCategory || 'N/A'}</td>
                                   
                                    <td className="py-3 px-4 border-b text-center">
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                booking.status === 'Order Completed' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                                            }`}
                                        >
                                            {booking.status || 'N/A'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                       {/* Pagination */}
                       <div className="flex justify-center my-4 space-x-4">
    <button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(currentPage - 1)}
        className={`px-4 py-2 rounded-md text-white font-semibold transition-all duration-300 
            ${currentPage === 1 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
    >
        Prev
    </button>
    
    <span className="px-4 py-2 bg-gray-200 rounded-md text-gray-800 font-semibold">
        {currentPage} / {totalPages}
    </span>
    
    <button
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(currentPage + 1)}
        className={`px-4 py-2 rounded-md text-white font-semibold transition-all duration-300 
            ${currentPage === totalPages ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
    >
        Next
    </button>
</div>

                </div>
            )}
        </div>
    );
};

export default ShowroomStaffDashboard;
