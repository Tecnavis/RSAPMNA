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
  const [rewardPoints, setRewardPoints] = useState<number>(0);
  const [rewardDriverPoints, setRewardDriverPoints] = useState<number>(0);
  const [rewardStaffPoints, setRewardStaffPoints] = useState<number>(0);
  const [rewardShowroomPoints, setRewardShowroomPoints] = useState<number>(0);
  const [rewardShowroomStaffPoints, setRewardShowroomStaffPoints] = useState<number>(0);
    const [bookings, setBookings] = useState<Booking[]>([]);
  const db = getFirestore();
  const uid = sessionStorage.getItem('uid');
  console.log("phoneNumber",phoneNumber)
  // Sample products for redemption
  const [products] = useState<Product[]>([
    { id: 1, image: 'https://via.placeholder.com/150', name: 'Product 1', description: 'Description of product 1', price: 500, category: 'Electronics' },
    { id: 2, image: 'https://via.placeholder.com/150', name: 'Product 2', description: 'Description of product 2', price: 1000, category: 'Home Goods' },
    { id: 3, image: 'https://via.placeholder.com/150', name: 'Product 3', description: 'Description of product 3', price: 700, category: 'Toys' },
  ]);

  // Sample redemption history
  const [redemptionHistory] = useState<Redemption[]>([
    { id: 1, product: products[0], redeemedDate: '2023-08-10', status: 'completed' },
    { id: 2, product: products[1], redeemedDate: '2023-09-05', status: 'completed' },
    { id: 3, product: products[2], redeemedDate: '2023-09-15', status: 'upcoming' },
  ]);

// ---------------ShowRoom---------------------------------------------------------------------
  useEffect(() => {
    const driverRef = doc(db, `user/${uid}/showroom`, id || "");
    
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
  const fetchBookings = async () => {
    try {
      const bookingsRef = collection(db, `user/${uid}/bookings`);
      const q = query(
        bookingsRef,
        where('showroomId', '==', id), 
        where('createdBy', '==', 'showroom'), 
        where('status', '==', 'Order Completed'),


      );

      const querySnapshot = await getDocs(q);
      const fetchedBookings: Booking[] = [];
console.log("fetchedBookings",fetchedBookings)
      querySnapshot.forEach((doc) => {
        fetchedBookings.push({ id: doc.id, ...doc.data() } as Booking);
      });

      setBookings(fetchedBookings);
      if (category === 'Showroom') {
        await updateRewardPoints(fetchedBookings.length);
      }

    } catch (error) {
      console.error("Error fetching bookings: ", error);
    }
  };

  fetchBookings();
}, [id, db, uid, category]);
const updateRewardPoints = async (bookingCount: number) => {
  if (bookingCount > 0) {
    const additionalPoints = bookingCount * 300; // Calculate total additional points
    try {
      const userRef = doc(db, `user/${uid}/showroom`, id || "");
      await updateDoc(userRef, {
        rewardPoints: additionalPoints // Use increment to update points
      });
      console.log(`Updated reward points by ${additionalPoints}`);
    } catch (error) {
      console.error("Error updating reward points in Firestore:", error);
    }
  }
};

// ---------------ShowRoomStaff---------------------------------------------------------------------
useEffect(() => {
  const driverRef = doc(db, `user/${uid}/showroom`, id || "");
  
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

      // Firestore query for showroom staff bookings with status 'Order Completed'
      const q = query(
        bookingsRef,
        where('showroomId', '==', id), 
        where('createdBy', '==', 'showroomStaff'), 
        where('phone', '==', phoneNumber),
        where('status', '==', 'Order Completed')
      );

      const querySnapshot = await getDocs(q);
      const fetchedBookings: Booking[] = [];

console.log("fetchedBookings",fetchedBookings)  
    querySnapshot.forEach((doc) => {
        fetchedBookings.push({ id: doc.id, ...doc.data() } as Booking);
      });

      // Update state with fetched bookings
      setBookings(fetchedBookings);
      
      if (category === 'ShowroomStaff') {
        await updateShowroomStaffRewardPoints(fetchedBookings.length);
      }
      

    } catch (error) {
      console.error("Error fetching showroom staff bookings: ", error);
    }
  };

  // Trigger fetch when component mounts or relevant state changes
  fetchShowroomStaffBookings();
}, [id, db, uid, phoneNumber, category]);


