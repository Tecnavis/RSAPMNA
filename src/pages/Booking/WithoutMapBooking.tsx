import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import ReactModal from 'react-modal';
import { v4 as uuid } from 'uuid';
import { query, where } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import VehicleSection from './VehicleSection';
import IconPlus from '../../components/Icon/IconPlus';
import IconMapPin from '../../components/Icon/IconMapPin';
import ShowroomModalWithout from './ShowroomModalWithout';
import styles from './withoutMap.module.css';
import ReactSelect from 'react-select';
import axios from 'axios';
import BaseLocationWithout from '../BaseLocation/BaseLocationWithout';
interface Showroom {
    id: string;
    name: string;
}

const options = [
    { value: '2', label: '2 Wheeler' },
    { value: '3', label: '3 Wheeler' },
    { value: '4', label: '4 Wheeler' },
    { value: '6', label: '8 Wheeler' },
    { value: '8', label: '12 Wheeler' },
    { value: '10', label: '14 Wheeler' },
    { value: '12', label: '16 Wheeler' },
    { value: '20', label: '20 Wheeler' },
];
const WithoutMapBooking = ({ activeForm }) => {
    const db = getFirestore();
    const navigate = useNavigate();
    const [bookingId, setBookingId] = useState<string>('');
    const [userFcmToken, setUserFcmToken] = useState<string | null>(null);

    useEffect(() => {
        const newBookingId = uuid().substring(0, 6);
        setBookingId(newBookingId);
    }, []);
    const [updatedTotalSalary, setUpdatedTotalSalary] = useState(0);
    const [companies, setCompanies] = useState([]);
    const [totalDriverDistance, setTotalDriverDistance] = useState('');

    const [bookingDetails, setBookingDetails] = useState({
        company: '',
        fileNumber: '',
        customerName: '',
        totalDriverSalary: '',
        totalDriverDistance: 0,
        phoneNumber: '',
        mobileNumber: '',
        totalSalary: '',
        serviceType: '',
        vehicleType: '',
        serviceVehicle: '',
        driver: '',
        distance: '',
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
    const [comments, setComments] = useState('');
    const [fileNumber, setFileNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [totalDriverSalary, setTotalDriverSalary] = useState('');
    const [serviceCategory, setServiceCategory] = useState('');
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
    const [pickupLocation, setPickupLocation] = useState({ lat: '', lng: '', name: '' });
    const [availableServices, setAvailableServices] = useState('');
    const [dropoffLocation, setDropoffLocation] = useState(null);
    const [baseLocation, setBaseLocation] = useState(null);
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
    const [selectedCompany, setSelectedCompany] = useState([]);
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [manualInput, setManualInput] = useState('');
    const [manualInput1, setManualInput1] = useState(dropoffLocation ? dropoffLocation.name : '');
    const [disableFields, setDisableFields] = useState(false); // State to control field disabling
    const [totalDistance, setTotalDistance] = useState([]);
    const [totalDistances, setTotalDistances] = useState([]);
    const [errors, setErrors] = useState({});
    const [adjustValue, setAdjustValue] = useState('');
    const [bodyShope, setBodyShope] = useState('');
    const uid = sessionStorage.getItem('uid');
    const userName = sessionStorage.getItem('username');
    const role = sessionStorage.getItem('role');
    const [dis1, setDis1] = useState('');
    const [dis2, setDis2] = useState('');
    const [dis3, setDis3] = useState('');
   

    useEffect(() => {
        if (state && state.editData) {
            const editData = state.editData;
            setEditData(editData);
            setBookingId(editData.bookingId || '');
            setTrappedLocation(editData.trappedLocation || '');
            setInsuranceAmountBody(editData.insuranceAmountBody || '');
            setBodyShope(editData.bodyShope || '');
            setComments(editData.comments || '');
            setFileNumber(editData.fileNumber || '');
            setCompany(editData.company || '');
            setTotalDriverSalary(editData.totalDriverSalary || 0);
            setTotalDriverDistance(editData.totalDriverDistance || 0);
            setCustomerName(editData.customerName || '');
            setPhoneNumber(editData.phoneNumber || '');
            setVehicleType(editData.vehicleType || '');
            setServiceCategory(editData.serviceCategory || '');
            setAvailableServices(editData.availableServices || '');
            setMobileNumber(editData.mobileNumber || '');
            setDis1(editData.dis1 || '');
            setDis2(editData.dis2 || '');

            setDis3(editData.dis3 || '');

            setVehicleNumber(editData.vehicleNumber || '');
            setServiceVehicle(editData.serviceVehicle || '');
            setVehicleModel(editData.vehicleModel || '');
            setVehicleSection(editData.vehicleSection || '');
            setShowroomLocation(editData.showroomLocation || '');
            setDistance(editData.distance || '');
            setSelectedDriver(editData.selectedDriver || '');
            setBaseLocation(editData.baseLocation || '');
            setPickupLocation(editData.pickupLocation || '');
            setUpdatedTotalSalary(editData.updatedTotalSalary || 0);
            setServiceType(editData.serviceType || '');
            setAdjustValue(editData.adjustValue || '');
            

            setTotalSalary(editData.totalSalary || 0);
            setDropoffLocation(editData.dropoffLocation || '');
            setSelectedCompany(editData.selectedCompany || '');

            setDisableFields(false);
        }
    }, [state]);
   

    
    useEffect(() => {
        const formatDate = (date) => {
            const options = {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            };
            return new Intl.DateTimeFormat('en-GB', options).format(date);
        };

        const updateDateTime = () => {
            const now = new Date();
            const formattedDateTime = formatDate(now);
            setCurrentDateTime(formattedDateTime);
        };

        // Update date and time immediately on mount
        updateDateTime();

        // Set up interval to update every second
        const intervalId = setInterval(updateDateTime, 1000);

        // Clean up interval on unmount
        return () => clearInterval(intervalId);
    }, []);


    useEffect(() => {
        // Set the manual input field with the pickup location's name when the location changes
        setManualInput(pickupLocation.name || '');
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
                    const driverCollection = collection(db, `user/${uid}/driver`);

                    // Query to fetch companies where companyName is 'Company'
                    const q = query(driverCollection, where('companyName', '==', 'Company'));
                    const querySnapshot = await getDocs(q);

                    const fetchedCompanies = querySnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Company[];

                    // Filter fetched companies based on status
                    const filteredCompanies = fetchedCompanies.filter((company) => company.status !== 'deleted from UI' && (company.status === '' || !company.status));

                    setCompanies(filteredCompanies);
                } catch (error) {
                    console.error('Error fetching companies:', error);
                }
            };

            fetchCompanies();
        }
    }, [company, db, uid]);
    // const handleUpdatedTotalSalary = (newTotalSalary) => {
    //     setUpdatedTotalSalary(newTotalSalary);
    // };
    const handleUpdateTotalSalary = (newTotaSalary) => {
        setUpdatedTotalSalary(newTotaSalary);
    };

    const handleInsuranceAmountBodyChange = (amount) => {
        setInsuranceAmountBody(amount);
    };
    const handleAdjustValueChange = (newAdjustValue) => {
        setAdjustValue(newAdjustValue);
    };
    const handleServiceCategoryChange = (service) => {
        setServiceCategory(service);
    };
    const handleBodyInsuranceChange = (insurance) => {
        setBodyShope(insurance);
    };

    useEffect(() => {
        if (selectedDriver) {
            const selectedDriverData = drivers.find((driver) => driver.id === selectedDriver);

            if (selectedDriverData) {
                if (selectedDriverData.serviceVehicle) {
                    setServiceVehicle(renderServiceVehicle(selectedDriverData.serviceVehicle, serviceType));
                }
            } else {
                console.error('Driver not found:', selectedDriver);
            }
        }
    }, [selectedDriver, serviceType, drivers]);

    const handleInputChange = (field, value) => {
        switch (field) {
            case 'showroomLocation':
                setShowroomLocation(value);

                // Find the selected showroom based on the selected value
                const selectedShowroom = showrooms.find((show) => show.value === value);

                if (selectedShowroom) {
                    setInsuranceAmountBody(selectedShowroom.insuranceAmountBody);

                    // Ensure lat and lng are stored as strings
                    const latString = selectedShowroom.locationLatLng.lat.toString();
                    const lngString = selectedShowroom.locationLatLng.lng.toString();

                    setDropoffLocation({
                        name: selectedShowroom.value,
                        lat: latString,
                        lng: lngString,
                    });
                } else {
                    setInsuranceAmountBody('');
                    setDropoffLocation({
                        name: '',
                        lat: '',
                        lng: '',
                    });
                }
                break;
            case 'totalSalary':
                setTotalSalary(value || 0);
                // const newCalculatedSalary = value - parseFloat(insuranceAmountBody);
                // handleUpdatedTotalSalary(newCalculatedSalary);
                break;
            case 'serviceCategory':
                setServiceCategory(value || 0);

                break;
            case 'availableServices':
                setAvailableServices(value || 0);

                break;
            case 'bodyShope':
                setBodyShope(value || '');
                break;
            case 'insuranceAmountBody':
                setInsuranceAmountBody(value || 0);
                // const recalculatedTotalSalary = totalSalary - parseFloat(value);
                // handleUpdatedTotalSalary(recalculatedTotalSalary);
                break;
            case 'adjustValue':
                setAdjustValue(value || 0);

                break;
            case 'customerName':
                setCustomerName(value || '');
                break;
            case 'totalDriverDistance':
                setTotalDriverDistance(value || 0);
                break;
            case 'totalDriverSalary':
                setTotalDriverSalary(value || 0);
                break;

            case 'company':
                setCompany(value);
                setFileNumber(value === 'self' ? bookingId : '');
                break;

            case 'fileNumber':
                setFileNumber(value || '');
                break;
            case 'selectedCompany':
                setSelectedCompany(value || '');
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
                setUpdatedTotalSalary(value || '');
                break;
                case 'dis1':
                    const parsedDis1 = parseFloat(value) || 0;
                    setDis1(parsedDis1);
                    setDistance(parsedDis1 + dis2 + dis3);
                    break;
                case 'dis2':
                    const parsedDis2 = parseFloat(value) || 0;
                    setDis2(parsedDis2);
                    setDistance(dis1 + parsedDis2 + dis3);
                    break;
                case 'dis3':
                    const parsedDis3 = parseFloat(value) || 0;
                    setDis3(parsedDis3);
                    setDistance(dis1 + dis2 + parsedDis3);
                    break;
                case 'distance':
                    setDistance(value || 0); // Default to 0 if totalDistance is NaN
                    break;
            case 'serviceVehicle':
                setServiceVehicle(value);
                break;
                case 'selectedDriver':
                    console.log("Selected Driver ID:", value);
        
                    setSelectedDriver(value || '');
        
                    const selectedDriverData = drivers.find((driver) => driver.id === value);
                    console.log("Selected Driver Data:", selectedDriverData);
        
                    if (selectedDriverData) {
                        const isRSA = selectedDriverData.companyName === 'RSA';
                        const salary = isRSA ? serviceDetails.salary : selectedDriverData.basicSalaries[selectedDriverData.selectedServices[0]];
                        const basicSalaryKM = isRSA ? serviceDetails.basicSalaryKM : selectedDriverData.basicSalaryKm[selectedDriverData.selectedServices[0]];
                        const salaryPerKM = isRSA ? serviceDetails.salaryPerKM : selectedDriverData.salaryPerKm[selectedDriverData.selectedServices[0]];
        
                        const calculatedSalary = calculateTotalSalary(
                            salary,
                            distance,
                            basicSalaryKM,
                            salaryPerKM,
                            isRSA
                        );
        
                        const formattedSalary = parseFloat(calculatedSalary.toFixed(2));
                        console.log("Calculated Salary for Selected Driver:", formattedSalary);
                
                        setTotalSalary(formattedSalary);
                    } else {
                        console.log("No driver data found for the selected driver.");
                        setTotalSalary(0); // Clear the total salary if no driver is selected
                    }
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
            case 'vehicleType':
                setVehicleType(value || '');
                break;

            case 'pickupLocation':
                if (typeof value === 'string') {
                    setPickupLocation({ ...pickupLocation, name: value });
                } else {
                    setPickupLocation({ ...pickupLocation, name: value.name });
                }
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

            case 'trappedLocation':
                setDisableFields(value === 'outsideOfRoad'); // Disable fields if trappedLocation is 'outsideOfRoad'

                setTrappedLocation(value || '');
                break;

            case 'showrooms':
                setShowrooms(value || '');
                break;
            default:
                break;
        }

        if (field === 'serviceType') {
            setServiceType(value || '');
            openModal();
        } else if (field === 'selectedDriver') {
            setSelectedDriver(value || '');
        }
    };
    const selectedDriverData = drivers.find((driver) => driver.id === selectedDriver);
    const openModal = () => {
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
    };
    useEffect(() => {
        const db = getFirestore();
        const serviceCollection = collection(db, `user/${uid}/showroom`);
    
        // Set up the real-time listener
        const unsubscribe = onSnapshot(
            serviceCollection,
            (snapshot) => {
                const servicesList = snapshot.docs.map((doc) => ({
                    value: doc.data().Location, // Keep this if Location is used as the value for selecting an option
                    label: doc.data().ShowRoom, // ShowRoom will be displayed as the label in the dropdown
                    insuranceAmountBody: doc.data().insuranceAmountBody, // Include this field if needed
                    locationLatLng: doc.data().locationLatLng, // Include this field if needed
                }));
                setShowrooms(servicesList);
            },
            (error) => {
                console.error('Error fetching services:', error);
            }
        );
    
        // Clean up the listener on component unmount
        return () => unsubscribe();
    }, [uid]);
    
    
    //-------------------------------------------------------------------------------------
    useEffect(() => {
        setManualInput1(dropoffLocation ? dropoffLocation.name : '');
    }, [dropoffLocation]);

    const handleManualChange1 = (field, value) => {
        setDropoffLocation((prev) => ({ ...prev, [field]: value }));
    };

    const handleLocationChange1 = (e) => {
        const value = e.target.value;
        setManualInput1(value);
        handleInputChange('dropoffLocation', value);
    };
    const handleLocationChange = (e) => {
        const value = e.target.value;

        setManualInput(value);

        // Update pickupLocation with lat/lng values
        const [lat, lng] = value.split(',').map((coord) => coord.trim());

        setPickupLocation((prevState) => ({
            ...prevState,
            lat: lat || prevState.lat,
            lng: lng || prevState.lng,
            name: value,
        }));
    };

    const updateShowroomLocation = (location) => {
        setShowroomLocation(location);
    };
    const handleManualChange = (field, value) => {
        setPickupLocation((prev) => ({ ...prev, [field]: value }));
    };
    useEffect(() => {
        const fetchServiceTypes = async () => {
            try {
                const serviceCollection = collection(db, `user/${uid}/service`);
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
        const unsubscribe = onSnapshot(collection(db, `user/${uid}/showroom`), (snapshot) => {
            const Location = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setShowRooms(Location);
        });

        return () => unsubscribe();
    }, []);
    useEffect(() => {
        const fetchDrivers = async () => {
            if (!serviceType || !serviceDetails) {
                setDrivers([]);
                return;
            }
    
            try {
                const driversCollection = collection(db, `user/${uid}/driver`);
                const snapshot = await getDocs(driversCollection);
    
                const filteredDrivers = snapshot.docs
                    .map((doc) => {
                        const driverData = doc.data();
                        // Check if selectedServices is defined and if it includes the serviceType
                        if (!driverData.selectedServices || !driverData.selectedServices.includes(serviceType) || driverData.status === 'deleted from UI') {
                            return null;
                        }
    
                        return {
                            id: doc.id,
                            ...driverData,
                        };
                    })
                    .filter(Boolean); // Remove null entries
    
                setDrivers(filteredDrivers);
            } catch (error) {
                console.error('Error fetching drivers:', error);
            }
        };
    
        if (serviceType && serviceDetails) {
            fetchDrivers().catch(console.error);
        } else {
            setDrivers([]);
        }
    }, [db, uid, serviceType, serviceDetails]);
    
    useEffect(() => {
        const fetchServiceDetails = async () => {
            if (!serviceType) {
                setServiceDetails({});
                return;
            }

            try {
                const serviceQuery = query(collection(db, `user/${uid}/service`), where('name', '==', serviceType));
                const snapshot = await getDocs(serviceQuery);
                if (snapshot.empty) {
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

    const calculateTotalSalary = (salary, totalDistance, basicSalaryKM, salaryPerKM, isRSA) => {
        const numericBasicSalary = Number(salary) || 0;
        const numericTotalDistance = Number(totalDistance) || 0;
        const numericKmValueNumeric = Number(basicSalaryKM) || 0;
        const numericPerKmValueNumeric = Number(salaryPerKM) || 0;
    
        if (isRSA) {
            // For RSA company
            if (numericTotalDistance > numericKmValueNumeric) {
                return numericBasicSalary + (numericTotalDistance - numericKmValueNumeric) * numericPerKmValueNumeric;
            } else {
                return numericBasicSalary;
            }
        } else {
            // For non-RSA companies
            if (numericTotalDistance > numericKmValueNumeric) {
                return numericBasicSalary + (numericTotalDistance - numericKmValueNumeric) * numericPerKmValueNumeric;
            } else {
                return numericBasicSalary;
            }        }
    };
   
    
    useEffect(() => {
        if (drivers.length > 0) {
            console.log("Drivers List:", drivers);
            console.log("Distance:", distance);
            console.log("Service Details:", serviceDetails);
    
           
            // Calculate total salaries for each driver
            const totalSalaries = drivers.map((driver) => {
                const isRSA = driver.companyName === 'RSA';
    
                // Use driver values if companyName is not 'RSA'
                const salary = !isRSA ? driver.basicSalaries[driver.selectedServices[0]] : serviceDetails.salary;
                const basicSalaryKM = !isRSA ? driver.basicSalaryKm[driver.selectedServices[0]] : serviceDetails.basicSalaryKM;
                const salaryPerKM = !isRSA ? driver.salaryPerKm[driver.selectedServices[0]] : serviceDetails.salaryPerKM;
    
                const calculatedSalary = calculateTotalSalary(
                    salary,
                    distance,
                    basicSalaryKM,
                    salaryPerKM,
                    isRSA
                );
                console.log(`Salary for driver ${driver.id}:`, calculatedSalary);
                return calculatedSalary;
            });
            
        }
    }, [drivers, serviceDetails, distance]);
    
    
    // --------------------------------------------------------------------------------
    
    const calculateTotalDriverSalary = (totalDriverDistance, basicSalaryKM, salaryPerKM, salary) => {
        totalDriverDistance = parseFloat(totalDriverDistance);
        basicSalaryKM = parseFloat(basicSalaryKM);
        salaryPerKM = parseFloat(salaryPerKM);
        salary = parseFloat(salary);
        console.log("totalDriverDistance",totalDriverDistance)

        if (totalDriverDistance > basicSalaryKM) {
            return salary + (totalDriverDistance - basicSalaryKM) * salaryPerKM;
        } else {
            return salary;
        }
    };

    useEffect(() => {
        if (selectedDriver && Array.isArray(drivers)) {
            const selectedDriverData = drivers.find((driver) => driver.id === selectedDriver);

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

                if (totalDriverDistance < basicSalaryKM) {
                    setTotalDriverSalary(salary); // If distance is less than basicSalaryKM, return the base salary
                }
                const calculatedSalary = calculateTotalDriverSalary(totalDriverDistance, basicSalaryKM, salaryPerKM, salary);

                setTotalDriverSalary(calculatedSalary);
            } else {
                console.error('Driver not found:', selectedDriver);
            }
        }
    }, [selectedDriver, totalDriverDistance, drivers]);
    // ----------------------------------------
   
    useEffect(() => {
        let newTotalSalary = totalSalary;
        if (serviceCategory === 'Body Shop' && bodyShope === 'insurance') {
            newTotalSalary -= parseFloat(insuranceAmountBody || 0);
        }
        if (editData?.adjustValue) {
            // If editData has adjustValue, prioritize it
            setUpdatedTotalSalary(parseFloat(editData.adjustValue) || 0);
        } else if (newTotalSalary !== updatedTotalSalary) {
            // Otherwise, use the calculated newTotalSalary
            setUpdatedTotalSalary(newTotalSalary >= 0 ? newTotalSalary : 0);
        }
    }, [totalSalary, insuranceAmountBody, serviceCategory, bodyShope, adjustValue]);

    const renderServiceVehicle = (serviceVehicle, serviceType) => {
        if (serviceVehicle && serviceVehicle[serviceType]) {
            return serviceVehicle[serviceType];
        } else {
            return 'Unknown Vehicle';
        }
    };
    // ---------------------------------------------------------------------

    // -----------------------------------------------------------------------------
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
    // --------------------------------
    // http://localhost:3000
    // https://rsanotification.onrender.com
    const sendPushNotification = async (token, title, body, sound) => {
        try {
          const response = await fetch("https://rsanotification.onrender.com/send-notification", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token: token,
              title: title,
              body: body,
              sound: sound,
            }),
          });
      
          if (response.ok) {
            console.log("Notification sent successfully");
          } else {
            console.log("Failed to send notification");
          }
        } catch (error) {
          console.error("Error sending notification:", error);
        }
      };
      
      const sendNotificationsToAllDrivers = async () => {
        try {
            // Extract all FCM tokens from drivers
            const tokens = drivers.map(driver => driver.fcmToken).filter(token => token);
            const notificationTitle = "Booking Notification";
            const notificationBody = "A new booking has been added or updated.";
            const sound = "alert_notification";
    
            for (const token of tokens) {
                await sendPushNotification(token, notificationTitle, notificationBody, sound);
            }
        } catch (error) {
            console.error("Error sending notifications to all drivers:", error);
        }
    };     
      

    const addOrUpdateItem = async () => {
        if (validateForm()) {
            try {
                const selectedDriverData = drivers.find((driver) => driver.id === selectedDriver);
                const driverName = selectedDriverData ? selectedDriverData.driverName : 'DummyDriver';
                const fcmToken = selectedDriverData ? selectedDriverData.fcmToken : null;
    
                const currentDate = new Date();
                const dateTime = formatDate(currentDate); // Use the formatted date
                const distance = (parseFloat(dis1) + parseFloat(dis2) + parseFloat(dis3)).toString();
                let finalFileNumber = '';

                if (company === 'self') {
                    finalFileNumber = `PMNA${bookingId}`;
                } else if (company === 'rsa') {
                    finalFileNumber = fileNumber;
                }
                const formattedPickupLocation = {
                    name: pickupLocation?.name || '',
                    lat: pickupLocation?.lat?.toString() || '',
                    lng: pickupLocation?.lng?.toString() || ''
                };
                const totalDriverDistanceNumber = parseFloat(totalDriverDistance) || 0;

                const bookingData = {
                    ...bookingDetails,
                    driver: driverName,
                    totalSalary: totalSalary,
                    pickupLocation: formattedPickupLocation,
                    dropoffLocation: dropoffLocation || {},
                    status: 'booking added',
                    dateTime: dateTime, // Use the formatted date
                    bookingId: `${bookingId}`,
                    createdAt: serverTimestamp(),
                    comments: comments || '',
                    // totalDistance: totalDistance,
                    distance: distance || '',
                    baseLocation: baseLocation || '',
                    showroomLocation: showroomLocation,
                    company: company || '',
                    adjustValue: adjustValue || '',
                    customerName: customerName || '',
                    totalDriverDistance: totalDriverDistanceNumber || 0,
                    totalDriverSalary: totalDriverSalary || 0,
                    mobileNumber: mobileNumber || '',
                    dis1: dis1 || 0,
                    dis2: dis2 || 0,
                    dis3: dis3 || 0,
                    phoneNumber: phoneNumber || '',
                    vehicleType: vehicleType || '',
                    bodyShope: bodyShope || '',
                    statusEdit: activeForm === 'withoutMap' ? 'mapbooking' : 'withoutmapbooking',

                    serviceType: serviceType || '',
                    serviceVehicle: serviceVehicle || '',
                    serviceCategory: serviceCategory || '',
                    vehicleModel: vehicleModel || '',
                    vehicleSection: vehicleSection || '',
                    vehicleNumber: vehicleNumber || '',
                    fileNumber: finalFileNumber,
                    selectedDriver: selectedDriver || '',
                    trappedLocation: trappedLocation || '',
                    updatedTotalSalary: updatedTotalSalary || 0,
                    insuranceAmountBody: insuranceAmountBody || '',
                    paymentStatus: 'Not Paid',
                    fcmToken: userFcmToken,
                };
                if (editData) {
                    if (role === 'admin') {
                        bookingData.newStatus = `Edited by ${role}`;
                    } else if (role === 'staff') {
                        bookingData.newStatus = `Edited by ${role} ${userName}`;
                    }
                    bookingData.editedTime = formatDate(new Date());
                }
                console.log('Data to be added/updated:', bookingData); // Log the data before adding or updating
               
 
      
    if (editData) {
        const docRef = doc(db, `user/${uid}/bookings`, editData.id);
        await updateDoc(docRef, bookingData);
        console.log('Document updated');
    } else {
        const docRef = await addDoc(collection(db, `user/${uid}/bookings`), bookingData);
        console.log('Document written with ID: ', docRef.id);
        console.log('Document added');
    }
  // Check if the dummy driver is selected
  if (selectedDriver === 'dummy') {
    await sendNotificationsToAllDrivers();
} else if (fcmToken) {
    await sendPushNotification(fcmToken, "Booking Notification", "Your booking has been updated", "alert_notification");
}  
  navigate('/bookings/newbooking');
} catch (error) {
    console.error('Error adding/updating item:', error);
}
}
};
    const handleButtonClick = (event) => {
        event.preventDefault();
        setShowShowroomModal(true);
    };
    const openGoogleMaps = () => {
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupLocation)}`;
        window.open(googleMapsUrl, '_blank');
    };
    return (
        <div className={styles.bookingFormContainer}>
            <div className={styles.dateTime}>{currentDateTime}</div>
            <h2 className={styles.formHeading}>BOOK WITHOUT MAP</h2>
            <form className={styles.bookingForm}>
                <div className={styles.formGroup}>
                    <label htmlFor="company" className={styles.label}>
                        Company
                    </label>
                    <select id="company" name="company" value={company} className={styles.formControl} onChange={(e) => handleInputChange('company', e.target.value)}>
                        <option value="">Select company</option>
                        <option value="rsa">RSA Work</option>
                        <option value="self">Payment Work</option>
                    </select>
                </div>

                {company === 'rsa' && (
                    <div className={styles.flexRow}>
                        <label htmlFor="selectedCompany" className={`${styles.label}`}>
                            Select Company
                        </label>
                        <select id="selectedCompany" name="selectedCompany" className={styles.formControl} onChange={(e) => handleInputChange('selectedCompany', e.target.value)}>
                            <option value="">Select Company</option>
                            {companies.map((comp) => (
                                <option key={comp.id} value={comp.id}>
                                    {comp.company}
                                </option>
                            ))}
                        </select>
                        {companies.length === 0 && <p className={styles.errorMessage}>No companies available</p>}
                    </div>
                )}

                {company === 'self' ? (
                    <div className={styles.flexRow}>
                        <label htmlFor="fileNumber" className={`${styles.label}`}>
                            File Number
                        </label>
                        <div className={styles.inputContainer}>
                            <input id="fileNumber" type="text" name="fileNumber" placeholder="Enter File Number" className={styles.formControl} value={`PMNA${bookingId}`} readOnly />
                        </div>
                    </div>
                ) : (
                    <div className={styles.flexRow}>
                        <label htmlFor="fileNumber" className={`${styles.label}`}>
                            File Number
                        </label>
                        <div className={styles.inputContainer}>
                            <input
                                id="fileNumber"
                                type="text"
                                name="fileNumber"
                                className={styles.formControl}
                                placeholder="Enter File Number"
                                value={fileNumber}
                                onChange={(e) => handleInputChange('fileNumber', e.target.value)}
                            />
                        </div>
                    </div>
                )}

<div className={styles.formGroup}>
    <label htmlFor="pickupLocation" className={styles.label}>
        Pickup Location
    </label>
    <div className={styles.inputContainer}>
        <input
            type="text"
            id="pickupLocation"
            name="pickupLocation"
            className={`${styles.formControl} ${styles.smallInput}`}
            placeholder="Pickup Location"
            onChange={handleLocationChange}
            value={manualInput}
        />
        <input
            type="text"
            id="latLng"
            name="latLng"
            className={`${styles.formControl} ${styles.largeInput}`}
            placeholder="Latitude, Longitude"
            value={pickupLocation.lat && pickupLocation.lng ? `${pickupLocation.lat}, ${pickupLocation.lng}` : ''}
            onChange={(e) => {
                const [lat, lng] = e.target.value.split(',').map((coord) => coord.trim());
                handleManualChange('lat', parseFloat(lat));
                handleManualChange('lng', parseFloat(lng));
            }}
        />
        <a
            href={`https://www.google.com/maps/search/?api=1&query=${pickupLocation.lat},${pickupLocation.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mapButton}
        >
            <IconMapPin />
        </a>
    </div>
</div>


                <div className={styles.formGroup}>
                    <label htmlFor="baseLocation" className={styles.label}>
                        Start Location
                    </label>
                    <input
                        type="text"
                        id="baseLocation"
                        name="baseLocation"
                        className={styles.formControl}
                        placeholder="select start location"
                        value={baseLocation ? `${baseLocation.name} , ${baseLocation.lat} , ${baseLocation.lng}` : ''}
                        readOnly
                        onClick={openModal1}
                    />
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
                                        // backgroundColor: 'rgb(0,0,0)',
                                        backgroundColor: 'rgba(0,0,0,0.4)',
                                    }}
                                >
                                    <div className="modal-body">
                                        <BaseLocationWithout onClose={closeModal1} setBaseLocation={setBaseLocation} />
                                    </div>
                                </div>
                            )}
                <div className={styles.formGroup}>
    <label htmlFor="showrooms" className={styles.label}>
        Service Center
    </label>
    <div className={styles.inputContainer}>
        {showrooms.length > 0 && (
            <ReactSelect
                id="showrooms"
                name="showrooms"
                className="w-full"
                value={showrooms.find((option) => option.value === showroomLocation) || null}
                options={showrooms}
                placeholder="Select showroom"
                onChange={(selectedOption) => handleInputChange('showroomLocation', selectedOption ? selectedOption.value : '')}
                isSearchable={true}
            />
        )}
        <button onClick={handleButtonClick} className={styles.addButton}>
            <IconPlus />
        </button>
    </div>
    {showShowroomModal && (
        <ShowroomModalWithout
            onClose={() => setShowShowroomModal(false)}
            updateShowroomLocation={updateShowroomLocation}
        />
    )}
