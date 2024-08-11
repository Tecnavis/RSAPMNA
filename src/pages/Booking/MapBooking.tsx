import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Autocomplete, TextField, Box, Button, Typography } from '@mui/material';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { GoogleMap, useGoogleMap } from '@react-google-maps/api';
import ReactModal from 'react-modal';
import { v4 as uuid } from 'uuid';
import { query, where } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import MyMapComponent from './MyMapComponent';
import VehicleSection from './VehicleSection';
import IconPlus from '../../components/Icon/IconPlus';
import ShowroomModal from './ShowroomModal';
import BaseLocationModal from '../BaseLocation/BaseLocationModal';
import IconMapPin from '../../components/Icon/IconMapPin';
import Select from 'react-select';
import useGoogleMaps from './GoogleMaps';
import MapView from './Map';
import { backgroundClip } from 'html2canvas/dist/types/css/property-descriptors/background-clip';
interface Showroom {
    id: string;
    name: string;
}

const MapBooking = () => {
    const db = getFirestore();
    const navigate = useNavigate();
    const [bookingId, setBookingId] = useState<string>('');
    useEffect(() => {
        const newBookingId = uuid().substring(0, 6);
        setBookingId(newBookingId);
    }, []);
    const googleMapsLoaded = useGoogleMaps();
    const [updatedTotalSalary, setUpdatedTotalSalary] = useState(0);
    const [companies, setCompanies] = useState([]);
    const [pickupLocationFormatted, setPickupLocationFormatted] = useState('');
    const [totalDriverDistance, setTotalDriverDistance] = useState(0);

    const [bookingDetails, setBookingDetails] = useState({
        company: '',
        fileNumber: '',
        customerName: '',
        phoneNumber: '',
        mobileNumber: '',
        totalSalary: '',
        serviceType: '',
        serviceVehicle: '',
        vehicleType: '',

        driver: '',
        vehicleNumber: '',
        vehicleModel: '',
        vehicleSection: '',
        comments: '',
    });
    const { state } = useLocation();
    const [map, setMap] = useState(null);
    const [isModalOpen1, setIsModalOpen1] = useState(false);
    const openModal1 = () => setIsModalOpen1(true);
    const closeModal1 = () => setIsModalOpen1(false);
    const [Location, setLocation] = useState('');
    const [vehicleType, setVehicleType] = useState('');

    const [comments, setComments] = useState('');
    const [fileNumber, setFileNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [company, setCompany] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [serviceVehicle, setServiceVehicle] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [vehicleSection, setVehicleSection] = useState('');
    const [showShowroomModal, setShowShowroomModal] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [serviceDetails, setServiceDetails] = useState('');
    const [serviceType, setServiceType] = useState('');
    const [totalDriverSalary, setTotalDriverSalary] = useState(0);

    const [pickupLocation, setPickupLocation] = useState('');
    const [dropoffLocation, setDropoffLocation] = useState('');
    const [pickupOptions, setPickupOptions] = useState([]);
    const [pickupCoords, setPickupCoords] = useState({ lat: undefined, lng: undefined });

    const [baseLocation, setBaseLocation] = useState(null);
    console.log('baseLocationpickupLocation', baseLocation);

    const [trappedLocation, setTrappedLocation] = useState('');
    const [totalSalary, setTotalSalary] = useState(0);
    const [showroomLocation, setShowroomLocation] = useState('');
    const [insuranceAmountBody, setInsuranceAmountBody] = useState(0);
    const [showrooms, setShowrooms] = useState<Showroom[]>([]);
    const [distance, setDistance] = useState('');
    const [drivers, setDrivers] = useState([]);
    const [editData, setEditData] = useState(null);
    const [serviceTypes, setServiceTypes] = useState([]);
    const [showRooms, setShowRooms] = useState([]);
    const [manualDistance, setManualDistance] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState([]);
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [manualInput, setManualInput] = useState(pickupLocation ? pickupLocation.name : '');
    const [disableFields, setDisableFields] = useState(false); // State to control field disabling
    const [pickupDistances, setPickupDistances] = useState([]);
    console.log('totalSalary', totalSalary);
  const [errors, setErrors] = useState({});
    const [serviceCategory, setServiceCategory] = useState('');
    const [legDistances, setLegDistances] = useState([]);
    const [availableServices, setAvailableServices] = useState('');
    const [adjustValue, setAdjustValue] = useState('');
const [bodyShope, setBodyShope]= useState('');
    useEffect(() => {
        if (state && state.editData) {
            const editData = state.editData;
            setEditData(editData);
            setBookingId(editData.bookingId || '');
            setTrappedLocation(editData.trappedLocation || '');
            setInsuranceAmountBody(editData.insuranceAmountBody || '');
            console.log('Insurance Amount Body:state', editData.insuranceAmountBody);
            setComments(editData.comments || '');
            setFileNumber(editData.fileNumber || '');
            setCompany(editData.company || '');
            setCustomerName(editData.customerName || '');
            setPhoneNumber(editData.phoneNumber || '');
            setMobileNumber(editData.mobileNumber || '');
            setVehicleNumber(editData.vehicleNumber || '');
            setServiceVehicle(editData.serviceVehicle || '');
            setVehicleType(editData.vehicleType || '');
            setAdjustValue(editData.adjustValue || '');
            setServiceCategory(editData.serviceCategory || '');
            setAvailableServices(editData.availableServices || '');
            setVehicleModel(editData.vehicleModel || '');
            setVehicleSection(editData.vehicleSection || '');
            setShowroomLocation(editData.showroomLocation || '');
            setDistance(editData.distance || '');
            console.log("editData.distance", editData.distance);
            setBodyShope(editData.bodyShope || '');
            console.log("editData.bodyShope",editData.bodyShope)
            setSelectedDriver(editData.selectedDriver || '');
            setBaseLocation(editData.baseLocation || '');
            setShowrooms(editData.showrooms || []);
            if (editData.pickupLocation && typeof editData.pickupLocation === 'object') {
                const { name, lat, lng } = editData.pickupLocation;
                setPickupLocation(`${name}, ${lat}, ${lng}`);
                setPickupCoords({ lat, lng });
            } else {
                setPickupLocation(editData.pickupLocation || '');
            }            
            setTotalDriverDistance(editData.totalDriverDistance || '');
            setAvailableServices(editData.availableServices || '');
            setShowRooms(editData.showRooms || '');
            setUpdatedTotalSalary(editData.updatedTotalSalary || '');
            setDistance(editData.distance || '');
            setServiceType(editData.serviceType || '');
            setTotalSalary(editData.totalSalary || 0);
            setDropoffLocation(editData.dropoffLocation || '');
            setSelectedCompany(editData.selectedCompany || '');
        }
    }, [state]);
    
    useEffect(() => {
        const now = new Date();
        const formattedDateTime = now.toLocaleString();
        setCurrentDateTime(formattedDateTime);
    }, []);
    useEffect(() => {
        setManualInput(pickupLocation ? pickupLocation.name : '');
    }, [pickupLocation]);
    useEffect(() => {
        if (trappedLocation === 'outsideOfRoad') {
            setDisableFields(true);
        } else {
            setDisableFields(false);
        }
    }, [trappedLocation]);
    const validateForm = () => {
        let tempErrors = {};
        let isValid = true;

        if (!phoneNumber.trim()) {
            tempErrors['phoneNumber'] = 'Phone number is required';
            isValid = false;
        } else if (!/^\d{10}$/.test(phoneNumber)) {
            tempErrors['phoneNumber'] = 'Phone number is invalid, must be 10 digits';
            isValid = false;
        }
        if (!mobileNumber.trim()) {
            tempErrors['mobileNumber'] = 'Mobile number is required';
            isValid = false;
        } else if (!/^\d{10}$/.test(phoneNumber)) {
            tempErrors['mobileNumber'] = 'Mobile number is invalid, must be 10 digits';
            isValid = false;
        }

        setErrors(tempErrors);
        return isValid;
    };
    useEffect(() => {
        if (company === 'rsa') {
            const fetchCompanies = async () => {
                try {
                    const driverCollection = collection(db, 'driver');
                    const q = query(driverCollection, where('companyName', '==', 'Company'));
                    const querySnapshot = await getDocs(q);
                    const fetchedCompanies = querySnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Company[];

                    const deletedItemIds = JSON.parse(localStorage.getItem('deletedItems') || '[]');
                    console.log('deletedItemIds', deletedItemIds);
                    const filteredCompanies = fetchedCompanies.filter((company) => !deletedItemIds.includes(company.id));
                    console.log('filteredCompanies', filteredCompanies);
                    setCompanies(filteredCompanies);
                } catch (error) {
                    console.error('Error fetching companies:', error);
                }
            };

            fetchCompanies();
        }
    }, [company, db]);

  
    const handleUpdatedTotalSalary = (newTotalSalary) => {
        setUpdatedTotalSalary(newTotalSalary);
    };

   
    useEffect(() => {
        if (selectedDriver) {
            const selectedDriverData = drivers.find((driver) => driver.id === selectedDriver);
            console.log('selectedDriverData', selectedDriverData);

            if (selectedDriverData) {
                if (selectedDriverData.serviceVehicle) {
                    setServiceVehicle(renderServiceVehicle(selectedDriverData.serviceVehicle, serviceType));
                }
            } else {
                console.error('Driver not found:', selectedDriver);
            }
        }
    }, [selectedDriver, serviceType, drivers]);

    const handleUpdateTotalSalary = (newTotalSalary) => {
        console.log("newTotalSalary",newTotalSalary)
        setUpdatedTotalSalary(newTotalSalary);
    };

    const handleInsuranceAmountBodyChange = (amount) => {
        console.log("firstamount",amount)
        setInsuranceAmountBody(amount);

    };
    const handleAdjustValueChange = (newAdjustValue) => {
        console.log('Adjust Valuee:', newAdjustValue);
        setAdjustValue(newAdjustValue);
    };
    const handleServiceCategoryChange = (service) => {
        setServiceCategory(service);
    };
const handleBodyInsuranceChange =(insurance) =>{
    console.log("firstinsurance",insurance)
setBodyShope(insurance)
}
    const handleInputChange = (field, value) => {
        switch (field) {
            case 'showroomLocation':
                console.log('Setting showroomLocation:', value);
                setShowroomLocation(value);
    
                // Find the selected showroom based on the selected value
                const selectedShowroom = showrooms.find((show) => show.value === value);
                console.log('Selected Showroom:', selectedShowroom);
    
                if (selectedShowroom) {
                    console.log('Found showroom:', selectedShowroom.value);
                    console.log('Setting insuranceAmountBody to:', selectedShowroom.insuranceAmountBody);
                    setInsuranceAmountBody(selectedShowroom.insuranceAmountBody);
    
                    console.log('Setting dropoffLocation to:', {
                        name: selectedShowroom.value,
                        lat: selectedShowroom.locationLatLng.lat,
                        lng: selectedShowroom.locationLatLng.lng,
                    });
                    setDropoffLocation({
                        name: selectedShowroom.value,
                        lat: selectedShowroom.locationLatLng.lat,
                        lng: selectedShowroom.locationLatLng.lng,
                    });
                } else {
                    console.log('No showroom found, resetting values');
                    setInsuranceAmountBody('');
                    setDropoffLocation({
                        name: '',
                        lat: null,
                        lng: null,
                    });
                }
                break;
            case 'totalSalary':
                setTotalSalary(value || 0);
                const newCalculatedSalary = value - parseFloat(insuranceAmountBody);
                handleUpdatedTotalSalary(newCalculatedSalary);
                break;
            case 'insuranceAmountBody':
                setInsuranceAmountBody(value || 0);
                const recalculatedTotalSalary = totalSalary - parseFloat(value);
                handleUpdatedTotalSalary(recalculatedTotalSalary);
                break;
            case 'adjustValue':
                setAdjustValue(value || '');

                break;
            case 'customerName':
                setCustomerName(value || '');
                break;
                case 'showRooms':
                    setShowRooms(value || '');
                    break;
                
            case 'company':
                setCompany(value);
                setFileNumber(value === 'self' ? bookingId : '');
                break;
            case 'vehicleType':
                setVehicleType(value || '');
                break;
            case 'fileNumber':
                setFileNumber(value || '');
                break;
            case 'selectedCompany':
                setSelectedCompany(value || '');
                break;
            case 'selectedDriver':
                setSelectedDriver(value || '');
                console.log('Selected Driver ID:', value);

                const selectedDriverData = drivers.find((driver) => driver.id === value);
                console.log('Selected Driver Dataaa:', selectedDriverData);
                if (selectedDriverData) {
                    const calculatedSalary = calculateTotalSalary(serviceDetails.salary, distance, serviceDetails.basicSalaryKM, serviceDetails.salaryPerKM);
                    console.log('Calculated Salary:', calculatedSalary);

                    setTotalSalary(calculatedSalary);
                }
                break;
            case 'companies':
                setCompanies(value || '');
                break;
            case 'bookingId':
                setBookingId(value || '');
                break;
            case 'comments':
                setComments(value || '');
                break;
            case 'vehicleNumber':
                setVehicleNumber(value || '');
                break;

            case 'updatedTotalSalary':
                console.log('updatedTotalSalary', updatedTotalSalary);
                setUpdatedTotalSalary(value || '');
                break;
                case 'totalDriverDistance':
                    setTotalDriverDistance(value || 0);
                    break;
            case 'distance':
                console.log('eeee', distance);

                setDistance(value || '');
                break;
            case 'serviceVehicle':
                setServiceVehicle(value);
                break;

            case 'dropoffLocation':
                if (typeof value === 'string') {
                    setDropoffLocation({ ...dropoffLocation, name: value });
                } else {
                    setDropoffLocation({ ...dropoffLocation, name: value.name });
                }
                break;
            case 'mobileNumber':
                setMobileNumber(value || '');
                break;
            case 'phoneNumber':
                setPhoneNumber(value || '');
                break;
            case 'pickupLocation':
                console.log('pickupLocation', pickupLocation);
                setPickupLocation(value || '');
                break;

            case 'vehicleSection':
                setVehicleSection(value || '');
                break;
            case 'vehicleModel':
                setVehicleModel(value || '');
                break;
            case 'baseLocation':
                setBaseLocation(value || '');
                break;
                case 'bodyShope':
                    setBodyShope(value || '');
                    break;
            case 'trappedLocation':
                setDisableFields(value === 'outsideOfRoad'); // Disable fields if trappedLocation is 'outsideOfRoad'

                setTrappedLocation(value || '');
                break;
                case 'availableServices':
                    setAvailableServices(value || 0);
     
                    break;
                
            case 'showrooms':
                setShowrooms(value || '');
                break;
            default:
                break;
        }

        if (field === 'distance') {
            openModal(value);
        } else if (field === 'serviceType') {
            setServiceType(value || '');
            openModal();
        } else if (field === 'selectedDriver') {
            setSelectedDriver(value || '');
        }
        handleCalculateDistance();
    };
    const openModal = () => {
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
    };
   
    const updateShowroomLocation = (location) => {
        setShowroomLocation(location);
    };
    useEffect(() => {
        const fetchShowroomOptions = async () => {
            try {
                const db = getFirestore();
                const serviceCollection = collection(db, 'showroom');
                const serviceSnapshot = await getDocs(serviceCollection);
                const servicesList = serviceSnapshot.docs.map(doc => ({
                    value: doc.data().Location, // Assuming 'Location' is a unique identifier
                    label: doc.data().Location,
                    insuranceAmountBody: doc.data().insuranceAmountBody, // Make sure to include this
                    locationLatLng: doc.data().locationLatLng // Make sure to include this
                }));
                setShowrooms(servicesList);
            } catch (error) {
                console.error('Error fetching services:', error);
            }
        };

        fetchShowroomOptions();
    }, []);
    useEffect(() => {
        const fetchServiceTypes = async () => {
            try {
                const serviceCollection = collection(db, 'service');
                const snapshot = await getDocs(serviceCollection);
                const services = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setServiceTypes(services);
            } catch (error) {
                console.error('Error fetching service types:', error);
            }
        };

        fetchServiceTypes();
    }, [db]);

    useEffect(() => {
        const db = getFirestore();
        const unsubscribe = onSnapshot(collection(db, 'showroom'), (snapshot) => {
            const showrooms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setShowRooms(showrooms);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchDrivers = async () => {
            if (!serviceType || !serviceDetails) {
                console.log('Service details not found, cannot proceed with fetching drivers.');
                setDrivers([]);
                return;
            }
    
            try {
                const driversCollection = collection(db, 'driver');
                const snapshot = await getDocs(driversCollection);
    
                // Fetch deleted driver IDs from localStorage using the correct key
                const deletedItemIds = JSON.parse(localStorage.getItem('deletedUserIds') || '[]');
                console.log('Deleted Driver IDs:', deletedItemIds);
    
                const filteredDrivers = snapshot.docs
                    .map((doc) => {
                        const driverData = doc.data();
                        // Only include drivers who have the selected service type and are not deleted
                        if (!driverData.selectedServices.includes(serviceType) || deletedItemIds.includes(doc.id)) {
                            return null;
                        }
    
                        return {
                            id: doc.id,
                            ...driverData,
                        };
                    })
                    .filter(Boolean); // Remove null entries
    
                setDrivers(filteredDrivers);
                console.log('Filtered Drivers:', filteredDrivers);
            } catch (error) {
                console.error('Error fetching drivers:', error);
            }
        };
    
        if (serviceType && serviceDetails) {
            fetchDrivers().catch(console.error);
        } else {
            setDrivers([]);
        }
    }, [db, serviceType, serviceDetails]);
    

    useEffect(() => {
        const fetchServiceDetails = async () => {
            if (!serviceType) {
                console.log('No service type selected');
                setServiceDetails({});
                return;
            }

            try {
                const serviceQuery = query(collection(db, 'service'), where('name', '==', serviceType));
                const snapshot = await getDocs(serviceQuery);
                if (snapshot.empty) {
                    console.log('No matching service details found.');
                    setServiceDetails({});
                    return;
                }
                const details = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))[0];
                setServiceDetails(details);
            } catch (error) {
                console.error('Error fetching service details:', error);
                setServiceDetails({});
            }
        };

        fetchServiceDetails();
    }, [db, serviceType]);

    const fetchTravelDistance = async (origin, destination, id) => {
        if (!origin || !destination) {
            console.error('Invalid origin or destination:', { origin, destination });
            return { id, distance: null, duration: null };
        }

        console.log('Fetching travel distance from OLA Maps API');
        console.log('Origin:', origin);
        console.log('Destination:', destination);

        try {
            console.log('Preparing axios request...');
            const response = await axios.post('https://api.olamaps.io/routing/v1/directions', null, {
                params: {
                    origin: `${origin.lat},${origin.lng}`,
                    destination: `${destination.lat},${destination.lng}`,
                    api_key: import.meta.env.VITE_REACT_APP_API_KEY,
                },
                headers: {
                    'X-Request-Id': `${id}-${Date.now()}`, // Unique request ID
                },
            });

            console.log('API response received');

            if (response.status === 200) {
                const data = response.data;
                console.log('Distance response:', data);

                if (data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    console.log('Route:', route);

                    if (route.legs && route.legs.length > 0) {
                        const leg = route.legs[0];
                        console.log('Leg:', leg);

                        const distanceInf = {
                            id,
                            distance: leg.distance !== undefined ? (leg.distance / 1000).toFixed(2) : null, // Convert to km and format
                            duration: formatDuration(leg.duration !== undefined ? leg.duration : null), // Convert to readable format
                        };

                        console.log('Distance infooo:', distanceInf);
                        return distanceInf;
                    } else {
                        console.error('No legs found in the route:', route);
                        return { id, distance: null, duration: null };
                    }
                } else {
                    console.error('No routes found in the response:', data);
                    return { id, distance: null, duration: null };
                }
            } else {
                console.error('Error fetching directions:', response.statusText);
                return { id, distance: null, duration: null };
            }
        } catch (error) {
            console.error('Error fetching distance data:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                console.error('Response headers:', error.response.headers);
            } else if (error.request) {
                console.error('Request data:', error.request);
            } else {
                console.error('Error message:', error.message);
            }
            return { id, distance: null, duration: null };
        }
    };
    const calculateTotalSalary = (salary, distance, basicSalaryKM, salaryPerKM) => {
        const numericBasicSalary = Number(salary) || 0;
        const numericTotalDistance = Number(distance) || 0;
        const numericKmValueNumeric = Number(basicSalaryKM) || 0;
        const numericPerKmValueNumeric = Number(salaryPerKM) || 0;
        console.log('numericBasicSalary', numericBasicSalary);
        console.log('numericTotalDistance', numericTotalDistance);

        console.log('numericKmValueNumeric', numericKmValueNumeric);

        console.log('numericPerKmValueNumeric', numericPerKmValueNumeric);

        if (numericTotalDistance > numericKmValueNumeric) {
            return numericBasicSalary + (numericTotalDistance - numericKmValueNumeric) * numericPerKmValueNumeric;
        } else {
            return numericBasicSalary;
        }
    };

    useEffect(() => {
        
        const fetchDrivers = async () => {
            console.log('Fetching drivers from Firestore');
            try {
                const driversCollection = collection(db, 'driver');
                const snapshot = await getDocs(driversCollection);
                console.log('Firestore snapshot:', snapshot);

                if (!serviceDetails) {
                    console.log('Service details not found, cannot proceed with fetching drivers.');
                    return;
                }

                const filteredDrivers = snapshot.docs
                    .map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }))
                    .filter((driver) => driver.selectedServices && driver.selectedServices.includes(serviceType));

                console.log('Filtered drivers:', filteredDrivers);

                const distancePromises = filteredDrivers.map(async (driver) => {
                    console.log('Processing driver:', driver);

                    if (driver.currentLocation && driver.currentLocation.latitude && driver.currentLocation.longitude) {
                        const origin = {
                            lat: driver.currentLocation.latitude,
                            lng: driver.currentLocation.longitude,
                        };

                        if (pickupLocation) {
                            const [locationName, lat, lng] = pickupLocation.split(',').map((part) => part.trim());
                            const parsedPickupLocation = {
                                lat: parseFloat(lat),
                                lng: parseFloat(lng),
                            };
                            console.log('Parsed Pickup Location:', parsedPickupLocation);

                            if (!isNaN(parsedPickupLocation.lat) && !isNaN(parsedPickupLocation.lng)) {
                                const destination = {
                                    lat: parsedPickupLocation.lat,
                                    lng: parsedPickupLocation.lng,
                                };
                                console.log('Origin for driver:', origin);
                                console.log('Destination for driver:', destination);

                                const distanceData = await fetchTravelDistance(origin, destination, driver.id);
                                console.log('Distance and duration for driver:', distanceData);
                                return distanceData;
                            } else {
                                console.error('Parsed pickup location is invalid:', parsedPickupLocation);
                            }
                        } else {
                            console.error('Pickup location is not defined');
                        }
                    } else {
                        console.log('Driver does not have a valid current location');
                    }
                    return { id: driver.id, distance: 0, duration: 0 };
                });

                const resolvedDistances = await Promise.all(distancePromises);
                console.log('Resolved distances:', resolvedDistances);

                setPickupDistances(resolvedDistances);
                setDrivers(filteredDrivers);
            } catch (error) {
                console.error('Error fetching drivers:', error);
            }
        };

        if (serviceType && serviceDetails) {
            console.log('Fetching drivers based on service type and service details');
            fetchDrivers().catch(console.error);
        } else {
            console.log('Service type or service details not available');
            setDrivers([]);
        }
    }, [serviceType, serviceDetails, pickupLocation]);

    console.log('Effect dependencies:', { serviceType, serviceDetails, pickupLocation });

    const renderServiceVehicle = (serviceVehicle, serviceType) => {
        if (serviceVehicle && serviceVehicle[serviceType]) {
            return serviceVehicle[serviceType];
        } else {
            return 'Unknown Vehicle';
        }
    };
    // ----------------------------------------------------------------------------
    const calculateTotalDriverSalary = (totalDriverDistance, basicSalaryKM, salaryPerKM, salary) => {
        totalDriverDistance = parseFloat(totalDriverDistance);
        basicSalaryKM = parseFloat(basicSalaryKM);
        salaryPerKM = parseFloat(salaryPerKM);
        salary = parseFloat(salary);

        if (totalDriverDistance > basicSalaryKM) {
            return salary + (totalDriverDistance - basicSalaryKM) * salaryPerKM;
        } else {
            return salary;
        }
    };

    useEffect(() => {
        if (selectedDriver && Array.isArray(drivers)) {
            const selectedDriverData = drivers.find((driver) => driver.id === selectedDriver);
            console.log('Selected Driver Dataaa:', selectedDriverData);

            if (selectedDriverData) {
                // Access the nested properties
                const { basicSalaryKm, salaryPerKm, basicSalaries } = selectedDriverData;

                if (!basicSalaryKm || !salaryPerKm || !basicSalaries) {
                    console.error('Selected driver does not have all required properties:', selectedDriverData);
                    return;
                }

                // Assuming you want to use the selected service from the selectedDriverData
                const selectedService = selectedDriverData.selectedServices[0]; // Adjust as needed
                const basicSalaryKM = basicSalaryKm[selectedService];
                const salaryPerKM = salaryPerKm[selectedService];
                const salary = basicSalaries[selectedService];

                if (basicSalaryKM === undefined || salaryPerKM === undefined || salary === undefined) {
                    console.error('Selected service does not have all required properties:', {
                        basicSalaryKM,
                        salaryPerKM,
                        salary,
                    });
                    return;
                }

                console.log('DistanceDistance::', totalDriverDistance);
                console.log('Basic Salary KMmm:', basicSalaryKM);
                console.log('Salary per KMmm:', salaryPerKM);
                console.log('Base Salaryyy:', salary);
                if (distance < basicSalaryKM) {
                    console.log('Distance is less than Basic Salary KM. Returning Base Salary:', salary);
                    setTotalDriverSalary(salary); // If distance is less than basicSalaryKM, return the base salary
                }
                const calculatedSalary = calculateTotalDriverSalary(totalDriverDistance, basicSalaryKM, salaryPerKM, salary);

                console.log('Setting Total Driver Salary:', calculatedSalary);
                setTotalDriverSalary(calculatedSalary);
            } else {
                console.error('Driver not found:', selectedDriver);
            }
        }
    }, [selectedDriver, totalDriverDistance, drivers]);

   
    // -------------------------------------------------------------------------------------
    const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
        const year = date.getFullYear();
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');

        return `${day}/${month}/${year}, ${formattedHours}:${minutes}:${seconds} ${ampm}`;
    };
    const formatLocation = (location) => {
        const [name, lat, lng] = location.split(', ').map((item) => item.trim());
        return {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            name: `${name}, ${lat}, ${lng}`,
        };
    };

    const addOrUpdateItem = async () => {
        if (validateForm()) {
            try {
                const selectedDriverObject = drivers.find((driver) => driver.id === selectedDriver);
                const driverName = selectedDriverObject ? selectedDriverObject.driverName : '';
                let finalFileNumber = '';
                const currentDate = new Date();
                const dateTime = formatDate(currentDate); // Use the formatted date
                const formattedPickupLocation = formatLocation(pickupLocation);
                // const formattedLegDistances = formatLegDistances(legDistances);

                if (company === 'self') {
                    finalFileNumber = `PMNA${bookingId}`;
                } else if (company === 'rsa') {
                    finalFileNumber = fileNumber;
                }
                const bookingData = {
                    ...bookingDetails,
                    driver: driverName,
                    totalSalary: totalSalary,
                    pickupLocation: formattedPickupLocation,
                    dropoffLocation: dropoffLocation,
                    status: 'booking added',
                    dateTime: dateTime,
                    totalDriverSalary: totalDriverSalary,
                    totalDriverDistance: totalDriverDistance,
                    bookingId: `${bookingId}`,
                    createdAt: serverTimestamp(),
                    comments: comments || '',
                    totalDistance: distance,
                    distance: distance,
                    showRooms: showroomLocation,
                    adjustValue:adjustValue || '',
                    serviceCategory: serviceCategory || '',

                    baseLocation: baseLocation || '',
                    showroomLocation: showroomLocation,
                    Location: Location || '',
                    company: company || '',
                    customerName: customerName || '',
                    mobileNumber: mobileNumber || '',
                    phoneNumber: phoneNumber || '',
                    vehicleType: vehicleType || '',

                    serviceType: serviceType || '',
                    serviceVehicle: serviceVehicle || '',
                    vehicleModel: vehicleModel || '',
                    vehicleSection: vehicleSection || '',
                    vehicleNumber: vehicleNumber || '',
                    fileNumber: finalFileNumber,
                    selectedDriver: selectedDriver || '',
                    trappedLocation: trappedLocation || '',
                    legDistances: legDistances || '',
                    updatedTotalSalary: updatedTotalSalary || '',
                    insuranceAmount: insuranceAmountBody || '',
                    bodyShope: bodyShope || '',
                    paymentStatus: 'Not Paid',
                };
                if (editData) {
                    bookingData.newStatus = 'Edited by Admin';
                    bookingData.editedTime = currentDate.toLocaleString();
                }
                console.log('Data to be added/updated:', bookingData); // Log the data before adding or updating

                if (editData) {
                    const docRef = doc(db, 'bookings', editData.id);
                    await updateDoc(docRef, bookingData);
                    console.log('Document updated');
                } else {
                    const docRef = await addDoc(collection(db, 'bookings'), bookingData);
                    console.log('Document written with ID: ', docRef.id);
                    console.log('Document added');
                }

                navigate('/bookings/newbooking');
            } catch (e) {
                console.error('Error adding/updating document: ', e);
            }
        }
    };

    //-----------------------------------------------------------------
    // Replace with your actual API key
    const getAutocompleteResults = async (inputText, setOptions) => {
        const keralaCenterLat = 10.8505;
        const keralaCenterLng = 76.2711;
        const radius = 200000;
    
        try {
            console.log(`Fetching autocomplete results for input: ${inputText}`);
            const response = await axios.get(`https://api.olamaps.io/places/v1/autocomplete`, {
                params: {
                    input: inputText,
                    api_key: import.meta.env.VITE_REACT_APP_API_KEY,
                    location: `${keralaCenterLat},${keralaCenterLng}`,
                    radius: radius,
                },
            });
            console.log('Autocomplete response:', response.data);
    
            if (response.data && Array.isArray(response.data.predictions)) {
                const predictionsWithCoords = await Promise.all(
                    response.data.predictions.map(async (prediction, index) => {
                        const placeDetails = await getPlaceDetails(prediction.place_id);
                        console.log("locationName", placeDetails);
    
                        const locationName = prediction.description.split(',')[0];
    
                        return {
                            key: `${prediction.place_id}-${index}`,
                            label: locationName,
                            lat: placeDetails.geometry.location.lat,
                            lng: placeDetails.geometry.location.lng,
                            ...prediction,
                        };
                    })
                );
                console.log('Predictions with coordinates:', predictionsWithCoords);
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
            console.log(`Fetching place details for placeId: ${placeId}`);
            const response = await axios.get(`https://api.olamaps.io/places/v1/details`, {
                params: {
                    place_id: placeId,
                    api_key: import.meta.env.VITE_REACT_APP_API_KEY,
                },
            });
            console.log('Place details response:', response.data);
            return response.data.result;
        } catch (error) {
            console.error('Error fetching place details:', error);
            return { geometry: { location: { lat: undefined, lng: undefined } } };
        }
    };

    useEffect(() => {
        console.log('Base location updated:', baseLocation);
    }, [baseLocation]);

    useEffect(() => {
        if (baseLocation && pickupCoords && dropoffLocation) {
            console.log('Dependencies are set. Calculating total distance...');
            calculateTotalDistance(baseLocation, pickupCoords, dropoffLocation);
        }
    }, [baseLocation, pickupCoords, dropoffLocation]);

    const handlePickupChange = (newValue) => {
        console.log('Checking newValue:', newValue);
        console.log('Selected pickup location:', newValue);
    
        const hasLabel = newValue && newValue.label;
        const hasLat = newValue && newValue.lat;
        const hasLng = newValue && newValue.lng;
    
        console.log('newValue exists:', newValue !== undefined && newValue !== null);
        console.log('newValue.label exists:', hasLabel);
        console.log('newValue.lat exists:', hasLat);
        console.log('newValue.lng exists:', hasLng);
    
        if (hasLabel && hasLat && hasLng) {
            const formattedLocation = `${newValue.label}, ${newValue.lat}, ${newValue.lng}`;
            console.log('Setting pickup location formatted...');
            setPickupLocationFormatted(newValue.label);
            console.log('Pickup location formatted:', newValue.label);
    
            console.log('Setting pickup coordinates...');
            setPickupCoords({ lat: newValue.lat, lng: newValue.lng });
            console.log('Pickup coordinates:', { lat: newValue.lat, lng: newValue.lng });
    
            console.log('Setting pickup location...');
            setPickupLocation(formattedLocation);
            console.log('Pickup location:', formattedLocation);
    
            console.log('Base location before check:', baseLocation);
            if (baseLocation) {
                console.log('Base location is set in pick:', baseLocation);
                if (dropoffLocation) {
                    console.log('Dropoff location is set:', dropoffLocation);
                    console.log('Calculating total distance...');
                    console.log('Before calculating distance, baseLocation:', baseLocation);
    
                    calculateTotalDistance(baseLocation, { lat: newValue.lat, lng: newValue.lng }, dropoffLocation);
                } else {
                    console.log('Dropoff location is not set');
                }
            } else {
                console.log('Base location is not set');
            }
        } else {
            console.log('Resetting pickup coordinates and formatted location...');
            setPickupCoords({ lat: undefined, lng: undefined });
            setPickupLocationFormatted('');
        }
    
        console.log('Clearing pickup options...');
        setPickupOptions([]);
    };
    
    const calculateTotalDistance = async (base, pickup, dropoff) => {
        try {
            console.log('Calculating total distance...');
            console.log('Base locationnnn:', base);
            console.log('Pickup locationnnnn:', pickup);
            console.log('Dropoff locationnn:', dropoff);

            const distances = await Promise.all([
                getDistanceAndDuration(base, pickup, 'base_to_pickup'),
                getDistanceAndDuration(pickup, dropoff, 'pickup_to_dropoff'),
                getDistanceAndDuration(dropoff, base, 'dropoff_to_base'),
            ]);

            console.log('Distancesccg:', distances);

            const totalDistance = distances.reduce((acc, cur) => acc + (cur.distance ? parseFloat(cur.distance) : 0), 0);
            console.log('Total distance calculated:', totalDistance);
    
            const newTotalDistance = totalDistance.toFixed(2);
            console.log('Total distance set:', newTotalDistance);
            console.log("pickupLocationdistance",distance);

            setDistance(newTotalDistance);
    
        } catch (error) {
            console.error('Error calculating total distance:', error);
        }
    };

    const getDistanceAndDuration = async (origin, destination, id) => {
        if (!origin || !destination) {
            console.log(`Invalid origin or destination for ${id}:`, origin, destination);
            return { id, distance: null, duration: null };
        }

        try {
            console.log(`Fetching distance between ${JSON.stringify(origin)} and ${JSON.stringify(destination)} for ${id}...`);
            const response = await axios.post(`https://api.olamaps.io/routing/v1/directions`, null, {
                params: {
                    origin: `${origin.lat},${origin.lng}`,
                    destination: `${destination.lat},${destination.lng}`,
                    api_key: import.meta.env.VITE_REACT_APP_API_KEY,
                },
            });

            if (response.status === 200) {
                const data = response.data;
                console.log(`Distance response for ${id}:`, data);

                if (data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    console.log(`Route for ${id}:`, route);

                    if (route.legs && route.legs.length > 0) {
                        const leg = route.legs[0];
                        console.log(`Leg for ${id}:`, leg);

                        const distanceInfo = {
                            id,
                            distance: leg.distance ? (leg.distance / 1000).toFixed(2) : null,
                            duration: formatDuration(leg.duration ? leg.duration : null),
                        };

                        console.log(`Distance info for ${id}:`, distanceInfo);
                        return distanceInfo;
                    } else {
                        console.error(`No legs found in the route for ${id}:`, route);
                        return { id, distance: null, duration: null };
                    }
                } else {
                    console.error(`No routes found in the response for ${id}:`, data);
                    return { id, distance: null, duration: null };
                }
            } else {
                console.error(`Error fetching directions for ${id}:`, response.statusText);
                return { id, distance: null, duration: null };
            }
        } catch (error) {
            console.error(`Error fetching distance data for ${id}:`, error);
            return { id, distance: null, duration: null };
        }
    };

    const formatDuration = (seconds) => {
        if (seconds === null) return 'Calculating...';

        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
        } else {
            return `${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
        }
    };

    useEffect(() => {
        console.log('Formatted Pickup Location:', pickupLocationFormatted);
    }, [pickupLocationFormatted]);
    // --------------------------------------------------------------------
    const normalizeLocation = (location) => {
        if (location && typeof location === 'object') {
            if (location.hasOwnProperty('lat') && location.hasOwnProperty('lng')) {
                return { lat: location.lat, lng: location.lng };
            }
            if (location._lat !== undefined && location._long !== undefined) {
                return { lat: location._lat, lng: location._long };
            }
        } else if (typeof location === 'string') {
            const match = location.match(/([+-]?\d+(\.\d+)?),\s*([+-]?\d+(\.\d+)?)/);
            if (match) {
                return { lat: parseFloat(match[1]), lng: parseFloat(match[3]) };
            }
        }

        console.error('Invalid location format', location);
        return { lat: 0, lng: 0 };
    };

    console.log('Normalized Pickup Location:', normalizeLocation(pickupLocation));
    console.log('Normalized Dropoff Location:', normalizeLocation(dropoffLocation));

    const getDistance = async (origin, destination) => {
        if (!origin || !destination) {
            console.error('Invalid origin or destination:', origin, destination);
            return null;
        }

        try {
            console.log(`Fetching distance between ${JSON.stringify(origin)} and ${JSON.stringify(destination)}...`);

            const response = await axios.post(`https://api.olamaps.io/routing/v1/directions`, null, {
                params: {
                    origin: `${origin.lat},${origin.lng}`,
                    destination: `${destination.lat},${destination.lng}`,
                    api_key: import.meta.env.VITE_REACT_APP_API_KEY, // Replace with your API key handling
                },
            });

            if (response.status === 200) {
                const data = response.data;
                console.log('Distance response:', data);

                if (data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    console.log('Route:', route);

                    if (route.legs && route.legs.length > 0) {
                        const leg = route.legs[0];
                        console.log('Leg:', leg);

                        console.log('Leg distance raw:', leg.distance);
                        console.log('Leg distance readable:', leg.readable_distance);

                        const distance = leg.distance ? (leg.distance / 1000).toFixed(2) : null;
                        console.log('Ddistance:', distance);

                        return parseFloat(distance); // Return distance as a number
                    } else {
                        console.error('No legs found in the route:', route);
                        return null;
                    }
                } else {
                    console.error('No routes found in the response:', data);
                    return null;
                }
            } else {
                console.error('Error fetching directions:', response.statusText);
                return null;
            }
        } catch (error) {
            console.error('Error fetching distance data:', error);
            return null;
        }
    };
    const calculateTotalDriverDistance = async (driverLocation, pickupLocation, dropoffLocation) => {
        driverLocation = normalizeLocation(driverLocation);
        pickupLocation = normalizeLocation(pickupLocation);
        dropoffLocation = normalizeLocation(dropoffLocation);

        console.log('Normalized Driver Location:', driverLocation);
        console.log('Normalized Pickup Location:', pickupLocation);
        console.log('Normalized Dropoff Location:', dropoffLocation);

        try {
            const distanceToPickup = await getDistance(driverLocation, pickupLocation);
            console.log('Distance to Pickup:', distanceToPickup);

            const distanceToDropoff = await getDistance(pickupLocation, dropoffLocation);
            console.log('Distance to Dropoff:', distanceToDropoff);

            const distanceToReturn = await getDistance(dropoffLocation, driverLocation);
            console.log('Distance to Return:', distanceToReturn);

            const totalDriverDistance = distanceToPickup + distanceToDropoff + distanceToReturn;
            console.log('Total Driver Distance:', totalDriverDistance);

            setTotalDriverDistance(totalDriverDistance);
        } catch (error) {
            console.error('Error calculating total driver distance:', error);
            return 0;
        }
    };

    const handleCalculateDistance = async () => {
        if (!selectedDriver || !pickupLocation || !dropoffLocation) {
            console.error('Selected driver, pickup location, or dropoff location is missing.');
            return;
        }

        const selectedDriverData = drivers.find((driver) => driver.id === selectedDriver);
        if (!selectedDriverData) {
            console.error('Selected driver not found.');
            return;
        }

        const driverLocation = selectedDriverData.currentLocation;
        console.log('Driver Location from Selected Driver Data:', driverLocation);
 const totalDriverDistance = await calculateTotalDriverDistance(driverLocation, pickupLocation, dropoffLocation);
    console.log('Total Driver Distance (before rounding):', totalDriverDistance);

    // Round and fix the totalDriverDistance to 2 decimal places
    const roundedTotalDriverDistance = parseFloat(totalDriverDistance.toFixed(2));
    console.log('Total Driver Distance (rounded):', roundedTotalDriverDistance);

    };

    useEffect(() => {
        handleCalculateDistance();
    }, [selectedDriver, pickupLocation, dropoffLocation]);
    //------------------------------------------------------
    return (
        <div className="p-1 flex-1 mt-4 mx-24 shadow-lg rounded-lg bg-lightblue-100" style={{ background: 'lightblue' }}>
            <div className="flex justify-end w-full mb-4 ">
                <div
                    style={{
                        margin: '5px 0',
                        color: '#7f8c8d',
                        fontFamily: 'Georgia, serif',
                        fontSize: '16px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#ecf0f1',
                        border: '1px solid #bdc3c7',
                        minWidth: 'fit-content',
                    }}
                >
                    <h5 className="font-semibold text-lg dark:text-white-light">{currentDateTime}</h5>
                </div>
            </div>

            <div className="flex flex-wrap p-4">
                <h5 className="font-semibold text-lg dark:text-white-light mb-5">Book Now</h5>
                <div className="w-full">
                    <div className="flex items-center mt-4">
                        <label htmlFor="company" className="mr-2 ml-2 w-1/3 mb-0 text-gray-800 font-semibold">
                            Company
                        </label>
                        <select
                            id="company"
                            name="company"
                            value={company}
                            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                            onChange={(e) => handleInputChange('company', e.target.value)}
                        >
                            <option value="">Select Company</option>
                            <option value="rsa">RSA Work</option>
                            <option value="self">Payment Work</option>
                        </select>
                    </div>
                    {company === 'rsa' && (
                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
                            <label htmlFor="selectedCompany" style={{ marginRight: '0.5rem', marginLeft: '0.5rem', marginBottom: '0', color: '#333' }}>
                                Select Company
                            </label>
                            <select
                                id="selectedCompany"
                                name="selectedCompany"
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #ccc',
                                    borderRadius: '5px',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                }}
                                onChange={(e) => handleInputChange('selectedCompany', e.target.value)}
                            >
                                <option value="">Select Company</option>
                                {companies.map((comp) => (
                                    <option key={comp.id} value={comp.id}>
                                        {comp.company}
                                    </option>
                                ))}
                            </select>
                            {companies.length === 0 && <p>No companies available</p>}
                        </div>
                    )}
                    {company === 'self' ? (
                        <div className="flex items-center mt-4">
                            <label htmlFor="fileNumber" className="mr-2 ml-2 w-1/3 mb-0 text-gray-800 font-semibold">
                                File Number
                            </label>
                            <div className='search-box ltr:mr-2 rtl:ml-2  mb-0"' style={{width:"100%"}}>
                            <input
                                id="fileNumber"
                                type="text"
                                name="fileNumber"
                                placeholder="Enter File Number"
                                className="form-input lg:w-[250px] w-2/3 p-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100 focus:outline-none"
                                value={`PMNA${bookingId}`}
                                readOnly
                            />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center mt-4">
                            <label htmlFor="fileNumber" className="mr-2 ml-2 w-1/3 mb-0 text-gray-800 font-semibold">
                                File Number
                            </label>
                            <div className='search-box ltr:mr-2 rtl:ml-2  mb-0"' style={{width:"100%"}}>
                            <input
                                id="fileNumber"
                                type="text"
                                name="fileNumber"
                                className="form-input lg:w-[250px] w-2/3 p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                placeholder="Enter File Number"
                                value={fileNumber}
                                onChange={(e) => handleInputChange('fileNumber', e.target.value)}
                            />
                            </div>
                        </div>
                        
                    )}
                   <div style={{ width: '100%' }}>
                          
                        <div>
                            <div className="flex items-center mt-4">
                                <label htmlFor="pickupLocation" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Pickup Location
                                </label>
                                <Box
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    }}
                                >
                               <Autocomplete
    value={{ label: pickupLocation }}
    onInputChange={(event, newInputValue) => {
        console.log('Input change event:', event);
        console.log('New input value:', newInputValue);

        setPickupLocation(newInputValue);
        if (newInputValue) {
            console.log('Fetching autocomplete results for:', newInputValue);
            getAutocompleteResults(newInputValue, setPickupOptions);
        } else {
            console.log('Clearing pickup options');
            setPickupOptions([]);
        }
    }}
    onChange={(event, newValue) => {
        console.log('Autocomplete onChange event:', event);
        console.log('Autocomplete onChange newValue:', newValue);
        handlePickupChange(newValue);
    }}
    sx={{ background: "white", width: '100%', border: '20px' }}
    options={pickupOptions}
    getOptionLabel={(option) => {
        console.log('Get option label:', option);
        return option.label;
    }}
    isOptionEqualToValue={(option, value) => {
        console.log('Checking if option is equal to value:', option, value);
        return option.label === value.label;
    }}
    renderInput={(params) => {
        console.log('Rendering input with params:', params);
        return <TextField {...params} label="Pickup Location" variant="outlined" />;
    }}
