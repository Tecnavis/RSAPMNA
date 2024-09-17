import React, { useState } from 'react';
import './reward.css';

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

const RewardPage: React.FC = () => {
  const [user] = useState({
    name: 'John Doe',
    rewardPoints: 2000,
  });

  const [products] = useState<Product[]>([
    { id: 1, image: 'https://via.placeholder.com/150', name: 'Product 1', description: 'Description of product 1', price: 500 },
    { id: 2, image: 'https://via.placeholder.com/150', name: 'Product 2', description: 'Description of product 2', price: 1000 },
    { id: 3, image: 'https://via.placeholder.com/150', name: 'Product 3', description: 'Description of product 3', price: 700 },
  ]);

  const [redemptionHistory] = useState<Redemption[]>([
    { id: 1, product: products[0], redeemedDate: '2023-08-10', status: 'completed' },
    { id: 2, product: products[1], redeemedDate: '2023-09-05', status: 'completed' },
    { id: 3, product: products[2], redeemedDate: '2023-09-15', status: 'upcoming' },
  ]);

  const handleRedeem = (product: Product) => {
    if (user.rewardPoints >= product.price) {
      alert(`Redeemed ${product.name}!`);
    } else {
      alert('Not enough reward points.');
    }
  };

  return (
    <div className="reward-container">
      <header className="user-info">
        <h1>Welcome, {user.name}</h1>
        <h2>Points Available: {user.rewardPoints}</h2>
      </header>

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
                  disabled={user.rewardPoints < product.price}
                >
                  {user.rewardPoints >= product.price ? 'Redeem Now' : 'Insufficient Points'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="history-section">
        <h3>Previous Redemption History</h3>
        <br/>
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
