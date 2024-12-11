import React, { useState, useEffect } from 'react';
import './reward.css';
import { collection, query, where, getDocs, getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, increment, DocumentData } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

// Interfaces
interface Product {
    id: number;
    image: string;
    name: string;
    description: string;
    price: number;
    category: string;
}

interface RewardItem {
    _id: string;
    docId: string;
    name: string;
    description: string;
    points: string;
    price?: number;
    category?: string;
    percentage?: number;
    stock?: number;
    rewardDetails: DocumentData;
    image?: string;
    claimedDate?: Date;
}

interface Redemption {
    id: number;
    product: Product;
    redeemedDate: string;
    status: 'upcoming' | 'completed';
}

interface Booking {
    id: string;
    selectedDriver: string;
    company: string;
    updatedTotalSalary: number;
}
interface ClaimedHistoryItem {
    itemName: string;
    description: string;
    points: number;
    price: number;
    claimedDate: Timestamp | string; 
    itemImage?: string;
  }

interface StaffMember {
    claimedHistory?: ClaimedHistoryItem[];
    // Add any other properties for a staff member if applicable
}

interface ShowroomData {
    staff: StaffMember[];
    // Add any other properties if needed
}

const RewardPage: React.FC = () => {
    const queryParams = new URLSearchParams(window.location.search);
    const id = queryParams.get('id'); // Driver ID
    const driverName = queryParams.get('name'); // Driver Name
    const category = queryParams.get('category'); // Driver Name
    const phoneNumber = queryParams.get('phoneNumber'); // Driver Name
    const [percentage, setPercentage] = useState<number>(0);
    const [rewards, setRewards] = useState<RewardItem[]>([]);
    const [driverRewards, setDriverRewards] = useState<RewardItem[]>([]);
    const [showroomRewards, setShowroomRewards] = useState<RewardItem[]>([]);
    const [showroomStaffRewards, setShowroomStaffRewards] = useState<RewardItem[]>([]);
    const [rewardDriverPoints, setRewardDriverPoints] = useState<number>(0);
    const [rewardStaffPoints, setRewardStaffPoints] = useState<number>(0);
    const [rewardShowroomPoints, setRewardShowroomPoints] = useState<number>(0);
    const [rewardShowroomStaffPoints, setRewardShowroomStaffPoints] = useState<number>(0);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid');
    const [claimedHistory, setClaimedHistory] = useState<ClaimedHistoryItem[]>([]);
    const [redemptionHistory, setRedemptionHistory] = useState<RewardItem[]>([]);

    useEffect(() => {
        const fetchRewards = async () => {
            try {
                // Query for categories
                const driverQuery = query(collection(db, `user/${uid}/rewarditems`), where('category', '==', 'Driver'));
                const showroomQuery = query(collection(db, `user/${uid}/rewarditems`), where('category', '==', 'Showroom'));
                const showroomStaffQuery = query(collection(db, `user/${uid}/rewarditems`), where('category', '==', 'ShowroomStaff'));

                // Fetch all three sets of results
                const [driverSnapshot, showroomSnapshot, showroomStaffSnapshot] = await Promise.all([getDocs(driverQuery), getDocs(showroomQuery), getDocs(showroomStaffQuery)]);

                // Map and set each rewards state
                setDriverRewards(
                    driverSnapshot.docs.map((doc) => ({
                        _id: doc.id,
                        docId: doc.id,
                        name: doc.data().name || 'Unknown Name',
                        description: doc.data().description || 'No description',
                        points: doc.data().points || '0',
                        price: doc.data().price || '0',
                        category: doc.data().category || 'Driver',
                        percentage: doc.data().percentage || '0',
                        stock: doc.data().stock || '0',
                        image: doc.data().image,
                        claimedDate: doc.data().claimedDate ? doc.data().claimedDate.toDate() : undefined,
                    })) as RewardItem[]
                );

                setShowroomRewards(
                    showroomSnapshot.docs.map((doc) => ({
                        _id: doc.id,
                        docId: doc.id,
                        name: doc.data().name || 'Unknown Name',
                        description: doc.data().description || 'No description',
                        points: doc.data().points || '0',
                        price: doc.data().price || '0',
                        category: doc.data().category || 'Showroom',
                        percentage: doc.data().percentage || '0',
                        stock: doc.data().stock || '0',
                        image: doc.data().image,
                        claimedDate: doc.data().claimedDate ? doc.data().claimedDate.toDate() : undefined,
                    })) as RewardItem[]
                );

                setShowroomStaffRewards(
                    showroomStaffSnapshot.docs.map((doc) => ({
                        _id: doc.id,
                        docId: doc.id,
                        name: doc.data().name || 'Unknown Name',
                        description: doc.data().description || 'No description',
                        points: doc.data().points || '0',
                        price: doc.data().price || '0',
                        category: doc.data().category || 'ShowroomStaff',
                        percentage: doc.data().percentage || '0',
                        stock: doc.data().stock || '0',
                        image: doc.data().image,
                        claimedDate: doc.data().claimedDate ? doc.data().claimedDate.toDate() : undefined,
                    })) as RewardItem[]
                );
            } catch (error) {
                console.error('Error fetching rewards: ', error);
            }
        };

        fetchRewards();
    }, [uid]);
    // ------------------------------------------------------------------------------------
    useEffect(() => {
        const fetchRedemptionHistory = async () => {
            if (!uid || !id) {
                console.error('Missing UID or driver ID.');
                return;
            }

            try {
                // Reference to the driver's redemption history in the rewarditems sub-collection
                const rewardItemsRef = collection(db, `user/${uid}/driver/${id}/rewarditems`);
                const querySnapshot = await getDocs(rewardItemsRef);

                // Process the retrieved documents and set the redemption history
                const rewardsData: RewardItem[] = querySnapshot.docs.map((doc) => ({
                    docId: doc.id,
                    ...doc.data(),
                })) as RewardItem[];

                setRedemptionHistory(rewardsData);
            } catch (error) {
                console.error('Error fetching redemption history:', error);
            }
        };

        fetchRedemptionHistory();
    }, [id, db, uid]);
    // ----------------------------------------------------------------------------------------------------------------
    useEffect(() => {
        const fetchClaimedHistory = async () => {
            if (!uid || !id) {
                console.error('Missing UID or showroom ID.');
                return;
            }

            try {
                // Reference to the 'showroom' document
                const showroomRef = doc(db, `user/${uid}/showroom`, id);
                const showroomDocSnapshot = await getDoc(showroomRef);

                if (showroomDocSnapshot.exists()) {
                    const showroomData = showroomDocSnapshot.data() as ShowroomData;
                    const staffArray = showroomData.staff;

                    // Extract claimedHistory from each staff member
                    const claimedHistoryData: ClaimedHistoryItem[] = staffArray.flatMap((staff: StaffMember) =>
                        (staff.claimedHistory || []).map((item: ClaimedHistoryItem) => {
                            // Check if claimedDate is an instance of Timestamp
                            let claimedDate = item.claimedDate;

                            if (claimedDate instanceof Timestamp) {
                                claimedDate = claimedDate.toDate().toLocaleString(); // Convert to string
                            }

                            return {
                                ...item,
                                claimedDate, // Now it's guaranteed to be a string
                            };
                        })
                    );

                    setClaimedHistory(claimedHistoryData);
                    console.log('Claimed History Data:', claimedHistoryData);
                } else {
                    console.error('Showroom data not found.');
                }
            } catch (error) {
                console.error('Error fetching claimed history:', error);
            }
        };

        fetchClaimedHistory();
    }, [uid, id]);
        useEffect(() => {
        const fetchClaimedRewards = async () => {
            if (!uid || !id) {
                console.error('Missing UID or showroom ID.');
                return;
            }

            try {
                const claimedRewardsRef = collection(db, `user/${uid}/showroom/${id}/claimedRewards`);
                const querySnapshot = await getDocs(claimedRewardsRef);

                // Here we expect RewardItem[] or null values temporarily.
                const claimedRewardsData: (RewardItem | null)[] = await Promise.all(
                    querySnapshot.docs.map(async (document) => {
                        const rewardData = document.data(); // Use 'document' instead of 'doc'
                        const rewardId = rewardData.rewardId;
                        console.log('rewardId', rewardId);

                        if (rewardId) {
                            const rewardItemRef = doc(db, `user/${uid}/rewarditems`, rewardId);
                            const rewardDocSnapshot = await getDoc(rewardItemRef);
                            console.log('rewardItemRef path:', rewardItemRef.path);

                            if (rewardDocSnapshot.exists()) {
                                const rewardDetails = rewardDocSnapshot.data();

                                // Fallback values for missing RewardItem properties
                                const rewardItem: RewardItem = {
                                    docId: document.id,
                                    _id: rewardDetails._id || '', // Provide default values if not present
                                    name: rewardDetails.name || 'No Name',
                                    description: rewardDetails.description || 'No Description',
                                    points: rewardDetails.points || 0,
                                    price: rewardDetails.price || 0, // Provide default value if not available
                                    category: rewardDetails.category || 'Uncategorized', // Provide default value if not available
                                    percentage: rewardDetails.percentage || 0, // Provide default value if not available
                                    stock: rewardDetails.stock || 0, // Provide default value if not available
                                    rewardDetails,
                                };

                                console.log('Reward Details Found:', rewardDetails);
                                console.log('Document ID (docId):', document.id);

                                return rewardItem;
                            } else {
                                console.warn('No reward details found for:', rewardId);
                            }
                        }
                        return null; // If no rewardId is found, return null
                    })
                );

                // Filter out null results and set the redemption history
                const filteredClaimedRewards = claimedRewardsData.filter((item): item is RewardItem => item !== null);

                setRedemptionHistory(filteredClaimedRewards);
                console.log('Claimed Rewards with Details:', filteredClaimedRewards);
            } catch (error) {
                console.error('Error fetching claimed rewards:', error);
            }
        };

        fetchClaimedRewards();
    }, [id, db, uid]);

    useEffect(() => {
        const fetchClaimedRewards = async () => {
            if (!uid || !id) {
                console.error('Missing UID or showroom ID.');
                return;
            }

            try {
                const claimedRewardsRef = collection(db, `user/${uid}/driver/${id}/rewarditems`);
                const querySnapshot = await getDocs(claimedRewardsRef);
                console.log('Claimed Rewards Snapshot:', querySnapshot);

                if (querySnapshot.empty) {
                    console.log('No claimed rewards found.');
                }

                const claimedRewardsData = await Promise.all(
                    querySnapshot.docs.map(async (document) => {
                        const rewardData = document.data();
                        console.log('Reward Data:', rewardData);

                        const rewardId = rewardData.docId;
                        console.log('rewardId', rewardId);

                        if (!rewardId) {
                            console.warn('No rewardId for document:', document.id);
                            return null; // If no rewardId, return null
                        }

                        if (rewardId) {
                            const rewardItemRef = doc(db, `user/${uid}/rewarditems`, rewardId);
                            const rewardDocSnapshot = await getDoc(rewardItemRef);
                            console.log('rewardItemRef path:', rewardItemRef.path);

                            if (rewardDocSnapshot.exists()) {
                                const rewardDetails = rewardDocSnapshot.data();
                                console.log('Reward Details Found:', rewardDetails);

                                // Construct RewardItem object with required properties
                                const rewardItem: RewardItem = {
                                    docId: document.id, // Document ID
                                    _id: rewardDetails._id || '', // Ensure _id exists
                                    name: rewardDetails.name || 'Unnamed Reward', // Provide fallback values
                                    description: rewardDetails.description || 'No Description',
                                    points: rewardDetails.points || 0,
                                    price: rewardDetails.price || 0,
                                    category: rewardDetails.category || 'General',
                                    percentage: rewardDetails.percentage || 0,
                                    stock: rewardDetails.stock || 0,
                                    rewardDetails, // Actual reward details
                                };

                                return rewardItem;
                            } else {
                                console.warn('No reward details found for:', rewardId);
                                return null; // If no reward details found, return null
                            }
                        }

                        return null; // Return null if rewardId is missing
                    })
                );

                // Filter out null values before setting the state
                const filteredClaimedRewardsData = claimedRewardsData.filter((item): item is RewardItem => item !== null);

                setRedemptionHistory(filteredClaimedRewardsData); // Now only RewardItem objects are set
                console.log('Claimed Rewards with Details:', filteredClaimedRewardsData);
            } catch (error) {
                console.error('Error fetching claimed rewards:', error);
            }
        };

        fetchClaimedRewards();
    }, [id, db, uid]);
    useEffect(() => {
        const driverRef = doc(db, `user/${uid}/showroom`, id || '');

        const unsubscribe = onSnapshot(driverRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const driverData = docSnapshot.data();
                const fetchedRewardPoints = driverData?.rewardPoints || 0;
                setRewardShowroomPoints(fetchedRewardPoints);
                console.log(` rewardPointsee: ${fetchedRewardPoints}`);
            }
        });

        return () => unsubscribe(); // Clean up the snapshot listener
    }, [id, db, uid]);
    // Fetch bookings

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                if (!id) {
                    console.error('Error: Showroom ID is null');
                    return;
                }
                const bookingsRef = collection(db, `user/${uid}/bookings`);
    
                // Fetch showroom document to get the bookingPoint
                const showroomRef = doc(db, `user/${uid}/showroom`, id);
                const showroomDocSnap = await getDoc(showroomRef);
                const showroomData = showroomDocSnap.exists() ? showroomDocSnap.data() : {};
                const bookingPoint = showroomData?.bookingPoint; // Default to 500 if not found
    console.log("bookingPoint",bookingPoint)
                // Query for bookings created by 'showroom'
                const showroomQuery = query(
                    bookingsRef,
                    where('showroomId', '==', id),
                    where('bookingStatus', '==', 'ShowRoom Booking'),
                    where('createdBy', '==', 'showroom'),
                    where('status', '==', 'Order Completed')
                );
                const showroomSnapshot = await getDocs(showroomQuery);
                const showroomBookings = showroomSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    