/>


                                    {pickupCoords.lat !== undefined && pickupCoords.lng !== undefined && <Typography>{`Pickup Location Lat/Lng: ${pickupCoords.lat}, ${pickupCoords.lng}`}</Typography>}
                                </Box>
                            </div>

                            <div className="mt-4 flex items-center">
                                <label htmlFor="baseLocation" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Start Location
                                </label>
                                <input
                                    id="baseLocation"
                                    type="text"
                                    name="baseLocation"
                                    className="form-input flex-1"
                                    placeholder="select start location"
                                    value={baseLocation ? `${baseLocation.name} , ${baseLocation.lat} , ${baseLocation.lng}` : ''}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    }}
                                    readOnly
                                    onClick={openModal1}
                                />
                                <button
                                    onClick={openModal1}
                                    style={{
                                        borderRadius: '40px',
                                        background: 'transparent',
                                        color: 'blue',
                                        marginLeft: '10px',
                                        padding: '10px',
                                        border: 'none',
                                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
                                        cursor: 'pointer',
                                        transition: 'background 0.3s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.background = 'lightblue')}
                                    onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <IconMapPin style={{ color: '#FF6347', fontSize: '1.5rem' }} />
                                </button>
                            </div>

                            {isModalOpen1 && (
                                <div
                                    className="modal"
                                    style={{
                                        position: 'fixed',
                                        zIndex: 1,
                                        left: 0,
                                        top: 0,
                                        width: '100%',
                                        height: '100%',
                                        overflow: 'auto',
                                        backgroundColor: 'rgb(0,0,0)',
                                    }}
                                >
                                  
                                        <div className="modal-body">
                                            <BaseLocationModal onClose={closeModal1} setBaseLocation={setBaseLocation} pickupLocation={pickupLocation} />
                                        </div>
                                       
                                </div>
                            )}
    <div className="flex items-center mt-4">
                            <label htmlFor="showrooms" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                Service Center
            </label>
            {showrooms.length > 0 && (
                <Select
                    className="w-full"
                    id="showrooms"
                    name="showrooms"
                    value={showrooms.find(option => option.value === showroomLocation) || null}
                    options={showrooms}
                    onChange={(selectedOption) => handleInputChange('showroomLocation', selectedOption ? selectedOption.value : '')}
                    isSearchable={true}
                    placeholder="Select showroom"
                    styles={{
                        control: (provided) => ({
                            ...provided,
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            fontSize: '1rem',
                            outline: 'none',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        }),
                        placeholder: (provided) => ({
                            ...provided,
                            fontSize: '1rem',
                        }),
                    }}
                />
            )}
                        <button
                            onClick={() => setShowShowroomModal(true)}
                            style={{
                                borderRadius: '40px',
                                background: 'linear-gradient(135deg, #32CD32, #228B22)',
                                color: 'white',
                                margin: '10px',
                                padding: '10px 10px',
                                border: 'none',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                cursor: 'pointer',
                                transition: 'background 0.3s ease',
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.background = 'linear-gradient(135deg, #228B22, #006400)')}
                            onMouseOut={(e) => (e.currentTarget.style.background = 'linear-gradient(135deg, #32CD32, #228B22)')}
                        >
                            <IconPlus />
                        </button>
                    </div>
                    <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#333', marginTop: '10px', background: 'white', padding: '19px', borderRadius: '4px',marginLeft:"24%" }}> {showroomLocation}</div>
                    {showShowroomModal && <ShowroomModal onClose={() => setShowShowroomModal(false)} updateShowroomLocation={updateShowroomLocation} />}
                    
                          

                    <div className="flex items-center mt-4">
                                <label htmlFor="dropoffLocation" className="  mb-0">
                                    Drop off Location
                                </label>
                                <div className="search-box   mb-0" style={{width:"100%"}}>
                                    <input
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            border: '1px solid #ccc',
                                            borderRadius: '5px',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                        }}
                                        value={showroomLocation}
                                    />
                                </div>
                            </div>
