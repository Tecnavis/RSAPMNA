import React, { useState, useEffect } from 'react';
import './reward.css';
import { collection, query, where, getDocs, getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';

// Interfaces
interface Product {
  id: number;
  image: string;
  name: string;
  description: string;
  price: number;
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
  const [percentage, setPercentage] = useState<number>(0);
  const [rewardPoints, setRewardPoints] = useState<number>(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const db = getFirestore();
  const uid = sessionStorage.getItem('uid');

  // Sample products for redemption
  const [products] = useState<Product[]>([
    { id: 1, image: 'https://via.placeholder.com/150', name: 'Product 1', description: 'Description of product 1', price: 500 },
    { id: 2, image: 'https://via.placeholder.com/150', name: 'Product 2', description: 'Description of product 2', price: 1000 },
    { id: 3, image: 'https://via.placeholder.com/150', name: 'Product 3', description: 'Description of product 3', price: 700 },
  ]);

  // Sample redemption history
  const [redemptionHistory] = useState<Redemption[]>([
    { id: 1, product: products[0], redeemedDate: '2023-08-10', status: 'completed' },
    { id: 2, product: products[1], redeemedDate: '2023-09-05', status: 'completed' },
    { id: 3, product: products[2], redeemedDate: '2023-09-15', status: 'upcoming' },
  ]);

  // Fetch driver data
  useEffect(() => {
    const driverRef = doc(db, `user/${uid}/driver`, id || "");
    
    const unsubscribe = onSnapshot(driverRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const driverData = docSnapshot.data();
        const fetchedPercentage = driverData?.percentage || 0;
        const fetchedRewardPoints = driverData?.rewardPoints || 0;
        setPercentage(fetchedPercentage);
        setRewardPoints(fetchedRewardPoints);
        console.log(`Updated percentage: ${fetchedPercentage}, rewardPoints: ${fetchedRewardPoints}`);
      }
    });

    return () => unsubscribe(); // Clean up the snapshot listener
  }, [id, db, uid]);

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const bookingsRef = collection(db, `user/${uid}/bookings`);
        const q = query(bookingsRef, where('selectedDriver', '==', id), where('status', '==', 'Order Completed'));
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

  const calculateRewardPoints = async (fetchedBookings: Booking[]) => {
    console.log(`Calculating reward points with percentage: ${percentage}`);
    const totalRewardPoints = fetchedBookings.reduce((total, booking) => {
      const points = (booking.updatedTotalSalary * (percentage / 100)) || 0;
      console.log(`Booking ID: ${booking.id}, Updated Total Salary: ${booking.updatedTotalSalary}, Points: ${points}`);
      return total + points;
    }, 0);

    console.log(`Total Reward Points Calculated: ${totalRewardPoints}`);
    const updatedPoints = parseFloat(totalRewardPoints.toFixed(2));
    setRewardPoints(updatedPoints);

    // Update Firestore with new reward points
    await updateDoc(doc(db, `user/${uid}/driver`, id), { rewardPoints: updatedPoints });
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
      <header className="user-info">
        <h1>Welcome, {driverName}</h1>
        <h2>Points Available: {rewardPoints.toFixed(2)}</h2> {/* Display formatted points */}
      </header>

      <section className="percentage-section">
        <h3>Percentage for Reward Points Calculation</h3>
        <input
          type="number"
          value={percentage}
          readOnly // Make the input field read-only
        />
      </section>

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

      <section className="bookings-section">
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
      </section>
    </div>
  );
};

export default RewardPage;