const updateShowroomStaffRewardPoints = async (bookingCount: number, phoneNumber: string) => {
  if (bookingCount > 0) {
    const additionalPoints = bookingCount * 200; // Calculate total additional points
    try {
      const userRef = doc(db, `user/${uid}/showroom`, id || "");
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const staff = data.staff || [];

        // Check if staff is an array
        if (!Array.isArray(staff)) {
          console.error("Staff data is not an array");
          return;
        }

        // Log the staff array and phone number
        console.log("Staff array:", staff);
        console.log("Phone number passed:", phoneNumber);

        // Find the staff member with the matching phone number
        const staffIndex = staff.findIndex((member: any) => member.phone === phoneNumber);
        if (staffIndex !== -1) {
          const currentPoints = staff[staffIndex].rewardPoints || 0;
          staff[staffIndex].rewardPoints = currentPoints + additionalPoints;

          await updateDoc(userRef, { staff });
          console.log(`Updated reward points by ${additionalPoints} for staff member with phone number ${phoneNumber}`);
        } else {
          console.error("Staff member with the provided phone number not found");
        }
      } else {
        console.error("Showroom document does not exist");
      }
    } catch (error) {
      console.error("Error updating reward points in Firestore:", error);
    }
  }
};

// ----------------------------------------Staff-------------------------------------------------------
useEffect(() => {
  const userRef = doc(db, `user/${uid}/users`, id || "");
  
  const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const userData = docSnapshot.data();
      console.log("userData",userData)
      if (userData) {
        const fetchedUserPercentage = userData?.percentage || 0;
        const fetchedRewardPoints = userData?.rewardPoints || 0;
        setPercentage(fetchedUserPercentage);
        setRewardStaffPoints(fetchedRewardPoints);
        console.log(`Fetched percentage: ${fetchedUserPercentage}, rewardPoints: ${fetchedRewardPoints}`);
      } else {
        console.error("No user data found");
      }
    } else {
      console.error("Document does not exist");
    }
  }, (error) => {
    console.error("Error fetching user data:", error);
  });

  return () => unsubscribe(); // Clean up the snapshot listener
}, [id, db, uid]);

useEffect(() => {
  const fetchBookings = async () => {
    try {
      const bookingsRef = collection(db, `user/${uid}/bookings`);  // Fetch from 'users' collection
      const q = query(
        bookingsRef,
        where('newStatus', '==', 'Added by staff'), // First condition
        where('status', '==', 'Order Completed')   // Second condition
      );
      const querySnapshot = await getDocs(q);
      const fetchedBookings: Booking[] = [];

      querySnapshot.forEach((doc) => {
        fetchedBookings.push({ id: doc.id, ...doc.data() } as Booking);
      });

      setBookings(fetchedBookings);
      calculateRewardPoints(fetchedBookings); // Calculate points after bookings are fetched
    } catch (error) {
      console.error("Error fetching bookings: ", error);
    }
  };

  fetchBookings();
}, [id, db, uid]);
// --------------------------------Driver-----------------------------------------------------------------
useEffect(() => {
  // Fetch driver data based on id
  const fetchDriverData = async () => {
    if (!uid || !id) {
      console.error("Missing UID or driver ID.");
      return;
    }

    try {
      // Get the document reference for the specific driver
      const driverRef = doc(db, `user/${uid}/driver`, id);

      // Fetch the driver's data
      const docSnapshot = await getDoc(driverRef);

      if (docSnapshot.exists()) {
        const driverData = docSnapshot.data();
        const fetchedRewardPoints = driverData?.rewardPoints || 0;  // Fetch rewardPoints
        setRewardDriverPoints(fetchedRewardPoints);
        console.log(`Fetched rewardPoints: ${fetchedRewardPoints}`);
      } else {
        console.error("No such document!");
      }
    } catch (error) {
      console.error("Error fetching driver data:", error);
    }
  };

  fetchDriverData();
}, [id, db, uid]);

// ----------------------------------------------------------------------------------------------------------

