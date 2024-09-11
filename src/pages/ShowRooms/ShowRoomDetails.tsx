import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, getFirestore, updateDoc, arrayUnion, query, where, getDocs, collection } from 'firebase/firestore';
import './ShowRoom.css';

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

    const handleNavigation = () => {
        navigate('/addbook', { state: { uid: showRoomDetails?.uid, showroomId: showRoomDetails?.id } });
    };

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!showRoomDetails.id || !showRoomDetails.uid) return;

        try {
            const showroomCollectionRef = collection(db, `user/${showRoomDetails.uid}/showroom`);
            const q = query(showroomCollectionRef, where('showroomId', '==', showRoomDetails.id));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) return;

            const documentRef = doc(db, `user/${showRoomDetails.uid}/showroom/${querySnapshot.docs[0].id}`);

            await updateDoc(documentRef, {
                staff: arrayUnion(formData)
            });

            handleNavigation();

        } catch (error) {
            console.error('Error adding document:', error);
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
                    <div className="showroom-details-item">
                        <p><strong>Location:</strong> {showRoomDetails.location}</p>
                    </div>
                    <div className="showroom-details-item">
                        <p><strong>Toll-Free:</strong> {showRoomDetails.tollfree}</p>
                    </div>
                    <div className="showroom-details-item">
                        <p><strong>Phone Number:</strong> {showRoomDetails.phoneNumber}</p>
                    </div>
                    <div className="showroom-details-item">
                        <p><strong>State:</strong> {showRoomDetails.state}</p>
                    </div>
                    <div className="showroom-details-item">
                        <p><strong>District:</strong> {showRoomDetails.district}</p>
                    </div>
                </div>
                <div className="hover-form">
                    <h2>Register Here</h2>
                    <form onSubmit={handleFormSubmit}>
                        <label htmlFor="name">Name:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleFormChange}
                            required
                        />
                        <label htmlFor="phoneNumber">Phone Number:</label>
                        <input
                            type="text"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleFormChange}
                            required
                        />
                        <button type="submit">Submit</button>
                    </form>
                </div>
            </div>
            <div className="showroom-footer">
                <p>&copy; 2024 Tecnavis Web Solutions. All rights reserved.</p>
            </div>
        </div>
    );
};

export default ShowRoomDetails;
