
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { collection, getDocs, getFirestore, onSnapshot, doc, getDoc, query, orderBy, updateDoc, where, setDoc, addDoc, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import ReactModal from 'react-modal';
import IconPrinter from '../../components/Icon/IconPrinter';
interface TabButtonProps {
    isActive: boolean;
    tabType: 'ongoing' | 'pending' | 'completed';

}interface BookingRecord {
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
    updatedTotalSalary: number;
    paymentStatus?:string;
    fileNumber:string;
    pickedTime: Timestamp | null | undefined;
    droppedTime: Timestamp | null | undefined;

}

interface Driver {
    id: string;
    name: string;
    phone: string;
    companyName:string;
    selectedDriver: string;
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
const TabHeader = styled.div`
    display: flex;
    margin-bottom: 10px;
`;

const TabButton = styled.button<TabButtonProps>`
    flex: 1;
    padding: 10px;
     background-color: ${(props) =>
        props.isActive
            ? props.tabType === 'pending' ? '#e74c3c' : '#3498db'
            : '#ecf0f1'};
    color: ${(props) => (props.isActive ? '#fff' : '#2c3e50')};
  border: none;
    cursor: pointer;
    font-size: 16px;

   &:hover {
        background-color: ${(props) => (props.tabType === 'pending' ? '#e74c3c' : '#3498db')};
        color: #fff;
    }
`;

const StatusTable: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [recordsData, setRecordsData] = useState<BookingRecord[]>([]);
    const [drivers, setDrivers] = useState<Record<string, Driver>>({});
    const [allDrivers, setALLDrivers] = useState<Driver[]>([]);
   
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [docId, setDocId] = useState<string>('');
    const [fixedPoint, setFixedPoint] = useState<number | null>(null);
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid') || '';
    const [activeTab, setActiveTab] = useState('ongoing');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
    const role = sessionStorage.getItem('role');
    const userName = sessionStorage.getItem('username');
    console.log("role",userName)
    const pendingRef = useRef<HTMLDivElement>(null);
    const [bookingAmount, setBookingAmount] = useState<number>(0);

    useEffect(() => {
        const fetchBookingAmount = async () => {
            if (selectedBooking?.id) {
                try {
                    const bookingRef = doc(db, `user/${uid}/bookings`, selectedBooking.id);
                    const bookingSnapshot = await getDoc(bookingRef);
                    
                    if (bookingSnapshot.exists()) {
                        const bookingData = bookingSnapshot.data();
                        setBookingAmount(bookingData.amount || 0); // Set the amount from the database
                    }
                } catch (error) {
                    console.error('Error fetching booking amount:', error);
                }
            }
        };
    
        fetchBookingAmount();
    }, [selectedBooking, uid]);
    const handlePaymentSettlement = (record: BookingRecord) => {
        setSelectedBooking(record);
        setPaymentAmount(record.updatedTotalSalary.toString()); // Pre-fill the amount with updatedTotalSalary
        setShowPaymentModal(true);
    };
    
    const handleSavePayment = async () => {
        if (selectedBooking && paymentAmount) {
            try {
                const updatedTotalSalary = selectedBooking.updatedTotalSalary;
                const paymentAmountNumber = Number(paymentAmount);
    
                // Initialize paymentStatus to 'Not Paid'
                let paymentStatus = 'Not Paid';
    
                // Calculate newAmount by adding the new payment to the existing amount
                let newAmount = String(paymentAmountNumber);
    
                // Query user collection
                const userQuery = query(
                    collection(db, `user/${uid}/users`),
                    where('userName', '==', userName)
                );
                const userSnapshot = await getDocs(userQuery);
    
                if (!userSnapshot.empty) {
                    const userDoc = userSnapshot.docs[0];
                    const staffReceivedRef = collection(
                        db,
                        `user/${uid}/users/${userDoc.id}/staffReceived`
                    );
    
                    // Check if entry exists for the selectedBookingId
                    const existingEntryQuery = query(
                        staffReceivedRef,
                        where('selectedBookingId', 'array-contains', selectedBooking.id)
                    );
                    const existingEntrySnapshot = await getDocs(existingEntryQuery);
    
                    if (!existingEntrySnapshot.empty) {
                        // If an entry exists, update amount and append booking ID
                        const existingEntryDoc = existingEntrySnapshot.docs[0];
                        const existingData = existingEntryDoc.data();
                        const existingAmount = existingData.amount || '0'; // Default to string
                        const existingBookingIds = existingData.selectedBookingId || [];
    
                        newAmount = String(Number(newAmount) + Number(existingAmount));
    
                        const entryRef = doc(
                            db,
                            `user/${uid}/users/${userDoc.id}/staffReceived`,
                            existingEntryDoc.id
                        );
    
                        await updateDoc(entryRef, {
                            amount: newAmount,
                            date: new Date().toISOString(),
                            selectedBookingIds: [...new Set([...existingBookingIds, selectedBooking.id])], // Ensure uniqueness
                        });
                    } else {
                        // Create a new document if no entry exists
                        await addDoc(staffReceivedRef, {
                            amount: newAmount,
                            date: new Date().toISOString(),
                            selectedBookingIds: [selectedBooking.id],
                        });
                    }
                }
    
                // Determine payment status
                if (Number(newAmount) >= updatedTotalSalary) {
                    paymentStatus = 'Paid';
                }
    
                // Fetch current booking and update with calculated values
                const bookingRef = doc(db, `user/${uid}/bookings`, selectedBooking.id);
                const bookingSnapshot = await getDoc(bookingRef);
    
                let unPaidReceivedUser = userName;
                let receivedUser = 'Staff';
                if (bookingSnapshot.exists()) {
                    const bookingData = bookingSnapshot.data();
                    if (bookingData.unPaidReceivedUser && bookingData.unPaidReceivedUser !== userName) {
                        unPaidReceivedUser = 'Other';
                    } else {
                        receivedUser = 'Staff';
                    }
                }
    
                await updateDoc(bookingRef, {
                    amount: newAmount,
                    status: 'Order Completed',
                    paymentStatus: paymentStatus,
                    unPaidReceivedUser: unPaidReceivedUser,
                    selectedBookingId: [selectedBooking.id],
                    receivedAmountStaff: newAmount,
                    receivedUser: receivedUser,
                });
    
                // Reset modal and states
                setShowPaymentModal(false);
                setSelectedBooking(null);
                setPaymentAmount('');
            } catch (error) {
                console.error('Error saving payment:', error);
            }
        }
    };
    
    
    

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

    const filteredRecordsData = recordsData.filter((record) => {
        const matchesSearch = Object.values(record).some((value) =>
            value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Tab filtering logic
        const matchesTab =
            (activeTab === 'ongoing' && record.status !== 'Order Completed') ||
            (activeTab === 'completed' && record.status === 'Order Completed') ||
            (activeTab === 'pending' && record.paymentStatus === "Not Paid");

        return matchesSearch && matchesTab;
    });// ----------------------------------------------------------------------------
    const sortedRecordsData = filteredRecordsData.slice().sort((a, b) => {
        const dateA = new Date(a.dateTime);
        const dateB = new Date(b.dateTime);
        return dateB.getTime() - dateA.getTime();
    });

    const completedBookings = sortedRecordsData.filter((record) => record.status === 'Order Completed');
    const ongoingBookings = sortedRecordsData.filter((record) => record.status !== 'Order Completed');
    const pendingBookings = sortedRecordsData.filter((record) => record.paymentStatus === "Not Paid");

    const fetchDrivers = async () => {
        try {
            const driversCollection = collection(db, `user/${uid}/driver`);
            const driverSnapshot = await getDocs(driversCollection);
            const driverList = driverSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Driver[]; // Type assertion to indicate the shape of objects is Driver
            
            setALLDrivers(driverList); // Store the fetched drivers in state
            console.log(driverList, 'Fetched Drivers'); // Optional logging
        } catch (error) {
            console.error('Error fetching drivers:', error);
        }
    };
    useEffect(() => {
        fetchDrivers();
    }, []);

    const handlePrint = () => {
        const printContent = pendingRef.current?.innerHTML;
        const originalContent = document.body.innerHTML;
    
        if (printContent) {
            document.body.innerHTML = printContent;
            window.print();
            document.body.innerHTML = originalContent;
            window.location.reload();
        }
    };
    const formatTimestamp = (timestamp: Timestamp | null | undefined): string => {
        if (!timestamp) return "--";
    
        // Convert Firestore timestamp to JavaScript Date object
        const date = timestamp.toDate();
    
        // Define the options for formatting
        const options: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true, // 12-hour format with AM/PM
        };
    
        // Use Intl.DateTimeFormat for proper formatting
        return new Intl.DateTimeFormat('en-IN', options).format(date);
    };
    
    return (
        <Container>
            <Header>
                <Title>Driver Status</Title>
                <SearchInput type="text" value={searchQuery} onChange={handleSearchChange} placeholder="Search..." />
            </Header>
            <TabHeader>
            <TabButton
    isActive={activeTab === 'ongoing'}
    tabType="ongoing"
    onClick={() => setActiveTab('ongoing')}
>
    Ongoing Bookings
</TabButton>
<TabButton
    isActive={activeTab === 'pending'}
    tabType="pending"
    onClick={() => setActiveTab('pending')}
>
    Cash Pending Bookings
</TabButton>
<TabButton
    isActive={activeTab === 'completed'}
    tabType="completed"
    onClick={() => setActiveTab('completed')}
>
    Completed Bookings
</TabButton>
            </TabHeader>
            
            {activeTab === 'ongoing' && (
                <div>
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
                        <Label>File Number:</Label>
                        <Value style={{color:'red'}}>{record.fileNumber}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>Driver Name:</Label>
                        <Value>{record.driver}</Value>
                    </DataItem>
                    <DataItem>
    <Label>Driver Phone Number:</Label>
    <Value>{record.selectedDriver ? drivers[record.selectedDriver]?.phone : 'N/A'}</Value>
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
                        <Label>Pickup Time:</Label>
                        <Value>{formatTimestamp(record?.pickedTime)}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>Dropoff Time:</Label>
                        <Value>{formatTimestamp(record?.droppedTime)}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>Status:</Label>
                        <Value>
                            <StatusBadge status={record.status}>{record.status}</StatusBadge>
                        </Value>
                    </DataItem>
               
                    {record.paymentStatus === 'Not Paid' && (
                          <button
                          className="bg-blue-500 text-white py-2 px-4 rounded mt-4"
                          onClick={() => handlePaymentSettlement(record)}
                      >
                          Payment Settlement
                      </button>
                    )}
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
          
          
   </div>
            )}
            { activeTab === 'pending' && (
             <button
    type="button"
    className="p-2 rounded-full bg-gray-500 text-white hover:bg-blue-600 mt-2"
    onClick={handlePrint}
    aria-label="Print"
  >
    <IconPrinter/>
  </button>
  )}
  <br />
  <br />

             {activeTab === 'pending' && (
        <div  ref={pendingRef}>
            {pendingBookings.map((record) => (
                <Card key={record.id}>
                     <DataItem>
                        <Label>File Number:</Label>
                        <Value style={{color:"red"}}>{record.fileNumber}</Value>
                    </DataItem>
                    <DataItem>
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
                        <Value>{record.phoneNumber}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>Pickup Time:</Label>
                        <Value>{formatTimestamp(record?.pickedTime)}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>Dropoff Time:</Label>
                        <Value>{formatTimestamp(record?.droppedTime)}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>Status:</Label>
                        <Value>
                            <StatusBadge status={record.status}>{record.status}</StatusBadge>
                        </Value>
                    </DataItem>
                    <button
                        className="bg-blue-500 text-white py-2 px-4 rounded mt-4"
                        onClick={() => handlePaymentSettlement(record)}
                    >
                        Payment Settlement
                    </button>
                </Card>
            ))}
   {showPaymentModal && (
    <ReactModal
        isOpen={showPaymentModal}
        onRequestClose={() => {
            setShowPaymentModal(false);
            setPaymentAmount(''); // Reset payment amount on close
        }}
        contentLabel="Payment Settlement"
        style={{
            content: {
                width: '400px',
                height: '350px',
                margin: 'auto',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                backgroundColor: '#fff',
            },
            overlay: {
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
        }}
    >
        <h2 className="text-xl font-semibold">
            Payment Settlement of {selectedBooking?.customerName}
        </h2>
        <div className="mt-4">
            <label className="block">Payable Amount (By Customer):</label>
            <p className="font-semibold text-lg">
                💵 {selectedBooking?.updatedTotalSalary ?? 0} {/* Fallback to 0 if undefined */}
            </p>
        </div>
        <div className="mt-4">
            <label className="block">Amount</label>
            <input
                type="text"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="border p-2 w-full"
            />
        </div>
        {Number(paymentAmount) < (selectedBooking?.updatedTotalSalary ?? 0) && (
            <div className="mt-2 text-red-500">
                Balance Remaining: {(selectedBooking?.updatedTotalSalary ?? 0) - bookingAmount - Number(paymentAmount)}
            </div>
        )}
        <button
            onClick={handleSavePayment}
            className="bg-green-500 text-white py-2 px-4 rounded mt-4"
        >
            Save Payment
        </button>
    </ReactModal>
)}


        </div>
    )}
              {activeTab === 'completed' && (
                <div>
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
                        <Label>File Number:</Label>
                        <Value style={{color:"red"}}>{record.fileNumber}</Value>
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
                        <Label>Pickup Time:</Label>
                        <Value>{formatTimestamp(record?.pickedTime)}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>Dropoff Time:</Label>
                        <Value>{formatTimestamp(record?.droppedTime)}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>Status:</Label>
                        <Value>
                            <StatusBadge status="Order Completed">{record.status}</StatusBadge>
                        </Value>
                    </DataItem>
              

                    <OrderDetailsButton onClick={() => handleOrderDetails(record)}>
                        Order Details
                        <IconArrowLeft />
                    </OrderDetailsButton>
                </Card>
            ))}
            </div>
        )}
           
        </Container>
    );
};

export default StatusTable;
