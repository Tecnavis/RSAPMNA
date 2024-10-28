import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc, orderBy, writeBatch } from 'firebase/firestore';
import Modal from 'react-modal';
import { parse, format } from 'date-fns';
import styles from './cashCollectionReport.module.css';
import IconEdit from '../../components/Icon/IconEdit';
interface Driver {
    id?: string;
    driverName?: string;
    advance?: number;
    personalphone?: string;
}

interface Booking {
    id: string;
    amount: number; // Change to number
    receivedAmount?: number; // Keep as optional, type changed to number
    dateTime: string;
    fileNumber?: string;
    selectedDriver?: string;
    approved?: boolean;
    driver?: string;
    updatedTotalSalary?: number;
    disabled?: boolean;
    userName?: string;
    selectedCompany:string;

}

const CashCollectionReport: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const uid = sessionStorage.getItem('uid') || '';
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [driver, setDriver] = useState<Driver | null>(null);
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [editingAmount, setEditingAmount] = useState<string>('');
    const [receivedAmount, setReceivedAmount] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
    const [bookingToApprove, setBookingToApprove] = useState<Booking | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [monthlyTotals, setMonthlyTotals] = useState<{ totalAmount: string; totalReceived: string; totalBalances: string }>({ totalAmount: '0.00', totalReceived: '0.00', totalBalances: '0.00' });
    const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
    const [totalSelectedBalance, setTotalSelectedBalance] = useState<string>('0.00');
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectAll, setSelectAll] = useState<boolean>(false);
    const db = getFirestore();
    const navigate = useNavigate();
    const [showAmountDiv, setShowAmountDiv] = useState(true); // Add state to show/hide the div
    const [totalBalances, setTotalBalances] = useState(0);
    const [clickedButtons, setClickedButtons] = useState<Record<string, boolean>>({});

    const [netTotalAmountInHand, setNetTotalAmountInHand] = useState(0); // State to disable/enable fields
    const role = sessionStorage.getItem('role');
    const userName = sessionStorage.getItem('username');
    // --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    console.log('role', userName);
    useEffect(() => {
        const fetchDriver = async () => {
            if (!uid || !id) {
                console.error('UID or ID is undefined');
                return; // Exit early if uid or id is not defined
            }

            try {
                const driverRef = doc(db, `user/${uid}/driver`, id); // Ensure uid and id are defined
                const driverSnap = await getDoc(driverRef);
                if (driverSnap.exists()) {
                    setDriver(driverSnap.data() as Driver); // Assert type for driver
                } else {
                    console.log('No such document!');
                }
            } catch (error) {
                console.error('Error fetching driver:', error);
            }
        };

        fetchDriver();
    }, [db, id, uid]);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const bookingsRef = collection(db, `user/${uid}/bookings`);
                
                // Query bookings where selectedCompany is equal to id
                const companyQuery = query(
                    bookingsRef,
                    where('selectedCompany', '==', id),
                    where('status', '==', 'Order Completed'),
                    // orderBy('createdAt', 'desc')
                );
                const companySnapshot = await getDocs(companyQuery);
                const bookingsWithCompany = companySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Booking[];
    
                // Query bookings where selectedDriver is equal to id (fallback if selectedCompany does not exist)
                const driverQuery = query(
                    bookingsRef,
                    where('selectedDriver', '==', id),
                    where('status', '==', 'Order Completed'),
                    orderBy('createdAt', 'desc')
                );
                const driverSnapshot = await getDocs(driverQuery);
                const bookingsWithDriver = driverSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Booking[];
    
                // Combine both queries, filtering out duplicates if any
                const combinedBookings = [
                    ...bookingsWithCompany,
                    ...bookingsWithDriver.filter(booking => !booking.selectedCompany || booking.selectedCompany !== id),
                ];
    
                setBookings(combinedBookings);
                setFilteredBookings(combinedBookings); // Initially set filtered bookings to all fetched bookings
            } catch (error) {
                console.error('Error fetching bookings:', error);
            }
        };
    
        fetchBookings();
        updateTotalBalance();
    }, [db, id, uid]);
    

    useEffect(() => {
        filterBookingsByMonthAndYear();
    }, [selectedMonth, selectedYear, bookings]);

    useEffect(() => {
        calculateMonthlyTotals();
    }, [filteredBookings]);

    useEffect(() => {
        calculateTotalSelectedBalance();
    }, [selectedBookings, bookings]); // Update whenever selected bookings change
    const updateBookingAmount = async (bookingId: string, newAmount: string) => {
        const parsedAmount = parseFloat(newAmount); // Convert string to number
        if (isNaN(parsedAmount)) {
            console.error('Invalid amount:', newAmount);
            return; // Exit if the amount is invalid
        }
        try {
            const bookingRef = doc(db, `user/${uid}/bookings`, bookingId);
            await updateDoc(bookingRef, { amount: parsedAmount }); // Save as number
            setBookings((prevBookings) => prevBookings.map((booking) => (booking.id === bookingId ? { ...booking, amount: parsedAmount } : booking)));
            updateTotalBalance();
        } catch (error) {
            console.error('Error updating booking amount:', error);
        }
    };

    const handleEditClick = (booking: Booking) => {
        setEditingBooking(booking);
        setEditingAmount(booking.amount.toString());
        scrollToModal();
    };

    const handleSaveClick = async () => {
        if (editingBooking) {
            await updateBookingAmount(editingBooking.id, editingAmount);
            setEditingBooking(null);
        }
    };

   const calculateBalance = (amount: string | number, receivedAmount: string | number) => {
        return (parseFloat(amount.toString()) - parseFloat(receivedAmount.toString())).toFixed(2);
    };

    const calculateNetTotalAmountInHand = () => {
        if (!driver || bookings.length === 0) {
            console.log('Driver or bookings are not available yet.');
            return '0';
        }

        console.log('Driver advance:', driver.advance);
        console.log('Bookings:', bookings);

        const totalBalances = bookings.reduce((acc, booking) => {
            if (!booking.amount || isNaN(booking.amount)) {
                console.log(`Booking ID: ${booking.id}, Invalid amount:`, booking.amount);
                return acc;
            }

            const balance = calculateBalance(booking.amount.toString(), booking.receivedAmount || 0);
            console.log(`Booking IDV: ${booking.id}, Amount: ${booking.amount}, Received Amount: ${booking.receivedAmount}, Balance: ${balance}`);
            return acc + parseFloat(balance);
        }, 0);

        const netTotal = (parseFloat(driver.advance?.toString() || '0') + totalBalances).toFixed(2);
        console.log('Net Total Amount in Hand:', netTotal);
        return netTotal;
    };

    const updateTotalBalance = async () => {
        try {
            if (!uid || typeof uid !== 'string') {
                throw new Error('User ID (uid) is not defined or is not a string.');
            }
            if (!id || typeof id !== 'string') {
                throw new Error('Driver ID (id) is not defined or is not a string.');
            }

            // Ensure that bookings and driver are fully loaded
            if (!bookings || bookings.length === 0) {
                console.log('Bookings are not loaded yet.');
                return; // Exit early if bookings are not loaded
            }
            if (!driver) {
                console.log('Driver data is not loaded yet.');
                return; // Exit early if driver data is not loaded
            }

            const totalBalances = bookings.reduce((acc, booking) => {
                const amount = parseFloat(booking.amount?.toString() || '0');
                const receivedAmount = parseFloat(booking.receivedAmount?.toString() || '0');
                const newAcc = acc + (amount - receivedAmount);
                console.log(`Accumulated Total Balance So Far: ${newAcc}`);

                return newAcc;
            }, 0);

            console.log('Total Balanceee:', totalBalances);
            const calculatedNetTotalAmountInHand = calculateNetTotalAmountInHand();
            setTotalBalances(totalBalances);
            // const calculatedNetTotalAmountInHand = calculateNetTotalAmountInHand();
            setNetTotalAmountInHand(parseFloat(calculatedNetTotalAmountInHand));

            const driverRef = doc(db, `user/${uid}/driver`, id);
            console.log('Total Balanceee:', totalBalances);
            console.log('Total netTotalAmountInHand:', calculatedNetTotalAmountInHand);

            if (parseFloat(calculatedNetTotalAmountInHand) !== 0) {
                await updateDoc(driverRef, {
                    totalBalances: totalBalances,
                    netTotalAmountInHand: parseFloat(calculatedNetTotalAmountInHand),
                });
                console.log('Total balance and net total updated successfully:', calculatedNetTotalAmountInHand);
            } else {
                console.log('Net Total is zero, skipping update.');
            }
        } catch (error) {
            console.error('Error updating total balance:', error);
        }
    };

    const handleApproveClick = (booking: Booking) => {
        const balance = calculateBalance(booking.amount.toString(), booking.receivedAmount || 0);

        if (balance !== '0.00') {
            alert('Approval not allowed. The balance must be zero before approving.');
        } else {
            setBookingToApprove(booking);
            setModalIsOpen(true); // Open the modal to prompt for password
        }
    };

    const handlePasswordSubmit = async () => {
        const correctPassword = 'RSA@123'; // Replace with your desired password
        if (password === correctPassword) {
            try {
                const bookingRef = doc(db, `user/${uid}/bookings`, bookingToApprove!.id); // Use non-null assertion as we checked for null earlier
                await updateDoc(bookingRef, { approved: true });
                setBookings((prevBookings) => prevBookings.map((booking) => (booking.id === bookingToApprove!.id ? { ...booking, approved: true, disabled: true } : booking)));
                setModalIsOpen(false);
                setPassword('');
            } catch (error) {
                console.error('Error approving booking:', error);
            }
        } else {
            alert('Incorrect password. Please try again.');
        }
    };

    const filterBookingsByMonthAndYear = () => {
        let filtered: Booking[] = bookings;

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
        const totalAmount = filteredBookings.reduce((acc, booking) => {
            const amount = typeof booking.amount === 'number' ? booking.amount : parseFloat(booking.amount || '0');
            return acc + amount;
        }, 0);

        const totalReceived = filteredBookings.reduce((acc, booking) => {
            const receivedAmount = booking.receivedAmount ? (typeof booking.receivedAmount === 'number' ? booking.receivedAmount : parseFloat(booking.receivedAmount)) : 0;
            return acc + receivedAmount;
        }, 0);

        const totalBalances = filteredBookings.reduce((acc, booking) => {
            const amount = typeof booking.amount === 'number' ? booking.amount : parseFloat(booking.amount || '0');
            const receivedAmount = booking.receivedAmount ? (typeof booking.receivedAmount === 'number' ? booking.receivedAmount : parseFloat(booking.receivedAmount)) : 0;
            return acc + (amount - receivedAmount);
        }, 0);

        setMonthlyTotals({
            totalAmount: totalAmount.toFixed(2),
            totalReceived: totalReceived.toFixed(2),
            totalBalances: totalBalances.toFixed(2),
        });
    };

    const calculateTotalSelectedBalance = () => {
        const totalBalances = selectedBookings.reduce((acc, bookingId) => {
            const booking = bookings.find((b) => b.id === bookingId);
            if (booking) {
                return acc + parseFloat(calculateBalance(booking.amount, booking.receivedAmount || 0));
            }
            return acc;
        }, 0);
        setTotalSelectedBalance(totalBalances.toFixed(2));
    };
    const generateInvoice = () => {
        const selectedBookingDetails = selectedBookings
            .map((bookingId) => {
                const booking = bookings.find((b) => b.id === bookingId);

                if (!booking) {
                    // Handle the case where booking is undefined (e.g., skip it or throw an error)
                    return null; // or handle appropriately
                }

                return {
                    id: booking.id,
                    amount: booking.amount,
                    receivedAmount: booking.receivedAmount || 0,
                    balance: calculateBalance(booking.amount, booking.receivedAmount || 0),
                    dateTime: booking.dateTime,
                    fileNumber: booking.fileNumber,
                    driver: booking.driver,
                };
            })
            .filter((booking) => booking !== null); // Filter out any null values

        navigate('/users/driver/driverdetails/cashcollection/selectiveReportInvoice', {
            state: {
                driverName: driver?.driverName || '',
                bookings: selectedBookingDetails,
                totalBalances: totalSelectedBalance,
            },
        });
    };

    const handleCheckboxChange = (bookingId: any) => {
        const booking = bookings.find((b) => b.id === bookingId);
        if (booking && (booking.approved || booking.disabled)) {
            return; // Prevent selection of approved or disabled bookings.
        }

        if (selectedBookings.includes(bookingId)) {
            setSelectedBookings(selectedBookings.filter((id) => id !== bookingId));
        } else {
            setSelectedBookings([...selectedBookings, bookingId]);
        }
    };
    const handleSelectAllChange = () => {
        if (selectAll) {
            setSelectedBookings([]);
        } else {
            const allBookingIds = filteredBookings.filter((booking) => !booking.approved && !booking.disabled).map((booking) => booking.id);
            setSelectedBookings(allBookingIds);
        }
        setSelectAll(!selectAll);
    };
    const scrollToModal = () => {
        const modal = document.querySelector('.modal-content');
        if (modal) {
            modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };
    const distributeReceivedAmount = (receivedAmount: number, bookings: Booking[]) => {
        let remainingAmount = receivedAmount;
        const sortedBookings = [...bookings].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

        const updatedBookings = sortedBookings.map((booking) => {
            const bookingBalance = booking.amount - (booking.receivedAmount || 0); // Use booking.amount directly as it's already a number

            if (remainingAmount > 0) {
                const appliedAmount = Math.min(remainingAmount, bookingBalance);
                booking.receivedAmount = (booking.receivedAmount || 0) + appliedAmount;
                remainingAmount -= appliedAmount;
            }

            return booking;
        });

        return updatedBookings;
    };
    const handleAmountReceiveChange = async (receivedAmount: number) => {
        try {
            const updatedBookings = distributeReceivedAmount(receivedAmount, bookings);
            setBookings(updatedBookings); // Update state with new bookings

            // Now, update the Firestore with the new received amounts
            const batch = writeBatch(db);

            updatedBookings.forEach((booking) => {
                const bookingRef = doc(db, `user/${uid}/bookings`, booking.id);
                // const receivedAmt = typeof booking.receivedAmount === 'number' ? booking.receivedAmount : 0;

                batch.update(bookingRef, {
// receivedAmount: receivedAmt,
receivedAmount: booking.receivedAmount,

balance: String(calculateBalance(booking.amount, booking.receivedAmount || 0)), // Ensure it's stored as a string
role: role || 'unknown', // Add role to the update
                    userName: userName || 'unknown',
                });
            });

            await batch.commit();
            updateTotalBalance();
            setShowAmountDiv(false);
            window.location.reload();
        } catch (error) {
            console.error('Error distributing received amount:', error);
        }
    };

    return (
        <div className="container mx-auto my-10 p-5 bg-gray-50 shadow-lg rounded-lg">
            <h1 className="text-4xl font-extrabold mb-6 text-center text-gray-900 shadow-md p-3 rounded-lg bg-gradient-to-r from-indigo-300 to-red-300">Cash Collection Report</h1>

            {driver ? (
                <>
                    <div className="container-fluid mb-5">
                        <div className="flex flex-wrap text-center md:text-left">
                            <div className="w-full md:w-1/2 mb-4 p-6 bg-white shadow-lg rounded-lg transition-transform duration-300 hover:scale-105">
                                <h2 className="text-2xl font-bold text-gray-800 mb-2 border-b-2 border-gray-200 pb-2">
                                    🚗 Driver: <span className="text-indigo-600">{driver.driverName}</span>
                                </h2>
                                <div className="mt-4">
                                    <p className="text-lg text-gray-700">
                                        📞 <span className="font-medium">Phone:</span> {driver.personalphone}
                                    </p>
                                    <p className="text-lg text-gray-700 mt-2">
                                        💰 <span className="font-medium">Advance Payment:</span> {driver.advance}
                                    </p>
                                </div>
                            </div>

                            <div className="w-[560px] h-[165px] ml-6 flex justify-center md:justify-end p-2 bg-white rounded-lg shadow-lg transform transition-all duration-300 hover:shadow-xl hover:scale-105">
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                                    <span className="text-3xl mr-2">💵</span> {/* Larger icon for emphasis */}
                                    Net Total Amount in Hand:
                                    <span className="text-yellow-300 text-2xl ml-2 font-extrabold">{calculateNetTotalAmountInHand()}</span>
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div className="container-fluid mb-5">
                        <div className="flex flex-wrap justify-between items-center text-center md:text-left">
                            <div className="w-full md:w-auto flex flex-col md:flex-row items-center md:justify-end">
                                <div className="flex items-center mb-4 md:mb-0 space-x-2">
                                    <label htmlFor="month" className="text-gray-700 font-semibold text-lg">
                                        Filter by Month:
                                    </label>
                                    <select
                                        id="month"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 ease-in-out"
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

                                <div className="flex items-center space-x-2">
                                    <label htmlFor="year" className="text-gray-700 font-semibold text-lg">
                                        Filter by Year:
                                    </label>
                                    <select
                                        id="year"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 ease-in-out"
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-6 shadow-lg rounded-lg hover:shadow-xl transform hover:scale-105 transition-transform">
                            <div className="flex items-center space-x-4">
                                <div className="text-4xl text-blue-600">
                                    <i className="fas fa-dollar-sign"></i>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Overall Total Amount</h3>
                                    <p className="text-gray-700 text-lg">{monthlyTotals.totalAmount}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-100 to-green-200 p-6 shadow-lg rounded-lg hover:shadow-xl transform hover:scale-105 transition-transform">
                            <div className="flex items-center space-x-4">
                                <div className="text-4xl text-green-600">
                                    <i className="fas fa-receipt"></i>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Total Amount Received</h3>
                                    <p className="text-gray-700 text-lg">{monthlyTotals.totalReceived}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-red-100 to-red-200 p-6 shadow-lg rounded-lg hover:shadow-xl transform hover:scale-105 transition-transform">
                            <div className="flex items-center space-x-4">
                                <div className="text-4xl text-red-600">
                                    <i className="fas fa-hand-holding-usd"></i>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Balance Amount</h3>
                                    <p className="text-gray-700 text-lg">{monthlyTotals.totalBalances}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Balance Fixed Card */}
                    {selectedBookings.length > 0 && showAmountDiv && (
                        <div className="fixed top-40 left-1/2 transform -translate-x-1/2 bg-yellow-100 border-2 border-gray-300 shadow-lg rounded-lg p-6 z-10">
                            <div className="flex flex-col space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div className="text-4xl text-red-600">
                                        <i className="fas fa-hand-holding-usd"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-red-600">Total Balance: {totalSelectedBalance}</h3>
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    <h3 className="text-xl font-semibold text-red-600">Amount Received On {new Date().toLocaleDateString()}:</h3>
                                    <input
                                        type="number"
                                        value={receivedAmount}
                                        onChange={(e) => setReceivedAmount(e.target.value)}
                                        placeholder="Enter Amount"
                                        className="border border-gray-300 rounded-lg p-2 mt-2"
                                    />
                                    <button onClick={() => handleAmountReceiveChange(parseFloat(receivedAmount))} className="mt-2 bg-blue-500 text-white rounded-lg px-4 py-2">
                                        Apply Amount
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={generateInvoice}
                        disabled={selectedBookings.length === 0}
                        className={`px-6 py-2 font-semibold rounded-md text-white transition duration-300 ease-in-out 
        ${selectedBookings.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50'}`}
                    >
                        Generate Invoice
                    </button>

                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead className={styles.tableHead}>
                                <tr>
                                    <th className={styles.tableCell}>
                                        <div className={styles.selectAllContainer}>
                                            <label>Select All</label>

                                            <input type="checkbox" checked={selectAll} onChange={handleSelectAllChange} />
                                        </div>
                                    </th>
                                    <th className={styles.tableCell}>Date</th>
                                    <th className={styles.tableCell}>PayableAmount By Customer</th>

                                    <th className={styles.tableCell}>Amount Received From The Customer</th>
                                    {/* <th className={styles.tableCell}>Received Amount From Driver</th> */}
                                    <th className={styles.tableCell}>Balance</th>
                                    {role !== 'staff' && (

                                    <th className={styles.tableCell}>Edit</th>
                                    )}
                                    <th className={styles.tableCell}>Approve</th>
                                </tr>
                            </thead>
                            <tbody className={styles.tableBody}>
                                {filteredBookings.map((booking) => (
                                    <tr key={booking.id} className={`${styles.tableRow} ${booking.approved ? 'bg-gray-200 text-gray-500' : 'bg-white'}`}>
                                        <td className={`${styles.tableCell} text-center`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedBookings.includes(booking.id)}
                                                onChange={() => handleCheckboxChange(booking.id)}
                                                disabled={booking.approved} // Optionally disable checkbox visually
                                            />
                                        </td>
                                        <td className={styles.responsiveCell}>{format(parse(booking.dateTime, 'dd/MM/yyyy, h:mm:ss a', new Date()), 'dd/MM/yyyy, h:mm:ss a')}</td>
                                        <td className={styles.responsiveCell}>{booking.updatedTotalSalary}</td>

                                        <td className={styles.responsiveCell}>{booking.amount}</td>
                                        

                                        <td
                                            className={styles.responsiveCell}
                                            style={{
                                                backgroundColor:
                                                    Number(calculateBalance(booking.amount, booking.receivedAmount || 0)) === 0
                                                        ? '#e6ffe6' // Light green for zero balance
                                                        : '#ffe6e6', // Light red for non-zero balance
                                            }}
                                        >
                                            {calculateBalance(booking.amount, booking.receivedAmount || 0)}
                                        </td>
                                        {role !== 'staff' && (
  <td className={styles.responsiveCell}>
    <button
      onClick={() => handleEditClick(booking)}
      className={`text-blue-500 hover:text-blue-700 ${booking.approved ? 'cursor-not-allowed opacity-50' : ''}`}
      disabled={booking.approved}
    >
      <IconEdit />
    </button>
  </td>
)}

                                      
                                        <td>
                                            <button
                                                onClick={() => handleApproveClick(booking)}
                                                className={`${booking.approved ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'} hover:${booking.approved ? 'bg-green-300' : 'bg-red-300'} ${
                                                    booking.approved ? 'cursor-not-allowed' : 'cursor-pointer'
                                                } px-4 py-2 rounded`}
                                                disabled={booking.approved}
                                            >
                                                {booking.approved ? 'Approved' : 'Approve'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td className={styles.tableCell}></td>
                                    <td className={styles.tableCell}></td>
                                    <td className={styles.tableCell}></td>
                                    <td className={styles.tableCell} style={{ color: 'blue', fontSize: '18px' }}>
                                        Totals{' '}
                                    </td>
                                    <td className={styles.tableCell} style={{ color: 'blue', fontSize: '18px' }}>
                                        {/* Ensure calculateBalance returns a valid number */}
                                        {Number(filteredBookings.reduce((total, booking) => total + parseFloat(calculateBalance(booking.amount, booking.receivedAmount || 0)), 0)).toFixed(2)}
                                    </td>

                                    <td className={styles.tableCell}></td>
                                    <td className={styles.tableCell}></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {editingBooking && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
                            <div className="relative w-auto max-w-lg mx-auto my-6">
                                <div className="relative flex flex-col w-full bg-white shadow-lg rounded-lg outline-none focus:outline-none">
                                    <div className="flex items-start justify-between p-5 border-b border-solid rounded-t border-blueGray-200">
                                        <h3 className="text-lg font-semibold text-gray-800">Edit Booking Amount</h3>
                                        {/* <button
                                            className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                                            onClick={() => setEditingBooking(null)}
                                        >
                                            <span className="text-black opacity-5">×</span>
                                        </button> */}
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
                        style={{
                            content: {
                                width: '300px', // Set the width of the modal
                                height: '200px', // Set the height of the modal
                                margin: 'auto', // Center the modal
                                padding: '20px', // Reduce padding for a smaller modal
                                borderRadius: '10px', // Add border radius for rounded corners
                            },
                        }}
                    >
                        <h2 className="text-lg font-semibold mb-4">Approve Booking</h2>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password to approve"
                            className="border border-gray-300 rounded px-3 py-2 w-full"
                        />
                        <div className="flex items-center justify-end mt-4">
                            <button
                                className="bg-green-500 text-white active:bg-green-600 font-bold uppercase text-sm px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-2 ease-linear transition-all duration-150"
                                type="button"
                                onClick={handlePasswordSubmit}
                            >
                                Submit
                            </button>
                            <button
                                className="bg-red-500 text-white active:bg-red-600 font-bold uppercase text-sm px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150"
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
// ----------------------------------------------------------------------------------------
