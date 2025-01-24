// import React, { useEffect, useState } from 'react';
// import { getFirestore, collection, doc, query, where, getDocs, addDoc, Timestamp, onSnapshot, updateDoc, getDoc, orderBy, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
// import './Advance.css';
// import ConfirmationModal from './ConfirmationModal';
// interface Booking {
//     id: string;
//     driverId: string;
//     createdAt: Date;
//     amount: number;
//     driverName?: string;
//     totalDriverSalary: string;
//     transferedSalary: number;
// }

// interface Driver {
//     id: string;
//     driverName: string;
//     companyName: string;
// }

// interface AdvanceData {
//     id: string;
//     driverName: string;
//     advancePaymentDate: string;
//     advance: number;
//     type: string;
//     advanceDataId: string;
//     driverId: string;
//     addedAdvance:number;
// }
// interface Booking {
//     id: string;
//     driverId: string;
//     bookingDate: string;
//     amount: number;
//     driverName?: string;
// }
// const Advance: React.FC = () => {
//     const [drivers, setDrivers] = useState<Driver[]>([]);
//     const [selectedDriver, setSelectedDriver] = useState<string>('');
//     const [selectedType, setSelectedType] = useState<string>('');
//     const [date, setDate] = useState<string>('');
//     const [amount, setAmount] = useState<number | ''>('');
//     const [advanceDetails, setAdvanceDetails] = useState<AdvanceData[]>([]);
//     const [bookings, setBookings] = useState<Booking[]>([]); // State for bookings
//     const [editAdvanceId, setEditAdvanceId] = useState<string | null>(null);
//     const [editAdvanceDataId, setEditAdvanceDataId] = useState<string | null>(null);
//     const [editAmount, setEditAmount] = useState<number | ''>('');
//     const [isEditing, setIsEditing] = useState(false);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [isLoading, setIsLoading] = useState(false);
//     const db = getFirestore();
//     const uid = sessionStorage.getItem('uid') || '';
//     const role = sessionStorage.getItem('role');

//     console.log('uid', role);

//     const [isModalOpen, setIsModalOpen] = React.useState(false);
//     // Fetching drivers
//     useEffect(() => {
//         const fetchDrivers = async () => {
//             try {
//                 const driversRef = collection(db, `user/${uid}/driver`);
//                 const q = query(driversRef, where('companyName', '==', 'RSA'));
//                 const querySnapshot = await getDocs(q);

//                 const driverList: Driver[] = querySnapshot.docs.map((doc) => ({
//                     id: doc.id,
//                     ...(doc.data() as Omit<Driver, 'id'>),
//                 }));

//                 setDrivers(driverList);
//             } catch (error) {
//                 console.error('Error fetching drivers:', error);
//             }
//         };

//         fetchDrivers();
//     }, [db, uid]);

//     useEffect(() => {
//         const fetchAdvanceDetails = () => {
//             try {
//                 console.log('Listening to advance details for all drivers.');
//                 // Reference to the 'advance' collection
//                 const advanceDataRef = collection(db, `user/${uid}/advance`);
//                 const sortedQuery = query(advanceDataRef, orderBy('advancePaymentDate', 'desc'));

//                 const unsubscribe = onSnapshot(sortedQuery, (querySnapshot) => {
//                     const advanceList: AdvanceData[] = querySnapshot.docs.map((doc) => {
//                         const data = doc.data();
//                         let advancePaymentDate = '';
//                         if (data.advancePaymentDate) {
//                             if (data.advancePaymentDate.toDate) {
//                                 // Format date and time
//                                 advancePaymentDate = data.advancePaymentDate.toDate().toLocaleString('en-IN', {
//                                     day: '2-digit',
//                                     month: 'long',
//                                     year: 'numeric',
//                                     hour: '2-digit',
//                                     minute: '2-digit',
//                                     second: '2-digit',
//                                     hour12: true,  // Use 24-hour format
//                                     timeZone: 'Asia/Kolkata'  // Set timezone to IST
//                                 });
//                             } else if (typeof data.advancePaymentDate === 'string') {
//                                 advancePaymentDate = data.advancePaymentDate; 
//                             }
//                         }
//                         return {
//                             id: doc.id, // Add the id field from Firestore document
//                             driverName: data.driverName, // Use the driver name from the data
//                             advancePaymentDate,
//                             driverId: data.driverId, // Use the driver name from the data

