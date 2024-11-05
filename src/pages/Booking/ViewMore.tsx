import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../config/config';
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from '@mui/material';
interface BookingDetails {
    id: string;
    dateTime: string;
    bookingId: string;
    newStatus: string;
    editedTime: string;
    totalSalary: string;
    updatedTotalSalary: string;
    company: string;
    trappedLocation: string;
    showroomLocation: string;
    fileNumber: string;
    customerName: string;
    driver: string;
    selectedCompany?: string;
    selectedDriver: string;
    totalDriverDistance: string;
    totalDriverSalary: string;
    vehicleNumber: string;
    vehicleModel: string;
    phoneNumber: string;
    mobileNumber: string;
    baseLocation: { name: string; lat: number; lng: number } | null;
    pickupLocation: { name: string; lat: number; lng: number } | null;
    dropoffLocation: { name: string; lat: number; lng: number } | null;
    distance: string;
    serviceType: string;
    serviceVehicle: string;
    rcBookImageURLs: string[];
    vehicleImageURLs: string[];
    vehicleImgURLs: string[];
    fuelBillImageURLs: string[];
    comments: string;
    status: string;
    pickupTime: string;
    dropoffTime: string;
    remark: string;
    formAdded:boolean;
}
interface FormData {
    pickupTime: string;
    serviceVehicle:string;
    dropoffTime: string;
    driverSalary: string;
    companyAmount: string;
    amount: string;
    distance: string;
    remark: string;
    fuelBillImageURLs: string[];
    vehicleImageURLs: string[];
    rcBookImageURLs: string[];
    vehicleImgURLs: string[];
}
interface Driver {
    id: string;
    name: string;
    phone: string;
    companyName: string;
    // Add other relevant driver fields here
}
const ViewMore: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid');
    const [dId, setDId] = useState<string | null>(null);
    const [allDrivers, setALLDrivers] = useState<Driver[]>([]);
    const [bId, setBid] = useState<string | null>(null);
    const [uniform, setUniform] = useState<string | null>(null);
    const [inventory, setInventory] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [feedbackVideo, setFeedbackVideo] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [behavior, setBehavior] = useState<string | null>(null);
    const [docId, setDocId] = useState<string>('');
    const [completedBookings, setCompletedBookings] = useState<BookingDetails[]>([]);
    const [loadingBookings, setLoadingBookings] = useState<Set<string>>(new Set());
    const [idCard, setIdCard] = useState<string | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const role = sessionStorage.getItem('role');
    const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);
    // --------------------------------------------------------------------------
    const { search } = useLocation();
    const [showPickupDetails, setShowPickupDetails] = useState(false);
    const [fixedPoint, setFixedPoint] = useState<number | null>(null);
    const [showDropoffDetails, setShowDropoffDetails] = useState(false);
    const queryParams = new URLSearchParams(search);
    const userName = sessionStorage.getItem('username');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        pickupTime: '',
        serviceVehicle:'',
        dropoffTime: '',
        driverSalary: 'No',
        companyAmount: 'No',
        amount: '',
        distance: '',
        remark: '',
        fuelBillImageURLs: [],
        vehicleImageURLs: [],
        rcBookImageURLs: [],
        vehicleImgURLs: [],
    });
    const [selectedImage, setSelectedImage] = useState<string | null>(null); // State to hold selected image for modal

    console.log(bookingDetails,'this is the booking details')
    console.log(allDrivers,'this is the all drivers')
    const handleImageClick = (url: string) => {
        setSelectedImage(url); // Set selected image for modal
    };

    const closeModal = () => {
        setSelectedImage(null); // Clear selected image
    };
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, field: keyof typeof formData) => {
        const files = event.target.files;
        if (files) {
            const updatedImageURLs: string[] = [];

            // Loop over each file and upload to Firebase
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const storageRef = ref(storage, `images/${file.name}-${Date.now()}`);

                // Upload the file to Firebase
                await uploadBytes(storageRef, file);

                // Get the HTTPS URL for the uploaded file
                const downloadURL = await getDownloadURL(storageRef);

                updatedImageURLs.push(downloadURL);
            }

            // Update the formData state with the correct field type
            setFormData((prevState) => ({
                ...prevState,
                [field]: [...(prevState[field] as string[]), ...updatedImageURLs],
            }));
        }
    };
    // ------------------------------------------------------------
    useEffect(() => {
        fetchBookingDetails();
        fetchPoints();
        fetchDrivers();
    }, [db, id, uid]);
    
    const fetchDrivers = async () => {
        try {
            const driversCollection = collection(db, `user/${uid}/driver`);
            const driverSnapshot = await getDocs(driversCollection);
            const driverList = driverSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Driver[]; // Type assertion to indicate the shape of objects is Driver

            setALLDrivers(driverList); // Store the fetched drivers in state
            console.log(driverList, 'Fetched Drivers'); // Optional logging
        } catch (error) {
            console.error('Error fetching drivers:', error);
        }
    };
    const fetchPoints = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, `user/${uid}/driverPoint`));

            if (!querySnapshot.empty) {
                const docData = querySnapshot.docs[0].data();
                setFixedPoint(docData.point); // Set the point value
                setDocId(querySnapshot.docs[0].id); // Set the document ID
            } else {
                console.log('No documents found in the collection!');
            }
        } catch (err) {
            console.error('Error fetching point:', err);
        }
    };

    const fetchBookingDetails = async () => {
        if (!uid || !id) {
            console.error('UID or ID is undefined.');
            return;
        }

        try {
            const docRef = doc(db, `user/${uid}/bookings`, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setBookingDetails({
                    id:data.id || '',
                    dateTime: data.dateTime || '',
                    bookingId: data.bookingId || '',
                    newStatus: data.newStatus || '',
                    editedTime: data.editedTime || '',
                    totalSalary: data.totalSalary || '',
                    updatedTotalSalary: data.updatedTotalSalary || '',
                    company: data.company || '',
                    selectedCompany: data.selectedCompany || '',
                    trappedLocation: data.trappedLocation || '',
                    showroomLocation: data.showroomLocation || '',
                    fileNumber: data.fileNumber || '',
                    customerName: data.customerName || '',
                    driver: data.driver || '',
                    totalDriverDistance: data.totalDriverDistance || '',
                    totalDriverSalary: data.totalDriverSalary || '',
                    vehicleNumber: data.vehicleNumber || '',
                    vehicleModel: data.vehicleModel || '',
                    phoneNumber: data.phoneNumber || '',
                    mobileNumber: data.mobileNumber || '',
                    baseLocation: data.baseLocation || null,
                    pickupLocation: data.pickupLocation || null,
                    dropoffLocation: data.dropoffLocation || null,
                    distance: data.distance || '',
                    serviceType: data.serviceType || '',
                    serviceVehicle: data.serviceVehicle || '',
                    rcBookImageURLs: data.rcBookImageURLs || [],
                    vehicleImageURLs: data.vehicleImageURLs || [],
                    vehicleImgURLs: data.vehicleImgURLs || [],
                    fuelBillImageURLs: data.fuelBillImageURLs || [],
                    comments: data.comments || '',
                    status: data.status || '',
                    pickupTime: data.pickupTime || '',
                    dropoffTime: data.dropoffTime || '',
                    remark: data.remark || '',
                    selectedDriver: data.selectedDriver || '',
                    formAdded:data.formAdded || '',
                });

                // Now fetch the selected company's name using selectedCompany ID
                if (data.selectedCompany) {
                    const companyDocRef = doc(db, `user/${uid}/driver`, data.selectedCompany);
                    const companyDocSnap = await getDoc(companyDocRef);
                    if (companyDocSnap.exists()) {
                        const companyData = companyDocSnap.data();
                        console.log('companyData', companyData);
                        setSelectedCompanyName(companyData.company || null); // Adjust based on your company structure
                    }
                }
            } else {
                console.log(`Document with ID ${id} does not exist!`);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // const togglePickupDetails = () => {
    //     if (bookingDetails?.status === 'Order Completed') {
    //         setShowPickupDetails(!showPickupDetails);
    //         setShowDropoffDetails(false);
    //     }
    // };

    // const toggleDropoffDetails = () => {
    //     if (bookingDetails?.status === 'Order Completed') {
    //         setShowDropoffDetails(!showDropoffDetails);
    //         setShowPickupDetails(false);
    //     }
    // };
    const togglePickupDetails = () => {
        setShowPickupDetails(!showPickupDetails);
        setShowDropoffDetails(false);
    };

    const toggleDropoffDetails = () => {
        setShowDropoffDetails(!showDropoffDetails);
        setShowPickupDetails(false);
    };

    const handleFormChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!uid || !id) {
            console.error('UID or ID is undefined.');
            return; // Exit the function if either is undefined
        }
        try {
            const docRef = doc(db, `user/${uid}/bookings`, id);
            await updateDoc(docRef, {
                ...formData,
                status: 'Order Completed',
                closedStatus: 'Admin closed booking',
            });
            console.log('Booking successfully updated!');
            setShowForm(false);
        } catch (error) {
            console.error('Error updating document:', error);
        }
    };
    if (!bookingDetails) {
        return <div>Loading...</div>;
    }

    const onRequestOpen = () => {
        const selectedDriver = bookingDetails?.selectedDriver;
        const bookingId = id ?? null; // Ensure bookingId is either a string or null

        if (selectedDriver) {
            setDId(selectedDriver); // Assuming setDId updates the driver's ID state
            setBid(bookingId); // Set bookingId (either string or null)
            setIsModalOpen(true); // Open the modal
        } else {
            console.error('Selected driver is undefined');
        }
    };

    const onRequestClose = () => {
        setIsModalOpen(false);
        setUniform('');
        setFeedbackVideo('');
        setInventory('');
        setIdCard('');
        setBehavior('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const parsedValue = value === '' ? null : parseFloat(value); // Convert to number or assign null for empty input
        setFixedPoint(parsedValue); // Update fixedPoint with the parsed number
    };

    const handleSaveClick = async () => {
        try {
            const docRef = doc(db, `user/${uid}/driverPoint`, docId); // Use the stored document ID

            await updateDoc(docRef, {
                point: fixedPoint, // Update the field with the new value
            });

            console.log('Point updated successfully!');
        } catch (err) {
            console.error('Error updating point:', err);
        }
        setIsEditing(false);
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleApprove = async (bookingId: string) => {
        setLoadingBookings((prev) => new Set(prev).add(bookingId)); // Add booking ID to loading set
        try {
            const db = getFirestore();
            const bookingRef = doc(db, `user/${uid}/bookings`, bookingId);

            // Update the document to set approved to true
            await updateDoc(bookingRef, {
                approved: true, // Add the approved field
            });

            // Update the state to reflect the changes immediately
            setCompletedBookings((prevBookings) => prevBookings.map((booking) => (booking.id === bookingId ? { ...booking, approved: true } : booking)));
            fetchBookingDetails();
        } catch (error) {
            console.error('Error updating booking status:', error);
        } finally {
            setLoadingBookings((prev) => {
                const updatedSet = new Set(prev);
                updatedSet.delete(bookingId);
                return updatedSet;
            });
        }
    };


    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        let points = 0;
        setLoadingId(bId);
        setLoading(true);

        // Ensure fixedPoint is a number, and set to 0 if null or NaN
        const validFixedPoint: number = typeof fixedPoint === 'number' ? fixedPoint : typeof fixedPoint === 'string' ? parseFloat(fixedPoint) : 0;

        // Check each field and add points for "yes" answers
        if (uniform === 'yes') points += validFixedPoint;
        if (idCard === 'yes') points += validFixedPoint;
        if (feedbackVideo === 'yes') points += validFixedPoint;
        if (behavior === 'good') points += validFixedPoint; // Assuming "good" is equivalent to "yes"
        if (inventory === 'filled') points += validFixedPoint; // Assuming "filled" is equivalent to "yes"

        try {
            // Ensure that both uid and dId are valid strings

            if (!uid || !dId || !bId) {
                console.error('Invalid uid, driver ID, or booking ID.');
                return;
            }

            // Retrieve the driver document from Firestore
            const driverDocRef = doc(db, `user/${uid}/driver`, dId);
            const driverDoc = await getDoc(driverDocRef);
            console.log(driverDoc, 'this is the driver doc');

            if (driverDoc.exists()) {
                // Get the current points (if they exist) and add the new points
                const currentPoints = driverDoc.data().points || 0;
                console.log(currentPoints, 'this is the current points');
                const newPoints = currentPoints + points;

                // Update the driver document with the new points
                await updateDoc(driverDocRef, {
                    rewardPoints: newPoints,
                });

                console.log(`Points updated successfully. New total: ${newPoints}`);

                // Now update the booking document
                const bookingDocRef = doc(db, `user/${uid}/bookings`, bId);
                await updateDoc(bookingDocRef, {
                    formAdded: true,
                });

                console.log(`Booking updated successfully. formAdded set to true.`);

                // Call handleApprove to update booking status
                await handleApprove(bId);
                window.location.reload()

                // Close the request
                onRequestClose();
            } else {
                console.log('Driver document not found.');
            }
        } catch (error) {
            console.error('Error updating points:', error);
        } finally {
            setLoadingId(null);
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto my-8 p-4 bg-white shadow rounded-lg">
            <h5 className="font-semibold text-lg mb-5">Booking Details</h5>
            {/* {bookingDetails.status === 'Order Completed' && ( */}
            <div className="flex mb-5">
                <button onClick={togglePickupDetails} className="mr-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    {showPickupDetails ? 'Close' : 'Show Pickup Details'}
                </button>
                <button onClick={toggleDropoffDetails} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                    {showDropoffDetails ? 'Close' : 'Show Dropoff Details'}
                </button>
            </div>
            {/* )} */}

            {showPickupDetails && (
                <div>
                    <h3 className="text-xl font-bold mt-5">RC Book Images</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {bookingDetails.rcBookImageURLs.length > 0 ? (
                            bookingDetails.rcBookImageURLs.map((url, index) => (
                                <div key={index} className="max-w-xs">
                                    <a href={url} download className="block mb-2 text-blue-500">
                                        Download
                                    </a>
                                    <img
                                        src={url}
                                        alt={`RC Book Image ${index}`}
                                        className="w-full h-auto cursor-pointer"
                                        onClick={() => handleImageClick(url)} // Open image in modal
                                    />
                                </div>
                            ))
                        ) : (
                            <p className="col-span-3">No RC Book Images available.</p>
                        )}
                    </div>

                    <h2 className="text-xl font-bold mt-5">Vehicle Images (Pickup)</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {bookingDetails.vehicleImageURLs.length > 0 ? (
                            bookingDetails.vehicleImageURLs.map((url, index) => (
                                <div key={index} className="max-w-xs">
                                    <a href={url} download className="block mb-2 text-blue-500">
                                        Download
                                    </a>
                                    <img
                                        src={url}
                                        alt={`Vehicle Image ${index}`}
                                        className="w-full h-auto cursor-pointer"
                                        onClick={() => handleImageClick(url)} // Open image in modal
                                    />
                                </div>
                            ))
                        ) : (
                            <p className="col-span-full">No Vehicle Images available.</p>
                        )}
                    </div>
                </div>
            )}

            {showDropoffDetails && (
                <div>
                    {bookingDetails.status === 'Order Completed' && <h3 className="text-xl font-bold mt-5">Fuel Bill Images</h3>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {bookingDetails.fuelBillImageURLs.length > 0 ? (
                            bookingDetails.fuelBillImageURLs.map((url, index) => (
                                <div key={index} className="max-w-xs">
                                    <a href={url} download className="block mb-2 text-blue-500">
                                        Download
                                    </a>
                                    <img
                                        src={url}
                                        alt={`Fuel Bill Image ${index}`}
                                        className="w-full h-auto cursor-pointer"
                                        onClick={() => handleImageClick(url)} // Open image in modal
                                    />
                                </div>
                            ))
                        ) : (
                            <p className="col-span-3">No Fuel Bill Images available.</p>
                        )}
                    </div>

                    <h2 className="text-xl font-bold mt-5">Vehicle Images (Dropoff)</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {bookingDetails.vehicleImgURLs.length > 0 ? (
                            bookingDetails.vehicleImgURLs.map((url, index) => (
                                <div key={index} className="max-w-xs">
                                    <a href={url} download className="block mb-2 text-blue-500">
                                        Download
                                    </a>
                                    <img
                                        src={url}
                                        alt={`Vehicle Image ${index}`}
                                        className="w-full h-auto cursor-pointer"
                                        onClick={() => handleImageClick(url)} // Open image in modal
                                    />
                                </div>
                            ))
                        ) : (
                            <p className="col-span-full">No Vehicle Images available.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Modal for viewing the selected image */}
            {selectedImage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="relative">
                        <img
                            src={selectedImage}
                            alt="Selected"
                            className="max-w-full max-h-[80vh] object-contain" // Limit height to 80% of the viewport height
                        />
                        <button onClick={closeModal} className="absolute top-2 right-2 bg-white text-black rounded-full p-1">
                            X
                        </button>
                    </div>
                </div>
            )}

            <table className="w-full border-collapse mt-5">
                <tbody>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Date & Time :</td>
                        <td className="p-2">{bookingDetails.dateTime}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Booking ID :</td>
                        <td className="p-2">{bookingDetails.bookingId}</td>
                    </tr>
                    {role === 'staff' && (
                        <tr>
                            <td className="bg-gray-100 p-2 font-semibold">Staff Name :</td>
                            <td className="p-2">{userName}</td>
                        </tr>
                    )}

                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Edited person :</td>
                        <td className="p-2">
                            {bookingDetails.newStatus}, {bookingDetails.editedTime}
                        </td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Amount without insurance :</td>
                        <td className="p-2">{bookingDetails.totalSalary}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Payable Amount with insurance:</td>
                        <td className="p-2">{bookingDetails.updatedTotalSalary}</td>
                    </tr>

                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Company :</td>
                        <td className="p-2">{bookingDetails.company}</td>
                    </tr>
                    {bookingDetails.company.toLowerCase() === 'rsa' && selectedCompanyName && (
                        <tr>
                            <td className="bg-gray-100 p-2 font-semibold">Selected Company :</td>
                            <td className="p-2">{selectedCompanyName}</td>
                        </tr>
                    )}

                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Trapped Location :</td>
                        <td className="p-2">{bookingDetails.trappedLocation}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Showroom :</td>
                        <td className="p-2">{bookingDetails.showroomLocation}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">File Number :</td>
                        <td className="p-2">{bookingDetails.fileNumber}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Customer Name :</td>
                        <td className="p-2">{bookingDetails.customerName}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Driver :</td>
                        <td className="p-2">{bookingDetails.driver}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Driver Total Distance:</td>
                        <td className="p-2">{bookingDetails.totalDriverDistance}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Driver Salary:</td>
                        <td className="p-2">{bookingDetails.totalDriverSalary}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Customer Vehicle Number :</td>
                        <td className="p-2">{bookingDetails.vehicleNumber}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Brand Name :</td>
                        <td className="p-2">{bookingDetails.vehicleModel}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Phone Number :</td>
                        <td className="p-2">{bookingDetails.phoneNumber}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Mobile Number :</td>
                        <td className="p-2">{bookingDetails.mobileNumber}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Start Location:</td>
                        <td className="p-2">
                            {bookingDetails.baseLocation
                                ? `${bookingDetails.baseLocation.name}, Lat: ${bookingDetails.baseLocation.lat}, Lng: ${bookingDetails.baseLocation.lng}`
                                : 'Location not selected'}
                        </td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Pickup Location:</td>
                        <td className="p-2">
                            {bookingDetails.pickupLocation
                                ? `${bookingDetails.pickupLocation.name}, Lat: ${bookingDetails.pickupLocation.lat}, Lng: ${bookingDetails.pickupLocation.lng}`
                                : 'Location not selected'}
                        </td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Dropoff Location:</td>
                        <td className="p-2">
                            {bookingDetails.dropoffLocation
                                ? `${bookingDetails.dropoffLocation.name}, Lat: ${bookingDetails.dropoffLocation.lat}, Lng: ${bookingDetails.dropoffLocation.lng}`
                                : 'Location not selected'}
                        </td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Distance :</td>
                        <td className="p-2">{bookingDetails.distance}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Service Type :</td>
                        <td className="p-2">{bookingDetails.serviceType}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Service Vehicle Number :</td>
                        <td className="p-2">{bookingDetails.serviceVehicle}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Comments :</td>
                        <td className="p-2">{bookingDetails.comments}</td>
                    </tr>
                    {bookingDetails.status === 'Order Completed' && (
                        <>
                            <tr>
                                <td className="bg-gray-100 p-2 font-semibold">Pickup Time :</td>
                                <td className="p-2">{bookingDetails.pickupTime}</td>
                            </tr>
                            <tr>
                                <td className="bg-gray-100 p-2 font-semibold">Dropoff Time :</td>
                                <td className="p-2">{bookingDetails.dropoffTime}</td>
                            </tr>
                            <tr>
                                <td className="bg-gray-100 p-2 font-semibold">Remark :</td>
                                <td className="p-2">{bookingDetails.remark}</td>
                            </tr>
                        </>
                    )}
                </tbody>
            </table>

            {showForm && (
                <form onSubmit={handleFormSubmit} className="mt-8">
                    <div className="flex mb-5">
                        <button onClick={togglePickupDetails} className="mr-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            {showPickupDetails ? 'Close' : 'Add Pickup Details'}
                        </button>
                        <button onClick={toggleDropoffDetails} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                            {showDropoffDetails ? 'Close' : 'Add Dropoff Details'}
                        </button>
                    </div>

                    {/* Pickup details */}
                    {showPickupDetails && (
                        <div>
                            {/* RC Book Images */}
                            <h3 className="text-xl font-bold mt-5">RC Book Images</h3>
                            <input type="file" multiple onChange={(e) => handleFileChange(e, 'rcBookImageURLs')} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {formData.rcBookImageURLs.length > 0 ? (
                                    formData.rcBookImageURLs.map((url, index) => (
                                        <div key={index} className="max-w-xs">
                                            <img src={url} alt={`RC Book Image ${index}`} className="w-full h-auto" />
                                        </div>
                                    ))
                                ) : (
                                    <p className="col-span-3">No RC Book Images available.</p>
                                )}
                            </div>

                            {/* Vehicle Images (Pickup) */}
                            <h2 className="text-xl font-bold mt-5">Vehicle Images (Pickup)</h2>
                            <input type="file" multiple onChange={(e) => handleFileChange(e, 'vehicleImageURLs')} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {formData.vehicleImageURLs.length > 0 ? (
                                    formData.vehicleImageURLs.map((url, index) => (
                                        <div key={index} className="max-w-xs">
                                            <img src={url} alt={`Vehicle Image ${index}`} className="w-full h-auto" />
                                        </div>
                                    ))
                                ) : (
                                    <p className="col-span-full">No Vehicle Images available.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Dropoff details */}
                    {showDropoffDetails && (
                        <div>
                            {/* Fuel Bill Images */}
                            <h3 className="text-xl font-bold mt-5">Fuel Bill Images</h3>
                            <input type="file" multiple onChange={(e) => handleFileChange(e, 'fuelBillImageURLs')} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {formData.fuelBillImageURLs.length > 0 ? (
                                    formData.fuelBillImageURLs.map((url, index) => (
                                        <div key={index} className="max-w-xs">
                                            <img src={url} alt={`Fuel Bill Image ${index}`} className="w-full h-auto" />
                                        </div>
                                    ))
                                ) : (
                                    <p className="col-span-3">No Fuel Bill Images available.</p>
                                )}
                            </div>

                            {/* Vehicle Images (Dropoff) */}
                            <h2 className="text-xl font-bold mt-5">Vehicle Images (Dropoff)</h2>
                            <input type="file" multiple onChange={(e) => handleFileChange(e, 'vehicleImgURLs')} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {formData.vehicleImgURLs.length > 0 ? (
                                    formData.vehicleImgURLs.map((url, index) => (
                                        <div key={index} className="max-w-xs">
                                            <img src={url} alt={`Vehicle Image ${index}`} className="w-full h-auto" />
                                        </div>
                                    ))
                                ) : (
                                    <p className="col-span-full">No Vehicle Images available.</p>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="mb-4">
                        <label htmlFor="pickupTime" className="block text-sm font-medium text-gray-700">
                            Pickup Time
                        </label>
                        <input
                            type="datetime-local"
                            id="pickupTime"
                            name="pickupTime"
                            value={formData.pickupTime}
                            onChange={handleFormChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                  
                    <div className="mb-4">
                        <label htmlFor="dropoffTime" className="block text-sm font-medium text-gray-700">
                            Dropoff Time
                        </label>
                        <input
                            type="datetime-local"
                            id="dropoffTime"
                            name="dropoffTime"
                            value={formData.dropoffTime}
                            onChange={handleFormChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="serviceVehicle" className="block text-sm font-medium text-gray-700">
                        Service Vehicle Number
                        </label>
                        <input
                            type="text"
                            id="serviceVehicle"
                            name="serviceVehicle"
                            value={formData.serviceVehicle}
                            onChange={handleFormChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="driverSalary" className="block text-sm font-medium text-gray-700">
                            Driver Salary
                        </label>
                        <select
                            id="driverSalary"
                            name="driverSalary"
                            value={formData.driverSalary}
                            onChange={handleFormChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="companyAmount" className="block text-sm font-medium text-gray-700">
                            Company Amount
                        </label>
                        <select id="companyAmount" name="companyAmount" value={formData.companyAmount} onChange={handleFormChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                            Amount
                        </label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            value={formData.amount}
                            onChange={handleFormChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="distance" className="block text-sm font-medium text-gray-700">
                            Distance
                        </label>
                        <input
                            type="number"
                            id="distance"
                            name="distance"
                            value={formData.distance}
                            onChange={handleFormChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="remark" className="block text-sm font-medium text-gray-700">
                            Remark
                        </label>
                        <textarea id="remark" name="remark" value={formData.remark} onChange={handleFormChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Submit
                    </button>
                </form>
            )}
            <div className="flex justify-end">
                {bookingDetails.status !== 'Order Completed' && (
                    <div className="flex justify-end">
                        <button onClick={() => setShowForm(!showForm)} className="ml-4 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                            {showForm ? 'Close Form' : 'Booking Completed'}
                        </button>
                    </div>
                )}

{!bookingDetails.formAdded && bookingDetails.status === 'Order Completed' &&
    allDrivers.some(
        (driver) => driver.id === bookingDetails.selectedDriver && driver.companyName === 'RSA'
    ) && (
    <button
        className="mx-3"
        style={{
            backgroundColor: 'green',
            color: '#fff',
            border: '1px solid #007bff',
            padding: '8px 16px',
            fontSize: '16px',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.3s, color 0.3s, border-color 0.3s',
        }}
        onClick={() => onRequestOpen()}
    >
        Open Form
    </button>
)}

            </div>
            <Dialog
                open={isModalOpen}
                onClose={onRequestClose}
                maxWidth="sm" // Optional: controls the maximum width of the dialog
                fullWidth // Optional: forces the dialog to take full width
                scroll="paper" // Makes the modal content scrollable
            >
                <DialogTitle>
                    {isEditing ? (
                        <div>
                            <TextField value={fixedPoint} onChange={handleInputChange} variant="outlined" size="small" />
                            <Button variant="contained" color="primary" onClick={handleSaveClick}>
                                Save
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <p>Point for each question</p>
                            <Button variant="contained" color="primary" onClick={handleEditClick}>
                                {fixedPoint}
                            </Button>
                        </div>
                    )}
                </DialogTitle>

                <DialogContent dividers={true} style={{ maxHeight: '400px' }}>
                    {' '}
                    {/* Add maxHeight for scrollable content */}
                    <form onSubmit={handleSubmit}>
                        <FormControl component="fieldset" fullWidth>
                            <FormLabel component="legend">Uniform:</FormLabel>
                            <RadioGroup value={uniform} onChange={(e) => setUniform(e.target.value)}>
                                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                                <FormControlLabel value="no" control={<Radio />} label="No" />
                            </RadioGroup>
                        </FormControl>

                        <FormControl component="fieldset" fullWidth>
                            <FormLabel component="legend">Behavior:</FormLabel>
                            <RadioGroup value={behavior} onChange={(e) => setBehavior(e.target.value)}>
                                <FormControlLabel value="good" control={<Radio />} label="Good" />
                                <FormControlLabel value="bad" control={<Radio />} label="Bad" />
                            </RadioGroup>
                        </FormControl>

                        <FormControl component="fieldset" fullWidth>
                            <FormLabel component="legend">ID Card:</FormLabel>
                            <RadioGroup value={idCard} onChange={(e) => setIdCard(e.target.value)}>
                                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                                <FormControlLabel value="no" control={<Radio />} label="No" />
                            </RadioGroup>
                        </FormControl>

                        <FormControl component="fieldset" fullWidth>
                            <FormLabel component="legend">Inventory Sheet:</FormLabel>
                            <RadioGroup value={inventory} onChange={(e) => setInventory(e.target.value)}>
                                <FormControlLabel value="filled" control={<Radio />} label="Filled" />
                                <FormControlLabel value="unfilled" control={<Radio />} label="Unfilled" />
                            </RadioGroup>
                        </FormControl>

                        <FormControl component="fieldset" fullWidth>
                            <FormLabel component="legend">Feedback Video:</FormLabel>
                            <RadioGroup value={feedbackVideo} onChange={(e) => setFeedbackVideo(e.target.value)}>
                                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                                <FormControlLabel value="no" control={<Radio />} label="No" />
                            </RadioGroup>
                        </FormControl>
                        <DialogActions>
                            {loading ? (
                                <Button variant="contained" color="primary">
                                    <CircularProgress size={24} color="inherit" />
                                </Button>
                            ) : (
                                <div>
                                    <Button type="submit" variant="contained" color="primary">
                                        Submit
                                    </Button>
                                    <Button onClick={onRequestClose} color="secondary">
                                        Close
                                    </Button>
                                </div>
                            )}
                        </DialogActions>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ViewMore;
