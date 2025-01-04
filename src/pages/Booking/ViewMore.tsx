import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc, getDocs, collection, Timestamp } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { CiEdit } from 'react-icons/ci';

import { storage } from '../../config/config';
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField, ThemeProvider } from '@mui/material';
import { LoadingIndicator } from 'react-select/dist/declarations/src/components/indicators';
import EditableField from './EditableField';
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
    pickedTime: Timestamp | null | undefined;
    remark: string;
    formAdded: boolean;
    bookingChecked: boolean;
    paymentStatus: string;
    feedback?: boolean;

    companyName?: string;
    vehicleModel: string;
    droppedTime: Timestamp | null | undefined;

    // Add missing properties here
    driverSalary?: string;
    companyAmount?: string;
    amount?: string;
}
interface FormData {
    pickedTime: Timestamp | null | undefined;
    serviceVehicle: string;
    droppedTime: Timestamp | null | undefined;
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
type RenderImagesProps = {
    images: string[]; // Array of image URLs (strings)
    type: string; // Type of images (e.g., 'rcBook', 'vehiclePickup', etc.)
};
const ViewMore: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid');
    const [bookingChecked, setBookingChecked] = useState(false);
    const [dId, setDId] = useState<string | null>(null);
    const [allDrivers, setALLDrivers] = useState<Driver[]>([]);
    const [docId, setDocId] = useState<string>('');
    const role = sessionStorage.getItem('role');
    const [replacementImage, setReplacementImage] = useState<string | null>(null);
    const bookingCheck = bookingDetails?.bookingChecked ?? false;
    const { search } = useLocation();
    const [showPickupDetails, setShowPickupDetails] = useState(false);
    const [fixedPoint, setFixedPoint] = useState<number | null>(null);
    const [showDropoffDetails, setShowDropoffDetails] = useState(false);
    const queryParams = new URLSearchParams(search);
    const userName = sessionStorage.getItem('username');
    const [showForm, setShowForm] = useState(false);
    const [feedback, setFeedback] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        pickedTime: null,
        serviceVehicle: '',
        droppedTime: null,
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
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [editedFields, setEditedFields] = useState({
        salary: bookingDetails?.updatedTotalSalary || '',
        fileNumber: bookingDetails?.fileNumber || '',
        totalDriverSalary: bookingDetails?.totalDriverSalary || '',
        serviceVehicle: bookingDetails?.serviceVehicle || '',
        bookingId: bookingDetails?.bookingId,
        company: bookingDetails?.company,
        companyName: bookingDetails?.companyName,
        trappedLocation: bookingDetails?.trappedLocation,
        showroomLocation: bookingDetails?.showroomLocation,
        customerName: bookingDetails?.customerName,
        driver: bookingDetails?.driver,
        selectedCompany: bookingDetails?.selectedCompany,
        totalDriverDistance: bookingDetails?.totalDriverDistance,
        vehicleNumber: bookingDetails?.vehicleNumber,
        vehicleModel: bookingDetails?.vehicleModel,
        baseLocation: bookingDetails?.baseLocation,
        pickupLocation: bookingDetails?.pickupLocation,
        dropoffLocation: bookingDetails?.dropoffLocation,
        distance: bookingDetails?.distance,
        serviceType: bookingDetails?.serviceType,
        rcBookImageURLs: bookingDetails?.rcBookImageURLs || [],
        vehicleImageURLs: bookingDetails?.vehicleImageURLs || [],
        fuelBillImageURLs: bookingDetails?.fuelBillImageURLs || [],
        comments: bookingDetails?.comments,
        pickedTime: bookingDetails?.pickedTime,
        droppedTime: bookingDetails?.droppedTime,
        remark: bookingDetails?.remark,
        feedback: bookingDetails?.feedback,
    });

