// new code

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc, orderBy, writeBatch, arrayUnion, Timestamp, increment, addDoc, setDoc, runTransaction } from 'firebase/firestore';
import Modal from 'react-modal';
import { parse, format } from 'date-fns';
import styles from './cashCollectionReport.module.css';
import IconEdit from '../../components/Icon/IconEdit';
import { Link } from '@mui/material';

interface Driver {
    id?: string;
    driverName?: string;
    advance?: number;
    personalphone?: string;
    companyName?: string;
}

interface Booking {
    id: string;
    amount: number; // Change to number
    invoiceNumber?: string;
    receivedAmountCompany?: number;
    balanceCompany?: string;
    vehicleNumber: string;
    dateTime: string;
    fileNumber?: string;
    selectedDriver?: string;
    approve?: boolean;
    driver?: string;
    updatedTotalSalary?: any;
    disabled?: boolean;
    userName?: string;
    selectedCompany: string;
    companyBooking?: boolean;
    amountToUse?: number;
    createdAt: Timestamp;
    receivedUser: string;
    companyName?: string;
    profit?: number;
    OkClick?:boolean;
    actualProfit?:any;

}
// ------------------------------------------------------------------------
const CashCollectionCompany: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const uid = sessionStorage.getItem('uid') || '';
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [driver, setDriver] = useState<Driver | null>(null);
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [editingAmount, setEditingAmount] = useState<string>('');
    const [inputValues, setInputValues] = useState<Record<string, string>>({}); // Track input values for each booking
    const [receivedAmountCompany, setReceivedAmountCompany] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [bookingToApprove, setBookingToApprove] = useState<Booking | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string>('');
        const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    
    const [monthlyTotals, setMonthlyTotals] = useState<{
        totalAmount: string;
        totalReceived: string;
        totalBalances: string;
        totalProfit: string;  // Accept any string, including "0"
    }>({
        totalAmount: '0.00',
        totalReceived: '0.00',
        totalBalances: '0.00',
        totalProfit: '0.00',
    });
        const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
    const [totalSelectedBalance, setTotalSelectedBalance] = useState<string>('0');
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectAll, setSelectAll] = useState<boolean>(false);
    const db = getFirestore();
    const navigate = useNavigate();
    const [showAmountDiv, setShowAmountDiv] = useState(true); // Add state to show/hide the div
    const [totalBalances, setTotalBalances] = useState(0);
    const [clickedButtons, setClickedButtons] = useState<Record<string, boolean>>({});
    // Assuming `Booking` type has an `id` and `invoiceNumber` fields
    const [invoiceNumbers, setInvoiceNumbers] = useState<{ [key: string]: string }>({});

    const [netTotalAmountInHand, setNetTotalAmountInHand] = useState(0); // State to disable/enable fields
    const role = sessionStorage.getItem('role');
    const userName = sessionStorage.getItem('username');
    // --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    console.log('role', userName);
    console.log(filteredBookings, 'this is the filtered bookings');

    const sortedBookings = [...filteredBookings].sort((a, b) => {
        return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
    });
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
    // ---------------------------------------------------------new code-------------------------------------
    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const bookingsRef = collection(db, `user/${uid}/bookings`);

                // Query bookings where selectedCompany is equal to id
                const companyQuery = query(
                    bookingsRef,
                    where('selectedCompany', '==', id),
                    where('status', '==', 'Order Completed')
                    // Uncomment below if you want to order results by creation time
                    // orderBy('createdAt', 'desc')
                );

                const companySnapshot = await getDocs(companyQuery);

                // Map the results to an array of Booking objects
                const bookingsWithCompany = companySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Booking[];

                // Update state with company bookings only
                setBookings(bookingsWithCompany);
                setFilteredBookings(bookingsWithCompany); // Initially set filtered bookings to all fetched bookings
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
    }, [selectedBookings, bookings]);

    const updateBookingAmount = async (bookingId: string, newAmount: string) => {
        const parsedAmount = parseFloat(newAmount); // Convert string to number

        try {
            const bookingRef = doc(db, `user/${uid}/bookings`, bookingId);
            const bookingSnap = await getDoc(bookingRef);

            if (!bookingSnap.exists()) {
                console.error('Booking not found');
                return;
            }

            const booking = bookingSnap.data();

            // Ensure it’s a company booking
            if (booking.companyBooking !== true) {
                console.error('Not a company booking');
                return;
            }

            const amountToUse = parseFloat(booking.updatedTotalSalary?.toString());

            // Update the amount field in the Firestore document
            await updateDoc(bookingRef, { amount: amountToUse }); // Save as number

            // Update the state with the new amount
            setBookings((prevBookings) => prevBookings.map((booking) => (booking.id === bookingId ? { ...booking, amount: amountToUse } : booking)));

            // Update the total balance
            updateTotalBalance();
        } catch (error) {
            console.error('Error updating booking amount:', error);
        }
    };

    const handleEditClick = async (booking: Booking) => {
        try {
            // Update the 'approve' field to false in Firestore
            const bookingRef = doc(db, `user/${uid}/bookings`, booking.id);
            await updateDoc(bookingRef, { approve: false });

            // Update the local state to reflect the change
            setBookings((prevBookings) => prevBookings.map((b) => (b.id === booking.id ? { ...b, approve: false } : b)));

            scrollToModal();
        } catch (error) {
            console.error('Error updating booking approve field:', error);
        }
    };

    const handleSaveClick = async () => {
        if (editingBooking) {
            await updateBookingAmount(editingBooking.id, editingAmount);
            setEditingBooking(null);
        }
    };
