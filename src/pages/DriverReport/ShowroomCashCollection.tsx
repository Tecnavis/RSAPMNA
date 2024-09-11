// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

// interface Booking {
//     id: string;
//     showroomId: string;
//     dateTime: string; // Ensure this matches the Firestore date field
//     amount: number;
//     receivedAmount?: number;
//     updatedTotalSalary?: number;
//     approved?: boolean;
//     status: string;
// }

// const ShowroomCashCollection: React.FC = () => {
//     const { showroomId } = useParams<{ showroomId: string }>();
//     const [bookings, setBookings] = useState<Booking[]>([]);
//     const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const db = getFirestore();
//     const uid = sessionStorage.getItem('uid') || '';

//     useEffect(() => {
//         const fetchBookings = async () => {
//             try {
//                 const q = query(collection(db, `user/${uid}/bookings`), where('showroomId', '==', showroomId));
//                 const querySnapshot = await getDocs(q);
//                 const bookingList = querySnapshot.docs.map((doc) => ({
//                     id: doc.id,
//                     ...doc.data(),
//                 })) as Booking[];
//                 console.log("bookingList", bookingList);
//                 setBookings(bookingList);
//             } catch (error) {
//                 console.error('Error fetching bookings: ', error);
//                 setError('Failed to load booking data.');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         if (showroomId) {
//             fetchBookings();
//         }
//     }, [db, showroomId, uid]);

//     const handleCheckboxChange = (id: string) => {
//         setSelectedBookings((prev) =>
//             prev.includes(id) ? prev.filter((bookingId) => bookingId !== id) : [...prev, id]
//         );
//     };

//     const handleAmountReceivedChange = (id: string, value: string) => {
//         const updatedBookings = bookings.map((booking) =>
//             booking.id === id ? { ...booking, receivedAmount: Number(value) } : booking
//         );
//         setBookings(updatedBookings);
//     };

//     const calculateBalance = (amount: number, receivedAmount: number) => {
//         return Number(amount - receivedAmount).toFixed(2);
//     };

//     const handleEditClick = (booking: Booking) => {
//         // Handle edit click logic
//     };

//     const handleInvoiceClick = (booking: Booking) => {
//         // Handle invoice click logic
//     };

//     const handleApproveClick = (booking: Booking) => {
//         // Handle approve logic, e.g., mark as approved in the database
//         const updatedBookings = bookings.map((b) =>
//             b.id === booking.id ? { ...b, approved: true } : b
//         );
//         setBookings(updatedBookings);
//     };

//     if (loading) {
//         return <div>Loading...</div>;
//     }

//     if (error) {
//         return <div>Error: {error}</div>;
//     }

//     return (
//         <div className="container mx-auto px-4 py-6">
//             <h2 className="text-2xl font-semibold mb-6">Cash Collection Report <span>{bookings.ShowRoom}</span></h2>
//             {bookings.length > 0 ? (
//                 <table className="min-w-full bg-white border border-gray-300">
//                     <thead>
//                         <tr className="bg-gray-100">
//                             <th className="py-2 px-4 border">Select</th>
//                             <th className="py-2 px-4 border">Date</th>
//                             <th className="py-2 px-4 border">Payable Amount By Customer</th>
//                             <th className="py-2 px-4 border">Amount Received From The Customer</th>
//                             <th className="py-2 px-4 border">Received Amount From Driver</th>
//                             <th className="py-2 px-4 border">Balance</th>
//                             <th className="py-2 px-4 border">Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {bookings.map((booking) => (
//                             <tr key={booking.id} className="hover:bg-gray-50">
//                                 <td className="text-center">
//                                     <input
//                                         type="checkbox"
//                                         checked={selectedBookings.includes(booking.id)}
//                                         onChange={() => handleCheckboxChange(booking.id)}
//                                         disabled={booking.approved}
//                                     />
//                                 </td>
//                                 <td className="border px-4 py-2">
//                                     {new Date(booking.dateTime).toLocaleDateString()}
//                                 </td>
//                                 <td className="border px-4 py-2">
//                                     ₹ {Number(booking.updatedTotalSalary).toFixed(2)}
//                                 </td>
//                                 <td className="border px-4 py-2">
//                                     ₹ {booking.amount}
//                                 </td>                                <td className="border px-4 py-2">
//                                     <input
//                                         type="number"
//                                         value={booking.receivedAmount || ''}
//                                         onChange={(e) => handleAmountReceivedChange(booking.id, e.target.value)}
//                                         style={{
//                                             border: '1px solid #d1d5db',
//                                             borderRadius: '0.25rem',
//                                             padding: '0.25rem 0.5rem',
//                                         }}
//                                         disabled={booking.approved}
//                                     />
//                                 </td>
                               
