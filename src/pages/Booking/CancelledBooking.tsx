import React, { useEffect, useState } from 'react';
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
    status: string; // Include status if you need it
}

const CancelledBooking: React.FC = () => {
    const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
    const uid = sessionStorage.getItem('uid');

    useEffect(() => {
        const fetchCompletedBookings = async () => {
            if (!uid) {
                console.error('UID is not available');
                return;
            }

            try {
                const db = getFirestore();
                const q = query(collection(db, `user/${uid}/bookings`), where('status', '==', 'Cancelled'));
                const querySnapshot = await getDocs(q);
                const bookingsData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Booking[];
                setCompletedBookings(bookingsData);
            } catch (error) {
                console.error('Error fetching completed bookings:', error);
            }
        };

        fetchCompletedBookings();
    }, [uid]); // Include `uid` in the dependency array

    return (
        <div className="panel mt-6">
            <h5 className="font-semibold text-lg dark:text-white-light mb-5">
                Canceled Bookings
            </h5>
            <div className="datatables">
                {completedBookings.length === 0 ? (
                    <p>No canceled bookings found.</p>
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

export default CancelledBooking;
