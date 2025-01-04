import React, { useEffect, useState } from 'react';
import { getFirestore, collection, doc, query, where, getDocs, addDoc, Timestamp, onSnapshot, updateDoc, getDoc, orderBy } from 'firebase/firestore';
import './Advance.css';
interface Booking {
    id: string;
    driverId: string;
    createdAt: Date;
    amount: number;
    driverName?: string;
    totalDriverSalary: string; 
    transferedSalary: number;
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
}
interface Booking {
    id: string;
    driverId: string;
    bookingDate: string;
    amount: number;
    driverName?: string;
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
    const [editAdvanceDataId, setEditAdvanceDataId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState<number | ''>('');
    const [isEditing, setIsEditing] = useState(false);

    const db = getFirestore();
    const uid = sessionStorage.getItem('uid') || '';
    console.log("uid",uid)

    // ----------------------------------------------------------------
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
                const sortedQuery = query(advanceDataRef, orderBy("advancePaymentDate", "desc"));

                const unsubscribe = onSnapshot(sortedQuery, (querySnapshot) => {
                    const advanceList: AdvanceData[] = querySnapshot.docs.map((doc) => {
                        const data = doc.data();
                        let advancePaymentDate = '';
                        if (data.advancePaymentDate) {
                            if (data.advancePaymentDate.toDate) {
                                advancePaymentDate = formatDate(data.advancePaymentDate.toDate());
                            } else if (typeof data.advancePaymentDate === 'string') {
                                advancePaymentDate = data.advancePaymentDate; // Assuming already formatted as string
                            }
                        }                        return {
                            id: doc.id, // Add the id field from Firestore document
                            driverName: data.driverName, // Use the driver name from the data
                            advancePaymentDate,
                            driverId: data.driverId, // Use the driver name from the data

                            advanceDataId: data.advanceDataId,
                            advance: data.advance,
                            type: data.type,
                        };
                    });
                    
                    console.log('Advance details fetched:', advanceList);
                    setAdvanceDetails(advanceList);
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

    const handleAdd = async () => {
        if (!selectedDriver || !selectedType || !date || !amount) {
            alert('Please fill out all fields.');
            return;
        }

        try {
            // Find the selected driver object
            const selectedDriverObj = drivers.find((driver) => driver.id === selectedDriver);
            if (!selectedDriverObj) {
                alert('Selected driver not found.');
                return;
            }

            const timestampDate = Timestamp.fromDate(new Date(date));
            const driverName = selectedDriverObj.driverName; // Get the driver name
console.log("driver name" , driverName)
            if (selectedType === 'advance') {
                // Add to the advance collection
                const advanceRef = collection(db, `user/${uid}/advance`);
                const advanceDoc = await addDoc(advanceRef, {
                    driverId: selectedDriver,
                    driverName: driverName,
                    advancePaymentDate: timestampDate,
                    advance: amount,
                    type: 'advance',
                });

                const advanceId = advanceDoc.id; // Save advance ID

                // Add to driver-specific advanceData subcollection
                const driverDocRef = doc(db, `user/${uid}/driver`, selectedDriver);
                const subcollectionRef = collection(driverDocRef, 'advanceData');
                const advanceDataDoc = await addDoc(subcollectionRef, {
                    driverId: selectedDriver,
                    driverName: driverName,
                    advancePaymentDate: timestampDate,
                    advance: amount,
                    type: 'advance',
                    advanceId: advanceId, // Include advance ID from advance collection
                });
                const advanceDataId = advanceDataDoc.id; // Save advanceData ID
                // Update the advance collection document with advanceDataId
                await updateDoc(advanceDoc, {
                    advanceDataId: advanceDataId, // Update with subcollection ID
                });

                // Update total advance for the driver
                await updateTotalAdvance(selectedDriver);

            } else if (selectedType === 'salary') {
                const salaryRef = collection(db, `user/${uid}/salary`);
                await addDoc(salaryRef, {
                    driverId: selectedDriver,
                    date: timestampDate,
                    amount,
                    type: 'salary',
                });

                alert('Salary data added successfully!');
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
            setSelectedType('');
            setDate('');
            setAmount('');
        } catch (error) {
            console.error('Error adding data:', error);
            alert('Failed to add data. Please try again.');
        }
    };

    const updateTotalAdvance = (driverId: string) => {
        try {
            // Listen for real-time updates on the advanceData subcollection
            const driverAdvanceRef = collection(db, `user/${uid}/driver/${driverId}/advanceData`);
    
            onSnapshot(driverAdvanceRef, (querySnapshot) => {
                let totalAdvance = 0;
                querySnapshot.forEach((doc) => {
                    totalAdvance += doc.data().advance;
                });
    
                // Update the driver's advance field with the total sum
                const driverDocRef = doc(db, `user/${uid}/driver`, driverId);
                updateDoc(driverDocRef, { advance: totalAdvance })
                    .then(() => {
                        console.log('Total advance updated:', totalAdvance);
                    })
                    .catch((error) => {
                        console.error('Error updating total advance:', error);
                    });
            });
        } catch (error) {
            console.error('Error setting up snapshot listener:', error);
        }
    };
    
    // ----------------------------------------------------
    const handleSettleClick = async (
        advanceId: string,
        advanceDataId: string,
        advanceAmount: number,
        driverId: string
    ) => {
        try {
            console.log(`Starting settlement for advanceId: ${advanceId}, driverId: ${driverId}`);
            console.log(`Initial advance amount: ${advanceAmount}`);
    
            const bookingsRef = collection(db, `user/${uid}/bookings`);
            const q = query(
                bookingsRef,
                where('selectedDriver', '==', driverId),
                where('status', '==', 'Order Completed'),
                where('bookingChecked', '==', true)
            );
            const querySnapshot = await getDocs(q);
    
            const fetchedBookings = querySnapshot.docs
                .map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        driverId: data.selectedDriver,
                        createdAt: data.createdAt?.toDate() || new Date(),
                        amount: data.fileNumber,
                        totalDriverSalary: data.totalDriverSalary,
                        transferedSalary: data.transferedSalary || 0,
                    } as Booking;
                })
                .filter((booking) =>
                    booking.transferedSalary !==
                    (typeof booking.totalDriverSalary === 'string'
                        ? parseFloat(booking.totalDriverSalary)
                        : booking.totalDriverSalary || 0)
                )
                .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
    
            if (fetchedBookings.length === 0) {
                console.log("No bookings to adjust. Remaining advance saved as is.");
                const advanceDocRef = doc(db, `user/${uid}/advance`, advanceId);
                await updateDoc(advanceDocRef, { advance: advanceAmount });
                const advanceDataDocRef = doc(db, `user/${uid}/driver/${driverId}/advanceData`, advanceDataId);
                await updateDoc(advanceDataDocRef, { advance: advanceAmount });
                alert('No bookings to adjust. Remaining advance has been saved.');
                return;
            }
    
            let remainingAdvance = advanceAmount;
            const salaryAdjustments = [];
    
            for (const booking of fetchedBookings) {
                const totalDriverSalary = typeof booking.totalDriverSalary === 'string'
                    ? parseFloat(booking.totalDriverSalary)
                    : booking.totalDriverSalary || 0;
    
                let transferedSalary = booking.transferedSalary || 0;
                let balanceSalary = totalDriverSalary - transferedSalary;
    
                if (balanceSalary <= 0) continue;
    
                if (remainingAdvance >= balanceSalary) {
                    transferedSalary += balanceSalary;
                    remainingAdvance -= balanceSalary;
                    balanceSalary = 0;
                } else {
                    transferedSalary += remainingAdvance;
                    balanceSalary -= remainingAdvance;
                    remainingAdvance = 0;
                }
    
                const bookingRef = doc(db, `user/${uid}/bookings`, booking.id);
                await updateDoc(bookingRef, {
                    transferedSalary,
                    balanceSalary,
                });
    
                salaryAdjustments.push({
                    bookingId: booking.id,
                    fileNumbers: [booking.amount], // Replace with relevant file numbers if available
                    initialAdvance: advanceAmount,
                    transferAmount: advanceAmount - remainingAdvance,
                    timestamp: Timestamp.now(),
                });
    
                if (remainingAdvance === 0) break;
            }
    
            const salaryAdjustmentsRef = collection(
                db,
                `user/${uid}/driver/${driverId}/salaryAdjustments`
            );
            for (const adjustment of salaryAdjustments) {
                await addDoc(salaryAdjustmentsRef, adjustment);
            }
    
            const advanceDocRef = doc(db, `user/${uid}/advance`, advanceId);
            await updateDoc(advanceDocRef, { advance: remainingAdvance });
            const advanceDataDocRef = doc(db, `user/${uid}/driver/${driverId}/advanceData`, advanceDataId);
            await updateDoc(advanceDataDocRef, { advance: remainingAdvance });
    
            alert('Settlement complete and saved!');
            await updateTotalAdvance(driverId);
        } catch (error) {
            console.error('Error settling the advance:', error);
            alert('Failed to settle advance. Please try again.');
        }
    };
    
    // =======================================================================================
    
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
        if (!selectedDriver || !date || !amount || editAmount === '') {
            alert('Please fill out all fields.');
            return;
        }

        try {
            const timestampDate = Timestamp.fromDate(new Date(date));
            const advanceDocRef = doc(db, `user/${uid}/advance`, advanceDetails[0].id);

            // Update the advance collection
            await updateDoc(advanceDocRef, {
                advance: amount,
                advancePaymentDate: timestampDate,
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

            alert('Advance details updated successfully!');
            setIsEditing(false);
            setAmount('');
            setDate('');
        } catch (error) {
            console.error('Error updating data:', error);
            alert('Failed to update data. Please try again.');
        }
    };

    return (
        <div>
            <div className="containerk">
                <h1 className="title">Payment Management</h1>
                <div className="form-group">
                    <label htmlFor="driverDropdown">Select Driver:</label>
                    <select id="driverDropdown" value={selectedDriver} onChange={(e) => handleDriverChange(e.target.value)}
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
                    <select id="typeDropdown" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}
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
                        <option value="salary">Salary</option>
                        <option value="expense">Expense</option>
                    </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                    <label htmlFor="dateField" 
                      style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: 'bold',
                    }}
                    >
                        {selectedType === 'advance' ? 'Advance Payment Date:' : 'Date:'}</label>
                    <input
                        type="date"
                        id="dateField"
                        value={date} // Use the 'date' state variable instead of 'formattedDate'
                        onChange={(e) => setDate(e.target.value)}
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
                    {isEditing ? 'Update Details' : 'Add Details'}
                </button>
            </div>

