import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc, orderBy, onSnapshot, addDoc, Timestamp, serverTimestamp, writeBatch } from 'firebase/firestore';
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
    amount: number | string;
    bookingChecked: boolean;
    receivedAmount: number | string; 
    createdAt: Date | null;
    receivedUser:string;
    companyBooking:boolean;
}
interface SalaryDetail {
    id: string;
    [key: string]: any; // Adjust this based on the actual fields in the salary document
}
interface AdvanceRecord {
    advance: number;
    advancePaymentDate: string;
    addedAdvance: number;
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
    const role = sessionStorage.getItem('role');
    const userName = sessionStorage.getItem('username');
//    ----------------------------------------------------------------------
const [netTotalAmountInHand, setNetTotalAmountInHand] = useState<number>(0);

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
  
// ---------------------------------------------------------------------------------------------------------
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

    // ----------------------------------------------------------------------------------------
    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const bookingsRef = collection(db, `user/${uid}/bookings`);
                const querySnapshot = await getDocs(bookingsRef);
    
                const allBookings: Booking[] = querySnapshot.docs.map((doc) => {
                    const data = doc.data();
                    const balanceSalary = data.totalDriverSalary - (data.transferedSalary || 0);
    
                    const isStaff = data.receivedUser === "Staff";
                    if (isStaff) {
                        console.log(`Staff booking detected: ${doc.id}`);
                    }
    
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
                        amount: isStaff ? 0 : data.amount || 0,
                        receivedAmount: isStaff ? 0 : data.receivedAmount || 0,
                        bookingChecked: data.bookingChecked || false,
                        receivedUser: data.receivedUser || '',
                        companyBooking:data.companyBooking || false,
                        createdAt: data.createdAt ? data.createdAt.toDate() : null,
                    };
                });
    
                // Filter and sort bookings
                const filteredAndSortedBookings = allBookings
                    .filter((booking) => 
                        booking.selectedDriver === id && 
                        booking.status === 'Order Completed' && 
                        booking.bookingChecked === true
                    )
                    .sort((a, b) => {
                        if (!a.createdAt || !b.createdAt) return 0; // Null safety
                        return b.createdAt.getTime() - a.createdAt.getTime(); // Sort by latest
                    });
    
                const netTotalFromBookings = allBookings
                    .filter((booking) =>
                        booking.selectedDriver === id && booking.status === 'Order Completed'
                    )
                    .reduce((sum, b) => {
                        const received = parseFloat(b.receivedAmount as string) || 0;
                        const bookingAmount = parseFloat(b.amount as string) || 0;
    
                        return sum + bookingAmount - received;
                    }, 0);
    
                const advanceAmount = driver?.advance || 0;
                const netTotal = netTotalFromBookings + advanceAmount;
    
                // Batch state update
                setBookings(filteredAndSortedBookings);
                setNetTotalAmountInHand(netTotal);
    
                console.log("Filtered Bookings:", filteredAndSortedBookings);
                console.log("Net Total Amount In Hand:", netTotal);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
    
        fetchBookings();
    }, [db, id, uid, driver?.advance]); // Adding driver.advance to the dependency array to recalculate when it changes
    

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
        if (!uid || !id) {
            console.error('Missing user or driver ID');
            return;
        }
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
                    advancePaymentDate: advancePaymentDate, 
                    addedAdvance: data.addedAdvance || 0,
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
    //=================================================================
    const confirmSalaryAdjustment = async () => {
        if (!uid) {
            console.error("User ID is undefined");
            return;
        }
    
        try {
            let remainingNetAmount = netTotalAmountInHand || 0;
    
            if (remainingNetAmount <= 0) {
                alert("No amount available to distribute.");
                return;
            }
    
            const batch = writeBatch(db); // Firestore batch
            const adjustedIds = [];
            const fileNumbers = [];
            let totalTransferredSalary = 0;

            // Process bookings
            // Filter bookings with driverId == id
        const relevantBookings = bookings
        .filter(
            (booking) =>
                booking.selectedDriver === id &&
                booking.receivedUser !== "Staff" &&
                !booking.companyBooking
        )        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
console.log("relevantBookings",relevantBookings)
    // Process filtered bookings
    for (const booking of relevantBookings) {
        if (remainingNetAmount <= 0) break;

                if (booking.receivedUser === "Staff") {
                    batch.update(doc(db, `user/${uid}/bookings`, booking.id), {
                        amount: 0,
                        receivedAmount: 0,
                    });
                    continue;
                }
    
                const maxTransferableSalary = (booking.totalDriverSalary || 0) - (booking.transferedSalary || 0);
    
                if (maxTransferableSalary > 0) {
                    const transferAmount = Math.min(remainingNetAmount, maxTransferableSalary);
    
                    remainingNetAmount -= transferAmount;
    
                    const updatedBooking = {
                        transferedSalary: (booking.transferedSalary || 0) + transferAmount,
                        balanceSalary: (booking.totalDriverSalary || 0) - ((booking.transferedSalary || 0) + transferAmount),
                    };
                    totalTransferredSalary += transferAmount;

                    batch.update(doc(db, `user/${uid}/bookings`, booking.id), updatedBooking);
                    adjustedIds.push(booking.id);
                    fileNumbers.push(booking.fileNumber || "N/A");
                }
            }
    
            // Save remaining amount as advance
            if (remainingNetAmount > 0) {
                const advanceRef = collection(db, `user/${uid}/driver/${id}/advanceAdjustments`);
                batch.set(doc(advanceRef), {
                    advance: remainingNetAmount,
                    timestamp: serverTimestamp(),
                });
            }
    
            // Commit batch updates
            await batch.commit();
    
            // Save salary adjustment details
            await saveSalaryDetails(
                id || "",
                netTotalAmountInHand || 0,
                netTotalAmountInHand - remainingNetAmount,
                fileNumbers
            );
    
            setNetTotalAmountInHand(remainingNetAmount);
            setAdjustedBookingIds(adjustedIds);
            alert("Salary adjustment completed successfully.");
            await handleReceiveAdjust( totalTransferredSalary);
        } catch (error) {
            console.error("Error adjusting salary:", error);
        }
    };
    
    const handleReceiveAdjust = async ( totalTransferredSalary: number) => {
        if (!uid) {
            console.error("User ID is undefined");
            return;
        }
    
        try {
            let remainingSalary = totalTransferredSalary;
    
            // Sort bookings by earliest date
            const driverBookings = filteredBookings
                .filter((booking) => booking.selectedDriver === id)
                .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    console.log("driverBookings",driverBookings)
            const batch = writeBatch(db); // Firestore batch
    
            for (const booking of driverBookings) {
                if (remainingSalary <= 0) break;
    
                const maxReceivableAmount = (Number(booking.amount) || 0) - (Number(booking.receivedAmount) || 0);
    
                if (maxReceivableAmount > 0) {
                    const distributeAmount = Math.min(remainingSalary, maxReceivableAmount);
                    remainingSalary -= distributeAmount;
    
                    const updatedBooking = {
                        receivedAmount: (Number(booking.receivedAmount) || 0) + distributeAmount,
                    };
    
                    batch.update(doc(db, `user/${uid}/bookings`, booking.id), updatedBooking);
                }
            }
    
            // Commit batch updates
            await batch.commit();
    
            console.log("ReceivedAmount adjustments completed successfully.");
            alert("Distributed salary to bookings successfully.");
        } catch (error) {
            console.error("Error distributing salary:", error);
        }
    };
    
    
    const handlePrint = () => {  
        const printContent = printRef.current; // Get the content to print
        const printWindow = window.open('', '', 'height=1000,width=1600'); // Create a print window
    
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
                        padding: 12px 15px; /* Added padding for better readability */
                        border: 2px solid #000; /* Solid black borders */
                        text-align: left;
                        font-size: 14px; /* Set font size for clarity */
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
                         .print-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .company-details {
                    text-align: right;
                    max-width: 300px;
                    font-size: 14px;
                }
                .company-logo {
                    width: 50px;
                    height: auto;
                }
                    @media print {
                        body {
                            padding: 0;
                            margin: 0;
                        }
                        .grid {
                            display: grid;
                            grid-template-columns: repeat(1, 1fr); /* Stack items in a single column */
                            gap: 4px;
                        }
                        .bg-gradient-to-r {
                            padding: 5px; /* Reduce padding */
                            font-size: 30px; /* Smaller font size */
                        }
                        .text-6xl {
                            font-size: 4xl; /* Smaller icon size */
                        }
                        h3 {
                            font-size: 14px; /* Smaller heading size */
                        }
                        p {
                            font-size: 12px; /* Smaller paragraph size */
                        }
                        .flex {
                            display: block; /* Stack flex items vertically */
                        }
                      .company-details {
        position: absolute;
        right: 20px;
        top: 20px;
    }

   .company-logo {
        display: block !important; /* Ensure the image is not hidden during printing */
        width: 150px; /* Set a fixed width for the logo */
        height: auto;
    }
                    .print-header {
                        flex-direction: row;
                        align-items: flex-start;
                    }
                    }
                </style>
            `);
    
            printWindow.document.write('</head><body>');
            
            // Get selected month and year
            const monthText = selectedMonth ? selectedMonth : "All"; // Default to "All" if no month is selected
            const yearText = selectedYear ? selectedYear : "All"; // Default to "All" if no year is selected
            // Get the current date
            const currentDate = new Date();
            const formattedDate = currentDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            // Inject the selected month and year values in the print content
            printWindow.document.write(`
                <p><strong>Month:</strong> ${monthText}</p>
                <p><strong>Year:</strong> ${yearText}</p>
            `);
            
            // Inject the "Printed By" message based on the role
            const printedBy = role === 'staff' ? `Printed By: ${userName}` : 'Printed By: Admin';
            printWindow.document.write(`
                <p><strong>${printedBy}</strong></p>
            `);
            printWindow.document.write(`
                <p><strong>Printed Date:</strong> ${formattedDate}</p>
            `);
            printWindow.document.write(`
                <div class="print-header">
                    <div>
                        <h1 class="text-4xl font-extrabold mb-6 text-center text-gray-900 shadow-md p-3 rounded-lg bg-gradient-to-r from-indigo-300 to-red-300">
                            Salary Report for <span class="text-red-500">${driver?.driverName}</span>
                        </h1>
                    </div>
        <div class="company-details">
    <h3><strong>Company:</strong> RSA</h3>
    <p><strong>Location:</strong> Tirurkad</p>
<img class="company-logo" src="http://localhost/assets/images/auth/rsa-png.png" alt="Company Logo" />
</div>


                </div>
            `);
            printWindow.document.write(`
                <style>
                    .card-container {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                        gap: 20px;
                        padding: 20px;
                        margin-top: 20px;
                    }
                    .card {
                        background: linear-gradient(to right, #6a11cb, #2575fc);
                        color: white;
                        border-radius: 10px;
                        padding: 20px;
                        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                        transition: transform 0.3s ease-in-out;
                    }
                    .card:hover {
                        transform: translateY(-5px);
                    }
                    .title {
                        font-size: 1.2rem;
                        font-weight: bold;
                        margin-bottom: 10px;
                        text-transform: uppercase;
                    }
                    .value {
                        font-size: 1.5rem;
                        font-weight: 500;
                        margin-top: 10px;
                    }
                    /* Ensure proper styling for printing */
                    @media print {
                        .card-container {
                            display: block;
                            margin: 0;
                            padding: 0;
                        }
                        .card {
                            background: #ffffff;
                            color: #333;
                            border: 1px solid #ddd;
                            box-shadow: none;
                            padding: 15px;
                            margin: 10px 0;
                        }
                        .card:hover {
                            transform: none;
                        }
                        .title {
                            color: #333;
                        }
                        .value {
                            font-size: 1.3rem;
                        }
                    }
                </style>
                 <div class="print-header">
        <h1 class="text-4xl font-extrabold mb-6 text-center text-gray-900 shadow-md p-3 rounded-lg bg-gradient-to-r from-indigo-300 to-red-300">
            Salary Report for <span class="text-red-500">${driver?.driverName}</span>
        </h1>
    </div>
                <div class="card-container">
                    <div class="card">
                        <div class="title">Advance Amount</div>
                        <div class="value">${driver?.advance ? driver.advance : 'No advance payment made'}</div>
                    </div>
                    <div class="card">
                        <div class="title">Salary Paid in ${selectedMonth ? selectedMonth : 'All Months'}</div>
                        <div class="value">${totalCollectedSalaryAmount}</div>
                    </div>
                    <div class="card">
                        <div class="title">Balance Salary Amount in ${selectedMonth ? selectedMonth : 'All Months'}</div>
                        <div class="value">${totalSalaryAmount}</div>
                    </div>
                    <div class="card">
                        <div class="title">Total Cash In Hand</div>
                        <div class="value">${netTotalAmountInHand}</div>
                    </div>
                </div>
            `);
                       // Write the rest of the content into the print window
            printWindow.document.write(`
                <table class="table-container">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>File Number</th>
                            <th>Date</th>
                            <th>Service Type</th>
                            <th>Vehicle Number</th>
                            <th>Covered Distance</th>
                            <th>Total Driver Salary</th>
                            <th>Transferred Salary</th>
                            <th>Balance Salary</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredBookings.map((booking, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${booking.fileNumber}</td>
                                <td>${new Date(booking.dateTime).toLocaleDateString()}</td>
                                <td>${booking.serviceType}</td>
                                <td>${booking.vehicleNumber}</td>
                                <td>${booking.totalDriverDistance}</td>
                                <td>${booking.totalDriverSalary}</td>
                                <td>${booking.transferedSalary}</td>
                                <td style="background-color: ${booking.balanceSalary === 0 ? '#e6ffe6' : '#ffe6e6'}">
                                    ${booking.balanceSalary}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `);
    
            if (showAdvanceTable && advances.length > 0) {
                printWindow.document.write(`
                    <div class="print-container">
                        <div class="table-wrapper">
                            <h3 class="text-2xl font-extrabold mb-6 text-center text-gray-800">
                                Advance Payment Details
                            </h3>
                            <table class="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden shadow-md table-container">
                                <thead class="bg-gray-100">
                                    <tr>
                                        <th class="border border-gray-300 px-8 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                            Initial Advance
                                        </th>
                                        <th class="border border-gray-300 px-8 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                            Current Advance
                                        </th>
                                        <th class="border border-gray-300 px-8 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                            Payment Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${advances.map((record, index) => `
                                        <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                                            <td class="border border-gray-200 px-8 py-4 text-gray-700">${record.addedAdvance}</td>
                                            <td class="border border-gray-200 px-8 py-4 text-gray-700">${record.advance}</td>
                                            <td class="border border-gray-200 px-8 py-4 text-gray-500">${record.advancePaymentDate ? new Date(record.advancePaymentDate).toLocaleDateString() : ''}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `);
            }
    
            // Add CSS for print
            printWindow.document.write(`
                <style>
                    .print-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: auto;
                        padding: 10px;
                        box-sizing: border-box;
                    }
                    .table-wrapper {
                        width: 100%;
                        max-width: 1000px;
                        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                        border-radius: 8px;
                        overflow: hidden;
                        background-color: #fff;
                        padding: 10px;
                    }
                    @media print {
                        .print-container {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: auto;
                            margin: 0;
                        }
                        .table-wrapper {
                            width: 100%;
                            max-width: auto;
                        }
                    }
                </style>
            `);
    
            printWindow.document.write('</body></html>');
            printWindow.document.close(); // Close the document to trigger printing
            printWindow.print(); // Trigger the print dialog
        } else {
            console.error('Print window or content is null');
        }
    };
    
    
    const totalCollectedSalaryAmount = totalCalculatedUpdatedTotalSalary
    ? (totalCalculatedUpdatedTotalSalary - totalSalaryAmount).toFixed(2)
    : 'N/A';

console.log("totalSalaryAmount", totalSalaryAmount);
// ---------------------------------------------------------------------------------


const handleSettleSalary = async (bookingId: string, balanceSalary: number) => {
    try {
        // Ensure the balanceSalary is negative (settling an outstanding balance)
        if (balanceSalary >= 0) {
            console.log('Balance salary is not negative, no settlement needed.');
            return;
        }

        const booking = bookings.find((b) => b.id === bookingId);
        if (!booking || !uid || !id) {
            console.error('Invalid booking or missing user/driver IDs');
            return;
        }

        const driverRef = doc(db, `user/${uid}/driver`, id);
        const driverSnap = await getDoc(driverRef);

        if (!driverSnap.exists()) {
            console.error('Driver document not found');
            return;
        }

        const driverData = driverSnap.data();
        const currentAdvance = driverData.advance || 0;

        if (Math.abs(balanceSalary) > currentAdvance) {
            console.error('Insufficient advance to settle the salary');
            alert('Insufficient advance to settle the salary');
            return;
        }

        const newAdvance = currentAdvance + balanceSalary; // Deduct negative balanceSalary

        // Update driver's advance
        await updateDoc(driverRef, { advance: newAdvance });

        // Fetch booking and update transferredSalary
        const bookingRef = doc(db, `user/${uid}/bookings`, bookingId);
        const bookingSnap = await getDoc(bookingRef);

        if (!bookingSnap.exists()) {
            console.error('Booking document not found');
            return;
        }

        const currentTransferredSalary = bookingSnap.data().transferedSalary || 0;
        const newTransferredSalary = currentTransferredSalary + balanceSalary;

        // Update booking details
        await updateDoc(bookingRef, {
            transferedSalary: newTransferredSalary,
            balanceSalary: 0, // Balance settled
        });

        console.log(`Salary settled. New advance: ${newAdvance}, New transferredSalary: ${newTransferredSalary}`);
    } catch (error) {
        console.error('Error settling salary:', error);
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
            <th className="border border-gray-300 px-4 py-2">Initial Advance</th>

                <th className="border border-gray-300 px-4 py-2">Current Advance</th>
                <th className="border border-gray-300 px-4 py-2">Payment Date</th>
            </tr>
        </thead>
        <tbody>
            {advances.map((record, index) => (
                <tr key={index}>
                   <td className="border border-gray-300 px-4 py-2">
                   {record.addedAdvance}
                   </td>
                    <td className="border border-gray-300 px-4 py-2">
                        {record.advance}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
    {record.advancePaymentDate
        ? new Date(record.advancePaymentDate).toLocaleDateString('en-GB') // 'en-GB' locale formats as day/month/year
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
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8 print-container">
    {/* Advance Amount Card */}
    <div className="bg-gradient-to-r from-red-300 to-red-500 p-8 shadow-2xl rounded-2xl hover:shadow-3xl hover:scale-[1.05] transition-all duration-300 ease-in-out">
        <div className="flex items-center space-x-6">
            <div className="text-6xl text-red-700">
                <i className="fas fa-hand-holding-usd"></i>
            </div>
            <div>
                <h3 className="text-2xl font-semibold text-gray-800 tracking-tight leading-tight">Advance Amount</h3>
                <p className="text-lg text-gray-600 mt-2">
                    {driver?.advance ? driver.advance : 'No advance payment made'}
                </p>
            </div>
        </div>
    </div>

    {/* Salary Paid Card */}
    <div className="bg-gradient-to-r from-green-300 to-green-500 p-8 shadow-2xl rounded-2xl hover:shadow-3xl hover:scale-[1.05] transition-all duration-300 ease-in-out print-card">
        <div className="flex items-center space-x-6">
            <div className="text-6xl text-green-700">
                <i className="fas fa-receipt"></i>
            </div>
            <div>
                <h3 className="text-2xl font-semibold text-gray-800 tracking-tight leading-tight">
                    Salary Paid in {selectedMonth ? selectedMonth : 'All Months'}
                </h3>
                <p className="text-lg text-gray-600 mt-2">{totalCollectedSalaryAmount}</p>
            </div>
        </div>
    </div>

    {/* Balance Salary Amount Card */}
    <div className="bg-gradient-to-r from-green-300 to-green-500 p-8 shadow-2xl rounded-2xl hover:shadow-3xl hover:scale-[1.05] transition-all duration-300 ease-in-out print-card">
        <div className="flex items-center space-x-6">
            <div className="text-6xl text-blue-700">
                <i className="fas fa-receipt"></i>
            </div>
            <div>
                <h3 className="text-2xl font-semibold text-gray-800 tracking-tight leading-tight">
                    Balance Salary Amount in {selectedMonth ? selectedMonth : 'All Months'}
                </h3>
                <p className="text-lg text-gray-600 mt-2">{totalSalaryAmount}</p>
            </div>
        </div>
    </div>
    <div className="bg-gradient-to-r from-yellow-200 to-yellow-500 p-8 shadow-2xl rounded-2xl hover:shadow-3xl hover:scale-[1.05] transition-all duration-300 ease-in-out print-card">
        <div className="flex items-center space-x-6">
            <div className="text-6xl text-green-700">
                <i className="fas fa-receipt"></i>
            </div>
            <div>
                <h3 className="text-2xl font-semibold text-gray-800 tracking-tight leading-tight">
                   Total Cash In Hand (Total Collected From Customer + Advance)
                </h3>
                <p className="text-lg text-gray-600 mt-2">{netTotalAmountInHand}</p>
            </div>
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
                                    <th className=' no-print'>ViewMore</th>
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
    className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold px-2 py-1 rounded-lg shadow-lg hover:shadow-xl duration-300 hover:scale-105"
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
                                        <td className=' no-print'>
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
        <th className="px-4 py-2 text-left text-2xl font-bold text-red-600" colSpan={4}>
            Total Salary
        </th>
        <td className="border px-4 py-2 text-2xl font-bold text-red-600">
            {totalCalculatedUpdatedTotalSalary != null
                ? totalCalculatedUpdatedTotalSalary.toFixed(2)
                : 'N/A'}
        </td>
        <th className="px-2 py-2 text-left text-xl font-bold text-gray-600">
            Balance :
        </th>
        <td className="border px-4 py-2 text-2xl font-bold text-red-600">
            {typeof totalSalaryAmount === 'number' ? totalSalaryAmount.toFixed(2) : totalSalaryAmount || 'N/A'}
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
