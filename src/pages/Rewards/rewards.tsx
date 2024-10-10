import React, { useEffect, useState } from 'react';
import './style.css'; // Add custom styles here
import { Button } from '@mui/material';
import IconEye from '../../components/Icon/IconEye';
import { collection, doc, getDocs, getFirestore, query, setDoc, where } from 'firebase/firestore';

type ClientCategory = 'Driver' | 'Staff' | 'Showroom'| 'ShowroomStaff' | 'Customer';
interface ClientRewardDetails {
    id: string;
    name: string;
    rewardPoints: number;
    companyName?: string;
      percentage?: number;
      category?: string;
      staff: Staff[]; // Use the updated Staff interface
    }
interface Staff {
    id: string; // Add this line
    name: string;
    phoneNumber: string;
    rewardPoints?: number;
}
// ---------------------------------------------------------------------------------------
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
    const [showroomStaffRewards, setShowroomStaffRewards] = useState<ClientRewardDetails[]>([]);

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
                    staff: [] // Initialize with an empty array or fetch actual staff data if needed
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
            companyName: doc.data().companyName || '', // Ensure companyName is included
            percentage: doc.data().percentage || 0, // Ensure percentage is included
            staff: [] // Initialize with an empty array or add actual staff if applicable
        }));

        setStaffRewards(staffList);
    } catch (error) {
        console.error('Error fetching staff:', error);
    }
};

    const fetchShowrooms = async () => {
        try {
            const showroomCollection = collection(db, `user/${uid}/showroom`);
            const showroomSnapshot = await getDocs(showroomCollection);
    
            const showroomList: ClientRewardDetails[] = showroomSnapshot.docs.map((doc) => ({
                id: doc.id, // Get the showroom ID
                name: doc.data().ShowRoom,
                rewardPoints: doc.data().rewardPoints || 0,
                staff: doc.data().staff?.map((staff: any) => ({
                    id: staff.id, // Make sure to fetch the ID for each staff member
                    name: staff.name,
                    phoneNumber: staff.phoneNumber,
                    rewardPoints: staff.rewardPoints || 0,
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
            case 'Staff':
                return staffRewards;
            case 'Showroom':
                return showroomRewards;
                case 'ShowroomStaff':
                    return showroomStaffRewards;
                
            case 'Customer':
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
        const selectedStaff = showroomRewards.find(showroom => showroom.name === showroomName)?.staff?.find(staff => staff.name === staffMember);
    
        if (selectedStaff) {
            setSelectedShowroomStaff((prev) => ({
                ...prev,
                [showroomName]: staffMember,
            }));
                window.location.href = `/rewarddetails?id=${id}&name=${encodeURIComponent(selectedStaff.name)}&rewardPoints=${selectedStaff.rewardPoints || 0}&category=ShowroomStaff`;
        }
    };
    
    const handleShowroomClick = (clientName: string) => {
        setShowroomVisible((prev) => (prev === clientName ? null : clientName)); // Toggle dropdown visibility
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
                    { category: 'ShowroomStaff', rewardPoints: showroomStaffRewards.reduce((acc, cur) => acc + cur.rewardPoints, 0) }, // Display ShowroomStaff reward points

                ].map((client) => (
                <div key={client.category as ClientCategory} className={`client-card ${client.category.toLowerCase()}`}>
    <h2>{client.category}</h2>
    
    {/* Conditional rendering of the percentage input */}
    {client.category === 'Staff' && (
        <div className="percentage-container">
            <label htmlFor={`${client.category}-percentage`}>Set Percentage: </label>
            <input
                type="number"
                id={`${client.category}-percentage`}
                value={staffPercentage}  // Always show staffPercentage for 'Staff'
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
    <div className="mt-6 space-y-2">
        <label
            className="block text-sm font-semibold text-gray-800 tracking-wide"
            htmlFor={`${client.name}-staff-select`}
        >
            Select Staff
        </label>
        <div className="relative">
        <select
    id={`${client.name}-staff-select`}
    value={selectedShowroomStaff[client.name] || ''}
    onChange={(e) => handleShowroomStaffSelect(client.id,client.name, e.target.value, client.rewardPoints, category as ClientCategory)}
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
           <span>
               {staffMember.name}
           </span>
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
// -----------------------------------------------------08/10/2024------------------------------------------------


// import React, { useEffect, useState } from 'react';
// import './style.css'; // Add custom styles here
// import { Button } from '@mui/material';
// import IconEye from '../../components/Icon/IconEye';
// import { collection, doc, getDocs, getFirestore, query, setDoc, where } from 'firebase/firestore';

// type ClientCategory = 'Driver' | 'Staff' | 'Showroom' | 'Customer';
// interface ClientRewardDetails {
//     id: string;
//     name: string;
//     rewardPoints: number;
//     companyName?: string;
//       percentage?: number;
//       category?: string;
//       staff: Staff[]; // Use the updated Staff interface
//     }
// interface Staff {
//     id: string; // Add this line
//     name: string;
//     phoneNumber: string;
//     rewardPoints?: number;
// }
// // ---------------------------------------------
// const ClientRewards: React.FC = () => {
//     const [visibleCategory, setVisibleCategory] = useState<ClientCategory | null>(null);
//     const [driverRewards, setDriverRewards] = useState<ClientRewardDetails[]>([]);
//     const [staffRewards, setStaffRewards] = useState<ClientRewardDetails[]>([]);
//     const [customerRewards, setCustomerRewards] = useState<ClientRewardDetails[]>([]);
//     const [showroomRewards, setShowroomRewards] = useState<ClientRewardDetails[]>([]);
//     const [selectedShowroomStaff, setSelectedShowroomStaff] = useState<{ [showroomName: string]: string }>({});
//     const [showroomVisible, setShowroomVisible] = useState<string | null>(null); // Track the clicked showroom
//     const [staffPercentage, setStaffPercentage] = useState<number>(0);
//     const [showroomPercentage, setShowroomPercentage] = useState<number>(0);
//     const [customerPercentage, setCustomerPercentage] = useState<number>(0);
//     const [showroomStaffRewards, setShowroomStaffRewards] = useState<ClientRewardDetails[]>([]);

//     const db = getFirestore();
//     const uid = sessionStorage.getItem('uid');

//     const fetchDrivers = async () => {
//         try {
//             // Create a query to fetch drivers with companyName 'RSA'
//             const driversCollection = collection(db, `user/${uid}/driver`);
//             const rsaQuery = query(driversCollection, where('companyName', '==', 'RSA'));
    
//             // Fetch all RSA drivers
//             const driverSnapshot = await getDocs(rsaQuery);
    
//             const driversList: ClientRewardDetails[] = driverSnapshot.docs.map((doc) => {
//                 const driverData = doc.data();
//                 return {
//                     id: doc.id, // Ensure id is a string
//                     name: driverData.driverName, // Ensure driverName is a string
//                     rewardPoints: driverData.companyName === 'RSA' 
//                         ? driverData.rewardPoints || 0 // Fetch from DB for RSA
//                         : calculateRewardPoints(driverData), // Calculate for non-RSA drivers
//                     companyName: driverData.companyName, // Ensure companyName is a string
//                     percentage: driverData.percentage || 0, // Fetch the percentage
//                     staff: [] // Initialize with an empty array or fetch actual staff data if needed
//                 };
//             });
    
//             setDriverRewards(driversList);
//         } catch (error) {
//             console.error('Error fetching drivers:', error);
//         }
//     };
    
//   // Function to calculate reward points for non-RSA drivers
//   const calculateRewardPoints = (driverData: any) => {
//       // Implement your logic to calculate reward points here
//       return driverData.rewardPoints || 0;
//   };
  

//   const fetchStaff = async () => {
//     try {
//         const staffCollection = collection(db, `user/${uid}/users`);
//         const staffSnapshot = await getDocs(staffCollection);

//         const staffList: ClientRewardDetails[] = staffSnapshot.docs.map((doc) => ({
//             id: doc.id,
//             name: doc.data().name,
//             rewardPoints: doc.data().rewardPoints || 0,
//             companyName: doc.data().companyName || '', // Ensure companyName is included
//             percentage: doc.data().percentage || 0, // Ensure percentage is included
//             staff: [] // Initialize with an empty array or add actual staff if applicable
//         }));

//         setStaffRewards(staffList);
//     } catch (error) {
//         console.error('Error fetching staff:', error);
//     }
// };

//     const fetchShowrooms = async () => {
//         try {
//             const showroomCollection = collection(db, `user/${uid}/showroom`);
//             const showroomSnapshot = await getDocs(showroomCollection);
    
//             const showroomList: ClientRewardDetails[] = showroomSnapshot.docs.map((doc) => ({
//                 id: doc.id, // Get the showroom ID
//                 name: doc.data().ShowRoom,
//                 rewardPoints: doc.data().rewardPoints || 0,
//                 staff: doc.data().staff?.map((staff: any) => ({
//                     id: staff.id, // Make sure to fetch the ID for each staff member
//                     name: staff.name,
//                     phoneNumber: staff.phoneNumber,
//                     rewardPoints: staff.rewardPoints || 0,
//                 })) || [], // Default to an empty array if no staff is found
//             }));
    
//             setShowroomRewards(showroomList);
//         } catch (error) {
//             console.error('Error fetching showrooms:', error);
//         }
//     };
    
//     useEffect(() => {
//         fetchDrivers();
//         fetchStaff();
//         fetchShowrooms();
//     }, []);
//     // ---------------------------------------------------------------------------
//     const handleViewRewards = (category: ClientCategory) => {
//         setVisibleCategory(visibleCategory === category ? null : category);
//     };
//     const handlePercentageChange = (category: ClientCategory, value: number) => {
//         switch (category) {
//             case 'Staff':
//                 setStaffPercentage(value);
//                 break;
//             case 'Showroom':
//                 setShowroomPercentage(value);
//                 break;
//             case 'Customer':
//                 setCustomerPercentage(value);
//                 break;
//         }
//     };

//     const savePercentageToFirestore = async (category: ClientCategory) => {
//         try {
//             let collectionName = '';
//             let percentage = 0;

//             switch (category) {
//                 case 'Staff':
//                     collectionName = `user/${uid}/users`;
//                     percentage = staffPercentage;
//                     break;

//                 case 'Showroom':
//                     collectionName = `user/${uid}/showroom`;
//                     percentage = showroomPercentage;
//                     break;

//                 case 'Customer':
//                     collectionName = `user/${uid}/customer`;
//                     percentage = customerPercentage;
//                     break;

//                 default:
//                     throw new Error('Invalid category');
//             }

//             // Get reference to the Firestore collection
//             const collectionRef = collection(db, collectionName);
//             if (category === 'Staff' || category === 'Showroom') {
//                 // For Staff and Showroom, update percentage for all documents in their respective collections
//                 const querySnapshot = await getDocs(collectionRef);

//                 querySnapshot.forEach(async (docSnap) => {
//                     const docRef = doc(collectionRef, docSnap.id);
//                     await setDoc(docRef, { percentage }, { merge: true });
//                 });
//             } else {
//                 // For Customer, update the document of the current user
//                 const docRef = doc(collectionRef, `${uid}`);
//                 await setDoc(docRef, { percentage }, { merge: true });
//             }

//             console.log(`${category} percentage saved successfully!`);
//         } catch (error) {
//             console.error('Error saving percentage:', error);
//         }
//     };

//     const getRewardsList = (): { category: ClientCategory; rewards: ClientRewardDetails[] }[] => {
//         if (!visibleCategory) {
//             return [
//                 { category: 'Driver', rewards: driverRewards },
//                 { category: 'Staff', rewards: staffRewards },
//                 { category: 'Showroom', rewards: showroomRewards },
//                 { category: 'Customer', rewards: customerRewards },
//             ];
//         } else {
//             return [{ category: visibleCategory, rewards: getCategoryRewards(visibleCategory) }];
//         }
//     };

//     const getCategoryRewards = (category: ClientCategory): ClientRewardDetails[] => {
//         switch (category) {
//             case 'Driver':
//                 return driverRewards;
//             case 'Staff':
//                 return staffRewards;
//             case 'Showroom':
//                 return showroomRewards;
//             case 'Customer':
//                 return customerRewards;
//             default:
//                 return [];
//         }
//     };

//     const handleView = (id: string | number, name: string, rewardPoints: number, category: ClientCategory) => {
//         // Log the category to the console
//         console.log('Category:', category);
        
//         // Redirect to the reward details page
//         window.location.href = `/rewarddetails?id=${id}&name=${encodeURIComponent(name)}&rewardPoints=${rewardPoints}&category=${encodeURIComponent(category)}`;
//     };
//     const handleShowroomStaffSelect = (showroomName: string, staffMember: string) => {
//         // Find the staff object based on the selected staff member
//         const selectedStaff = showroomRewards.find(showroom => showroom.name === showroomName)?.staff?.find(staff => staff.name === staffMember);
    
//         if (selectedStaff) {
//             // Update the selected showroom staff state
//             setSelectedShowroomStaff((prev) => ({
//                 ...prev,
//                 [showroomName]: staffMember,
//             }));
    
//             // Navigate to the reward details page with the selected staff ID
//             window.location.href = `/rewarddetails?id=${selectedStaff.id}&name=${encodeURIComponent(selectedStaff.name)}&rewardPoints=${selectedStaff.rewardPoints || 0}&category=Staff`;
//         }
//     };
    
//     const handleShowroomClick = (clientName: string) => {
//         setShowroomVisible((prev) => (prev === clientName ? null : clientName)); // Toggle dropdown visibility
//     };


//     return (
//         <div className="client-rewards-container">
//             <h1>CLIENT REWARDS</h1>
//             <br />
//             <div className="cards-container">
//                 {[
//                     { category: 'Driver', rewardPoints: driverRewards.reduce((acc, cur) => acc + cur.rewardPoints, 0) },
//                     { category: 'Staff', rewardPoints: staffRewards.reduce((acc, cur) => acc + cur.rewardPoints, 0) },
//                     { category: 'Showroom', rewardPoints: showroomRewards.reduce((acc, cur) => acc + cur.rewardPoints, 0) },
//                     { category: 'Customer', rewardPoints: customerRewards.reduce((acc, cur) => acc + cur.rewardPoints, 0) },
//                 ].map((client) => (
//                     <div key={client.category as ClientCategory} className={`client-card ${client.category.toLowerCase()}`}>
//                         <h2>{client.category}</h2>
//                         {/* <p>Percentage: {client.percentage}</p> */}
//     {(client.category === 'Staff' || client.category === 'Showroom' || client.category === 'Customer') && (
//                             <div className="percentage-container">
//                                 <label htmlFor={`${client.category}-percentage`}>Set Percentage: </label>
//                                 <input
//                                     type="number"
//                                     id={`${client.category}-percentage`}
//                                     value={client.category === 'Staff' ? staffPercentage : client.category === 'Showroom' ? showroomPercentage : customerPercentage}
//                                     onChange={(e) => handlePercentageChange(client.category as ClientCategory, Number(e.target.value))}
//                                 />
//                                 <Button onClick={() => savePercentageToFirestore(client.category as ClientCategory)}>Save</Button>
//                             </div>
//                         )}

//                         <button onClick={() => handleViewRewards(client.category as ClientCategory)} className="reward-btn">
//                             {visibleCategory === client.category ? 'Hide Rewards' : 'View Rewards'}
//                         </button>
//                     </div>
//                 ))}
//             </div>

//             <div className="rewards-list">
//                 {getRewardsList().map(({ category, rewards }) => (
//                     <div key={category}>
//                         <h3>{category} Rewards</h3>
//                         <ul>
//                             {rewards.map((client, index) => (
//                                 <li key={index} className="reward-item">
//                                     <span className="reward-name">{client.name}</span>
//                                     {client.staff && client.staff.length > 0 && (
//                                         <>
//                                             {/* Only show the "Select Staff" dropdown when the showroom is clicked */}
//                                             <Button onClick={() => handleShowroomClick(client.name)}>Show Staff</Button>

//                                             {showroomVisible === client.name && (
//                                                 <div className="select-container">
//                                                     <select value={selectedShowroomStaff[client.name] || ''} onChange={(e) => handleShowroomStaffSelect(client.name, e.target.value)}>
//                                                         <option value="" disabled>
//                                                             Select Staff
//                                                         </option>
//                                                         {client.staff.map((staffMember, staffIndex) => (
//                                                             <option key={staffIndex} value={staffMember.name}>
//                                                                 {staffMember.name} - {staffMember.phoneNumber} ({staffMember.rewardPoints || 0} points)
//                                                             </option>
//                                                         ))}
//                                                     </select>
//                                                 </div>
//                                             )}
//                                         </>
//                                     )}
//                                     <span className="reward-points">
//                                         {client.rewardPoints} points
//                                         <Button
//                                             onClick={() => {
//                                                 handleView(client.id, client.name, client.rewardPoints, category as ClientCategory); // Call the handleView function with the id, name, and rewardPoints
//                                             }}
//                                         >
//                                             <IconEye />
//                                         </Button>
//                                     </span>
//                                 </li>
//                             ))}
//                         </ul>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// export default ClientRewards;
