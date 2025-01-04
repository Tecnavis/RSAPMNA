import React, { useState, useEffect } from 'react';
// import './ShowroomModal.css';
import { collection, addDoc, getFirestore, onSnapshot } from 'firebase/firestore';
import { TextField, Typography, IconButton, Button } from '@mui/material';
import IconMapPin from '../../components/Icon/IconMapPin';
interface Showroom {
    id: string;
    [key: string]: any;
  }
  interface Props {
    updateShowroomLocation: (location: string) => void;
    onClose: () => void;
  }
  const ShowroomModalWithout: React.FC<Props> = ({ updateShowroomLocation, onClose }) => {
    const [showRoom, setShowRoom] = useState<string>('');
    const [showrooms, setShowrooms] = useState<Showroom[]>([]);
    const [description, setDescription] = useState<string>('');
    const [userName, setUserName] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [tollFree, setTollFree] = useState<string>('');
    const [showRoomId, setShowRoomId] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [availableServices, setAvailableServices] = useState<string[]>([]);
    const [mobileNumber, setMobileNumber] = useState<string>('');
    const [state, setState] = useState<string>('');
    const [district, setDistrict] = useState<string>('');
    const [hasInsurance, setHasInsurance] = useState<string>('');
    const [insuranceAmount, setInsuranceAmount] = useState<string>('');
    const [hasInsuranceBody, setHasInsuranceBody] = useState<string>('');
    const [insuranceAmountBody, setInsuranceAmountBody] = useState<string>('');
    const [img, setImg] = useState<string>('');
    const [locationName, setLocationName] = useState<string>('');
    const [locationCoords, setLocationCoords] = useState<{ lat: string; lng: string }>({ lat: '', lng: '' });
  
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid') || '';
  
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, `user/${uid}/showroom`), (snapshot) => {
            const showroomsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setShowrooms(showroomsList);
        });

        return () => unsubscribe();
    }, [db]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();  // Prevent the default form submission behavior
        console.log('Form submit intercepted, no page reload should happen');
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
            <div  className="showroom-form">
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
                    <Button onClick={handleSubmit} variant="contained" color="primary">Save Showroom</Button>
                    <Button onClick={onClose} variant="outlined" color="secondary">Close</Button>
                </div>
            </div>
        </div>
    );
};

export default ShowroomModalWithout;
