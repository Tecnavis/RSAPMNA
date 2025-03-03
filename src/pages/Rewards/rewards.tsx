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
      
          // For each showroom document, fetch staff matching the showroomId
          const showroomList: ClientRewardDetails[] = await Promise.all(
            showroomSnapshot.docs.map(async (docSnapshot) => {
              const showroomData = docSnapshot.data();
              // Assuming either the document has a showroomId field or you use the doc.id
              const showroomIdFromDoc = showroomData.id || docSnapshot.id;
      

              // Query showroomStaff collection where showroomId matches
              const staffQuery = query(
                collection(db, `user/${uid}/showroomStaff`),
                where("showroomId", "==", showroomIdFromDoc)
              );
              const staffSnapshot = await getDocs(staffQuery);
              const staffList: Staff[] = staffSnapshot.docs.map((staffDoc) => {
                const staffData = staffDoc.data();
                return {
                  id: staffDoc.id,
                  name: staffData.name,
                  phoneNumber: staffData.phoneNumber,
                  rewardPoints: staffData.rewardPoints || 0,
                };
              });
      
              return {
                id: docSnapshot.id,
                name: showroomData.ShowRoom, // Adjust if your field name is different
                rewardPoints: showroomData.rewardPoints || 0,
                bookingPoint: showroomData.bookingPoint || 0,
                staff: staffList, // Attach the fetched staff list
              };
            })
          );
      
          setShowroomRewards(showroomList);
          // If you want to keep showroomStaffRewards separately,
          // you might filter or merge showroomList.staff from each showroom.
          setShowroomStaffRewards(showroomList);
        } catch (error) {
          console.error("Error fetching showrooms and staff:", error);
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
            <span className="text-lg font-bold text-green-600">

              {client.rewardPoints} pts
              <Button
                onClick={() =>
                  handleView(
                    client.id,
                    client.name,
                    client.rewardPoints,
                    category as ClientCategory
                  )
                }
              >
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
    <div
      key={showroom.id}
      className="bg-white rounded-xl shadow-lg p-6 mb-8 hover:shadow-2xl transition-shadow duration-300"
    >
      <h2 className="text-3xl font-extrabold text-gray-800 mb-3">
        {showroom.name}
      </h2>
      <p className="text-gray-600 mb-4">
        Reward Points:{" "}
        <span className="font-semibold text-blue-600">
          {showroom.rewardPoints}
        </span>{" "}
        | Booking Point:{" "}
        <span className="font-semibold text-blue-600">
          {showroom.bookingPoint}
        </span>
      </p>

      {showroom.staff && showroom.staff.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-2xl font-bold text-gray-700 mb-3 border-b pb-2">
            Staff
          </h3>
          <ul className="space-y-3">
            {showroom.staff.map((staffMember) => (
              <li
                key={staffMember.id}
                className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-lg font-semibold text-gray-800">
                    {staffMember.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {staffMember.phoneNumber}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-lg font-bold text-green-600">
                    {staffMember.rewardPoints} pts
                  </div>
                  <Button
                    onClick={() =>
                      handleView(
                        staffMember.id,
                        staffMember.name,
                        staffMember.rewardPoints ?? 0,
                        "ShowroomStaff" as ClientCategory
                      )
                    }
                  >
                    <IconEye />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-gray-500 mt-4">
          No staff found for this showroom.
        </p>
      )}
    </div>
  ))}
</div>



            </div>
        </div>
    );
};

export default ClientRewards;
