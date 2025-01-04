import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc, orderBy, onSnapshot, addDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import InvoiceModal from './InvoiceModal';
import { parse, format } from 'date-fns';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import SalaryDetailsTable from './SalaryDetailsTable';
import ConfirmationModal from './ConfirmationModal';
import ConfirmationModal1 from './ConfirmationModal1';
import IconPrinter from '../../components/Icon/IconPrinter';
import './Print.css'
interface Booking {
    id: string;
    fileNumber: string;
    dateTime: string;
    serviceType: string;
    vehicleNumber: string;
    totalDriverSalary: any;
    transferedSalary?: number;
    balanceSalary: number;
    selectedDriver?: string;
    advance?: number; // New property
    advancePaymentDate?: string;
    totalDriverDistance: string;
    status: string;
    bookingChecked: boolean;
    // createdAt:Timestamp;
    createdAt: Date | null;
}
interface SalaryDetail {
    id: string;
    [key: string]: any; // Adjust this based on the actual fields in the salary document
}
interface AdvanceRecord {
    advance: number;
    advancePaymentDate: string;
}

interface BookingSalary {
    bookingId: string;
    details: SalaryDetail[];
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
    const [adjustedBookingIds, setAdjustedBookingIds] = useState<string[]>([]);
    const [adjustedFileNumbers, setAdjustedFileNumbers] = useState<string[]>([]);
    const [totalCalculatedUpdatedTotalSalary, setTotalCalculatedUpdatedTotalSalary] = useState(0);
    const [salaryReports, setSalaryReports] = useState<BookingSalary[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalOpen1, setIsModalOpen1] = useState(false); // State to control modal visibility
    const printRef = useRef<HTMLDivElement>(null);
    const [showAdvanceTable, setShowAdvanceTable] = useState<boolean>(false);

    // ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    const [editFormData, setEditFormData] = useState({
        fileNumber: '',
        dateTime: '',
        serviceType: '',
        vehicleNumber: '',
        totalDriverDistance: '',
        totalDriverSalary: 0,
        transferedSalary: 0,
        balanceSalary: 0,
        advance: 0, // New field
        advancePaymentDate: '',
    });
    const db = getFirestore();
    const navigate = useNavigate();
    const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
    const [selectAll, setSelectAll] = useState<boolean>(false); 
    const [advances, setAdvances] = useState<AdvanceRecord[]>([]); // Explicitly typed
  

    const saveSalaryDetails = async (bookingId: string, initialAdvance: number, transferAmount: number, fileNumbers: string[]) => {
        const salaryDetailsRef = collection(db, `user/${uid}/driver/${id}/salaryAdjustments`);
        await addDoc(salaryDetailsRef, {
            bookingId,
            initialAdvance,
            transferAmount,
            fileNumbers,
            timestamp: serverTimestamp(),
        });
        console.log('Salary adjustment details saved.');
    };

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
                        advance: parseFloat((driverData.advance || 0).toFixed(2)),
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
                const querySnapshot = await getDocs(bookingsRef);

                const allBookings: Booking[] = querySnapshot.docs.map((doc) => {
                    const data = doc.data();
                    const balanceSalary = data.totalDriverSalary - (data.transferedSalary || 0);
                    return {
                        id: doc.id,
                        fileNumber: data.fileNumber || '',
                        dateTime: data.dateTime || '',
                        serviceType: data.serviceType || '',
                        vehicleNumber: data.vehicleNumber || '',
                        totalDriverDistance: data.totalDriverDistance || '',
                        totalDriverSalary: data.totalDriverSalary || 0,
                        transferedSalary: data.transferedSalary || 0,
                        balanceSalary,
                        selectedDriver: data.selectedDriver || '',
                        advance: data.advance || 0,
                        advancePaymentDate: data.advancePaymentDate || '',
                        status: data.status || '',
                        bookingChecked: data.bookingChecked || false,
                        createdAt: data.createdAt ? data.createdAt.toDate() : null, // Convert Firestore Timestamp to Date
                    };
                });

                // Filter and sort bookings
                const filteredAndSortedBookings = allBookings
                    .filter((booking) => booking.selectedDriver === id && booking.status === 'Order Completed' && booking.bookingChecked === true)
                    .sort((a, b) => {
                        // Explicit type check to ensure createdAt is a Date object before calling getTime
                        if (!a.createdAt || !b.createdAt) return 0; // Null safety
                        return b.createdAt.getTime() - a.createdAt.getTime(); // Now works with Date objects
                    });

                setBookings(filteredAndSortedBookings); // Update state with sorted bookings
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
    useEffect(() => {
        const calculatedTotal = filteredBookings.reduce((acc, booking) => {
            const driverSalary = parseFloat(booking.totalDriverSalary) || 0; // Ensure it's a valid number
            return acc + driverSalary;
        }, 0);
        setTotalCalculatedUpdatedTotalSalary(calculatedTotal);
    }, [filteredBookings]);

    // ----------------------------------------------
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
                vehicleNumber: bookingToEdit.vehicleNumber,
                totalDriverDistance: bookingToEdit.totalDriverDistance,

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
                        const bookingData = bookingSnapshot.data();

                        const totalDriverSalary = bookingData?.totalDriverSalary || 0;
                        const transferedSalary = totalDriverSalary;
                        const balanceSalary = 0;
                        const salaryApproved = true; // Set salaryApproved status to true

                        await updateDoc(bookingRef, {
                            transferedSalary,
                            balanceSalary,
                            salaryApproved, // Add this line to update the status
                        });

                        return { id: bookingSnapshot.id,totalDriverSalary, transferedSalary, balanceSalary, salaryApproved };
                    } else {
                        console.log(`No booking found with ID: ${bookingId}`);
                        return null;
                    }
                });

                const updatedBookings = await Promise.all(updatePromises);
                const filteredBookings = updatedBookings.filter((booking) => booking !== null);

                // Update local state after successful updates
                setBookings((prevBookings) =>
                    prevBookings.map((booking) => {
                        const updatedBooking = filteredBookings.find((updatedBooking) => updatedBooking?.id === booking.id);
                        return updatedBooking
                            ? { ...booking, transferedSalary: updatedBooking.totalDriverSalary, balanceSalary: 0, salaryApproved: true }
                            : booking;
                    })
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
            vehicleNumber: '',
            totalDriverDistance: '',
            totalDriverSalary: 0,
            transferedSalary: 0,
            balanceSalary: 0,
            advance: 0, // Reset to 0
            advancePaymentDate: '',
        });
    };

    const handleSaveEdit = async () => {
        try {
            const { fileNumber, dateTime, serviceType, vehicleNumber, totalDriverDistance, totalDriverSalary, transferedSalary, advance, advancePaymentDate, balanceSalary } = editFormData;

            // Check if editingBookingId is null before proceeding
            if (!editingBookingId) {
                console.error('Editing booking ID is null');
                return; // Early exit if the ID is null
            }

            const bookingRef = doc(db, `user/${uid}/bookings`, editingBookingId);

            const formattedDate = advancePaymentDate ? new Date(advancePaymentDate).toLocaleDateString() : '';
            console.log('formattedDate', formattedDate);
            await updateDoc(bookingRef, {
                fileNumber,
                dateTime,
                serviceType,
                vehicleNumber,
                totalDriverDistance,
                totalDriverSalary,
                transferedSalary,
                balanceSalary: totalDriverSalary - transferedSalary,
                advance, // Update advance payment
                advancePaymentDate: formattedDate,
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
                              vehicleNumber,
                              totalDriverSalary,
                              totalDriverDistance,
                              transferedSalary,
                              balanceSalary: totalDriverSalary - transferedSalary,
                              advance,
                              advancePaymentDate: formattedDate,
                          }
                        : booking
                )
            );

            setEditingBookingId(null);
            setEditFormData({
                fileNumber: '',
                dateTime: '',
                serviceType: '',
                vehicleNumber: '',
                totalDriverSalary: 0,
                transferedSalary: 0,
                totalDriverDistance: '',
                balanceSalary: 0,
                advance: 0,
                advancePaymentDate: '',
            });
        } catch (error) {
            console.error('Error saving edit:', error);
        }
    };
    const handleAdvance = async () => {
        // Check if advance is valid
        if (!editFormData.advance || editFormData.advance <= 0) {
            alert('Please enter a valid advance.');
            return;
        }
        setAdvances((prevAdvances) => [
            ...prevAdvances,
            {
                advance: editFormData.advance,
                advancePaymentDate: editFormData.advancePaymentDate,
            },
        ]);
        setIsModalOpen1(true);
    };
    const confirmAdvanceUpdate = async () => {
        try {
            if (!uid || !id) {
                throw new Error('User ID or Driver ID is undefined');
            }
            const driverRef = doc(db, `user/${uid}/driver`, id);

            const driverSnap = await getDoc(driverRef);
            const currentAdvance = driverSnap.exists() ? driverSnap.data().advance || 0 : 0;

            console.log('Current advance:', currentAdvance);

            // Ensure currentAdvance is a valid number
            const currentAdvanceNumber = typeof currentAdvance === 'number' ? currentAdvance : parseFloat(currentAdvance);
            const newAdvanceNumber = typeof editFormData.advance === 'number' ? editFormData.advance : parseFloat(editFormData.advance);

            // Calculate the new total advance
            const newTotalAdvance = currentAdvanceNumber + newAdvanceNumber;

            await updateDoc(driverRef, {
                advance: newTotalAdvance,
                advancePaymentDate: editFormData.advancePaymentDate || serverTimestamp(), // Use serverTimestamp if no date is provided
            });
            const advanceDataRef = collection(driverRef, 'advanceData'); // Reference to subcollection

            // Add the new advance to the subcollection
            await addDoc(advanceDataRef, {
                advance: editFormData.advance,
                advancePaymentDate: editFormData.advancePaymentDate || serverTimestamp(), // Default to server timestamp if empty
            });
          
            // alert('Advance updated successfully.');
            setEditFormData({ ...editFormData, advance: 0, advancePaymentDate: "" }); // Reset input fields

            setIsModalOpen1(false);
            await fetchAdvanceData();

        } catch (error) {
            console.error('Error updating advance:', error);
            alert('Error adding advance.');
        }
    };
    
    const fetchAdvanceData = async () => {
        try {
            if (!uid || !id) {
                throw new Error('User ID or Driver ID is undefined');
            }
            const driverRef = doc(db, `user/${uid}/driver`, id);
            const advanceDataRef = collection(driverRef, 'advanceData'); // Reference to subcollection
    
            const querySnapshot = await getDocs(advanceDataRef);
            const fetchedAdvances = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                
                // Handle the Timestamp conversion for advancePaymentDate
                const advancePaymentDate = data.advancePaymentDate instanceof Timestamp 
                    ? data.advancePaymentDate.toDate().toLocaleString() // Convert to Date and format as string
                    : '';
    
                // Return the formatted data with necessary fields
                return {
                    id: doc.id, // Document ID (optional if needed)
                    advance: data.advance || 0, // Default to 0 if advance is undefined
                    advancePaymentDate: advancePaymentDate, // Converted Timestamp or empty string
                };
            }) as AdvanceRecord[];
            setAdvances(fetchedAdvances);
        } catch (error) {
            console.error('Error fetching advance data:', error);
            alert('Error fetching advances.');
        }
    };
    useEffect(() => {
        fetchAdvanceData();
    }, [uid, id]); // Dependency array to re-fetch if UID or ID changes
    
    const handleAdjustWithSalary = async () => {
        setIsModalOpen(true);
    };
    let isAlertShown = false;

    const confirmSalaryAdjustment = async () => {
        if (!uid || !id) {
            throw new Error('User ID or Driver ID is undefined');
        }
        try {
            const driverRef = doc(db, `user/${uid}/driver`, id);

            // Listen to real-time updates for advance amount
            onSnapshot(driverRef, async (driverSnap) => {
                if (!driverSnap.exists()) {
                    alert('Driver data not found.');
                    return;
                }

                const driverData = driverSnap.data();
                const fetchedAdvance = driverData.advance || 0;
                let remainingAdvance = fetchedAdvance;

                console.log('Fetched Advance (Real-time):', fetchedAdvance);

                const totalSalaryAmount = filteredBookings.reduce((acc, booking) => acc + (booking.balanceSalary || 0), 0);

                if (totalSalaryAmount === 0) {
                    // Case 1: No pending salary to adjust, update the advance amount directly
                    if (remainingAdvance > 0) {
                        await updateDoc(driverRef, { advance: 0 });
                        console.log('Advance reset to 0 as no salary is pending.');
                        alert('Advance reset successfully.');
                    }
                    return;
                }

                // Case 2: Adjust advance with bookings
                const updatedBookings = [];
                const adjustedIds: string[] = [];
                const fileNumbers: string[] = [];
                const sortedBookings = [...filteredBookings].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

                for (let booking of sortedBookings) {
                    if (remainingAdvance <= 0) break;

                    const maxTransferableAmount = (booking.totalDriverSalary || 0) - (booking.transferedSalary || 0);

                    if (maxTransferableAmount > 0) {
                        const transferAmount = Math.min(remainingAdvance, maxTransferableAmount);

                        remainingAdvance -= transferAmount;

                        updatedBookings.push({
                            ...booking,
                            transferedSalary: (booking.transferedSalary || 0) + transferAmount,
                            balanceSalary: (booking.totalDriverSalary || 0) - (booking.transferedSalary || 0) - transferAmount,
                        });

                        adjustedIds.push(booking.id);
                        fileNumbers.push(booking.fileNumber || 'N/A');

                        const bookingRef = doc(db, `user/${uid}/bookings`, booking.id);
                        await updateDoc(bookingRef, {
                            transferedSalary: (booking.transferedSalary || 0) + transferAmount,
                            balanceSalary: (booking.totalDriverSalary || 0) - (booking.transferedSalary || 0) - transferAmount,
                        });

                        // Optionally save details to a subcollection for records
                        await saveSalaryDetails(booking.id, fetchedAdvance, transferAmount, [booking.fileNumber]);
                    }
                }

                if (remainingAdvance !== fetchedAdvance) {
                    // Update the remaining advance in the driver's document
                    await updateDoc(driverRef, { advance: remainingAdvance });
                    console.log('Updated Remaining Advance:', remainingAdvance);
                }

                setBookings(updatedBookings);
                setAdjustedBookingIds(adjustedIds);
                setAdjustedFileNumbers(fileNumbers);

                if (!isAlertShown) {
                    alert('Salary adjusted successfully.');
                    isAlertShown = true;
                }
                window.location.reload();
            });
        } catch (error) {
            console.error('Error during salary adjustment:', error);
            alert('An error occurred while adjusting the salary.');
        }
    };

    const handlePrint = () => { 
        const printContent = printRef.current; // Get the content to print
        const printWindow = window.open('', '', 'height=800,width=1200'); // Create a print window
        
        if (printWindow && printContent) {
            printWindow.document.write('<html><head><title>Print</title>');
            
            // Add custom styles for print
            printWindow.document.write(`
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        line-height: 1.5;
                        margin: 0;
                        padding: 20px;
                    }
                    h2, h3 {
                        color: #2c3e50;
                    }
                    .bg-gradient-to-r {
                        background: linear-gradient(to right, #a8e063, #56ab2f);
                        padding: 15px;
                        border-radius: 8px;
                        color: #fff;
                    }
                    .table-container {
                        width: 100%;
                        margin-top: 20px;
                        border-collapse: collapse;
                    }
                    .table-container th, .table-container td {
                        padding: 12px;
                        border: 1px solid #ccc;
                        text-align: left;
                    }
                    .table-container th {
                        background-color: #f2f2f2;
                        font-weight: bold;
                    }
                    .table-container tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    .table-container td {
                        background-color: #fff;
                    }
                    .no-print {
                        display: none !important; /* Hide elements with the 'no-print' class */
                    }
                    .text-green {
                        color: #2ecc71;
                    }
                    .text-red {
                        color: #e74c3c;
                    }
                    .action-buttons {
                        display: none; /* Hide action buttons for printing */
                    }
                </style>
            `);
            
            printWindow.document.write('</head><body>');
            
            // Get selected month and year
            const monthText = selectedMonth ? selectedMonth : "All"; // Default to "All" if no month is selected
            const yearText = selectedYear ? selectedYear : "All"; // Default to "All" if no year is selected
            
            // Inject the selected month and year values in the print content
            printWindow.document.write(`
                <p><strong>Month:</strong> ${monthText}</p>
                <p><strong>Year:</strong> ${yearText}</p>
            `);
            
            // Write the rest of the content into the print window
            printWindow.document.write(printContent.innerHTML); 
            printWindow.document.write('</body></html>');
            printWindow.document.close(); // Close the document to trigger printing
            printWindow.print(); // Trigger the print dialog
        } else {
            console.error('Print window or content is null');
        }
    };
    
    
    return (
        <div className="container mx-auto my-10 p-5 bg-gray-50 shadow-lg rounded-lg sm:p-8 lg:p-10"  ref={printRef}>
            {driver && (
                <h1 className="text-4xl font-extrabold mb-6 text-center text-gray-900 shadow-md p-3 rounded-lg bg-gradient-to-r from-indigo-300 to-red-300">
                    {' '}
                    Salary Report <span className="text-red-500">{driver.driverName}</span>
                </h1>
            )}
<div className="flex justify-center mb-4 no-print">
{/* Month Selection */}
                <div className="flex flex-col items-center mr-4">
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
                <div className="flex flex-col items-center">
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
                        {Array.from({ length: 11 }, (_, i) => {
    const year = new Date().getFullYear() - 5 + i; // Generate years from 5 years before to 5 years after the current year
    return (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>

            {/* ------------------------------------------------- */}
           
            <div className="mb-4 flex justify-center space-x-0 md:space-x-4 flex-col md:flex-row  no-print">
               
                <button
          onClick={() => setShowAdvanceTable(!showAdvanceTable)}
          className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
        >
          {showAdvanceTable ? "Hide Table" : "View Advance Table"}
        </button>
        {showAdvanceTable && advances.length > 0 && (
    <table className="table-auto border-collapse border border-gray-300 w-full mt-4">
        <thead>
            <tr>
                <th className="border border-gray-300 px-4 py-2">Advance</th>
                <th className="border border-gray-300 px-4 py-2">Payment Date</th>
            </tr>
        </thead>
        <tbody>
            {advances.map((record, index) => (
                <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">
                        {record.advance}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
    {record.advancePaymentDate
        ? new Date(record.advancePaymentDate).toLocaleDateString() // Date object formatting
        : ''}
</td>

                </tr>
            ))}
        </tbody>
    </table>
)}


                <ConfirmationModal1
                    isOpen={isModalOpen1}
                    onClose={() => setIsModalOpen1(false)} // Close modal on cancel
                    onConfirm={confirmAdvanceUpdate} // Confirm advance update on OK
                />
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleAdjustWithSalary}>
                    Adjust Salary
                </button>

                <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={confirmSalaryAdjustment} />
                <button onClick={() => setShowAdvanceDetails(!showAdvanceDetails)} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                    {showAdvanceDetails ? 'Hide Advance Details' : 'Advance Details'}
                </button>
            </div>

            <SalaryDetailsTable uid={uid} id={id || ''} showAdvanceDetails={showAdvanceDetails} />

            <div className="flex justify-end  no-print">
        <button
          type="button"
          className="p-2 rounded-full bg-gray-500 text-white hover:bg-blue-600 mt-2 mb-2"
          onClick={handlePrint}
          aria-label="Print"
        >
          <IconPrinter />
        </button>
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
                            bookings={bookings.map((booking) => ({
                                ...booking,
                                transferedSalary: booking.transferedSalary ?? 0, // Fallback to 0 if undefined
                            }))}
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

<div >
<div className="bg-gradient-to-r from-green-100 to-green-200 p-6 shadow-lg rounded-lg hover:shadow-xl  hover:scale-105 ">
                    <div className="flex items-center space-x-4">
                        <div className="text-4xl text-green-600">
                            <i className="fas fa-receipt"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Total Balance Salary Amount:</h3>
                            <p className="text-gray-700 text-lg">{totalSalaryAmount}</p>
                        </div>
                    </div>
                    </div>
<br />
                    <div className="bg-gradient-to-r from-red-100 to-red-200 p-6 shadow-lg rounded-lg hover:shadow-xl  hover:scale-105 transition-transform">
                        <div className="flex items-center space-x-4">
                            <div className="text-4xl text-red-600">
                                <i className="fas fa-hand-holding-usd"></i>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Advance Amount</h3>
                                <p className="text-gray-700 text-lg">{driver?.advance ? driver.advance : 'No advance payment made'}</p>
                            </div>
                        </div>
                    </div>

                <div className="mt-5">
                    <h2 className="text-xl font-bold mb-3 text-center text-gray-800">Driver Salary Details</h2>
                    <div className="overflow-x-auto">
                        {' '}
                        {/* Added scrollable container */}
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">#</th>

                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">File Number</th>
                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Date</th>
                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Service Type</th>
                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Customer Vehicle Number</th>
                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Covered Distance</th>

                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Total Driver Salary</th>
                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Transferred Salary</th>
                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Balance Salary</th>
                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 no-print" >
                                        Actions
                                        <span className="flex items-center">
                                            <input type="checkbox" checked={selectAll} onChange={(e) => setSelectAll(e.target.checked)} />
                                            <span className="ml-2">Select All</span>
                                        </span>
                                    </th>
                                    <th>ViewMore</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredBookings.map((booking, index) => (
                                    <tr key={booking.id}>
                                        <td className="border px-4 py-2">{index + 1}</td>

                                        <td className="border px-4 py-2">{booking.fileNumber}</td>
                                        <td>{format(parse(booking.dateTime, 'dd/MM/yyyy, h:mm:ss a', new Date()), 'dd/MM/yyyy, h:mm:ss a')}</td>
                                        <td className="border px-4 py-2">{booking.serviceType}</td>
                                        <td className="border px-4 py-2">{booking.vehicleNumber}</td>
                                        <td className="border px-4 py-2">{booking.totalDriverDistance}</td>

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
                                        <td
                                            className="border px-4 py-2"
                                            style={{
                                                backgroundColor: booking.balanceSalary === 0 ? '#e6ffe6' : '#ffe6e6', // Light green and light red
                                                color: booking.balanceSalary === 0 ? 'black' : 'black', // Adjust text color as needed
                                            }}
                                        >
                                            {booking.balanceSalary}
                                        </td>

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
                                                <div className="flex justify-center space-x-2 no-print">
  <button
    className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold px-2 py-1 rounded-lg shadow-lg hover:shadow-xl  duration-300 hover:scale-105"
    onClick={() => handleEditBooking(booking.id)}
  >
    Settle Salary
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
                                        <td>
                                            <Link
    to={`/bookings/newbooking/viewmore/${booking.id}`}
                                                    style={{
                                                        padding: '5px 10px',
                                                        color: '#fff',
                                                        backgroundColor: '#007bff',
                                                        borderRadius: '5px',
                                                        textDecoration: 'none',
                                                        display: 'inline-block',
                                                        transition: 'background-color 0.3s',
                                                    }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
                                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
                                                >
                                                    View More
                                                </Link>
                                            </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600" colSpan={2}></th>
                                    <th
                                        className="px-4 py-2 text-left text-2xl font-bold text-red-600" // Enlarged and red color
                                        colSpan={4}
                                    >
                                        Total Salary
                                    </th>
                                    <td
                                        className="border px-4 py-2 text-2xl font-bold text-red-600" // Enlarged and red color
                                    >
                                        {typeof totalCalculatedUpdatedTotalSalary === 'number' ? totalCalculatedUpdatedTotalSalary.toFixed(2) : 'N/A'}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalaryReport;
