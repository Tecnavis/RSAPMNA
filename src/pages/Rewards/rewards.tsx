import React, { useEffect, useState } from 'react';
import './style.css'; // Add custom styles here
import { Button } from '@mui/material';
import IconEye from '../../components/Icon/IconEye';
import { collection, doc, getDocs, getFirestore, query, setDoc, where } from 'firebase/firestore';

type ClientCategory = 'Driver' | 'Staff' | 'Showroom' | 'Customer';
interface ClientRewardDetails {
    id: string;
    name: string;
    rewardPoints: number;
    companyName?: string;
      percentage?: number;
      category?: string;
    staff?: { name: string; phoneNumber: string; rewardPoints?: number }[];
}
const ClientRewards: React.FC = () => {
    const [visibleCategory, setVisibleCategory] = useState<ClientCategory | null>(null);
    const [driverRewards, setDriverRewards] = useState<ClientRewardDetails[]>([]);
    const [staffRewards, setStaffRewards] = useState<ClientRewardDetails[]>([]);
    const [customerRewards, setCustomerRewards] = useState<ClientRewardDetails[]>([]);
    const [showroomRewards, setShowroomRewards] = useState<ClientRewardDetails[]>([]);
    const [selectedShowroomStaff, setSelectedShowroomStaff] = useState<{ [showroomName: string]: string }>({});
    const [showroomVisible, setShowroomVisible] = useState<string | null>(null); // Track the clicked showroom
    const [staffPercentage, setStaffPercentage] = useState<number>(0);
    const [showroomPercentage, setShowroomPercentage] = useState<number>(0);
    const [customerPercentage, setCustomerPercentage] = useState<number>(0);
    
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
                  rewardPoints: driverData.companyName === 'RSA' 
                      ? driverData.rewardPoints || 0 // Fetch from DB for RSA
                      : calculateRewardPoints(driverData), // Calculate for non-RSA drivers
                  companyName: driverData.companyName, // Ensure companyName is a string
                  percentage: driverData.percentage || 0, // Fetch the percentage
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
  

    const fetchStaff = async () => {
        try {
            const staffCollection = collection(db, `user/${uid}/users`);
            const staffSnapshot = await getDocs(staffCollection);

            const staffList: ClientRewardDetails[] = staffSnapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name,
                rewardPoints: doc.data().rewardPoints || 0,
            }));

            setStaffRewards(staffList);
            // setProviderRewards((prev) => [...prev, ...filteredProviderRewardsList]);
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    const fetchShowrooms = async () => {
        try {
            const showroomCollection = collection(db, `user/${uid}/showroom`);
            const showroomSnapshot = await getDocs(showroomCollection);

            const showroomList: ClientRewardDetails[] = showroomSnapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().ShowRoom,
                rewardPoints: doc.data().rewardPoints || 0,
                staff: doc.data().staff || [],
            }));

            setShowroomRewards(showroomList);
        } catch (error) {
            console.error('Error fetching showrooms:', error);
        }
    };

    useEffect(() => {
        fetchDrivers();
        fetchStaff();
        fetchShowrooms();
    }, []);
    // ---------------------------------------------------------------------------
    const handleViewRewards = (category: ClientCategory) => {
        setVisibleCategory(visibleCategory === category ? null : category);
    };
    const handlePercentageChange = (category: ClientCategory, value: number) => {
        switch (category) {
            case 'Staff':
                setStaffPercentage(value);
                break;
            case 'Showroom':
                setShowroomPercentage(value);
                break;
            case 'Customer':
                setCustomerPercentage(value);
                break;
        }
    };

    const savePercentageToFirestore = async (category: ClientCategory) => {
        try {
            let collectionName = '';
            let percentage = 0;

            switch (category) {
                case 'Staff':
                    collectionName = `user/${uid}/users`;
                    percentage = staffPercentage;
                    break;

                case 'Showroom':
                    collectionName = `user/${uid}/showroom`;
                    percentage = showroomPercentage;
                    break;

                case 'Customer':
                    collectionName = `user/${uid}/customer`;
                    percentage = customerPercentage;
                    break;

                default:
                    throw new Error('Invalid category');
            }

            // Get reference to the Firestore collection
            const collectionRef = collection(db, collectionName);
            if (category === 'Staff' || category === 'Showroom') {
                // For Staff and Showroom, update percentage for all documents in their respective collections
                const querySnapshot = await getDocs(collectionRef);

                querySnapshot.forEach(async (docSnap) => {
                    const docRef = doc(collectionRef, docSnap.id);
                    await setDoc(docRef, { percentage }, { merge: true });
                });
            } else {
                // For Customer, update the document of the current user
                const docRef = doc(collectionRef, `${uid}`);
                await setDoc(docRef, { percentage }, { merge: true });
            }

            console.log(`${category} percentage saved successfully!`);
        } catch (error) {
            console.error('Error saving percentage:', error);
        }
    };

    const getRewardsList = (): { category: ClientCategory; rewards: ClientRewardDetails[] }[] => {
        if (!visibleCategory) {
            return [
                { category: 'Driver', rewards: driverRewards },
                { category: 'Staff', rewards: staffRewards },
                { category: 'Showroom', rewards: showroomRewards },
                { category: 'Customer', rewards: customerRewards },
            ];
        } else {
            return [{ category: visibleCategory, rewards: getCategoryRewards(visibleCategory) }];
        }
    };

    const getCategoryRewards = (category: ClientCategory): ClientRewardDetails[] => {
        switch (category) {
            case 'Driver':
                return driverRewards;
            case 'Staff':
                return staffRewards;
            case 'Showroom':
                return showroomRewards;
            case 'Customer':
                return customerRewards;
            default:
                return [];
        }
    };

    const handleView = (id: string | number, name: string, rewardPoints: number, category: ClientCategory) => {
        // Log the category to the console
        console.log('Category:', category);
        
        // Redirect to the reward details page
        window.location.href = `/rewarddetails?id=${id}&name=${encodeURIComponent(name)}&rewardPoints=${rewardPoints}&category=${encodeURIComponent(category)}`;
    };
    
    

    const handleShowroomStaffSelect = (showroomName: string, staffMember: string) => {
        setSelectedShowroomStaff((prev) => ({
            ...prev,
            [showroomName]: staffMember,
        }));
    };
    const handleShowroomClick = (clientName: string) => {
        setShowroomVisible((prev) => (prev === clientName ? null : clientName)); // Toggle dropdown visibility
    };

    const handleShowroomStaff = (clientName: string, selectedStaff: string) => {
        // Handle staff selection logic here
        console.log(`Selected staff ${selectedStaff} for showroom ${clientName}`);
    };
    return (
        <div className="client-rewards-container">
            <h1>CLIENT REWARDS</h1>
            <br />
            <div className="cards-container">
                {[
                    { category: 'Driver', rewardPoints: driverRewards.reduce((acc, cur) => acc + cur.rewardPoints, 0) },
                    { category: 'Staff', rewardPoints: staffRewards.reduce((acc, cur) => acc + cur.rewardPoints, 0) },
                    { category: 'Showroom', rewardPoints: showroomRewards.reduce((acc, cur) => acc + cur.rewardPoints, 0) },
                    { category: 'Customer', rewardPoints: customerRewards.reduce((acc, cur) => acc + cur.rewardPoints, 0) },
                ].map((client) => (
                    <div key={client.category as ClientCategory} className={`client-card ${client.category.toLowerCase()}`}>
                        <h2>{client.category}</h2>
                        {/* <p>Percentage: {client.percentage}</p> */}
                        {client.category !== 'Driver' && (
                            <div className="percentage-container">
                                <label htmlFor={`${client.category}-percentage`}>Set Percentage: </label>
                                <input
                                    type="number"
                                    id={`${client.category}-percentage`}
                                    value={client.category === 'Staff' ? staffPercentage : client.category === 'Showroom' ? showroomPercentage : customerPercentage}
                                    onChange={(e) => handlePercentageChange(client.category as ClientCategory, Number(e.target.value))}
                                />
                                <Button onClick={() => savePercentageToFirestore(client.category as ClientCategory)}>Save</Button>
                            </div>
                        )}

                        <button onClick={() => handleViewRewards(client.category as ClientCategory)} className="reward-btn">
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
                                                <div className="select-container">
                                                    <select value={selectedShowroomStaff[client.name] || ''} onChange={(e) => handleShowroomStaffSelect(client.name, e.target.value)}>
                                                        <option value="" disabled>
                                                            Select Staff
                                                        </option>
                                                        {client.staff.map((staffMember, staffIndex) => (
                                                            <option key={staffIndex} value={staffMember.name}>
                                                                {staffMember.name} - {staffMember.phoneNumber} ({staffMember.rewardPoints || 0} points)
                                                            </option>
                                                        ))}
                                                    </select>
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
// -----------------------------------------02-10-2024 6.56PM