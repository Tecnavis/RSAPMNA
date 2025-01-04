import React, { useEffect, useState } from 'react';
import './style.css'; // Add custom styles here
import { Button, TextField } from '@mui/material';
import IconEye from '../../components/Icon/IconEye';
import { collection, doc, getDocs, getFirestore, query, setDoc, where } from 'firebase/firestore';

type ClientCategory = 'Driver' | 'Showroom' | 'Marketing Executive' | 'ShowroomStaff';
interface ClientRewardDetails {
    id: string;
    name: string;
    rewardPoints: number;
    companyName?: string;

    bookingPoint?:number;
    category?: string;
    staff: Staff[];
}
interface Staff {
    id: string; // Add this line
    name: string;
    phoneNumber: string;
    rewardPoints?: number;
}
const ClientRewards: React.FC = () => {
    const [visibleCategory, setVisibleCategory] = useState<ClientCategory | null>(null);
    const [driverRewards, setDriverRewards] = useState<ClientRewardDetails[]>([]);
    const [customerRewards, setCustomerRewards] = useState<ClientRewardDetails[]>([]);
    const [showroomRewards, setShowroomRewards] = useState<ClientRewardDetails[]>([]);
    const [selectedShowroomStaff, setSelectedShowroomStaff] = useState<{ [showroomName: string]: string }>({});
    const [showroomVisible, setShowroomVisible] = useState<string | null>(null); // Track the clicked showroom
    const [showroomStaffRewards, setShowroomStaffRewards] = useState<ClientRewardDetails[]>([]);
    const [bookingPoints, setBookingPoints] = useState<{ [id: string]: number }>({});

    const db = getFirestore();
    const uid = sessionStorage.getItem('uid');

    const fetchDrivers = async () => {
        try {
            // Create a query to fetch drivers with companyName 'RSA'
            const driversCollection = collection(db, `user/${uid}/driver`);
            const rsaQuery = query(driversCollection, where('companyName', '==', 'RSA'));

            // Fetch all RSA drivers
            const driverSnapshot = await getDocs(rsaQuery);

            const driversList: ClientRewardDetails[] = driverSnapshot.docs.map((doc) => {
                const driverData = doc.data();
                return {
                    id: doc.id, // Ensure id is a string
                    name: driverData.driverName, // Ensure driverName is a string
                    rewardPoints:
                        driverData.companyName === 'RSA'
                            ? driverData.rewardPoints || 0 // Fetch from DB for RSA
                            : calculateRewardPoints(driverData), // Calculate for non-RSA drivers
                    companyName: driverData.companyName, // Ensure companyName is a string
                    // percentage: driverData.percentage || 0, // Fetch the percentage
                    staff: [], // Initialize with an empty array or fetch actual staff data if needed
                };
            });

            setDriverRewards(driversList);
        } catch (error) {
            console.error('Error fetching drivers:', error);
        }
    };

    // Function to calculate reward points for non-RSA drivers
    const calculateRewardPoints = (driverData: any) => {
        // Implement your logic to calculate reward points here
        return driverData.rewardPoints || 0;
    };
    const fetchShowrooms = async () => {
        try {
            const showroomCollection = collection(db, `user/${uid}/showroom`);
            const showroomSnapshot = await getDocs(showroomCollection);

            const showroomList: ClientRewardDetails[] = showroomSnapshot.docs.map((doc) => ({
                id: doc.id, // Get the showroom ID
                name: doc.data().ShowRoom,
                rewardPoints: doc.data().rewardPoints || 0,
                bookingPoint: doc.data().bookingPoint || 0,

                staff:
                    doc.data().staff?.map((staff: any) => ({
                        id: staff.id, // Make sure to fetch the ID for each staff member
                        name: staff.name,
                        phoneNumber: staff.phoneNumber,
                        rewardPoints: staff.rewardPoints || 0,
                        bookingPoint: doc.data().bookingPoint || 0,

                    })) || [], // Default to an empty array if no staff is found
            }));

            setShowroomRewards(showroomList);
            setShowroomStaffRewards(showroomList); // Set showroom staff rewards
        } catch (error) {
            console.error('Error fetching showrooms:', error);
        }
    };

    useEffect(() => {
        fetchDrivers();
        // fetchStaff();
        fetchShowrooms();
    }, []);
    // ---------------------------------------------------------------------------
    const handleViewRewards = (category: ClientCategory) => {
        setVisibleCategory(visibleCategory === category ? null : category);
    };
    const getRewardsList = (): { category: ClientCategory; rewards: ClientRewardDetails[] }[] => {
        if (!visibleCategory) {
            return [
                { category: 'Driver', rewards: driverRewards },
                { category: 'Showroom', rewards: showroomRewards },
                { category: 'Marketing Executive', rewards: customerRewards },
                { category: 'ShowroomStaff', rewards: customerRewards },
            ];
        } else {
            return [{ category: visibleCategory, rewards: getCategoryRewards(visibleCategory) }];
        }
    };

    const getCategoryRewards = (category: ClientCategory): ClientRewardDetails[] => {
        switch (category) {
            case 'Driver':
                return driverRewards;
            case 'Showroom':
                return showroomRewards;
            case 'ShowroomStaff':
                return showroomStaffRewards;

            case 'Marketing Executive':
                return customerRewards;
            default:
                return [];
        }
    };

    const handleView = (id: string | number, name: string, rewardPoints: number, category: ClientCategory) => {
        console.log('Category:', category);
        window.location.href = `/rewarddetails?id=${id}&name=${encodeURIComponent(name)}&rewardPoints=${rewardPoints}&category=${encodeURIComponent(category)}`;
    };
    const handleShowroomStaffSelect = (id: string | number, showroomName: string, staffMember: string, rewardPoints: number, category: ClientCategory) => {
        const selectedStaff = showroomRewards.find((showroom) => showroom.name === showroomName)?.staff?.find((staff) => staff.name === staffMember);

        if (selectedStaff) {
            setSelectedShowroomStaff((prev) => ({
                ...prev,
                [showroomName]: staffMember,
            }));
            window.location.href = `/rewarddetails?id=${id}&name=${encodeURIComponent(selectedStaff.name)}&rewardPoints=${
                selectedStaff.rewardPoints || 0
            }&category=ShowroomStaff&phoneNumber=${encodeURIComponent(selectedStaff.phoneNumber || '')}`;
        }
    };

    const handleShowroomClick = (clientName: string) => {
        setShowroomVisible((prev) => (prev === clientName ? null : clientName)); // Toggle dropdown visibility
    };
    const handleBookingPointChange = (id: string, value: string) => {
        setBookingPoints((prevPoints) => ({ ...prevPoints, [id]: parseInt(value) || 0 }));
    };

    const updateBookingPointsInAllShowrooms = async (category:any, bookingPoint:any) => {
        try {
            const showroomCollection = collection(db, `user/${uid}/showroom`);
            const showroomSnapshot = await getDocs(showroomCollection);
    
            // Iterate through each showroom document
            showroomSnapshot.forEach(async (docSnapshot) => {
                const showroomDocRef = doc(db, `user/${uid}/showroom`, docSnapshot.id);
    
                if (category === 'Showroom') {
                    // If category is 'Showroom', update the bookingPoint in the showroom document
                    await setDoc(showroomDocRef, { bookingPoint }, { merge: true });
                } else if (category === 'ShowroomStaff') {
                    console.log('Category is ShowroomStaff');
    
                    // For 'ShowroomStaff', update two fields (PointsForShowroomStaff and PointsForShowroom)
                    const { bookingPoint1, bookingPoint2 } = bookingPoint;
                    const staffDocRef = doc(db, `user/${uid}/showroom`, docSnapshot.id);
                    
                    try {
                        await setDoc(
                            staffDocRef,
                            { 
                                bookingPointStaff: bookingPoint1, // Store Points For ShowRoomStaff
                                bookingPointForShowroom: bookingPoint2 // Store Points For ShowRoom
                            },
                            { merge: true }
                        );
                    } catch (error) {
                        console.error('Error updating bookingPointStaff for ShowroomStaff:', error);
                    }
                }
            });
    
            console.log('Booking points updated successfully');
        } catch (error) {
            console.error('Error updating booking points:', error);
        }
    };
    
    
    
    // -----------------------------------------------------------------------------------11-11-2024--------------------------------------------------------
    return (
        <div className="client-rewards-container">
            <h1>CLIENT REWARDS</h1>
            <br />
            <div className="cards-container"> 
    {[
        { category: 'Driver', rewardPoints: driverRewards.reduce((acc, cur) => acc + cur.rewardPoints, 0) },
        { category: 'Showroom', rewardPoints: showroomRewards.reduce((acc, cur) => acc + cur.rewardPoints, 0) },
        { category: 'Marketing Executive', rewardPoints: customerRewards.reduce((acc, cur) => acc + cur.rewardPoints, 0) },
        { category: 'ShowroomStaff', rewardPoints: showroomStaffRewards.reduce((acc, cur) => acc + cur.rewardPoints, 0) }, // Display ShowroomStaff reward points
    ].map((client, index) => (
        <div key={index} className={`client-card ${client.category.toLowerCase()}`}>
            <h2>{client.category}</h2>

            {/* Show input fields for categories other than 'Driver' */}
            {client.category !== 'Driver' && client.category !== 'ShowroomStaff' && (
                <>
                    <TextField
                        label="Points"
                        type="number"
                        value={bookingPoints[client.category] || ''} // Make sure it's initialized properly
                        onChange={(e) => handleBookingPointChange(client.category, e.target.value)} // Update function
                        variant="outlined"
                        fullWidth
                    />

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => updateBookingPointsInAllShowrooms(client.category, bookingPoints[client.category])} // Update points for the category
                    >
                        OK
                    </Button>
                </>
            )}

            {/* Show two input fields for 'ShowroomStaff' */}
            {client.category === 'ShowroomStaff' && (
                <>
                    <TextField
                        label="Points For ShowRoomStaff"
                        type="number"
                        value={bookingPoints[`${client.category}_1`] || ''} // For ShowroomStaff, use a different key
                        onChange={(e) => handleBookingPointChange(`${client.category}_1`, e.target.value)} // Update function
                        variant="outlined"
                        fullWidth
                    />

                    <TextField
                        label="Points For ShowRoom"
                        type="number"
                        value={bookingPoints[`${client.category}_2`] || ''} // For ShowroomStaff, use another key
                        onChange={(e) => handleBookingPointChange(`${client.category}_2`, e.target.value)} // Update function
                        variant="outlined"
                        fullWidth
                    />

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            const bookingPoint = {
                                bookingPoint1: bookingPoints[`${client.category}_1`],
                                bookingPoint2: bookingPoints[`${client.category}_2`],
                            };
                            updateBookingPointsInAllShowrooms(client.category, bookingPoint); // Update points for ShowroomStaff
                        }}
                    >
                        OK
                    </Button>
                </>
            )}

            {/* Button to toggle rewards visibility */}
            <button onClick={() => handleViewRewards(client.category as ClientCategory)} className="reward-btn ml-2 mt-2">
                {visibleCategory === client.category ? 'Hide Rewards' : 'View Rewards'}
            </button>
        </div>
    ))}