//                             advanceDataId: data.advanceDataId,
//                             advance: data.advance,
//                             addedAdvance: data.addedAdvance,

//                             type: data.type,
//                         };
//                     });
//                     const sortedAdvanceList = advanceList.sort((a, b) => {
//                         return new Date(b.advancePaymentDate).getTime() - new Date(a.advancePaymentDate).getTime();
//                     });
//                     console.log("mmmm",sortedAdvanceList)
//                     console.log('Advance details fetched:', advanceList);
//                     setAdvanceDetails(sortedAdvanceList);
//                 });

//                 return () => {
//                     // Cleanup listener when component unmounts
//                     unsubscribe();
//                 };
//             } catch (error) {
//                 console.error('Error fetching advance details:', error);
//             }
//         };

//         fetchAdvanceDetails();
//     }, [db, uid]);
//     // ----------------------------------------------------------------------
//     const handleAdd = async () => {
//         if (!selectedDriver || !selectedType || !amount) {
//             alert('Please fill out all fields.');
//             return;
//         }
//         setIsModalOpen(true);  // Open modal for confirmation
//     };
//     const confirmAdd = async () => {
//         setIsModalOpen(false);  // Close modal after confirmation
//         setIsLoading(true);


//         try {
//             // Find the selected driver object
//             const selectedDriverObj = drivers.find((driver) => driver.id === selectedDriver);
//             if (!selectedDriverObj) {
//                 alert('Selected driver not found.');
//                 return;
//             }

//             const currentDate = new Date();
//             const timestampDate = date ? Timestamp.fromDate(new Date(date)) : Timestamp.fromDate(currentDate);
//             const driverName = selectedDriverObj.driverName; // Get the driver name
//             console.log('driver name', driverName);
//             if (selectedType === 'advance') {
//                 const advanceRef = collection(db, `user/${uid}/advance`);
    
//                 // Fetch existing advance for the driver
//                 const q = query(advanceRef, where('driverId', '==', selectedDriver));
//                 const snapshot = await getDocs(q);
//                 let existingAdvance = 0;
//                 const batch = writeBatch(db);  // Use batch for efficiency

//                 // let advanceDocId = null;
            
//                 snapshot.forEach((doc) => {
//                     const advanceData = doc.data();
//                     existingAdvance += advanceData.advance || 0;
//                     batch.update(doc.ref, { advance: 0 });
        
//                     const driverAdvanceDataQuery = query(
//                         collection(db, `user/${uid}/driver/${selectedDriver}/advanceData`),
//                         where('advanceId', '==', doc.id)
//                     );
            
//                     getDocs(driverAdvanceDataQuery).then((advanceDataSnapshot) => {
//                         advanceDataSnapshot.forEach((dataDoc) => {
//                             batch.update(dataDoc.ref, { advance: 0 });
//                         });
//                     });
//                 });
            
//                 await batch.commit();
            
//                 const newAdvance = existingAdvance + Number(amount);  // Sum of previous and current advance
                
//                 const advanceDoc = await addDoc(advanceRef, {
//                     driverId: selectedDriver,
//                     driverName: driverName,
//                     advancePaymentDate: serverTimestamp(),
//                     advance: amount,
//                     addedAdvance: newAdvance,

//                     type: 'advance',
//                 });

//                 const advanceId = advanceDoc.id; // Save advance ID

//                 // Add to driver-specific advanceData subcollection
//                 const driverDocRef = doc(db, `user/${uid}/driver`, selectedDriver);
//                 const subcollectionRef = collection(driverDocRef, 'advanceData');
//                 const advanceDataDoc = await addDoc(subcollectionRef, {
//                     driverId: selectedDriver,
//                     driverName: driverName,
//                     advancePaymentDate: timestampDate,
//                     advance: newAdvance,
//                     addedAdvance: newAdvance,
//                     type: 'advance',
//                     advanceId: advanceId, // Include advance ID from advance collection
//                 });
//                 const advanceDataId = advanceDataDoc.id; // Save advanceData ID
//                 // Update the advance collection document with advanceDataId
//                 await updateDoc(advanceDoc, {
//                     advanceDataId: advanceDataId,
//                     // Update with subcollection ID
//                 });

