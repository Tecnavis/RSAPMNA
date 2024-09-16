import React, { useEffect, useState, ChangeEvent } from 'react';
import { getFirestore, collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';

// Define the shape of a booking record
interface Booking {
    id: string;
    dateTime: string;
    customerName: string;
    phoneNumber: string;
    serviceType: string;
    vehicleNumber: string;
    comments: string;
    status: string; // Added status to match your current logic
}

const ClosedBooking: React.FC = () => {
    const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const uid = sessionStorage.getItem('uid');

    useEffect(() => {
        const fetchCompletedBookings = async () => {
            try {
                const db = getFirestore();
                const q = query(collection(db, `user/${uid}/bookings`), where('status', '==', 'Order Completed'));
                const querySnapshot = await getDocs(q);
                const bookingsData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Booking[];
                console.log("bookingsData", bookingsData);
                setCompletedBookings(bookingsData);
            } catch (error) {
                console.error('Error fetching completed bookings:', error);
            }
        };

        fetchCompletedBookings();
    }, [uid]);

    const handleApprove = async (bookingId: string) => {
        try {
            const db = getFirestore();
            const bookingRef = doc(db, `user/${uid}/bookings`, bookingId);
            await updateDoc(bookingRef, {
                status: 'Approved',
            });

            // Update the state to reflect the changes immediately
            setCompletedBookings((prevBookings) =>
                prevBookings.map((booking) =>
                    booking.id === bookingId ? { ...booking, status: 'Approved' } : booking
                )
            );
        } catch (error) {
            console.error('Error updating booking status:', error);
        }
    };

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
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
                <div className="mt-4">
                    <div className="datatables">
                        {filteredBookings.length === 0 ? (
                            <p>No completed bookings found.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table-hover min-w-full border-collapse block md:table">
                                    <thead className="block md:table-header-group">
                                        <tr className="border border-gray-300 block md:table-row absolute -top-full md:top-auto -left-full md:left-auto md:relative">
                                            <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">
                                                Date & Time
                                            </th>
                                            <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">
                                                Customer Name
                                            </th>
                                            <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">
                                                Phone Number
                                            </th>
                                            <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">
                                                Service Type
                                            </th>
                                            <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">
                                                Vehicle Number
                                            </th>
                                            <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">
                                                Comments
                                            </th>
                                            <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="block md:table-row-group">
                                        {filteredBookings.map((booking) => (
                                            <tr key={booking.id} className="bg-white border border-gray-300 block md:table-row">
                                                <td className="p-2 text-sm block md:table-cell">
                                                    {booking.dateTime}
                                                </td>
                                                <td className="p-2 text-sm block md:table-cell">
                                                    {booking.customerName}
                                                </td>
                                                <td className="p-2 text-sm block md:table-cell">
                                                    {booking.phoneNumber}
                                                </td>
                                                <td className="p-2 text-sm block md:table-cell">
                                                    {booking.serviceType}
                                                </td>
                                                <td className="p-2 text-sm block md:table-cell">
                                                    {booking.vehicleNumber}
                                                </td>
                                                <td className="p-2 text-sm block md:table-cell">
                                                    {booking.comments}
                                                </td>
                                                <td className="p-2 text-sm block md:table-cell">
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
                                                        onClick={() => handleApprove(booking.id)}
                                                        disabled={booking.status === 'Approved'}
                                                    >
                                                        {booking.status === 'Approved' ? 'Approved' : 'Approve'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClosedBooking;
