import React, { useEffect, useState } from 'react';
import { DataTable } from 'mantine-datatable';
import { Link, useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, orderBy, query, where, onSnapshot, getDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import styles from './newbooking.module.css';
import { Modal, Pagination } from '@mantine/core'; // Import Pagination from Mantine
import axios from 'axios';
import { Button, TextInput, Textarea } from '@mantine/core';
// --------------------------
const modalContainerStyle = {
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '10px',
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    maxWidth: '600px',
    margin: '0 auto',
};

const locationCardStyle = {
    marginBottom: '15px',
    padding: '15px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    borderLeft: '5px solid #4CAF50',
};

const locationTitleStyle = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '5px',
};

const locationTextStyle = {
    fontSize: '14px',
    color: '#555',
    lineHeight: '1.5',
};

type RecordData = {
    index: number;
    customerName: string;
    fileNumber: string;
    selectedDriver: string;
    phoneNumber: string;
    driver: string;
    totalSalary: string;
    photo: string;
    id: string;
    dateTime: string;
    status: string;
    bookingStatus: string;
    createdAt: any;
    requestBool: boolean;
    requestBool1: boolean;
    currentLocation?: string;
    phone?: string;
    vehicleNumber: string;
    newStatus: string;
    cancelReason?: string;
    amount?: any;
    updatedTotalSalary?: any;
    distance?: any;
    totalDriverSalary?: any;
    totalDriverDistance?: any;
    companyBooking?: boolean;
    kilometerDrop?: KilometerDrop; // Add this
    serviceType?: string;
    selectedCompany?:string;
};
type KilometerDrop = {
    km: string;
    kmImage: string;
};
interface Location {
    name?: string;
    lat?: string;
    lng?: string;
}

interface ModalData {
    pickupLocation?: {
        name?: string;
        lat?: number;
        lng?: number;
    };
    currentLocation?: {
        lat?: number;
        lng?: number;
    };
    dropoffLocation?: {
        name?: string;
        lat?: number;
        lng?: number;
    };
    pickupDistance?: string; // Add this line to include the new property
    dropoffDistance?: string; // Add this line to include the new property
}

