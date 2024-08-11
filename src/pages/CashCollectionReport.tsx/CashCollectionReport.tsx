import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import Modal from 'react-modal';
import IconMenuInvoice from '../../components/Icon/Menu/IconMenuInvoice';
import { parse, format } from 'date-fns';

const CashCollectionReport = () => {
    const { id } = useParams();
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [driver, setDriver] = useState(null);
    const [editingBooking, setEditingBooking] = useState(null);
    const [editingAmount, setEditingAmount] = useState('');
    const [receivedAmount, setReceivedAmount] = useState('');
    const [password, setPassword] = useState('');
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [bookingToApprove, setBookingToApprove] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [monthlyTotals, setMonthlyTotals] = useState({ totalAmount: 0, totalReceived: 0, totalBalance: 0 });
    const [selectedBookings, setSelectedBookings] = useState([]);
    const [totalSelectedBalance, setTotalSelectedBalance] = useState(0);
    const [selectedYear, setSelectedYear] = useState('');

    const db = getFirestore();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDriver = async () => {
            try {
                const driverRef = doc(db, 'driver', id);
                const driverSnap = await getDoc(driverRef);
                if (driverSnap.exists()) {
                    setDriver(driverSnap.data());
                } else {
                    console.log('No such document!');
                }
            } catch (error) {
                console.error('Error fetching driver:', error);
            }
        };

        fetchDriver();
    }, [db, id]);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const bookingsRef = collection(db, 'bookings');
                const q = query(bookingsRef, where('selectedDriver', '==', id));
                const querySnapshot = await getDocs(q);
                const fetchedBookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setBookings(fetchedBookings);
                setFilteredBookings(fetchedBookings); // Initially set filtered bookings to all fetched bookings
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchBookings();
    }, [db, id]);

    useEffect(() => {
        filterBookingsByMonthAndYear();
    }, [selectedMonth, selectedYear, bookings]);
    

    useEffect(() => {
        calculateMonthlyTotals();
    }, [filteredBookings]);

    useEffect(() => {
        calculateTotalSelectedBalance();
    }, [selectedBookings, bookings]); // Update whenever selected bookings change

    const updateBookingAmount = async (bookingId, newAmount) => {
        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            await updateDoc(bookingRef, { amount: parseFloat(newAmount) });
            setBookings(prevBookings => prevBookings.map(booking => booking.id === bookingId ? { ...booking, amount: parseFloat(newAmount) } : booking));
            updateTotalBalance();
        } catch (error) {
            console.error('Error updating booking amount:', error);
        }
    };

    const handleEditClick = (booking) => {
        setEditingBooking(booking);
        setEditingAmount(booking.amount.toString());
        scrollToModal();
    };

    const handleSaveClick = async () => {
        try {
            await updateBookingAmount(editingBooking.id, editingAmount);
            setEditingBooking(null);
        } catch (error) {
            console.error('Error saving booking:', error);
        }
    };

    const handleInvoiceClick = (booking) => {
        const balance = calculateBalance(booking.amount, booking.receivedAmount || 0);
        navigate(`/users/driver/driverdetails/cashcollection/driverInvoice/${booking.id}`, {
            state: {
                amount: booking.amount,
                receivedAmount: booking.receivedAmount || 0,
                balance: balance
            }
        });
    };

    const handleAmountReceivedChange = async (bookingId, receivedAmount) => {
        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            await updateDoc(bookingRef, {
                receivedAmount: parseFloat(receivedAmount),
                balance: calculateBalance(bookings.find(booking => booking.id === bookingId).amount, receivedAmount)
            });
            setBookings(bookings.map(booking => booking.id === bookingId ? { ...booking, receivedAmount: parseFloat(receivedAmount) } : booking));
            updateTotalBalance();
        } catch (error) {
            console.error('Error updating received amount:', error);
        }
    };

    const calculateBalance = (amount, receivedAmount) => {
        return (parseFloat(amount) - parseFloat(receivedAmount)).toFixed(2);
    };

    const calculateNetTotalAmountInHand = () => {
        if (!driver || bookings.length === 0) {
            return 'Loading...';
        }

        const totalBalance = bookings.reduce((acc, booking) => {
            if (booking.amount === undefined || isNaN(booking.amount)) {
                return acc;
            }
            const balance = calculateBalance(booking.amount, booking.receivedAmount || 0);
            return acc + parseFloat(balance);
        }, 0);

        return (parseFloat(driver.advancePayment || 0) + totalBalance).toFixed(2);
    };

    const updateTotalBalance = async () => {
        try {
            const totalBalance = bookings.reduce((acc, booking) => {
                return acc + (parseFloat(booking.amount) - parseFloat(booking.receivedAmount || 0));
            }, 0);
            const driverRef = doc(db, 'driver', id);
            await updateDoc(driverRef, { totalBalance: totalBalance });
        } catch (error) {
            console.error('Error updating total balance:', error);
        }
    };

    const handleApproveClick = (booking) => {
        setBookingToApprove(booking);
        setModalIsOpen(true);
    };

    const handlePasswordSubmit = async () => {
        const correctPassword = 'Approve'; // Replace with your desired password
        if (password === correctPassword) {
            try {
                const bookingRef = doc(db, 'bookings', bookingToApprove.id);
                await updateDoc(bookingRef, { approved: true });
                setBookings(prevBookings => prevBookings.map(booking => booking.id === bookingToApprove.id ? { ...booking, approved: true, disabled: true }  : booking));
                setModalIsOpen(false);
                setPassword('');
            } catch (error) {
                console.error('Error approving booking:', error);
            }
        } else {
            alert('Incorrect password');
        }
    };

    const filterBookingsByMonthAndYear = () => {
        let filtered = bookings;
    
        if (selectedMonth) {
            const monthNumber = parseInt(selectedMonth, 10);
            if (!isNaN(monthNumber)) {
                filtered = filtered.filter(booking => {
                    const bookingDate = parse(booking.dateTime, 'dd/MM/yyyy, h:mm:ss a', new Date());
                    const bookingMonth = bookingDate.getMonth() + 1;
                    return bookingMonth === monthNumber;
                });
            }
        }
    
        if (selectedYear) {
            const yearNumber = parseInt(selectedYear, 10);
            if (!isNaN(yearNumber)) {
                filtered = filtered.filter(booking => {
                    const bookingDate = parse(booking.dateTime, 'dd/MM/yyyy, h:mm:ss a', new Date());
                    const bookingYear = bookingDate.getFullYear();
                    return bookingYear === yearNumber;
                });
            }
        }
    
        setFilteredBookings(filtered);
    };
    

    const calculateMonthlyTotals = () => {
        const totalAmount = filteredBookings.reduce((acc, booking) => acc + (parseFloat(booking.amount) || 0), 0);
        const totalReceived = filteredBookings.reduce((acc, booking) => acc + (parseFloat(booking.receivedAmount) || 0), 0);
        const totalBalance = filteredBookings.reduce((acc, booking) => acc + (parseFloat(booking.amount) - parseFloat(booking.receivedAmount || 0)), 0);

        setMonthlyTotals({
            totalAmount: totalAmount.toFixed(2),
            totalReceived: totalReceived.toFixed(2),
            totalBalance: totalBalance.toFixed(2),
        });
    };

    const calculateTotalSelectedBalance = () => {
        const totalBalance = selectedBookings.reduce((acc, bookingId) => {
            const booking = bookings.find(b => b.id === bookingId);
            if (booking) {
                return acc + parseFloat(calculateBalance(booking.amount, booking.receivedAmount || 0));
            }
            return acc;
        }, 0);
        setTotalSelectedBalance(totalBalance.toFixed(2));
    };

    const handleCheckboxChange = (bookingId) => {
        if (selectedBookings.includes(bookingId)) {
            setSelectedBookings(selectedBookings.filter(id => id !== bookingId));
        } else {
            setSelectedBookings([...selectedBookings, bookingId]);
        }
    };

    const scrollToModal = () => {
        const modal = document.querySelector('.modal-content');
        if (modal) {
            modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return (
        <div className="container mx-auto my-10 p-5 bg-gray-50 shadow-lg rounded-lg">
            <h1 className="text-3xl font-bold mb-5 text-center text-gray-800">Cash Collection Report</h1>
            {driver ? (
                <>
                    <div className="mb-5 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-700">Driver: {driver.driverName}</h2>
                            <p className="text-gray-600">Phone: {driver.personalphone}</p>
                            <p className="text-gray-600">Advance Payment: {driver.advancePayment}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-semibold text-gray-700">Net Total Amount in Hand: {calculateNetTotalAmountInHand()}</h2>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mb-5">
                        <div className="text-right">
                            <h3 className="text-xl font-semibold text-gray-700">Total Balance of Selected Bookings: {totalSelectedBalance}</h3>
                        </div>
                        <div className="flex justify-between items-center mb-5">
    <div className="space-x-2">
        <label htmlFor="month" className="text-gray-700 font-semibold">Filter by Month:</label>
        <select
            id="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1"
        >
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, index) => {
                const month = index + 1;
                return (
                    <option key={month} value={month.toString()}>
                        {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}
                    </option>
                );
            })}
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
                return (
                    <option key={year} value={year.toString()}>
                        {year}
                    </option>
                );
            })}
        </select>
    </div>
