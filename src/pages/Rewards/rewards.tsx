import React, { useEffect, useState } from 'react';
import './style.css'; // Add custom styles here
import { Button, TextField } from '@mui/material';
import IconEye from '../../components/Icon/IconEye';
import { collection, doc, getDoc, getDocs, getFirestore, onSnapshot, query, setDoc, where } from 'firebase/firestore';

type ClientCategory = 'Driver' | 'Showroom' | 'Marketing Executive' | 'ShowroomStaff';
interface ClientRewardDetails {
    id: string;
    name: string;
    rewardPoints: number;
    companyName?: string;
    bookingPointStaff?: number;
    bookingPointForShowroom?: number;
    bookingPoint?: number;
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
    const [showroomStaffRewards, setShowroomStaffRewards] = useState<ClientRewardDetails[]>([]);
    const [bookingPoints, setBookingPoints] = useState<{ [id: string]: number }>({});
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleBookingPointUpdate = (category: string, points: any) => {
      updateBookingPointsInAllShowrooms(category, points);
      setSuccessMessage(`Points added successfully for ${category}!`);
      
      // Hide the message after a few seconds
      setTimeout(() => setSuccessMessage(null), 1000);
    };
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
    // --------------------------------------------------------------
    const fetchShowrooms = () => {
        try {
          const showroomCollection = collection(db, `user/${uid}/showroom`);
      
          const unsubscribe = onSnapshot(showroomCollection, async (showroomSnapshot) => {
            const showroomList: ClientRewardDetails[] = await Promise.all(
              showroomSnapshot.docs.map(async (docSnapshot) => {
                const showroomData = docSnapshot.data();
                const showroomIdFromDoc = showroomData.id || docSnapshot.id;
      
                // Fetch showroom staff data
                const staffQuery = query(
                  collection(db, `user/${uid}/showroomStaff`),
                  where("showroomId", "==", showroomIdFromDoc)
                );
                const staffSnapshot = await getDocs(staffQuery);
                const staffList: Staff[] = staffSnapshot.docs.map((staffDoc) => ({
                  id: staffDoc.id,
                  name: staffDoc.data().name,
                  phoneNumber: staffDoc.data().phoneNumber,
                  rewardPoints: staffDoc.data().rewardPoints || 0,
                }));
      
                return {
                  id: docSnapshot.id,
                  name: showroomData.ShowRoom,
                  rewardPoints: showroomData.rewardPoints || 0,
                  bookingPoint: showroomData.bookingPoint || 0,
                  bookingPointStaff: showroomData.bookingPointStaff || 0,
                  bookingPointForShowroom: showroomData.bookingPointForShowroom || 0,
                  staff: staffList,
                };
              })
            );
      
            setShowroomRewards(showroomList);
            setShowroomStaffRewards(showroomList);
          });
      
          return unsubscribe; // Always return the function
        } catch (error) {
          console.error("Error fetching showrooms and staff:", error);
          return () => {}; // Return an empty function in case of error
        }
      };
      
      
      useEffect(() => {
        const unsubscribe = fetchShowrooms();
        return () => unsubscribe(); // Now always a function, no undefined error
      }, []);
      
      
    
      const storedShowroomPoints = showroomRewards.length > 0
  ? showroomRewards[0]
  : { bookingPoint: 0, bookingPointStaff: 0, bookingPointForShowroom: 0 };

    // --------------------------------------------------------------------------------------------------------
    useEffect(() => {
        fetchDrivers();
    }, []);

