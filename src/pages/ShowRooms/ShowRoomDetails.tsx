import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { doc, getFirestore, updateDoc, arrayUnion, query, where, getDocs, collection, getDoc, addDoc } from 'firebase/firestore';
import './ShowRoom.css';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

interface ShowRoomDetailsType {
    showroomIdNumber:string;
    id: string;
    name: string;
    location: string;
    img: string;
    tollfree: string;
    phoneNumber: string;
    state: string;
    district: string;
    uid: string;
}

const ShowRoomDetails: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const db = getFirestore();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isRegistering, setIsRegistering] = useState(true);
    const [isSignIn, setIsSignIn] = useState(true); // New state for switching between forms
    const [showRoomDetails, setShowRoomDetails] = useState<ShowRoomDetailsType>({
        id: '',
        name: '',
        location: '',
        img: '',
        showroomIdNumber:'',
        tollfree: '',
        phoneNumber: '',
        state: '',
        district: '',
        uid: '',
    });

    const [formData, setFormData] = useState({ name: '', phoneNumber: '',whatsappNumber:'',designation:'' });
    const [signInData, setSignInData] = useState({ phoneNumber: '' }); // New state for sign-in form
    const userRole = sessionStorage.getItem('role'); // Assume 'role' is stored in sessionStorage
    console.log("showroomIdNumber",showRoomDetails)
       
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        setShowRoomDetails({
            id: queryParams.get('id') || '',
            name: queryParams.get('name') || '',
            location: queryParams.get('location') || '',
            img: queryParams.get('img') || '',
            tollfree: queryParams.get('tollfree') || '',
            phoneNumber: queryParams.get('phoneNumber') || '',
            state: queryParams.get('state') || '',
            district: queryParams.get('district') || '',
            showroomIdNumber:queryParams.get('showroomIdNumber') || '',
            uid: queryParams.get('uid') || '',
        });
    }, [location.search]);



    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSignInFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSignInData({
            ...signInData,
            [e.target.name]: e.target.value,
        });
    };


    
// -----------------------------------------------------------------------------------------
const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    const indianPhoneNumberRegex = /^[6-9]\d{9}$/;

    if (!indianPhoneNumberRegex.test(formData.phoneNumber)) {
        setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
        return;
    }

    if (!showRoomDetails.id || !showRoomDetails.uid) return;

    try {
        const staffCollectionRef = collection(db, `user/${showRoomDetails.uid}/showroomStaff`);

        // Check if the phone number already exists
        const q = query(staffCollectionRef, where('phoneNumber', '==', formData.phoneNumber));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            setErrorMessage('The mobile number is already registered.');
            return;
        }

        // Add the new staff member
        await addDoc(staffCollectionRef, {
            name: formData.name,
            phoneNumber: formData.phoneNumber,
            whatsappNumber: formData.whatsappNumber,
            designation: formData.designation,
            showroomId: showRoomDetails.id, // Store showroom ID for reference

            uid: showRoomDetails.uid, // Store user ID for reference
        });

        Swal.fire({
            icon: 'success',
            title: 'Registered successfully!',
            showConfirmButton: false,
            timer: 3000,
        });

        setFormData({ name: '', phoneNumber: '', designation: '', whatsappNumber: '' });
        setIsSignIn(true);

        sessionStorage.setItem('staffId', querySnapshot.docs[0].id);
        navigate('/addbook', {
            state: {
                uid: showRoomDetails?.uid,
                showroomId: showRoomDetails?.id,
                name: formData.name,
                phoneNumber: formData.phoneNumber,
                showroomIdNumber: showRoomDetails?.showroomIdNumber, // Store showroom ID for reference

            },
        });
    } catch (error) {
        setErrorMessage('An error occurred while adding the staff.');
    }
};


const handleSignInSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    const indianPhoneNumberRegex = /^[6-9]\d{9}$/;

    if (!indianPhoneNumberRegex.test(signInData.phoneNumber)) {
        setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
        return;
    }

    try {
        const staffCollectionRef = collection(db, `user/${showRoomDetails.uid}/showroomStaff`);
        const q = query(staffCollectionRef, where('phoneNumber', '==', signInData.phoneNumber));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const staffData = querySnapshot.docs[0].data();
console.log("staffData",staffData)
            // Store staff info in sessionStorage
            sessionStorage.setItem('staffId', querySnapshot.docs[0].id);
            // sessionStorage.setItem('staffName', staffData.name);
            sessionStorage.setItem('showroomIdNumber', showRoomDetails.showroomIdNumber);
            sessionStorage.setItem('showroomId', showRoomDetails.id);
            sessionStorage.setItem('uid', showRoomDetails.uid);
            
            navigate('/addbook', {
                state: {
                    // uid: showRoomDetails?.uid,
                    // showroomId: showRoomDetails?.id,
                    phoneNumber: signInData.phoneNumber,
                },
            });
        } else {
            setErrorMessage('Phone number is not registered.');
        }
    } catch (error) {
        setErrorMessage('An error occurred during sign-in.');
    }
};


    return (
        
        <div className="showroom-details-container">
           
            <div className="showroom-header">
                <h1>{showRoomDetails.name}</h1>
            </div>
            <div className="showroom-details">
                <img src={showRoomDetails.img} alt={showRoomDetails.name} />
                <div className="showroom-details-content">
                    <div className="showroom-details">
                        <div className="showroom-details-content">
                            <div className="showroom-details-item">
                                <p>
                                    <strong>Location:</strong> {showRoomDetails.location}
                                </p>
                            </div>
                            <div className="showroom-details-item">
                                <p>
                                    <strong>Toll-Free:</strong> {showRoomDetails.tollfree}
                                </p>
                            </div>
                            <div className="showroom-details-item">
                                <p>
                                    <strong>Phone Number:</strong> {showRoomDetails.phoneNumber}
                                </p>
                            </div>
                            <div className="showroom-details-item">
                                <p>
                                    <strong>State:</strong> {showRoomDetails.state}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hover-form">
                    {isSignIn ? (
                        <div>
                            <h2>Sign In Here</h2>
                            <form onSubmit={handleSignInSubmit}>
                                <label htmlFor="signInPhoneNumber">Phone Number:</label>
                                <input type="text" id="signInPhoneNumber" name="phoneNumber" value={signInData.phoneNumber} onChange={handleSignInFormChange} required />
                                {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
                                <button type="submit">Sign In</button>
                            </form>
                            <p>Are you a new a staff ?</p>
                            <button style={{backgroundColor:'none'}} onClick={() => setIsSignIn(false)}>Register</button>
                        </div>
                    ) : (
                        <div>
                            <h2>Register Here</h2>
                            <form onSubmit={handleFormSubmit}>
                                <label htmlFor="name">Name:</label>
                                <input type="text" id="name" name="name" value={formData.name} onChange={handleFormChange} required />
                                <label htmlFor="phoneNumber">Phone Number:</label>
                                <input type="text" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleFormChange} required />
                                <label htmlFor="designation">Designation:</label>
                                <input type="text" id="designation" name="designation" value={formData.designation} onChange={handleFormChange} required />
                                <label htmlFor="whatsappNumber">Whatsapp Number:</label>
                                <input type="text" id="whatsappNumber" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleFormChange} required />
                                {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
                                <button type="submit">Submit</button>
                            </form>
                            <p>Are you registered already ?</p>
                            <button onClick={() => setIsSignIn(true)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300">
                            Sign In
                        </button>
                        </div>
                    )}
               
                </div>
            </div>
            <div className="showroom-footer">
                <p>&copy; 2024 Tecnavis Web Solutions. All rights reserved.</p>
            </div>
        </div>
    );
};

export default ShowRoomDetails;
