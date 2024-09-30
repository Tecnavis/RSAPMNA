import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { collection, getDocs, getFirestore, onSnapshot, doc, getDoc, query, orderBy, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, TextField, CircularProgress } from '@mui/material';

// Define TypeScript interfaces
interface BookingRecord {
    id: string;
    dateTime: string;
    driver: string;
    vehicleNumber: string;
    customerName: string;
    phoneNumber: string;
    mobileNumber: string;
    pickupLocation: { name: string } | null;
    dropoffLocation: { name: string } | null;
    status: 'Rejected' | 'Order Completed' | 'pending' | string;
    bookingStatus?: string;
    selectedDriver?: string;
    cancelReason?: string;
    company: string;
    companyName: string;
    formAdded: boolean;
}

interface Driver {
    id: string;
    name: string;
    phone: string;
    // Add other relevant driver fields here
}

const Container = styled.div`
    padding: 20px;
`;

const Card = styled.div`
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    padding: 20px;
    display: flex;
    flex-direction: column;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
`;

const Title = styled.h5`
    font-size: 1.25rem;
    font-weight: 600;
    color: #333;
`;

const SearchInput = styled.input`
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    margin-bottom: 20px;
`;

const StatusBadge = styled.span<{ status: string }>`
    padding: 8px 12px;
    border-radius: 20px;
    font-weight: bold;
    text-align: center;
    display: inline-block;
    color: white;
    background-color: ${(props) => {
        switch (props.status) {
            case 'Rejected':
                return '#e74c3c';
            case 'Order Completed':
                return '#27ae60';
            case 'pending':
                return '#3498db';
            case 'Cancelled':
                return '#e67e22';
            default:
                return '#f39c12';
        }
    }};
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transition: background-color 0.3s ease, transform 0.3s ease;
    &:hover {
        transform: scale(1.05);
        background-color: ${(props) => {
            switch (props.status) {
                case 'Rejected':
                    return '#c0392b';
                case 'Order Completed':
                    return '#2ecc71';
                case 'pending':
                    return '#e67e22';
                case 'Cancelled':
                    return '#d35400';
                default:
                    return '#e67e22';
            }
        }};
    }
    animation: fadeIn 1.5s ease-in-out;
    letter-spacing: 1px;
`;

const ReassignButton = styled.button`
    background-color: red;
    color: white;
    padding: 5px 10px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 10px;
`;

const DataItem = styled.div`
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
`;

const Label = styled.span`
    font-weight: bold;
`;

const Value = styled.span`
    color: #555;
`;

const OrderDetailsButton = styled.button`
    background-color: #3498db;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-family: 'Georgia, serif';
    border: 1px solid #2980b9;

    &:hover {
        background-color: #2980b9;
    }

    &:active {
        background-color: #1c598a;
    }
`;