const statuses = [
    'booking added',
    'called to customer',
    'Order Received',
    'On the way to pickup location',
    'Vehicle Picked',
    'Vehicle Confirmed',

    'On the way to dropoff location',
    'Vehicle Dropped',
    'Order Completed',
    'Cancelled',
];
// ---------------------------------------------------------------
const NewBooking = () => {
    const [recordsData, setRecordsData] = useState<RecordData[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<RecordData[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<RecordData | null>(null);
    const [modalData, setModalData] = useState<ModalData>({
        pickupLocation: undefined,
        dropoffLocation: undefined,
        currentLocation: undefined,
    });
    // -----------------------------------------------------
    const [totalDriverSalary, setTotalDriverSalary] = useState<number>(0);
    const [updatedTotalSalary, setUpdatedTotalSalary] = useState<number>(0);

    const PAGE_SIZES = [10, 25, 'All'];
    const db = getFirestore();
    const navigate = useNavigate();
    const uid = sessionStorage.getItem('uid');
    const currentDate = new Date().toISOString().split('T')[0];
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalOpen1, setIsModalOpen1] = useState(false);
    const [changeRequestType, setChangeRequestType] = useState<'pickup' | 'dropoff' | null>(null);
    console.log('currentDate', currentDate);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelFormData, setCancelFormData] = useState({
        totalDriverDistance: '',
        totalDriverSalary: '',
        distance: '',
        updatedTotalSalary: '',
        amount: '',
        cancelReason: '',
        km: '', // Add this field
        kmImage: '',
    });

    // Open and close modal functions
    const openCancelModal = (record: RecordData) => {
        setSelectedRecord(record);
        setCancelFormData({
            totalDriverDistance: record.totalDriverDistance || '',
            totalDriverSalary: record.totalDriverSalary || '',
            distance: record.distance || '',
            updatedTotalSalary: record.updatedTotalSalary || '',
            amount: record.companyBooking ? '0' : record.updatedTotalSalary || '',
            cancelReason: record.cancelReason || '',
            km: record.kilometerDrop?.km || '', // Set km
            kmImage: record.kilometerDrop?.kmImage || '',
        });
        setIsCancelModalOpen(true);
    };
    const closeCancelModal = () => setIsCancelModalOpen(false);
    // -----------------------------------------------------------------
    const calculateUpdatedTotalSalary = (distance: number, basicSalaryKmm: string, salaryPerKMM: string, salaryy: string) => {
        const salaryNumber = parseFloat(salaryy);
        console.log("salaryNumber",salaryNumber)
        if (distance > parseFloat(basicSalaryKmm)) {
            const updatedTotalSalary = salaryNumber + (distance - parseFloat(basicSalaryKmm)) * parseFloat(salaryPerKMM);
            setUpdatedTotalSalary(updatedTotalSalary);
console.log("updatedTotalSalary",updatedTotalSalary)
        } else {
            // If not, just return the basic salary
            setUpdatedTotalSalary(salaryNumber); // Update the state with the base salary if condition is not met
        }
    };
    
    const calculateTotalDriverSalary = (
        totalDriverDistance: number,
        basicSalaryKM: string,
        salaryPerKM: string,
        salary: string
      ): number => {
        const salaryNumber = parseFloat(salary);
        let totalSalary;
      
        if (totalDriverDistance > parseFloat(basicSalaryKM)) {
          totalSalary = salaryNumber + (totalDriverDistance - parseFloat(basicSalaryKM)) * parseFloat(salaryPerKM);
        } else {
          totalSalary = salaryNumber; // Base salary if distance is within the basic range
        }
      
        setTotalDriverSalary(totalSalary); // Update the state
        return totalSalary; // Return the calculated value
      };
      

    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCancelFormData({ ...cancelFormData, [name]: value });
    
        // When totalDriverDistance changes, recalculate the salary
        if (name === 'totalDriverDistance') {
            const totalDistance = parseFloat(value);
    
            if (selectedRecord) {
                const driverId = selectedRecord.selectedDriver;
                const serviceType = selectedRecord.serviceType;
    
                // Ensure serviceType is defined before proceeding
                if (!serviceType) {
                    console.error("Service type is undefined");
                    return;
                }
    
                console.log('serviceType', serviceType);
                console.log('driverId', driverId);
    
                const driverRef = doc(db, `user/${uid}/driver`, driverId);
                const driverDoc = await getDoc(driverRef);
                const driverData = driverDoc.data();
    
                console.log('driverData', driverData);
    
                if (driverData) {
                    const { basicSalaryKm, salaryPerKm, basicSalaries } = driverData;
    
                    if (basicSalaryKm && salaryPerKm && basicSalaries) {
                        const basicSalaryKM = basicSalaryKm[serviceType];
                        const salaryPerKM = salaryPerKm[serviceType];
                        const salary = basicSalaries[serviceType];
    
                        // Ensure all values are valid before calculating
                        if (basicSalaryKM && salaryPerKM && salary) {
                            const calculatedSalary = calculateTotalDriverSalary(
                                totalDistance,
                                basicSalaryKM,
                                salaryPerKM,
                                salary
                            );
    
                            setCancelFormData({
                                ...cancelFormData,
                                totalDriverSalary: calculatedSalary.toFixed(2),
                            });
                        } else {
                            console.error("Missing salary data for service type");
                        }
                    }
                }
            }
        }
    };
    const handleInputChanged = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCancelFormData({ ...cancelFormData, [name]: value });
    
        if (name === 'distance') {
            const totalDistance = parseFloat(value);
            if (isNaN(totalDistance)) {
                console.error("Invalid distance value.");
                return;
            }
    
            if (selectedRecord) {
                const { serviceType, companyBooking, selectedCompany } = selectedRecord;
    
                if (!serviceType) {
                    console.error("Service type is undefined");
                    return;
                }
    
                console.log('serviceType', serviceType);
                console.log('companyBooking', companyBooking);
    
                if (!companyBooking) {
                    // Handle non-company booking
                    const serviceRef = query(
                        collection(db, `user/${uid}/service`),
                        where('name', '==', serviceType)
                    );
    
                    const serviceSnapshot = await getDocs(serviceRef);
                    if (!serviceSnapshot.empty) {
                        const serviceDoc = serviceSnapshot.docs[0];
                        const serviceData = serviceDoc.data();
    
                        console.log('serviceData', serviceData);
    
                        if (serviceData) {
                            const { basicSalaryKM, salaryPerKM, salary } = serviceData;
    
                            if (basicSalaryKM && salaryPerKM && salary) {
                                const calculatedSalary = calculateUpdatedTotalSalary(
                                    totalDistance,
                                    basicSalaryKM,
                                    salaryPerKM,
                                    salary
                                );
    
                                setCancelFormData({
                                    ...cancelFormData,
                                    updatedTotalSalary: calculatedSalary.toFixed(2),
                                });
                            } else {
                                console.error("Missing salary data for service type");
                            }
                        }
                    } else {
                        console.error('No service found for the given serviceType');
                    }
                } else {
                    // Handle company booking
                    if (!selectedCompany) {
                        console.error("Company ID is undefined");
                        return;
                    }
    
                    const companyRef = doc(db, `user/${uid}/driver`, selectedCompany);
                    const companyDoc = await getDoc(companyRef);
                    const companyData = companyDoc.data();
    
                    console.log('companyData', companyData);
    
                    if (companyData) {
                        const { basicSalaryKm, salaryPerKm, basicSalaries } = companyData;
    
                        if (basicSalaryKm && salaryPerKm && basicSalaries) {
                            const basicSalaryKM = basicSalaryKm[serviceType];
                            const salaryPerKM = salaryPerKm[serviceType];
                            const salary = basicSalaries[serviceType];
    
                            if (basicSalaryKM && salaryPerKM && salary) {
                                const calculatedSalary = calculateUpdatedTotalSalary(
                                    totalDistance,
                                    basicSalaryKM,
                                    salaryPerKM,
                                    salary
                                );
    
                                setCancelFormData({
                                    ...cancelFormData,
                                    totalDriverSalary: calculatedSalary.toFixed(2),
                                });
                            } else {
                                console.error("Missing salary data for service type");
                            }
                        }
                    }
                }
            }
        }
    };
    
    
    // -----------------------------------------------------------------------------------------
    // Submit the form
    const handleCancelBookingSubmit = async () => {
        try {
            if (!selectedRecord?.id) {
                console.error('No booking ID found for the selected record.');
                return;
            }

            // Get the document reference for the booking
            const bookingRef = doc(db, `user/${uid}/bookings`, selectedRecord.id);

            // Prepare the data to update
            const updatedData = {
                totalDriverDistance: cancelFormData.totalDriverDistance,
                totalDriverSalary: totalDriverSalary,
                distance: cancelFormData.distance,
                updatedTotalSalary: updatedTotalSalary,
                amount: selectedRecord?.companyBooking ? '0' : cancelFormData.updatedTotalSalary,
                cancelReason: cancelFormData.cancelReason,
                status: 'Order Completed', // Update the status to 'Cancelled'
            };

            // Update the document in Firestore
            await updateDoc(bookingRef, updatedData);

            // Close the modal after submission
            closeCancelModal();
        } catch (error) {
            console.error('Error updating cancel booking:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const bookingsQuery = query(collection(db, `user/${uid}/bookings`), orderBy('createdAt', 'desc'));

                const driverQuery = collection(db, `user/${uid}/driver`);

                const [bookingSnapshot, driverSnapshot] = await Promise.all([getDocs(bookingsQuery), getDocs(driverQuery)]);

                // Map driver IDs to phone numbers
                const driverPhoneMap: Record<string, string> = {};
                driverSnapshot.forEach((doc) => {
                    const driverData = doc.data();
                    if (driverData) {
                        driverPhoneMap[doc.id] = driverData.phone || 'N/A';
                    }
                });

                // Process booking data
                const bookings: RecordData[] = bookingSnapshot.docs.map((doc) => {
                    const docData = doc.data();
                    return {
                        ...docData,
                        id: doc.id,
                        createdAt:
                            docData.createdAt instanceof Timestamp
                                ? docData.createdAt.toDate().toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                  })
                                : docData.createdAt,

                        phone: driverPhoneMap[docData.selectedDriver] || 'N/A', // Fetch phone number
                    } as RecordData;
                });

                const filteredBookings = bookings.filter((record) => record.status !== 'Order Completed');

                setRecordsData(filteredBookings);
                setFilteredRecords(filteredBookings);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [uid]);

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        const filtered = recordsData.filter(
            (record) =>
                (record.customerName?.toLowerCase().includes(term) ?? false) ||
                (record.fileNumber?.toLowerCase().includes(term) ?? false) ||
                (record.phoneNumber?.toLowerCase().includes(term) ?? false) ||
                (record.driver?.toLowerCase().includes(term) ?? false) ||
                (record.dateTime?.toLowerCase().includes(term) ?? false) ||
                (record.bookingStatus?.toLowerCase().includes(term) ?? false)
        );
        setFilteredRecords(filtered);
        setPage(1); // Reset to first page when search term changes
    }, [searchTerm, recordsData]);

    const handleEdit = (rowData: RecordData) => {
        navigate(`/bookings/booking/${rowData.id}`, { state: { editData: rowData } });
    };

    const totalPages = Math.ceil(filteredRecords.length / pageSize);
    const displayedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);
    // -----------------------------------------

    const handleTrackDetails = (rowData: RecordData) => {
        console.log('Row data:', rowData); // Check if the rowData has the expected data

        if (rowData.status === 'Cancelled') {
            openCancelModal(rowData);
        } else {
            setSelectedRecord(rowData);
            setIsModalOpen(true);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRecord(null);
    };

    // Helper function to get button styles
    const getStatusButtonStyle = (status: any, selectedStatus: any) => {
        if (status === selectedStatus) {
            return { backgroundColor: 'green', color: '#fff' };
        } else if (statuses.indexOf(status) < statuses.indexOf(selectedStatus)) {
            return { backgroundColor: 'lightgreen', color: '#333', cursor: 'not-allowed' };
        } else {
            return { backgroundColor: '#d9d9d9', color: '#333' };
        }
    };
    const handleStatusClick = (bookingId: string) => {
        navigate(`/bookings/newbooking/track/${bookingId}`);
    };

    const handlePickChange = async (rowData: RecordData) => {
        setChangeRequestType('pickup');

        try {
            // Fetch pickup location from booking document
            const bookingDoc = await getDoc(doc(db, `user/${uid}/bookings`, rowData.id));
            const pickupLocation = bookingDoc.exists() ? bookingDoc.data().pickupLocation : null;

            // Real-time listener for currentLocation of the driver
            const driverDocRef = doc(db, `user/${uid}/driver`, rowData.selectedDriver);

            // Listen for changes in currentLocation in real-time
            onSnapshot(driverDocRef, async (driverDoc) => {
                if (driverDoc.exists()) {
                    const driverData = driverDoc.data();
                    const currentLocation = driverData?.currentLocation;
                    if (pickupLocation?.lat && pickupLocation?.lng && currentLocation?.latitude && currentLocation?.longitude) {
                        try {
                            const response = await axios.post('https://api.olamaps.io/routing/v1/directions', null, {
                                params: {
                                    origin: `${currentLocation.latitude},${currentLocation.longitude}`,
                                    destination: `${pickupLocation.lat},${pickupLocation.lng}`,
                                    api_key: import.meta.env.VITE_REACT_APP_API_KEY,
                                },
                                headers: {
                                    'X-Request-Id': `${rowData.id}-${Date.now()}`,
                                },
                            });

                            let distance = 'Distance not available';
                            const routes = response.data.routes;
                            // Check if routes are returned and calculate distance
                            if (routes?.length > 0 && routes[0]?.legs?.length > 0) {
                                distance = routes[0].legs[0].readable_distance || 'Distance not available';
                            }

                            // Update modal data with the latest currentLocation and calculated distance
                            setModalData({
                                pickupLocation: pickupLocation || {},
                                currentLocation: {
                                    lat: currentLocation.latitude,
                                    lng: currentLocation.longitude,
                                },
                                pickupDistance: distance, // Update with the calculated distance
                            });
                        } catch (distanceError) {
                            console.error('Error calculating distance:', distanceError);

                            // If error, show appropriate message in modalData
                            setModalData({
                                pickupLocation: pickupLocation || {},
                                currentLocation: {
                                    lat: currentLocation.latitude,
                                    lng: currentLocation.longitude,
                                },
                                pickupDistance: 'Error fetching distance',
                            });
                        }
                    } else {
                        console.error('Invalid locations for distance calculation.');
                        // If locations are invalid
                        setModalData({
                            pickupLocation: pickupLocation || {},
                            currentLocation: currentLocation ? { lat: currentLocation.latitude, lng: currentLocation.longitude } : {},
                            pickupDistance: 'Invalid location data',
                        });
                    }
                } else {
                    console.error('Driver document does not exist.');
                }
            });

            // Set selected record and open modal
            setSelectedRecord(rowData);
            setIsModalOpen1(true);
        } catch (error) {
            console.error('Error fetching location data:', error);
        }
    };
    const handleApproveRequest = async () => {
        if (!modalData.currentLocation?.lat || !modalData.currentLocation?.lng || !modalData.pickupLocation?.name || !selectedRecord) {
            console.error('Missing location data.');
            return;
        }
        try {
            const bookingRef = doc(db, `user/${uid}/bookings`, selectedRecord.id);

            // Update the pickupLocation in Firestore with the currentLocation
            await updateDoc(bookingRef, {
                status: 'Vehicle Picked',
                pickupLocation: {
                    lat: modalData.currentLocation.lat.toString(), // Convert to string
                    lng: modalData.currentLocation.lng.toString(), // Convert to string
                    name: modalData.pickupLocation.name, // Keep the same name
                },
            });

            console.log('Pickup location updated successfully.');
            alert('Pickup location updated successfully.');
        } catch (error) {
            console.error('Error updating pickup location:', error);
            alert('Failed to update pickup location.');
        }
    };
    const handleDropChange = async (rowData: RecordData) => {
        setChangeRequestType('dropoff');

        try {
            // Fetch pickup location from booking document
            const bookingDoc = await getDoc(doc(db, `user/${uid}/bookings`, rowData.id));
            const dropoffLocation = bookingDoc.exists() ? bookingDoc.data().dropoffLocation : null;

            // Real-time listener for currentLocation of the driver
            const driverDocRef = doc(db, `user/${uid}/driver`, rowData.selectedDriver);

            // Listen for changes in currentLocation in real-time
            onSnapshot(driverDocRef, async (driverDoc) => {
                if (driverDoc.exists()) {
                    const driverData = driverDoc.data();
                    const currentLocation = driverData?.currentLocation;
                    if (dropoffLocation?.lat && dropoffLocation?.lng && currentLocation?.latitude && currentLocation?.longitude) {
                        try {
                            const response = await axios.post('https://api.olamaps.io/routing/v1/directions', null, {
                                params: {
                                    origin: `${currentLocation.latitude},${currentLocation.longitude}`,
                                    destination: `${dropoffLocation.lat},${dropoffLocation.lng}`,
                                    api_key: import.meta.env.VITE_REACT_APP_API_KEY,
                                },
                                headers: {
                                    'X-Request-Id': `${rowData.id}-${Date.now()}`,
                                },
                            });

                            let distance = 'Distance not available';
                            const routes = response.data.routes;
                            // Check if routes are returned and calculate distance
                            if (routes?.length > 0 && routes[0]?.legs?.length > 0) {
                                distance = routes[0].legs[0].readable_distance || 'Distance not available';
                            }

                            // Update modal data with the latest currentLocation and calculated distance
                            setModalData({
                                dropoffLocation: dropoffLocation || {},
                                currentLocation: {
                                    lat: currentLocation.latitude,
                                    lng: currentLocation.longitude,
                                },
                                dropoffDistance: distance, // Update with the calculated distance
                            });
                        } catch (distanceError) {
                            console.error('Error calculating distance:', distanceError);

                            // If error, show appropriate message in modalData
                            setModalData({
                                dropoffLocation: dropoffLocation || {},
                                currentLocation: {
                                    lat: currentLocation.latitude,
                                    lng: currentLocation.longitude,
                                },
                                dropoffDistance: 'Error fetching distance',
                            });
                        }
                    } else {
                        console.error('Invalid locations for distance calculation.');
                        // If locations are invalid
                        setModalData({
                            dropoffLocation: dropoffLocation || {},
                            currentLocation: currentLocation ? { lat: currentLocation.latitude, lng: currentLocation.longitude } : {},
                            dropoffDistance: 'Invalid location data',
                        });
                    }
                } else {
                    console.error('Driver document does not exist.');
                }
            });

            // Set selected record and open modal
            setSelectedRecord(rowData);
            setIsModalOpen1(true);
        } catch (error) {
            console.error('Error fetching location data:', error);
        }
    };
    const handleApproveDropRequest = async () => {
        if (!modalData.currentLocation?.lat || !modalData.currentLocation?.lng || !modalData.dropoffLocation?.name || !selectedRecord) {
            console.error('Missing location data.');
            return;
        }
        try {
            const bookingRef = doc(db, `user/${uid}/bookings`, selectedRecord.id);

            // Update the pickupLocation in Firestore with the currentLocation
            await updateDoc(bookingRef, {
                dropoffLocation: {
                    lat: modalData.currentLocation.lat.toString(), // Convert to string
                    lng: modalData.currentLocation.lng.toString(), // Convert to string
                    name: modalData.dropoffLocation.name.split(',')[0], // Keep only the name
                },
            });

            console.log('dropoffLocation location updated successfully.');
            alert('dropoffLocation updated successfully.');
        } catch (error) {
            console.error('Error updating dropoffLocation location:', error);
            alert('Failed to update dropoffLocation location.');
        }
    };
    const closeModal1 = () => {
        setIsModalOpen1(false);
        setSelectedRecord(null);
    };
    return (
        <div style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h5 style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>New Bookings</h5>
                <Link to="/bookings/booking" style={{ textDecoration: 'none' }}>
                    <button
                        style={{
                            padding: '10px 20px',
                            color: '#fff',
                            backgroundColor: '#28a745',
                            border: 'none',
                            borderRadius: '7px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                            transition: 'background-color 0.3s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#218838')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#28a745')}
                    >
                        Add Booking
                    </button>
                </Link>
            </div>
            {/* Color Legend Section */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
                    <span
                        style={{
                            width: '20px', // Increased size
                            height: '20px', // Increased size
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            display: 'inline-block',
                            marginRight: '8px',
                            border: '2px solid #d6d6d6', // Solid border
                        }}
                    ></span>
                    <span>Booking (Today)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
                    <span
                        style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: '#e0f7fa',
                            borderRadius: '50%',
                            display: 'inline-block',
                            marginRight: '8px',
                            border: '2px solid #a3a3a3',
                        }}
                    ></span>
                    <span>ShowRoom Booking (Today)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
                    <span
                        style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: '#ffffe0',
                            borderRadius: '50%',
                            display: 'inline-block',
                            marginRight: '8px',
                            border: '2px solid #d6d6d6',
                        }}
                    ></span>
                    <span>ShowRoom Booking (Past Date)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span
                        style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: '#f8d7da',
                            borderRadius: '50%',
                            display: 'inline-block',
                            marginRight: '8px',
                            border: '2px solid #c3c3c3',
                        }}
                    ></span>
                    <span>Other Bookings (Past Date)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span
                        style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: '#f1807e',
                            borderRadius: '50%',
                            display: 'inline-block',
                            marginRight: '8px',
                            border: '2px solid #c3c3c3',
                        }}
                    ></span>
                    <span>Rejected Bookings</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span
                        style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: '#daa520',
                            borderRadius: '50%',
                            display: 'inline-block',
                            marginRight: '8px',
                            border: '2px solid #c3c3c3',
                        }}
                    ></span>
                    <span>Cancelled Bookings</span>
                </div>
            </div>

            <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                    width: '100%',
                    boxSizing: 'border-box',
                    marginBottom: '10px',
                }}
            />

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Date & Time</th>
                            <th>File Number</th>
                            <th>Customer Vehicle Number</th>

                            <th>Customer Phone Number</th>
                            <th>Driver</th>
                            <th>Driver PhoneNumber</th>
                            <th>Booked Staff</th>

                            <th>View More</th>
                            <th>Edit</th>
                            <th>Tracking</th>
                            {displayedRecords.some((row) => row.requestBool || row.requestBool1) && <th colSpan={3}>Change Location</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {displayedRecords.map((rowData, index) => {
                            // Format currentDate to 'DD/MM/YYYY'
                            const currentDateFormatted = new Date(currentDate);
                            const formattedCurrentDate = `${currentDateFormatted.getDate().toString().padStart(2, '0')}/${(currentDateFormatted.getMonth() + 1)
                                .toString()
                                .padStart(2, '0')}/${currentDateFormatted.getFullYear()}`;

                            // Format dateTimeFormatted from rowData.createdAt to 'DD/MM/YYYY'
                            const dateTimeFormatted = rowData.createdAt;

                            // Log both dates to verify
                            console.log('currentDateFormatted:', formattedCurrentDate);
                            console.log('dateTimeFormatted:', rowData.createdAt);

                            let rowBackgroundColor = '#ffffff'; // Default background color
                            let color = '#000000'; // Default text color

                            // Check for 'Cancelled' status first
                            if (rowData.status === 'Cancelled') {
                                rowBackgroundColor = '#daa520'; // Light red background for 'Cancelled' status
                                color = 'white'; // White text for 'Cancelled' status
                            } else if (rowData.status === 'Rejected') {
                                rowBackgroundColor = '#f1807e'; // Light red for 'Rejected'
                                color = '#000000'; // Black text for 'Rejected'
                            } else if (rowData.bookingStatus === 'ShowRoom Booking' && dateTimeFormatted !== formattedCurrentDate) {
                                rowBackgroundColor = '#ffffe0'; // Yellow for 'ShowRoom Booking' with date mismatch
                                color = '#000000'; // Black text for 'ShowRoom Booking' date mismatch
                            } else if (rowData.bookingStatus === 'ShowRoom Booking') {
                                rowBackgroundColor = '#e0f7fa'; // Light blue for "ShowRoom Booking"
                                color = '#000000'; // Black text for "ShowRoom Booking"
                            } else if (dateTimeFormatted !== formattedCurrentDate) {
                                rowBackgroundColor = '#f8d7da'; // Light red for other date mismatch cases
                                color = '#000000'; // Black text for date mismatch
                            }
                            return (
                                <tr
                                    key={rowData.id}
                                    style={{
                                        backgroundColor: rowBackgroundColor,
                                    }}
                                >
                                    <td data-label="#"> {index + 1} </td>
                                    <td data-label="Date & Time">{rowData.createdAt}</td>
                                    <td data-label="File Number">{rowData.fileNumber}</td>
                                    <td data-label="Customer Vehicle Number">{rowData.vehicleNumber}</td>

                                    <td data-label="Customer Phone Number">{rowData.phoneNumber}</td>
                                    <td data-label="Driver">{rowData.driver}</td>
                                    <td data-label="Driver PhoneNumber">{rowData.phone || 'N/A'}</td>
                                    <td data-label="Booked Staff">{rowData.newStatus}</td>

                                    <td data-label="View More">
                                        <Link
                                            to={`/bookings/newbooking/viewmore/${rowData.id}`}
                                            style={{
                                                padding: '5px 10px',
                                                color: '#fff',
                                                backgroundColor: '#007bff',
                                                borderRadius: '5px',
                                                textDecoration: 'none',
                                                display: 'inline-block',
                                                transition: 'background-color 0.3s',
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
                                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
                                        >
                                            View More
                                        </Link>
                                    </td>
                                    <td data-label="Edit">
                                        <button
                                            onClick={() => handleEdit(rowData)}
                                            style={{
                                                padding: '5px 10px',
                                                color: '#fff',
                                                backgroundColor: '#ffc107',
                                                border: 'none',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.3s',
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0a800')}
                                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffc107')}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                    <td data-label="Tracking">
                                        {rowData.status === 'Cancelled' ? (
                                            <button
                                                onClick={() => handleTrackDetails(rowData)}
                                                style={{
                                                    padding: '5px 10px',
                                                    color: '#fff',
                                                    backgroundColor: '#ff5722',
                                                    borderRadius: '5px',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Settle Cancel Bookings
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleTrackDetails(rowData)}
                                                style={{
                                                    padding: '5px 10px',
                                                    color: '#fff',
                                                    backgroundColor: '#28a745',
                                                    borderRadius: '5px',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Track Details
                                            </button>
                                        )}
                                    </td>
                                    {/* ----------------------------------------------------------------- */}
                                    {rowData.requestBool == true && (
                                        <td data-label="Change Pickup Location">
                                            <button
                                                onClick={() => handlePickChange(rowData)}
                                                style={{
                                                    padding: '5px 10px',
                                                    color: '#fff',
                                                    backgroundColor: '#dc3545', // changed background for distinction
                                                    borderRadius: '5px',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.3s',
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
                                            >
                                                Pickup Change Request
                                            </button>
                                        </td>
                                    )}
                                    {rowData.requestBool1 == true && (
                                        <td data-label="Change Dropoff Location">
                                            <button
                                                onClick={() => handleDropChange(rowData)}
                                                style={{
                                                    padding: '5px 10px',
                                                    color: '#fff',
                                                    backgroundColor: '#dc3545', // changed background for distinction
                                                    borderRadius: '5px',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.3s',
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#c82333')}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
                                            >
                                                Dropoff Change Request
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                    <Modal opened={isCancelModalOpen} onClose={closeCancelModal} title="Settle Cancel Bookings" overlayOpacity={0.6} overlayBlur={2} size="lg" centered>
                        <div style={modalContainerStyle}>
                            <TextInput label="Driver Entered Kilometer" name="km" value={cancelFormData.km} onChange={handleInputChange} placeholder="Enter kilometer" readOnly />
                            <div>
                                <label style={{ marginBottom: '5px', display: 'block' }}>Driver Kilometer Image:</label>
                                {cancelFormData.kmImage && <img src={cancelFormData.kmImage} alt="Kilometer" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', marginBottom: '10px' }} />}
                            </div>
                            <TextInput
                                label="Total Distance Traveled By the Driver"
                                name="totalDriverDistance"
                                value={cancelFormData.totalDriverDistance}
                                onChange={handleInputChange}
                                placeholder="Enter driver kilometers"
                            />
                            <TextInput label="Driver Amount" name="totalDriverSalary" value={totalDriverSalary} onChange={handleInputChange} placeholder="Enter driver amount" />
                            <TextInput label="Total Km (Base to Pickup - pickup to dropoff - dropoff to base)" name="distance" value={cancelFormData.distance} onChange={handleInputChanged} placeholder="Enter company kilometers" />

                            {!selectedRecord?.companyBooking && (
                                <TextInput label="Payable Amount Customer" name="amount" value={updatedTotalSalary} onChange={handleInputChange} placeholder="Enter Amount" />
                            )}
                                                        {selectedRecord?.companyBooking && (

                            <TextInput
                                label="Payable Amount By Company"
                                name="updatedTotalSalary"
                                value={updatedTotalSalary}
                                onChange={handleInputChanged}
                                placeholder="Enter company amount"
                            />
                                                        )}
                            <Textarea label="Remark (Cancel Reason)" name="cancelReason" value={cancelFormData.cancelReason} onChange={handleInputChange} placeholder="Enter reason for cancellation" />
                            <Button onClick={handleCancelBookingSubmit} fullWidth mt="lg" color="green">
                                Submit
                            </Button>
                        </div>
                    </Modal>

                    <Modal opened={isModalOpen} onClose={closeModal} title="Track Details">
                        {selectedRecord ? (
                            <div>
                                <p>
                                    <strong>Booking Status:</strong> {selectedRecord.status}
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
                                    {statuses.map((status) => (
                                        <button
                                            key={status}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '5px',
                                                border: 'none',
                                                ...getStatusButtonStyle(status, selectedRecord.status),
                                            }}
                                            disabled={statuses.indexOf(status) < statuses.indexOf(selectedRecord.status)}
                                            onClick={() => handleStatusClick(selectedRecord.id)} // Call the handler on click
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p>No record selected.</p>
                        )}
                    </Modal>
                </table>
            </div>
            <Modal
                opened={isModalOpen1}
                onClose={closeModal1}
                title="Change Location"
                overlayOpacity={0.8} // Adjust overlay darkness
                overlayBlur={2} // Add a blur effect to the background
                centered // Center the modal
            >
                {modalData && changeRequestType === 'pickup' && (
                    <div style={modalContainerStyle}>
                        {selectedRecord?.requestBool && (
                            <div style={locationCardStyle}>
                                <h5 style={locationTitleStyle}>Pickup Location:</h5>
                                <p style={locationTextStyle}>
                                    {modalData.pickupLocation?.name ? `${modalData.pickupLocation.name} (Lat: ${modalData.pickupLocation.lat}, Lng: ${modalData.pickupLocation.lng})` : 'Not Available'}
                                </p>
                            </div>
                        )}

                        <div style={locationCardStyle}>
                            <h5 style={locationTitleStyle}>Driver's Current Location:</h5>
                            <p style={locationTextStyle}>
                                {typeof modalData.currentLocation === 'object' && modalData.currentLocation?.lat && modalData.currentLocation?.lng
                                    ? `Lat: ${modalData.currentLocation.lat}, Lng: ${modalData.currentLocation.lng}`
                                    : 'Not Available'}
                            </p>
                        </div>
                        <div className="my-4 p-4 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
                            <h5 className="text-xl font-semibold text-gray-700 mb-2">Pickup Distance:</h5>
                            <p className={`text-lg ${modalData.pickupDistance ? 'text-green-600' : 'text-red-500'} font-medium`}>{modalData.pickupDistance || 'Not Available'}</p>
                        </div>
                        {parseFloat(modalData.pickupDistance ?? '0') > 5 && <button onClick={handleApproveRequest}>Approve Request</button>}
                    </div>
                )}
                {modalData && changeRequestType === 'dropoff' && (
                    <div style={modalContainerStyle}>
                        {selectedRecord?.requestBool1 && (
                            <div style={locationCardStyle}>
                                <h5 style={locationTitleStyle}>Dropoff Location:</h5>
                                <p style={locationTextStyle}>
                                    {modalData.dropoffLocation?.name
                                        ? `${modalData.dropoffLocation.name} (Lat: ${modalData.dropoffLocation.lat}, Lng: ${modalData.dropoffLocation.lng})`
                                        : 'Not Available'}
                                </p>
                            </div>
                        )}

                        <div style={locationCardStyle}>
                            <h5 style={locationTitleStyle}>Driver's Current Location:</h5>
                            <p style={locationTextStyle}>
                                {typeof modalData.currentLocation === 'object' && modalData.currentLocation?.lat && modalData.currentLocation?.lng
                                    ? `Lat: ${modalData.currentLocation.lat}, Lng: ${modalData.currentLocation.lng}`
                                    : 'Not Available'}
                            </p>
                        </div>

                        <div className="my-4 p-4 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
                            <h5 className="text-xl font-semibold text-gray-700 mb-2">Dropoffup Distance:</h5>
                            <p className={`text-lg ${modalData.dropoffDistance ? 'text-green-600' : 'text-red-500'} font-medium`}>{modalData.dropoffDistance || 'Not Available'}</p>
                        </div>
                        {parseFloat(modalData.dropoffDistance ?? '0') > 5 && <button onClick={handleApproveDropRequest}>Approve Request</button>}
                    </div>
                )}
            </Modal>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Pagination
                    total={totalPages}
                    page={page}
                    onChange={setPage}
                    styles={{ item: { margin: '0 5px' } }} // Update to valid styles based on the Pagination component's expected structure
                />
                <select
                    value={pageSize}
                    onChange={(e) => {
                        const value = e.target.value;
                        setPageSize(value === 'All' ? filteredRecords.length : parseInt(value, 10));
                        setPage(1); // Reset to the first page when page size changes
                    }}
                    style={{
                        padding: '5px',
                        borderRadius: '5px',
                        border: '1px solid #ccc',
                    }}
                >
                    {PAGE_SIZES.map((size) => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default NewBooking;
// ------------------------------------------------------