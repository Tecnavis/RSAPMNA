import React, { useState, useEffect, useRef } from 'react';
import './ShowroomModal.css';
import { collection, addDoc, getFirestore, onSnapshot } from 'firebase/firestore';
import { Autocomplete, IconButton, TextField, Typography } from '@mui/material';
import axios from 'axios';
import IconMapPin from '../../components/Icon/IconMapPin';

const ShowroomModal = ({ updateShowroomLocation , onClose}) => {
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
    const [location, setLocation] = useState(null);
    const [locationOptions, setLocationOptions] = useState([]);
    const [locationCoords, setLocationCoords] = useState({ lat: '', lng: '' });
    const db = getFirestore();
    const inputRef = useRef(null);
    const uid = sessionStorage.getItem('uid')

    const handleInputChange = (event, newInputValue) => {
        setShowRoom(newInputValue);
        if (newInputValue) {
            getAutocompleteResults(newInputValue, setLocationOptions);
        } else {
            setLocationOptions([]);
        }
    };

    const getAutocompleteResults = async (inputText, setOptions) => {
        try {
            const response = await axios.get(`https://api.olamaps.io/places/v1/autocomplete?input=${inputText}&api_key=${import.meta.env.VITE_REACT_APP_API_KEY}`);
            if (response.data && Array.isArray(response.data.predictions)) {
                const predictionsWithCoords = await Promise.all(
                    response.data.predictions.map(async (prediction) => {
                        const placeDetails = await getPlaceDetails(prediction.place_id);
                        const locationName = prediction.description.split(',')[0]; // Extract the location name
                        return {
                            label: locationName,
                            lat: placeDetails.geometry.location.lat,
                            lng: placeDetails.geometry.location.lng,
                            ...prediction,
                        };
                    })
                );
                setOptions(predictionsWithCoords);
            } else {
                setOptions([]);
            }
        } catch (error) {
            console.error('Error fetching autocomplete results:', error);
            setOptions([]);
        }
    };

    const getPlaceDetails = async (placeId) => {
        try {
            const response = await axios.get(`https://api.olamaps.io/places/v1/details?place_id=${placeId}&api_key=${import.meta.env.VITE_REACT_APP_API_KEY}`);
            return response.data.result;
        } catch (error) {
            console.error('Error fetching place details:', error);
            return { geometry: { location: { lat: undefined, lng: undefined } } };
        }
    };

    const handleLocationChange = (event, newValue) => {
        if (newValue) {
            setLocation(newValue);
            setLocationCoords({ lat: newValue.lat, lng: newValue.lng });
        } else {
            setLocationCoords({ lat: '', lng: '' });
        }
        setLocationOptions([]);
    };

    const handleLatChange = (e) => {
        setLocationCoords({ ...locationCoords, lat: e.target.value });
    };

    const handleLngChange = (e) => {
        setLocationCoords({ ...locationCoords, lng: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, `user/${uid}/showroom`), {
                Location: `${location ? location.label : ''}, ${locationCoords.lat}, ${locationCoords.lng}`,
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
            console.log('Updating showroom location to:', location ? location.label : '');
            updateShowroomLocation(location ? location.label : '');

            // Reset form fields
            setLocation(null);
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
        const unsubscribe = onSnapshot(collection(db, `user/${uid}/showroom`), (snapshot) => {
            const showroomsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setShowrooms(showroomsList);
        });

        return () => unsubscribe();
    }, [db]);

    const handleClose = () => {
        if (onClose) {
            onClose(); // Call the onClose function passed from the parent component
        }
    };
    const openGoogleMaps = () => {
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(showRoom)}`;
        window.open(googleMapsUrl, '_blank');
    };
    return (
        <div className="showroom-modal">
            <form onSubmit={handleSubmit} className="showroom-form">
                <div className="form-group">
                    <label htmlFor="showRoom">Showroom Name:</label>
                    <Autocomplete
                        value={location}
                        onInputChange={handleInputChange}
                        onChange={handleLocationChange}
                        sx={{ width: 300 }}
                        options={locationOptions}
                        getOptionLabel={(option) => option.label}
                        isOptionEqualToValue={(option, value) => option.label === value.label}
                        renderInput={(params) => <TextField {...params} label="Location" variant="outlined" />}
                    />
                     <IconButton onClick={openGoogleMaps} className="icon-button">
                            <IconMapPin />
                        </IconButton>
                </div>
                <div className="form-group">
                    <label htmlFor="lat">Latitude:</label>
                    <TextField
                        id="lat"
                        value={locationCoords.lat}
                        onChange={handleLatChange}
                        required
                        className="form-control"
                        placeholder="Enter latitude"
                        variant="outlined"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="lng">Longitude:</label>
                    <TextField
                        id="lng"
                        value={locationCoords.lng}
                        onChange={handleLngChange}
                        required
                        className="form-control"
                        placeholder="Enter longitude"
                        variant="outlined"
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
                <button type="submit" className="btn btn-primary">Save Showroom</button>
                <button className="btn btn-danger my-3" onClick={handleClose}>close</button>
            </form>
        </div>
    );
};

export default ShowroomModal;
