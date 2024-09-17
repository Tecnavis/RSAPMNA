import React, { useEffect, useState } from 'react';
import './style.css';
import { collection, addDoc, getDocs, getFirestore, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';

interface RewardItem {
    _id: string;
    name: string;
    description: string;
    price: string;
    category: string;
    image?: string;
}

const CardLayout = () => {
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid');
    const [rewards, setRewards] = useState<RewardItem[]>([]);
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const [isPopupEdit, setIsPopupEdit] = useState(false);
    const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        image: '',
        category:'',
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Handle the Edit button click
    const handleEdit = (rewardId: string) => {
        const reward = rewards.find((r) => r._id === rewardId);
        if (reward) {
            setFormData({
                name: reward.name,
                description: reward.description,
                price: reward.price,
                category: reward.category,
                image: reward.image || '',
            });
            setSelectedRewardId(rewardId);
            setIsPopupEdit(true);
        }
    };
    //delete rewards
    const handleDelete = async (rewardId: string) => {
        if (!uid) {
            Swal.fire({
                title: 'Error',
                text: 'User ID not found.',
                icon: 'error',
                confirmButtonText: 'OK',
            });
            return;
        }
        try {
            const rewardRef = doc(db, `user/${uid}/rewarditems`, rewardId);
            await deleteDoc(rewardRef);
            setRewards((prevItems) => prevItems.filter((item) => item._id !== rewardId));
            Swal.fire({
                title: 'Success',
                text: 'Reward deleted successfully!',
                icon: 'success',
                confirmButtonText: 'OK',
            });
        } catch (error) {
            console.error('Error deleting document: ', error);
        }
    };

    // Create new reward item
    const handleNewReward = async () => {
        try {
            const docRef = await addDoc(collection(db, `user/${uid}/rewarditems`), formData);
            Swal.fire({
                title: 'Success',
                text: 'Reward added successfully!',
                icon: 'success',
                confirmButtonText: 'OK',
            });
            setIsPopupVisible(false);
            setFormData({
                name: '',
                description: '',
                price: '',
                category: '',
                image: '',
            });
            fetchData();
        } catch (e) {
            console.error('Error adding new reward: ', e);
            Swal.fire({
                title: 'Error',
                text: 'Failed to add reward. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK',
            });
        }
    };

    const handleUpdateReward = async () => {
        if (!selectedRewardId) return;

        try {
            const rewardRef = doc(db, `user/${uid}/rewarditems`, selectedRewardId);
            await updateDoc(rewardRef, formData);
            Swal.fire({
                title: 'Success',
                text: 'Reward updated successfully!',
                icon: 'success',
                confirmButtonText: 'OK',
            });
            setIsPopupEdit(false);
            fetchData();
        } catch (e) {
            console.error('Error updating reward: ', e);
            Swal.fire({
                title: 'Error',
                text: 'Failed to update reward. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK',
            });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };
    

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);
    };

    // Fetch reward items
    const fetchData = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, `user/${uid}/rewarditems`));
            const rewardsData: RewardItem[] = querySnapshot.docs.map((doc) => ({
                _id: doc.id,
                ...doc.data(),
            })) as RewardItem[];
            setRewards(rewardsData);
        } catch (error) {
            console.error('Error fetching reward items:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="card-layout">
            <button className="new-reward-btn" onClick={() => setIsPopupVisible(true)}>
                New Reward
            </button>

            {isPopupVisible && (
                <div className="popup-form">
                    <h2>Create New Reward</h2>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleNewReward();
                        }}
                    >
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Reward Name" />
                        <textarea name="description" value={formData.description} onChange={handleChange} required placeholder="Description" />
                        <input type="text" name="price" value={formData.price} onChange={handleChange} required placeholder="Price" />
                        <div >
                        <select className='select' name="category" value={formData.category} onChange={handleChange}>
                            <option value="">Select Category</option>
                            <option value="Showroom">Showroom</option>
                            <option value="Driver">Driver</option>
                            <option value="Staff">Staff</option>
                            <option value="Customer">Customer</option>
                        </select>
                        </div>
                        <input type="file" name="image" onChange={handleFileChange} />
                        <button type="submit">Add Reward</button>
                        <button type="button" onClick={() => setIsPopupVisible(false)}>
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            {isPopupEdit && (
                <div className="popup-form">
                    <h2>Edit Reward</h2>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleUpdateReward();
                        }}
                    >
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Reward Name" />
                        <textarea name="description" value={formData.description} onChange={handleChange} required placeholder="Description" />
                        <input type="text" name="price" value={formData.price} onChange={handleChange} required placeholder="Price" />
                        <select className='select' name="category" value={formData.category} onChange={handleChange} >
                            <option value="">Select Category</option>
                            <option value="Showroom">Showroom</option>
                            <option value="Driver">Driver</option>
                            <option value="Staff">Staff</option>
                            <option value="Customer">Customer</option>
                        </select>
                        <input type="file" name="image" onChange={handleFileChange} />
                        <button type="submit">Update Reward</button>
                        <button type="button" onClick={() => setIsPopupEdit(false)}>
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            <div className="card-container">
                {rewards.map((reward) => (
                    <div key={reward._id} className="card">
                        <img src={reward.image} alt={reward.name} className="card-image" />
                        <div className="card-content">
                            <h3 className="card-title">{reward.name}</h3>
                            <p className="card-description">{reward.description}</p>
                            <p className="card-description">{reward.category}</p>
                            <div className="card-footer">
                                <span className="card-price">{reward.price}</span>
                                <div className="card-actions">
                                    <button className="edit-btn" onClick={() => handleEdit(reward._id)}>
                                        Edit
                                    </button>
                                    <button className="delete-btn" onClick={() => handleDelete(reward._id)}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CardLayout;