//                                 <td className="border px-4 py-2">
//                                     ₹ {calculateBalance(booking.amount, booking.receivedAmount || 0)}
//                                 </td>
//                                 <td className="border px-4 py-2">
//                                     <button
//                                         onClick={() => handleEditClick(booking)}
//                                         className={`text-blue-500 hover:text-blue-700 ${booking.approved ? 'cursor-not-allowed opacity-50' : ''}`}
//                                         disabled={booking.approved}
//                                     >
//                                         Edit
//                                     </button>
//                                     <button
//                                         onClick={() => handleInvoiceClick(booking)}
//                                         className={`text-green-500 hover:text-green-700 ${booking.approved ? 'cursor-not-allowed opacity-50' : ''}`}
//                                         disabled={booking.approved}
//                                     >
//                                         Invoice
//                                     </button>
//                                     <button
//                                         onClick={() => handleApproveClick(booking)}
//                                         className={`text-${booking.approved ? 'green-500' : 'red-500'} hover:text-${booking.approved ? 'green-700' : 'red-700'} ${booking.approved ? 'cursor-not-allowed' : ''}`}
//                                         disabled={booking.approved}
//                                     >
//                                         {booking.approved ? 'Approved' : 'Approve'}
//                                     </button>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             ) : (
//                 <div className="text-center mt-4">No bookings found for this showroom.</div>
//             )}
//         </div>
//     );
// };

// export default ShowroomCashCollection;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { parse } from 'date-fns';

interface Booking {
    id: string;
    showroomId: string;
    dateTime: string; // Ensure this matches the Firestore date field
    amount: number;
    receivedAmount?: number;
    updatedTotalSalary?: number;
    approved?: boolean;
    status: string;
}

