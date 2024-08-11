import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const ApprovedBooking = () => {
    const [approvedBookings, setApprovedBookings] = useState([]);
    const [searchQuery, setSearchQuery] = useState(''); // State for search query
    const [currentPage, setCurrentPage] = useState(1); // State for current page
    const [pageSize, setPageSize] = useState(10); // State for page size
    const PAGE_SIZES = [10, 25, 'All'];

    useEffect(() => {
        const fetchApprovedBookings = async () => {
            try {
                const db = getFirestore();
                const approvedBookingsCollection = collection(db, 'approvedbookings');
                const querySnapshot = await getDocs(approvedBookingsCollection);
                const approvedBookingsData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setApprovedBookings(approvedBookingsData);
            } catch (error) {
                console.error('Error fetching approved bookings:', error);
            }
        };

        fetchApprovedBookings();
    }, []);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredBookings = approvedBookings.filter((booking) =>
        Object.values(booking).some(
            (value) =>
                value &&
                value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    const totalRecords = filteredBookings.length;
    const totalPages = pageSize === 'All' ? 1 : Math.ceil(totalRecords / pageSize);

    const displayedBookings = pageSize === 'All'
        ? filteredBookings
        : filteredBookings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
                                <th>Date & Time</th>
                                <th>Customer Name</th>
                                <th>Phone Number</th>
                                <th>Service Type</th>
                                <th>Vehicle Number</th>
                                <th>Comments</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedBookings.map((booking) => (
                                <tr key={booking.id}>
                                    <td>{booking.dateTime}</td>
                                    <td>{booking.customerName}</td>
                                    <td>{booking.phoneNumber}</td>
                                    <td>{booking.serviceType}</td>
                                    <td>{booking.vehicleNumber}</td>
                                    <td>{booking.comments}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {pageSize !== 'All' && (
                <div className="pagination-controls">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="pagination-button"
                    >
                        Previous
                    </button>
                    <span className="pagination-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="pagination-button"
                    >
                        Next
                    </button>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(e.target.value === 'All' ? 'All' : parseInt(e.target.value, 10));
                            setCurrentPage(1); // Reset to the first page
                        }}
                        className="pagination-size-select"
                    >
                        {PAGE_SIZES.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
};

export default ApprovedBooking;
