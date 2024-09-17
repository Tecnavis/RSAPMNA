import React, { useState } from 'react';
import './style.css'; // Add custom styles here

// Define a type for client categories
type ClientCategory = 'Driver' | 'Staff' | 'User';

// Interface for client reward props
interface ClientRewardProps {
  category: ClientCategory;
  rewardPoints: number;
}

// Interface for individual rewards (can be used for drivers, staff, users)
interface ClientRewardDetails {
  name: string;
  rewardPoints: number;
}

// Example data for clients
const clientsData: ClientRewardProps[] = [
  { category: 'Driver', rewardPoints: 150 },
  { category: 'Staff', rewardPoints: 200 },
  { category: 'User', rewardPoints: 100 }
];

// Example data for Driver, Staff, and User rewards
const driverRewards: ClientRewardDetails[] = [
  { name: 'John Doe', rewardPoints: 150 },
  { name: 'Jane Smith', rewardPoints: 120 },
  { name: 'Alex Johnson', rewardPoints: 180 }
];

const staffRewards: ClientRewardDetails[] = [
  { name: 'Emma Brown', rewardPoints: 220 },
  { name: 'Olivia Davis', rewardPoints: 180 },
  { name: 'Noah Wilson', rewardPoints: 200 }
];

const userRewards: ClientRewardDetails[] = [
  { name: 'Liam Miller', rewardPoints: 80 },
  { name: 'Sophia Garcia', rewardPoints: 100 },
  { name: 'Mason Martinez', rewardPoints: 90 }
];

const ClientRewards: React.FC = () => {
  const [visibleCategory, setVisibleCategory] = useState<ClientCategory | null>(null);

  // Function to handle viewing rewards based on the selected category
  const handleViewRewards = (category: ClientCategory) => {
    setVisibleCategory(visibleCategory === category ? null : category); // Toggle the view
  };

  // Function to get the rewards based on the category or show all if none is selected
  const getRewardsList = (): { category: ClientCategory, rewards: ClientRewardDetails[] }[] => {
    if (!visibleCategory) {
      return [
        { category: 'Driver', rewards: driverRewards },
        { category: 'Staff', rewards: staffRewards },
        { category: 'User', rewards: userRewards }
      ];
    } else {
      return [{ category: visibleCategory, rewards: getCategoryRewards(visibleCategory) }];
    }
  };

  // Helper function to get rewards for a specific category
  const getCategoryRewards = (category: ClientCategory): ClientRewardDetails[] => {
    switch (category) {
      case 'Driver':
        return driverRewards;
      case 'Staff':
        return staffRewards;
      case 'User':
        return userRewards;
      default:
        return [];
    }
  };

  return (
    <div className="client-rewards-container">
      <h1>CLIENT REWARDS </h1><br/>
      <div className="cards-container">
        {clientsData.map((client, index) => (
          <div key={index} className={`client-card ${client.category.toLowerCase()}`}>
            <h2>{client.category}</h2>
            <p>Reward Points: {client.rewardPoints}</p>
            <button onClick={() => handleViewRewards(client.category)} className="reward-btn">
              {visibleCategory === client.category ? 'Hide Rewards' : 'View Rewards'}
            </button>
          </div>
        ))}
      </div>

      {/* Display rewards for the selected category or all categories if none is selected */}
      <div className="rewards-list">
        {getRewardsList().map(({ category, rewards }) => (
          <div key={category}>
            <h3>{category} Rewards</h3>
            <ul>
              {rewards.map((client, index) => (
               <li key={index} className="reward-item">
               <span className="reward-name">{client.name}</span>
               <span className="reward-points">{client.rewardPoints} points</span>
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
