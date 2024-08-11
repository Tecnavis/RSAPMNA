import React, { useState, useEffect, useRef } from 'react';
import { addDoc, collection, getFirestore, getDocs, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './ShowRoom.css';
import IconPrinter from '../../components/Icon/IconPrinter';

import { Autocomplete, TextField, Box, Typography } from '@mui/material';
import axios from 'axios';
const keralaDistricts = [
    'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod',
    'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad',
    'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'
];

const ShowRoom = () => {
    const [showRoom, setShowRoom] = useState({
        img: '',
        ShowRoom: '',
        description: '',
        Location: '',
        userName: '',
        password: '',
        tollfree: '',
        showroomId: '',
        phoneNumber: '',
        availableServices: [],
        mobileNumber: '',
        locationLatLng: { lat: '', lng: '' },
        state: '',
        district: '',
        hasInsurance: '',
        insuranceAmount: '',
        hasInsuranceBody: '',
        insuranceAmountBody: '',
    });

    const [existingShowRooms, setExistingShowRooms] = useState([]);
    const [editRoomId, setEditRoomId] = useState(null);
    const locationInputRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredRecords, setFilteredRecords] = useState([]);
    const listRef = useRef();
    const formRef = useRef(null);
    const [baseOptions, setBaseOptions] = useState([]);
    const [baseLocation, setBaseLocation] = useState(null);
    useEffect(() => {
        const term = searchTerm.toLowerCase();
        const filtered = existingShowRooms.filter(record =>
            (record.availableServices?.join(', ').toLowerCase().includes(term) ?? false) ||
            (record.hasInsurance?.toLowerCase().includes(term) ?? false) ||
            (record.insuranceAmount?.toLowerCase().includes(term) ?? false) ||
            (record.hasInsuranceBody?.toLowerCase().includes(term) ?? false) ||
            (record.insuranceAmountBody?.toLowerCase().includes(term) ?? false) ||
            (record.ShowRoom?.toLowerCase().includes(term) ?? false) ||
            (record.showroomId?.toLowerCase().includes(term) ?? false) ||
            (record.description?.toLowerCase().includes(term) ?? false) ||
            (record.Location?.toLowerCase().includes(term) ?? false) ||
            (record.userName?.toLowerCase().includes(term) ?? false) ||
            (record.password?.toLowerCase().includes(term) ?? false) ||
            (record.tollfree?.toLowerCase().includes(term) ?? false) ||
            (record.phoneNumber?.toLowerCase().includes(term) ?? false) ||
            (record.mobileNumber?.toLowerCase().includes(term) ?? false) ||
            (record.state?.toLowerCase().includes(term) ?? false) ||
            (record.district?.toLowerCase().includes(term) ?? false)
        );
        setFilteredRecords(filtered);
    }, [searchTerm, existingShowRooms]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setShowRoom((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };
    const handleBodyChange = (e) => {
        const { name, value } = e.target;
        setShowRoom({ ...showRoom, [name]: value });
    };
    const handleServiceChange = (e) => {
        const { value, checked } = e.target;
        setShowRoom((prevShowRoom) => {
            let updatedServices = [...prevShowRoom.availableServices];
            if (checked && !updatedServices.includes(value)) {
                updatedServices.push(value);
            } else if (!checked) {
                updatedServices = updatedServices.filter((service) => service !== value);
            }
            return { ...prevShowRoom, availableServices: updatedServices };
        });
    };

    const handleInsuranceChange = (e) => {
        setShowRoom({ ...showRoom, hasInsurance: e.target.value, insuranceAmount: e.target.value === 'No' ? '' : showRoom.insuranceAmount });
    };

    const handleBodyInsuranceChange = (e) => {
        const { name, value } = e.target;
        setShowRoom((prevShowRoom) => ({
            ...prevShowRoom,
            [name]: value,
            insuranceAmountBody: value === 'No' ? '' : prevShowRoom.insuranceAmountBody,
        }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const storage = getStorage();
        const storageRef = ref(storage, `showroomImages/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        console.log('Image uploaded, URL:', downloadURL); // Debugging line

        setShowRoom({ ...showRoom, img: downloadURL });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const db = getFirestore();
        const timestamp = serverTimestamp();
    
        // Construct the newShowRoom object with Location including lat and lng
        const newShowRoom = {
            ...showRoom,
            createdAt: timestamp,
            status: 'admin added showroom',
            // Assuming Location field should contain the string along with lat and lng
            Location: `${showRoom.Location}, ${showRoom.locationLatLng.lat}, ${showRoom.locationLatLng.lng}`
        };
    
        try {
            if (editRoomId) {
                const roomRef = doc(db, 'showroom', editRoomId);
                await updateDoc(roomRef, newShowRoom);
                alert('Showroom updated successfully');
                setEditRoomId(null);
            } else {
                await addDoc(collection(db, 'showroom'), newShowRoom);
                alert('Showroom added successfully');
            }
    
            // Clear the form fields
            setShowRoom({
                img: '',
                ShowRoom: '',
                description: '',
                Location: '',
                userName: '',
                password: '',
                tollfree: '',
                showroomId: '',
                phoneNumber: '',
                availableServices: [],
                mobileNumber: '',
                locationLatLng: { lat: '', lng: '' },
                state: '',
                district: '',
                hasInsurance: '',
                insuranceAmount: '',
                hasInsuranceBody: '',
                insuranceAmountBody: '',
            });
    
            fetchShowRooms();
            window.location.reload();
    
        } catch (error) {
            console.error('Error adding/updating showroom:', error);
        }
    };
    
    const fetchShowRooms = async () => {
        const db = getFirestore();
        try {
            const querySnapshot = await getDocs(query(collection(db, 'showroom'), orderBy('createdAt', 'desc')));
            const rooms = [];
            querySnapshot.forEach((doc) => {
                rooms.push({ id: doc.id, ...doc.data() });
            });
            setExistingShowRooms(rooms);
        } catch (error) {
            console.error('Error fetching showrooms:', error);
        }
    };

    const handleEdit = (roomId) => {
        const roomToEdit = existingShowRooms.find((room) => room.id === roomId);
        const userPassword = prompt('Please enter the password for edit:');

        if (userPassword === 'SHOWROOM') {
            setShowRoom(roomToEdit);
            setEditRoomId(roomId);
            formRef.current.scrollIntoView({ behavior: 'smooth' });
        } else {
            alert('Incorrect password. Edit operation aborted.');
        }
    };

    const handleDelete = async (roomId) => {
        const roomToDelete = existingShowRooms.find((room) => room.id === roomId);
        const shouldDelete = window.confirm('Are you sure you want to delete this showroom?');
        if (!shouldDelete) return;

        const userPassword = prompt('Please enter your password:');
        if (userPassword !== roomToDelete.password) {
            alert('Incorrect password. Deletion aborted.');
            return;
        }

        setExistingShowRooms((prevShowRooms) => prevShowRooms.filter((room) => room.id !== roomId));
        alert('Showroom removed from UI.');
    };

    useEffect(() => {
        fetchShowRooms();
    }, []);

    const handlePrint = () => {
        const originalContents = document.body.innerHTML;
        const printContents = listRef.current.innerHTML;
        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
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

    // Handle Location Selection
    const handleLocationChange = (event, newValue) => {
        if (newValue) {
            setBaseLocation(newValue);
            setShowRoom((prevShowRoom) => ({
                ...prevShowRoom,
                locationLatLng: { lat: newValue.lat, lng: newValue.lng },
                Location: newValue.label
            }));
        } else {
            setShowRoom((prevShowRoom) => ({
                ...prevShowRoom,
                locationLatLng: { lat: '', lng: '' },
                Location: ''
            }));
        }
        setBaseOptions([]);
    };
    return (
        <div className="mb-5">
            <h5 className="font-semibold text-lg dark:text-white-light mb-5">Showroom Details</h5>

            <form onSubmit={handleSubmit} ref={formRef} style={{ maxWidth: '400px', margin: '0 auto', backgroundColor: 'lightblue', padding: '20px', borderRadius: '5px' }}>
                <div className="mb-2" style={{ alignItems: 'center', border: '1px solid #ccc', padding: '10px', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                    <h1 style={{ marginRight: '10px', fontSize: '1.2em', color: '#333' }}>Service type</h1>
                    <label className="mr-4" style={{ marginRight: '10px', fontSize: '1em', color: '#333' }}>
                        <input
                            type="checkbox"
                            name="availableServices"
                            value="Service Center"
                            checked={showRoom.availableServices.includes('Service Center')}
                            onChange={handleServiceChange}
                            className="mr-1"
                            style={{ marginRight: '5px' }}
                        />
                        Service Center
                    </label>
                    {showRoom.availableServices.includes('Service Center') && (
                        <div className="mb-2" style={{ marginLeft: '10px', backgroundColor: '#ffeeba', padding: '10px', borderRadius: '5px', fontSize: '0.9em' }}>
                            <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>Do you have insurance?</p>
                            <label className="mr-2" style={{ marginRight: '10px', fontSize: '1em' }}>
                                <input
                                    type="checkbox"
                                    name="hasInsurance"
                                    value="Yes"
                                    checked={showRoom.hasInsurance === 'Yes'}
                                    onChange={handleInsuranceChange}
                                    className="mr-1"
                                    style={{ marginRight: '5px' }}
                                />
                                Yes
                            </label>
                            <label className="mr-2" style={{ marginRight: '10px', fontSize: '1em' }}>
                                <input
                                    type="checkbox"
                                    name="hasInsurance"
                                    value="No"
                                    checked={showRoom.hasInsurance === 'No'}
                                    onChange={handleInsuranceChange}
                                    className="mr-1"
                                    style={{ marginRight: '5px' }}
                                />
                                No
                            </label>
                            {showRoom.hasInsurance === 'Yes' && (
                                <div className="mt-2" style={{ marginTop: '10px' }}>
                                    <label style={{ fontSize: '1em', color: '#333' }}>
                                        Insurance Amount:
                                        <input
                                            type="text"
                                            name="insuranceAmount"
                                            value={showRoom.insuranceAmount}
                                            onChange={handleChange}
                                            className="form-input w-full mb-2"
                                            required
                                            style={{ width: '100%', padding: '5px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    )}
                    <label className="mr-4" style={{ marginRight: '10px', fontSize: '1em', color: '#333' }}>
                        <input
                            type="checkbox"
                            name="availableServices"
                            value="Body Shop"
                            checked={showRoom.availableServices.includes('Body Shop')}
                            onChange={handleServiceChange}
                            className="mr-1"
                            style={{ marginRight: '5px' }}
                        />
                        Body Shop
                    </label>
                    {showRoom.availableServices.includes('Body Shop') && (
                        <div className="mb-2" style={{ marginLeft: '10px', backgroundColor: '#ffeeba', padding: '10px', borderRadius: '5px', fontSize: '0.9em' }}>
                            <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>Do you have insurance?</p>
                            <label className="mr-2" style={{ marginRight: '10px', fontSize: '1em' }}>
                                <input
                                    type="checkbox"
                                    name="hasInsuranceBody"
                                    value="Yes"
                                    checked={showRoom.hasInsuranceBody === 'Yes'}
                                    onChange={handleBodyInsuranceChange}
                                    className="mr-1"
                                    style={{ marginRight: '5px' }}
                                />
                                Yes
                            </label>
                            <label className="mr-2" style={{ marginRight: '10px', fontSize: '1em' }}>
                                <input
                                    type="checkbox"
                                    name="hasInsuranceBody"
                                    value="No"
                                    checked={showRoom.hasInsuranceBody === 'No'}
                                    onChange={handleBodyInsuranceChange}
                                    className="mr-1"
                                    style={{ marginRight: '5px' }}
                                />
                                No
                            </label>
                            {showRoom.hasInsuranceBody === 'Yes' && (
                                <div className="mt-2" style={{ marginTop: '10px' }}>
                                    <label style={{ fontSize: '1em', color: '#333' }}>
                                        Insurance Amount:
                                        <input
                                            type="text"
                                            name="insuranceAmountBody"
                                            value={showRoom.insuranceAmountBody}
                                            onChange={handleBodyChange}
                                            className="form-input w-full mb-2"
                                            required
                                            style={{ width: '100%', padding: '5px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    )}
                    <label className="mr-4" style={{ marginRight: '10px', fontSize: '1em', color: '#333' }}>
                        <input
                            type="checkbox"
                            name="availableServices"
                            value="Showroom"
                            checked={showRoom.availableServices.includes('Showroom')}
                            onChange={handleServiceChange}
                            className="mr-1"
                            style={{ marginRight: '5px' }}
                        />
                        Showroom
                    </label>
                </div>

                <div className="mb-4" style={{ marginBottom: '16px' }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                        ShowRoom Name
                    </label>
                    <input
                        type="text"
                        name="ShowRoom"
                        value={showRoom.ShowRoom}
                        onChange={handleChange}
                        className="form-input w-full"
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' }}
                    />
                </div>
                <div className="mb-4" style={{ marginBottom: '16px' }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                        ShowRoomId
                    </label>
                    <input
                        type="text"
                        name="ShowRoomId"
                        value={showRoom.ShowRoomId}
                        onChange={handleChange}
                        className="form-input w-full"
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' }}
                    />
                </div>
                <div className="mb-4" style={{ marginBottom: '16px' }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                        Description
                    </label>
                    <textarea
                        name="description"
                        value={showRoom.description}
                        onChange={handleChange}
                        className="form-textarea w-full"
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em', minHeight: '100px' }}
                    />
                </div>
                <div className="mb-4" style={{ marginBottom: '16px' }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                        Location
                    </label>
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ gap: 2 }}>
                        <Autocomplete
                            value={baseLocation}
                            onInputChange={(event, newInputValue) => {
                                if (newInputValue) {
                                    getAutocompleteResults(newInputValue, setBaseOptions);
                                } else {
                                    setBaseOptions([]);
                                }
                            }}
                            onChange={handleLocationChange}
                            sx={{ width: 300 }}
                            options={baseOptions}
                            getOptionLabel={(option) => option.label}
                            isOptionEqualToValue={(option, value) => option.label === value.label}
                            renderInput={(params) => <TextField {...params} label="Location" variant="outlined" />}
                        />
                        {showRoom.locationLatLng.lat && showRoom.locationLatLng.lng && (
                            <Typography>{`Location Lat/Lng: ${showRoom.locationLatLng.lat}, ${showRoom.locationLatLng.lng}`}</Typography>
                        )}
                    </Box>
                </div>

                <div className="mb-4" style={{ marginBottom: '16px' }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                        User Name
                    </label>
                    <input
                        type="text"
                        name="userName"
                        value={showRoom.userName}
                        onChange={handleChange}
                        className="form-input w-full"
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' }}
                    />
                </div>

                <div className="mb-4" style={{ marginBottom: '16px' }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                        Password
                    </label>
                    <input
                        type="password"
                        name="password"
                        value={showRoom.password}
                        onChange={handleChange}
                        className="form-input w-full"
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' }}
                    />
                </div>
                <div className="mb-4" style={{ marginBottom: '16px' }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                        Help Line Number
                    </label>
                    <input
                        type="text"
                        name="tollfree"
                        value={showRoom.tollfree}
                        onChange={handleChange}
                        className="form-input w-full"
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' }}
                    />
                </div>

                <div className="mb-4" style={{ marginBottom: '16px' }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                        Phone Number
                    </label>
                    <input
                        type="text"
                        name="phoneNumber"
                        value={showRoom.phoneNumber}
                        onChange={handleChange}
                        className="form-input w-full"
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' }}
                    />
                </div>

                <div className="mb-4" style={{ marginBottom: '16px' }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                        Mobile Number
                    </label>
                    <input
                        type="text"
                        name="mobileNumber"
                        value={showRoom.mobileNumber}
                        onChange={handleChange}
                        className="form-input w-full"
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' }}
                    />
                </div>

                <div className="mb-4" style={{ marginBottom: '16px' }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                        State
                    </label>
                    <input
                        type="text"
                        name="state"
                        value={showRoom.state}
                        onChange={handleChange}
                        className="form-input w-full"
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' }}
                    />
                </div>

                <div className="mb-4" style={{ marginBottom: '16px' }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                        District
                    </label>
                    <select
                        name="district"
                        value={showRoom.district}
                        onChange={handleChange}
                        className="form-select w-full"
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' }}
                    >
                        <option value="">Select District</option>
                        {keralaDistricts.map((district) => (
                            <option key={district} value={district}>
                                {district}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4" style={{ marginBottom: '16px' }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                        Upload Image
                    </label>
                    <input
                        type="file"
                        onChange={handleImageUpload}
                        className="form-input w-full"
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' }}
                    />
                </div>

                <div className="mb-4" style={{ marginBottom: '16px', textAlign: 'center' }}>
                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#007bff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '1em',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                        }}
                    >
                        {editRoomId ? 'Update ShowRoom' : 'Add ShowRoom'}
                    </button>
                </div>
            </form>
            <br/>
            <div className="search-bar-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    style={{
                        padding: '10px',
                        borderRadius: '5px 0 0 5px',
                        border: '1px solid #ccc',
                        width: '300px',
                        fontSize: '16px',
                    }}
                />
                <button
                    style={{
                        padding: '10px 15px',
                        borderRadius: '0 5px 5px 0',
                        border: '1px solid #007bff',
                        backgroundColor: '#007bff',
                        color: '#fff',
                        fontSize: '16px',
                        cursor: 'pointer',
                    }}
                >
                    Search
                </button>
            </div>
            <h3 className="text-lg font-semibold mb-4" style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px' }}>
                ShowRooms List
            </h3>
            <div className="tooltip">
      <button
        onClick={handlePrint}
        style={{
          backgroundColor: 'gray',
          color: '#fff',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '16px',
        }}
      >
        <IconPrinter />
      </button>
      <span className="tooltip-text">Print here</span>
    </div>

            <div className="overflow-x-auto" style={{ overflowX: 'auto' }} ref={listRef}>
                <table className="w-full whitespace-nowrap text-black dark:text-white" style={{ width: '100%', whiteSpace: 'nowrap', color: '#000', backgroundColor: '#fff' }}>
                <thead style={{ background: '#f8f9fa' }}>
    <tr>
        <th className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
            Image
        </th>
        <th className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
            ShowRoom Name
        </th>
        <th className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
            ShowRoom Id
        </th>
        {/* <th className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
            Status
        </th> */}
        <th className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
            Location
        </th>
        <th className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
            User Name
        </th>
        <th className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
            Password
        </th>
        <th className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
            Help Line Number
        </th>
        <th className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
            Phone Number
        </th>
        <th className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
            Mobile Number
        </th>
        <th className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
            State
        </th>
        <th className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
            District
        </th>
        <th className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
            Available Services
        </th>
        <th className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
            Has Insurance<br/>(Service Center)
        </th>
        <th className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
            Insurance Amount Service Center{' '}
        </th>
        <th className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
            Has Insurance<br/>(Body Shop)
        </th>
        <th className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
            Insurance Amount Body Shop{' '}
        </th>
        <th className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
            Description
        </th>
        <th className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
            Actions
        </th>
    </tr>
</thead>

                    <tbody>
                        {filteredRecords.map((room) => (
        <tr key={room.id} style={{ backgroundColor: room.status === 'admin added showroom' ? '#e6f7ff' : room.status === 'new showroom' ? '#f2f9ff' : 'transparent' }}>
                                <td className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
                                    <img src={room.img} alt="ShowRoom" className="w-16 h-16 object-cover" style={{ width: '64px', height: '64px', objectFit: 'cover' }} />
                                </td>
                                <td className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
                                    {room.ShowRoom}
                                </td>
                                <td className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
                                    {room.ShowRoomId}
                                </td>
                                {/* <td className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
                                    {room.status}
                                </td> */}
                                <td className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
                                    {room.Location}
                                </td>
                                <td className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
                                    {room.userName}
                                </td>
                                <td className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
                                    {room.password}
                                </td>
                                <td className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
                                    {room.tollfree}
                                </td>
                                <td className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
                                    {room.phoneNumber}
                                </td>
                                <td className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
                                    {room.mobileNumber}
                                </td>
                                <td className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
                                    {room.state}
                                </td>
                                <td className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
                                    {room.district}
                                </td>
                                <td className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
                                    {room.availableServices}
                                </td>
                                <td className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
                                    {room.hasInsurance}
                                </td>
                                <td className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
                                    {room.insuranceAmount}
                                </td>
                                <td className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
                                    {room.hasInsuranceBody}
                                </td>
                                
                                <td className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
                                    {room.insuranceAmountBody}
                                </td>

                                <td className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px' }}>
                                    {room.description}
                                </td>
                                <td className="border border-gray-300 p-2" style={{ border: '1px solid #ccc', padding: '8px',alignItems: 'center' }}>
                                    <button
                                        onClick={() => handleEdit(room.id)}
                                        style={{
                                            backgroundColor: '#6c757d',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '5px 10px',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            marginRight: '5px',
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(room.id)}
                                        style={{
                                            backgroundColor: '#dc3545',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '5px 10px',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ShowRoom;