<div className='mt-4'>
<MapView />

</div>
                        </div>
                        {/* )} */}
                    </div>
                    <div className="mt-4 flex items-center">
                        <label htmlFor="distance" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                            Distance (KM)
                        </label>
                        <input
                            id="distance"
                            type="text"
                            name="distance"
                            className="form-input flex-1"
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #ccc',
                                borderRadius: '5px',
                                fontSize: '1rem',
                                outline: 'none',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            }}
                            onChange={(e) => handleInputChange('distance', e.target.value)}
                            value={distance}
                            readOnly={!manualDistance}
                            onClick={() => setManualDistance(true)}
                        />
                    </div>
                    <div className="flex items-center mt-4">
                        <label htmlFor="trappedLocation" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                            Trapped Location
                        </label>
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="onRoad"
                                name="trappedLocation"
                                value="onRoad"
                                checked={trappedLocation === 'onRoad'}
                                onChange={(e) => handleInputChange('trappedLocation', e.target.value)}
                                className="mr-2"
                            />
                            <label htmlFor="onRoad" className="mr-4">
                                On Road
                            </label>
                            <input
                                type="radio"
                                id="inHouse"
                                name="trappedLocation"
                                value="inHouse"
                                checked={trappedLocation === 'inHouse'}
                                onChange={(e) => handleInputChange('trappedLocation', e.target.value)}
                                className="mr-2"
                            />
                            <label htmlFor="inHouse" className="mr-4">
                                In House
                            </label>
                            <input
                                type="radio"
                                id="outsideOfRoad"
                                name="trappedLocation"
                                value="outsideOfRoad"
                                checked={trappedLocation === 'outsideOfRoad'}
                                onChange={(e) => handleInputChange('trappedLocation', e.target.value)}
                                className="mr-2"
                            />
                            <label htmlFor="outsideOfRoad" className="text-danger">
                                Outside of Road
                            </label>
                        </div>
                    </div>
                    {trappedLocation === 'outsideOfRoad' && (
                        <div className="flex items-center mt-4">
                            <label htmlFor="updatedTotalSalary" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                Updated Total Amount
                            </label>
                            <input
                                id="updatedTotalSalary"
                                type="text"
                                name="updatedTotalSalary"
                                className="form-input flex-1"
                                placeholder="Enter Total Salary"
                                value={updatedTotalSalary}
                                onChange={(e) => setUpdatedTotalSalary(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    {!disableFields && (
                        <div className="flex items-center mt-4">
                            <label htmlFor="serviceType" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                Service Type
                            </label>
                            <select
                                id="serviceType"
                                name="serviceType"
                                className="form-select flex-1"
                                value={serviceType}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #ccc',
                                    borderRadius: '5px',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                }}
                                onChange={(e) => handleInputChange('serviceType', e.target.value)}
                            >
                                <option value="">Select Service Type</option>
                                {serviceTypes.map((service) => (
                                    <option key={service.id} value={service.name}>
                                        {service.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {!disableFields && (
                        <div className="flex items-center mt-4">
                            <label htmlFor="driver" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                Driver
                            </label>
                            <div className="form-input flex-1" style={{ position: 'relative', width: '100%' }}>
                                <input
                                    id="driver"
                                    type="text"
                                    name="driver"
                                    className="w-full"
                                    placeholder="Select your driver"
                                    style={{
                                        padding: '0.5rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    }}
                                    value={selectedDriver && drivers.find((driver) => driver.id === selectedDriver)?.driverName}
                                    onClick={() => openModal(distance)}
                                />
                            </div>
                            <ReactModal
                                isOpen={isModalOpen}
                                onRequestClose={closeModal}
                                style={{
                                    overlay: {
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    },
                                    content: {
                                        top: '50%',
                                        left: '50%',
                                        right: 'auto',
                                        bottom: 'auto',
                                        transform: 'translate(-50%, -50%)',
                                        borderRadius: '10px',
                                        maxWidth: '90vw',
                                        maxHeight: '80vh',
                                        boxShadow: '0 0 20px rgba(0, 0, 0, 0.7)',
                                        padding: '20px',
                                        overflow: 'auto',
                                    },
                                }}
                            >
                                <div style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 999 }}>
                                    <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Available Drivers for {serviceType}</h2>
                                    <button
                                        onClick={closeModal}
                                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-1"
                                        style={{ marginLeft: 'auto', marginRight: '20px' }}
                                    >
                                        OK
                                    </button>
                                </div>

                                <div style={{ marginTop: '10px' }}>
                                    <div className="grid grid-cols-1 gap-4">
                                        {drivers
                                            .map((driver, index) => ({
                                                driver,
                                                pickupDistanceData: pickupDistances[index] || { distance: 0, duration: 0 },
                                            }))
                                            .sort((a, b) => {
                                                if (a.driver.companyName === 'RSA' && b.driver.companyName !== 'RSA') {
                                                    return -1;
                                                }
                                                if (a.driver.companyName !== 'RSA' && b.driver.companyName === 'RSA') {
                                                    return 1;
                                                }
                                                return a.pickupDistanceData.distance - b.pickupDistanceData.distance;
                                            })
                                            .map(({ driver, pickupDistanceData }, index) => {
                                                const totalDistance = pickupDistances.find((dist) => dist.id === driver.id)?.distance || 0;
                                                const driverTotalSalary = calculateTotalSalary(serviceDetails.salary, distance, serviceDetails.basicSalaryKM, serviceDetails.salaryPerKM);

                                                console.log('Driver Total Salary Calculation:');
                                                console.log('Service Details Salary:', serviceDetails.salary);
                                                console.log('Total Distance:', totalDistance);
                                                console.log('Basic Salary per KM:', serviceDetails.basicSalaryKM);
                                                console.log('Salary per KM:', serviceDetails.salaryPerKM);
                                                console.log('Calculated Total Salary:', driverTotalSalary);

                                                return (
                                                    <div key={driver.id} className="flex items-center border border-gray-200 p-2 rounded-lg">
                                                        <table className="panel p-4 w-full">
                                                            <thead>
                                                                <tr className="text-left">
                                                                    <th className="border-b-2 p-2">Driver Name</th>
                                                                    <th className="border-b-2 p-2">Company Name</th>
                                                                    <th className="border-b-2 p-2">Pickup Distance (KM)</th>
                                                                    <th className="border-b-2 p-2">Pickup Duration</th>
                                                                    <th className="border-b-2 p-2">Salary</th>
                                                                    <th className="border-b-2 p-2">Select Driver</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr className="text-left">
                                                                    <td className="border-b-2 p-2">{driver.driverName}</td>
                                                                    <td className="border-b-2 p-2">{driver.companyName}</td>
                                                                    <td className="border-b-2 p-2">{pickupDistanceData.distance}</td>
                                                                    <td className="border-b-2 p-2">{pickupDistanceData.duration}</td>
                                                                    <td className="border-b-2 p-2">{driverTotalSalary}</td>
                                                                    <td>
                                                                        <input
                                                                            type="radio"
                                                                            name="selectedDriver"
                                                                            value={driver.id}
                                                                            checked={selectedDriver === driver.id}
                                                                            onChange={() => handleInputChange('selectedDriver', driver.id)}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </ReactModal>
                        </div>
                    )}
                </div>
                <React.Fragment>
                    <div>
                    <VehicleSection
                    showroomLocation={showroomLocation}
                                totalSalary={totalSalary}
                                onUpdateTotalSalary={handleUpdateTotalSalary}
                                insuranceAmountBody={insuranceAmountBody}
                                serviceCategory={serviceCategory}
                                onInsuranceAmountBodyChange={handleInsuranceAmountBodyChange}
                                onServiceCategoryChange={handleServiceCategoryChange}
                                onAdjustValueChange={handleAdjustValueChange}
                                adjustValue={adjustValue}
                                bodyShope={bodyShope}
                                onInsuranceChange={handleBodyInsuranceChange}
                            />

                        <div className="mt-4 flex items-center">
                            <label htmlFor="totalSalary" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                Total Amount without insurance
                            </label>
                            <div className="form-input flex-1">
                                <input
                                    id="totalSalary"
                                    type="text"
                                    name="totalSalary"
                                    className="w-full  text-bold"
                                    style={{
                                        padding: '0.5rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    }}
                                    value={totalSalary}
                                    readOnly
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center">
                                <label htmlFor="insuranceAmountBody" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Insurance Amount Body
                                </label>
                                <div className="form-input flex-1">
                                    <input
                                        id="insuranceAmountBody"
                                        type="text"
                                        name="insuranceAmountBody"
                                        className="w-full"
                                        value={insuranceAmountBody}
                                        onChange={(e) => handleInputChange('insuranceAmountBody', e.target.value)}
                                    />
                                </div>
                            </div>
                        <div className="mt-4 flex items-center">
                            <label htmlFor="updatedTotalSalary" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                Payable Amount (with insurance)
                            </label>
                            <div className="form-input flex-1">
                                <input
                                    id="updatedTotalSalary"
                                    type="text"
                                    name="updatedTotalSalary"
                                    className="w-full text-danger"
                                    style={{
                                        padding: '0.5rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        fontSize: '2rem',
                                        outline: 'none',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    }}
                                    value={updatedTotalSalary}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>
                </React.Fragment>
                {selectedDriver && (
    <div>
        <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="totalDriverSalary" style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Total Driver Salary
            </label>
            <input
                id="totalDriverSalary"
                type="text"
                value={totalDriverSalary}
                readOnly
                style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    fontSize: '1rem',
                    outline: 'none',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                }}
            />
        </div>
        <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="totalDriverDistance" style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Total Driver Distance
            </label>
            <input
                id="totalDriverDistance"
                type="text"
                value={totalDriverDistance}
                readOnly
                style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    fontSize: '1rem',
                    outline: 'none',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                }}
            />
        </div>
    </div>
)}

                <div className="flex items-center mt-4" style={{ width: '100%' }}>
                    <label htmlFor="serviceVehicle" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                        Service Vehicle Number
                    </label>

                    <input
                        id="serviceVehicle"
                        type="text"
                        name="serviceVehicle"
                        className="form-input flex-1"
                        placeholder="Enter Service Vehicle Number"
                        value={serviceVehicle}
                        onChange={(e) => handleInputChange('serviceVehicle', e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            fontSize: '1rem',
                            outline: 'none',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        }}
                        required
                    />
                </div>
                <div className="mt-4 flex items-center" style={{ width: '100%' }}>
                    <label htmlFor="customerName" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                        Customer Name
                    </label>
                    <input
                        id="customerName"
                        type="text"
                        name="customerName"
                        className="form-input flex-1"
                        placeholder="Enter Name"
                        value={customerName}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            fontSize: '1rem',
                            outline: 'none',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        }}
                        onChange={(e) => handleInputChange('customerName', e.target.value)}
                    />
                </div>
                <div className="mt-4 flex items-center" style={{ width: '100%' }}>
                    <label htmlFor="phoneNumber" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                        Phone Number
                    </label>
                    <input
                        id="phoneNumber"
                        type="phoneNumber"
                        name="phoneNumber"
                        className="form-input flex-1"
                        placeholder="Enter Phone number"
                        value={phoneNumber}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            fontSize: '1rem',
                            outline: 'none',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        }}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    />
                    {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                </div>
                <div className="mt-4 flex items-center" style={{ width: '100%' }}>
                    <label htmlFor="mobileNumber" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                        Mobile Number
                    </label>
                    <input
                        id="mobileNumber"
                        type="text"
                        name="mobileNumber"
                        className="form-input flex-1"
                        placeholder="Enter Mobile number"
                        value={mobileNumber}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            fontSize: '1rem',
                            outline: 'none',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        }}
                        onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                    />
                    {errors.mobileNumber && <p className="text-red-500 text-sm mt-1">{errors.mobileNumber}</p>}
                </div>{' '}
                <div className="mt-4 flex items-center" style={{ width: '100%' }}>
                    <label htmlFor="vehicleNumber" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                        Customer Vehicle Number
                    </label>
                    <input
                        id="vehicleNumber"
                        type="text"
                        name="vehicleNumber"
                        className="form-input flex-1"
                        placeholder="Enter vehicle number"
                        value={vehicleNumber}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            fontSize: '1rem',
                            outline: 'none',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        }}
                        onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                    />
                </div>
                <div className="mt-4 flex items-center" style={{ width: '100%' }}>
                    <label htmlFor="vehicleType" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                        Vehicle Type (2 or 3 or 4 wheeler)
                    </label>
                    <select
                        id="vehicleType"
                        name="vehicleType"
                        className="form-select flex-1"
                        value={vehicleType}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            fontSize: '1rem',
                            outline: 'none',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        }}
                        onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                    >
                        <option value="">Select vehicle type</option>
                        <option value="2">2 Wheeler</option>
                        <option value="3">3 Wheeler</option>
                        <option value="4">4 Wheeler</option>
                        <option value="5">5 Wheeler</option>
                        <option value="6">6 Wheeler</option>
                        <option value="7">7 Wheeler</option>
                        <option value="8">8 Wheeler</option>
                    </select>
                </div>
                <div className="flex items-center mt-4" style={{ width: '100%' }}>
                    <label htmlFor="vehicleModel" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                        Brand Name
                    </label>
                    <input
                        id="vehicleModel"
                        name="vehicleModel"
                        className="form-input flex-1"
                        value={vehicleModel}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            fontSize: '1rem',
                            outline: 'none',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        }}
                        onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                    />
                </div>
            </div>

            <div className="mt-4 flex items-center">
                <textarea
                    id="reciever-name"
                    name="reciever-name"
                    className="form-input flex-1"
                    placeholder="Comments"
                    value={comments}
                    style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        fontSize: '1rem',
                        outline: 'none',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    }}
                    onChange={(e) => handleInputChange('comments', e.target.value)}
                />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
                <button
                    type="button"
                    className={`btn btn-primary bg-green-600 text-white py-2 w-full border-none rounded cursor-pointer ${editData ? 'hover:bg-green-700' : 'hover:bg-green-500'}`}
                    onClick={addOrUpdateItem}
                >
                    {editData ? 'Update' : 'Save'}
                </button>
            </div>
        </div>
    );
};

export default MapBooking;