console.log("showroomBookings",showroomBookings)         
       let showroomRewardPoints = showroomBookings.length * bookingPoint; // Use bookingPoint
    
                // Query for bookings created by 'showroomStaff'
                const staffQuery = query(
                    bookingsRef,
                    where('showroomId', '==', id),
                    where('bookingStatus', '==', 'ShowRoom Booking'),
                    where('createdBy', '==', 'showroomStaff'),
                    where('status', '==', 'Order Completed')
                );
                const staffSnapshot = await getDocs(staffQuery);
                const staffBookings = staffSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    
  const staffBookingPoint = showroomData?.bookingPointForShowroom ; // Default to 200 if not found

                let staffRewardPoints = staffBookings.length * staffBookingPoint; // Use bookingPointForShowroom
console.log("staffRewardPoints",staffRewardPoints)
                let totalRewardPoints = showroomRewardPoints + staffRewardPoints;
    
                console.log('Total reward points:', totalRewardPoints);
    
                // Update the reward points in Firestore
                if (category === 'Showroom') {
                    await updateRewardPoints(totalRewardPoints);
                }
            } catch (error) {
                console.error('Error fetching bookings: ', error);
            }
        };
    
        fetchBookings();
    }, [id, db, uid, category]);
    
    const updateRewardPoints = async (totalPoints: number) => {
        try {
            const userRef = doc(db, `user/${uid}/showroom`, id || '');
            await updateDoc(userRef, {
                rewardPoints: totalPoints, 
            });
            console.log(`Updated reward points to ${totalPoints}`);
        } catch (error) {
            console.error('Error updating reward points in Firestore:', error);
        }
    };
    
    useEffect(() => {
        const driverRef = doc(db, `user/${uid}/showroom`, id || '');
    
        const unsubscribe = onSnapshot(driverRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const driverData = docSnapshot.data();
                const fetchedRewardPoints = driverData?.rewardPoints || 0;
                setRewardShowroomPoints(fetchedRewardPoints);
                console.log(` rewardPoints: ${fetchedRewardPoints}`);
            }
        });
    
        return () => unsubscribe(); // Clean up the snapshot listener
    }, [id, db, uid]);
    
    // Fetch showroom staff bookings
    useEffect(() => {
        const fetchShowroomStaffBookings = async () => {
            if (!phoneNumber) {
                console.error('Phone number is null or undefined');
                return; // Exit if phoneNumber is null
            }
            try {
                if (!id) {
                    console.error('Error: Showroom ID is null');
                    return;
                }
                const bookingsRef = collection(db, `user/${uid}/bookings`);
    
                // Fetch showroom document to get the bookingPointForShowroom
                const showroomRef = doc(db, `user/${uid}/showroom`, id);
                const showroomDocSnap = await getDoc(showroomRef);
                const showroomData = showroomDocSnap.exists() ? showroomDocSnap.data() : {};
                const bookingPointStafff = showroomData?.bookingPointStaff ; // Default to 200 if not found
    
                const q = query(bookingsRef, where('showroomId', '==', id), where('createdBy', '==', 'showroomStaff'), where('phone', '==', phoneNumber), where('status', '==', 'Order Completed'));
    
                const querySnapshot = await getDocs(q);
                const fetchedBookings: Booking[] = [];
    
                querySnapshot.forEach((doc) => {
                    fetchedBookings.push({ id: doc.id, ...doc.data() } as Booking);
                });
    
                setBookings(fetchedBookings);
    
                if (category === 'ShowroomStaff') {
                    await updateShowroomStaffRewardPoints(fetchedBookings.length, phoneNumber, bookingPointStafff);
                }
            } catch (error) {
                console.error('Error fetching showroom staff bookings:', error);
            }
        };
    
        fetchShowroomStaffBookings();
    }, [id, db, uid, phoneNumber, category]);
    
    const updateShowroomStaffRewardPoints = async (bookingCount: number, phoneNumber: string, bookingPointStafff: number) => {
        if (bookingCount > 0) {
            const additionalPoints = bookingCount * bookingPointStafff; // Use bookingPointForShowroom
    console.log("additionalPoints",additionalPoints)
            try {
                if (!id) {
                    console.error('Invalid showroom ID');
                    return;
                }
    
                const userRef = doc(db, `user/${uid}/showroom`, id);
    
                const userSnap = await getDoc(userRef);
    
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    const staff = data.staff || [];
    
                    if (!Array.isArray(staff)) {
                        console.error('Staff data is not an array');
                        return;
                    }
    
                    const staffIndex = staff.findIndex((member) => member.phoneNumber === phoneNumber);
    
                    if (staffIndex !== -1) {
                        // Add new points to existing points
                        staff[staffIndex].rewardPoints = (staff[staffIndex].rewardPoints || 0) + additionalPoints;
                        setRewardShowroomStaffPoints(staff[staffIndex].rewardPoints);
    
                        // Update Firestore
                        await updateDoc(userRef, { staff });
                        console.log(`Updated reward points by ${additionalPoints} for staff member with phone number ${phoneNumber}`);
                    } else {
                        console.error('Staff member with the provided phone number not found');
                    }
                } else {
                    console.error('Showroom document does not exist');
                }
            } catch (error) {
                console.error('Error updating reward points in Firestore:', error);
            }
        }
    };
    

    useEffect(() => {
        // Fetch driver data based on id
        const fetchDriverData = async () => {
            if (!uid || !id) {
                console.error('Missing UID or driver ID.');
                return;
            }

            try {
                const driverRef = doc(db, `user/${uid}/driver`, id);
                const docSnapshot = await getDoc(driverRef);

                if (docSnapshot.exists()) {
                    const driverData = docSnapshot.data();
                    const fetchedRewardPoints = driverData?.rewardPoints || 0; // Fetch rewardPoints
                    setRewardDriverPoints(fetchedRewardPoints);
                    console.log(`Fetched rewardPoints: ${fetchedRewardPoints}`);
                } else {
                    console.error('No such document!');
                }
            } catch (error) {
                console.error('Error fetching driver data:', error);
            }
        };

        fetchDriverData();
    }, [id, db, uid]);
    return (
        <div className="reward-container">
            {category == 'Showroom' && (
                <header className="user-info">
                    <h1>Welcome, {driverName}</h1>
                    <h2>Points Available: {rewardShowroomPoints}</h2>
                </header>
            )}
            {category == 'ShowroomStaff' && (
                <header className="user-info">
                    <h1>Welcome, {driverName}</h1>
                    <h2>Points Available: {rewardShowroomStaffPoints}</h2>
                </header>
            )}
            {category == 'Driver' && (
                <header className="user-info">
                    <h1>Welcome, {driverName}</h1>
                    <h2>Points Available: {rewardDriverPoints}</h2>
                </header>
            )}
            {category == 'Staff' && (
                <header className="user-info">
                    <h1>Welcome, {driverName}</h1>
                    <h2>Points Available: {rewardStaffPoints}</h2>
                </header>
            )}
            {category == 'Staff' && (
                <section className="percentage-section">
                    <h3>Percentage for Reward Points Calculation</h3>
                    <input
                        type="number"
                        value={percentage}
                        readOnly // Make the input field read-only
                    />
                </section>
            )}
            <section className="products-section">
                <h3>Redeemable Products</h3>

                {/* Conditionally render based on selected category */}
                {category === 'Driver' && (
                    <div className="product-list">
                        {driverRewards.map((reward) => (
                            <div key={reward._id} className="product-card">
                                <div>{reward.image ? <img src={reward.image} alt="Reward" /> : <span>No Image Available</span>}</div>
                                <div className="product-details">
                                    <h4>{reward.name}</h4>
                                    <p>{reward.description}</p>
                                    <p className="product-price">{reward.price} points</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {category === 'Showroom' && (
                    <div className="product-list">
                        {showroomRewards.map((reward) => (
                            <div key={reward._id} className="product-card">
                                <div>{reward.image ? <img src={reward.image} alt="Reward" /> : <span>No Image Available</span>}</div>
                                <div className="product-details">
                                    <h4>{reward.name}</h4>
                                    <p>{reward.description}</p>
                                    <p className="product-price">{reward.price} points</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {category === 'ShowroomStaff' && (
                    <div className="product-list">
                        {showroomStaffRewards.map((reward) => (
                            <div key={reward._id} className="product-card">
                                <div>{reward.image ? <img src={reward.image} alt="Reward" /> : <span>No Image Available</span>}</div>
                                <div className="product-details">
                                    <h4>{reward.name}</h4>
                                    <p>{reward.description}</p>
                                    <p className="product-price">{reward.price} points</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
            {category == 'Driver' && (
                <section className="history-section bg-gray-50 p-6 rounded-lg shadow-lg">
                    <h3 className="text-2xl font-semibold text-gray-700 mb-4">Previous Redemption History</h3>
                    <div className="history-categories">
                        {redemptionHistory.length === 0 ? (
                            <p className="text-center text-gray-500">No previous redemptions</p>
                        ) : (
                            <div className="history-list grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {redemptionHistory.map((item) => (
                                    <div key={item.docId} className="history-item flex flex-col items-center bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                                        <img
                                            src={item.rewardDetails.image || 'placeholder.jpg'}
                                            alt={item.rewardDetails.name || 'No name'}
                                            className="history-item-image w-full h-40 object-cover rounded-md mb-4"
                                        />
                                        <div className="history-item-details text-center">
                                            <h4 className="text-lg font-medium text-gray-800 mb-2">{item.rewardDetails.name || 'Unnamed Item'}</h4>
                                            <p className="text-sm text-gray-600 mb-1">{item.rewardDetails.description || 'No description'}</p>
                                            <p className="text-sm text-gray-600">
                                                Points: <span className="font-semibold text-gray-700">{item.rewardDetails.points || 'N/A'}</span>
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Price: <span className="font-semibold text-gray-700">{item.rewardDetails.price || 'N/A'}</span>
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Stock: <span className="font-semibold text-gray-700">{item.rewardDetails.stock || 'N/A'}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}
            {category == 'Showroom' && (
                <section className="history-section bg-gray-50 p-6 rounded-lg shadow-lg">
                    <h3 className="text-2xl font-semibold text-gray-700 mb-4">Previous Redemption History</h3>
                    <div className="history-categories">
                        {redemptionHistory.length === 0 ? (
                            <p className="text-center text-gray-500">No previous redemptions</p>
                        ) : (
                            <div className="history-list grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {redemptionHistory.map((item) => (
                                    <div key={item.docId} className="history-item flex flex-col items-center bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                                        <img
                                            src={item.rewardDetails?.image || 'placeholder.jpg'}
                                            alt={item.rewardDetails?.name || 'No name'}
                                            className="history-item-image w-full h-40 object-cover rounded-md mb-4"
                                        />
                                        <div className="history-item-details text-center">
                                            <h4 className="text-lg font-medium text-gray-800 mb-2">{item.rewardDetails?.name || 'Unnamed Item'}</h4>
                                            <p className="text-sm text-gray-600 mb-1">{item.rewardDetails?.description || 'No description'}</p>
                                            <p className="text-sm text-gray-600">
                                                Points: <span className="font-semibold text-gray-700">{item.rewardDetails?.points || 'N/A'}</span>
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Price: <span className="font-semibold text-gray-700">{item.rewardDetails?.price || 'N/A'}</span>
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Stock: <span className="font-semibold text-gray-700">{item.rewardDetails?.stock || 'N/A'}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}
            {category == 'ShowroomStaff' && (
                <section className="history-section bg-gray-50 p-6 rounded-lg shadow-lg">
                    <h3 className="text-2xl font-semibold text-gray-700 mb-4">Previous Redemption History</h3>

                    <div className="history-categories">
                        {claimedHistory.length > 0 ? (
                            claimedHistory.map((reward, index) => (
                                <div key={index} className="reward-card">
                                      {reward.itemImage && (
                <img src={reward.itemImage} alt={reward.itemName} className="reward-image" />
            )}
                                    <h4>{reward.itemName}</h4>
                                    <p>{reward.description}</p>
                                    <p>Points: {reward.points}</p>
                                    <p>Price: {reward.price}</p>
                                    <p>
                                        Claimed Date:{' '}
                                        {reward.claimedDate instanceof Timestamp
                                            ? reward.claimedDate.toDate().toLocaleDateString() // Convert Timestamp to string
                                            : reward.claimedDate}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p>No rewards found for Showroom Staff.</p>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
};

export default RewardPage;