</div>


                <div className={styles.formGroup}>
                    <label htmlFor="showrooms" className={styles.label}>
                        Dropoff location
                    </label>
                    <div className={styles.inputRowOfdropoff}>
                        <input onChange={handleLocationChange1} type="text" className={styles.formControlDropOff} placeholder="Dropoff Location" value={manualInput1} />

                        <input
                            onChange={(e) => handleManualChange1('lat', e.target.value)}
                            type="text"
                            className={styles.formControlDropOff}
                            placeholder="Latitude"
                            value={dropoffLocation && dropoffLocation.lat ? dropoffLocation.lat : ''}
                        />

                        <input
                            onChange={(e) => handleManualChange1('lng', e.target.value)}
                            type="text"
                            className={styles.formControlDropOff}
                            placeholder="Longitude"
                            value={dropoffLocation && dropoffLocation.lng ? dropoffLocation.lng : ''}
                        />

                        {/* <a
                            href={`https://www.google.co.in/maps/@${dropoffLocation?.lat || '11.0527369'},${dropoffLocation?.lng || '76.0747136'},15z?entry=ttu`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.mapButton}
                        >
                            <IconMapPin />
                        </a> */}
                    </div>
                </div>

                <div>
        {/* <div className={styles.formGroup}>
            <label htmlFor="dis1" className={styles.label}>
                Distance 1 (KM)
            </label>
            <input
                id="dis1"
                type="number"
                name="dis1"
                placeholder="Distance 1"
                onChange={(e) => handleInputChange('dis1', e.target.value)}
                value={dis1}
                className={styles.formControl}
            />
        </div> */}
        <div className={styles.formGroup}>
                    <label htmlFor="dis1" className={styles.label}>
                        Distance 1 (Base to Pickup)
                    </label>
                    <div className={styles.inputWithIcon}>
                        <input id="dis1" type="number" placeholder="Enter Distance 1" onChange={(e) => handleInputChange('dis1', e.target.value)} value={dis1} className={styles.formControl} />
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&origin=${baseLocation?.lat},${baseLocation?.lng}&destination=${pickupLocation?.lat},${pickupLocation?.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.iconWrapper}
                        >
                            <IconMapPin />
                        </a>
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="dis2" className={styles.label}>
                        Distance 2 (Pickup to Dropoff)
                    </label>
                    <div className={styles.inputWithIcon}>
                        <input id="dis2" type="text" placeholder="Enter Distance 2" onChange={(e) => handleInputChange('dis2', e.target.value)} value={dis2} className={styles.formControl} />
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&origin=${pickupLocation?.lat},${pickupLocation?.lng}&destination=${dropoffLocation?.lat},${dropoffLocation?.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.iconWrapper}
                        >
                            <IconMapPin />
                        </a>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="dis3" className={styles.label}>
                        Distance 3 (Dropoff to Base)
                    </label>
                    <div className={styles.inputWithIcon}>
                        <input id="dis3" type="text" placeholder="Enter Distance 3" onChange={(e) => handleInputChange('dis3', e.target.value)} value={dis3} className={styles.formControl} />
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&origin=${dropoffLocation?.lat},${dropoffLocation?.lng}&destination=${baseLocation?.lat},${baseLocation?.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.iconWrapper}
                        >
                            <IconMapPin />
                        </a>
                    </div>
                </div>
        <div className={styles.formGroup}>
            <label htmlFor="distance" className={styles.label}>
                Total Distance (KM)
            </label>
            <input
                id="distance"
                type="number"
                name="distance"
                placeholder="Total Distance"
                value={distance}
                readOnly
                className={styles.formControl}
            />
        </div>
    </div>

                <div className={styles.trappedLocationContainer}>
                    <label htmlFor="trappedLocation" className={styles.trappedLocationLabel}>
                        Trapped Location
                    </label>
                    <div className={styles.radioButtonsGroup}>
                        <div className={styles.radioButton}>
                            <input
                                type="radio"
                                id="onRoad"
                                name="trappedLocation"
                                value="onRoad"
                                checked={trappedLocation === 'onRoad'}
                                onChange={(e) => handleInputChange('trappedLocation', e.target.value)}
                                className={styles.radioInput}
                            />
                            <label htmlFor="onRoad" className={styles.radioLabel}>
                                On Road
                            </label>
                        </div>
                        <div className={styles.radioButton}>
                            <input
                                type="radio"
                                id="inHouse"
                                name="trappedLocation"
                                value="inHouse"
                                checked={trappedLocation === 'inHouse'}
                                onChange={(e) => handleInputChange('trappedLocation', e.target.value)}
                                className={styles.radioInput}
                            />
                            <label htmlFor="inHouse" className={styles.radioLabel}>
                                In House
                            </label>
                        </div>
                        <div className={styles.radioButton}>
                            <input
                                type="radio"
                                id="outsideOfRoad"
                                name="trappedLocation"
                                value="outsideOfRoad"
                                checked={trappedLocation === 'outsideOfRoad'}
                                onChange={(e) => handleInputChange('trappedLocation', e.target.value)}
                                className={styles.radioInput}
                            />
                            <label htmlFor="outsideOfRoad" className={`${styles.radioLabel} ${styles.textDanger}`}>
                                Outside of Road
                            </label>
                        </div>
                    </div>
                </div>

                {trappedLocation === 'outsideOfRoad' && (
                    <div className={styles.formGroup}>
                        <label htmlFor="updatedTotalSalary" className={styles.label}>
                            Updated Total Amount
                        </label>
                        <input
                            id="updatedTotalSalary"
                            type="number"
                            name="updatedTotalSalary"
                            placeholder="Enter Total Salary"
                            onChange={(e) => setUpdatedTotalSalary(e.target.value)}
                            required
                            value={updatedTotalSalary}
                            className={styles.formControl}
                        />
                    </div>
                )}
                {!disableFields && (
                    <div className={styles.formGroup}>
                   <label htmlFor="serviceType" className={styles.label}>
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
                    <div className={styles.formGroup}>
                        <label htmlFor="driver" className={styles.label}>
                            Driver
                        </label>
                        <input
                            id="driver"
                            type="text"
                            name="driver"
                            placeholder="Select your driver"
                            onClick={() => openModal(distance)}
                            value={selectedDriver ? selectedDriverData?.driverName || 'DummyDriver' : ''}
                            readOnly
                            className={styles.formControl}
                        />
                    </div>
                )}
   <ReactModal
    isOpen={isModalOpen}
    onRequestClose={closeModal}
    style={{
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
        },
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
            borderRadius: '15px',
            maxWidth: '90%',
            width: '500px',
            maxHeight: '80%',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
            padding: '20px',
            overflow: 'auto',
            border: 'none',
        },
    }}
