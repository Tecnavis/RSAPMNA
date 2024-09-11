import React, { useEffect, useState, ChangeEvent } from 'react';
import { addDoc, collection, getFirestore } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp from Firebase
import { query, where, getDocs } from 'firebase/firestore';

interface FormData {
    fileNumber: string;
    customerName: string;
    phoneNumber: string;
    vehicleSection: string;
    vehicleNumber: string;
    comments: string;
}

interface ShowroomData {
    showroomId?: string;}

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
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const db = getFirestore();
    const navigate = useNavigate();
    const location = useLocation();
    const showroomId = location.state?.showroomId ?? '';
    const uid = location.state?.uid ?? '';
    console.log("showroomId", showroomId);

    const [bookingId, setBookingId] = useState<string>('');
    const [showroomData, setShowroomData] = useState<ShowroomData | null>(null);
    const [showroomDocId, setShowroomDocId] = useState<string | null>(null);

    useEffect(() => {
        const newBookingId = uuid().substring(0, 5);
        setBookingId(newBookingId);
    }, []);

    // Inside your component
    useEffect(() => {
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

    return (
        <div>
            <div style={styles.container}>
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
        textAlign: 'center' as 'center', // Add type assertion if necessary
        marginBottom: '20px',
        
    },
    formContainer: {
        display: 'flex',
        flexDirection: 'column',
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
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#007BFF',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontSize: '16px',
    },
    errorMessage: {
        color: 'red',
        marginBottom: '10px',
    },
    successMessage: {
        color: 'green',
        marginBottom: '10px',
    },
};

export default AddBook;