// ---------------------------------------------------------------------------------------------------------------
    const calculateBalance = (updatedTotalSalary: string | number,  receivedAmountCompany: string | number,receivedUser?: string) => {
        if (receivedUser === "Staff") {
            return '0.00';
        }
            const parsedAmount = parseFloat(updatedTotalSalary.toString());
            const parsedReceivedAmount = parseFloat(receivedAmountCompany.toString());
console.log("parsedAmount",parsedAmount)
console.log("parsedReceivedAmount",parsedReceivedAmount)

            const balanceCompany = parsedAmount - parsedReceivedAmount;

            return balanceCompany.toFixed(2);
        
    };

    const calculateNetTotalAmountInHand = () => {
        if (!driver || bookings.length === 0) {
            console.log('Driver or bookings are not available yet.');
            return '0';
        }
    
        const totalBalances = bookings.reduce((acc, booking) => {
            if (booking.companyBooking) {
                const amountToUse = parseFloat(booking.updatedTotalSalary?.toString() || booking.amount?.toString() || '0');
                let receivedAmountCompany = parseFloat(booking.receivedAmountCompany?.toString() || '0');
                receivedAmountCompany = isNaN(receivedAmountCompany) ? 0 : receivedAmountCompany;
    
                // If OkClick is true, set balanceCompany to 0
                const balanceCompany = booking.OkClick
                    ? 0
                    : booking.approve
                    ? 0
                    : calculateBalance(amountToUse, receivedAmountCompany, booking.receivedUser);
    
                console.log(`Booking ID: ${booking.id}, Amount: ${amountToUse}, Received Amount: ${receivedAmountCompany}, Balance: ${balanceCompany}`);
                return acc + parseFloat(balanceCompany.toString());
            }
            return acc;
        }, 0);
    
        // Calculate net total amount in hand
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
    
            if (!bookings || bookings.length === 0) {
                console.log('Bookings are not loaded yet.');
                return; // Exit early if bookings are not loaded
            }
            if (!driver) {
                console.log('Driver data is not loaded yet.');
                return; // Exit early if driver data is not loaded
            }
    
            const calculatedNetTotalAmountInHand = parseFloat(calculateNetTotalAmountInHand()) || 0;
    
            const totalBalances = bookings.reduce((acc, booking) => {
                const amount = parseFloat(booking.updatedTotalSalary?.toString() || '0');
                const receivedAmountCompany = parseFloat(booking.receivedAmountCompany?.toString() || '0');
                return acc + (amount - receivedAmountCompany);
            }, 0);
    
            console.log('Updating driver balance:', {
                totalBalances,
                calculatedNetTotalAmountInHand,
            });
    
            setTotalBalances(totalBalances);
            setNetTotalAmountInHand(calculatedNetTotalAmountInHand);
    
            const driverRef = doc(db, `user/${uid}/driver`, id);
    
            if (calculatedNetTotalAmountInHand !== 0) {
                await updateDoc(driverRef, {
                    totalBalances,
                    netTotalAmountInHand: calculatedNetTotalAmountInHand,
                });
                console.log('Total balance and net total updated successfully.');
            } else {
                console.log('Net total amount in hand is zero; Firestore update skipped.');
            }
        } catch (error) {
            console.error('Error updating total balance:', error);
        }
    };
    
    const handleInvoiceChange = (bookingId: string, value: string) => {
        setInvoiceNumbers((prev) => ({
            ...prev,
            [bookingId]: value,
        }));
    };

    const handleInvoiceSubmit = (booking: Booking) => {
        const invoiceNumber = invoiceNumbers[booking.id]; // Get the entered invoice number
        if (!invoiceNumber) {
            alert('Please enter an invoice number.');
            return;
        }

        // Add logic to update the booking with the invoice number
        try {
            const bookingRef = doc(db, `user/${uid}/bookings`, booking.id);
            updateDoc(bookingRef, { invoiceNumber })
                .then(() => {
                    alert('Invoice added successfully.');
                    // Optionally, update the booking list after the submission
                    setBookings((prevBookings) => prevBookings.map((item) => (item.id === booking.id ? { ...item, invoiceNumber } : item)));
                })
                .catch((error) => {
                    console.error('Error adding invoice:', error);
                    alert('Error adding invoice.');
                });
        } catch (error) {
            console.error('Error submitting invoice:', error);
        }
    };

    const handleApproveClick = async (booking: Booking) => {
        const invoiceNumber = invoiceNumbers[booking.id]; // Get the entered invoice number
        if (!invoiceNumber) {
            alert('Please enter an invoice number before approving.');
            return;
        }
    
        try {
            const bookingRef = doc(db, `user/${uid}/bookings`, booking.id); // Reference to the specific booking
    
            // Update Firestore document to mark the booking as approved
        await updateDoc(bookingRef, {
            approve: true,
            invoiceNumber,
        });
    
            // Update local state
        setBookings((prevBookings) =>
            prevBookings.map((bookingItem) =>
                bookingItem.id === booking.id
                    ? {
                          ...bookingItem,
                          approve: true,
                          disabled: true,
                          invoiceNumber,
                      }
                    : bookingItem
            )
        );
    } catch (error) {
        console.error('Error approving booking:', error);
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
    const calculateTotalProfit = () => {
        const { positiveProfit, negativeProfit } = filteredBookings.reduce(
            (acc, booking) => {
                if (booking.actualProfit !== undefined) {
                    if (booking.actualProfit > 0) {
                        acc.positiveProfit += booking.actualProfit;
                    } else if (booking.actualProfit < 0) {
                        acc.negativeProfit += booking.actualProfit;
                    }
                }
                return acc;
            },
            { positiveProfit: 0, negativeProfit: 0 }
        );
    
        const totalProfit = positiveProfit + negativeProfit; // Subtract negative profit
        setMonthlyTotals((prevTotals) => ({
            ...prevTotals,
            totalProfit: totalProfit !== 0 ? totalProfit.toFixed(2) : "0",  // Type flexibility
        }));
    };
    const calculateMonthlyTotals = () => {
        const totalAmount = filteredBookings.reduce((acc, booking) => {
            if (booking.companyBooking) {
                const amountToUse = typeof booking.updatedTotalSalary === 'number' ? booking.updatedTotalSalary : parseFloat(booking.updatedTotalSalary || '0');
                return acc + (isNaN(amountToUse) ? 0 : amountToUse);
            }
            return acc;
        }, 0);

        const totalReceived = filteredBookings.reduce((acc, booking) => {
            if (booking.companyBooking) {
                const receivedAmountCompany = typeof booking.receivedAmountCompany === 'number' ? booking.receivedAmountCompany : parseFloat(booking.receivedAmountCompany || '0');
                return acc + (isNaN(receivedAmountCompany) ? 0 : receivedAmountCompany);
            }
            return acc;
        }, 0);

        const totalBalances = filteredBookings.reduce((acc, booking) => {
            if (booking.companyBooking) {
                const amountToUse = typeof booking.updatedTotalSalary === 'number' 
                    ? booking.updatedTotalSalary 
                    : parseFloat(booking.updatedTotalSalary || '0');
    
                const receivedAmountCompany = typeof booking.receivedAmountCompany === 'number' 
                    ? booking.receivedAmountCompany 
                    : parseFloat(booking.receivedAmountCompany || '0');
    
                // If OkClick is true, consider balanceCompany as 0
                const balanceCompany = booking.OkClick 
                    ? 0 
                    : amountToUse - receivedAmountCompany;
    
                return acc + (isNaN(balanceCompany) ? 0 : balanceCompany);
            }
            return acc;
        }, 0);
        const totalProfit = filteredBookings.reduce((acc, booking) => {
            const actualProfit = booking.actualProfit ?? 0;  // Use nullish coalescing
            return acc + actualProfit;
    }, 0);
        // Ensure results are valid numbers and coerce if necessary
        const safeTotalAmount = !isNaN(totalAmount) ? Number(totalAmount) : 0;
        const safeTotalReceived = !isNaN(totalReceived) ? Number(totalReceived) : 0;
        const safeTotalBalances = !isNaN(totalBalances) ? Number(totalBalances) : 0;
        const safeTotalProfit = !isNaN(totalProfit) ? totalProfit : 0;

        setMonthlyTotals({
            totalAmount: safeTotalAmount.toFixed(2),
            totalReceived: safeTotalReceived.toFixed(2),
            totalBalances: safeTotalBalances.toFixed(2),
            totalProfit: safeTotalProfit.toFixed(2) as string | "0",

        });
        calculateTotalProfit();

    };

    const calculateTotalSelectedBalance = () => {
        const totalBalances = selectedBookings.reduce((acc, bookingId) => {
            const booking = bookings.find((b) => b.id === bookingId);

            if (booking?.companyBooking) {
                const amountToUse = parseFloat(booking.updatedTotalSalary?.toString() || '0'); // Use the `amount` field for company bookings
                const balanceCompany = parseFloat(calculateBalance(amountToUse, booking.receivedAmountCompany || 0, booking.receivedUser)); // Use `receivedAmountCompany`
                return acc + balanceCompany;
            }

            return acc; // Skip non-company bookings
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
                const isCompanyBooking = true;
                return {
                    id: booking.id,
                    updatedTotalSalary: booking.updatedTotalSalary,
                    receivedAmountCompany: booking.receivedAmountCompany || 0,
                    balanceCompany: calculateBalance(booking.updatedTotalSalary, booking.receivedAmountCompany || 0),
                    dateTime: booking.dateTime,
                    fileNumber: booking.fileNumber,
                    driver: booking.companyName,
                };
            })
            .filter((booking) => booking !== null); // Filter out any null values

        navigate('/users/driver/driverdetails/cashcollectioncompany/selectiveReportInvoice', {
            state: {
                driverName: driver?.driverName || '',
                bookings: selectedBookingDetails,
                totalBalances: totalSelectedBalance,
            },
        });
    };

    const handleCheckboxChange = (bookingId: any) => {
        const booking = bookings.find((b) => b.id === bookingId);
        if (booking && (booking.approve || booking.disabled)) {
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
            const allBookingIds = filteredBookings.filter((booking) => !booking.approve && !booking.disabled).map((booking) => booking.id);
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
    // --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    const distributeReceivedAmount = (receivedAmountCompany: number, bookings: Booking[]) => {
        let remainingAmount = receivedAmountCompany;
        const selectedBookingIds: string[] = []; // Array to hold selected booking IDs

        const sortedBookings = [...bookings].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

        const updatedBookings = sortedBookings.map((booking) => {
  // Skip booking if receivedUser is 'Staff'
  if (booking.receivedUser === "Staff") {
    return booking; // No changes to the booking if it's "Staff"
}
            const amountToUse = parseFloat(booking.updatedTotalSalary?.toString() || '0');
            const bookingBalance = amountToUse - (booking.receivedAmountCompany || 0);

            if (remainingAmount > 0 && bookingBalance > 0) {
                const appliedAmount = Math.min(remainingAmount, bookingBalance);
                booking.receivedAmountCompany = (booking.receivedAmountCompany || 0) + appliedAmount;
                remainingAmount -= appliedAmount;
                selectedBookingIds.push(booking.id);

            }

            booking.amountToUse = amountToUse; // Add amountToUse for further processing
            return booking;
        });

        return { updatedBookings, selectedBookingIds }; // Return both updated bookings and selected booking IDs
    };

    const handleAmountReceiveChange = async (receivedAmountCompany: number) => {
        console.log('receivedAmountCompanyvv', receivedAmountCompany);
        try {
            const { updatedBookings, selectedBookingIds } = distributeReceivedAmount(receivedAmountCompany, bookings);
            setBookings(updatedBookings);
    //  total received amount applied
    const totalAppliedAmount = updatedBookings.reduce((acc, booking) => {
        const receivedAmountCompany = booking.receivedAmountCompany || 0;
        console.log(`Processing booking:`, booking); // Log each booking
        console.log(`Current booking receivedAmount:`, receivedAmountCompany); // Log the received amount for the current booking
        console.log(`Accumulator before adding:`, acc); // Log the accumulator before adding
        return acc + receivedAmountCompany; // Return the updated accumulator
    }, 0);         
       setReceivedAmountCompany(totalAppliedAmount.toString()); // Update input field with the total applied amount

            const batch = writeBatch(db);
            updatedBookings.forEach((booking) => {
                const bookingRef = doc(db, `user/${uid}/bookings`, booking.id);
                batch.update(bookingRef, {
                    receivedAmountCompany: booking.receivedAmountCompany ?? 0,
                    balanceCompany: String(calculateBalance(booking.amountToUse ?? 0, booking.receivedAmountCompany ?? 0, booking.receivedUser )),
                    role: role || 'unknown',
                });
            });

                  const usersQuery = query(collection(db, `user/${uid}/users`), where('userName', '==', userName));
                           const querySnapshot = await getDocs(usersQuery);
                   
                           querySnapshot.forEach((userDoc) => {
                               // Update staff received with multiple selectedBookingIds
                               updateStaffReceived(userDoc.id, uid, receivedAmountCompany, selectedBookingIds);
                           });
                   
                           await batch.commit();
                           updateTotalBalance();
                           setShowAmountDiv(false);
                           if (role === 'admin') {
                               await handleAmountReceivedChangeWithoutAuth(selectedBookingIds[0], receivedAmountCompany.toString());
                           }
                       } catch (error) {
                           console.error('Error during handleAmountReceiveChange:', error);
                       }
                   };
                   
                   const updateStaffReceived = async (
                       staffId: string,
                       uid: string,
                       receivedAmountCompany: number,
                       selectedBookingIds: string[]
                   ) => {
                       try {
                           const db = getFirestore();
                           const staffReceivedRef = collection(db, `user/${uid}/users/${staffId}/staffReceived`);
                           
                           await addDoc(staffReceivedRef, {
                               amount: receivedAmountCompany.toString(),
                               date: new Date().toISOString(),
                               selectedBookingIds, // Store the array of booking IDs
                           });
                           console.log("Staff received details updated successfully.");
                       } catch (error) {
                           console.error("Error updating staff received details:", error);
                       }
                   };
                   
    const handleInputChange = (bookingId: string, value: string) => {
        setInputValues((prev) => ({
            ...prev,
            [bookingId]: value === '' ? '0' : value,  // Set to '0' if empty
        }));
    };
 const getStaffId = async (userName: string, password: string, uid: string) => {
        const db = getFirestore();
        const usersRef = collection(db, `user/${uid}/users`);
        
        const querySnapshot = await getDocs(usersRef);
        const userDoc = querySnapshot.docs.find(doc => {
            const data = doc.data();
            return data.userName === userName && data.password === password && data.role === 'staff';
        });
    
        return userDoc ? userDoc.id : null; // Return staffId or null if not found
    };
    // ------------------------------------------------------------------------------------
    const handleOkClick = async (bookingId: string) => {
        const receivedAmountCompany = inputValues[bookingId]; // Get the input value for the specific booking
        if (!receivedAmountCompany) {
            console.error('No amount entered.');
            return;
        }
    
        setLoadingStates((prevState) => ({ ...prevState, [bookingId]: true }));
    
        try {
            const role = sessionStorage.getItem('role'); // Assuming role is stored in sessionStorage
            const userName = sessionStorage.getItem('username');
            const password = sessionStorage.getItem('password');
    
            // Check if the role is 'staff', then proceed with username and password operations
            if (role === 'staff') {
                if (!userName || !password) {
                    console.error('Username or password is missing.');
                    return;
                }
    
                // Pass the missing arguments (username and password) to the function
                await handleAmountReceivedChange(bookingId, receivedAmountCompany, userName, password);
            } else if (role === 'admin') {
                // If role is admin, skip username and password operations
                await handleAmountReceivedChangeWithoutAuth(bookingId, receivedAmountCompany);
            } else {
                console.error('Role is neither staff nor admin.');
            }
    
            // Fetch the booking data once (not twice) and directly calculate profit
            const bookingRef = doc(db, `user/${uid}/bookings`, bookingId);
            const bookingSnap = await getDoc(bookingRef);
            if (!bookingSnap.exists()) {
                throw new Error('Booking not found in Firestore.');
            }
    
            const updatedBooking = bookingSnap.data();
    
            // Calculate profit using updated values
            const receivedAmount = parseFloat(updatedBooking.receivedAmountCompany?.toString() || '0');
            const totalSalary = parseFloat(updatedBooking.updatedTotalSalary?.toString() || '0');
            const profitAmount = receivedAmount - totalSalary;
    
            const totalDriverSalary = parseFloat(updatedBooking.totalDriverSalary?.toString() || '0');
    
            // Calculate Actual Profit (After Deducting Driver Salary)
            const actualProfit = profitAmount - totalDriverSalary;
    
            console.log("Total Driver Salary", totalDriverSalary);
            console.log("Actual Profit", actualProfit);
    
            // Update Firestore booking document
            await updateDoc(bookingRef, {
                profit: profitAmount,
                actualProfit: actualProfit,
                balanceCompany: 0, // Clear balance
                OkClick: true,     // Mark as OK clicked
            });
    
            // Immediately update the state with the calculated values
            setBookings((prevBookings) =>
                prevBookings.map((b) =>
                    b.id === bookingId
                        ? {
                              ...b,
                              profit: profitAmount,
                              actualProfit: actualProfit,
                              balanceCompany: '0',
                              OkClick: true,
                          }
                        : b
                )
            );
        } catch (error) {
            console.error('Error processing payment:', error);
        } finally {
            setLoadingStates((prevState) => ({ ...prevState, [bookingId]: false }));
        }
    };
    
    const handleAmountReceivedChange = async (bookingId: string, receivedAmountCompany: string, userName: string, password: string) => {
        try {
            if (!uid || typeof uid !== "string") throw new Error("User ID is invalid.");
            if (!bookingId || typeof bookingId !== "string") throw new Error("Booking ID is invalid.");
        

          


            const receivedAmountToUse = parseFloat(receivedAmountCompany); // Parse the received amount for company bookings
            if (isNaN(receivedAmountToUse) || receivedAmountToUse < 0) {
                console.error('Invalid received amount.');
                return;
            }
            // Fetch staffId based on username and password
                       const staffId = await getStaffId(userName, password, uid);
                       console.log("staffId",staffId)
                       if (!staffId) {
                           console.error("Staff not found.");
                           return;
                       }
                 // Continue with the existing logic to update the booking and driver data
                 const booking = bookings.find((b) => b.id === bookingId);
                 if (!booking) throw new Error("Booking not found.");
                 if (!booking.selectedDriver) throw new Error("Selected driver is not defined.");
             
                       // Update the staffReceived collection
                       await updateStaffReceived(staffId, uid, receivedAmountToUse, [bookingId]);
                   
                     
                       const bookingRef = doc(db, `user/${uid}/bookings`, bookingId);
                       const driverRef = doc(db, `user/${uid}/driver`, booking.selectedDriver);
                   
                       await runTransaction(db, async (transaction) => {
                           const bookingDoc = await transaction.get(bookingRef);
                           if (!bookingDoc.exists()) throw new Error("Booking does not exist.");
                       
                           const driverDoc = await transaction.get(driverRef);
                           if (!driverDoc.exists()) throw new Error("Driver does not exist.");
                       
                           const currentNetTotal = parseFloat(driverDoc.data().netTotalAmountInHand || 0);
                           const newNetTotal = currentNetTotal + receivedAmountToUse;
                       
                           const balanceCompany = calculateBalance(
                               bookingDoc.data().amount || 0,
                               receivedAmountToUse,
                               bookingDoc.data().receivedUser
                           );
                       
                           transaction.update(bookingRef, {
                            receivedAmountCompany: receivedAmountToUse,
                               balanceCompany: balanceCompany,
                           });
                       
                           transaction.update(driverRef, {
                               netTotalAmountInHand: newNetTotal,
                           });
                       });
                   
                       setBookings(
                           bookings.map((b) =>
                               b.id === bookingId
                                   ? {
                                         ...b,
                                         receivedAmountCompany: receivedAmountToUse,
                                         balanceCompany: calculateBalance(b.amount, receivedAmountToUse, b.receivedUser),
                                     }
                                   : b
                           )
                       );
                   
                       await updateTotalBalance();
                   
                       setClickedButtons((prevState) => ({
                           ...prevState,
                           [bookingId]: true,
                       }));
                   } catch (error) {
                       console.error("Error updating received amount:", error);
                   }
               };
               
               // If the role is 'admin', you can define a method that skips the username and password logic
               const handleAmountReceivedChangeWithoutAuth = async (bookingId: string, receivedAmountCompany: string) => {
                   try {
                       if (!uid || typeof uid !== "string") throw new Error("User ID is invalid.");
                       if (!bookingId || typeof bookingId !== "string") throw new Error("Booking ID is invalid.");
                   
                       const receivedAmountToUse = parseFloat(receivedAmountCompany);
                       if (isNaN(receivedAmountToUse)) {
                           console.error("Invalid received amount.");
                           return;
                       }
                   
                       // Update the staffReceived collection without username/password
                       await updateStaffReceivedWithoutAuth(bookingId, receivedAmountToUse, uid);
                   
                       // Continue with the existing logic to update the booking and driver data
                       const booking = bookings.find((b) => b.id === bookingId);
                       if (!booking) throw new Error("Booking not found.");
                       if (!booking.selectedDriver) throw new Error("Selected driver is not defined.");
                   
                       const bookingRef = doc(db, `user/${uid}/bookings`, bookingId);
                       const driverRef = doc(db, `user/${uid}/driver`, booking.selectedDriver);
                   
                       await runTransaction(db, async (transaction) => {
                           const bookingDoc = await transaction.get(bookingRef);
                           if (!bookingDoc.exists()) throw new Error("Booking does not exist.");
                       
                           const driverDoc = await transaction.get(driverRef);
                           if (!driverDoc.exists()) throw new Error("Driver does not exist.");
                       
                           const currentNetTotal = parseFloat(driverDoc.data().netTotalAmountInHand || 0);
                           const newNetTotal = currentNetTotal + receivedAmountToUse;
                       
                           const balanceCompany = calculateBalance(
                               bookingDoc.data().amount || 0,
                               receivedAmountToUse,
                               bookingDoc.data().receivedUser
                           );
                       
                           transaction.update(bookingRef, {
                            receivedAmountCompany: receivedAmountToUse,
                               balanceCompany: balanceCompany,
                           });
                       
                           transaction.update(driverRef, {
                               netTotalAmountInHand: newNetTotal,
                           });
                       });
                   
                       setBookings(
                           bookings.map((b) =>
                               b.id === bookingId
                                   ? {
                                         ...b,
                                         receivedAmountCompany: receivedAmountToUse,
                                         balanceCompany: calculateBalance(b.amount, receivedAmountToUse, b.receivedUser),
                                     }
                                   : b
                           )
                       );
                   
                       await updateTotalBalance();
                   
                       setClickedButtons((prevState) => ({
                           ...prevState,
                           [bookingId]: true,
                       }));
                   } catch (error) {
                       console.error("Error updating received amount:", error);
                   }
               };
               const updateStaffReceivedWithoutAuth = async (
                   bookingId: string,
                   receivedAmountCompany: number,
                   uid: string
               ) => {
                   try {
                       const staffReceivedRef = doc(db, `user/${uid}/adminReceived`, bookingId);
               
                       await setDoc(
                           staffReceivedRef,
                           {
                               bookingId:bookingId,
                               receivedAmount: receivedAmountCompany,
                               updatedAt: new Date(),
                           },
                           { merge: true } // Merge if the document exists
                       );
               
                       console.log("Staff received data updated successfully (no auth required).");
                   } catch (error) {
                       console.error("Error updating staff received data without auth:", error);
                       throw error; // Re-throw for error handling
                   }
               };
                 useEffect(() => {
                       const term = searchTerm.toLowerCase();
                       const filtered = bookings.filter(
                         (record) =>
                           (record.fileNumber?.toLowerCase().includes(term) ?? false) ||
                           (record.vehicleNumber?.toLowerCase().includes(term) ?? false) ||
                           (record.dateTime?.toLowerCase().includes(term) ?? false)
                       );
                       setFilteredBookings(filtered);
                     }, [searchTerm, bookings]);
               
    useEffect(() => {
        // Initialize the invoice numbers based on the bookings
        const initialInvoiceNumbers: { [key: string]: string } = bookings.reduce((acc, booking) => {
            // Ensure each booking.id is set to the corresponding invoice number
            acc[booking.id] = booking.invoiceNumber || ''; // Use empty string if no invoice number
            return acc;
        }, {} as { [key: string]: string }); // Explicitly type acc here
        setInvoiceNumbers(initialInvoiceNumbers);
    }, [bookings]); // Re-run this effect when bookings change

    return (
        <div className="container mx-auto my-10 p-5 bg-gray-50 shadow-lg rounded-lg">
            <h1 className="text-4xl font-extrabold mb-6 text-center text-gray-900 shadow-md p-3 rounded-lg bg-gradient-to-r from-indigo-300 to-red-300">Cash Collection Report</h1>

            {driver ? (
                <>
                    <div className="container-fluid mb-5">
                        <div className="flex flex-wrap text-center md:text-left">
                            <div className="w-full md:w-1/2 mb-4 p-6 bg-white shadow-lg rounded-lg transition-transform duration-300 hover:scale-105">
                                <h2 className="text-2xl font-bold text-gray-800 mb-2 border-b-2 border-gray-200 pb-2">
                                    🏢 Company: <span className="text-indigo-600">{driver.driverName}</span>
                                </h2>

                                <div className="mt-4">
                                    <p className="text-lg text-gray-700">
                                        📞 <span className="font-medium">Phone:</span> {driver.personalphone}
                                    </p>
                                </div>
                            </div>

                            <div className="w-[560px] h-[165px] ml-6 flex justify-center md:justify-end p-2 bg-white rounded-lg shadow-lg transform transition-all duration-300 hover:shadow-xl hover:scale-105">
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                                    <span className="text-4xl mr-2">💵</span> {/* Larger icon for emphasis */}
                                    Total Amount Held By The Company:
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
   
                                            {Array.from({ length: 11 }, (_, i) => {
                                                const year = new Date().getFullYear() - 5 + i; 
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
                        <div className="bg-gradient-to-r from-green-100 to-green-200 p-6 shadow-lg rounded-lg hover:shadow-xl transform hover:scale-105 transition-transform">
                            <div className="flex items-center space-x-4">
                                <div className="text-4xl text-green-600">
                                    <i className="fas fa-receipt"></i>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Total Collected Amount :</h3>
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
                                    <h3 className="text-xl font-bold text-gray-800">Balance Amount To Collect :</h3>
                                    <p className="text-gray-700 text-lg">{monthlyTotals.totalBalances}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-6 shadow-lg rounded-lg hover:shadow-xl transform hover:scale-105 transition-transform">
    <div className="flex items-center space-x-4">
        <div className="text-4xl text-green-600">
            <i className="fas fa-hand-holding-usd"></i>
        </div>
        <div>
            <h3 className="text-xl font-bold text-gray-800">Total Profit :</h3>
            <p className={`text-lg ${parseFloat(monthlyTotals.totalProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
    ₹{monthlyTotals.totalProfit}
</p>

        </div>
    </div>
</div>

                    </div>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            padding: '10px',
                            borderRadius: '5px',
                            border: '1px solid #ccc',
                            width: '100%',
                            boxSizing: 'border-box',
                            marginBottom: '10px',
                        }}
                    />
                    {selectedBookings.length > 0 && totalSelectedBalance !== '0.00' && showAmountDiv && (
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
                                        type="text"
                                        value={receivedAmountCompany}
                                        onChange={(e) => setReceivedAmountCompany(e.target.value)}
                                        placeholder="Enter Amount"
                                        className="border border-gray-300 rounded-lg p-2 mt-2"
                                    />
                                    <button onClick={() => handleAmountReceiveChange(parseFloat(receivedAmountCompany))} className="mt-2 bg-blue-500 text-white rounded-lg px-4 py-2">
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
                                    <th>#</th>
                                    <th className={styles.tableCell}>
                                        <div className={styles.selectAllContainer}>
                                            <label>Select All</label>

                                            <input type="checkbox" checked={selectAll} onChange={handleSelectAllChange} />
                                        </div>
                                    </th>
                                    <th className={styles.tableCell}>Date</th>
                                    <th className={styles.tableCell}>File Number</th>
                                    <th className={styles.tableCell}>Customer Vehicle Number</th>
                                    <th className={styles.tableCell}>PayableAmount By Company</th>
                                    <th className={styles.tableCell}>Received Amount From Company</th>

                                    <th className={styles.tableCell}>Balance</th>
                                    <th className={styles.tableCell}>InvoiceNumber</th>

                                    <th className={styles.tableCell}>Approve</th>
                                    <th className={styles.tableCell}>View More</th>
                                    <th className={styles.tableCell}>Profit And Loss</th>
                                    <th className={styles.tableCell}>Actual Profit(After Deduct DriverSalary)</th>

                                    <th className={styles.tableCell}>Edit</th>
                                </tr>
                            </thead>
                            <tbody className={styles.tableBody}>
                                {/* ----------------------------------------------------- */}

                                {sortedBookings.map((booking, index) => {
                                    // Determine which receivedAmount to use
                                    const effectiveReceivedAmount = booking.receivedAmountCompany;

                                    return (
                                        <tr key={booking.id} className={`${styles.tableRow} ${booking.approve ? 'bg-gray-200 text-gray-500' : 'bg-white'}`}>
                                            <td>{index + 1}</td>
                                            <td className={`${styles.tableCell} text-center`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedBookings.includes(booking.id)}
                                                    onChange={() => handleCheckboxChange(booking.id)}
                                                    disabled={booking.approve} // Optionally disable checkbox visually
                                                />
                                            </td>
                                            <td className={styles.responsiveCell}>{format(parse(booking.dateTime, 'dd/MM/yyyy, h:mm:ss a', new Date()), 'dd/MM/yyyy, h:mm:ss a')}</td>
                                            <td className={styles.responsiveCell}>{booking.fileNumber}</td>
                                            <td className={styles.responsiveCell}>{booking.vehicleNumber}</td>

                                            <td className={styles.responsiveCell}>{booking.updatedTotalSalary}</td>
                                            <td key={booking.id} className={styles.responsiveCell}>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    {(booking.companyBooking && driver?.companyName !== 'Company') || booking.receivedUser === 'Staff' ? (
                                                        <span style={{ color: 'red', fontWeight: 'bold' }}>Not Need</span>
                                                    ) : (
                                                        <>
                                                            <input
                                                                type="text"
                                                                value={inputValues[booking.id] || booking.receivedAmountCompany || ''}
                                                                onChange={(e) => handleInputChange(booking.id, e.target.value)}
                                                                style={{
                                                                    border: '1px solid #d1d5db',
                                                                    borderRadius: '0.25rem',
                                                                    padding: '0.25rem 0.5rem',
                                                                    marginRight: '0.5rem',
                                                                }}
                                                                disabled={booking.approve}
                                                                min="0"
                                                            />
                                                            <button
                                                                onClick={() => handleOkClick(booking.id)}
                                                                disabled={booking.approve || loadingStates[booking.id]} // Disable if loading
                                                                style={{
                                                                    backgroundColor:
                                                                        Number(
                                                                            calculateBalance(
                                                                                parseFloat(booking.updatedTotalSalary?.toString() || '0'),
                                                                                inputValues[booking.id] || booking.receivedAmountCompany || '0',
                                                                                booking.receivedUser
                                                                            )
                                                                        ) === 0
                                                                            ? '#28a745' // Green for zero balance
                                                                            : '#dc3545', // Red for non-zero balance
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '0.25rem',
                                                                    padding: '0.5rem',
                                                                    cursor: 'pointer',
                                                                }}
                                                            >
    {loadingStates[booking.id] ? 'Loading...' : 'OK'}
    </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>

                                            <td
                                                className={styles.responsiveCell}
                                                style={{
                                                    backgroundColor:
                                                        Number(
                                                            calculateBalance(
                                                                parseFloat(booking.updatedTotalSalary?.toString() || booking.amount?.toString() || '0'),
                                                                effectiveReceivedAmount || 0,
                                                                booking.receivedUser
                                                            )
                                                        ) === 0
                                                            ? '#e6ffe6' // Light green for zero balance
                                                            : '#ffe6e6', // Light red for non-zero balance
                                                }}
                                            >
                                                {calculateBalance(
                                                    parseFloat(booking.updatedTotalSalary?.toString() || booking.amount?.toString() || '0'),
                                                    effectiveReceivedAmount || 0,
                                                    booking.receivedUser
                                                )}{' '}
                                            </td>
                                            <td style={{ display: 'flex', alignItems: 'center' }}>
                                                <input
                                                    type="text"
                                                    value={invoiceNumbers[booking.id] || ''}
                                                    onChange={(e) => handleInvoiceChange(booking.id, e.target.value)}
                                                    disabled={booking.approve}
                                                    placeholder="Enter Invoice Number"
                                                    style={{
                                                        padding: '5px',
                                                        borderRadius: '4px',
                                                        border: '1px solid #ccc',
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleInvoiceSubmit(booking)}
                                                    disabled={booking.approve || !invoiceNumbers[booking.id]} // Disable if approve is true or no invoice number
                                                    style={{
                                                        padding: '15px 10px',
                                                        marginLeft: '2px',
                                                        borderRadius: '4px',
                                                        border: '1px solid #ccc',
                                                        backgroundColor: '#007BFF',
                                                        color: 'white',
                                                        cursor: booking.approve || !invoiceNumbers[booking.id] ? 'not-allowed' : 'pointer',
                                                        opacity: booking.approve ? 0.6 : 1,
                                                    }}
                                                >
                                                    Add
                                                </button>
                                            </td>

                                            <td>
                                                <button
                                                    onClick={() => handleApproveClick(booking)}
                                                    className={`${booking.approve ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'} hover:${
                                                        booking.approve ? 'bg-green-300' : 'bg-red-300'
                                                    } ${booking.approve ? 'cursor-not-allowed' : 'cursor-pointer'} px-4 py-2 rounded`}
                                                    disabled={booking.approve}
                                                >
                                                    {booking.approve ? 'Approved' : 'Approve'}
                                                </button>
                                            </td>
                                            <td>
                                                <Link
                                                    href={`/bookings/newbooking/viewmore/${booking.id}`}
                                                    style={{
                                                        padding: '5px 10px',
                                                        color: '#fff',
                                                        backgroundColor: '#007bff',
                                                        borderRadius: '5px',
                                                        textDecoration: 'none',
                                                        display: 'inline-block',
                                                        transition: 'background-color 0.3s',
                                                        cursor: booking.approve ? 'not-allowed' : 'pointer', // Disable cursor
                                                        opacity: booking.approve ? 0.6 : 1, // Change opacity to show disabled state
                                                    }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
                                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
                                                    onClick={(e) => {
                                                        if (booking.approve) {
                                                            e.preventDefault(); // Prevent click if approved
                                                        }
                                                    }}
                                                >
                                                    View More
                                                </Link>
                                            </td>
                                            <td
  className={booking.profit !== undefined && booking.profit > 0 ? 'text-green-600' 
            : booking.profit !== undefined && booking.profit < 0 ? 'text-red-600' 
            : 'text-gray-600'}
>
  {booking.profit !== undefined 
    ? (booking.profit > 0 
        ? `Gain: ₹${booking.profit}` 
        : `Loss: ₹${booking.profit}`) 
    : 'No Profit/Loss'}
</td>
<td
  className={
    booking.actualProfit !== undefined && booking.actualProfit > 0
      ? 'text-green-600'
      : booking.actualProfit !== undefined && booking.actualProfit < 0
      ? 'text-red-600'
      : 'text-gray-600'
  }
>
  {booking.actualProfit !== undefined
    ? booking.actualProfit > 0
      ? `Gain: ₹${booking.actualProfit}`
      : `Loss: ₹${booking.actualProfit}`
    : 'No Profit/Loss'}
</td>


                                            {booking.approve && (
                                                <td>
                                                    <button onClick={() => handleEditClick(booking)}>
                                                        <IconEdit />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td className={styles.tableCell}></td>
                                    <td className={styles.tableCell}></td>
                                    <td className={styles.tableCell}></td>
                                    <td className={styles.tableCell}></td>
                                    <td className={styles.tableCell}></td>
                                    <td className={styles.tableCell}></td>

                                    {driver.companyName !== 'Company' && <td className={styles.tableCell}></td>}
                                    <td className={styles.tableCell} style={{ color: 'blue', fontSize: '18px' }}>
                                        Totals{' '}
                                    </td>
                                    <td className={styles.tableCell} style={{ color: 'blue', fontSize: '18px' }}>
                                        {Number(
                                            filteredBookings.reduce((total, booking) => {
                                                if (booking.companyBooking) {
                                                    // Process only companyBooking cases
                                                    const amountToUse = parseFloat(booking.updatedTotalSalary?.toString() || '0');
                                                    const receivedAmountCompany = parseFloat(booking.receivedAmountCompany?.toString() || '0');

                                                      // Calculate the balance for this booking
                let balanceCompany = amountToUse - receivedAmountCompany;

                // Override balanceCompany to 0 if OkClick is true
                if (booking.OkClick) {
                    balanceCompany = 0;
                }
                                                    // Accumulate the total balance
                                                    return total + (isNaN(balanceCompany) ? 0 : balanceCompany);
                                                }

                                                return total; // Skip non-companyBooking cases
                                            }, 0)
                                        ).toFixed(2) || 0}
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
                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default CashCollectionCompany;
