import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';

interface Booking {
    id: string;
    showroomId: string;
    dateTime: string;
    amount: number;
    receivedAmountShowroom?: number;
    showroomAmount?: number;
    insuranceAmountBody: string;
    approved?: boolean;
    approveStatus?: string; // Add this line
    status: string;
    createdAt: Timestamp;
    fileNumber: string;
    balanceshowroom: number;
}

const ShowroomCashCollection: React.FC = () => {
    const { showroomId } = useParams<{ showroomId: string }>();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<number | 'All'>('All');
    const [selectedYear, setSelectedYear] = useState<number | 'All'>('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid') || '';
    const navigate = useNavigate();
    const [notification, setNotification] = useState<string | null>(null);
    const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());
    const location = useLocation();
    const { showroomName } = location.state || {}; // Destructure showroomName from state
console.log("showroomId",showroomId)
    // Log the showroomName to the console
    useEffect(() => {
        if (showroomName) {
            console.log('Showroom Name:', showroomName);
        } else {
            console.log('No showroom name found in state');
        }
    }, [showroomName]);
    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const q = query(collection(db, `user/${uid}/bookings`), where('showroomId', '==', showroomId));
                const querySnapshot = await getDocs(q);
                const bookingList = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Booking[];
                setBookings(bookingList);
                console.log("bookingList",bookingList)
                setFilteredBookings(bookingList); // Set filteredBookings initially to all bookings
            } catch (error) {
                console.error('Error fetching bookings: ', error);
                setError('Failed to load booking data.');
            } finally {
                setLoading(false);
            }
        };

        if (showroomId) {
            fetchBookings();
        }
    }, [db, showroomId, uid]);

    // Calculate total: Amount From Showroom + Insurance Amount
    const calculateTotal = (showroomAmount: number | undefined, insuranceAmountBody: string): number => {
        const insuranceAmount = parseFloat(insuranceAmountBody) || 0; // Convert to number, fallback to 0
        return (showroomAmount || 0) + insuranceAmount;
    };

    // Calculate balance: Total - Received Amount
    const calculateBalance = (total: number, receivedAmountShowroom: number | undefined): number => {
        return total - (receivedAmountShowroom || 0);
    };

    // Update Firestore when showroomAmount, receivedAmount, or balanceshowroom is changed
    const updateBookingInDB = async (id: string, updatedFields: Partial<Booking>) => {
        try {
            const bookingRef = doc(db, `user/${uid}/bookings`, id);
            await updateDoc(bookingRef, updatedFields);
        } catch (error) {
            console.error('Error updating document: ', error);
            setError('Failed to update booking.');
        }
    };

    const handleAmountChange = (id: string, field: string, value: string) => {
        const updatedBookings = bookings.map((booking) =>
            booking.id === id
                ? {
                      ...booking,
                      [field]: parseFloat(value),
                  }
                : booking
        );
        setBookings(updatedBookings);

        // Calculate the updated fields to save in Firestore
        const updatedBooking = updatedBookings.find((booking) => booking.id === id);
        if (updatedBooking) {
            const total = calculateTotal(updatedBooking.showroomAmount, updatedBooking.insuranceAmountBody);
            const balanceshowroom = calculateBalance(total, updatedBooking.receivedAmountShowroom);

            // Update Firestore with new values
            updateBookingInDB(id, {
                [field]: parseFloat(value),
                balanceshowroom,
            });
        }
    };
    const updateShowroomWholeBalance = async (wholeBalance: number) => {
        if (!uid || !showroomId) {
            console.error('UID or Showroom ID is undefined');
            return;
        }        try {
            const showroomRef = doc(db, `user/${uid}/showroom`, showroomId);
            await updateDoc(showroomRef, { wholeBalance });
            console.log('Successfully updated wholeBalance:', wholeBalance);
        } catch (error) {
            console.error('Error updating showroom wholeBalance: ', error);
        }
    };
    
    const handleApproveClick = async (booking: Booking) => {
        const total = calculateTotal(booking.showroomAmount, booking.insuranceAmountBody);
        const balanceshowroom = calculateBalance(total, booking.receivedAmountShowroom);

        if (balanceshowroom === 0) {
            // Prompt for password input
            const password = prompt('Please enter the password to approve the booking:');

            // Check if password matches "RSA@123"
            if (password === 'RSA@123') {
                const updatedBookings = bookings.map((b) => (b.id === booking.id ? { ...b, approved: true, approveStatus: 'Approved' } : b));
                setBookings(updatedBookings);

                // Update Firestore for approval
                await updateBookingInDB(booking.id, { approved: true, approveStatus: 'Approved' });
                setNotification(null); // Clear notification
            } else {
                setNotification('Incorrect password. Approval denied.');
            }
        } else {
            setNotification('Cannot approve booking: Balance is not zero');
        }
    };

    const handleGenerateInvoices = () => {
        // Collect selected bookings
        const selected = bookings.filter((booking) => selectedBookings.has(booking.id));

        // Navigate to the invoice generation page or handle the invoice generation here
        if (selected.length > 0) {
            navigate('/showroomcashcollection/selectiveInvoice', { state: { bookings: selected } });
        } else {
            setNotification('No bookings selected.');
        }
    };

    const formatDateTime = (dateTime: string | Timestamp | null) => {
        if (!dateTime) return 'N/A';
        if (dateTime instanceof Timestamp) {
            return dateTime.toDate().toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            });
        }
        const parsedDate = new Date(dateTime);
        if (isNaN(parsedDate.getTime())) {
            return 'Invalid Date';
        }
        return parsedDate.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    };

    // Handle month and year filtering
    useEffect(() => {
        const filtered = bookings.filter((booking) => {
            const date = booking.createdAt.toDate();
            const bookingMonth = date.getMonth() + 1; // Months are 0-based in JS
            const bookingYear = date.getFullYear();

            const monthMatch = selectedMonth === 'All' || bookingMonth === selectedMonth;
            const yearMatch = selectedYear === 'All' || bookingYear === selectedYear;

            return monthMatch && yearMatch;
        });

        setFilteredBookings(filtered);
    }, [selectedMonth, selectedYear, bookings]);
    const calculateMonthlyTotals = () => {
        let monthlyTotal = 0;
        let monthlyBalance = 0;
        filteredBookings.forEach((booking) => {
            const total = calculateTotal(booking.showroomAmount, booking.insuranceAmountBody);
            const balance = calculateBalance(total, booking.receivedAmountShowroom);
            monthlyTotal += total;
            monthlyBalance += balance;
        });
        return { monthlyTotal, monthlyBalance };
    };

    const calculateWholeTotals = () => {
        let wholeTotal = 0;
        let wholeBalance = 0;
        bookings.forEach((booking) => {
            const total = calculateTotal(booking.showroomAmount, booking.insuranceAmountBody);
            const balance = calculateBalance(total, booking.receivedAmountShowroom);
            wholeTotal += total;
            wholeBalance += balance;
        });
        updateShowroomWholeBalance(wholeBalance);

        return { wholeTotal, wholeBalance };
    };

    const { monthlyTotal, monthlyBalance } = calculateMonthlyTotals();
    const { wholeTotal, wholeBalance } = calculateWholeTotals();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }
    const sortedBookingsData = filteredBookings.slice().sort((a, b) => {
        const dateA = a.createdAt.toDate();
        const dateB = b.createdAt.toDate();
        return dateB.getTime() - dateA.getTime();
    });
    const handleCheckboxChange = (id: string) => {
        setSelectedBookings((prevSelected) => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
            return newSelected;
        });
    };
    const handleSelectAll = () => {
        if (selectedBookings.size === bookings.length) {
            // Deselect all
            setSelectedBookings(new Set());
        } else {
            // Select all
            const allIds = new Set(bookings.map((booking) => booking.id));
            setSelectedBookings(allIds);
        }
    };
    return (
        <div className="w-full px-6 py-8 bg-gray-80 rounded-lg shadow-lg">
           
            <h1 className="text-4xl font-extrabold mb-6 text-center text-gray-900 shadow-md p-3 rounded-lg bg-gradient-to-r from-indigo-300 to-red-300">Cash Collection Report <span className="text-red-500">{showroomName}</span></h1>

            {notification && <div className="mb-4 p-4 text-white bg-red-600 rounded-lg shadow-md">{notification}</div>}
            <div className="mb-6">
                <button className="px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 transition duration-300" onClick={handleGenerateInvoices}>
                    Generate Invoices
                </button>
            </div>

            {/* Month and Year Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center">
                    <label className="text-gray-700 font-medium mr-2">Month:</label>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="All">All</option>
                        {[...Array(12).keys()].map((month) => (
                            <option key={month + 1} value={month + 1}>
                                {new Date(0, month).toLocaleString('en-US', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center">
                    <label className="text-gray-700 font-medium mr-2">Year:</label>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="All">All</option>
                        {[...Array(10).keys()].map((year) => (
                            <option key={year + 2024} value={year + 2024}>
                                {year + 2024}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            {/* Conditionally render monthly totals only when a specific month is selected */}
            {selectedMonth !== 'All' && (
                <div className="mb-6 p-4 bg-white shadow-lg rounded-lg border border-gray-200">
                    <h3 className="text-2xl font-bold text-blue-600 mb-2">Monthly Totals</h3>
                    <div className="text-gray-700">
                        <p className="text-lg">
                            <span className="font-semibold">Monthly Total:</span> {monthlyTotal.toLocaleString()}
                        </p>
                        <p className="text-lg">
                            <span className="font-semibold">Balance Total:</span> {monthlyBalance.toLocaleString()}
                        </p>
                    </div>
                </div>
            )}

            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg rounded-lg border border-blue-200">
                <h3 className="text-2xl font-bold text-blue-600 mb-2">Whole Totals</h3>
                <div className="text-gray-700">
                    <p className="text-lg">
                        <span className="font-semibold">Total Amount From {showroomName}:</span> {wholeTotal.toLocaleString()}
                    </p>
                    <p className="text-lg">
                        <span className="font-semibold">Balance Amount:</span> {wholeBalance.toLocaleString()}
                    </p>
                </div>
            </div>

            {filteredBookings.length > 0 ? (
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <button
                            onClick={handleSelectAll}
                            className={`px-4 py-2 font-semibold text-white rounded-lg shadow-md transition-colors duration-300 ease-in-out
               ${selectedBookings.size === bookings.length ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                        >
                            {selectedBookings.size === bookings.length ? 'Deselect All' : 'Select All'}
                        </button>

                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FileNumber</th>

                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payable Amount From Showroom</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payable Insurance From Showroom</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (Payable Amount + Payable Insurance)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received Amount(from showroom)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance(from showroom)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedBookingsData.map((booking) => {
                            const total = calculateTotal(booking.showroomAmount, booking.insuranceAmountBody);
                            const balanceshowroom = calculateBalance(total, booking.receivedAmountShowroom);

                            return (
                                <tr key={booking.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedBookings.has(booking.id)}
                                            onChange={() => {
                                                const updatedSelection = new Set(selectedBookings);
                                                if (updatedSelection.has(booking.id)) {
                                                    updatedSelection.delete(booking.id);
                                                } else {
                                                    updatedSelection.add(booking.id);
                                                }
                                                setSelectedBookings(updatedSelection);
                                            }}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(booking.createdAt)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.fileNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <input
                                            type="number"
                                            value={booking.showroomAmount || ''}
                                            onChange={(e) => handleAmountChange(booking.id, 'showroomAmount', e.target.value)}
                                            className="border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            disabled={booking.approved}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.insuranceAmountBody}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{total}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <input
                                            type="number"
                                            value={booking.receivedAmountShowroom || ''}
                                            onChange={(e) => handleAmountChange(booking.id, 'receivedAmountShowroom', e.target.value)}
                                            className="border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            disabled={booking.approved}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{balanceshowroom}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.approveStatus || 'Not Approved'}</td> {/* Update here */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <button
                                            className={`px-2 py-1 rounded-md text-white ${booking.approved ? 'bg-green-500' : 'bg-red-500'}`}
                                            onClick={() => handleApproveClick(booking)}
                                            disabled={booking.approved}
                                        >
                                            {booking.approved ? 'Approved' : 'Approve'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                </div>

            ) : (
                <div>No bookings found.</div>
            )}
        </div>
    );
};

export default ShowroomCashCollection;