</div>


            <div className="rewards-list">
                {getRewardsList().map(({ category, rewards }) => (
                    <div key={category}>
                        <h3>{category} Rewards</h3>
                        <ul>
                            {rewards.map((client, index) => (
                                <li key={index} className="reward-item">
                                    <span className="reward-name">{client.name}</span>
                                    {client.staff && client.staff.length > 0 && (
                                        <>
                                            {/* Only show the "Select Staff" dropdown when the showroom is clicked */}
                                            <Button onClick={() => handleShowroomClick(client.name)}>Show Staff</Button>
                                            {showroomVisible === client.name && (
                                                <div className="mt-6 space-y-2">
                                                    <label className="block text-sm font-semibold text-gray-800 tracking-wide" htmlFor={`${client.name}-staff-select`}>
                                                        Select Staff
                                                    </label>
                                                    <div className="relative">
                                                        <select
                                                            id={`${client.name}-staff-select`}
                                                            value={selectedShowroomStaff[client.name] || ''}
                                                            onChange={(e) => handleShowroomStaffSelect(client.id, client.name, e.target.value, client.rewardPoints, category as ClientCategory)}
                                                            className="block w-full bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 pl-3 pr-10 text-base sm:text-sm"
                                                        >
                                                            <option value="" disabled>
                                                                Select Staff
                                                            </option>
                                                            <optgroup label="Staff Members" className="text-lg font-semibold text-gray-800">
                                                                {client.staff.map((staffMember, staffIndex) => (
                                                                    <option
                                                                        key={staffIndex}
                                                                        value={staffMember.name}
                                                                        className="text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 transition-all flex justify-between items-center"
                                                                    >
                                                                        <span>{staffMember.name}</span>
                                                                        <span> - </span>
                                                                        <span> {staffMember.phoneNumber}</span>
                                                                        <span className="ml-2 px-2 py-1 text-sm text-gray-900 bg-yellow-200 rounded-full font-semibold hover:bg-yellow-300">
                                                                            ({staffMember.rewardPoints || 0} points)
                                                                        </span>
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        </select>

                                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                            <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-500 italic">Staff list based on current showroom selection</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <span className="reward-points">
                                        {client.rewardPoints} points
                                        <Button
                                            onClick={() => {
                                                handleView(client.id, client.name, client.rewardPoints, category as ClientCategory); // Call the handleView function with the id, name, and rewardPoints
                                            }}
                                        >
                                            <IconEye />
                                        </Button>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientRewards;
