import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const InvoicedBooking = () => {
    const [completedBookings, setCompletedBookings] = useState([]);

    useEffect(() => {
        const fetchCompletedBookings = async () => {
            try {
                const db = getFirestore();
                const q = query(collection(db, 'bookings'), where('status', '==', 'Rejected'));
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

    return (
        <div className="panel mt-6">
            <h5 className="font-semibold text-lg dark:text-white-light mb-5">
                Invoiced Bookings
            </h5>
            <div className="datatables">
                {completedBookings.length === 0 ? (
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
                            </tr>
                        </thead>
                        <tbody>
                            {completedBookings.map((booking) => (
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
        </div>
    );
};

export default InvoicedBooking;
