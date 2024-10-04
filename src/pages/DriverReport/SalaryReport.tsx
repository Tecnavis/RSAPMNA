import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc, orderBy, onSnapshot } from 'firebase/firestore';
import IconEdit from '../../components/Icon/IconEdit'; // Import your IconEdit component here
import InvoiceModal from './InvoiceModal';
import { parse, format } from 'date-fns';
interface Booking {
    id: string;
    fileNumber: string;
    dateTime: string;
    serviceType: string;
    serviceVehicle: string;
    totalDriverSalary: number;
    transferedSalary?: number;
    balanceSalary: number;
    selectedDriver?: string;
    advance?: number; // New property
    advancePaymentDate?: string;
}

interface Driver {
    // Define driver fields based on your Firestore data structure
    [key: string]: any;
}
const SalaryReport: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const uid = sessionStorage.getItem('uid') || '';
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [driver, setDriver] = useState<Driver | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [totalSalaryAmount, setTotalSalaryAmount] = useState<number>(0);
    const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
    const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [showAdvanceDetails, setShowAdvanceDetails] = useState<boolean>(false);

    const [editFormData, setEditFormData] = useState({
        fileNumber: '',
        dateTime: '',
        serviceType: '',
        serviceVehicle: '',
        totalDriverSalary: 0,
        transferedSalary: 0,
        balanceSalary: 0,
        advance: 0, // New field
        advancePaymentDate: '',
    });
    const db = getFirestore();
    const navigate = useNavigate();
    const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
    const [selectAll, setSelectAll] = useState<boolean>(false); // State for "Select All" checkbox

    useEffect(() => {
        if (!id) {
            console.log('No ID found');
            return;
        }

        const driverRef = doc(db, `user/${uid}/driver`, id);

        // Listen for real-time updates
        const unsubscribe = onSnapshot(
            driverRef,
            (driverSnap) => {
                if (driverSnap.exists()) {
                    const driverData = driverSnap.data() as Driver;

                    setDriver({
                        ...driverData,
                        advance: driverData.advance || 0,
                        advancePaymentDate: driverData.advancePaymentDate || '',
                    });
                } else {
                    console.log('No such document!');
                }
            },
            (error) => {
                console.error('Error fetching driver:', error);
            }
        );

        // Clean up the listener on component unmount
        return () => unsubscribe();
    }, [db, id, uid]);

    // ------------------------------------------------
    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const bookingsRef = collection(db, `user/${uid}/bookings`);
                const q = query(bookingsRef, where('selectedDriver', '==', id), where('status', '==', 'Order Completed'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const fetchedBookings: Booking[] = querySnapshot.docs.map((doc) => {
                    const data = doc.data();
                    console.log('data', data);
                    const balanceSalary = data.totalDriverSalary - (data.transferedSalary || 0);
                    return {
                        id: doc.id,
                        fileNumber: data.fileNumber || '',
                        dateTime: data.dateTime || '',
                        serviceType: data.serviceType || '',
                        serviceVehicle: data.serviceVehicle || '',
                        totalDriverSalary: data.totalDriverSalary || 0,
                        transferedSalary: data.transferedSalary || 0,
                        balanceSalary,
                        selectedDriver: data.selectedDriver || '',
                        advance: data.advance || 0,
                        advancePaymentDate: data.advancePaymentDate || '',
                    };
                });
                setBookings(fetchedBookings);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchBookings();
    }, [db, id, uid]);

    useEffect(() => {
        if (selectedMonth || selectedYear) {
            const filtered = bookings.filter((booking) => {
                const bookingDate = parse(booking.dateTime, 'dd/MM/yyyy, h:mm:ss a', new Date());
                const bookingMonth = format(bookingDate, 'MMMM');
                const bookingYear = format(bookingDate, 'yyyy');

                const monthMatch = selectedMonth ? bookingMonth === selectedMonth : true;
                const yearMatch = selectedYear ? bookingYear === selectedYear : true;

                return monthMatch && yearMatch;
            });
            setFilteredBookings(filtered);
        } else {
            setFilteredBookings(bookings);
        }
    }, [bookings, selectedMonth, selectedYear]);

    useEffect(() => {
        if (selectAll) {
            setSelectedBookings(filteredBookings.map((booking) => booking.id));
        } else {
            setSelectedBookings([]);
        }
    }, [selectAll, filteredBookings]);

    const handleCheckboxChange = (bookingId: string) => {
        if (selectedBookings.includes(bookingId)) {
            setSelectedBookings(selectedBookings.filter((id) => id !== bookingId));
        } else {
            setSelectedBookings([...selectedBookings, bookingId]);
        }
    };
    const calculateSelectedTotalSalary = () => {
        return selectedBookings.reduce((acc, bookingId) => {
            const booking = bookings.find((b) => b.id === bookingId);
            if (booking) {
                return acc + booking.balanceSalary;
            }
            return acc;
        }, 0);
    };
    useEffect(() => {
        const total = filteredBookings.reduce((acc, booking) => acc + (booking.balanceSalary || 0), 0);
        console.log('totaltotal', total);
        setTotalSalaryAmount(total);

        if (id) {
            updateTotalSalaryInFirestore(id, total);
        }
    }, [filteredBookings]);

    // Function to update total salary in Firestore
    const updateTotalSalaryInFirestore = async (driverId: string, total: number) => {
        try {
            const driverRef = doc(db, `user/${uid}/driver`, driverId);
            await updateDoc(driverRef, { totalSalaryAmount: total });
            console.log('Total salary updated in Firestore:', total);
        } catch (error) {
            console.error('Error updating total salary in Firestore:', error);
        }
    };
    const handleEditBooking = (bookingId: any) => {
        const bookingToEdit = bookings.find((b) => b.id === bookingId);
        if (bookingToEdit) {
            setEditingBookingId(bookingId);
            setEditFormData({
                fileNumber: bookingToEdit.fileNumber,
                dateTime: bookingToEdit.dateTime,
                serviceType: bookingToEdit.serviceType,
                serviceVehicle: bookingToEdit.serviceVehicle,
                totalDriverSalary: bookingToEdit.totalDriverSalary,
                transferedSalary: bookingToEdit.transferedSalary || 0,
                balanceSalary: bookingToEdit.balanceSalary,
                advance: bookingToEdit.advance || 0, // Ensure it's initialized
                advancePaymentDate: bookingToEdit.advancePaymentDate || '', // Ensure it's initialized
            });
        }
    };

    const promptForTotalSalaryConfirmation = () => {
        const calculatedTotalSalary = calculateSelectedTotalSalary();
        const userEnteredTotal = prompt('Enter the calculated total salary:', String(calculatedTotalSalary));
        if (userEnteredTotal !== null) {
            const enteredValue = Number(userEnteredTotal);
            if (!isNaN(enteredValue) && enteredValue === calculatedTotalSalary) {
                return true;
            } else {
                alert('Entered value does not match the calculated total salary. Please try again.');
                return false;
            }
        }
        return false;
    };

    const handleConfirm = async () => {
        if (promptForTotalSalaryConfirmation()) {
            try {
                const updatePromises = selectedBookings.map(async (bookingId) => {
                    const bookingRef = doc(db, `user/${uid}/bookings`, bookingId);
                    const bookingSnapshot = await getDoc(bookingRef);

                    if (bookingSnapshot.exists()) {
                        const { totalDriverSalary } = bookingSnapshot.data();
                        const transferedSalary = totalDriverSalary;
                        const balanceSalary = 0;
                        const salaryApproved = true; // Set salaryApproved status to true

                        await updateDoc(bookingRef, {
                            transferedSalary,
                            balanceSalary,
                            salaryApproved, // Add this line to update the status
                        });

                        return { id: bookingSnapshot.id, ...bookingSnapshot.data(), transferedSalary, balanceSalary, salaryApproved };
                    } else {
                        console.log(`No booking found with ID: ${bookingId}`);
                        return null;
                    }
                });

                const updatedBookings = await Promise.all(updatePromises);
                const filteredBookings = updatedBookings.filter((booking) => booking !== null);

                // Update local state after successful updates
                setBookings((prevBookings) =>
                    prevBookings.map((booking) =>
                        filteredBookings.find((updatedBooking) => updatedBooking.id === booking.id)
                            ? { ...booking, transferedSalary: booking.totalDriverSalary, balanceSalary: 0, salaryApproved: true }
                            : booking
                    )
                );

                setSelectedBookings([]); // Clear selected bookings after confirmation

                alert('Salaries confirmed successfully.');
                setIsConfirmed(true);

                // Call handleGenerateInvoice to open the invoice modal with selected bookings
                handleGenerateInvoice();
            } catch (error) {
                console.error('Error confirming salaries:', error);
                alert('Error confirming salaries. Please try again.');
            }
        }
    };

    const handleGenerateInvoice = () => {
        setShowInvoiceModal(true);
    };
    const closeInvoiceModal = () => {
        setShowInvoiceModal(false);
    };

    const handleCancelEdit = () => {
        setEditingBookingId(null);
        setEditFormData({
            fileNumber: '',
            dateTime: '',
            serviceType: '',
            serviceVehicle: '',
            totalDriverSalary: 0,
            transferedSalary: 0,
            balanceSalary: 0,
            advance: 0, // Reset to 0
            advancePaymentDate: '',
        });
    };

    const handleSaveEdit = async () => {
        try {
            const { fileNumber, dateTime, serviceType, serviceVehicle, totalDriverSalary, transferedSalary, advance, advancePaymentDate } = editFormData;

            // Check if editingBookingId is null before proceeding
            if (!editingBookingId) {
                console.error('Editing booking ID is null');
                return; // Early exit if the ID is null
            }

            const bookingRef = doc(db, `user/${uid}/bookings`, editingBookingId);

            await updateDoc(bookingRef, {
                fileNumber,
                dateTime,
                serviceType,
                serviceVehicle,
                totalDriverSalary,
                transferedSalary,
                balanceSalary: totalDriverSalary - transferedSalary,
                advance, // Update advance payment
                advancePaymentDate, // Update advance payment date
            });

            // Update local state
            setBookings((prevBookings) =>
                prevBookings.map((booking) =>
                    booking.id === editingBookingId
                        ? {
                              ...booking,
                              fileNumber,
                              dateTime,
                              serviceType,
                              serviceVehicle,
                              totalDriverSalary,
                              transferedSalary,
                              balanceSalary: totalDriverSalary - transferedSalary,
                              advance,
                              advancePaymentDate,
                          }
                        : booking
                )
            );

            setEditingBookingId(null);
            setEditFormData({
                fileNumber: '',
                dateTime: '',
                serviceType: '',
                serviceVehicle: '',
                totalDriverSalary: 0,
                transferedSalary: 0,
                balanceSalary: 0,
                advance: 0,
                advancePaymentDate: '',
            });
        } catch (error) {
            console.error('Error saving edit:', error);
        }
    };
    const handleAdjustWithSalary = async () => {
        // Check if driver exists and advance is valid
        if (!driver || editFormData.advance <= 0 || !editFormData.advancePaymentDate) {
            alert('Please enter a valid advance payment and date.');
            return;
        }

        try {
            if (!uid || !id) {
                throw new Error('User ID or Driver ID is undefined');
            }
            const driverRef = doc(db, `user/${uid}/driver`, id);

            // Fetch the current advance amount from the driver document
            const driverSnap = await getDoc(driverRef);
            const currentAdvance = driverSnap.exists() ? driverSnap.data().advance || 0 : 0;

            console.log('Current advance:', currentAdvance);

            // Calculate the total salary amount
            const totalSalaryAmount = filteredBookings.reduce((acc, booking) => acc + (booking.balanceSalary || 0), 0);
            console.log('Total salary amount:', totalSalaryAmount);

            // If totalSalaryAmount is 0, sum the previous and newly entered advance
            if (totalSalaryAmount === 0) {
                const newAdvanceTotal = currentAdvance + editFormData.advance;

                // Update the driver document with the new summed advance
                await updateDoc(driverRef, {
                    advance: newAdvanceTotal,
                    advancePaymentDate: editFormData.advancePaymentDate, // Optionally update the payment date
                });

                console.log(`Advance updated to ${newAdvanceTotal}`);
            } else {
                // Proceed with the normal flow if total salary isn't 0
                let remainingAdvance = editFormData.advance; // Start with the total advance payment
                console.log('Advance to be updated:', remainingAdvance);

                // Clone the bookings and sort by earliest date
                const sortedBookings = [...filteredBookings].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

                const updatedBookings = [];

                for (let booking of sortedBookings) {
                    if (remainingAdvance <= 0) break; // Stop if all advance payment is used

                    const currentTransferredSalary = booking.transferedSalary || 0;
                    const maxTransferableAmount = booking.totalDriverSalary - currentTransferredSalary;
                    console.log('maxTransferableAmount', maxTransferableAmount);
                    console.log('currentTransferredSalary', currentTransferredSalary);

                    if (maxTransferableAmount > 0) {
                        // Calculate how much we can transfer for this booking
                        const transferAmount = Math.min(remainingAdvance, maxTransferableAmount);

                        const newTransferredSalary = currentTransferredSalary + transferAmount;
                        const newBalanceSalary = booking.totalDriverSalary - newTransferredSalary;

                        // Deduct the transfer amount from the remaining advance
                        remainingAdvance -= transferAmount;

                        // Update this booking locally
                        updatedBookings.push({
                            ...booking,
                            transferedSalary: newTransferredSalary,
                            balanceSalary: newBalanceSalary,
                        });

                        // Check if booking.id is defined before calling doc
                        if (booking.id) {
                            // Update this booking in Firestore
                            const bookingRef = doc(db, `user/${uid}/bookings`, booking.id);
                            await updateDoc(bookingRef, {
                                transferedSalary: newTransferredSalary,
                                balanceSalary: newBalanceSalary,
                            });
                        } else {
                            console.error('Booking ID is undefined for booking:', booking);
                        }
                    } else {
                        updatedBookings.push(booking); // No update needed, just push the current booking
                    }
                }

                // Update the remaining advance if any is left
                if (remainingAdvance !== editFormData.advance) {
                    console.log('remainingAdvance:', remainingAdvance);

                    // Check if id is defined before calling doc
                    if (id) {
                        await updateDoc(driverRef, {
                            advance: remainingAdvance,
                        });

                        console.log('Document updated with remainingAdvance:', remainingAdvance);
                    } else {
                        console.error('Driver ID is undefined');
                    }
                }

                // Update the local bookings state with the modified bookings
                setBookings(updatedBookings);
            }

            alert('Salary adjusted successfully.');
        } catch (error) {
            console.error('Error updating advance payment and salary adjustment:', error);
        }
    };
    return (
        <div className="container mx-auto my-10 p-5 bg-gray-50 shadow-lg rounded-lg sm:p-8 lg:p-10">
            {driver && (
                <h1 className="text-3xl font-bold mb-5 text-center text-gray-800">
                    Salary Report <span className="text-red-500">{driver.driverName}</span>
                </h1>
            )}
            <div className="flex flex-col items-center mb-4">
                <label htmlFor="monthSelect" className="text-lg font-semibold mb-1">
                    Select Month:
                </label>
                <select
                    id="monthSelect"
                    className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                >
                    <option value="">All</option>
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month) => (
                        <option key={month} value={month}>
                            {month}
                        </option>
                    ))}
                </select>
            </div>

            {/* Year Selection */}
            <div className="flex flex-col items-center mb-4">
                <label htmlFor="yearSelect" className="text-lg font-semibold mb-1">
                    Select Year:
                </label>
                <select
                    id="yearSelect"
                    className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                >
                    <option value="">All</option>
                    {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() - i; // Generate the last 10 years
                        return (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        );
                    })}
                </select>
            </div>

            {/* ------------------------------------------------- */}
            <div className="mb-4 flex flex-col items-center">
                <h2 className="text-xl font-bold mb-2">Add Advance Payment</h2>
                <div className="flex flex-col md:flex-row items-center">
                    <input
                        type="number"
                        placeholder="Advance Payment"
                        value={editFormData.advance}
                        onChange={(e) => setEditFormData({ ...editFormData, advance: Number(e.target.value) })}
                        className="border rounded p-2 mb-2 md:mb-0 md:mr-2 w-full md:w-auto"
                    />
                    <input
                        type="date"
                        placeholder="Advance Payment Date"
                        value={editFormData.advancePaymentDate}
                        onChange={(e) => setEditFormData({ ...editFormData, advancePaymentDate: e.target.value })}
                        className="border rounded p-2 mb-2 md:mb-0 w-full md:w-auto"
                    />
                </div>
            </div>

            <div className="mb-4 flex justify-center space-x-0 md:space-x-4 flex-col md:flex-row">
                <button onClick={handleAdjustWithSalary} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2 md:mb-0">
                    Advance Adjust with Salary
                </button>
                <button onClick={() => setShowAdvanceDetails(!showAdvanceDetails)} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                    {showAdvanceDetails ? 'Hide Advance Details' : 'Advance Details'}
                </button>
            </div>

            {driver && showAdvanceDetails && (
                <div className="bg-white shadow-md rounded-lg p-6 mt-4">
                    <h2 className="text-xl font-semibold mb-4">Advance Payment Details</h2>
                    <table className="min-w-full bg-gray-100 rounded-lg overflow-hidden">
                        <thead>
                            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                                <th className="py-3 px-4 text-left">Advance Amount</th>
                                <th className="py-3 px-4 text-left">Advance Payment Date</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                            <tr className="border-b border-gray-200 hover:bg-gray-100">
                                <td className="py-3 px-4">{driver.advance}</td>
                                <td className="py-3 px-4">{driver.advancePaymentDate || 'N/A'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {selectedBookings.length > 0 && (
                <div className="mt-5">
                    <h2 className="text-xl font-bold mb-3 text-center text-gray-800">Selected Bookings Total Salary</h2>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">File Number</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Total Salary Amount</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {selectedBookings.map((bookingId) => {
                                const booking = bookings.find((b) => b.id === bookingId);
                                if (!booking) {
                                    // Handle the case where booking is undefined, e.g., return null or a placeholder
                                    return null; // or return <tr><td colSpan={2}>Booking not found</td></tr>;
                                }
                                return (
                                    <tr key={booking.id}>
                                        <td className="border px-4 py-2">{booking.fileNumber}</td>
                                        <td className="border px-4 py-2">{booking.balanceSalary?.toFixed(2) || '0.00'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Total Salary Amount</th>
                                <td className="border px-4 py-2">{calculateSelectedTotalSalary()}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <div className="flex flex-col sm:flex-row justify-between mt-4">
                        <div className="text-lg font-bold mb-4 sm:mb-0">Total Salary: {totalSalaryAmount}</div>
                        <div>
                            <button
                                className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg mr-3 ${isConfirmed ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={handleConfirm}
                                disabled={isConfirmed}
                            >
                                Confirm
                            </button>
                            <button
                                className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg ${isConfirmed ? '' : 'opacity-50 cursor-not-allowed'}`}
                                onClick={handleGenerateInvoice}
                                disabled={!isConfirmed} // Disable until confirmed
                            >
                                Generate Invoice
                            </button>
                        </div>
                    </div>
                    {showInvoiceModal && (
                        <InvoiceModal
                            selectedBookings={selectedBookings}
                            bookings={bookings}
                            onClose={closeInvoiceModal}
                            onGenerateInvoice={() => {
                                console.log('Selected Bookings:', selectedBookings); // This will log the selectedBookings array
                                closeInvoiceModal();
                                navigate('/driverreport/salaryreport/driversalaryInvoice', { state: { selectedBookings } });
                            }}
                        />
                    )}
                </div>
            )}

            <div className="mt-5">
                <h2 className="text-xl font-bold mb-3 text-center text-gray-800">Driver Salary Details</h2>
                <div className="overflow-x-auto">
                    {' '}
                    {/* Added scrollable container */}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">File Number</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Date</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Service Type</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Service Vehicle Number</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Total Driver Salary</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Transferred Salary</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Balance Salary</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                                    Actions
                                    <span className="flex items-center">
                                        <input type="checkbox" checked={selectAll} onChange={(e) => setSelectAll(e.target.checked)} />
                                        <span className="ml-2">Select All</span>
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredBookings.map((booking) => (
                                <tr key={booking.id}>
                                    <td className="border px-4 py-2">{booking.fileNumber}</td>
                                    <td>{format(parse(booking.dateTime, 'dd/MM/yyyy, h:mm:ss a', new Date()), 'dd/MM/yyyy, h:mm:ss a')}</td>
                                    <td className="border px-4 py-2">{booking.serviceType}</td>
                                    <td className="border px-4 py-2">{booking.serviceVehicle}</td>
                                    <td className="border px-4 py-2">{booking.totalDriverSalary}</td>
                                    <td className="border px-4 py-2">
                                        {editingBookingId === booking.id ? (
                                            <input
                                                type="number"
                                                className="border px-2 py-1 rounded-md"
                                                value={editFormData.transferedSalary}
                                                onChange={(e) => setEditFormData({ ...editFormData, transferedSalary: Number(e.target.value) })}
                                            />
                                        ) : (
                                            booking.transferedSalary || 0
                                        )}
                                    </td>
                                    <td className="border px-4 py-2">{booking.balanceSalary}</td>
                                    <td className="border px-4 py-2">
                                        {editingBookingId === booking.id ? (
                                            <>
                                                <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-lg mr-2" onClick={handleSaveEdit}>
                                                    Save
                                                </button>
                                                <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-lg" onClick={handleCancelEdit}>
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex justify-center space-x-2">
                                                <button className="hover:text-blue-500 text-blue px-4 py-1 rounded-lg" onClick={() => handleEditBooking(booking.id)}>
                                                    <IconEdit />
                                                </button>
                                                <label className="inline-flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="form-checkbox h-5 w-5 text-blue-600"
                                                        checked={selectedBookings.includes(booking.id)}
                                                        onChange={() => handleCheckboxChange(booking.id)}
                                                    />
                                                </label>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-5 text-center">
                <label className="font-bold">Total Salary Amount:</label>
                <span className="ml-2">{totalSalaryAmount}</span>
            </div>
        </div>
    );
};

export default SalaryReport;