//                 // Update total advance for the driver
//                 await updateTotalAdvance(selectedDriver);
                
//                 await handleSettleClick(advanceId, advanceDataId, newAdvance, selectedDriver);
// // ----------------------------------------------------------------------------------------
//             } else if (selectedType === 'salary') {
//                 const salaryRef = collection(db, `user/${uid}/salary`);
//                 await addDoc(salaryRef, {
//                     driverId: selectedDriver,
//                     date: timestampDate,
//                     amount,
//                     type: 'salary',
//                 });

//                 alert('Salary data added successfully!');
//             } else if (selectedType === 'expense') {
//                 const expenseRef = collection(db, `user/${uid}/expense`);
//                 await addDoc(expenseRef, {
//                     driverId: selectedDriver,
//                     date: timestampDate,
//                     amount,
//                     type: 'expense',
//                 });

//                 alert('Expense data added successfully!');
//             }

//             // Reset fields
//             setSelectedDriver('');
//             setSelectedType('');
//             setDate('');
//             setAmount('');
//         } catch (error) {
//             console.error('Error adding data:', error);
//             alert('Failed to add data. Please try again.');
//         }
//     };
// // Cancel Modal
// const cancelAdd = () => {
//     setIsModalOpen(false);
// };
//     const updateTotalAdvance = (driverId: string) => {
//         try {
//             // Listen for real-time updates on the advanceData subcollection
//             const driverAdvanceRef = collection(db, `user/${uid}/driver/${driverId}/advanceData`);

//             onSnapshot(driverAdvanceRef, (querySnapshot) => {
//                 let totalAdvance = 0;
//                 querySnapshot.forEach((doc) => {
//                     totalAdvance += doc.data().advance;
//                 });

//                 // Update the driver's advance field with the total sum
//                 const driverDocRef = doc(db, `user/${uid}/driver`, driverId);
//                 updateDoc(driverDocRef, { advance: totalAdvance })
//                     .then(() => {
//                         console.log('Total advance updated:', totalAdvance);
//                     })
//                     .catch((error) => {
//                         console.error('Error updating total advance:', error);
//                     });
//             });
//         } catch (error) {
//             console.error('Error setting up snapshot listener:', error);
//         }
//     };

//     // ----------------------------------------------------
//     const handleSettleClick = async (
//         advanceId: string,
//         advanceDataId: string,
//         advanceAmount: number,
//         driverId: string
//     ) => {
//         setIsLoading(true);
//         try {
//             console.log(`Starting settlement for advanceId: ${advanceId}, driverId: ${driverId}`);
//             const bookingsRef = collection(db, `user/${uid}/bookings`);
//             const q = query(
//                 bookingsRef,
//                 where('selectedDriver', '==', driverId),
//                 where('status', '==', 'Order Completed'),
//                 where('bookingChecked', '==', true)
//             );
//             const querySnapshot = await getDocs(q);
    
//             const fetchedBookings: Booking[] = querySnapshot.docs.map((doc) => {
//                 const data = doc.data();
//                 return {
//                     id: doc.id,
//                     driverId: data.selectedDriver,
//                     createdAt: data.createdAt?.toDate() || new Date(),
//                     bookingDate: data.bookingDate?.toDate() || new Date(), // Ensure bookingDate is present
//                     amount: data.fileNumber,
//                     totalDriverSalary: typeof data.totalDriverSalary === 'string' 
//                         ? parseFloat(data.totalDriverSalary) 
//                         : data.totalDriverSalary || 0, // Convert string to number
//                     transferedSalary: data.transferedSalary || 0,
//                 } as Booking;
//             })
//             .filter((booking) => {
//                 const totalSalary = typeof booking.totalDriverSalary === 'string' 
//                     ? parseFloat(booking.totalDriverSalary) 
//                     : booking.totalDriverSalary;
            
//                 return booking.transferedSalary !== totalSalary;
//             })
//             .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
            
