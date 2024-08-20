import React, { useState, useEffect } from 'react';
import MapBooking from './MapBooking';
import WithoutMapBooking from './WithoutMapBooking';
import { useLocation } from 'react-router-dom';
import { FaMapMarkedAlt, FaMapPin } from 'react-icons/fa';
import styles from './booking.module.css'

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
        <div style={{ backgroundColor: '#e6f7ff', borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginBottom: '1rem' }}>
            <div  className={styles.buttonContainer}>
            <button 
                onClick={handleWithMapClick} 
                className={styles.button}
                style={{ backgroundColor: '#4CAF50' }} 
                disabled={isEditing && activeForm !== 'map'}
            >
                <FaMapMarkedAlt className={styles.icon} />
                <span>Map Booking</span>
            </button>
            <button 
                onClick={handleWithoutMapClick} 
                className={styles.button}
                style={{ backgroundColor: '#f44336' }} 
                disabled={isEditing && activeForm !== 'withoutMap'}
            >
                <FaMapPin className={styles.icon} />
                <span>Without Map Booking</span>
            </button>
        </div>
            </div>
            {activeForm === 'map' && <MapBooking />}
            {activeForm === 'withoutMap' && <WithoutMapBooking />}
        </div>
    );
};

export default Booking;
