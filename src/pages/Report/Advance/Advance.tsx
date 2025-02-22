import React, { useEffect, useState } from 'react';
import {
    getFirestore,
    collection,
    doc,
    query,
    where,
    getDocs,
    addDoc,
    Timestamp,
    onSnapshot,
    updateDoc,
    getDoc,
    orderBy,
    deleteDoc,
    writeBatch,
    serverTimestamp,
    setDoc,
    limit,
} from 'firebase/firestore';
import './Advance.css';
import ConfirmationModal from './ConfirmationModal';
import ConfirmationModal1 from './ConfirmationModal1';
import CashCollectionTable from './CasCollectionTable';
import ReceiveDetailsTable from './ReceiveDetailsTable ';
interface Booking {
    id: string;
    driverId: string;
    createdAt: Date;
    amount: number;
    driverName?: string;
    totalDriverSalary: string;
    transferedSalary: number;
    status: string;
    receivedAmount?: number;
    companyBooking: boolean;
    bookingDate: string;
    selectedDriver?: string;
    driver?: string; // Add this if `driver` exists in Firestore
    fileNumber?: string;
    receivedUser?: string;
}
interface DataType {
    driver: string;
    fileNumber: string[];
    amount: number;
    receivedAmount: number;
    balance: number;
}

interface Driver {
    id: string;
    driverName: string;
    companyName: string;
}

interface AdvanceData {
    id: string;
    driverName: string;
    advancePaymentDate: string;
    advance: number;
    type: string;
    advanceDataId: string;
    driverId: string;
    addedAdvance: number;
}

const Advance: React.FC = () => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [selectedDriver, setSelectedDriver] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('');
    const [date, setDate] = useState<string>('');
    const [amount, setAmount] = useState<number | ''>('');
    const [advanceDetails, setAdvanceDetails] = useState<AdvanceData[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]); // State for bookings
    const [editAdvanceId, setEditAdvanceId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('receiveDetails');
    const [editAmount, setEditAmount] = useState<number | ''>('');
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [receivedAmount, setReceivedAmount] = useState<number | ''>('');
    const [isModalOpen1, setIsModalOpen1] = React.useState(false);
    const [tableData, setTableData] = useState<DataType[]>([]); // Initialize tableData with an empty array
    const [receivedAmountToSettle, setReceivedAmountToSettle] = useState(0);
    const [netTotalAmountInHand, setNetTotalAmountInHand] = useState(0);
    // --------------------------------------------
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid') || '';
    const role = sessionStorage.getItem('role');
    const userName = sessionStorage.getItem('username');
    console.log('uid', role);

    const [isModalOpen, setIsModalOpen] = React.useState(false);
    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const bookingsRef = collection(db, `user/${uid}/bookings`);
                const q = query(bookingsRef, where('status', '==', 'Order Completed'), where('companyBooking', '==', false));
                const querySnapshot = await getDocs(q);
                const bookingsList: Booking[] = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...(doc.data() as Omit<Booking, 'id'>),
                }));
                console.log('bookingsList', bookingsList);

                setBookings(bookingsList);
            } catch (error) {
                console.error('Error fetching bookings:', error);
            }
        };

        fetchBookings();
    }, [db, uid]);
    useEffect(() => {
        const fetchAdvanceAndCalculate = async () => {
            if (selectedType === 'cashCollection' && selectedDriver) {
                try {
                    // Fetch advance from Firestore
                    const driverRef = doc(db, `user/${uid}/driver`, selectedDriver);
                    const driverSnap = await getDoc(driverRef);
                    const advance = driverSnap.exists() ? parseFloat(driverSnap.data().advance || 0) : 0;

                    console.log('Advance:', advance);

                    // Ensure bookings have been fetched
                    if (bookings.length === 0) {
                        console.log('Bookings not available yet');
                        return;
                    }

                    // Filter bookings for the selected driver
                    const filteredBookings = bookings.filter((booking) => booking.selectedDriver === selectedDriver);

                    console.log('Filtered Bookings:', filteredBookings);

                    // Calculate total salary and total received
                    const totalSalary = filteredBookings.reduce((sum, booking) => sum + (booking.receivedUser === 'Staff' ? 0 : Number(booking.amount ?? 0)), 0);

                    const totalReceived = filteredBookings.reduce((sum, booking) => sum + (booking.receivedUser === 'Staff' ? 0 : Number(booking.receivedAmount ?? 0)), 0);

                    console.log('Total Salary:', totalSalary);
                    console.log('Total Received:', totalReceived);
                    console.log('advance:', advance);

                    // Compute final value
                    setNetTotalAmountInHand(advance + (totalSalary - totalReceived));
                } catch (error) {
                    console.error('Error fetching advance amount:', error);
                }
            } else {
                setNetTotalAmountInHand(0);
            }
        };

        if (bookings.length > 0) {
            fetchAdvanceAndCalculate();
        }
    }, [selectedType, selectedDriver, bookings, db, uid]);