    const handleViewRewards = (category: ClientCategory) => {
        setVisibleCategory(visibleCategory === category ? null : category);
    };
    const getRewardsList = (): { category: ClientCategory; rewards: ClientRewardDetails[] }[] => {
        if (!visibleCategory) {
            return [
                { category: 'Driver', rewards: driverRewards },
                { category: 'Showroom', rewards: showroomRewards },
                { category: 'Marketing Executive', rewards: customerRewards },
                { category: 'ShowroomStaff', rewards: showroomStaffRewards },
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

    const handleBookingPointChange = (id: string, value: string) => {
        setBookingPoints((prevPoints) => ({ ...prevPoints, [id]: parseInt(value) || 0 }));
    };

    const updateBookingPointsInAllShowrooms = async (category: any, bookingPoint: any) => {
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
                                bookingPointForShowroom: bookingPoint2, // Store Points For ShowRoom
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

    const updateAllShowroomStaffRewards = async () => {
        try {
            const showroomStaffCollection = collection(db, `user/${uid}/showroomStaff`);
            const showroomStaffSnapshot = await getDocs(showroomStaffCollection);

            showroomStaffSnapshot.forEach(async (staffDoc) => {
                const staffData = staffDoc.data();
            });

            console.log('All showroom staff reward points updated successfully.');
        } catch (error) {
            console.error('Error updating showroom staff reward points:', error);
        }
    };

    // Call this function when needed
    updateAllShowroomStaffRewards();
// ---------------------------------------------------------------------------------
    return (
        <div className="client-rewards-container">
            <h1>CLIENT REWARDS</h1>
            <br />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
    {[
      { category: "Driver", rewardPoints: driverRewards.reduce((acc, cur) => acc + cur.rewardPoints, 0) },
      { category: "Showroom", rewardPoints: showroomRewards.reduce((acc, cur) => acc + cur.rewardPoints, 0) },
      { category: "Marketing Executive", rewardPoints: customerRewards.reduce((acc, cur) => acc + cur.rewardPoints, 0) },
      { category: "ShowroomStaff", rewardPoints: showroomStaffRewards.reduce((acc, cur) => acc + cur.rewardPoints, 0) },
    ].map((client, index) => (
      <div
        key={index}
        className="bg-white shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl p-6 text-center border border-gray-200"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">{client.category}</h2>

        {client.category === "Showroom" && (
          <p className="text-gray-700 font-medium">Booking Point: {storedShowroomPoints.bookingPoint}</p>
        )}
        {client.category === "ShowroomStaff" && (
          <p className="text-gray-700 font-medium">
            Booking Point Staff: {storedShowroomPoints.bookingPointStaff} <br />
            Booking Point For Showroom: {storedShowroomPoints.bookingPointForShowroom}
          </p>
        )}

        {client.category !== "Driver" && client.category !== "ShowroomStaff" && (
          <>
            <input
              placeholder="Enter Points"
              type="text"
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              value={bookingPoints[client.category] || ""}
              onChange={(e) => handleBookingPointChange(client.category, e.target.value)}
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg mt-3 w-full"
              onClick={() => handleBookingPointUpdate(client.category, bookingPoints[client.category])}
            >
              OK
            </button>
          </>
        )}

        {client.category === "ShowroomStaff" && (
          <>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 mb-2"
              placeholder="Points For ShowRoomStaff"
              value={bookingPoints[`${client.category}_1`] || ""}
              onChange={(e) => handleBookingPointChange(`${client.category}_1`, e.target.value)}
            />
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Points For ShowRoom"
              value={bookingPoints[`${client.category}_2`] || ""}
              onChange={(e) => handleBookingPointChange(`${client.category}_2`, e.target.value)}
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg mt-3 w-full"
              onClick={() => {
                const bookingPoint = {
                  bookingPoint1: bookingPoints[`${client.category}_1`],
                  bookingPoint2: bookingPoints[`${client.category}_2`],
                };
                handleBookingPointUpdate(client.category, bookingPoint);
              }}
            >
              OK
            </button>
          </>
        )}

        <button
          onClick={() => handleViewRewards(client.category as ClientCategory)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg mt-4 w-full"
        >
          {visibleCategory === client.category ? "Hide Rewards" : "View Rewards"}
        </button>
      </div>
    ))}

    {/* Success Alert */}
    {successMessage && (
      <div className="fixed top-25 right-6 bg-green-500 text-white p-3 rounded-lg shadow-lg transition-all">
        {successMessage}
      </div>
    )}
  </div>
            <div className="rewards-list">
                {getRewardsList().map(({ category, rewards }) => (
                    <div key={category}>
                        <h3>{category} Rewards</h3>
                        <ul>
                            {rewards.map((client, index) => (
                                <li key={index} className="reward-item">
                                    <span className="reward-name">{client.name}</span>
                                    <span className="text-lg font-bold text-green-600">
                                        {client.rewardPoints} pts
                                        <Button onClick={() => handleView(client.id, client.name, client.rewardPoints, category as ClientCategory)}>
                                            <IconEye />
                                        </Button>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
                <div className="max-w-4xl mx-auto px-4 py-6">
                    {showroomRewards.map((showroom) => (
                        <div key={showroom.id} className="bg-white rounded-xl shadow-lg p-6 mb-8 hover:shadow-2xl transition-shadow duration-300">
                            <h2 className="text-3xl font-extrabold text-gray-800 mb-3">{showroom.name}</h2>
                            <p className="text-gray-600 mb-4">
                                Reward Points: <span className="font-semibold text-blue-600">{showroom.rewardPoints}</span> | Booking Point:{' '}
                                <span className="font-semibold text-blue-600">{showroom.bookingPoint}</span>
                            </p>

                            {showroom.staff && showroom.staff.length > 0 ? (
                                <div className="mt-6">
                                    <h3 className="text-2xl font-bold text-gray-700 mb-3 border-b pb-2">Staff</h3>
                                    <ul className="space-y-3">
                                        {showroom.staff.map((staffMember) => (
                                            <li key={staffMember.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                                <div>
                                                    <p className="text-lg font-semibold text-gray-800">{staffMember.name}</p>
                                                    <p className="text-sm text-gray-500">{staffMember.phoneNumber}</p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className="text-lg font-bold text-green-600">{staffMember.rewardPoints} pts</div>
                                                    <Button onClick={() => handleView(staffMember.id, staffMember.name, staffMember.rewardPoints ?? 0, 'ShowroomStaff' as ClientCategory)}>
                                                        <IconEye />
                                                    </Button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-gray-500 mt-4">No staff found for this showroom.</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ClientRewards;