            <div className="advance-details">
                <h2 className="advance-h2">Advance Details</h2>
                {advanceDetails.length === 0 ? (
                    <p>No advance details available.</p>
                ) : (
                    <table className="advance-table">
                        <thead>
                            <tr>
                                <th>SI</th>
                                <th>Driver Name</th>
                                <th>Advance Payment Date</th>
                                <th>Advance Amount</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {advanceDetails.map((advance, index) => (
                                <tr key={advance.id}>
                                    <td>{index+1}</td>
                                    <td>{advance.driverName}</td>
                                    <td>{advance.advancePaymentDate}</td>
                                    <td>₹{advance.advance}</td>
                                    <td>
  <button
    onClick={() => handleEditClick(advance.id, advance.advance)}
    style={{
      backgroundColor: "#4CAF50", 
      color: "white", 
      border: "none", 
      padding: "10px 20px", 
      textAlign: "center", 
      textDecoration: "none", 
      display: "inline-block", 
      fontSize: "14px", 
      margin: "5px 2px", 
      borderRadius: "5px", 
      cursor: "pointer",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)"
    }}
  >
    Edit
  </button>
  <button
    onClick={() => handleSettleClick(advance.id, advance.advanceDataId, advance.advance, advance.driverId)}
    style={{
      backgroundColor: "#f44336", 
      color: "white", 
      border: "none", 
      padding: "10px 20px", 
      textAlign: "center", 
      textDecoration: "none", 
      display: "inline-block", 
      fontSize: "14px", 
      margin: "5px 2px", 
      borderRadius: "5px", 
      cursor: "pointer",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)"
    }}
  >
    Settle
  </button>
</td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                         </div>
        </div>
    );
};

export default Advance;