//             if (fetchedBookings.length === 0) {
//                 console.log('No bookings to adjust. Remaining advance saved as is.');
//                 const advanceDocRef = doc(db, `user/${uid}/advance`, advanceId);
//                 await updateDoc(advanceDocRef, { advance: advanceAmount });
//                 const advanceDataDocRef = doc(db, `user/${uid}/driver/${driverId}/advanceData`, advanceDataId);
//                 await updateDoc(advanceDataDocRef, { advance: advanceAmount });
//                 alert('No bookings to adjust. Remaining advance has been saved.');
//                 return;
//             }
    
//             let remainingAdvance = advanceAmount;
//             const batch = writeBatch(db);
//             const salaryAdjustments: any[] = [];
    
//             for (const booking of fetchedBookings) {
//                 let balanceSalary = Number(booking.totalDriverSalary) - booking.transferedSalary;
    
//                 if (balanceSalary <= 0) continue;
    
//                 const transferAmount = Math.min(balanceSalary, remainingAdvance);
//                 balanceSalary -= transferAmount;
//                 remainingAdvance -= transferAmount;
    
//                 const bookingRef = doc(db, `user/${uid}/bookings`, booking.id);
//                 batch.update(bookingRef, {
//                     transferedSalary: booking.transferedSalary + transferAmount,
//                     balanceSalary,
//                 });
    
//                 salaryAdjustments.push({
//                     bookingId: booking.id,
//                     fileNumbers: [booking.amount],
//                     initialAdvance: advanceAmount,
//                     transferAmount,
//                     timestamp: Timestamp.now(),
//                 });
    
//                 if (remainingAdvance === 0) break;
//             }
    
//             const salaryAdjustmentsRef = collection(db, `user/${uid}/driver/${driverId}/salaryAdjustments`);
//             for (const adjustment of salaryAdjustments) {
//                 batch.set(doc(salaryAdjustmentsRef), adjustment);
//             }
    
//             const advanceDocRef = doc(db, `user/${uid}/advance`, advanceId);
//             batch.update(advanceDocRef, { advance: remainingAdvance });
//             const advanceDataDocRef = doc(db, `user/${uid}/driver/${driverId}/advanceData`, advanceDataId);
//             batch.update(advanceDataDocRef, { advance: remainingAdvance });
    
//             await batch.commit();
    
//             alert('Settlement complete and saved!');
//             await updateTotalAdvance(driverId);
//         } catch (error) {
//             console.error('Error during settlement:', error);
//             alert('Failed to complete settlement. Please try again.');
//         } finally {
//             setIsLoading(false);
//         }
//     };
//     // -----------------------------------------------------------
//     const handleDriverChange = (driverId: string) => {
//         console.log('Selected driver:', driverId);
//         setSelectedDriver(driverId);
//     };
//     const formatDate = (date: Date | string | undefined) => {
//         if (!date) return '';
//         const parsedDate = typeof date === 'string' ? new Date(date) : date;
//         return new Intl.DateTimeFormat('en-GB').format(parsedDate); // en-GB formats as dd/mm/yyyy
//     };
//     const handleEditClick = async (advanceId: string, advanceAmount: number) => {
//         try {
//             const advanceDocRef = doc(db, `user/${uid}/advance`, advanceId);
//             const advanceDoc = await getDoc(advanceDocRef);

//             if (advanceDoc.exists()) {
//                 const advanceData = advanceDoc.data();
//                 setSelectedDriver(advanceData.driverId);
//                 setSelectedType(advanceData.type);
//                 setDate(formatDate(advanceData.advancePaymentDate.toDate()));
//                 setAmount(advanceAmount);
//                 setEditAmount(advanceAmount);
//                 setIsEditing(true);
//             } else {
//                 console.error('Advance document not found.');
//             }
//         } catch (error) {
//             console.error('Error fetching advance details:', error);
//         }
//     };
//     const handleUpdate = async () => {
//         if (!selectedDriver || !amount || editAmount === '') {
//             alert('Please fill out all fields.');
//             return;
//         }

//         try {
//             const currentDate = new Date();
//             const timestampDate = Timestamp.fromDate(currentDate);
//             const advanceDocRef = doc(db, `user/${uid}/advance`, advanceDetails[0].id);

//             // Update the advance collection
//             await updateDoc(advanceDocRef, {
//                 advance: amount,
//                 advancePaymentDate: timestampDate,
//             });

