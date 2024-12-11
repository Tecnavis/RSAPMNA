import React, { useEffect, useState, ChangeEvent } from 'react';
import { getFirestore, collection, getDocs, query, where, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { Button} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Define the shape of a booking record

interface Booking {
    id: string;
    dateTime: string;
    driver: string;
    phoneNumber: string;
    serviceType: string;
    vehicleNumber: string;
    comments: string;
    status: string; // Added status to match your current logic
    selectedDriver: string;
    formAdded: string;
    approved: boolean;
    createdAt:Timestamp;
    fileNumber:string;
    bookingChecked?: boolean;
    feedback?: boolean;
    accountingStaffVerified?: boolean;
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
    const [docId, setDocId] = useState<string>('');
    const [loadingBookings, setLoadingBookings] = useState<Set<string>>(new Set());
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid');
    const navigate = useNavigate();
    const [tab, setTab] = useState<'verified' | 'unverified'>('unverified');

    

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
    }, [uid]);
    const handleViewMore = (id: string) => {
        navigate(`/bookings/newbooking/viewmore/${id}`);
    };
    const handleAccountingVerify = async (bookingId: string) => {
        try {
            const bookingRef = doc(db, `user/${uid}/bookings`, bookingId);

            // Update the document to set accountingStaffVerified to true
            await updateDoc(bookingRef, {
                accountingStaffVerified: true,
            });

            // Update the state to reflect the changes immediately
            setCompletedBookings((prevBookings) => 
                prevBookings.map((booking) =>
                    booking.id === bookingId ? { ...booking, accountingStaffVerified: true } : booking
                )
            );
        } catch (error) {
            console.error('Error updating accounting staff verification:', error);
        }
    };

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    console.log(completedBookings, 'this is the completed bookings');

    const filteredBookings = completedBookings.filter((booking) => 
        Object.values(booking).some((value) => value && value.toString().toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    const sortedBookings = [...filteredBookings].sort(
        (a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime() // Sort by 'createdAt' in descending order
    );
    
    const filteredTabBookings = tab === 'verified' 
        ? sortedBookings.filter((booking) => booking.accountingStaffVerified)
        : sortedBookings.filter((booking) => !booking.accountingStaffVerified);
    
    return (
        <div className="panel mt-6">
            <h5 className="font-semibold text-lg dark:text-white-light mb-5">Completed Bookings</h5>
            <div className="mb-5">
                <input type="text" value={searchQuery} onChange={handleSearchChange} placeholder="Search..." className="w-full p-2 border border-gray-300 rounded" />
                <div className="tabs mt-4 w-full flex">
                <Button
        className="flex-1" // Makes the button take equal space
        variant={tab === 'verified' ? 'contained' : 'outlined'}
        onClick={() => setTab('verified')}
        color="primary"
    >
        Verified
    </Button>
    <Button
        className="flex-1" // Makes the button take equal space
        variant={tab === 'unverified' ? 'contained' : 'outlined'}
        onClick={() => setTab('unverified')}
        color="primary"
    >
        Unverified
    </Button>
                </div>
                <div className="mt-4">
                <div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
                    <span
                        style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: '#90EE90',
                            borderRadius: '50%',
                            display: 'inline-block',
                            marginRight: '8px',
                            border: '2px solid #a3a3a3',
                        }}
                    ></span>
                    <span>FeedBack & verify Completed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
                    <span
                        style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: '#FFC0CB',
                            borderRadius: '50%',
                            display: 'inline-block',
                            marginRight: '8px',
                            border: '2px solid #d6d6d6',
                        }}
                    ></span>
                    <span>Verify Completed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span
                        style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            display: 'inline-block',
                            marginRight: '8px',
                            border: '2px solid #c3c3c3',
                        }}
                    ></span>
                    <span>Other Bookings</span>
                </div>
                    <div className="datatables">
                        {filteredTabBookings.length === 0 ? (
                            <p>No completed bookings found.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table-hover min-w-full border-collapse block md:table">
                                    <thead className="block md:table-header-group">
                                        <tr className="border border-gray-300 block md:table-row absolute -top-full md:top-auto -left-full md:left-auto md:relative">
                                        <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">#</th>

                                            <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">Date & Time</th>
                                            <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">File Number</th>

                                            <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">Driver Name</th>
                                            <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">Phone Number</th>
                                            <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">Service Type</th>
                                            <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">Vehicle Number</th>
                                            <th className="bg-gray-100 p-2 text-left font-medium text-sm block md:table-cell">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="block md:table-row-group">
                                    {filteredTabBookings.map((booking, index) => {
const rowStyle = booking.feedback
? { backgroundColor: '#90EE90', color: 'black' } // Light green
: booking.bookingChecked
? { backgroundColor: '#FFC0CB', color: 'black' } // Light red
: {};


                                                return (
                                                    <tr key={booking.id} className={`border border-gray-300 block md:table-row `} style={rowStyle}>
                                                    <td className="p-2 text-sm block md:table-cell">{index+1} </td>

                                                    <td className="p-2 text-sm block md:table-cell">{booking.dateTime} </td>
                                                    <td className="p-2 text-sm block md:table-cell">{booking.fileNumber} </td>

                                                    <td className="p-2 text-sm block md:table-cell">{booking.driver}</td>
                                                    <td className="p-2 text-sm block md:table-cell">{booking.phoneNumber}</td>
                                                    <td className="p-2 text-sm block md:table-cell">{booking.serviceType}</td>
                                                    <td className="p-2 text-sm block md:table-cell">{booking.vehicleNumber}</td>
                                                    <td>
                                                        <Button
                                                            variant="contained"
                                                            color="primary"
                                                            onClick={() => handleViewMore(booking.id)} // Navigate on click
                                                        >
                                                            View More
                                                        </Button>
                                                          {/* Show "Accounting staff verified" button if feedback and bookingChecked are true */}
                                                          {booking.feedback && booking.bookingChecked && !booking.accountingStaffVerified && (
                                                            <Button
                                                                variant="contained"
                                                                color="secondary"
                                                                style={{ marginLeft: '10px' }}
                                                                onClick={() => handleAccountingVerify(booking.id)}
                                                            >
                                                                Accounting staff verify
                                                            </Button>
                                                        )}
                                                        {booking.accountingStaffVerified && (
                                                            <Button
                                                                variant="contained"
                                                                color="secondary"
                                                                style={{ marginLeft: '10px' }}
                                                            >
                                                                Accounting staff verified
                                                            </Button>
                                                        )}
                                                    </td>
                                                    <td className="p-2 text-sm block md:table-cell">
                                                    </td>
                                                </tr>
                                             );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
          
        </div>
    );
};

export default ClosedBooking;
