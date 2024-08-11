import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { collection, getDocs, getFirestore, onSnapshot, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';

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

const StatusBadge = styled.span`
    padding: 8px 12px;
    border-radius: 20px;
    font-weight: bold;
    text-align: center;
    display: inline-block;
    color: white;
    background-color: ${props => {
        switch (props.status) {
            case 'Rejected':
                return '#e74c3c';
            case 'Order Completed':
                return '#27ae60';
            case 'pending':
                return '#3498db';
            default:
                return '#f39c12';
        }
    }};
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transition: background-color 0.3s ease, transform 0.3s ease;
    &:hover {
        transform: scale(1.05);
        background-color: ${props => {
            switch (props.status) {
                case 'Rejected':
                    return '#c0392b';
                case 'Order Completed':
                    return '#2ecc71';
                case 'pending':
                    return '#e67e22';
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
const StatusTable = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [recordsData, setRecordsData] = useState([]);
    const [drivers, setDrivers] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const db = getFirestore();

    useEffect(() => {
        dispatch(setPageTitle('Status'));

        const fetchBookings = async () => {
            const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const updatedBookingsData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setRecordsData(updatedBookingsData);

            const driverData = {};
            for (const record of updatedBookingsData) {
                const driverId = record.selectedDriver;

                if (driverId && !driverData[driverId]) {
                    const driverDoc = await getDoc(doc(db, 'driver', driverId));
                    if (driverDoc.exists()) {
                        driverData[driverId] = driverDoc.data();
                    }
                }
            }
            setDrivers(driverData);
        };

        const unsubscribe = onSnapshot(collection(db, 'bookings'), () => {
            fetchBookings();
        });

        return () => unsubscribe();
    }, [db, dispatch]);

    const handleReassignClick = (record) => {
        navigate(`/bookings/booking/${record.id}`, { state: { editData: record } });
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };
    const handleOrderDetails = (record) => {
        navigate(`/bookings/newbooking/viewmore/${record.id}` );
    };
    
    const filteredRecordsData = recordsData.filter((record) =>
        Object.values(record).some(
            (value) =>
                value &&
                value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    const sortedRecordsData = filteredRecordsData.slice().sort((a, b) => {
        const dateA = new Date(a.dateTime);
        const dateB = new Date(b.dateTime);
        return dateB - dateA;
    });

    const completedBookings = sortedRecordsData.filter((record) => record.status === 'Order Completed');
    const ongoingBookings = sortedRecordsData.filter((record) => record.status !== 'Order Completed');

    return (
        <Container>
            <Header>
                <Title>Driver Status</Title>
                <SearchInput
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search..."
                />
            </Header>
            {ongoingBookings.map((record) => (
                <Card key={record.id}
                style={{
                    backgroundColor: record.bookingStatus === 'ShowRoom Booking' ? 'lightblue' : 'inherit',
                }}
                >
                    <DataItem    style={{
          margin: '5px 0',
          color: '#7f8c8d',
          marginLeft: 'auto',
          fontFamily: 'Georgia, serif',
          fontSize: '16px',
          padding: '2px 8px',
          borderRadius: '4px',
          backgroundColor: '#ecf0f1',
          border: '1px solid #bdc3c7',
        }}>
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
                        <Value>{record.phoneNumber} / {record.mobileNumber}</Value>
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
                            <StatusBadge status={record.status}>
                                {record.status}
                            </StatusBadge>
                        </Value>
                    </DataItem>
                    {record.status === 'Rejected' && (
                        <ReassignButton onClick={() => handleReassignClick(record)}>
                            Reassign
                        </ReassignButton>
                    )}
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
                <Card key={record.id}>
                    <DataItem    style={{
          margin: '5px 0',
          color: '#7f8c8d',
          marginLeft: 'auto',
          fontFamily: 'Georgia, serif',
          fontSize: '16px',
          padding: '2px 8px',
          borderRadius: '4px',
          backgroundColor: '#ecf0f1',
          border: '1px solid #bdc3c7',
        }}>
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
                        <Value>{record.phoneNumber} / {record.mobileNumber}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>Pickup Location:</Label>
                        <Value>{record.pickupLocation.name}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>DropOff Location:</Label>
                        <Value>{record.dropoffLocation.name}</Value>
                    </DataItem>
                    <DataItem>
                        <Label>Status:</Label>
                        <Value>
                            <StatusBadge status="Order Completed">
                                {record.status}
                            </StatusBadge>
                        </Value>
                    </DataItem>
                    <OrderDetailsButton onClick={() => handleOrderDetails(record)}>
                            Order Details
                            <IconArrowLeft />
                        </OrderDetailsButton>             
                           </Card>
            ))}
        </Container>
    );
};

export default StatusTable;
