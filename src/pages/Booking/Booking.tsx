import React, { useState, useEffect } from 'react';
import MapBooking from './MapBooking';
import WithoutMapBooking from './WithoutMapBooking';
import { useLocation } from 'react-router-dom';

const Booking = () => {
    const [activeForm, setActiveForm] = useState('map');
    const [isEditing, setIsEditing] = useState(false);
    const location = useLocation();
    const editData = location.state?.editData;

    useEffect(() => {
        if (editData) {
            setIsEditing(true); // Set to true if editing data is present
            if (editData.statusEdit === 'withoutmapbooking') {
                setActiveForm('withoutMap');
            } else if (editData.statusEdit === 'mapbooking') {
                setActiveForm('map');
            }
        } else {
            setIsEditing(false); // Set to false if no editing data
        }
    }, [editData]);

    const handleWithMapClick = () => {
        setActiveForm('map');
    };

    const handleWithoutMapClick = () => {
        setActiveForm('withoutMap');
    };

    return (
        <div style={{ backgroundColor: '#e6f7ff', padding: '2rem', borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginBottom: '1rem' }}>
                <button 
                    onClick={handleWithMapClick} 
                    style={{ marginRight: '1rem',background:"" }} 
                    disabled={isEditing && activeForm !== 'map'} // Disable if editing and not the active form
                >
                    Map Booking
                </button>
                <button 
                    onClick={handleWithoutMapClick} 
                    disabled={isEditing && activeForm !== 'withoutMap'} // Disable if editing and not the active form
                >
                    Without Map Booking
                </button>
            </div>
            {activeForm === 'map' && <MapBooking />}
            {activeForm === 'withoutMap' && <WithoutMapBooking />}
        </div>
    );
};

export default Booking;
