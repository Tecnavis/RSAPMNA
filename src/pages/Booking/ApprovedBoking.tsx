import React, { useEffect, useState, ChangeEvent } from 'react';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

// Define the shape of a booking record
interface Booking {
    id: string;
    dateTime: string;
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

    useEffect(() => {
        const fetchApprovedBookings = async () => {
            try {
                const db = getFirestore();
                // Query to fetch bookings where status is 'Approved'
                const q = query(collection(db, `user/${uid}/bookings`), where('feedback', '==', true), where('bookingChecked', '==', true), where('accountingStaffVerified', '==', true));
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
                            const newSize = e.target.value === 'All' ? 'All' : parseInt(e.target.value, 10);
                            setPageSize(newSize);
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