const ShowroomCashCollection: React.FC = () => {
    const { showroomId } = useParams<{ showroomId: string }>();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
    const [monthlyTotals, setMonthlyTotals] = useState({ totalAmount: '0', totalReceived: '0', totalBalance: '0' });
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalSelectedBalance, setTotalSelectedBalance] = useState('0');
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid') || '';
    const navigate = useNavigate();
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [editingAmount, setEditingAmount] = useState<string>('');

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

    useEffect(() => {
        filterBookingsByMonthAndYear();
    }, [selectedMonth, selectedYear, bookings]);

    useEffect(() => {
        calculateMonthlyTotals();
    }, [filteredBookings]);

    const filterBookingsByMonthAndYear = () => {
        let filtered = bookings;

        if (selectedMonth) {
            const monthNumber = parseInt(selectedMonth, 10);
            if (!isNaN(monthNumber)) {
                filtered = filtered.filter((booking) => {
                    const bookingDate = parse(booking.dateTime, 'dd/MM/yyyy, h:mm:ss a', new Date());
                    const bookingMonth = bookingDate.getMonth() + 1;
                    return bookingMonth === monthNumber;
                });
            }
        }

        if (selectedYear) {
            const yearNumber = parseInt(selectedYear, 10);
            if (!isNaN(yearNumber)) {
                filtered = filtered.filter((booking) => {
                    const bookingDate = parse(booking.dateTime, 'dd/MM/yyyy, h:mm:ss a', new Date());
                    const bookingYear = bookingDate.getFullYear();
                    return bookingYear === yearNumber;
                });
            }
        }

        setFilteredBookings(filtered);
    };

    const calculateMonthlyTotals = () => {
        // Ensure amounts are numbers
        const totalAmount = filteredBookings.reduce((acc, booking) => {
            const amount = Number(booking.amount) || 0;
            return acc + amount;
        }, 0);
    
        const totalReceived = filteredBookings.reduce((acc, booking) => {
            const receivedAmount = Number(booking.receivedAmount) || 0;
            return acc + receivedAmount;
        }, 0);
    
        const totalBalance = filteredBookings.reduce((acc, booking) => {
            const amount = Number(booking.amount) || 0;
            const receivedAmount = Number(booking.receivedAmount) || 0;
            return acc + (amount - receivedAmount);
        }, 0);
    
        // Debug logs
        console.log('Total Amount:', totalAmount);
        console.log('Total Received:', totalReceived);
        console.log('Total Balance:', totalBalance);
    
        setMonthlyTotals({
            totalAmount: totalAmount.toFixed(2),
            totalReceived: totalReceived.toFixed(2),
            totalBalance: totalBalance.toFixed(2),
        });
    };
    
    

    const calculateBalance = (amount: number, receivedAmount: number) => {
        return Number(amount - receivedAmount).toFixed(2);
    };

    const handleEditClick = (booking: Booking) => {
        setEditingBooking(booking);
        setEditingAmount(booking.amount.toString());
    };

    const handleSaveClick = async () => {
        try {
            // Update booking amount logic
            setEditingBooking(null);
        } catch (error) {
            console.error('Error saving booking:', error);
        }
    };

    const handleInvoiceClick = (booking: Booking) => {
        const balance = calculateBalance(booking.amount, booking.receivedAmount || 0);
        navigate(`/users/driver/driverdetails/cashcollection/driverInvoice/${booking.id}`, {
            state: {
                amount: booking.amount,
                receivedAmount: booking.receivedAmount || 0,
                balance,
            },
        });
    };

    const handleCheckboxChange = (id: string) => {
        setSelectedBookings((prev) =>
            prev.includes(id) ? prev.filter((bookingId) => bookingId !== id) : [...prev, id]
        );
    };

    const handleAmountReceivedChange = (id: string, value: string) => {
        const updatedBookings = bookings.map((booking) =>
            booking.id === id ? { ...booking, receivedAmount: Number(value) } : booking
        );
        setBookings(updatedBookings);
    };

    const calculateTotalSelectedBalance = () => {
        const totalBalance = selectedBookings.reduce((acc, bookingId) => {
            const booking = bookings.find((b) => b.id === bookingId);
            return booking ? acc + parseFloat(calculateBalance(booking.amount, booking.receivedAmount || 0)) : acc;
        }, 0);
        setTotalSelectedBalance(totalBalance.toFixed(2));
    };

    const handleApproveClick = (booking: Booking) => {
        const updatedBookings = bookings.map((b) =>
            b.id === booking.id ? { ...b, approved: true } : b
        );
        setBookings(updatedBookings);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <h2 className="text-2xl font-semibold mb-6">Cash Collection Report</h2>

            <div className="w-full md:w-1/2 flex justify-center md:justify-end">
                <h2 className="text-2xl font-semibold text-gray-700">Net Total Amount in Hand: {monthlyTotals.totalAmount}</h2>
            </div>

            <div className="container-fluid mb-5">
                <div className="flex flex-wrap justify-between items-center text-center md:text-left">
                    <div className="w-full md:w-auto mb-4 md:mb-0">
                        <h3 className="text-xl font-semibold text-gray-700">
                            Total Balance of Selected Bookings: {totalSelectedBalance}
                        </h3>
                    </div>
                    <div className="w-full md:w-auto flex flex-col md:flex-row items-center md:justify-end">
                        <div className="space-x-2 mb-4 md:mb-0">
                            <label htmlFor="month" className="text-gray-700 font-semibold">Filter by Month:</label>
                            <select
                                id="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1"
                            >
                                <option value="">All Months</option>
                                {Array.from({ length: 12 }, (_, index) => (
                                    <option key={index} value={(index + 1).toString()}>
                                        {new Date(0, index).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-x-2">
                            <label htmlFor="year" className="text-gray-700 font-semibold">Filter by Year:</label>
                            <select
                                id="year"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1"
                            >
                                <option value="">All Years</option>
                                {Array.from({ length: 5 }, (_, index) => {
                                    const year = new Date().getFullYear() - index;
                                    return <option key={year} value={year.toString()}>{year}</option>;
                                })}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

           
                     <div className="container mx-auto px-4 py-6">
             {filteredBookings.length > 0 ? (
                <table className="min-w-full bg-white border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="py-2 px-4 border">Select</th>
                            <th className="py-2 px-4 border">Date</th>
                            <th className="py-2 px-4 border">Payable Amount By Customer</th>
                            <th className="py-2 px-4 border">Amount Received From The Customer</th>
                            <th className="py-2 px-4 border">Received Amount From Driver</th>
                            <th className="py-2 px-4 border">Balance</th>
                            <th className="py-2 px-4 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50">
                                <td className="text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedBookings.includes(booking.id)}
                                        onChange={() => handleCheckboxChange(booking.id)}
                                        disabled={booking.approved}
                                    />
                                </td>
                                <td className="border px-4 py-2">
                                    {new Date(booking.dateTime).toLocaleDateString()}
                                </td>
                                <td className="border px-4 py-2">
                                    ₹ {Number(booking.updatedTotalSalary).toFixed(2)}
                                </td>
                                <td className="border px-4 py-2">
                                    ₹ {booking.amount}
                                </td>                                <td className="border px-4 py-2">
                                    <input
                                        type="number"
                                        value={booking.receivedAmount || ''}
                                        onChange={(e) => handleAmountReceivedChange(booking.id, e.target.value)}
                                        style={{
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.25rem',
                                            padding: '0.25rem 0.5rem',
                                        }}
                                        disabled={booking.approved}
                                    />
                                </td>
                               
                                <td className="border px-4 py-2">
                                    ₹ {calculateBalance(booking.amount, booking.receivedAmount || 0)}
                                </td>
                                <td className="border px-4 py-2">
                                    <button
                                        onClick={() => handleEditClick(booking)}
                                        className={`text-blue-500 hover:text-blue-700 ${booking.approved ? 'cursor-not-allowed opacity-50' : ''}`}
                                        disabled={booking.approved}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleInvoiceClick(booking)}
                                        className={`text-green-500 hover:text-green-700 ${booking.approved ? 'cursor-not-allowed opacity-50' : ''}`}
                                        disabled={booking.approved}
                                    >
                                        Invoice
                                    </button>
                                    <button
                                        onClick={() => handleApproveClick(booking)}
                                        className={`text-${booking.approved ? 'green-500' : 'red-500'} hover:text-${booking.approved ? 'green-700' : 'red-700'} ${booking.approved ? 'cursor-not-allowed' : ''}`}
                                        disabled={booking.approved}
                                    >
                                        {booking.approved ? 'Approved' : 'Approve'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="text-center mt-4">No bookings found for this showroom.</div>
            )}
        </div>
        </div>
    );
};

export default ShowroomCashCollection;
