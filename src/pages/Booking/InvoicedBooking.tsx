import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

// Define the shape of booking data
interface Booking {
    id: string;
    dateTime: string;
    customerName: string;
    phoneNumber: string;
    serviceType: string;
    vehicleNumber: string;
    comments: string;
}

const InvoicedBooking: React.FC = () => {
    const [completedBookings, setCompletedBookings] = useState<Booking[]>([]); // Properly type the state
    const uid = sessionStorage.getItem('uid'); // sessionStorage can return null

    useEffect(() => {
        const fetchCompletedBookings = async () => {
            try {
                if (!uid) {
                    console.error('User ID is not available in session storage.');
                    return;
                }

                const db = getFirestore();
                const bookingsQuery = query(
                    collection(db, `user/${uid}/bookings`),
                    where('status', '==', 'Rejected')
                );
                const querySnapshot = await getDocs(bookingsQuery);
                const bookingsData: Booking[] = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...(doc.data() as Omit<Booking, 'id'>), // Cast Firestore data to Booking type
                }));
                setCompletedBookings(bookingsData);
            } catch (error) {
                console.error('Error fetching completed bookings:', error);
            }
        };

        fetchCompletedBookings();
    }, [uid]);

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