// Calculate reward points
  const calculateRewardPoints = async (fetchedBookings: Booking[]) => {
    console.log("Starting reward points calculation...");
    console.log(`Number of fetched bookings: ${fetchedBookings.length}`);
    console.log(`Reward percentage for calculation: ${percentage}`);

    const totalRewardPoints = fetchedBookings.reduce((total, booking, index) => {
      const points = (booking.updatedTotalSalary * (percentage / 100)) || 0;
      
      console.log(`\n[Booking ${index + 1}]`);
      console.log(`Booking ID: ${booking.id}`);
      console.log(`Updated Total Salary: ${booking.updatedTotalSalary}`);
      console.log(`Calculated Points for this booking: ${points}`);
      
      return total + points;
    }, 0);
    
    const updatedPoints = parseFloat(totalRewardPoints.toFixed(2));
    console.log("\nTotal reward points calculated from all bookings:", updatedPoints);

    setRewardPoints(updatedPoints);
    console.log(`Updated state with new reward points: ${updatedPoints}`);

    // Ensure both uid and id are valid before updating Firestore
    if (!uid || !id) {
      console.error('UID or Showroom/Staff ID is missing. Cannot update Firestore.');
      return;
    }

    try {
      console.log('Updating reward points in Firestore...');
      
     if (category === 'Staff') {
        await updateDoc(doc(db, `user/${uid}/users`, id), { rewardPoints: updatedPoints });
        console.log('Reward points updated successfully for Staff.');
      } else {
        console.log('Category is neither Showroom nor Staff, skipping Firestore update.');
      }
    } catch (error) {
      console.error('Error updating reward points in Firestore:', error);
    }
  };
  
// Recalculate points when either percentage or bookings change
useEffect(() => {
    if (bookings.length > 0) {
      calculateRewardPoints(bookings);
    }
}, [percentage, bookings]);

  const handleRedeem = (product: Product) => {
    if (rewardPoints >= product.price) {
      alert(`Redeemed ${product.name}!`);
    } else {
      alert('Not enough reward points.');
    }
  };

  return (
    <div className="reward-container">
      
      {
  category == 'Showroom' && (
      <header className="user-info">
        <h1>Welcome, {driverName}</h1>
        <h2>Points Available: {rewardShowroomPoints}</h2>
      </header>
      )}
        {
  category == 'ShowroomStaff' && (
      <header className="user-info">
        <h1>Welcome, {driverName}</h1>
        <h2>Points Available: {rewardShowroomStaffPoints}</h2>
      </header>
      )}
      
       {
  category == 'Driver' && (
      <header className="user-info">
        <h1>Welcome, {driverName}</h1>
        <h2>Points Available: {rewardDriverPoints}</h2>
      </header>
      )}
      {
  category == 'Staff' && (
      <header className="user-info">
        <h1>Welcome, {driverName}</h1>
        <h2>Points Available: {rewardStaffPoints}</h2>
      </header>
  )}
      {
  category == 'Staff' && (
    <section className="percentage-section">
      <h3>Percentage for Reward Points Calculation</h3>
      <input
        type="number"
        value={percentage}
        readOnly // Make the input field read-only
      />
    </section>
  )
}


      <section className="products-section">
        <h3>Redeemable Products</h3>
        <div className="product-list">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <img src={product.image} alt={product.name} className="product-image" />
              <div className="product-details">
                <h4>{product.name}</h4>
                <p>{product.description}</p>
                <p className="product-price">{product.price} points</p>
                <button
                  className="redeem-btn"
                  onClick={() => handleRedeem(product)}
                  disabled={rewardPoints < product.price}
                >
                  {rewardPoints >= product.price ? 'Redeem Now' : 'Insufficient Points'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="history-section">
        <h3>Previous Redemption History</h3>
        <div className="history-categories">
          <div className="history-category">
            {redemptionHistory.filter((r) => r.status === 'completed').length === 0 ? (
              <p>No previous redemptions</p>
            ) : (
              <div className="history-list">
                {redemptionHistory
                  .filter((r) => r.status === 'completed')
                  .map((redemption) => (
                    <div key={redemption.id} className="history-card">
                      <img src={redemption.product.image} alt={redemption.product.name} className="history-product-image" />
                      <div className="history-details">
                        <h4>{redemption.product.name}</h4>
                        <p>{redemption.product.description}</p>
                        <p className="history-redeemed-date">Redeemed on: {redemption.redeemedDate}</p>
                        <p className="history-redeemed-date">Redeemed points: 300</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </section>
 
    </div>
  );
};

export default RewardPage;
