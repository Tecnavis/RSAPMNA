import React, { useEffect, useState } from 'react';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import './BaseLocationForm.css'; // Import the CSS file
import axios from 'axios';
import { Autocomplete, TextField, Box, Typography } from '@mui/material';
import Tippy from '@tippyjs/react';
import IconPencil from '../../components/Icon/IconPencil';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import { useNavigate } from 'react-router-dom';
import IconMapPin from '../../components/Icon/IconMapPin';
// ---------------------------=====================-
interface BaseLocationItem {
    id: string;
    name: string;
    lat: string;
    lng: string;
    [key: string]: any; // Allow additional properties
}


interface AutocompleteOption {
    label: string;
    lat: string;
    lng: string;
}
const BaseLocation: React.FC = () => {
    const [baseLocation, setBaseLocation] = useState<AutocompleteOption | null>(null); // Updated state type
    const [baseOptions, setBaseOptions] = useState<AutocompleteOption[]>([]);
    const [lat, setLat] = useState<string>('');
    const [lng, setLng] = useState<string>('');
    const [baseLocationName, setBaseLocationName] = useState<string>('');
    const [savedBaseLocation, setSavedBaseLocation] = useState<BaseLocationItem | null>(null);
    const [items, setItems] = useState<BaseLocationItem[]>([]);
    const [editing, setEditing] = useState<boolean>(false);
    const [currentItemId, setCurrentItemId] = useState<string | null>(null);
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid') || '';
    const navigate = useNavigate();
    const [latLng, setLatLng] = useState('');

    // const handleMapClick = (location) => {
    //     setLat(location.lat);
    //     setLng(location.lng);
    // };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, `user/${uid}/baselocation`));
                const data: BaseLocationItem[] = querySnapshot.docs.map((doc) => {
                    const docData = doc.data() as Partial<BaseLocationItem>; // Use Partial to handle missing fields
                    return {
                        id: doc.id,
                        name: docData.name || '', // Provide default values if fields are missing
                        lat: docData.lat || '',
                        lng: docData.lng || ''
                    };
                });
                setItems(data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
    
        fetchData();
    }, [db, uid]);
    

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!baseLocationName || !lat || !lng) {
            alert('Please fill in all fields.');
            return;
        }
        const baseLocationDetails: BaseLocationItem = {
            id: editing && currentItemId ? currentItemId : '', // Use existing ID if editing
            name: baseLocationName,
            lat,
            lng,
        };
    
        if (editing && currentItemId) {
            try {
                await updateDoc(doc(db, `user/${uid}/baselocation`, currentItemId), baseLocationDetails);
                setItems((prevItems) => prevItems.map((item) =>
                    item.id === currentItemId ? { ...item, ...baseLocationDetails } : item
                ));
                setEditing(false);
                setCurrentItemId(null);
            } catch (error) {
                console.error('Error updating base location: ', error);
            }
        } else {
            try {
                const docRef = await addDoc(collection(db, `user/${uid}/baselocation`), baseLocationDetails);
                setItems([...items, { ...baseLocationDetails, id: docRef.id }]);
            } catch (error) {
                console.error('Error adding base location: ', error);
            }
        }
    
        setSavedBaseLocation(baseLocationDetails);
        setBaseLocationName('');
        setLatLng('');

    };
    
    const handleDelete = async (id: string) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this base location?');
        if (confirmDelete) {
            const password = window.prompt('Please enter the password to confirm deletion:');
            if (password === 'BASELOCATION') {
                try {
                    await deleteDoc(doc(db, `user/${uid}/baselocation`, id));
                    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
                } catch (error) {
                    console.error('Error deleting document:', error);
                }
            } else {
                alert('Incorrect password. Deletion cancelled.');
            }
        }
    };
    const handleEdit = (item: BaseLocationItem) => {
        const password = window.prompt('Please enter the password to edit this base location:');
        if (password === 'BASELOCATION') {
            setEditing(true);
            setCurrentItemId(item.id);
            setBaseLocationName(item.name);
            setLat(item.lat);
            setLng(item.lng);
            setLatLng(`${item.lat}, ${item.lng}`);  // Combine latitude and longitude into the latLng state for manual input

        } else {
            alert('Incorrect password. Edit cancelled.');
        }
    };


    const getAutocompleteResults = async (inputText: string, setOptions: React.Dispatch<React.SetStateAction<AutocompleteOption[]>>) => {
        const keralaCenterLat = 10.8505;
        const keralaCenterLng = 76.2711;
        const radius = 200000;

        try {
            const response = await axios.get('https://api.olamaps.io/places/v1/autocomplete', {
                params: {
                    input: inputText,
                    api_key: import.meta.env.VITE_REACT_APP_API_KEY,
                    location: `${keralaCenterLat},${keralaCenterLng}`,
                    radius,
                },
            });

            if (response.data && Array.isArray(response.data.predictions)) {
                const predictionsWithCoords = await Promise.all(
                    response.data.predictions.map(async (prediction: any) => {
                        const placeDetails = await getPlaceDetails(prediction.place_id);
                        const locationName = prediction.description.split(',')[0];
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

    const getPlaceDetails = async (placeId: string) => {
        try {
            const response = await axios.get(`https://api.olamaps.io/places/v1/details?place_id=${placeId}&api_key=${import.meta.env.VITE_REACT_APP_API_KEY}`);
            return response.data.result;
        } catch (error) {
            console.error('Error fetching place details:', error);
            return { geometry: { location: { lat: undefined, lng: undefined } } };
        }
    };

    const handleBaseChange = (event: React.SyntheticEvent, newValue: AutocompleteOption | null) => {
        if (newValue) {
            setBaseLocation(newValue);
            setBaseLocationName(newValue.label);
            setLat(newValue.lat);
            setLng(newValue.lng);
        } else {
            setBaseLocation(null);
        }
        setBaseOptions([]);
    };
    const handleLatLngChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setLatLng(value);
    
        const [inputLat, inputLng] = value.split(',').map(coord => coord.trim());
    
        // Validate and parse latitude and longitude
        const parsedLat = parseFloat(inputLat);
        const parsedLng = parseFloat(inputLng);
    
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
            setLat(parsedLat.toString());
            setLng(parsedLng.toString());
        } 
    };
    
  return (
        <div className="base-location-form-container">
            <form onSubmit={handleFormSubmit} className="base-location-form">
                <div className="form-group">
                    <label htmlFor="baseLocationName">Base Location Name:</label>
                    <Autocomplete
                        value={baseLocation}
                        onInputChange={(event, newInputValue) => {
                            setBaseLocationName(newInputValue);
                            if (newInputValue) {
                                getAutocompleteResults(newInputValue, setBaseOptions);
                            } else {
                                setBaseOptions([]);
                            }
                        }}
                        onChange={handleBaseChange}
                        sx={{ width: 300 }}
                        options={baseOptions}
                        getOptionLabel={(option) => option.label}
                        isOptionEqualToValue={(option, value) => option.label === value.label}
                        renderInput={(params) => <TextField {...params} label="Search Base Location" variant="outlined" />}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="manualLocationName">Manual Base Location Name:</label>
                    <TextField
                        id="manualLocationName"
                        variant="outlined"
                        fullWidth
                        value={baseLocationName}
                        onChange={(e) => setBaseLocationName(e.target.value)}
                    />
            <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(baseLocationName)}`}
            target="_blank"
            rel="noopener noreferrer"
        >
            <IconMapPin />
        </a>

                </div>

                <div className="form-group">
                    <label htmlFor="lat">Latitude:</label>
                    <TextField
                        label="Latitude, Longitude"
                        value={latLng}
                        onChange={handleLatLngChange}
                        placeholder="e.g., 40.7128, -74.0060"
                        fullWidth
                        variant="outlined"
                    />
                </div>

                {/* <div className="form-group">
                    <label htmlFor="lng">Longitude:</label>
                    <TextField
                        id="lng"
                        variant="outlined"
                        fullWidth
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                    />
                </div> */}

                <button type="submit" className="btn btn-primary">
                    {editing ? 'Update Base Location' : 'Save Base Location'}
                </button>
            </form>

            {savedBaseLocation && (
                <div className="base-location-details">
                    <h3>Base Location Details</h3>
                    <p>
                        <strong>Location:</strong> {savedBaseLocation.name}
                    </p>
                    <p>
                        <strong>Coordinates:</strong> ({savedBaseLocation.lat}, {savedBaseLocation.lng})
                    </p>
                </div>
            )}

            <div className="table-responsive mb-5">
                <table>
                    <thead>
                        <tr>
                            <th>Id</th>
                            <th>Location</th>
                            <th>Latitude</th>
                            <th>Longitude</th>
                            <th className="!text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={item.id}>
                                <td>{index + 1}</td>
                                <td>
                                    <div className="whitespace-nowrap">{item.name}</div>
                                </td>
                                <td>
                                    <div className="whitespace-nowrap">{item.lat}</div>
                                </td>
                                <td>
                                    <div className="whitespace-nowrap">{item.lng}</div>
                                </td>
                                <td>
                                    <div className="whitespace-nowrap flex justify-center items-center gap-2">
                                        <Tippy content="Edit" animation="fade">
                                            <button className="btn btn-info btn-icon" onClick={() => handleEdit(item)}>
                                                <IconPencil />
                                            </button>
                                        </Tippy>
                                        <Tippy content="Delete" animation="fade">
                                            <button className="btn btn-danger btn-icon" onClick={() => handleDelete(item.id)}>
                                                <IconTrashLines />
                                            </button>
                                        </Tippy>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BaseLocation;