    const [editStates, setEditStates] = useState({
        salary: false,
        fileNumber: false,
        totalDriverSalary: false,
        serviceVehicle: false,
        bookingId: false,
        company: false,
        trappedLocation: false,
        showroomLocation: false,
        customerName: false,
        driver: false,
        selectedCompany: false,
        totalDriverDistance: false,
        vehicleNumber: false,
        vehicleModel: false,
        baseLocation: false,
        pickupLocation: false,
        dropoffLocation: false,
        distance: false,
        serviceType: false,
        rcBookImageURLs: false,
        vehicleImageURLs: false,
        fuelBillImageURLs: false,
        comments: false,
        pickedTime: false,
        droppedTime: false,
        remark: false,
        companyName: false,
    });

    const [loadingStates, setLoadingStates] = useState({
        salary: false,
        fileNumber: false,
        totalDriverSalary: false,
        serviceVehicle: false,
        bookingId: false,
        company: false,
        trappedLocation: false,
        showroomLocation: false,
        customerName: false,
        driver: false,
        selectedCompany: false,
        totalDriverDistance: false,
        vehicleNumber: false,
        vehicleModel: false,
        baseLocation: false,
        pickupLocation: false,
        dropoffLocation: false,
        distance: false,
        serviceType: false,
        rcBookImageURLs: false,
        vehicleImageURLs: false,
        fuelBillImageURLs: false,
        comments: false,
        pickedTime: false,
        droppedTime: false,
        remark: false,
        companyName: false,
    });

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

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExtension = file.name.split('.').pop(); // Get file extension
                const storageRef = ref(storage, `images/${file.name}-${Date.now()}.${fileExtension}`);