>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 999 }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
                Available Drivers for {serviceType}
            </h2>
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
                {/* Dummy driver with placeholder values */}
                <div className="flex items-center border border-gray-200 p-2 rounded-lg">
                    <table className="panel p-4 w-full">
                        <thead>
                            <tr>
                                <th>Driver Name</th>
                                <th>Payable Amount</th>
                                <th >Profit after deducting expenses</th>

                                <th>Select</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ fontSize: '18px', fontWeight: 'bold', color: 'red' }}>
                                    DummyDriver
                                </td>
                                <td>0</td>
                                <td>0</td>

                                <td>
                                    <input
                                        type="radio"
                                        name="selectedDriver"
                                        value="dummy"
                                        checked={selectedDriver === 'dummy'}
                                        onChange={() => handleInputChange('selectedDriver', 'dummy')}
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Actual drivers */}
                {drivers.sort((a, b) => {
                    if (a.companyName === 'RSA' && b.companyName !== 'RSA') return -1;
                    if (a.companyName !== 'RSA' && b.companyName === 'RSA') return 1;
                    return 0;
                }).map((driver) => {
                    const isRSA = driver.companyName === 'RSA';

                    // Calculate salary using company-specific logic
                    const calculatedSalary = calculateTotalSalary(
                        isRSA ? serviceDetails.salary : driver.basicSalaries[driver.selectedServices[0]],
                        distance,
                        isRSA ? serviceDetails.basicSalaryKM : driver.basicSalaryKm[driver.selectedServices[0]],
                        isRSA ? serviceDetails.salaryPerKM : driver.salaryPerKm[driver.selectedServices[0]],
                        isRSA
                    );
                    const expensePerKM = serviceDetails.expensePerKM || 0;
                    const profit = calculatedSalary - (distance * expensePerKM);
                
                    return (
                        <div key={driver.id} className="flex items-center border border-gray-200 p-2 rounded-lg">
                            <table className="panel p-4 w-full">
                                <thead>
                                    <tr>
                                        <th>Driver Name</th>
                                        <th>Payable Amount</th>
                                        <th >Profit after deducting expenses</th>

                                        <th>Select</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ fontSize: '18px', fontWeight: 'bold', color: 'green' }}>
                                            {driver.driverName || 'Unknown Driver'}
                                        </td>
                                        <td>{calculatedSalary.toFixed(2)}</td> {/* Display Payable Amount */}
                                        <td>{profit.toFixed(2)}</td> {/* Display Profit */}                                        <td>
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
    </div>
</ReactModal>


                {selectedDriver && selectedDriverData && (
                    <React.Fragment>
                        <div>
                            <VehicleSection
                                showroomLocation={showroomLocation}
                                totalSalary={totalSalary}
                                updatedTotalSalary={updatedTotalSalary}
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
                            <div>Selected Service Category: {availableServices}</div>
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
                                <div className="form-input flex-1">{insuranceAmountBody}</div>
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
                )}
                <div className={styles.formGroup}>
                    <label htmlFor="serviceVehicle" className={styles.label}>
                        Service Vehicle Number
                    </label>
                    <input
                        id="serviceVehicle"
                        name="serviceVehicle"
                        type="text"
                        placeholder="Enter Service Vehicle Number"
                        onChange={(e) => handleInputChange('serviceVehicle', e.target.value)}
                        required
                        value={serviceVehicle}
                        className={styles.formControl}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="totalDriverDistance" className={styles.label}>
                        Total Driver Distance
                    </label>
                    <input
                        id="totalDriverDistance"
                        type="number"
                        name="totalDriverDistance"
                        placeholder="Enter Driver Distance"
                        onChange={(e) => handleInputChange('totalDriverDistance', e.target.value)}
                        value={totalDriverDistance}
                        className={styles.formControl}
                    />
                </div>
                {totalDriverDistance && (
                    <div className={styles.formGroup}>
                        <label htmlFor="totalDriverSalary" className={styles.label}>
                            Driver Salary
                        </label>
                        <input
                            id="totalDriverSalary"
                            type="text"
                            name="totalDriverSalary"
                            placeholder="Enter Driver Salary"
                            onChange={(e) => handleInputChange('totalDriverSalary', e.target.value)}
                            value={totalDriverSalary}
                            className={styles.formControl}
                        />
                    </div>
                )}
                <div className={styles.formGroup}>
                    <label htmlFor="customerName" className={styles.label}>
                        Customer Name
                    </label>
                    <input
                        id="customerName"
                        name="customerName"
                        type="text"
                        placeholder="Enter Name"
                        onChange={(e) => handleInputChange('customerName', e.target.value)}
                        value={customerName}
                        className={styles.formControl}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="phoneNumber" className={styles.label}>
                        Phone Number
                    </label>
                    <input
                        id="phoneNumber"
                        type="tel"
                        name="phoneNumber"
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        className={styles.formControl}
                        value={phoneNumber}
                        placeholder="Enter Phone number"
                    />
                    {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="mobileNumber" className={styles.label}>
                        Mobile Number
                    </label>
                    <input
                        type="tel"
                        id="mobileNumber"
                        onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                        name="mobileNumber"
                        className={styles.formControl}
                        value={mobileNumber}
                        placeholder="Enter your Mobile number"
                    />
                    {errors.mobileNumber && <p className="text-red-500 text-sm mt-1">{errors.mobileNumber}</p>}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="vehicleNumber" className={styles.label}>
                        Customer Vehicle Number
                    </label>
                    <input
                        id="vehicleNumber"
                        type="text"
                        name="vehicleNumber"
                        placeholder="Enter vehicle number"
                        onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                        value={vehicleNumber}
                        className={styles.formControl}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="vehicleType" className={styles.label}>
                        Vehicle Type (2 or 3 or 4 wheeler)
                    </label>
                    <div className={styles.inputContainer}>
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
                            <option value="6">8 Wheeler</option>
                            <option value="8">12 Wheeler</option>
                            <option value="8">14 Wheeler</option>

                            <option value="8">16 Wheeler</option>
                            <option value="8">20 Wheeler</option>
                        </select>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="vehicleModel" className={styles.label}>
                        Brand Name
                    </label>
                    <input
                        id="vehicleModel"
                        name="vehicleModel"
                        type="text"
                        placeholder="Brand name"
                        onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                        value={vehicleModel}
                        className={styles.formControl}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="showrooms" className={styles.label}>
                        Comments
                    </label>
                    <textarea
                        id="reciever-name"
                        placeholder="Comments"
                        name="reciever-name"
                        onChange={(e) => handleInputChange('comments', e.target.value)}
                        value={comments}
                        className={styles.formControl}
                    />
                </div>

                <button type="button" onClick={addOrUpdateItem} className={styles.submitButton}>
                    {editData ? 'Update' : 'Save'}
                </button>
            </form>
        </div>
    );
};
export default WithoutMapBooking;