</div>
</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                        <div className="bg-white p-4 shadow rounded">
                            <h3 className="text-lg font-semibold text-gray-700">Total Amount</h3>
                            <p className="text-gray-600">{monthlyTotals.totalAmount}</p>
                        </div>
                        <div className="bg-white p-4 shadow rounded">
                            <h3 className="text-lg font-semibold text-gray-700">Total Received</h3>
                            <p className="text-gray-600">{monthlyTotals.totalReceived}</p>
                        </div>
                        <div className="bg-white p-4 shadow rounded">
                            <h3 className="text-lg font-semibold text-gray-700">Total Balance</h3>
                            <p className="text-gray-600">{monthlyTotals.totalBalance}</p>
                        </div>
                    </div>
                    <table className="min-w-full bg-white border border-gray-300">
    <thead>
        <tr>
            <th className="py-2 px-4 border-b">Select</th>
            <th className="py-2 px-4 border-b">Date</th>
            <th className="py-2 px-4 border-b">Amount</th>
            <th className="py-2 px-4 border-b">Received Amount</th>
            <th className="py-2 px-4 border-b">Balance</th>
            <th className="py-2 px-4 border-b">Actions</th>
        </tr>
    </thead>
    <tbody>
        {filteredBookings.map((booking) => (
            <tr 
                key={booking.id} 
                className={`${
                    booking.approved ? 'bg-gray-200 text-gray-500' : 'bg-white'
                }`}
            >
                <td className="py-2 px-4 border-b text-center">
                    <input
                        type="checkbox"
                        checked={selectedBookings.includes(booking.id)}
                        onChange={() => handleCheckboxChange(booking.id)}
                        disabled={booking.approved}
                    />
                </td>
                <td>{format(parse(booking.dateTime, 'dd/MM/yyyy, h:mm:ss a', new Date()), 'dd/MM/yyyy, h:mm:ss a')}</td>
                <td className="py-2 px-4 border-b">{booking.amount}</td>
                <td className="py-2 px-4 border-b">
                    <input
                        type="number"
                        value={booking.receivedAmount || ''}
                        onChange={(e) => handleAmountReceivedChange(booking.id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1"
                        disabled={booking.approved}
                    />
                </td>
                <td className="py-2 px-4 border-b">{calculateBalance(booking.amount, booking.receivedAmount || 0)}</td>
                <td className="py-2 px-4 border-b space-x-2">
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

                    {editingBooking && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
                            <div className="relative w-auto max-w-lg mx-auto my-6">
                                <div className="relative flex flex-col w-full bg-white shadow-lg rounded-lg outline-none focus:outline-none">
                                    <div className="flex items-start justify-between p-5 border-b border-solid rounded-t border-blueGray-200">
                                        <h3 className="text-lg font-semibold text-gray-800">Edit Booking Amount</h3>
                                        <button
                                            className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                                            onClick={() => setEditingBooking(null)}
                                        >
                                            <span className="text-black opacity-5">×</span>
                                        </button>
                                    </div>
                                    <div className="relative p-6 flex-auto">
                                        <input
                                            type="number"
                                            value={editingAmount}
                                            onChange={(e) => setEditingAmount(e.target.value)}
                                            className="border border-gray-300 rounded px-3 py-2 mt-2 mb-2 w-full"
                                            placeholder="Enter new amount"
                                        />
                                        <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                                            <button
                                                className="bg-green-500 text-white active:bg-green-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                                                type="button"
                                                onClick={handleSaveClick}
                                            >
                                                Save
                                            </button>
                                            <button
                                                className="bg-red-500 text-white active:bg-red-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                                                type="button"
                                                onClick={() => setEditingBooking(null)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <Modal
                        isOpen={modalIsOpen}
                        onRequestClose={() => setModalIsOpen(false)}
                        contentLabel="Approve Booking"
                    >
                        <h2>Approve Booking</h2>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password to approve"
                            className="border border-gray-300 rounded px-3 py-2 mt-2 mb-2 w-full"
                        />
                        <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                            <button
                                className="bg-green-500 text-white active:bg-green-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                                type="button"
                                onClick={handlePasswordSubmit}
                            >
                                Submit
                            </button>
                            <button
                                className="bg-red-500 text-white active:bg-red-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                                type="button"
                                onClick={() => setModalIsOpen(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </Modal>
                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default CashCollectionReport;