//             // Update the advanceData subcollection
//             const driverDocRef = doc(db, `user/${uid}/driver`, selectedDriver);
//             const subcollectionRef = collection(driverDocRef, 'advanceData');
//             const advanceDataQuery = query(subcollectionRef, where('advanceId', '==', advanceDetails[0].id));
//             const querySnapshot = await getDocs(advanceDataQuery);

//             querySnapshot.forEach(async (docSnapshot) => {
//                 await updateDoc(docSnapshot.ref, {
//                     advance: amount,
//                     advancePaymentDate: timestampDate,
//                 });
//             });

//             await updateTotalAdvance(selectedDriver);

//             // alert('Advance details updated successfully!');
//             setIsEditing(false);
//             setAmount('');
//             setDate('');
//         } catch (error) {
//             console.error('Error updating data:', error);
//             alert('Failed to update data. Please try again.');
//         }
//     };
//     useEffect(() => {
//         // Set default date to today if it's not already set
//         if (!date) {
//             setDate(new Date().toISOString().split('T')[0]);
//         }
//     }, [date]);
//     const handleDeleteClick = async (advanceId: string, advanceDataId: string, advanceAmount: number, driverId: string) => {
//         try {
//             const confirmDelete = window.confirm('Are you sure you want to delete this advance record?');
//             if (!confirmDelete) return;
    
//             // Reference to the advance document
//             const advanceDocRef = doc(db, `user/${uid}/advance`, advanceId);
//             // Reference to the advanceData document inside driver subcollection
//             const advanceDataDocRef = doc(db, `user/${uid}/driver/${driverId}/advanceData`, advanceDataId);
    
//             // Perform delete operations
//             await deleteDoc(advanceDocRef);   // Delete from advance collection
//             await deleteDoc(advanceDataDocRef);  // Delete from advanceData subcollection
    
//             // Update driver's total advance
//             await updateTotalAdvance(driverId);  
    
//             alert('Advance record deleted successfully!');
//         } catch (error) {
//             console.error('Error deleting advance record:', error);
//             alert('Failed to delete advance record. Please try again.');
//         }
//     };
//     const filteredAdvanceDetails = advanceDetails.filter((advance) => {
//         const term = searchTerm.toLowerCase();
//         return (
//             advance.driverName.toLowerCase().includes(term) ||
//             advance.advancePaymentDate.toLowerCase().includes(term) ||
//             String(advance.advance).toLowerCase().includes(term)
//         );
//     });
//     return (
//         <div>
//         {isLoading ? (
//             <div style={{ textAlign: 'center', marginTop: '20px' }}>
//                 <p>Loading...</p> {/* Replace this with a spinner or loader component if available */}
//             </div>
//         ) : (
//             <>
//             <div className="containerk">
//                 <h1 className="title">Payment Management</h1>
//                 <div className="form-group">
//                     <label htmlFor="driverDropdown">Select Driver:</label>
//                     <select
//                         id="driverDropdown"
//                         value={selectedDriver}
//                         onChange={(e) => handleDriverChange(e.target.value)}
//                         style={{
//                             appearance: 'none',
//                             WebkitAppearance: 'none',
//                             MozAppearance: 'none',
//                             backgroundColor: '#fff',
//                             backgroundRepeat: 'no-repeat',
//                             backgroundPosition: 'right 10px center',
//                             border: '2px solid #ddd',
//                             padding: '10px',
//                             width: '100%',
//                             borderRadius: '8px',
//                             fontSize: '1rem',
//                             transition: 'all 0.3s ease',
//                         }}
//                         onFocus={(e) => {
//                             e.target.style.borderColor = '#4CAF50';
//                             e.target.style.boxShadow = '0 0 5px rgba(76, 175, 80, 0.5)';
//                             e.target.style.outline = 'none';
//                         }}
//                         onBlur={(e) => {
//                             e.target.style.borderColor = '#ddd';
//                             e.target.style.boxShadow = 'none';
//                         }}
//                     >
//                         <option value="" disabled>
//                             -- Select a Driver --
//                         </option>
//                         {drivers.map((driver) => (
//                             <option key={driver.id} value={driver.id}>
//                                 {driver.driverName}
//                             </option>
//                         ))}
//                     </select>
//                 </div>
//                 <div className="form-group">
//                     <label htmlFor="typeDropdown">TYPES:</label>
//                     <select
//                         id="typeDropdown"
//                         value={selectedType}
//                         onChange={(e) => setSelectedType(e.target.value)}
//                         style={{
//                             appearance: 'none',
//                             WebkitAppearance: 'none',
//                             MozAppearance: 'none',
//                             backgroundColor: '#fff',
//                             backgroundRepeat: 'no-repeat',
//                             backgroundPosition: 'right 10px center',
//                             border: '2px solid #ddd',
//                             padding: '10px',
//                             width: '100%',
//                             borderRadius: '8px',
//                             fontSize: '1rem',
//                             transition: 'all 0.3s ease',
//                         }}
//                         onFocus={(e) => {
//                             e.target.style.borderColor = '#4CAF50';
//                             e.target.style.boxShadow = '0 0 5px rgba(76, 175, 80, 0.5)';
//                             e.target.style.outline = 'none';
//                         }}
//                         onBlur={(e) => {
//                             e.target.style.borderColor = '#ddd';
//                             e.target.style.boxShadow = 'none';
//                         }}
//                     >
//                         <option value="" disabled>
//                             -- Select a Type --
//                         </option>
//                         <option value="advance">Advance</option>
//                         <option value="salary">Salary</option>
//                         <option value="expense">Expense</option>
//                     </select>
//                 </div>

