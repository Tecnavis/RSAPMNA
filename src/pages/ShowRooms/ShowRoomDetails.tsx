import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './ShowRoom.css'; // Import the CSS file

// Define the type for the showroom details state
interface ShowRoomDetailsType {
    id: string;
    name: string;
    location: string;
    img: string;
    tollfree: string;
    phoneNumber: string;
    state: string;
    district: string;
}

const ShowRoomDetails: React.FC = () => {
    const location = useLocation();
    
    // Initialize state with default values
    const [showRoomDetails, setShowRoomDetails] = useState<ShowRoomDetailsType>({
        id: '',
        name: '',
        location: '',
        img: '',
        tollfree: '',
        phoneNumber: '',
        state: '',
        district: '',
    });

    useEffect(() => {
        // Extract the query parameters from the URL
        const queryParams = new URLSearchParams(location.search);
        const id = queryParams.get('id') || '';
        const name = queryParams.get('name') || '';
        const showroomLocation = queryParams.get('location') || '';
        const img = queryParams.get('img') || '';
        const tollfree = queryParams.get('tollfree') || '';
        const phoneNumber = queryParams.get('phoneNumber') || '';
        const state = queryParams.get('state') || '';
        const district = queryParams.get('district') || '';

        // Set the showroom details state
        setShowRoomDetails({
            id,
            name,
            location: showroomLocation,
            img,
            tollfree,
            phoneNumber,
            state,
            district
        });
    }, [location.search]);

    return (
        <div className="showroom-details-container">
            <div className="showroom-header">
                <h1>{showRoomDetails.name}</h1>
            </div>
            <div className="showroom-details">
                {showRoomDetails.img && <img src={showRoomDetails.img} alt={showRoomDetails.name} />}
                <div className="showroom-details-item">
                    <p><strong>ID:</strong></p>
                    <p>{showRoomDetails.id}</p>
                </div>
                <div className="showroom-details-item">
                    <p><strong>Location:</strong></p>
                    <p>{showRoomDetails.location}</p>
                </div>
                <div className="showroom-details-item">
                    <p><strong>Toll-Free:</strong></p>
                    <p>{showRoomDetails.tollfree}</p>
                </div>
                <div className="showroom-details-item">
                    <p><strong>Phone Number:</strong></p>
                    <p>{showRoomDetails.phoneNumber}</p>
                </div>
                <div className="showroom-details-item">
                    <p><strong>State:</strong></p>
                    <p>{showRoomDetails.state}</p>
                </div>
                <div className="showroom-details-item">
                    <p><strong>District:</strong></p>
                    <p>{showRoomDetails.district}</p>
                </div>
            </div>
            <div className="showroom-footer">
                <p>&copy; 2024 Tecnavis Web Solutions. All rights reserved.</p>
            </div>
        </div>
    );
};

export default ShowRoomDetails;
