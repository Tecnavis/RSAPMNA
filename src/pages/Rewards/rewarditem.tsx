import React, { useEffect, useState } from 'react';
import './style.css';
import { collection, addDoc, getDocs, getFirestore, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface RewardItem {
    _id: string;
    name: string;
    description: string;
    points: string;
    price: string;
    category: string;
    percentage: string;
    stock: string;
    image?: string;
}

const CardLayout = () => {
    const db = getFirestore();
    const storage = getStorage();
    const uid = sessionStorage.getItem('uid');
    const [rewards, setRewards] = useState<RewardItem[]>([]);
    console.log(rewards, 'the rewards');
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const [isPopupEdit, setIsPopupEdit] = useState(false);
    const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
    const handleOn = ()=> setIsPopupVisible(true)
    const handleOff = ()=> {
        setIsPopupVisible(false)
        setFormData({
            name: '',
            description: '',
            points: '',
            category: '',
            price: '',
            percentage: '',
            stock: '',
            image: '',
        })
    }

  
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        image: '',
        category:'',
        percentage:'',
        stock:'',
        points:"",
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    
    const handleEditOff = ()=>{
        setFormData({
            name: '',
            description: '',
            price: '',
            category: '',
            percentage: '',
            stock: '',
            points: '',
            image: '',
        })
        setIsPopupEdit(false)
    }
    // Handle the Edit button click
    const handleEdit = (rewardId: any) => {
        const reward = rewards.find((r) => r._id === rewardId);
        if (reward) {
            setFormData({
                name: reward.name,
                description: reward.description,
                price: reward.price,
                category: reward.category,
                percentage: reward.percentage,
                stock: reward.stock,
                points: reward.points,
                image: reward.image || '',
            });
            setSelectedRewardId(rewardId);
            setIsPopupEdit(true);
        }
    };

    // Delete reward
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
            let imageUrl = '';
            if (selectedFile) {
                const storageRef = ref(storage, `reward_images/${selectedFile.name}`);
                await uploadBytes(storageRef, selectedFile);
                // Get the download URL after upload
                imageUrl = await getDownloadURL(storageRef);
            }

            const docRef = await addDoc(collection(db, `user/${uid}/rewarditems`), {
                name: formData.name || '',
                description: formData.description || '',
                price: formData.price || '',
                category: formData.category || '',
                percentage: formData.percentage || '',
                stock: formData.stock || '',
                points: formData.points || '',
                image: imageUrl || '',
            });

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
                points: '',
                percentage: '',
                stock: '',
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

    // Update reward item
    const handleUpdateReward = async () => {
        if (!selectedRewardId) return;

        try {
            let imageUrl = formData.image; // Use the existing image URL if no new file is selected
            if (selectedFile) {
                const storageRef = ref(storage, `reward_images/${selectedFile.name}`);
                await uploadBytes(storageRef, selectedFile);
                imageUrl = await getDownloadURL(storageRef); // Update with the new image URL
            }

            const rewardRef = doc(db, `user/${uid}/rewarditems`, selectedRewardId);
            await updateDoc(rewardRef, {
                name: formData.name,
                description: formData.description,
                price: formData.price,
                image: imageUrl,
                category: formData.category,
                percentage: formData.percentage,
                stock: formData.stock,
                points: formData.points,
            });

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
            <button className="new-reward-btn" onClick={handleOn}>
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
                        <input type="text" name="points" value={formData.points} onChange={handleChange} required placeholder="Points" />
                        <input type='text' name='percentage' value={formData.percentage} onChange={handleChange} required placeholder='%'/>
                        <input type='text' name="stock" value={formData.stock} onChange={handleChange} required placeholder="Stock"/>
                        <div >
                        <select className='select' name="category" value={formData.category} onChange={handleChange}>
                            <option value="">Select Category</option>
                            <option value="Showroom">Showroom</option>
                            <option value="Driver">Driver</option>
                            <option value="Staff">Staff</option>
                            <option value="ShowroomStaff">Showroom Staff</option>
                            <option value="Provider">Provider</option>
                        </select>
                        </div>
                        <input type="file" name="image" onChange={handleFileChange} />
                        <button type="submit">Add Reward</button>
                        <button type="button" onClick={handleOff}>
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
                        <input type="text" name="points" value={formData.points} onChange={handleChange} required placeholder="Points" />
                        <input type='text' name='percentage' value={formData.percentage} onChange={handleChange} required placeholder='%'/>
                        <input type='text' name="stock" value={formData.stock} onChange={handleChange} required placeholder="Stock"/>
                       
                        <select className='select' name="category" value={formData.category} onChange={handleChange}>
                            <option value="">Select Category</option>
                            <option value="Showroom">Showroom</option>
                            <option value="Driver">Driver</option>
                            <option value="Staff">Staff</option>
                            <option value="ShowroomStaff">Showroom Staff</option>
                            <option value="Provider">Provider</option>
                        </select>
                        <input type="file" name="image" onChange={handleFileChange} />
                        <button type="submit">Update Reward</button>
                        <button type="button" onClick={handleEditOff}>
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            <div className="card-container">
                {rewards.map((reward) => (
                    <div key={reward._id} className="card">
                        {reward.image && <img src={reward.image} alt={reward.name} className="card-image" />}
                        <div className="card-content">
                            <h3 className="card-title">{reward.name}</h3>
                            <p className="card-description">{reward.description}</p>
                            <p className="card-description">{reward.points}</p>
                            <div className="card-footer">
                                <span className="card-price">{reward.price} </span>
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