//                 <div style={{ marginBottom: '16px' }}>
//                     <label
//                         htmlFor="amountField"
//                         style={{
//                             display: 'block',
//                             marginBottom: '8px',
//                             fontWeight: 'bold',
//                         }}
//                     >
//                         {selectedType === 'advance' ? 'Advance Amount:' : 'Amount:'}
//                     </label>
//                     <input
//                         type="text"
//                         id="amountField"
//                         value={amount}
//                         onChange={(e) => setAmount(Number(e.target.value))}
//                         placeholder={selectedType === 'advance' ? 'Enter Advance Amount' : 'Enter Amount'}
//                         style={{
//                             appearance: 'none',
//                             WebkitAppearance: 'none',
//                             MozAppearance: 'none',
//                             backgroundColor: '#fff',
//                             border: '2px solid #ddd',
//                             padding: '10px',
//                             width: '100%',
//                             borderRadius: '8px',
//                             fontSize: '1rem',
//                             transition: 'all 0.3s ease',
//                         }}
//                         onFocus={(e) => {
//                             e.target.style.borderColor = '#4CAF50';
//                             e.target.style.boxShadow = '0 0 5px rgba(76, 175, 80, 0.5)';
//                         }}
//                         onBlur={(e) => {
//                             e.target.style.borderColor = '#ddd';
//                             e.target.style.boxShadow = 'none';
//                         }}
//                     />
//                 </div>
//                 <button className="add-button" onClick={isEditing ? handleUpdate : handleAdd}>
//                     {isEditing ? 'Update Details' : 'Add And settle Amount'}
//                 </button>
//                 <ConfirmationModal
//         isOpen={isModalOpen}
//         onConfirm={confirmAdd}
//         onCancel={cancelAdd}
//         message="Are you sure you want to add this data?"
//     />
//             </div>
         
