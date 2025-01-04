import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, getFirestore, updateDoc, arrayUnion, query, where, getDocs, collection, getDoc } from 'firebase/firestore';
import './ShowRoom.css';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

interface ShowRoomDetailsType {
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
        tollfree: '',
        phoneNumber: '',
        state: '',
        district: '',
        uid: '',
    });

    const [formData, setFormData] = useState({ name: '', phoneNumber: '' });
    const [signInData, setSignInData] = useState({ phoneNumber: '' }); // New state for sign-in form
    const userRole = sessionStorage.getItem('role'); // Assume 'role' is stored in sessionStorage
    console.log("userRole",userRole)
        // // Role-based access control
        // useEffect(() => {
        //     if (userRole !== 'admin' && userRole !== 'staff') {
        //         toast.error('You are an unauthorized user', { autoClose: 3000 });
        //     }
        // }, [userRole]);
    
        // // Only allow access if role is 'admin' or 'staff'
        // if (userRole !== 'admin' && userRole !== 'staff') {
        //     return (
        //         <div style={{ textAlign: 'center', marginTop: '50px' }}>
        //             <h1>You are an unauthorized user</h1>
        //         </div>
        //     );
        // }
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

    const handleNavigation = () => {
        console.log("Name:", formData.name);
        console.log("Phone Number:", formData.phoneNumber);
    
        navigate('/addbook', { 
            state: { 
                uid: showRoomDetails?.uid, 
                showroomId: showRoomDetails?.id,
                name: formData.name, 
                phoneNumber: formData.phoneNumber 
            } 
        });
    };
    

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
            const showroomCollectionRef = collection(db, `user/${showRoomDetails.uid}/showroom`);
            const q = query(showroomCollectionRef, where('showroomId', '==', showRoomDetails.id));

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) return;

            const documentRef = doc(db, `user/${showRoomDetails.uid}/showroom/${querySnapshot.docs[0].id}`);

            const docSnap = await getDoc(documentRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const isPhoneAlreadyUsed = data.staff?.some((staffMember: { phoneNumber: string }) => staffMember.phoneNumber === formData.phoneNumber);

                if (isPhoneAlreadyUsed) {
                    setErrorMessage('The mobile number is already registered.');
                    return;
                }

                await updateDoc(documentRef, {
                    staff: arrayUnion(formData),
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Registered successfully!',
                    showConfirmButton: false,
                    timer: 3000,
                });
                setFormData({ name: '', phoneNumber: '' })
                setIsSignIn(true);
                navigate('/addbook', { 
                    state: { 
                        uid: showRoomDetails?.uid, 
                        showroomId: showRoomDetails?.id,
                        name: formData.name, 
                        phoneNumber: formData.phoneNumber 
                    } 
                });
            } else {
                setErrorMessage('No such document!');
            }
        } catch (error) {
            setErrorMessage('An error occurred while adding the document.');
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
            // Add your sign-in logic here (you might want to query the database to check if the phone number exists).
            // For example:
            const showroomCollectionRef = collection(db, `user/${showRoomDetails.uid}/showroom`);
            const q = query(showroomCollectionRef, where('showroomId', '==', showRoomDetails.id));

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                // Verify phone number in your sign-in logic
                const docRef = querySnapshot.docs[0];
                const data = docRef.data();
                const isPhoneExists = data.staff?.some((staffMember: { phoneNumber: string }) => staffMember.phoneNumber === signInData.phoneNumber);

                if (isPhoneExists) {
                    // Redirect to dashboard or desired page
                    navigate('/addbook', { 
                        state: { 
                            uid: showRoomDetails?.uid, 
                            showroomId: showRoomDetails?.id,
                            phoneNumber: signInData.phoneNumber // Pass the phone number
                        } 
                    });
                                } else {
                    setErrorMessage('Phone number is not registered.');
                }
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
                                <input type="number" id="signInPhoneNumber" name="phoneNumber" value={signInData.phoneNumber} onChange={handleSignInFormChange} required />
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
                                <input type="number" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleFormChange} required />
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
