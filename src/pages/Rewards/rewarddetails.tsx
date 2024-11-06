import React, { useState, useEffect } from 'react';
import './reward.css';
import { collection, query, where, getDocs, getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, increment } from 'firebase/firestore';

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
    price: string;
    category: string;
    percentage: string;
    stock: string;
    image?: string;
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

interface Driver {
    percentage: number;
    rewardPoints: number;
    // other fields if necessary
}

const RewardPage: React.FC = () => {
    const queryParams = new URLSearchParams(window.location.search);
    const id = queryParams.get('id'); // Driver ID
    const driverName = queryParams.get('name'); // Driver Name
    const category = queryParams.get('category'); // Driver Name
    const phoneNumber = queryParams.get('phoneNumber'); // Driver Name
    const [percentage, setPercentage] = useState<number>(0);
    // const [rewardPoints, setRewardPoints] = useState<number>(0);
    const [rewards, setRewards] = useState<RewardItem[]>([]);
    const [rewardDriverPoints, setRewardDriverPoints] = useState<number>(0);
    const [rewardStaffPoints, setRewardStaffPoints] = useState<number>(0);
    const [rewardShowroomPoints, setRewardShowroomPoints] = useState<number>(0);
    const [rewardShowroomStaffPoints, setRewardShowroomStaffPoints] = useState<number>(0);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid');
    console.log('id', id);
    // Sample products for redemption
    const [products] = useState<Product[]>([
        { id: 1, image: 'https://via.placeholder.com/150', name: 'Product 1', description: 'Description of product 1', price: 500, category: 'Electronics' },
        { id: 2, image: 'https://via.placeholder.com/150', name: 'Product 2', description: 'Description of product 2', price: 1000, category: 'Home Goods' },
        { id: 3, image: 'https://via.placeholder.com/150', name: 'Product 3', description: 'Description of product 3', price: 700, category: 'Toys' },
    ]);
// 
    const [redemptionHistory, setRedemptionHistory] = useState<RewardItem[]>([]);
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
    const fetchData = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, `user/${uid}/rewarditems`));
            const rewardsData: RewardItem[] = querySnapshot.docs
                .map((doc) => {
                    const data = doc.data() as RewardItem; // Cast data to RewardItem type
                    return {
                        ...data,
                        _id: doc.id, // Explicitly set _id to avoid duplication
                    };
                })
                .filter((item) => !category || item.category === category);

            setRewards(rewardsData);
        } catch (error) {
            console.error('Error fetching reward items:', error);
        }
    };
    console.log(rewards, 'this is the rewards');

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
                const bookingsRef = collection(db, `user/${uid}/bookings`);
                const q = query(bookingsRef, where('showroomId', '==', id), where('bookingStatus', '==', 'ShowRoom Booking'), where('status', '==', 'Order Completed'));
                const querySnapshot = await getDocs(q);
                const fetchedBookings: Booking[] = [];
                console.log('fetchedBookingggs', fetchedBookings);
                querySnapshot.forEach((doc) => {
                    fetchedBookings.push({ id: doc.id, ...doc.data() } as Booking);
                });

                setBookings(fetchedBookings);
                if (category === 'Showroom') {
                    await updateRewardPoints(fetchedBookings.length);
                }
            } catch (error) {
                console.error('Error fetching bookings: ', error);
            }
        };
        fetchData();
        fetchBookings();
    }, [id, db, uid, category]);
    const updateRewardPoints = async (bookingCount: number) => {
        if (bookingCount > 0) {
            const additionalPoints = bookingCount * 300; // Calculate total additional points
            try {
                const userRef = doc(db, `user/${uid}/showroom`, id || '');
                await updateDoc(userRef, {
                    rewardPoints: additionalPoints, // Use increment to update points
                });
                console.log(`Updated reward points by ${additionalPoints}`);
            } catch (error) {
                console.error('Error updating reward points in Firestore:', error);
            }
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
    // Fetch bookings
    useEffect(() => {
        const fetchShowroomStaffBookings = async () => {
            try {
                // Firestore reference to 'bookings'
                const bookingsRef = collection(db, `user/${uid}/bookings`);
                const q = query(bookingsRef, where('showroomId', '==', id), where('createdBy', '==', 'showroomStaff'), where('phone', '==', phoneNumber), where('status', '==', 'Order Completed'));
     const querySnapshot = await getDocs(q);
                const fetchedBookings: Booking[] = [];

                console.log('fetchedBookingssss', fetchedBookings);
                querySnapshot.forEach((doc) => {
                    fetchedBookings.push({ id: doc.id, ...doc.data() } as Booking);
                });
                setBookings(fetchedBookings);

                if (category === 'ShowroomStaff') {
                    // Provide both arguments: fetchedBookings.length and phoneNumber
                    await updateShowroomStaffRewardPoints(fetchedBookings.length, phoneNumber);
                }
            } catch (error) {
                console.error('Error fetching showroom staff bookings: ', error);
            }
        };
        fetchShowroomStaffBookings();
    }, [id, db, uid, phoneNumber, category]);

    const updateShowroomStaffRewardPoints = async (bookingCount: any, phoneNumber: any) => {
      if (bookingCount > 0) {
          const additionalPoints = bookingCount * 200;
          try {
              const userRef = doc(db, `user/${uid}/showroom`, id || '');
              const userSnap = await getDoc(userRef);
  
              if (userSnap.exists()) {
                  const data = userSnap.data();
                  const staff = data.staff || [];
  
                  if (!Array.isArray(staff)) {
                      console.error('Staff data is not an array');
                      return;
                  }
  
                  console.log('Full staff array:', JSON.stringify(staff, null, 2));
                  console.log('Phone number passed:', phoneNumber);
  
                  const staffIndex = staff.findIndex((member) => {
                      console.log(`Checking member:`, member);  
                      return member.phoneNumber === phoneNumber;
                  });
  
                  if (staffIndex !== -1) {
                      console.log(`Staff member found at index: ${staffIndex}`);
                      const currentPoints = staff[staffIndex].rewardPoints || 0;
                      const updatedPoints = currentPoints + additionalPoints;
  
                      // Update points in the staff array and in the state
                      staff[staffIndex].rewardPoints = updatedPoints;
                      setRewardShowroomStaffPoints(updatedPoints);  // Set the state with the updated points
  
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
                <div className="product-list">
                    {rewards.map((reward) => (
                        <div key={reward._id} className="product-card">
                            <img src={reward.image} alt={reward.name} className="product-image" />
                            <div className="product-details">
                                <h4>{reward.name}</h4>
                                <p>{reward.description}</p>
                                <p className="product-price">{reward.price} points</p>
                                <button
                                    className="redeem-btn"
                                >
                                    redeem Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            <section className="history-section bg-gray-50 p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold text-gray-700 mb-4">Previous Redemption History</h3>
                <div className="history-categories">
                    {redemptionHistory.length === 0 ? (
                        <p className="text-center text-gray-500">No previous redemptions</p>
                    ) : (
                        <div className="history-list grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {redemptionHistory.map((item) => (
                                <div key={item.docId} className="history-item flex flex-col items-center bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                                    <img src={item.image} alt={item.name} className="history-item-image w-full h-40 object-cover rounded-md mb-4" />
                                    <div className="history-item-details text-center">
                                        <h4 className="text-lg font-medium text-gray-800 mb-2">{item.name}</h4>
                                        <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                                        <p className="text-sm text-gray-600">
                                            Points: <span className="font-semibold text-gray-700">{item.points}</span>
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Price: <span className="font-semibold text-gray-700">{item.price}</span>
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Stock: <span className="font-semibold text-gray-700">{item.stock}</span>
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Category: <span className="font-semibold text-gray-700">{item.category}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default RewardPage;
{
    /* <section className="bookings-section">
        <h3>Your Bookings</h3>
        {bookings.length === 0 ? (
          <p>No bookings found.</p>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div key={booking.id} className="booking-card">
                <h4>Booking ID: {booking.id}</h4>
                <p>Selected Driver: {booking.selectedDriver}</p>
                <p>Company: {booking.company}</p>
                <p>Updated Total Salary: {booking.updatedTotalSalary}</p>
              </div>
            ))}
          </div>
        )}
      </section> */
}
