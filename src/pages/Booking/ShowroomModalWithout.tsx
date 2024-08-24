import React, { useState, useEffect } from 'react';
import './ShowroomModal.css';
import { collection, addDoc, getFirestore, onSnapshot } from 'firebase/firestore';
import { TextField, Typography, IconButton, Button } from '@mui/material';
import IconMapPin from '../../components/Icon/IconMapPin';

const ShowroomModalWithout = ({ updateShowroomLocation, onClose }) => {
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
    const [locationName, setLocationName] = useState('');
    const [locationCoords, setLocationCoords] = useState({ lat: '', lng: '' });
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid');

    const handleSubmit = async (e:any) => {
        e.preventDefault();
        const location = `${locationName}, ${locationCoords.lat}, ${locationCoords.lng}`;
        try {
            await addDoc(collection(db, `user/${uid}/showroom`), {
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
            setLocationName('');
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

            // Close the modal
            onClose();
        } catch (error) {
            console.error('Error adding document:', error);
        }
    };

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, `user/${uid}/showroom`), (snapshot) => {
            const showroomsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setShowrooms(showroomsList);
        });

        return () => unsubscribe();
    }, [db, uid]);

    const openGoogleMaps = () => {
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationName)}`;
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
                    <label htmlFor="locationName">Location Name:</label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                            value={locationName}
                            onChange={(e) => setLocationName(e.target.value)}
                            variant="outlined"
                            label="Location Name"
                            fullWidth
                        />
                        <IconButton onClick={openGoogleMaps} className="icon-button">
                            <IconMapPin />
                        </IconButton>
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="lat">Latitude:</label>
                    <TextField
                        value={locationCoords.lat}
                        onChange={(e) => setLocationCoords({ ...locationCoords, lat: e.target.value })}
                        variant="outlined"
                        label="Latitude"
                        fullWidth
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="lng">Longitude:</label>
                    <TextField
                        value={locationCoords.lng}
                        onChange={(e) => setLocationCoords({ ...locationCoords, lng: e.target.value })}
                        variant="outlined"
                        label="Longitude"
                        fullWidth
                    />
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
                <div className="modal-actions">
                    <Button type="submit" variant="contained" color="primary">Save Showroom</Button>
                    <Button onClick={onClose} variant="outlined" color="secondary">Close</Button>
                </div>
            </form>
        </div>
    );
};

export default ShowroomModalWithout;
