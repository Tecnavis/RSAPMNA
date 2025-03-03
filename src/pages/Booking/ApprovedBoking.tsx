import React, { useEffect, useState, ChangeEvent } from 'react';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import IconEdit from '../../components/Icon/IconEdit';

// Define the shape of a booking record
interface Booking {
    id: string;
    dateTime: string;
    fileNumber: string;

    customerName: string;
    phoneNumber: string;
    serviceType: string;
    vehicleNumber: string;
    comments: string;
}

const ApprovedBooking: React.FC = () => {
    const [approvedBookings, setApprovedBookings] = useState<Booking[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>(''); // State for search query
    const [currentPage, setCurrentPage] = useState<number>(1); // State for current page
    const [pageSize, setPageSize] = useState<number | 'All'>(10); // State for page size
    const PAGE_SIZES: (number | 'All')[] = [10, 25, 'All']; // Define available page sizes
    const uid = sessionStorage.getItem('uid');
    const role = sessionStorage.getItem('role');
    const userName = sessionStorage.getItem('username');
    const staffRole = sessionStorage.getItem('staffRole');

    useEffect(() => {
        const fetchApprovedBookings = async () => {
            try {
                const db = getFirestore();
                // Query to fetch bookings where status is 'Approved'
                const q = query(collection(db, `user/${uid}/bookings`), where('accountingStaffVerified', '==', true));
                const querySnapshot = await getDocs(q);
                const bookingsData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Booking[]; // Type assertion
                setApprovedBookings(bookingsData);
            } catch (error) {
                console.error('Error fetching approved bookings:', error);
            }
        };

        fetchApprovedBookings();
    }, [uid]);

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const filteredBookings = approvedBookings.filter((booking) =>
        Object.values(booking).some((value) =>
            value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    const totalRecords = filteredBookings.length;
    const totalPages = pageSize === 'All' ? 1 : Math.ceil(totalRecords / (pageSize as number));

    const displayedBookings = pageSize === 'All'
        ? filteredBookings
        : filteredBookings.slice((currentPage - 1) * (pageSize as number), currentPage * (pageSize as number));

    return (
        <div className="panel mt-6">
            <h5 className="font-semibold text-lg dark:text-white-light mb-5">
                Approved Bookings
            </h5>
            <div className="mb-5">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search..."
                    className="w-full p-2 border border-gray-300 rounded"
                />
            </div>
            <div className="datatables">
                {displayedBookings.length === 0 ? (
                    <p>No approved bookings found.</p>
                ) : (
                    <table className="table-hover">
                        <thead>
                            <tr>
                            <th>Index</th>

                                <th>Date & Time</th>
                                <th>File Number</th>

                                <th>Customer Name</th>
                                <th>Phone Number</th>
                                <th>Service Type</th>
                                <th>Vehicle Number</th>
                                <th>Comments</th>
                                {(role === 'admin' || staffRole === 'secondary admin') && (

                                <th>Details</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {displayedBookings.map((booking,index) => (
                                <tr key={booking.id}>
                                                                        <td>{index+1}</td>

                                    <td>{booking.dateTime}</td>
                                    <td>{booking.fileNumber}</td>

                                    <td>{booking.customerName}</td>
                                    <td>{booking.phoneNumber}</td>
                                    <td>{booking.serviceType}</td>
                                    <td>{booking.vehicleNumber}</td>
                                    <td>{booking.comments}</td>
                                    {(role === 'admin' || staffRole === 'secondary admin') && (

<td>
    <button className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md 
                   hover:bg-blue-600 transition-all duration-300 ease-in-out">
        View More
    </button>
</td>
)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {pageSize !== 'All' && (
    <div className="flex flex-wrap items-center justify-between mt-6 space-x-2">
        {/* Previous Button */}
        <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg shadow-md transition-all duration-300 
                ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700 text-white'}
            `}
        >
            ⬅️ Prev
        </button>

        {/* Page Numbers - Show first, last & nearby pages */}
        <div className="flex space-x-2">
            {currentPage > 2 && (
                <button
                    onClick={() => setCurrentPage(1)}
                    className="px-3 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-all"
                >
                    1
                </button>
            )}

            {currentPage > 3 && <span className="px-2 py-1">...</span>}

            {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                    (page) =>
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                )
                .map((page) => (
                    <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-md transition-all 
                            ${currentPage === page ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shadow-lg' : 'bg-gray-200 hover:bg-gray-300'}
                        `}
                    >
                        {page}
                    </button>
                ))}

            {currentPage < totalPages - 2 && <span className="px-2 py-1">...</span>}

            {currentPage < totalPages - 1 && (
                <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-3 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-all"
                >
                    {totalPages}
                </button>
            )}
        </div>

        {/* Next Button */}
        <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg shadow-md transition-all duration-300 
                ${currentPage === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700 text-white'}
            `}
        >
            Next ➡️
        </button>

        {/* Page Size Dropdown */}
        <select
            value={pageSize}
            onChange={(e) => {
                const newSize = e.target.value === 'All' ? 'All' : parseInt(e.target.value, 10);
                setPageSize(newSize);
                setCurrentPage(1); // Reset to first page
            }}
            className="ml-4 p-2 border border-gray-300 rounded-lg shadow-sm transition-all hover:border-blue-500 focus:outline-none"
        >
            {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>{size}</option>
            ))}
        </select>
    </div>
)}



        </div>
    );
};

export default ApprovedBooking;