const StatusTable: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [recordsData, setRecordsData] = useState<BookingRecord[]>([]);
    const [drivers, setDrivers] = useState<Record<string, Driver>>({});
    const [uniform, setUniform] = useState<string | null>(null);
    const [behavior, setBehavior] = useState<string | null>(null);
    const [idCard, setIdCard] = useState<string | null>(null);
    const [inventory, setInventory] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [feedbackVideo, setFeedbackVideo] = useState<string | null>(null);
    const [dId, setDId] = useState<string | null>(null);
    const [bId, setBid] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [docId, setDocId] = useState<string>('');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [fixedPoint, setFixedPoint] = useState<number | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid') || '';
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

    console.log(fixedPoint, 'this is the fixed point');
    useEffect(() => {
        dispatch(setPageTitle('Status'));

        const fetchBookings = async () => {
            const q = query(collection(db, `user/${uid}/bookings`), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const updatedBookingsData = querySnapshot.docs
                .map((doc) => {
                    const data = doc.data() as BookingRecord;
                    return {
                        ...data, // Spread all other fields except id
                        id: doc.id, // Add the id explicitly here
                    };
                })
                .filter((record) => record.status !== 'Approved');
            setRecordsData(updatedBookingsData);

            const driverData: Record<string, Driver> = {};
            for (const record of updatedBookingsData) {
                const driverId = record.selectedDriver;

                if (driverId && !driverData[driverId]) {
                    const driverDoc = await getDoc(doc(db, `user/${uid}/driver`, driverId));
                    if (driverDoc.exists()) {
                        driverData[driverId] = driverDoc.data() as Driver;
                    }
                }
            }
            setDrivers(driverData);
        };

        const unsubscribe = onSnapshot(collection(db, `user/${uid}/bookings`), () => {
            fetchBookings();
        });

        return () => unsubscribe();
    }, [db, dispatch, uid]);

    const handleReassignClick = (record: BookingRecord) => {
        navigate(`/bookings/booking/${record.id}`, { state: { editData: record } });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleOrderDetails = (record: BookingRecord) => {
        navigate(`/bookings/newbooking/viewmore/${record.id}`);
    };

    const filteredRecordsData = recordsData.filter((record) => Object.values(record).some((value) => value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())));

    const sortedRecordsData = filteredRecordsData.slice().sort((a, b) => {
        const dateA = new Date(a.dateTime);
        const dateB = new Date(b.dateTime);
        return dateB.getTime() - dateA.getTime();
    });

    const completedBookings = sortedRecordsData.filter((record) => record.status === 'Order Completed');
    const ongoingBookings = sortedRecordsData.filter((record) => record.status !== 'Order Completed');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        let points = 0;
         setLoadingId(bId)
         setLoading(true)
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
                onRequestClose();
            } else {
                console.log('Driver document not found.');
            }
        } catch (error) {
            console.error('Error updating points:', error);
        } finally {
            setLoadingId(null)
            setLoading(false)
        }
    };

    const onRequestClose = () => {
        setIsModalOpen(false);
        setUniform('');
        setFeedbackVideo('');
        setInventory('');
        setIdCard('');
        setBehavior('');
    };

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

    console.log(dId, 'this is the driver id');

    useEffect(() => {
        fetchPoints();
    }, []);

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const parsedValue = value === '' ? null : parseFloat(value); // Convert to number or assign null for empty input
        setFixedPoint(parsedValue); // Update fixedPoint with the parsed number
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
    return (
        <Container>
            <Header>
                <Title>Driver Status</Title>
                <SearchInput type="text" value={searchQuery} onChange={handleSearchChange} placeholder="Search..." />
            </Header>
            {ongoingBookings.map((record) => (
                <Card
                    key={record.id}
                    style={{
                        backgroundColor: record.bookingStatus === 'ShowRoom Booking' ? 'lightblue' : 'inherit',
                    }}
                >
                    <DataItem
                        style={{
                            margin: '5px 0',
                            color: '#7f8c8d',
                            marginLeft: 'auto',
                            fontFamily: 'Georgia, serif',
                            fontSize: '16px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#ecf0f1',
                            border: '1px solid #bdc3c7',
                        }}
                    >
                        <Label>Date & Time:</Label>
                        <Value>{record.dateTime}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>Driver Name:</Label>
                        <Value>{record.driver}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>Vehicle Number:</Label>
                        <Value>{record.vehicleNumber}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>Customer Name:</Label>
                        <Value>{record.customerName}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>Customer Contact Number:</Label>
                        <Value>
                            {record.phoneNumber} / {record.mobileNumber}
                        </Value>
                    </DataItem>
                    <DataItem>
                        <Label>Pickup Location:</Label>
                        <Value>{record.pickupLocation ? record.pickupLocation.name : 'N/A'}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>DropOff Location:</Label>
                        <Value>{record.dropoffLocation ? record.dropoffLocation.name : 'N/A'}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>Status:</Label>
                        <Value>
                            <StatusBadge status={record.status}>{record.status}</StatusBadge>
                        </Value>
                    </DataItem>
                    {record.status === 'Cancelled' && (
                        <DataItem>
                            <Label>Cancellation Reason:</Label>
                            <Value>{record.cancelReason}</Value>
                        </DataItem>
                    )}
                    {(record.status === 'Rejected' || record.status === 'Cancelled') && <ReassignButton onClick={() => handleReassignClick(record)}>Reassign</ReassignButton>}
                    <OrderDetailsButton onClick={() => handleOrderDetails(record)}>
                        Order Details
                        <IconArrowLeft />
                    </OrderDetailsButton>
                </Card>
            ))}

            <Header>
                <Title>Order Completed</Title>
            </Header>
            {completedBookings.map((record) => (
                <Card key={record.id} style={{ background: 'linear-gradient(179.1deg, rgb(43, 170, 96) 2.3%, rgb(129, 204, 104) 98.3%)',}}>
                    <DataItem
                        style={{
                            margin: '5px 0',
                            color: '#7f8c8d',
                            marginLeft: 'auto',
                            fontFamily: 'Georgia, serif',
                            fontSize: '16px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#ecf0f1',
                            border: '1px solid #bdc3c7',
                        }}
                    >
                        <Label>Date & Time:</Label>
                        <Value>{record.dateTime}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>Driver Name:</Label>
                        <Value>{record.driver}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>Vehicle Number:</Label>
                        <Value>{record.vehicleNumber}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>Customer Name:</Label>
                        <Value>{record.customerName}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>Customer Contact Number:</Label>
                        <Value>
                            {record.phoneNumber} / {record.mobileNumber}
                        </Value>
                    </DataItem>
                    <DataItem>
                        <Label>Pickup Location:</Label>
                        <Value>{record.pickupLocation ? record.pickupLocation.name : 'N/A'}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>DropOff Location:</Label>
                        <Value>{record.dropoffLocation ? record.dropoffLocation.name : 'N/A'}</Value>
                    </DataItem>

                    <DataItem>
                        <Label>Status:</Label>
                        <Value>
                            <StatusBadge status="Order Completed">{record.status}</StatusBadge>
                        </Value>
                    </DataItem>
                    {record.company === 'self' && !record.formAdded && (
                        <DataItem>
                            <Label>Feedback :</Label>
                            <Value>
                                {loadingId === record.id  ?  (
                                     <button
                                     className="bg-blue-500 text-white py-2 px-4 rounded"
                                 >
                                    <CircularProgress size={24} color="inherit"/>
                                 </button>    
                                ) : (
                                    <button
                                    className="bg-blue-500 text-white py-2 px-4 rounded"
                                    onClick={() => {
                                        onRequestOpen(record.selectedDriver, record.id);
                                    }}
                                >
                                    Open form
                                </button>
                                )}
                               
                            </Value>
                        </DataItem>
                    )}
                    <OrderDetailsButton onClick={() => handleOrderDetails(record)}>
                        Order Details
                        <IconArrowLeft />
                    </OrderDetailsButton>
                </Card>
            ))}
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
                               <CircularProgress size={24} color="inherit"/>
                            </Button>
                          ):(
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
        </Container>
    );
};

export default StatusTable;
