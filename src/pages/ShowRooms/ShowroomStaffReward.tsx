import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import ProgressBar from '@ramonak/react-progress-bar';
import { NavLink } from 'react-router-dom';

interface RewardItem {
  _id: string;
  name: string;
  description: string;
  points: number;
  price: string;
  category: string;
  stock: number;
  image?: string;
}

const ShowroomStaffReward: React.FC = () => {
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [rewardPoints, setRewardPoints] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const staffId = sessionStorage.getItem('staffId');
  const uid = sessionStorage.getItem('uid');
  const showroomId = sessionStorage.getItem('showroomId');
  const phone = sessionStorage.getItem('phoneNumber'); // Assuming staff's phone number is stored here
console.log("staffId",staffId)
  const db = getFirestore();

  // Fetch rewards for showroom staff from Firestore
  const fetchRewards = async () => {
    try {
      const rewardQuery = query(
        collection(db, `user/${uid}/rewarditems`),
        where('category', '==', 'ShowroomStaff')
      );
      const querySnapshot = await getDocs(rewardQuery);
      const rewardsData: RewardItem[] = querySnapshot.docs.map((doc) => ({
        _id: doc.id,
        ...doc.data(),
      })) as RewardItem[];
      setRewards(rewardsData);
    } catch (error) {
      console.error('Error fetching reward items:', error);
    }
  };

  // Fetch current reward points for the staff from the showroom document

  const fetchStaffRewardPoints = async () => {
    if (!uid || !staffId) {
        console.error('uid or staffId is null');
        return;
      }
    try {
      console.log('Fetching reward points for staffId:', staffId);
      // Directly reference the document using staffId as the document ID
      const staffDocRef = doc(db, `user/${uid}/showroomStaff`, staffId);
      const staffDoc = await getDoc(staffDocRef);
      if (staffDoc.exists()) {
        const staffData = staffDoc.data();
        console.log('staffData:', staffData);
        setRewardPoints(staffData.rewardPoints || 0);
      } else {
        console.log('No staff found with document id:', staffId);
        setRewardPoints(0);
      }
    } catch (error) {
      console.error('Error fetching staff reward points:', error);
    }
  };
  
  useEffect(() => {
    fetchRewards();
    fetchStaffRewardPoints();
    setLoading(false);
  }, [db, uid, showroomId, staffId]);
  

  // Handler to claim reward (update reward points and stock)
  const handleClaimReward = async (item: RewardItem) => {
    try {
      // For this example, we simulate a successful claim:
      console.log('Claiming reward for item:', item.name);
      setSuccessMessage(`Successfully claimed ${item.name}!`);

      // Update local rewards list to reduce stock
      setRewards((prevRewards) =>
        prevRewards.map((reward) =>
          reward._id === item._id ? { ...reward, stock: reward.stock - 1 } : reward
        )
      );
      setRewardPoints((prevPoints) => prevPoints - item.points);
 // Add the claim record to the "claimedStaffReward" collection
 const claimData = {
    itemName: item.name,
    itemPoints: item.points,
    claimedDate: Timestamp.now(),
    description: item.description,
    category: item.category,
    price: item.price,
    itemImage: item.image || '',
    staffId: staffId,  // track which staff claimed it
    // Add other fields as needed
  };

  await addDoc(collection(db, `user/${uid}/claimedStaffReward`), claimData);

      // Clear the success message after 2 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Error claiming reward:', error);
      setError('Failed to claim reward. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 mt-24">
         {/* Navbar */}
                         <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-gray-900 to-black text-white shadow-lg py-5 z-50">
                 <div className="max-w-6xl mx-auto flex justify-between items-center px-6">
                     <div className="text-2xl font-bold tracking-wide uppercase">
                         Showroom Dashboard
                     </div>
                     <ul className="flex space-x-8 text-lg font-medium">
                         <li>
                             <NavLink 
                                 to="https://rsapmna-de966.web.app/showrooms/showroom/showroomDetails"
                                 className={({ isActive }) => `relative pb-2 transition-all duration-300 ${isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}`}
                             >
                                 Home
                             </NavLink>
                         </li>
                         <li>
                             <NavLink 
                                 to="/showroomstaffdashboard"
                                 state={{ showroomId, staffId }}
                                 className={({ isActive }) => `relative pb-2 transition-all duration-300 ${isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}`}
                             >
                                 Dashboard
                             </NavLink>
                         </li>
                         <li>
                             <NavLink 
                                 to="/showroomstaffprofile"
                                 className={({ isActive }) => `relative pb-2 transition-all duration-300 ${isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}`}
                             >
                                 Profile
                             </NavLink>
                         </li>
                         <li>
                             <NavLink 
                                 to="/addbook"
                                 className={({ isActive }) => `relative pb-2 transition-all duration-300 ${isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}`}
                             >
                                 Add Book
                             </NavLink>
                         </li>
                         <li>
                             <NavLink 
                                 to="/showroomstaffreward"
                                 className={({ isActive }) => `relative pb-2 transition-all duration-300 ${isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}`}
                             >
                                 Reward
                             </NavLink>
                         </li>
                     </ul>
                 </div>
             </nav>
      <h1 className="text-3xl font-bold text-center mb-6">Available Rewards</h1>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center mb-4">
          <span className="bg-green-500 text-white px-4 py-2 rounded-full font-semibold">
            Current Points: {rewardPoints}
          </span>
        </div>
        {successMessage && (
          <div className="text-center text-green-600 font-bold mb-4">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="text-center text-red-600 font-bold mb-4">{error}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rewards.map((item, index) => {
            // Calculate the progress percentage based on reward points
            const completionPercentage = Math.min(
              ((rewardPoints || 0) / item.points) * 100,
              100
            );
            return (
              <div key={index} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{item.name}</h2>
                    <p className="text-gray-700">Price: ₹{item.price}</p>
                    <p className="text-gray-500">Target Points: {item.points}</p>
                    <p className="text-gray-500">Stock: {item.stock}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <ProgressBar
                    completed={completionPercentage}
                    bgColor="#4ade80"
                    height="10px"
                    borderRadius="5px"
                  />
                </div>
                <div className="mt-4">
                  {completionPercentage === 100 && item.stock > 0 ? (
                    <button
                      onClick={() => handleClaimReward(item)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
                    >
                      Claim Reward
                    </button>
                  ) : item.stock === 0 ? (
                    <p className="text-red-600 font-bold text-center">Out of Stock</p>
                  ) : (
                    <p className="text-center font-bold text-gray-700">
                      Keep earning points to claim this reward!
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ShowroomStaffReward;
