import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import IconEdit from '../../components/Icon/IconEdit'; // Import your IconEdit component here
import InvoiceModal from './InvoiceModal';
import { parse, format } from 'date-fns';
const SalaryReport = () => {
    const { id } = useParams();
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [driver, setDriver] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [totalSalaryAmount, setTotalSalaryAmount] = useState(0); // State for total salary amount
    const [selectedBookings, setSelectedBookings] = useState([]); // State for selected bookings
    const [editingBookingId, setEditingBookingId] = useState(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false); // State to show/hide invoice modal
 const [selectedYear, setSelectedYear] = useState('');
    const [editFormData, setEditFormData] = useState({
        // State for edit form data
        fileNumber: '',
        dateTime: '',
        serviceType: '',
        serviceVehicle: '',
        totalDriverSalary: 0,
        transferedSalary: 0,
        balanceSalary: 0,
    });
    const db = getFirestore();
    const navigate = useNavigate();
    const [isConfirmed, setIsConfirmed] = useState(false);
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
                const fetchedBookings = querySnapshot.docs.map((doc) => {
                    const data = doc.data();
                    const balanceSalary = data.totalDriverSalary - (data.transferedSalary || 0);
                    return { id: doc.id, ...data, balanceSalary };
                });
                setBookings(fetchedBookings);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchBookings();
    }, [db, id]);

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
        const total = filteredBookings.reduce((acc, booking) => acc + (booking.balanceSalary || 0), 0);
        setTotalSalaryAmount(total);
    }, [filteredBookings]);

  

    const handleCheckboxChange = (bookingId) => {
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

    const handleEditBooking = (bookingId) => {
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
            });
        }
    };

    const promptForTotalSalaryConfirmation = () => {
        const calculatedTotalSalary = calculateSelectedTotalSalary();
        const userEnteredTotal = prompt('Enter the calculated total salary:');
        if (userEnteredTotal !== null) {
            const enteredValue = Number(userEnteredTotal);
            if (enteredValue === calculatedTotalSalary) {
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
                    const bookingRef = doc(db, 'bookings', bookingId);
                    const bookingSnapshot = await getDoc(bookingRef);
                    
                    if (bookingSnapshot.exists()) {
                        const { totalDriverSalary } = bookingSnapshot.data();
                        const transferedSalary = totalDriverSalary;
                        const balanceSalary = 0;
                        const salaryApproved = true; // Set salaryApproved status to true
    
                        await updateDoc(bookingRef, {
                            transferedSalary,
                            balanceSalary,
                            salaryApproved // Add this line to update the status
                        });
    
                        return { id: bookingSnapshot.id, ...bookingSnapshot.data(), transferedSalary, balanceSalary, salaryApproved };
                    } else {
                        console.log(`No booking found with ID: ${bookingId}`);
                        return null;
                    }
                });
    
                const updatedBookings = await Promise.all(updatePromises);
                const filteredBookings = updatedBookings.filter(booking => booking !== null);
    
                // Update local state after successful updates
                setBookings(prevBookings =>
                    prevBookings.map(booking =>
                        filteredBookings.find(updatedBooking => updatedBooking.id === booking.id) 
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
        });
    };

    const handleSaveEdit = async () => {
        try {
            const { fileNumber, dateTime, serviceType, serviceVehicle, totalDriverSalary, transferedSalary } = editFormData;
            const bookingRef = doc(db, 'bookings', editingBookingId);
            await updateDoc(bookingRef, {
                fileNumber,
                dateTime,
                serviceType,
                serviceVehicle,
                totalDriverSalary,
                transferedSalary,
                balanceSalary: totalDriverSalary - transferedSalary,
            });
            setBookings((prevBookings) =>
                prevBookings.map((booking) =>
                    booking.id === editingBookingId
                        ? { ...booking, fileNumber, dateTime, serviceType, serviceVehicle, totalDriverSalary, transferedSalary, balanceSalary: totalDriverSalary - transferedSalary }
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
            });
        } catch (error) {
            console.error('Error saving edit:', error);
        }
    };

    return (
      <div className="container mx-auto my-10 p-5 bg-gray-50 shadow-lg rounded-lg sm:p-8 lg:p-10">
    <h1 className="text-3xl font-bold mb-5 text-center text-gray-800">Salary Report</h1>
            {/* Month Selection */}
            <div className="mb-4 text-center">
            <label htmlFor="monthSelect" className="mr-2">Select Month:</label>
            <select id="monthSelect" className="border px-2 py-1 rounded-md" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                <option value="">All</option>
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(month => (
                    <option key={month} value={month}>{month}</option>
                ))}
            </select>
        </div>

        {/* Year Selection */}
        <div className="mb-4 text-center">
            <label htmlFor="yearSelect" className="mr-2">Select Year:</label>
            <select id="yearSelect" className="border px-2 py-1 rounded-md" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                <option value="">All</option>
                {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - i; // Generate the last 10 years
                    return (
                        <option key={year} value={year}>{year}</option>
                    );
                })}
            </select>
        </div>


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
                        return (
                            <tr key={booking.id}>
                                <td className="border px-4 py-2">{booking.fileNumber}</td>
                                <td className="border px-4 py-2">{booking.balanceSalary.toFixed(2)}</td>
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
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                        onClick={handleGenerateInvoice}
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
                        closeInvoiceModal();
                        navigate('/driverreport/salaryreport/driversalaryInvoice', { state: { selectedBookings } });
                    }}
                />
            )}
        </div>
    )}

    <div className="mt-5">
        <h2 className="text-xl font-bold mb-3 text-center text-gray-800">Driver Salary Details</h2>
        <table className="min-w-full divide-y divide-gray-200">
            <thead>
                <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">File Number</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Service Type</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Service Vehicle</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Total Driver Salary</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Transferred Salary</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Balance Salary</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Actions</th>
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
    <div className="mt-5 text-center">
        <label className="font-bold">Total Salary Amount:</label>
        <span className="ml-2">{totalSalaryAmount}</span>
    </div>
</div>

    );
};

export default SalaryReport;