// -----------------------
const distributeReceivedAmount = (receivedAmount: number | string, bookings: Booking[]) => {
    let remainingAmount = Number(receivedAmount); // Ensure it's a number
        const selectedBookingIds: string[] = [];

        const sortedBookings = bookings
            .filter(
                (booking) => booking.status === 'Order Completed' && booking.companyBooking === false && booking.selectedDriver === selectedDriver &&  booking.amount > Number(booking.receivedAmount || 0)
            )
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const updatedBookings = sortedBookings.map((booking) => {
            const bookingBalance = booking.amount -  Number(booking.receivedAmount || 0);

            if (remainingAmount > 0 && bookingBalance > 0) {
                const appliedAmount = Math.min(remainingAmount, bookingBalance);
                booking.receivedAmount = Number(booking.receivedAmount || 0) + appliedAmount;
                remainingAmount -= appliedAmount;
                selectedBookingIds.push(booking.id);
            }
            return booking;
        });
        // After distributing the amount, if there's remaining, deduct it from the driver's advance
        if (remainingAmount > 0) {
            deductRemainingFromAdvance(remainingAmount);
        }
        setTableData(
            updatedBookings.map((booking) => ({
                driver: booking.selectedDriver || 'Unknown Driver',
                fileNumber: booking.id ? [booking.id] : ['Unknown'],
                amount: booking.amount,
                receivedAmount: Number(booking.receivedAmount || 0),
                balance: booking.amount - Number(booking.receivedAmount || 0),
            }))
        );

        return { updatedBookings, selectedBookingIds, tableData };
    };
    const handleOpenModal1 = (amount: number) => {
        setReceivedAmountToSettle(amount);
        setIsModalOpen1(true);
    };
    const handleReceiveSettle = async (receivedAmount: number | string) => {
        console.log('receivedAmount', receivedAmount);
        const collectedDetailsRef = collection(db, `user/${uid}/collectedDetails`); // New Collection

        try {
            const { updatedBookings, selectedBookingIds } = distributeReceivedAmount(Number(receivedAmount), bookings);
            console.log('updatedBookings', updatedBookings);
            setBookings(updatedBookings);

            const batch = writeBatch(db);

            updatedBookings.forEach((booking) => {
                const bookingRef = doc(db, `user/${uid}/bookings`, booking.id);
                const receivedDetailsRef = collection(db, `user/${uid}/receivedDetails`); // New collection

                const currentReceivedAmount = Number(booking.receivedAmount ?? 0);
                const balance = (booking.amount - currentReceivedAmount).toString();

                if (selectedBookingIds.includes(booking.id)) {
                    const newReceivedDetail = {
                        bookingId: booking.id, // Add booking ID
                        driver: booking.driver || 'Unknown Driver',
                        fileNumber: booking.fileNumber, // Assuming booking.id is the file number
                        amount: booking.amount,
                        receivedAmount: Number(booking.receivedAmount || 0),
                        balance: balance,
                        
                        timestamp: new Date(), // Use a consistent format
                    };

                    // Add a new document to the `receivedDetails` collection
                    batch.set(doc(receivedDetailsRef), newReceivedDetail);
                }

                // Update the main booking document with the new receivedAmount and balance
                batch.update(bookingRef, {
                    receivedAmount: Number(booking.receivedAmount),
                    balance: balance,
                    role: role || 'unknown',
                });
            });
            let driverName = 'Unknown Driver';
            if (selectedDriver) {
                const driverDocRef = doc(db, `user/${uid}/driver`, selectedDriver);
                const driverSnap = await getDoc(driverDocRef);
                if (driverSnap.exists()) {
                    driverName = driverSnap.data().driverName || 'Unknown Driver';
                }
            }
            const newCollectionEntry = {
                driver: selectedDriver || 'Unknown Driver',
                driverName: driverName, // Include driver name

                receivedAmount: Number(receivedAmount),
                date: new Date().toLocaleDateString(), // Formatted Date
                time: new Date().toLocaleTimeString(), // Formatted Time
                timestamp: new Date(), // Full Timestamp
            };

            await addDoc(collectedDetailsRef, newCollectionEntry);
    
            // Update staff received details
            const usersQuery = query(collection(db, `user/${uid}/users`), where('userName', '==', userName));
            const querySnapshot = await getDocs(usersQuery);

            querySnapshot.forEach((userDoc) => {
                updateStaffReceived(userDoc.id, uid, Number(receivedAmount), selectedBookingIds);
            });

            await batch.commit();
            // -------------------------------------------
            setTableData(tableData);
            setSelectedDriver('');
            setReceivedAmount('');

            // window.location.reload();
        } catch (error) {
            console.error('Error during handleAmountReceiveChange:', error);
        }
    };

    const updateStaffReceived = async (staffId: string, uid: string, receivedAmount: number, selectedBookingIds: string[]) => {
        try {
            const db = getFirestore();
            const staffReceivedRef = collection(db, `user/${uid}/users/${staffId}/staffReceived`);

            await addDoc(staffReceivedRef, {
                amount: receivedAmount.toString(),
                date: new Date().toISOString(),
                selectedBookingIds, // Store the array of booking IDs
            });
            console.log('Staff received details updated successfully.');
        } catch (error) {
            console.error('Error updating staff received details:', error);
        }
    };
    // -----------------------------------------------
    const deductRemainingFromAdvance = async (remainingAmount: number) => {
        try {
            // Reference to the driver's main document
            const driverRef = doc(db, `user/${uid}/driver`, selectedDriver);
            const driverSnap = await getDoc(driverRef);
            const currentAdvance = driverSnap.exists() ? parseFloat(driverSnap.data()?.advance ?? 0) : 0;
            const driverName = driverSnap.exists() ? driverSnap.data()?.driverName || 'Unknown Driver' : 'Unknown Driver';
            const driverAdvance = driverSnap.exists() ? driverSnap.data()?.advance || 'Unknown Driver' : 'Unknown Driver';

            // Deduct from the driver's advance
            const newAdvance = Math.max(0, currentAdvance - remainingAmount);
            await updateDoc(driverRef, { advance: newAdvance });

            console.log("Remaining amount deducted from driver's advance. New advance:", newAdvance);

            // Reference to the 'advanceData' sub-collection of the driver
            const advanceDataRef = collection(db, `user/${uid}/driver/${selectedDriver}/advanceData`);
            const advanceDataQuery = query(advanceDataRef, orderBy('advancePaymentDate', 'desc'));
            const advanceDataSnap = await getDocs(advanceDataQuery);

            if (advanceDataSnap.empty) {
                console.log('No advance data found to deduct from.');
                return;
            }

            // Get the last advance payment document (most recent)
            const lastAdvanceDoc = advanceDataSnap.docs[0];
            const lastAdvanceData = lastAdvanceDoc.data();
            const lastAdvanceAmount = lastAdvanceData?.advance ?? 0;
            const advanceId = lastAdvanceData?.advanceId; // Ensure this field exists in Firestore

            if (!advanceId) {
                console.warn('Missing advanceId in the last advance data document.');
                return;
            }

            const remainingAmountAfterDeduction = Math.max(0, lastAdvanceAmount - remainingAmount);

            // Update the last advance document in the 'advanceData' sub-collection
            await updateDoc(lastAdvanceDoc.ref, { advance: remainingAmountAfterDeduction });

            console.log('Deducted from last advance payment in advanceData sub-collection. New advance:', remainingAmountAfterDeduction);

            // Reference to the main advance collection
            const advanceDocRef = doc(db, `user/${uid}/advance`, advanceId);
            const advanceSnap = await getDoc(advanceDocRef);

            if (!advanceSnap.exists()) {
                console.warn(`No advance record found in advance collection with ID: ${advanceId}`);
                return;
            }

            const lastAdvanceMain = advanceSnap.data()?.advance ?? 0;
            const updatedAdvance = Math.max(0, lastAdvanceMain - remainingAmount);

            // Update the specific advance document
            await updateDoc(advanceDocRef, { advance: updatedAdvance });

            console.log(`Updated advance in user/${uid}/advance with ID ${advanceId}:`, updatedAdvance);
            // **Add Deduction Record to receivedDetails**
            const receivedDetailsRef = collection(db, `user/${uid}/receivedDetails`);

            const receivedDetailEntry = {
                bookingId: `advance_deduction_${Date.now()}`, // Unique ID for tracking
                driver: driverName,
                fileNumber: 'Advance Deduction', // Label it as an advance deduction
                amount: `Advance: ${driverAdvance}`,
                receivedAmount: remainingAmount,
                balance: newAdvance, // Remaining advance after deduction
                timestamp: Timestamp.now(),
            };

            await addDoc(receivedDetailsRef, receivedDetailEntry);
            console.log('Advance deduction recorded in receivedDetails.');
        } catch (error) {
            console.error('Error deducting remaining amount from advance:', error);
        }
    };

    // Fetching drivers
    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const driversRef = collection(db, `user/${uid}/driver`);
                const q = query(driversRef, where('companyName', '==', 'RSA'));
                const querySnapshot = await getDocs(q);

                const driverList: Driver[] = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...(doc.data() as Omit<Driver, 'id'>),
                }));

                setDrivers(driverList);
            } catch (error) {
                console.error('Error fetching drivers:', error);
            }
        };

        fetchDrivers();
    }, [db, uid]);

    useEffect(() => {
        const fetchAdvanceDetails = () => {
            try {
                console.log('Listening to advance details for all drivers.');
                // Reference to the 'advance' collection
                const advanceDataRef = collection(db, `user/${uid}/advance`);
                const sortedQuery = query(advanceDataRef, orderBy('advancePaymentDate', 'desc'));

                const unsubscribe = onSnapshot(sortedQuery, (querySnapshot) => {
                    const advanceList: AdvanceData[] = querySnapshot.docs.map((doc) => {
                        const data = doc.data();
                        let advancePaymentDate = '';
                        if (data.advancePaymentDate) {
                            if (data.advancePaymentDate.toDate) {
                                // Format date and time
                                advancePaymentDate = data.advancePaymentDate.toDate().toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: true, // Use 24-hour format
                                    timeZone: 'Asia/Kolkata', // Set timezone to IST
                                });
                            } else if (typeof data.advancePaymentDate === 'string') {
                                advancePaymentDate = data.advancePaymentDate;
                            }
                        }
                        return {
                            id: doc.id, // Add the id field from Firestore document
                            driverName: data.driverName, // Use the driver name from the data
                            advancePaymentDate,
                            driverId: data.driverId, // Use the driver name from the data

                            advanceDataId: data.advanceDataId,
                            advance: data.advance,
                            addedAdvance: data.addedAdvance,

                            type: data.type,
                        };
                    });
                    const sortedAdvanceList = advanceList.sort((a, b) => {
                        return new Date(b.advancePaymentDate).getTime() - new Date(a.advancePaymentDate).getTime();
                    });
                    console.log('mmmm', sortedAdvanceList);
                    console.log('Advance details fetched:', advanceList);
                    setAdvanceDetails(sortedAdvanceList);
                });

                return () => {
                    // Cleanup listener when component unmounts
                    unsubscribe();
                };
            } catch (error) {
                console.error('Error fetching advance details:', error);
            }
        };

        fetchAdvanceDetails();
    }, [db, uid]);

    // ----------------------------------------------------------------------
    const handleAdd = async () => {
        if (!selectedDriver || !selectedType || !amount) {
            alert('Please fill out all fields.');
            return;
        }
        setIsModalOpen(true); // Open modal for confirmation
    };
    const confirmAdd = async () => {
        setIsModalOpen(false); // Close modal after confirmation
        setIsLoading(true);

        try {
            // Find the selected driver object
            const selectedDriverObj = drivers.find((driver) => driver.id === selectedDriver);
            if (!selectedDriverObj) {
                alert('Selected driver not found.');
                return;
            }

            const currentDate = new Date();
            const timestampDate = date ? Timestamp.fromDate(new Date(date)) : Timestamp.fromDate(currentDate);
            const advancePaymentDate = Timestamp.fromDate(new Date(currentDate.toISOString()));

            const driverName = selectedDriverObj.driverName; // Get the driver name
            console.log('driver name', driverName);
            if (selectedType === 'advance') {
                const advanceRef = collection(db, `user/${uid}/advance`);

                // Fetch existing advance for the driver
                const q = query(advanceRef, where('driverId', '==', selectedDriver));
                const snapshot = await getDocs(q);
                let existingAdvance = 0;
                const batch = writeBatch(db); // Use batch for efficiency

                // let advanceDocId = null;

                snapshot.forEach((doc) => {
                    const advanceData = doc.data();
                    existingAdvance += advanceData.advance || 0;
                    batch.update(doc.ref, { advance: 0 });

                    const driverAdvanceDataQuery = query(collection(db, `user/${uid}/driver/${selectedDriver}/advanceData`), where('advanceId', '==', doc.id));

                    getDocs(driverAdvanceDataQuery).then((advanceDataSnapshot) => {
                        advanceDataSnapshot.forEach((dataDoc) => {
                            batch.update(dataDoc.ref, { advance: 0 });
                        });
                    });
                });

                await batch.commit();

                const newAdvance = existingAdvance + Number(amount); // Sum of previous and current advance
                const addedAdvance = Number(amount); // Only use the entered amount

                const advanceDoc = await addDoc(advanceRef, {
                    driverId: selectedDriver,
                    driverName: driverName,
                    advancePaymentDate: serverTimestamp(),
                    advance: amount,
                    addedAdvance: addedAdvance,

                    type: 'advance',
                });

                const advanceId = advanceDoc.id; // Save advance ID

                // Add to driver-specific advanceData subcollection
                const driverDocRef = doc(db, `user/${uid}/driver`, selectedDriver);
                const subcollectionRef = collection(driverDocRef, 'advanceData');
                const advanceDataDoc = await addDoc(subcollectionRef, {
                    driverId: selectedDriver,
                    driverName: driverName,
                    advancePaymentDate: advancePaymentDate,
                    advance: newAdvance,
                    addedAdvance: addedAdvance,
                    type: 'advance',
                    advanceId: advanceId, // Include advance ID from advance collection
                });
                const advanceDataId = advanceDataDoc.id; // Save advanceData ID
                // Update the advance collection document with advanceDataId
                await updateDoc(advanceDoc, {
                    advanceDataId: advanceDataId,
                    // Update with subcollection ID
                });

                // Update total advance for the driver
                await updateTotalAdvance(selectedDriver);

                await handleSettleClick(advanceId, advanceDataId, newAdvance, selectedDriver);
                // ------------------------------------------------------------------------
            } else if (selectedType === 'cashCollection') {
            } else if (selectedType === 'expense') {
                const expenseRef = collection(db, `user/${uid}/expense`);
                await addDoc(expenseRef, {
                    driverId: selectedDriver,
                    date: timestampDate,
                    amount,
                    type: 'expense',
                });

                alert('Expense data added successfully!');
            }

            // Reset fields
            setSelectedDriver('');
            setDate('');
            setAmount('');
        } catch (error) {
            console.error('Error adding data:', error);
            alert('Failed to add data. Please try again.');
        }
    };
    // Cancel Modal
    const cancelAdd = () => {
        setIsModalOpen(false);
    };
    const updateTotalAdvance = (driverId: string) => {
        try {
            // Reference to the advanceData subcollection for the driver
            const driverAdvanceRef = collection(db, `user/${uid}/driver/${driverId}/advanceData`);

            // Listen for real-time updates and fetch the latest advance entry
            const unsubscribe = onSnapshot(query(driverAdvanceRef, orderBy('advancePaymentDate', 'desc'), limit(1)), (querySnapshot) => {
                if (!querySnapshot.empty) {
                    const latestDoc = querySnapshot.docs[0]; // Get the latest document
                    const latestAdvance = latestDoc.data().advance || 0;

                    console.log('Latest Advance:', latestAdvance);

                    // Update the driver's advance field with the latest advance amount
                    const driverDocRef = doc(db, `user/${uid}/driver`, driverId);
                    updateDoc(driverDocRef, { advance: latestAdvance })
                        .then(() => {
                            console.log('Latest advance updated:', latestAdvance);
                        })
                        .catch((error) => {
                            console.error('Error updating latest advance:', error);
                        });
                } else {
                    console.log('No advance records found.');
                }
            });

            return unsubscribe; // Optionally return the unsubscribe function to stop listening when needed
        } catch (error) {
            console.error('Error setting up snapshot listener:', error);
        }
    };

    // ----------------------------------------------------
    const handleSettleClick = async (advanceId: string, advanceDataId: string, advanceAmount: number, driverId: string) => {
        setIsLoading(true);
        try {
            console.log(`Starting settlement for advanceId: ${advanceId}, driverId: ${driverId}`);
            const bookingsRef = collection(db, `user/${uid}/bookings`);
            const q = query(bookingsRef, where('selectedDriver', '==', driverId), where('status', '==', 'Order Completed'), where('bookingChecked', '==', true));
            const querySnapshot = await getDocs(q);

            const fetchedBookings: Booking[] = querySnapshot.docs
                .map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        driverId: data.selectedDriver,
                        createdAt: data.createdAt?.toDate() || new Date(),
                        bookingDate: data.bookingDate?.toDate() || new Date(), // Ensure bookingDate is present
                        amount: data.fileNumber,
                        totalDriverSalary: typeof data.totalDriverSalary === 'string' ? parseFloat(data.totalDriverSalary) : data.totalDriverSalary || 0, // Convert string to number
                        transferedSalary: data.transferedSalary || 0,
                    } as Booking;
                })
                .filter((booking) => {
                    const totalSalary = typeof booking.totalDriverSalary === 'string' ? parseFloat(booking.totalDriverSalary) : booking.totalDriverSalary;

                    return booking.transferedSalary !== totalSalary;
                })
                .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));

            if (fetchedBookings.length === 0) {
                console.log('No bookings to adjust. Remaining advance saved as is.');
                const advanceDocRef = doc(db, `user/${uid}/advance`, advanceId);
                await updateDoc(advanceDocRef, { advance: advanceAmount });
                const advanceDataDocRef = doc(db, `user/${uid}/driver/${driverId}/advanceData`, advanceDataId);
                await updateDoc(advanceDataDocRef, { advance: advanceAmount });
                alert('No bookings to adjust. Remaining advance has been saved.');
                return;
            }

            let remainingAdvance = advanceAmount;
            const batch = writeBatch(db);
            const salaryAdjustments: any[] = [];

            for (const booking of fetchedBookings) {
                let balanceSalary = Number(booking.totalDriverSalary) - booking.transferedSalary;

                if (balanceSalary <= 0) continue;

                const transferAmount = Math.min(balanceSalary, remainingAdvance);
                balanceSalary -= transferAmount;
                remainingAdvance -= transferAmount;

                const bookingRef = doc(db, `user/${uid}/bookings`, booking.id);
                batch.update(bookingRef, {
                    transferedSalary: booking.transferedSalary + transferAmount,
                    balanceSalary,
                });

                salaryAdjustments.push({
                    bookingId: booking.id,
                    fileNumbers: [booking.amount],
                    initialAdvance: advanceAmount,
                    transferAmount,
                    timestamp: Timestamp.now(),
                });

                if (remainingAdvance === 0) break;
            }

            const salaryAdjustmentsRef = collection(db, `user/${uid}/driver/${driverId}/salaryAdjustments`);
            for (const adjustment of salaryAdjustments) {
                batch.set(doc(salaryAdjustmentsRef), adjustment);
            }

            const advanceDocRef = doc(db, `user/${uid}/advance`, advanceId);
            batch.update(advanceDocRef, { advance: remainingAdvance });
            const advanceDataDocRef = doc(db, `user/${uid}/driver/${driverId}/advanceData`, advanceDataId);
            batch.update(advanceDataDocRef, { advance: remainingAdvance });

            await batch.commit();

            alert('Settlement complete and saved!');
            await updateTotalAdvance(driverId);
        } catch (error) {
            console.error('Error during settlement:', error);
            alert('Failed to complete settlement. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    // -----------------------------------------------------------
    const handleDriverChange = (driverId: string) => {
        console.log('Selected driver:', driverId);
        setSelectedDriver(driverId);
    };
    const formatDate = (date: Date | string | undefined) => {
        if (!date) return '';
        const parsedDate = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('en-GB').format(parsedDate); // en-GB formats as dd/mm/yyyy
    };
    const handleEditClick = async (advanceId: string, advanceAmount: number) => {
        try {
            const advanceDocRef = doc(db, `user/${uid}/advance`, advanceId);
            const advanceDoc = await getDoc(advanceDocRef);

            if (advanceDoc.exists()) {
                const advanceData = advanceDoc.data();
                setSelectedDriver(advanceData.driverId);
                setSelectedType(advanceData.type);
                setDate(formatDate(advanceData.advancePaymentDate.toDate()));
                setAmount(advanceAmount);
                setEditAmount(advanceAmount);
                setIsEditing(true);
            } else {
                console.error('Advance document not found.');
            }
        } catch (error) {
            console.error('Error fetching advance details:', error);
        }
    };
    const handleUpdate = async () => {
        if (!selectedDriver || !amount || editAmount === '') {
            alert('Please fill out all fields.');
            return;
        }

        try {
            const currentDate = new Date();
            const timestampDate = Timestamp.fromDate(currentDate);
            const advancePaymentDate = Timestamp.fromDate(new Date(currentDate.toISOString()));

            const advanceDocRef = doc(db, `user/${uid}/advance`, advanceDetails[0].id);

            // Update the advance collection
            await updateDoc(advanceDocRef, {
                advance: amount,
                advancePaymentDate: advancePaymentDate,
            });

            // Update the advanceData subcollection
            const driverDocRef = doc(db, `user/${uid}/driver`, selectedDriver);
            const subcollectionRef = collection(driverDocRef, 'advanceData');
            const advanceDataQuery = query(subcollectionRef, where('advanceId', '==', advanceDetails[0].id));
            const querySnapshot = await getDocs(advanceDataQuery);

            querySnapshot.forEach(async (docSnapshot) => {
                await updateDoc(docSnapshot.ref, {
                    advance: amount,
                    advancePaymentDate: timestampDate,
                });
            });

            await updateTotalAdvance(selectedDriver);

            // alert('Advance details updated successfully!');
            setIsEditing(false);
            setAmount('');
            setDate('');
        } catch (error) {
            console.error('Error updating data:', error);
            alert('Failed to update data. Please try again.');
        }
    };
    useEffect(() => {
        // Set default date to today if it's not already set
        if (!date) {
            setDate(new Date().toISOString().split('T')[0]);
        }
    }, [date]);
    const handleDeleteClick = async (advanceId: string, advanceDataId: string, advanceAmount: number, driverId: string) => {
        try {
            const confirmDelete = window.confirm('Are you sure you want to delete this advance record?');
            if (!confirmDelete) return;

            const driverDocRef = doc(db, `user/${uid}/driver`, driverId);

            // Get current driver data
            const driverDocSnap = await getDoc(driverDocRef);
            if (!driverDocSnap.exists()) {
                console.error('Driver document not found.');
                return;
            }

            // Deduct the deleted advance amount from totalAdvance
            const currentAdvance = driverDocSnap.data().advance || 0;
            const updatedAdvance = Math.max(0, currentAdvance - advanceAmount); // Ensure it doesn't go negative

            // Use batch to update and delete in a single transaction
            const batch = writeBatch(db);

            // Update driver's total advance amount
            batch.update(driverDocRef, { advance: updatedAdvance });

            // Delete from advance collection
            batch.delete(doc(db, `user/${uid}/advance`, advanceId));

            // Delete from driver's advanceData subcollection
            batch.delete(doc(db, `user/${uid}/driver/${driverId}/advanceData`, advanceDataId));

            // Commit the batch operations
            await batch.commit();

            alert('Advance record deleted and total advance updated successfully!');
        } catch (error) {
            console.error('Error deleting advance record:', error);
            alert('Failed to delete advance record. Please try again.');
        }
    };

    const filteredAdvanceDetails = advanceDetails.filter((advance) => {
        const term = searchTerm.toLowerCase();
        return advance.driverName.toLowerCase().includes(term) || advance.advancePaymentDate.toLowerCase().includes(term) || String(advance.advance).toLowerCase().includes(term);
    });
    return (
        <div>
            {isLoading ? (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <p>Loading...</p> {/* Replace this with a spinner or loader component if available */}
                </div>
            ) : (
                <>
                    <div className="containerk">
                        <h1 className="title">Payment Management</h1>
                        <div className="form-group">
                            <label htmlFor="driverDropdown">Select Driver:</label>
                            <select
                                id="driverDropdown"
                                value={selectedDriver}
                                onChange={(e) => handleDriverChange(e.target.value)}
                                style={{
                                    appearance: 'none',
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'none',
                                    backgroundColor: '#fff',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 10px center',
                                    border: '2px solid #ddd',
                                    padding: '10px',
                                    width: '100%',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    transition: 'all 0.3s ease',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#4CAF50';
                                    e.target.style.boxShadow = '0 0 5px rgba(76, 175, 80, 0.5)';
                                    e.target.style.outline = 'none';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#ddd';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                <option value="" disabled>
                                    -- Select a Driver --
                                </option>
                                {drivers.map((driver) => (
                                    <option key={driver.id} value={driver.id}>
                                        {driver.driverName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="typeDropdown">TYPES:</label>
                            <select
                                id="typeDropdown"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                style={{
                                    appearance: 'none',
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'none',
                                    backgroundColor: '#fff',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 10px center',
                                    border: '2px solid #ddd',
                                    padding: '10px',
                                    width: '100%',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    transition: 'all 0.3s ease',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#4CAF50';
                                    e.target.style.boxShadow = '0 0 5px rgba(76, 175, 80, 0.5)';
                                    e.target.style.outline = 'none';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#ddd';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                <option value="" disabled>
                                    -- Select a Type --
                                </option>
                                <option value="advance">Advance</option>
                                <option value="cashCollection">Cash Collection</option>
                                <option value="expense">Expense</option>
                            </select>
                        </div>
                        {selectedType === 'advance' && (
                            <div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label
                                        htmlFor="amountField"
                                        style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {selectedType === 'advance' ? 'Advance Amount:' : 'Amount:'}
                                    </label>
                                    <input
                                        type="text"
                                        id="amountField"
                                        value={amount}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        placeholder={selectedType === 'advance' ? 'Enter Advance Amount' : 'Enter Amount'}
                                        style={{
                                            appearance: 'none',
                                            WebkitAppearance: 'none',
                                            MozAppearance: 'none',
                                            backgroundColor: '#fff',
                                            border: '2px solid #ddd',
                                            padding: '10px',
                                            width: '100%',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            transition: 'all 0.3s ease',
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#4CAF50';
                                            e.target.style.boxShadow = '0 0 5px rgba(76, 175, 80, 0.5)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#ddd';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>
                                <button className="add-button" onClick={isEditing ? handleUpdate : handleAdd}>
                                    {isEditing ? 'Update Details' : 'Add And settle Amount'}
                                </button>

                                <ConfirmationModal isOpen={isModalOpen} onConfirm={confirmAdd} onCancel={cancelAdd} message="Are you sure you want to add this data?" />
                            </div>
                        )}
                        
                        {selectedType === 'cashCollection' && (
                            <div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label
                                        htmlFor="amountField"
                                        style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {selectedType === 'cashCollection' ? 'Received Amount:' : 'Received Amount:'}
                                    </label>
                                    <input
                                        type="text"
                                        id="receivedField"
                                        value={receivedAmount}
                                        onChange={(e) => setReceivedAmount(Number(e.target.value))}
                                        placeholder={selectedType === 'cashCollection' ? 'Enter Received Amount' : 'Enter Amount'}
                                        style={{
                                            appearance: 'none',
                                            WebkitAppearance: 'none',
                                            MozAppearance: 'none',
                                            backgroundColor: '#fff',
                                            border: '2px solid #ddd',
                                            padding: '10px',
                                            width: '100%',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            transition: 'all 0.3s ease',
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#4CAF50';
                                            e.target.style.boxShadow = '0 0 5px rgba(76, 175, 80, 0.5)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#ddd';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label
                                        htmlFor="netTotalAmountInHand"
                                        style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        Net Total Amount In Hand:
                                    </label>
                                    <input
                                        value={netTotalAmountInHand}
                                        readOnly
                                        style={{
                                            appearance: 'none',
                                            WebkitAppearance: 'none',
                                            MozAppearance: 'none',
                                            backgroundColor: '#f5f5f5',
                                            border: '2px solid #ddd',
                                            padding: '10px',
                                            width: '100%',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            transition: 'all 0.3s ease',
                                        }}
                                    />
                                </div>
                                <button className="add-button" onClick={() => handleOpenModal1(parseFloat(receivedAmount !== '' ? receivedAmount.toString() : '0'))}>
                                    Settle Received Amount
                                </button>
                            </div>
                        )}

                        <ConfirmationModal1
                            isOpen={isModalOpen1}
                            onConfirm1={() => {
                                handleReceiveSettle(receivedAmountToSettle); // Proceed to settle the amount
                                setIsModalOpen1(false); // Close the modal
                            }}
                            onCancel1={() => setIsModalOpen(false)} // Close the modal without any action
                            message={`Are you sure you want to settle the received amount of ${receivedAmountToSettle}?`}
                        />
                    </div>
                    {selectedType === 'cashCollection' && (
    <div>
      <div style={{ display: 'flex', marginBottom: '16px', width: '100%' }}>
      <button
    onClick={() => setActiveTab('receiveDetails')}
    style={{
        flex: 1,
        padding: '20px',
        cursor: 'pointer',
        borderBottom: activeTab === 'receiveDetails' ? '3px solid #4CAF50' : '3px solid transparent',
        backgroundColor: activeTab === 'receiveDetails' ? '#dff0d8' : 'transparent', // Light green background
        fontWeight: activeTab === 'receiveDetails' ? 'bold' : 'normal',
        fontSize: activeTab === 'receiveDetails' ? '1.2rem' : '1rem', // Larger text when active
        textAlign: 'center',
        transition: 'all 0.3s ease',
    }}
>
    Receive Details
</button>
<button
    onClick={() => setActiveTab('cashCollection')}
    style={{
        flex: 1,
        padding: '20px',
        cursor: 'pointer',
        borderBottom: activeTab === 'cashCollection' ? '3px solid #4CAF50' : '3px solid transparent',
        backgroundColor: activeTab === 'cashCollection' ? '#dff0d8' : 'transparent', // Light green background
        fontWeight: activeTab === 'cashCollection' ? 'bold' : 'normal',
        fontSize: activeTab === 'cashCollection' ? '1.2rem' : '1rem', // Larger text when active
        textAlign: 'center',
        transition: 'all 0.3s ease',
    }}
>
    Cash Collection
</button>

</div>


        {/* Tab Content */}
        {activeTab === 'receiveDetails' && <ReceiveDetailsTable uid={uid} />}
        {activeTab === 'cashCollection' && <CashCollectionTable uid={uid} />}
    </div>
)}
                    {selectedType === 'advance' && (
                        <div>
                            <div className="advance-details">
                                <h2 className="advance-h2">Advance Details</h2>
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
                                {advanceDetails.length === 0 ? (
                                    <p>No advance details available.</p>
                                ) : (
                                    <table className="advance-table">
                                        <thead>
                                            <tr>
                                                <th>SI</th>
                                                <th>Driver Name</th>
                                                <th>Advance Payment Date</th>
                                                <th>Initial Advance</th>

                                                <th>Advance After Deduction</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAdvanceDetails.map((advance, index) => (
                                                <tr key={advance.id}>
                                                    <td>{index + 1}</td>
                                                    <td>{advance.driverName}</td>
                                                    <td>{advance.advancePaymentDate}</td>
                                                    <td>₹{advance.addedAdvance}</td>

                                                    <td>₹{advance.advance}</td>
                                                    <td>
                                                        {' '}
                                                        {role === 'admin' && (
                                                            <>
                                                                {/* <button
                                            onClick={() => handleEditClick(advance.id, advance.advance)}
                                            style={{
                                                backgroundColor: '#4CAF50',
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px 20px',
                                                textAlign: 'center',
                                                textDecoration: 'none',
                                                display: 'inline-block',
                                                fontSize: '14px',
                                                margin: '5px 2px',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                                            }}
                                        >
                                            Edit
                                        </button>
                                          <button
                                            onClick={() => handleDeleteClick(advance.id, advance.advanceDataId, advance.advance, advance.driverId)}
                                            style={{
                                                backgroundColor: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px 20px',
                                                textAlign: 'center',
                                                textDecoration: 'none',
                                                display: 'inline-block',
                                                fontSize: '14px',
                                                margin: '5px 2px',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                                            }}
                                        >
                                            Delete
                                        </button> */}
                                                                <button
                                                                    onClick={() => handleSettleClick(advance.id, advance.advanceDataId, advance.advance, advance.driverId)}
                                                                    style={{
                                                                        backgroundColor: 'blue',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        padding: '10px 20px',
                                                                        textAlign: 'center',
                                                                        textDecoration: 'none',
                                                                        display: 'inline-block',
                                                                        fontSize: '14px',
                                                                        margin: '5px 2px',
                                                                        borderRadius: '5px',
                                                                        cursor: 'pointer',
                                                                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                                                                    }}
                                                                >
                                                                    Settle
                                                                </button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Advance;
