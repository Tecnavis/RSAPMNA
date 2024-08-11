import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore';

const ClosedBooking = () => {
    const [completedBookings, setCompletedBookings] = useState([]);
    const [searchQuery, setSearchQuery] = useState(''); // State for search query

    useEffect(() => {
        const fetchCompletedBookings = async () => {
            try {
                const db = getFirestore();
                const q = query(collection(db, 'bookings'), where('status', '==', 'Order Completed'));
                const querySnapshot = await getDocs(q);
                const bookingsData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setCompletedBookings(bookingsData);
            } catch (error) {
                console.error('Error fetching completed bookings:', error);
            }
        };

        fetchCompletedBookings();
    }, []);

    const moveBookingToApproved = async (bookingId, bookingData) => {
        try {
            const db = getFirestore();
            const approvedBookingRef = doc(db, 'approvedbookings', bookingId);
            await setDoc(approvedBookingRef, bookingData);
            const bookingRef = doc(db, 'bookings', bookingId);
            await deleteDoc(bookingRef);
        } catch (error) {
            console.error('Error moving booking to approved:', error);
        }
    };

    const handleApprove = (bookingId, bookingData) => {
        // Handle approval logic here
        console.log('Booking approved:', bookingId);
        moveBookingToApproved(bookingId, bookingData);
        // Remove the approved booking from completedBookings
        setCompletedBookings((prevBookings) =>
            prevBookings.filter((booking) => booking.id !== bookingId)
        );
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredBookings = completedBookings.filter((booking) =>
        Object.values(booking).some(
            (value) =>
                value &&
                value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    return (
        <div className="panel mt-6">
            <h5 className="font-semibold text-lg dark:text-white-light mb-5">
                Closed Bookings
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
                {filteredBookings.length === 0 ? (
                    <p>No completed bookings found.</p>
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
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.map((booking) => (
                                <tr key={booking.id}>
                                    <td>{booking.dateTime}</td>
                                    <td>{booking.customerName}</td>
                                    <td>{booking.phoneNumber}</td>
                                    <td>{booking.serviceType}</td>
                                    <td>{booking.vehicleNumber}</td>
                                    <td>{booking.comments}</td>
                                    <td>
                                        <button
                                            style={{
                                                backgroundColor: '#007bff',
                                                color: '#fff',
                                                border: '1px solid #007bff',
                                                padding: '8px 16px',
                                                fontSize: '16px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.3s, color 0.3s, border-color 0.3s',
                                            }}
                                            onClick={() => handleApprove(booking.id, booking)}
                                        >
                                            Approve
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ClosedBooking;
