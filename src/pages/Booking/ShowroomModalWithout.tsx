import React, { useState, useEffect, useRef } from 'react';
import './ShowroomModal.css';
import { collection, addDoc, getFirestore, onSnapshot } from 'firebase/firestore';
import { TextField, Typography, IconButton } from '@mui/material';
import IconMapPin from '../../components/Icon/IconMapPin';

const ShowroomModalWithout = ({ updateShowroomLocation }) => {
    const [showRoom, setShowRoom] = useState('');
    const [showrooms, setShowrooms] = useState([]);
    const [description, setDescription] = useState('');
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [tollFree, setTollFree] = useState('');
    const [showRoomId, setShowRoomId] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [availableServices, setAvailableServices] = useState([]);
    const [mobileNumber, setMobileNumber] = useState('');
    const [state, setState] = useState('');
    const [district, setDistrict] = useState('');
    const [hasInsurance, setHasInsurance] = useState('');
    const [insuranceAmount, setInsuranceAmount] = useState('');
    const [hasInsuranceBody, setHasInsuranceBody] = useState('');
    const [insuranceAmountBody, setInsuranceAmountBody] = useState('');
    const [img, setImg] = useState('');
    const [location, setLocation] = useState('');
    const [locationCoords, setLocationCoords] = useState({ lat: '', lng: '' });
    const db = getFirestore();
    const inputRef = useRef(null);

    const handleLocationChange = (e) => {
        const value = e.target.value;
        setLocation(value);

        const parts = value.split(',').map(part => part.trim());
        if (parts.length >= 3) {
            const lat = parts[parts.length - 2];
            const lng = parts[parts.length - 1];
            setLocationCoords({ lat, lng });
        } else {
            setLocationCoords({ lat: '', lng: '' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'showroom'), {
                Location: location,
                ShowRoom: showRoom,
                description,
                userName,
                password,
                tollFree,
                showroomId: showRoomId,
                phoneNumber,
                availableServices,
                mobileNumber,
                locationLatLng: locationCoords,
                state,
                district,
                hasInsurance,
                insuranceAmount,
                hasInsuranceBody,
                insuranceAmountBody,
                img,
                status: 'new showroom',
                createdAt: new Date(),
            });
            console.log('Showroom added successfully');
            console.log('Updating showroom location to:', location);
            updateShowroomLocation(location);

            // Reset form fields
            setLocation('');
            setShowRoom('');
            setDescription('');
            setUserName('');
            setPassword('');
            setTollFree('');
            setShowRoomId('');
            setPhoneNumber('');
            setAvailableServices([]);
            setMobileNumber('');
            setLocationCoords({ lat: '', lng: '' });
            setState('');
            setDistrict('');
            setHasInsurance('');
            setInsuranceAmount('');
            setHasInsuranceBody('');
            setInsuranceAmountBody('');
            setImg('');
        } catch (error) {
            console.error('Error adding document:', error);
        }
    };

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'showroom'), (snapshot) => {
            const showroomsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setShowrooms(showroomsList);
        });

        return () => unsubscribe();
    }, [db]);

    const openGoogleMaps = () => {
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(showRoom)}`;
        window.open(googleMapsUrl, '_blank');
    };

    return (
        <div className="showroom-modal">
            <form onSubmit={handleSubmit} className="showroom-form">
                <div className="form-group">
                    <label htmlFor="showRoom">Showroom Name:</label>
                    <TextField
                        value={showRoom}
                        onChange={(e) => setShowRoom(e.target.value)}
                        variant="outlined"
                        label="Showroom Name"
                        fullWidth
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="location">Location:</label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                            value={location}
                            onChange={handleLocationChange}
                            variant="outlined"
                            label="Location (format: location, lat, lng)"
                            fullWidth
                        />
                        <IconButton onClick={openGoogleMaps} className="icon-button">
                            <IconMapPin/>
                        </IconButton>
                    </div>
                    {locationCoords.lat && locationCoords.lng && (
                        <Typography>{`Location Lat/Lng: ${locationCoords.lat}, ${locationCoords.lng}`}</Typography>
                    )}
                </div>
                <div className="form-group">
                    <label htmlFor="description">Description:</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        className="form-control"
                        placeholder="Enter description"
                    ></textarea>
                </div>
                {/* Add other form fields here */}
                <button type="submit" className="btn btn-primary">Save Showroom</button>
            </form>
        </div>
    );
};

export default ShowroomModalWithout;
