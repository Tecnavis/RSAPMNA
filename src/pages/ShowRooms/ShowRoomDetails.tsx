import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ShowRoomDetails = () => {
    const location = useLocation();
    const [showRoomDetails, setShowRoomDetails] = useState({
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
        const id = queryParams.get('id');
        const name = queryParams.get('name');
        const showroomLocation = queryParams.get('location');
        const img = queryParams.get('img');
        const tollfree = queryParams.get('tollfree');
        const phoneNumber = queryParams.get('phoneNumber');
        const state = queryParams.get('state');
        const district = queryParams.get('district');

        // Set the showroom details state
        setShowRoomDetails({ id, name, location: showroomLocation, img, tollfree, phoneNumber, state, district });
    }, [location.search]);

    return (
        <div>
            <h1>Showroom Details</h1>
            <p><strong>ID:</strong> {showRoomDetails.id}</p>
            <p><strong>Name:</strong> {showRoomDetails.name}</p>
            <p><strong>Location:</strong> {showRoomDetails.location}</p>
            {showRoomDetails.img && <img src={showRoomDetails.img} alt={showRoomDetails.name} />}
            <p><strong>Toll-Free:</strong> {showRoomDetails.tollfree}</p>
            <p><strong>Phone Number:</strong> {showRoomDetails.phoneNumber}</p>
            <p><strong>State:</strong> {showRoomDetails.state}</p>
            <p><strong>District:</strong> {showRoomDetails.district}</p>
        </div>
    );
};

export default ShowRoomDetails;
