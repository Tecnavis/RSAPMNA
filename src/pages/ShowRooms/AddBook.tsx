import React, { useEffect, useState, ChangeEvent } from 'react';
import { addDoc, collection, doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp from Firebase
import { query, where, getDocs } from 'firebase/firestore';
import { Button } from '@mui/material';
import ProgressBar from '@ramonak/react-progress-bar';

interface FormData {
    fileNumber: string;
    customerName: string;
    phoneNumber: string;
    vehicleSection: string;
    vehicleNumber: string;
    comments: string;
}

interface RewardItem {
    _id: string;
    name: string;
    description: string;
    points: number;
    price: string;
    category: string;
    percentage: string;
    stock: number;
    image?: string;
}

interface ShowroomData {
    showroomId?: string;
    id:string;
}

const AddBook: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        fileNumber: '',
        customerName: '',
        phoneNumber: '',
        vehicleSection: '',
        vehicleNumber: '',
        comments: '',
    });

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [rewards, setRewards] = useState<RewardItem[]>([]);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const db = getFirestore();
    const navigate = useNavigate();
    const location = useLocation();
    const showroomId = location.state?.showroomId ?? '';
    const uid = location.state?.uid ?? '';
    console.log("showroomId", showroomId);
    const name = location.state?.name ?? ''; // Extracted name
    const phone = location.state?.phoneNumber ?? ''; // Extracted phoneNumber
    console.log("name", name);
    console.log("phone", phone);

    const [bookingId, setBookingId] = useState<string>('');
    const [showroomData, setShowroomData] = useState<ShowroomData | null>(null);
    const [showroomDocId, setShowroomDocId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [rewardPoints, setRewardPoints] = useState<number | null>(null);
    const [showroomid, setShowroomid] = useState<string | null>(null);

    const fetchShowroomData = async () => {
        try {
            // Create a query to get documents where showroomId matches the given showroomId
            const showroomQuery = query(
                collection(db, `user/${uid}/showroom`),
                where('showroomId', '==', showroomId)
            );

            // Execute the query
            const querySnapshot = await getDocs(showroomQuery);

            // Check if there are any documents matching the query
            if (!querySnapshot.empty) {
                // Assuming there is only one document that matches
                const docSnap = querySnapshot.docs[0]; // Get the first document
                const data = docSnap.data() as ShowroomData;

                // Get document ID
                const docId = docSnap.id;

                console.log("data", data);
                setShowroomData(data);
                setShowroomid(data.id)
                setShowroomDocId(docId);

                // Update fileNumber if showroomId exists in the data
                if (data.showroomId) {
                    const updatedFileNumber = `${data.showroomId}${bookingId}`;
                    setFormData(prevFormData => ({
                        ...prevFormData,
                        fileNumber: updatedFileNumber,
                    }));
                }
            } else {
                console.error('No showroom document found with the specified showroomId');
            }
        } catch (error) {
            console.error('Error fetching showroom data:', error);
        }
    };




    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    useEffect(() => {
        const newBookingId = uuid().substring(0, 5);
        setBookingId(newBookingId);
    }, []);

    const handleClaimReward = async (item: RewardItem) => {
        try {
            setLoading(true);
            setError(null);

            // Check if we have all necessary data
            if (!uid || !showroomid || !phone) {
                throw new Error('Missing required data for claiming reward');
            }

            // Reference to the showroom document
            const showroomDocRef = doc(db, `user/${uid}/showroom/${showroomid}`);
            
            // Get current showroom data
            const showroomDoc = await getDoc(showroomDocRef);
            if (!showroomDoc.exists()) {
                throw new Error('Showroom document not found');
            }

            const showroomData = showroomDoc.data();
            const staffArray = showroomData.staff || [];
            
            // Find and update the specific staff member's reward points
            const updatedStaff = staffArray.map((staffMember: any) => {
                if (staffMember.phoneNumber === phone) {
                    return {
                        ...staffMember,
                        rewardPoints: staffMember.rewardPoints - item.points,
                        claimedHistory: [
                            ...(staffMember.claimedHistory || []),
                            {
                                itemName: item.name,
                                points: item.points,
                                claimedDate: Timestamp.now(),
                                description: item.description,
                                category: item.category,
                                price: item.price,
                                itemImage: item.image,
                                id: item._id,


                            }
                        ]
                    };
                }
                return staffMember;
            });

            // Update the showroom document with the modified staff array
            await updateDoc(showroomDocRef, {
                staff: updatedStaff
            });

            // Update the reward item's stock
            const rewardItemRef = doc(db, `user/${uid}/rewarditems/${item._id}`);
            await updateDoc(rewardItemRef, {
                stock: item.stock - 1
            });

            // Update local state
            setRewardPoints((prevPoints) => (prevPoints || 0) - item.points);
            
            // Update the rewards list to reflect the new stock
            const updatedRewards = rewards.map(reward => 
                reward._id === item._id 
                    ? { ...reward, stock: reward.stock - 1 }
                    : reward
            );
            console.log(updatedRewards)

            setRewards(updatedRewards);

            setSuccessMessage(`Successfully claimed ${item.name}!`);
            
            // Don't close the modal immediately so user can see the success message
            setTimeout(handleCloseModal, 2000);

        } catch (error) {
            console.error('Error claiming reward:', error);
            setError('Failed to claim reward. Please try again.');
        } finally {
            setLoading(false);
        }
    };

console.log(rewardPoints,'this is the reward points')
  
    useEffect(() => {
        const fetchStaffRewardPoints = async()=>{
            try {
                const showroomDocRef = doc(db, `user/${uid}/showroom/${showroomid}`);
                const showroomDoc = await getDoc(showroomDocRef);
                if (showroomDoc.exists()) {
                    const showroomData = showroomDoc.data();
 
                    // Find the staff member with the matching phone number
                    const staffMember = showroomData.staff?.find(
                        (staff:any) => staff.phoneNumber === phone
                    );

                    if (staffMember) {
                        setRewardPoints(staffMember.rewardPoints || 0);
                    } else {
                        console.log('Staff member not found!');
                        setRewardPoints(null); // Set to null if no match found
                    }
                } else {
                    console.log('No such document!');
                }
            } catch (error) {
                console.error('Error fetching staff reward points:', error);
            }
        }

        
            fetchStaffRewardPoints();
       
    }, [db, uid, showroomId, phone]);

    // Inside your component
    useEffect(() => {
       

        fetchShowroomData();
    }, [showroomId, db, bookingId, uid]);

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prevFormData => ({
            ...prevFormData,
            [field]: value,
        }));
    };

    const validateForm = (): boolean => {
        const { customerName, phoneNumber, vehicleSection, vehicleNumber } = formData;
        return !!(customerName && phoneNumber && vehicleSection && vehicleNumber);
    };

    const formatDate = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            setError('Please fill in all required fields.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const currentDate = new Date();
            const dateTime = currentDate.toLocaleString();
            const formattedDate = formatDate(currentDate);

            // Add the document with a Timestamp for createdAt
            const docRef = await addDoc(collection(db, `user/${uid}/bookings`), {
                ...formData,
                showroomId: showroomDocId, // Include showroomId in the document
                dateTime: dateTime,
                createdAt: Timestamp.now(), // Store the current timestamp
                bookingStatus: 'ShowRoom Booking',
                status: 'booking added',
                statusEdit:'withoutmapbooking',
                bookingId: bookingId,
                company: 'rsa',
                createdBy:'showroomStaff',
                customerName: formData.customerName, // Adding customer name
                phoneNumber: formData.phoneNumber,   // Adding customer phone
                name: name,  // Adding name from location state
                phone: phone,
            });
            console.log('Document added successfully with ID:', docRef.id);

            setSuccessMessage('Booking added successfully!'); // Set success message
            setFormData({
                fileNumber: '',
                customerName: '',
                phoneNumber: '',
                vehicleNumber: '',
                vehicleSection: '',
                comments: '',
            });

            // Navigate back after a short delay to show the success message
            setTimeout(() => {
                navigate(-1);
            }, 500); // Adjust delay as needed

        } catch (error) {
            console.error('Error adding document:', error);
            setError('Failed to add booking. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        try {
            const rewardQuery = query(collection(db, `user/${uid}/rewarditems`), where('category', '==', 'ShowroomStaff'));
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

    useEffect(() => {
    fetchData();
    }, [])
    
    return (
        <div>
            <div style={styles.container}>
            <button onClick={handleOpenModal} className="btn btn-primary">
        Rewards
      </button>
                <h1 style={styles.header}>Add Bookings</h1>
                <div style={styles.formContainer}>
                    {error && <div style={styles.errorMessage}>{error}</div>}
                    {successMessage && <div style={styles.successMessage}>{successMessage}</div>}
                    <div style={styles.fieldContainer}>
                        <strong style={styles.fieldLabel}>Booking ID: </strong>
                        <span style={styles.fieldValue}>{bookingId}</span>
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="fileNumber" style={styles.label}>File Number</label>
                        <input
                            id="fileNumber"
                            type="text"
                            name="fileNumber"
                            placeholder="Enter File Number"
                            value={formData.fileNumber}
                            style={styles.input}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('fileNumber', e.target.value)}
                            readOnly
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="vehicleSection" style={styles.label}>Vehicle Section</label>
                        <select
                            id="vehicleSection"
                            name="vehicleSection"
                            value={formData.vehicleSection}
                            style={styles.select}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleInputChange('vehicleSection', e.target.value)}
                        >
                            <option value="">Select Service Section</option>
                            <option value="Service Center">Service Center</option>
                            <option value="Body Shopes">Body Shopes</option>
                            <option value="ShowRooms">ShowRooms</option>
                        </select>
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="customerName" style={styles.label}>Customer Name</label>
                        <input
                            id="customerName"
                            type="text"
                            name="customerName"
                            placeholder="Enter Customer Name"
                            value={formData.customerName}
                            style={styles.input}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('customerName', e.target.value)}
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="phoneNumber" style={styles.label}>Phone Number</label>
                        <input
                            id="phoneNumber"
                            type="text"
                            name="phoneNumber"
                            placeholder="Enter Phone Number"
                            value={formData.phoneNumber}
                            style={styles.input}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('phoneNumber', e.target.value)}
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="vehicleNumber" style={styles.label}>Vehicle Number</label>
                        <input
                            id="vehicleNumber"
                            type="text"
                            name="vehicleNumber"
                            placeholder="Enter Vehicle Number"
                            value={formData.vehicleNumber}
                            style={styles.input}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('vehicleNumber', e.target.value)}
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="comments" style={styles.label}>Comments</label>
                        <textarea
                            id="comments"
                            name="comments"
                            placeholder="Enter Comments"
                            value={formData.comments}
                            style={styles.textarea}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleInputChange('comments', e.target.value)}
                        />
                    </div>
                    <div style={styles.buttonContainer}>
                        <button
                            type="button"
                            style={styles.button}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                </div>
            </div>
            {isModalOpen && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <p style={{ backgroundColor: 'green', padding: '5px', borderRadius: '10px', fontWeight: 'bold', color: 'white' }}>Current Points: {rewardPoints}</p>
                        <div className="rewardProgressCard" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {/* Loop through rewards */}
                            {rewards.map((items, index) => {
                                // Calculate completion percentage based on reward points and target
                                const completionPercentage = Math.min(((rewardPoints ?? 0) / items.points) * 100, 100);

                                // Function to handle reward claim

                                return (
                                    <div key={index} className="container my-2" style={{ backgroundColor: '#b2b2b2', padding: '10px', borderRadius: '10px' }}>
                                        <div className="flex items-center space-x-4">
                                            <div className="w-1/4">
                                                <img style={{ height: '95px', width: '95px', objectFit: 'cover' }} src={items.image} alt="Live from space" className="w-full h-auto rounded" />
                                            </div>
                                            <div className="w-3/4">
                                                <h1 className="text-2xl font-bold">{items.name}</h1>
                                                <p className="text-lg text-gray-700">Price: ₹{items.price}</p>
                                                <p className="text-md text-gray-500">Target: {items.points}</p>
                                                <p className="text-md text-gray-500">Stock available: {items.stock}</p>
                                            </div>
                                        </div>
                                        <ProgressBar completed={completionPercentage} className="mt-4" />

                                        {/* Show Claim or Encouragement Message */}
                                        {completionPercentage === 100 && Number(items.stock) > 0 ? (
                                            <button
                                                onClick={() => handleClaimReward(items)}
                                                style={{
                                                    marginTop: '10px',
                                                    padding: '8px 16px',
                                                    backgroundColor: 'blue',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '5px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    width: '100%',
                                                }}
                                            >
                                                Claim Reward
                                            </button>
                                        ) : Number(items.stock) === 0 ? (
                                            <p style={{ marginTop: '10px', fontWeight: 'bold', color: 'red' }}>Out of Stock</p>
                                        ) : (
                                            <p style={{ marginTop: '10px', fontWeight: 'bold' }}>Almost there! Keep going to claim your reward!</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Close Button */}
                        <Button variant="outlined" onClick={handleCloseModal} color="error">
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#fff',
    },
    header: {
        textAlign: 'center' as const, // Corrected type assertion
        marginBottom: '20px',
    },
    formContainer: {
        display: 'flex',
        flexDirection: 'column' as const, // Ensure this matches the expected type
    },
    fieldContainer: {
        marginBottom: '10px',
    },
    fieldLabel: {
        fontWeight: 'bold',
    },
    fieldValue: {
        marginLeft: '10px',
    },
    inputGroup: {
        marginBottom: '15px',
    },
    label: {
        display: 'block',
        marginBottom: '5px',
        fontWeight: 'bold',
    },
    input: {
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
    },
    select: {
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
    },
    textarea: {
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        minHeight: '100px',
    },
    buttonContainer: {
        textAlign: 'center' as const, // Corrected type assertion
    },
    button: {
        backgroundColor: '#007BFF',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        padding: '10px 20px',
        cursor: 'pointer',
    },
    errorMessage: {
        color: 'red',
        marginBottom: '10px',
    },
    successMessage: {
        color: 'green',
        marginBottom: '10px',
    }
};


export default AddBook;