//             <div className="advance-details">
//                 <h2 className="advance-h2">Advance Details</h2>
//                 <input
//                         type="text"
//                         placeholder="Search..."
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                         style={{
//                             padding: '10px',
//                             borderRadius: '5px',
//                             border: '1px solid #ccc',
//                             width: '100%',
//                             boxSizing: 'border-box',
//                             marginBottom: '10px',
//                         }}
//                     />
//                 {advanceDetails.length === 0 ? (
//                     <p>No advance details available.</p>
//                 ) : (
//                     <table className="advance-table">
//                         <thead>
//                             <tr>
//                                 <th>SI</th>
//                                 <th>Driver Name</th>
//                                 <th>Advance Payment Date</th>
//                                 <th>Initial Advance</th>

//                                 <th>Advance After Deduction</th>
//                                 <th>Action</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {filteredAdvanceDetails.map((advance, index) => (
//                                 <tr key={advance.id}>
//                                     <td>{index + 1}</td>
//                                     <td>{advance.driverName}</td>
//                                     <td>{advance.advancePaymentDate}</td>
//                                     <td>₹{advance.addedAdvance}</td>

//                                     <td>₹{advance.advance}</td>
//                                    <td> {role === 'admin' && (
//                                          <>
//                                         <button
//                                             onClick={() => handleEditClick(advance.id, advance.advance)}
//                                             style={{
//                                                 backgroundColor: '#4CAF50',
//                                                 color: 'white',
//                                                 border: 'none',
//                                                 padding: '10px 20px',
//                                                 textAlign: 'center',
//                                                 textDecoration: 'none',
//                                                 display: 'inline-block',
//                                                 fontSize: '14px',
//                                                 margin: '5px 2px',
//                                                 borderRadius: '5px',
//                                                 cursor: 'pointer',
//                                                 boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
//                                             }}
//                                         >
//                                             Edit
//                                         </button>
//                                           <button
//                                             onClick={() => handleDeleteClick(advance.id, advance.advanceDataId, advance.advance, advance.driverId)}
//                                             style={{
//                                                 backgroundColor: '#f44336',
//                                                 color: 'white',
//                                                 border: 'none',
//                                                 padding: '10px 20px',
//                                                 textAlign: 'center',
//                                                 textDecoration: 'none',
//                                                 display: 'inline-block',
//                                                 fontSize: '14px',
//                                                 margin: '5px 2px',
//                                                 borderRadius: '5px',
//                                                 cursor: 'pointer',
//                                                 boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
//                                             }}
//                                         >
//                                             Delete
//                                         </button>
//                                         <button
//                                             onClick={() => handleSettleClick(advance.id, advance.advanceDataId, advance.advance, advance.driverId)}
//                                             style={{
//                                                 backgroundColor: 'blue',
//                                                 color: 'white',
//                                                 border: 'none',
//                                                 padding: '10px 20px',
//                                                 textAlign: 'center',
//                                                 textDecoration: 'none',
//                                                 display: 'inline-block',
//                                                 fontSize: '14px',
//                                                 margin: '5px 2px',
//                                                 borderRadius: '5px',
//                                                 cursor: 'pointer',
//                                                 boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
//                                             }}
//                                         >
//                                             Settle
//                                         </button>
                                        
//             </>
//           )}
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                         </table>
//                     )}
//                 </div>
//             </>
//         )}
//     </div>
//     );
// };

// export default Advance;
import React, { useEffect, useState } from 'react';
import { getFirestore, collection, doc, query, where, getDocs, addDoc, Timestamp, onSnapshot, updateDoc, getDoc, orderBy, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import './Advance.css';
import ConfirmationModal from './ConfirmationModal';
import ConfirmationModal1 from './ConfirmationModal1';
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
    addedAdvance:number;
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
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [receivedAmount, setReceivedAmount] = useState<number | ''>('');
    const [isModalOpen1, setIsModalOpen1] = React.useState(false);

    const db = getFirestore();
    const uid = sessionStorage.getItem('uid') || '';
    const role = sessionStorage.getItem('role');

    console.log('uid', role);

    const [isModalOpen, setIsModalOpen] = React.useState(false);
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
    const confirmAdd1 = async () => {
        setIsModalOpen(false);  // Close modal after confirmation
        setIsLoading(true);
    }
    // Cancel Modal
const cancelAdd1 = () => {
    setIsModalOpen(false);
};
const handleReceiveSettle = () =>{

}
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
                                    hour12: true,  // Use 24-hour format
                                    timeZone: 'Asia/Kolkata'  // Set timezone to IST
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
                    console.log("mmmm",sortedAdvanceList)
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
        setIsModalOpen(true);  // Open modal for confirmation
    };
    const confirmAdd = async () => {
        setIsModalOpen(false);  // Close modal after confirmation
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
            const driverName = selectedDriverObj.driverName; // Get the driver name
            console.log('driver name', driverName);
            if (selectedType === 'advance') {
                const advanceRef = collection(db, `user/${uid}/advance`);
    
                // Fetch existing advance for the driver
                const q = query(advanceRef, where('driverId', '==', selectedDriver));
                const snapshot = await getDocs(q);
                let existingAdvance = 0;
                const batch = writeBatch(db);  // Use batch for efficiency

                // let advanceDocId = null;
            
                snapshot.forEach((doc) => {
                    const advanceData = doc.data();
                    existingAdvance += advanceData.advance || 0;
                    batch.update(doc.ref, { advance: 0 });
        
                    const driverAdvanceDataQuery = query(
                        collection(db, `user/${uid}/driver/${selectedDriver}/advanceData`),
                        where('advanceId', '==', doc.id)
                    );
            
                    getDocs(driverAdvanceDataQuery).then((advanceDataSnapshot) => {
                        advanceDataSnapshot.forEach((dataDoc) => {
                            batch.update(dataDoc.ref, { advance: 0 });
                        });
                    });
                });
            
                await batch.commit();
            
                const newAdvance = existingAdvance + Number(amount);  // Sum of previous and current advance
                
                const advanceDoc = await addDoc(advanceRef, {
                    driverId: selectedDriver,
                    driverName: driverName,
                    advancePaymentDate: serverTimestamp(),
                    advance: amount,
                    addedAdvance: newAdvance,

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
                    advance: newAdvance,
                    addedAdvance: newAdvance,
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
            setSelectedType('');
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
        setIsLoading(true);
        try {
            console.log(`Starting settlement for advanceId: ${advanceId}, driverId: ${driverId}`);
            const bookingsRef = collection(db, `user/${uid}/bookings`);
            const q = query(
                bookingsRef,
                where('selectedDriver', '==', driverId),
                where('status', '==', 'Order Completed'),
                where('bookingChecked', '==', true)
            );
            const querySnapshot = await getDocs(q);
    
            const fetchedBookings: Booking[] = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    driverId: data.selectedDriver,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    bookingDate: data.bookingDate?.toDate() || new Date(), // Ensure bookingDate is present
                    amount: data.fileNumber,
                    totalDriverSalary: typeof data.totalDriverSalary === 'string' 
                        ? parseFloat(data.totalDriverSalary) 
                        : data.totalDriverSalary || 0, // Convert string to number
                    transferedSalary: data.transferedSalary || 0,
                } as Booking;
            })
            .filter((booking) => {
                const totalSalary = typeof booking.totalDriverSalary === 'string' 
                    ? parseFloat(booking.totalDriverSalary) 
                    : booking.totalDriverSalary;
            
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
    
            // Reference to the advance document
            const advanceDocRef = doc(db, `user/${uid}/advance`, advanceId);
            // Reference to the advanceData document inside driver subcollection
            const advanceDataDocRef = doc(db, `user/${uid}/driver/${driverId}/advanceData`, advanceDataId);
    
            // Perform delete operations
            await deleteDoc(advanceDocRef);   // Delete from advance collection
            await deleteDoc(advanceDataDocRef);  // Delete from advanceData subcollection
    
            // Update driver's total advance
            await updateTotalAdvance(driverId);  
    
            alert('Advance record deleted successfully!');
        } catch (error) {
            console.error('Error deleting advance record:', error);
            alert('Failed to delete advance record. Please try again.');
        }
    };
    const filteredAdvanceDetails = advanceDetails.filter((advance) => {
        const term = searchTerm.toLowerCase();
        return (
            advance.driverName.toLowerCase().includes(term) ||
            advance.advancePaymentDate.toLowerCase().includes(term) ||
            String(advance.advance).toLowerCase().includes(term)
        );
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
                {selectedType === "advance" && (
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
              
                <ConfirmationModal
        isOpen={isModalOpen}
        onConfirm={confirmAdd}
        onCancel={cancelAdd}
        message="Are you sure you want to add this data?"
    />
  
      </div>
        )}
      {selectedType === "cashCollection" && (
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
                <button className="add-button" onClick={handleReceiveSettle}>
    Settle Received Amount
</button>

              
                <ConfirmationModal1
        isOpen={isModalOpen1}
        onConfirm1={confirmAdd1}
        onCancel1={cancelAdd1}
        message="Are you sure you want to settle this Received Amount?"
    />
  
      </div>
        )}

            </div>
            {selectedType === "advance" && (
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
                                   <td> {role === 'admin' && (
                                         <>
                                        <button
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
                                        </button>
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