                await uploadBytes(storageRef, file); // Upload the file
                const downloadURL = await getDownloadURL(storageRef); // Get public URL
                updatedImageURLs.push(downloadURL);
            }

            setFormData((prevState) => ({
                ...prevState,
                [field]: [...(prevState[field] as string[]), ...updatedImageURLs],
            }));
        }
    };

    // ------------------------------------------------------------
    useEffect(() => {
        fetchBookingDetails();
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
                console.log(data, 'this is the data provided');
                setBookingDetails({
                    id: data.id || '',
                    dateTime: data.dateTime || '',
                    bookingId: data.bookingId || '',
                    newStatus: data.newStatus || '',
                    editedTime: data.editedTime || '',
                    totalSalary: data.totalSalary || '',
                    updatedTotalSalary: data.updatedTotalSalary || '',
                    company: data.company || '',
                    companyName: data.companyName || '',
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
                    pickedTime: data.pickedTime || '',
                    droppedTime: data.droppedTime || '',
                    remark: data.remark || '',
                    selectedDriver: data.selectedDriver || '',
                    formAdded: data.formAdded || '',
                    bookingChecked: data.bookingChecked || false,
                    paymentStatus: data.paymentStatus || '',
                    feedback: data.feedback || false,
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    const handleVerifyClick = async () => {
        if (!id) {
            console.error('Error: bookingId is undefined.');
            return;
        }
        try {
            // Update bookingChecked in Firestore
            const bookingDocRef = doc(db, `user/${uid}/bookings`, id);
            await updateDoc(bookingDocRef, { bookingChecked: true });

            // Update local state after successful DB update
            setBookingChecked(true);
            console.log('Booking verified successfully!');
            window.location.reload();
        } catch (error) {
            console.error('Error verifying booking: ', error);
        }
    };

    const togglePickupDetails = () => {
        setShowPickupDetails(!showPickupDetails);
        setShowDropoffDetails(false);
    };

    const toggleDropoffDetails = () => {
        setShowDropoffDetails(!showDropoffDetails);
        setShowPickupDetails(false);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]:
                name === 'pickedTime' || name === 'droppedTime'
                    ? value
                        ? Timestamp.fromDate(new Date(value))
                        : null // Convert string to Timestamp
                    : value,
        }));
    };

    const timestampToDate = (timestamp: Timestamp | null | undefined): Date | null => {
        if (timestamp) {
            return timestamp.toDate(); // Converts Timestamp to Date if it's not null
        }
        return null;
    };

    // Updated useEffect
    useEffect(() => {
        if (bookingDetails) {
            const isValidDate = (date: any): boolean => {
                const parsedDate = new Date(date);
                return !isNaN(parsedDate.getTime());
            };

            setFormData({
                // Keep pickedTime and droppedTime as Timestamp or null
                pickedTime: bookingDetails.pickedTime
                    ? bookingDetails.pickedTime // Keep as Timestamp (no conversion)
                    : null,
                serviceVehicle: bookingDetails.serviceVehicle || '',
                droppedTime: bookingDetails.droppedTime
                    ? bookingDetails.droppedTime // Keep as Timestamp (no conversion)
                    : null,
                driverSalary: bookingDetails.driverSalary || 'No',
                companyAmount: bookingDetails.companyAmount || 'No',
                amount: bookingDetails.amount || '',
                distance: bookingDetails.distance || '',
                remark: bookingDetails.remark || '',
                fuelBillImageURLs: bookingDetails.fuelBillImageURLs || [],
                vehicleImageURLs: bookingDetails.vehicleImageURLs || [],
                rcBookImageURLs: bookingDetails.rcBookImageURLs || [],
                vehicleImgURLs: bookingDetails.vehicleImgURLs || [],
            });
        }
    }, [bookingDetails]);

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!uid || !id) {
            console.error('UID or ID is undefined.');
            return; // Exit the function if either is undefined
        }
        try {
            const updatedAmount = bookingDetails?.company?.toLowerCase() === 'rsa' ? '0' : formData.amount;

            const docRef = doc(db, `user/${uid}/bookings`, id);
            await updateDoc(docRef, {
                ...formData,
                amount: updatedAmount,
                status: 'Order Completed',
                closedStatus: 'Admin closed booking',
            });
            console.log('Booking successfully updated!');
            setShowForm(false);
            navigate('/bookings/newbooking');
        } catch (error) {
            console.error('Error updating document:', error);
        }
    };
    if (!bookingDetails) {
        return <div>Loading...</div>;
    }

    const handleEditClick = (field: keyof typeof editedFields) => {
        setEditStates((prevState) => ({
            ...prevState,
            [field]: true,
        }));
    };

    const handleSaveClick = async (field: keyof typeof editedFields) => {
        if (bookingDetails && uid && id) {
            setLoadingStates((prevState) => ({
                ...prevState,
                [field]: true,
            }));

            try {
                const docRef = doc(db, `user/${uid}/bookings`, id);
                await updateDoc(docRef, { [field]: editedFields[field] });

                fetchBookingDetails();
                setEditStates((prevState) => ({
                    ...prevState,
                    [field]: false,
                }));
            } catch (error) {
                console.error('Error updating document:', error);
            } finally {
                setLoadingStates((prevState) => ({
                    ...prevState,
                    [field]: false,
                }));
            }
        }
    };
    const downloadImage = async (filePath: any, filename: any) => {
        const storage = getStorage();
        const fileRef = ref(storage, filePath);

        try {
            const url = await getDownloadURL(fileRef); // Get the public URL for the image

            // Fetch the image file
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }
            const blob = await response.blob();

            // Create a link and trigger the download
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${filename}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading image:', error);
        }
    };

    const formatTimestamp = (timestamp: Timestamp | null | undefined): string => {
        if (!timestamp) return 'N/A';

        // Convert Firestore timestamp to JavaScript Date object
        const date = timestamp.toDate();

        // Define the options for formatting
        const options: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true, // 24-hour format
        };

        // Use Intl.DateTimeFormat for proper formatting
        const formattedDate = new Intl.DateTimeFormat('en-IN', options).format(date);

        // Replace the "at" position manually since Intl.DateTimeFormat can't add it
        return formattedDate.replace(', ', ' at ');
    };
    const handleReplaceImage = async (
        event: React.ChangeEvent<HTMLInputElement>,
        index: number,
        type: 'vehicleImageURLs' | 'vehicleImgURLs'
    ) => {
        if (event.target.files && event.target.files[0] && bookingDetails && uid && id) {
            const file = event.target.files[0];
            const fileExtension = file.name.split('.').pop(); // Get file extension
            const storageRef = ref(storage, `images/${file.name}-${Date.now()}.${fileExtension}`);
    
            try {
                // Upload the file to Firebase Storage
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);
    
                // Update the image URL in the state
                const updatedURLs = [...bookingDetails[type]];
                updatedURLs[index] = downloadURL;
    
                // Update the Firestore document
                const docRef = doc(db, `user/${uid}/bookings`, id);
                await updateDoc(docRef, { [type]: updatedURLs });
    
                // Update the local state to reflect changes
                setBookingDetails((prevDetails) => {
                    if (!prevDetails) return null; // Handle null case
                    return {
                        ...prevDetails,
                        [type]: updatedURLs,
                    };
                });
    
                console.log(`${type} updated successfully at index ${index}`);
            } catch (error) {
                console.error(`Error updating ${type}:`, error);
            }
        }
    };
    

    // const renderImages = ({ images, type }: RenderImagesProps) => {
    //     return images.length > 0 ? (
    //         images.map((url: string, index: number) => (
    //             <div key={index} className="max-w-xs">
    //                 <a onClick={() => downloadImage(url, `Vehicle_Image_${type}_${index}`)} className="block mb-2 text-blue-500 cursor-pointer">
    //                     Download
    //                 </a>
    //                 <img
    //                     src={url}
    //                     alt={`${type} Image ${index}`}
    //                     className="w-full h-auto cursor-pointer"
    //                     onClick={() => handleImageClick(url)} // Open image in modal
    //                 />
    //                 <input type="file" accept="image/*" className="mt-2" onChange={(e) => handleReplaceImage(e, index, type)} />
    //             </div>
    //         ))
    //     ) : (
    //         <p className="col-span-full">No {type} Images available.</p>
    //     );
    // };
    const handleFeedbackClick = () => {
        if (bookingDetails) {
            const { selectedDriver } = bookingDetails;
            navigate('/bookings/newbooking/viewmore/feedback', {
                state: { bookingId: id, selectedDriver: selectedDriver }, // Passing selectedDriver state
            });
        }
    };

    return (
        <div className="container mx-auto my-8 p-4 bg-white shadow rounded-lg">
            <h5 className="font-semibold text-lg mb-5">Booking Details</h5>
            <div className="flex mb-5">
                <button onClick={togglePickupDetails} className="mr-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    {showPickupDetails ? 'Close' : 'Show Pickup Details'}
                </button>
                <button onClick={toggleDropoffDetails} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                    {showDropoffDetails ? 'Close' : 'Show Dropoff Details'}
                </button>
            </div>

            {showPickupDetails && (
                <div>
                    <h2 className="text-xl font-bold mt-5">Vehicle Images (Pickup)</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {bookingDetails?.vehicleImageURLs.map((url, index) => (
        <div key={index}>
            <img src={url} alt={`Vehicle Image ${index + 1}`} />
            <input
                type="file"
                accept="image/*"
                onChange={(event) => handleReplaceImage(event, index, 'vehicleImageURLs')}
            />
        </div>
    ))}
                    </div>
                </div>
            )}

            {showDropoffDetails && (
                <div>
                    <h2 className="text-xl font-bold mt-5">Vehicle Images (Dropoff)</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {bookingDetails?.vehicleImgURLs.map((url, index) => (
        <div key={index}>
            <img src={url} alt={`Vehicle Img ${index + 1}`} />
            <input
                type="file"
                accept="image/*"
                onChange={(event) => handleReplaceImage(event, index, 'vehicleImgURLs')}
            />
        </div>
    ))}
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
                        <td className="p-2">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <EditableField
                                    label="Booking Id"
                                    value={bookingDetails?.bookingId}
                                    isEditing={editStates.bookingId}
                                    editedValue={editedFields.bookingId}
                                    loading={loadingStates.bookingId}
                                    onEditClick={() => handleEditClick('bookingId')}
                                    onSaveClick={() => handleSaveClick('bookingId')}
                                    onChange={(e) => setEditedFields((prev) => ({ ...prev, bookingId: e.target.value }))}
                                    isEditable={bookingDetails?.status === 'Order Completed' && !(bookingCheck === true || bookingCheck === null)}
                                    bookingCheck={bookingCheck}
                                />
                            </div>
                        </td>
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
                  {/* ----------------------------------------------------------------- */}
                    <tr>
                        <td className="bg-gray-100 p-2 font-bold">Payable Amount by Customer/Company:</td>
                        <td className="p-2">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <td
                                    className="p-2"
                                    style={{
                                        color: 'red',
                                        fontSize: '1.5rem', // Adjust size (1.5rem = larger font)
                                        fontWeight: 'bold', // Optional: to make it bold
                                    }}
                                >
                                    {bookingDetails.updatedTotalSalary}
                                </td>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Company :</td>
                        <td className="p-2">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <EditableField
                                    label="Company"
                                    value={bookingDetails?.company}
                                    isEditing={editStates.company}
                                    editedValue={editedFields.company}
                                    loading={loadingStates.company}
                                    onEditClick={() => handleEditClick('company')}
                                    onSaveClick={() => handleSaveClick('company')}
                                    onChange={(e) => setEditedFields((prev) => ({ ...prev, company: e.target.value }))}
                                    isEditable={bookingDetails?.status === 'Order Completed' && !(bookingCheck === true || bookingCheck === null)}
                                    bookingCheck={bookingChecked}
                                />
                            </div>
                        </td>
                    </tr>
                    {bookingDetails.company.toLowerCase() === 'rsa' && (
                        <tr>
                            <td className="bg-gray-100 p-2 font-semibold">Selected Company :</td>
                            <td className="p-2">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <EditableField
                                        label="Company Name"
                                        value={bookingDetails?.companyName}
                                        isEditing={editStates.companyName}
                                        editedValue={editedFields.companyName}
                                        loading={loadingStates.companyName}
                                        onEditClick={() => handleEditClick('companyName')}
                                        onSaveClick={() => handleSaveClick('companyName')}
                                        onChange={(e) => setEditedFields((prev) => ({ ...prev, companyName: e.target.value }))}
                                        isEditable={bookingDetails?.status === 'Order Completed' && !(bookingCheck === true || bookingCheck === null)}
                                        bookingCheck={bookingCheck}
                                    />
                                </div>
                            </td>
                        </tr>
                    )}

                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Trapped Location :</td>
                        <td className="p-2">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <EditableField
                                    label="Trapped Location"
                                    value={bookingDetails?.trappedLocation}
                                    isEditing={editStates.trappedLocation}
                                    editedValue={editedFields.trappedLocation}
                                    loading={loadingStates.trappedLocation}
                                    onEditClick={() => handleEditClick('trappedLocation')}
                                    onSaveClick={() => handleSaveClick('trappedLocation')}
                                    onChange={(e) => setEditedFields((prev) => ({ ...prev, trappedLocation: e.target.value }))}
                                    isEditable={bookingDetails?.status === 'Order Completed' && !(bookingCheck === true || bookingCheck === null)}
                                    bookingCheck={bookingCheck}
                                />
                            </div>
                        </td>{' '}
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Service Center :</td>
                        <td className="p-2">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <EditableField
                                    label="Showroom Location"
                                    value={bookingDetails?.showroomLocation}
                                    isEditing={editStates.showroomLocation}
                                    editedValue={editedFields.showroomLocation}
                                    loading={loadingStates.showroomLocation}
                                    onEditClick={() => handleEditClick('showroomLocation')}
                                    onSaveClick={() => handleSaveClick('showroomLocation')}
                                    onChange={(e) => setEditedFields((prev) => ({ ...prev, showroomLocation: e.target.value }))}
                                    isEditable={bookingDetails?.status === 'Order Completed' && !(bookingCheck === true || bookingCheck === null)}
                                    bookingCheck={bookingCheck}
                                />
                            </div>
                        </td>{' '}
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">File Number :</td>
                        <td className="p-2">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <EditableField
                                    label="File Number"
                                    value={bookingDetails?.fileNumber}
                                    isEditing={editStates.fileNumber}
                                    editedValue={editedFields.fileNumber}
                                    loading={loadingStates.fileNumber}
                                    onEditClick={() => handleEditClick('fileNumber')}
                                    onSaveClick={() => handleSaveClick('fileNumber')}
                                    onChange={(e) => setEditedFields((prev) => ({ ...prev, fileNumber: e.target.value }))}
                                    isEditable={bookingDetails?.status === 'Order Completed' && !(bookingCheck === true || bookingCheck === null)}
                                    bookingCheck={bookingCheck}
                                />
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Customer Name :</td>
                        <td className="p-2">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <EditableField
                                    label="Customer Name"
                                    value={bookingDetails?.customerName}
                                    isEditing={editStates.customerName}
                                    editedValue={editedFields.customerName}
                                    loading={loadingStates.customerName}
                                    onEditClick={() => handleEditClick('customerName')}
                                    onSaveClick={() => handleSaveClick('customerName')}
                                    onChange={(e) => setEditedFields((prev) => ({ ...prev, customerName: e.target.value }))}
                                    isEditable={bookingDetails?.status === 'Order Completed' && !(bookingChecked === true || bookingChecked === null)}
                                    bookingCheck={bookingCheck}
                                />
                            </div>
                        </td>{' '}
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Driver :</td>
                        <td className="p-2">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <EditableField
                                    label="Driver"
                                    value={bookingDetails?.driver}
                                    isEditing={editStates.driver}
                                    editedValue={editedFields.driver}
                                    loading={loadingStates.driver}
                                    onEditClick={() => handleEditClick('driver')}
                                    onSaveClick={() => handleSaveClick('driver')}
                                    onChange={(e) => setEditedFields((prev) => ({ ...prev, driver: e.target.value }))}
                                    isEditable={bookingDetails?.status === 'Order Completed' && !(bookingCheck === true || bookingCheck === null)}
                                    bookingCheck={bookingCheck}
                                />
                            </div>
                        </td>{' '}
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Driver Total Distance:</td>
                        <td className="p-2">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <EditableField
                                    label="Total Driver Distance"
                                    value={bookingDetails?.totalDriverDistance}
                                    isEditing={editStates.totalDriverDistance}
                                    editedValue={editedFields.totalDriverDistance}
                                    loading={loadingStates.totalDriverDistance}
                                    onEditClick={() => handleEditClick('totalDriverDistance')}
                                    onSaveClick={() => handleSaveClick('totalDriverDistance')}
                                    onChange={(e) => setEditedFields((prev) => ({ ...prev, totalDriverDistance: e.target.value }))}
                                    isEditable={bookingDetails?.status === 'Order Completed' && !(bookingCheck === true || bookingCheck === null)}
                                    bookingCheck={bookingCheck}
                                />
                            </div>
                        </td>{' '}
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Driver Salary:</td>
                        <td className="p-2">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <EditableField
                                    label="Total Driver Salary"
                                    value={bookingDetails?.totalDriverSalary}
                                    isEditing={editStates.totalDriverSalary}
                                    editedValue={editedFields.totalDriverSalary}
                                    loading={loadingStates.totalDriverSalary}
                                    onEditClick={() => handleEditClick('totalDriverSalary')}
                                    onSaveClick={() => handleSaveClick('totalDriverSalary')}
                                    onChange={(e) => setEditedFields((prev) => ({ ...prev, totalDriverSalary: e.target.value }))}
                                    isEditable={bookingDetails?.status === 'Order Completed' && !(bookingCheck === true || bookingCheck === null)}
                                    bookingCheck={bookingCheck}
                                    valueStyle={{
                                        color: 'red',
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold',
                                    }}
                                />
                            </div>
                        </td>{' '}
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Customer Vehicle Number :</td>
                        <td className="p-2">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <EditableField
                                    label="Customer Vehicle Number"
                                    value={bookingDetails?.vehicleNumber}
                                    isEditing={editStates.vehicleNumber}
                                    editedValue={editedFields.vehicleNumber}
                                    loading={loadingStates.vehicleNumber}
                                    onEditClick={() => handleEditClick('vehicleNumber')}
                                    onSaveClick={() => handleSaveClick('vehicleNumber')}
                                    onChange={(e) => setEditedFields((prev) => ({ ...prev, vehicleNumber: e.target.value }))}
                                    isEditable={bookingDetails?.status === 'Order Completed' && !(bookingCheck === true || bookingCheck === null)}
                                    bookingCheck={bookingCheck}
                                />
                            </div>
                        </td>{' '}
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Brand Name :</td>
                        <td className="p-2">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <EditableField
                                    label="Vehicle Modal"
                                    value={bookingDetails?.vehicleModel}
                                    isEditing={editStates.vehicleModel}
                                    editedValue={editedFields.vehicleModel}
                                    loading={loadingStates.vehicleModel}
                                    onEditClick={() => handleEditClick('vehicleModel')}
                                    onSaveClick={() => handleSaveClick('vehicleModel')}
                                    onChange={(e) => setEditedFields((prev) => ({ ...prev, vehicleModel: e.target.value }))}
                                    isEditable={bookingDetails?.status === 'Order Completed' && !(bookingCheck === true || bookingCheck === null)}
                                    bookingCheck={bookingCheck}
                                />
                            </div>
                        </td>{' '}
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
                        <td className="p-2">{bookingDetails.baseLocation ? `${bookingDetails.baseLocation.name}` : 'Location not selected'}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Pickup Location:</td>
                        <td className="p-2">{bookingDetails.pickupLocation ? `${bookingDetails.pickupLocation.name}` : 'Location not selected'}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Dropoff Location:</td>
                        <td className="p-2">{bookingDetails.dropoffLocation ? `${bookingDetails.dropoffLocation.name}` : 'Location not selected'}</td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Distance :</td>
                        <td className="p-2">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <EditableField
                                    label="Distance"
                                    value={bookingDetails?.distance}
                                    isEditing={editStates.distance}
                                    editedValue={editedFields.distance}
                                    loading={loadingStates.distance}
                                    onEditClick={() => handleEditClick('distance')}
                                    onSaveClick={() => handleSaveClick('distance')}
                                    onChange={(e) => setEditedFields((prev) => ({ ...prev, distance: e.target.value }))}
                                    isEditable={bookingDetails?.status === 'Order Completed' && !(bookingCheck === true || bookingCheck === null)}
                                    bookingCheck={bookingCheck}
                                />
                            </div>
                        </td>{' '}
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Service Type :</td>
                        <td className="p-2">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <EditableField
                                    label="Service Type"
                                    value={bookingDetails?.serviceType}
                                    isEditing={editStates.serviceType}
                                    editedValue={editedFields.serviceType}
                                    loading={loadingStates.serviceType}
                                    onEditClick={() => handleEditClick('serviceType')}
                                    onSaveClick={() => handleSaveClick('serviceType')}
                                    onChange={(e) => setEditedFields((prev) => ({ ...prev, serviceType: e.target.value }))}
                                    isEditable={bookingDetails?.status === 'Order Completed' && !(bookingCheck === true || bookingCheck === null)}
                                    bookingCheck={bookingCheck}
                                />
                            </div>
                        </td>{' '}
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Service Vehicle Number :</td>

                        <td className="p-2">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <EditableField
                                    label="Service Vehicle Number"
                                    value={bookingDetails?.serviceVehicle}
                                    isEditing={editStates.serviceVehicle}
                                    editedValue={editedFields.serviceVehicle}
                                    loading={loadingStates.serviceVehicle}
                                    onEditClick={() => handleEditClick('serviceVehicle')}
                                    onSaveClick={() => handleSaveClick('serviceVehicle')}
                                    onChange={(e) => setEditedFields((prev) => ({ ...prev, serviceVehicle: e.target.value }))}
                                    isEditable={bookingDetails?.status === 'Order Completed' && !(bookingCheck === true || bookingCheck === null)}
                                    bookingCheck={bookingCheck}
                                />
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td className="bg-gray-100 p-2 font-semibold">Comments :</td>
                        <td className="p-2">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <EditableField
                                    label="Comments"
                                    value={bookingDetails?.comments}
                                    isEditing={editStates.comments}
                                    editedValue={editedFields.comments}
                                    loading={loadingStates.comments}
                                    onEditClick={() => handleEditClick('comments')}
                                    onSaveClick={() => handleSaveClick('comments')}
                                    onChange={(e) => setEditedFields((prev) => ({ ...prev, comments: e.target.value }))}
                                    isEditable={bookingDetails?.status === 'Order Completed' && !(bookingCheck === true || bookingCheck === null)}
                                    bookingCheck={bookingCheck}
                                />
                            </div>
                        </td>{' '}
                    </tr>
                    {bookingDetails.status === 'Order Completed' && (
                        <>
                            <tr>
                                <td className="bg-gray-100 p-2 font-semibold">Pickup Time :</td>
                                <td className="p-2">{formatTimestamp(bookingDetails?.pickedTime)}</td>
                            </tr>
                            <tr>
                                <td className="bg-gray-100 p-2 font-semibold">Dropoff Time :</td>
                                <td className="p-2">
                                    <td>{formatTimestamp(bookingDetails?.droppedTime)}</td>
                                </td>
                            </tr>
                            <tr>
                                <td className="bg-gray-100 p-2 font-semibold">Remark :</td>
                                <td className="p-2 text-danger">{bookingDetails.remark}</td>
                            </tr>
                        </>
                    )}
                </tbody>
            </table>
            <br />
            <div className="w-full">
                {bookingDetails?.bookingChecked === false && bookingDetails?.status === 'Order Completed' && (
                    <button
                        disabled={bookingDetails?.paymentStatus === 'Not Paid'}
                        onClick={handleVerifyClick}
                        className={`w-full text-white font-semibold py-2 px-4 rounded-lg shadow-lg focus:outline-none focus:ring-2 transition duration-300 ease-in-out ${
                            bookingDetails?.paymentStatus === 'Not Paid'
                                ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:ring-blue-300'
                        }`}
                    >
                        Verify
                    </button>
                )}

                {bookingDetails?.bookingChecked === true && bookingDetails.status === 'Order Completed' && (
                    <p className="text-green-600 font-medium text-center mt-2">Booking verified successfully!</p>
                )}
                {bookingDetails?.bookingChecked === true && bookingDetails.status === 'Order Completed' && bookingDetails?.feedback !== true && (
                    <button className="bg-green-500 text-white px-4 py-2 rounded mt-4" onClick={handleFeedbackClick}>
                        Feedback Form
                    </button>
                )}

                {bookingDetails?.bookingChecked === true && bookingDetails.status === 'Order Completed' && bookingDetails?.feedback === true && (
                    <p className="text-red-600 font-medium text-center mt-2">Feedback Closed</p>
                )}
            </div>

            {showForm && bookingDetails && (
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
                        <label htmlFor="pickedTime" className="block text-sm font-medium text-gray-700">
                            Pickup Time
                        </label>
                        <input
                            type="datetime-local"
                            id="pickedTime"
                            name="pickedTime"
                            value={
                                formData.pickedTime
                                    ? formData.pickedTime.toDate().toISOString().slice(0, 16) // Convert Timestamp to ISO string
                                    : '' // Use an empty string if null or undefined
                            }
                            onChange={handleFormChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="droppedTime" className="block text-sm font-medium text-gray-700">
                            Dropoff Time
                        </label>
                        <input
                            type="datetime-local"
                            id="droppedTime"
                            name="droppedTime"
                            value={
                                formData.droppedTime
                                    ? formData.droppedTime.toDate().toISOString().slice(0, 16) // Convert Timestamp to ISO string
                                    : '' // Use an empty string if null or undefined
                            }
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
                        <select id="driverSalary" name="driverSalary" value={formData.driverSalary} onChange={handleFormChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
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
                        {bookingDetails?.company?.toLowerCase() !== 'rsa' ? (
                            <>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                                    Amount
                                </label>
                                <input
                                    type="text"
                                    id="amount"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleFormChange}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </>
                        ) : (
                            <p className="text-sm text-gray-500">RSA Work</p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label htmlFor="distance" className="block text-sm font-medium text-gray-700">
                            Distance
                        </label>
                        <input
                            type="text"
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
            </div>
        </div>
    );
};

export default ViewMore;
