import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, getFirestore, collection, getDocs, updateDoc } from 'firebase/firestore';

interface Staff {
    name: string;
    phone_number: string;
}

interface StaffReceived {
    id?: string;
    amount: number;
    date: string;
    amountGiven?: number;
    selectedBookingIds?: string[];
    fileNumber?: string; // Added optional property
    driver?: string | string[];
    bookings?: Booking[];  // Ensure this field is typed as an array of bookings
}

interface Booking {
    fileNumber: string;
    driver: string;
    updatedTotalSalary: number;
}

const StaffDetailsReport = () => {
    const [staff, setStaff] = useState<Staff | null>(null);
    const [staffReceivedEntries, setStaffReceivedEntries] = useState<StaffReceived[]>([]);
    const [amountGivenValues, setAmountGivenValues] = useState<{ [key: number]: number }>({});
    const [buttonColors, setButtonColors] = useState<{ [key: number]: string }>({});
    const [bookings, setBookings] = useState<Booking[]>([]);

    const [filteredEntries, setFilteredEntries] = useState<StaffReceived[]>([]);
    const { id } = useParams<{ id: string }>();
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid') || '';
    const role = sessionStorage.getItem('role');
const navigate = useNavigate()
    useEffect(() => {
        const fetchStaffDetails = async () => {
            if (!uid || !id) return;

            try {
                const docRef = doc(db, `user/${uid}/users`, id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setStaff(docSnap.data() as Staff);
                } else {
                    setStaff(null);
                }
            } catch (error) {
                console.error("Error fetching staff details: ", error);
            }
        };

        fetchStaffDetails();
    }, [id, uid]);

    useEffect(() => {
        const fetchStaffReceivedEntries = async () => {
            if (!uid || !id) return;
    
            try {
                const staffReceivedQuery = collection(db, `user/${uid}/users/${id}/staffReceived`);
                const querySnapshot = await getDocs(staffReceivedQuery);
    
                const fetchedEntries = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    amount: Number(doc.data().amount),
                } as StaffReceived));
    
                // Fetch bookings data for selectedBookingIds (handling multiple IDs)
                const bookingsPromises = fetchedEntries
                    .filter(entry => entry.selectedBookingIds && entry.selectedBookingIds.length > 0)
                    .map(async (entry) => {
                        const bookings = await Promise.all(
                            entry.selectedBookingIds!.map(async (bookingId) => {
                                const bookingDoc = doc(db, `user/${uid}/bookings`, bookingId);
                                const bookingSnap = await getDoc(bookingDoc);
                                return bookingSnap.exists() ? bookingSnap.data() : null;
                            })
                        );
    
                        return { ...entry, bookings: bookings.filter(Boolean) }; // Merge bookings
                    });
    
                const combinedEntries = (await Promise.all(bookingsPromises)) as (StaffReceived & { bookings: Booking[] })[];
    
                // Sort entries by date in descending order
                const sortedEntries = combinedEntries.sort((a, b) => {
                    const dateA = a.date ? new Date(a.date).getTime() : 0;
                    const dateB = b.date ? new Date(b.date).getTime() : 0;
                    return dateB - dateA;
                });
    
                setStaffReceivedEntries(sortedEntries);
                setFilteredEntries(sortedEntries);
    
                const initialColors = sortedEntries.map(entry => {
                    const amountGiven = entry.amountGiven || 0;
                    return amountGiven <= 0 ? 'red' : amountGiven < entry.amount ? 'orange' : 'green';
                });
                setButtonColors(initialColors);
            } catch (error) {
                console.error("Error fetching staff received entries: ", error);
            }
        };
    
        fetchStaffReceivedEntries();
    }, [uid, id]);
    
    
    const handleAmountGivenChange = (index: number, value: number) => {
        setAmountGivenValues((prev) => ({
            ...prev,
            [index]: value,
        }));
    };

    const calculateBalance = (amount: number | string, amountGiven: number = 0) => 
        Number(amount) - amountGiven;
    
    const handleSaveAmountGiven = async (index: number) => {
        const entry = staffReceivedEntries[index];
        const newAmountGiven = amountGivenValues[index];

        if (entry && entry.id) {
            try {
                const docRef = doc(db, `user/${uid}/users/${id}/staffReceived`, entry.id);
                await updateDoc(docRef, { amountGiven: newAmountGiven });
                console.log("Amount given updated successfully");

                const newColor = newAmountGiven < entry.amount ? 'orange' : 'green';
                setButtonColors((prev) => ({
                    ...prev,
                    [index]: newColor,
                }));

                setStaffReceivedEntries((prevEntries) =>
                    prevEntries.map((e, i) =>
                        i === index ? { ...e, amountGiven: newAmountGiven } : e
                    )
                );
            } catch (error) {
                console.error("Error updating amount given: ", error);
            }
        }
    };

    // Function to filter entries based on payment status
    const filterEntries = (status: string) => {
        let filtered;
        if (status === 'notPaid') {
            filtered = staffReceivedEntries.filter(entry => !(entry.amountGiven || 0));
        } else if (status === 'paymentNotCompleted') {
            filtered = staffReceivedEntries.filter(entry => (entry.amountGiven || 0) < entry.amount);
        } else if (status === 'paymentCompleted') {
            filtered = staffReceivedEntries.filter(entry => (entry.amountGiven || 0) >= entry.amount);
        } else {
            filtered = staffReceivedEntries; // Show all if no status is matched
        }
        setFilteredEntries(filtered);
    };
    const handleInvoiceClick = (entry: StaffReceived) => {
        navigate('/rsastaffReport/userdetails/satffinvoice', {
            state: {
                staff,
                entries: staffReceivedEntries, // Pass the relevant entries to the invoice
            },
        });
    };
    
    return (
        <div className="container mx-auto my-10 p-5 bg-gray-50 shadow-lg rounded-lg">
            <h1 className="text-4xl font-extrabold mb-6 text-center text-gray-900 shadow-md p-3 rounded-lg bg-gradient-to-r from-indigo-300 to-red-300">
                Staff Details Report
            </h1>

            {staff ? (
                <>
                    <div className="container-fluid mb-5">
                        <div className="flex flex-wrap text-center md:text-left">
                            <div className="w-full md:w-1/2 mb-4 p-6 bg-white shadow-lg rounded-lg">
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                    👤 Staff: <span className="text-indigo-600">{staff.name}</span>
                                </h2>
                                <p className="text-lg text-gray-700">
                                    📞 <span className="font-medium">Phone:</span> {staff.phone_number}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Buttons for filtering payment status */}
                    <div className="mb-4 flex justify-center space-x-4">
                        <button
                            onClick={() => filterEntries('notPaid')}
                            className="bg-red-500 text-white font-bold py-2 px-4 rounded"
                        >
                            Not Paid
                        </button>
                        <button
                            onClick={() => filterEntries('paymentNotCompleted')}
                            className="bg-orange-500 text-white font-bold py-2 px-4 rounded"
                        >
                            Payment Not Completed
                        </button>
                        <button
                            onClick={() => filterEntries('paymentCompleted')}
                            className="bg-green-500 text-white font-bold py-2 px-4 rounded"
                        >
                            Payment Completed
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white shadow-md rounded-lg">
                            <thead>
                                <tr>
                                <th className="px-6 py-3 border-b-2 border-gray-300">SI</th>

                                    <th className="px-6 py-3 border-b-2 border-gray-300">Date</th>
                                    <th className="px-6 py-3 border-b-2 border-gray-300">FileNumber</th>
                                    <th className="px-6 py-3 border-b-2 border-gray-300">Driver Name</th>

                                    <th className="px-6 py-3 border-b-2 border-gray-300">Staff Received Amount</th>
                                    {role !== 'staff' && (
                                        <th className="px-6 py-3 border-b-2 border-gray-300">Amount Given From Staff</th>
                                    )}
                                    <th className="px-6 py-3 border-b-2 border-gray-300">Balance</th>
                                    {role !== 'staff' && (
                                        <th className="px-6 py-3 border-b-2 border-gray-300">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntries.map((entry, index) => (
                                    <tr key={index}>
                                        <td>{index+1}</td>
                                        <td className="px-6 py-4 border-b">
    {format(new Date(entry.date), 'dd-MM-yyyy hh:mm a')}
</td>


                                        <td className="px-6 py-4 border-b">
    {entry.bookings?.map((booking, idx) => (
        <div key={idx}>{booking.fileNumber}</div> // Displaying booking details
    ))}
</td>
<td className="px-6 py-4 border-b">
    {entry.bookings?.map((booking, idx) => (
        <div key={idx}>{booking.driver}</div> // Displaying booking details
    ))}
</td>
          
            <td className="px-6 py-4 border-b">
    {(Number(entry.amount) || 0).toFixed(2)}
</td>


                                        {role !== 'staff' && (
                                            <td className="px-6 py-4 border-b">
                                                <input
                                                    type="text"
                                                    value={amountGivenValues[index] || entry.amountGiven || 0}
                                                    onChange={(e) => handleAmountGivenChange(index, Number(e.target.value) || 0 )}
                                                    placeholder="Enter Amount"
                                                    className="border border-gray-300 rounded-lg p-2"
                                                />
                                            </td>
                                        )}
                                        <td className="px-6 py-4 border-b">
                                            {calculateBalance(entry.amount, amountGivenValues[index] || entry.amountGiven || 0).toFixed(2)}
                                        </td>
                                        {role !== 'staff' && (
                                            <td className="px-6 py-4 border-b">
                                                <button
                                                    onClick={() => handleSaveAmountGiven(index)}
                                                    style={{
                                                        backgroundColor: buttonColors[index] || 'red', // Fallback to red
                                                    }}
                                                    className="text-white font-bold py-2 px-4 rounded"
                                                >
                                                    Save
                                                </button>
                                                <br />
                                                <button
    onClick={() => handleInvoiceClick(entry)} // Add the invoice click handler
    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition duration-200 ease-in-out shadow-lg transform hover:scale-105 mt-2"
>
    Invoice
</button>

                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <p className="text-center text-red-500">No staff details found.</p>
            )}
        </div>
    );
};

export default StaffDetailsReport;
