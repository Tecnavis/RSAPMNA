import React, { useEffect, useState, ChangeEvent } from 'react';
import { addDoc, collection, doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp from Firebase
import { query, where, getDocs } from 'firebase/firestore';


interface FormData {
    fileNumber: string;
    customerName: string;
    phoneNumber: string;
    serviceCategory: string;
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
        serviceCategory: '',
        vehicleNumber: '',
        comments: '',
    });

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const db = getFirestore();
    const navigate = useNavigate();
    const location = useLocation();
    const showroomId = sessionStorage.getItem('showroomId');
    console.log("rrrr", showroomId);
    const name = location.state?.name ?? ''; // Extracted name
    const phone = location.state?.phoneNumber ?? ''; // Extracted phoneNumber
    const uid = sessionStorage.getItem('uid');
    const staffId = sessionStorage.getItem('staffId');
    const showroomIdNumber = sessionStorage.getItem('showroomIdNumber');

    console.log("showroomIdNumber", showroomIdNumber);
        console.log("uidg", uid);

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



    useEffect(() => {
        const newBookingId = uuid().substring(0, 6);
        setBookingId(newBookingId);
    }, []);

    useEffect(() => {
        if (showroomIdNumber && bookingId) {
            const updatedFileNumber = `${showroomIdNumber}${bookingId}`;
            setFormData(prevFormData => ({
                ...prevFormData,
                fileNumber: updatedFileNumber,
            }));
        }
    }, [showroomIdNumber, bookingId]);
    

console.log(rewardPoints,'this is the reward points')
  

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
        const { customerName, phoneNumber, serviceCategory, vehicleNumber } = formData;
        return !!(customerName && phoneNumber && serviceCategory && vehicleNumber);
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
            const dateTime = currentDate.toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
                        const formattedDate = formatDate(currentDate);
            const uid = sessionStorage.getItem("uid"); // Retrieve uid

            // Add the document with a Timestamp for createdAt
            const docRef = await addDoc(collection(db, `user/${uid}/bookings`), {
                ...formData,
                showroomId: showroomId, // Include showroomId in the document
                dateTime: dateTime,
                createdAt: Timestamp.now(), // Store the current timestamp
                bookingStatus: 'ShowRoom Booking',
                status: 'booking added',
                statusEdit:'withoutmapbooking',
                bookingId: bookingId,
                bookingEdit: true,
                company: 'rsa',
                createdBy:'showroomStaff',
                customerName: formData.customerName, // Adding customer name
                phoneNumber: formData.phoneNumber,   // Adding customer phone
                name: name,  // Adding name from location state
                phone: phone,
                staffId:staffId,
            });
            console.log('Document added successfully with ID:', docRef.id);

            setSuccessMessage('Booking added successfully!'); // Set success message
            setFormData({
                fileNumber: '',
                customerName: '',
                phoneNumber: '',
                vehicleNumber: '',
                serviceCategory: '',
                comments: '',
            });

            // Navigate back after a short delay to show the success message
            setTimeout(() => {
                navigate('/showroomstaffdashboard');
            }, 500); // Adjust delay as needed

        } catch (error) {
            console.error('Error adding document:', error);
            setError('Failed to add booking. Please try again.');
        } finally {
            setLoading(false);
        }
    };

   
    
    return (
        <div style={{padding:'2px'}}>
              <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-gray-900 to-black text-white shadow-lg py-5 z-50">
    <div className="max-w-6xl mx-auto flex justify-between items-center px-6">
        <div className="text-2xl font-bold tracking-wide uppercase">
            Add Bookings
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

                  
            <div style={styles.container}>
                
          
                <h1 className='text-2xl font-bold text-center text-gray-800 mt- mb-4'>Add Bookings</h1>
                <div style={styles.formContainer}>
                    {error && <div style={styles.errorMessage}>{error}</div>}
                    {successMessage && <div style={styles.successMessage}>{successMessage}</div>}
                    {/* <div style={styles.fieldContainer}>
                        <strong style={styles.fieldLabel}>Booking ID: </strong>
                        <span style={styles.fieldValue}>{bookingId}</span>
                    </div> */}
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
                        <label htmlFor="serviceCategory" style={styles.label}>Vehicle Section</label>
                        <select
                            id="serviceCategory"
                            name="serviceCategory"
                            value={formData.serviceCategory}
                            style={styles.select}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleInputChange('serviceCategory', e.target.value)}
                        >
                            <option value="">Select Service Section</option>
                            <option value="Service Center">Service Center</option>
                            <option value="Body Shop">Body Shopes</option>
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
           
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        borderRadius: '8px',
        marginTop:'100px',
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
