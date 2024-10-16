import React, { useEffect, useState, ChangeEvent } from 'react';
import { getFirestore, collection, getDocs, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Define the shape of a booking record

interface Booking {
    id: string;
    dateTime: string;
    customerName: string;
    phoneNumber: string;
    serviceType: string;
    vehicleNumber: string;
    comments: string;
    status: string; // Added status to match your current logic
    selectedDriver: string;
    formAdded: string;
    approved: boolean;
}

interface Driver {
    id: string;
    name: string;
    phone: string;
    companyName: string;
    // Add other relevant driver fields here
}

const ClosedBooking: React.FC = () => {
    const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [allDrivers, setALLDrivers] = useState<Driver[]>([]);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [uniform, setUniform] = useState<string | null>(null);
    const [inventory, setInventory] = useState<string | null>(null);
    const [feedbackVideo, setFeedbackVideo] = useState<string | null>(null);
    const [fixedPoint, setFixedPoint] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [docId, setDocId] = useState<string>('');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [behavior, setBehavior] = useState<string | null>(null);
    const [idCard, setIdCard] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dId, setDId] = useState<string | null>(null);
    const [bId, setBid] = useState<string | null>(null);
    const [loadingBookings, setLoadingBookings] = useState<Set<string>>(new Set());

    const db = getFirestore();
    const uid = sessionStorage.getItem('uid');
    const navigate = useNavigate();
    const fetchPoints = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, `user/${uid}/driverPoint`));

            if (!querySnapshot.empty) {
                const docData = querySnapshot.docs[0].data();
                setFixedPoint(docData.point); // Set the point value
                setDocId(querySnapshot.docs[0].id); // Set the document ID
            } else {
                console.log('No documents found in the collection!');
            }
        } catch (err) {
            console.error('Error fetching point:', err);
        }
    };

    const fetchDrivers = async () => {
        try {
            const driversCollection = collection(db, `user/${uid}/driver`);
            const driverSnapshot = await getDocs(driversCollection);
            const driverList = driverSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Driver[]; // Type assertion to indicate the shape of objects is Driver

            setALLDrivers(driverList); // Store the fetched drivers in state
            console.log(driverList, 'Fetched Drivers'); // Optional logging
        } catch (error) {
            console.error('Error fetching drivers:', error);
        }
    };

    const fetchCompletedBookings = async () => {
        try {
            const db = getFirestore();
            // Query for bookings that have status: 'Order Completed'
            const q = query(collection(db, `user/${uid}/bookings`), where('status', '==', 'Order Completed'));
            const querySnapshot = await getDocs(q);

            // Map the fetched documents to extract the data
            const bookingsData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Booking[];

            // Filter out bookings with approved: true
            const filteredBookings = bookingsData.filter((booking) => booking.approved !== true);

            console.log('Filtered bookingsData', filteredBookings);
            // Set the state with the filtered bookings
            setCompletedBookings(filteredBookings);
        } catch (error) {
            console.error('Error fetching completed bookings:', error);
        }
    };
    // ------------------------`/bookings/newbooking/viewmore/${rowData.id}`---------------------
    useEffect(() => {
        fetchCompletedBookings();
        fetchDrivers();
        fetchPoints();
    }, [uid]);
    const handleViewMore = (id: string) => {
        navigate(`/bookings/newbooking/viewmore/${id}`);
      };
    const handleApprove = async (bookingId: string) => {
        setLoadingBookings((prev) => new Set(prev).add(bookingId)); // Add booking ID to loading set
        try {
            const db = getFirestore();
            const bookingRef = doc(db, `user/${uid}/bookings`, bookingId);

            // Update the document to set approved to true
            await updateDoc(bookingRef, {
                approved: true, // Add the approved field
            });

            // Update the state to reflect the changes immediately
            setCompletedBookings((prevBookings) => prevBookings.map((booking) => (booking.id === bookingId ? { ...booking, approved: true } : booking)));
            fetchCompletedBookings();
        } catch (error) {
            console.error('Error updating booking status:', error);
        } finally {
            setLoadingBookings((prev) => {
                const updatedSet = new Set(prev);
                updatedSet.delete(bookingId); 
                return updatedSet;
            });
        }
    };

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    console.log(completedBookings, 'this is the completed bookings');

    const filteredBookings = completedBookings.filter((booking) => Object.values(booking).some((value) => value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())));

    // opening feedback modal -----
    const onRequestOpen = (selectedDriver: string | undefined, id: string) => {
        if (selectedDriver) {
            setDId(selectedDriver); // Assuming setDId expects a driver's ID
            setBid(id);
            setIsModalOpen(true);
        } else {
            // Handle the case when selectedDriver is undefined
            console.error('Selected driver is undefined');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const parsedValue = value === '' ? null : parseFloat(value); // Convert to number or assign null for empty input
        setFixedPoint(parsedValue); // Update fixedPoint with the parsed number
    };

    const onRequestClose = () => {
        setIsModalOpen(false);
        setUniform('');
        setFeedbackVideo('');
        setInventory('');
        setIdCard('');
        setBehavior('');
    };

    const handleSaveClick = async () => {
        try {
            const docRef = doc(db, `user/${uid}/driverPoint`, docId); // Use the stored document ID

            await updateDoc(docRef, {
                point: fixedPoint, // Update the field with the new value
            });

            console.log('Point updated successfully!');
        } catch (err) {
            console.error('Error updating point:', err);
        }
        setIsEditing(false);
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        let points = 0;
        setLoadingId(bId);
        setLoading(true);

        // Ensure fixedPoint is a number, and set to 0 if null or NaN
        const validFixedPoint: number = typeof fixedPoint === 'number' ? fixedPoint : typeof fixedPoint === 'string' ? parseFloat(fixedPoint) : 0;

        // Check each field and add points for "yes" answers
        if (uniform === 'yes') points += validFixedPoint;
        if (idCard === 'yes') points += validFixedPoint;
        if (feedbackVideo === 'yes') points += validFixedPoint;
        if (behavior === 'good') points += validFixedPoint; // Assuming "good" is equivalent to "yes"
        if (inventory === 'filled') points += validFixedPoint; // Assuming "filled" is equivalent to "yes"

        try {
            // Ensure that both uid and dId are valid strings
           
            if (!uid || !dId || !bId) {
                console.error('Invalid uid, driver ID, or booking ID.');
                return;
            }

            // Retrieve the driver document from Firestore
            const driverDocRef = doc(db, `user/${uid}/driver`, dId);
            const driverDoc = await getDoc(driverDocRef);
            console.log(driverDoc, 'this is the driver doc');

            if (driverDoc.exists()) {
                // Get the current points (if they exist) and add the new points
                const currentPoints = driverDoc.data().points || 0;
                console.log(currentPoints, 'this is the current points');
                const newPoints = currentPoints + points;

                // Update the driver document with the new points
                await updateDoc(driverDocRef, {
                    rewardPoints: newPoints,
                });

                console.log(`Points updated successfully. New total: ${newPoints}`);

                // Now update the booking document
                const bookingDocRef = doc(db, `user/${uid}/bookings`, bId);
                await updateDoc(bookingDocRef, {
                    formAdded: true,
                });

                console.log(`Booking updated successfully. formAdded set to true.`);

                // Call handleApprove to update booking status
                await handleApprove(bId);
                fetchCompletedBookings();

                // Close the request
                onRequestClose();
            } else {
                console.log('Driver document not found.');
            }
        } catch (error) {
            console.error('Error updating points:', error);
        } finally {
            setLoadingId(null);
            setLoading(false);
        }
    };

    return (
        <div className="panel mt-6">
            <h5 className="font-semibold text-lg dark:text-white-light mb-5">Completed Bookings</h5>
            <div className="mb-5">
                <input type="text" value={searchQuery} onChange={handleSearchChange} placeholder="Search..." className="w-full p-2 border border-gray-300 rounded" />
                <div className="mt-4">
                    <div className="datatables">
                        {filteredBookings.length === 0 ? (
                            <p>No completed bookings found.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table-hover min-w-full border-collapse block md:table">
                                    <thead className="block md:table-header-group">
                                        <tr className="border border-gray-300 block md:table-row absolute -top-full md:top-auto -left-full md:left-auto md:relative">
                                            <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">Date & Time</th>
                                            <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">Customer Name</th>
                                            <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">Phone Number</th>
                                            <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">Service Type</th>
                                            <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">Vehicle Number</th>
                                            <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="block md:table-row-group">
                                        {filteredBookings
                                            .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()) // Sort by dateTime descending
                                            .map((booking) => (
                                                <tr key={booking.id} className="bg-white border border-gray-300 block md:table-row">
                                                    <td className="p-2 text-sm block md:table-cell">{new Date(booking.dateTime).toLocaleString('en-GB')} </td>
                                                    <td className="p-2 text-sm block md:table-cell">{booking.customerName}</td>
                                                    <td className="p-2 text-sm block md:table-cell">{booking.phoneNumber}</td>
                                                    <td className="p-2 text-sm block md:table-cell">{booking.serviceType}</td>
                                                    <td className="p-2 text-sm block md:table-cell">{booking.vehicleNumber}</td>
                                                    <td>
                                                    <Button
                              variant="contained"
                              color="primary"
                              onClick={() => handleViewMore(booking.id)}  // Navigate on click
                            >
                              View More
                            </Button>
                                                    </td>
                                                    <td className="p-2 text-sm block md:table-cell">
                                                        {booking.selectedDriver &&
                                                        !booking.formAdded &&
                                                        allDrivers.some((driver) => driver.id === booking.selectedDriver && driver.companyName === 'RSA') ? (
                                                            // Check if the booking matches the selected driver and the company name
                                                            <button
                                                                style={{
                                                                    backgroundColor: 'green',
                                                                    color: '#fff',
                                                                    border: '1px solid #007bff',
                                                                    padding: '8px 16px',
                                                                    fontSize: '16px',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    transition: 'background-color 0.3s, color 0.3s, border-color 0.3s',
                                                                }}
                                                                onClick={() => onRequestOpen(booking.selectedDriver, booking.id)}
                                                            >
                                                                {booking.status === 'Approved' ? 'Approved' : 'Open form'}
                                                            </button>
                                                        ) : (
                                                            // Fallback if the driver doesn’t match or no driver is selected
                                                            <div>
                                                                {loading ? (
                                                                    <button
                                                                        style={{
                                                                            backgroundColor: '#007bff',
                                                                            color: '#fff',
                                                                            border: '1px solid #007bff',
                                                                            padding: '8px 16px',
                                                                            fontSize: '16px',
                                                                            borderRadius: '4px',
                                                                            cursor: 'pointer',
                                                                            transition: 'background-color 0.3s, color 0.3s, border-color 0.3s',
                                                                        }}
                                                                        disabled={booking.status === 'Approved'}
                                                                    >
                                                                        <CircularProgress size={24} color="inherit" />
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        style={{
                                                                            backgroundColor: '#007bff',
                                                                            color: '#fff',
                                                                            border: '1px solid #007bff',
                                                                            padding: '8px 16px',
                                                                            fontSize: '16px',
                                                                            borderRadius: '4px',
                                                                            cursor: 'pointer',
                                                                            transition: 'background-color 0.3s, color 0.3s, border-color 0.3s',
                                                                        }}
                                                                        onClick={() => handleApprove(booking.id)}
                                                                        disabled={booking.status === 'Approved'}
                                                                    >
                                                                        {booking.status === 'Approved' ? 'Approved' : 'Approve'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Dialog
                open={isModalOpen}
                onClose={onRequestClose}
                maxWidth="sm" // Optional: controls the maximum width of the dialog
                fullWidth // Optional: forces the dialog to take full width
                scroll="paper" // Makes the modal content scrollable
            >
                <DialogTitle>
                    {isEditing ? (
                        <div>
                            <TextField value={fixedPoint} onChange={handleInputChange} variant="outlined" size="small" />
                            <Button variant="contained" color="primary" onClick={handleSaveClick}>
                                Save
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <p>Point for each question</p>
                            <Button variant="contained" color="primary" onClick={handleEditClick}>
                                {fixedPoint}
                            </Button>
                        </div>
                    )}
                </DialogTitle>

                <DialogContent dividers={true} style={{ maxHeight: '400px' }}>
                    {' '}
                    {/* Add maxHeight for scrollable content */}
                    <form onSubmit={handleSubmit}>
                        <FormControl component="fieldset" fullWidth>
                            <FormLabel component="legend">Uniform:</FormLabel>
                            <RadioGroup value={uniform} onChange={(e) => setUniform(e.target.value)}>
                                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                                <FormControlLabel value="no" control={<Radio />} label="No" />
                            </RadioGroup>
                        </FormControl>

                        <FormControl component="fieldset" fullWidth>
                            <FormLabel component="legend">Behavior:</FormLabel>
                            <RadioGroup value={behavior} onChange={(e) => setBehavior(e.target.value)}>
                                <FormControlLabel value="good" control={<Radio />} label="Good" />
                                <FormControlLabel value="bad" control={<Radio />} label="Bad" />
                            </RadioGroup>
                        </FormControl>

                        <FormControl component="fieldset" fullWidth>
                            <FormLabel component="legend">ID Card:</FormLabel>
                            <RadioGroup value={idCard} onChange={(e) => setIdCard(e.target.value)}>
                                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                                <FormControlLabel value="no" control={<Radio />} label="No" />
                            </RadioGroup>
                        </FormControl>

                        <FormControl component="fieldset" fullWidth>
                            <FormLabel component="legend">Inventory Sheet:</FormLabel>
                            <RadioGroup value={inventory} onChange={(e) => setInventory(e.target.value)}>
                                <FormControlLabel value="filled" control={<Radio />} label="Filled" />
                                <FormControlLabel value="unfilled" control={<Radio />} label="Unfilled" />
                            </RadioGroup>
                        </FormControl>

                        <FormControl component="fieldset" fullWidth>
                            <FormLabel component="legend">Feedback Video:</FormLabel>
                            <RadioGroup value={feedbackVideo} onChange={(e) => setFeedbackVideo(e.target.value)}>
                                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                                <FormControlLabel value="no" control={<Radio />} label="No" />
                            </RadioGroup>
                        </FormControl>
                        <DialogActions>
                            {loading ? (
                                <Button variant="contained" color="primary">
                                    <CircularProgress size={24} color="inherit" />
                                </Button>
                            ) : (
                                <div>
                                    <Button type="submit" variant="contained" color="primary">
                                        Submit
                                    </Button>
                                    <Button onClick={onRequestClose} color="secondary">
                                        Close
                                    </Button>
                                </div>
                            )}
                        </DialogActions>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ClosedBooking;
