import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
interface BookingDetails {
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
      comments:string;
}

const ViewMore: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid');
    const role = sessionStorage.getItem('role');

    const { search } = useLocation();
    const [showPickupDetails, setShowPickupDetails] = useState(false);
    const [showDropoffDetails, setShowDropoffDetails] = useState(false);
    const queryParams = new URLSearchParams(search);
    const userName = sessionStorage.getItem('username');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        dropoffTime: '',
        driverSalary: 'No',
        companyAmount: 'No',
        amount: '',
        distance: '',
        remark: '',
    });
    useEffect(() => {
        const fetchBookingDetails = async () => {
            if (!uid || !id) {
                console.error("UID or ID is undefined.");
                return;
            }

            try {
                const docRef = doc(db, `user/${uid}/bookings`, id);
                const docSnap = await getDoc(docRef);
    
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setBookingDetails({
                        dateTime: data.dateTime || '', // Provide a default value
                        bookingId: data.bookingId || '',
                        newStatus: data.newStatus || '',
                        editedTime: data.editedTime || '',
                        totalSalary: data.totalSalary || '',
                        updatedTotalSalary: data.updatedTotalSalary || '',
                        company: data.company || '',
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
                        baseLocation: data.baseLocation || null, // Assuming this could be null
                        pickupLocation: data.pickupLocation || null,
                        dropoffLocation: data.dropoffLocation || null,
                        distance: data.distance || '',
                        serviceType: data.serviceType || '',
                        serviceVehicle: data.serviceVehicle || '',
                        rcBookImageURLs: data.rcBookImageURLs || [],
                        vehicleImageURLs: data.vehicleImageURLs || [],
                        vehicleImgURLs: data.vehicleImgURLs || [],
                        fuelBillImageURLs: data.fuelBillImageURLs || [],
                        comments: data.comments || '', // Add any additional fields here
                    });
                }
                 else {
                    console.log(`Document with ID ${id} does not exist!`);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
    
        fetchBookingDetails();
    }, [db, id]);
    

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
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    if (!uid || !id) {
        console.error("UID or ID is undefined.");
        return; // Exit the function if either is undefined
    }
        try {
            const docRef = doc(db, `user/${uid}/bookings`, id);
            await updateDoc(docRef, {
                ...formData,
                status: 'Order Completed', // Update the status to completed
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
                   <h3 className="text-xl font-bold mt-5">RC Book Images</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {bookingDetails.rcBookImageURLs.length > 0 ? (
                            bookingDetails.rcBookImageURLs.map((url, index) => (
                                <div key={index} className="max-w-xs">
                                    <img src={url} alt={`RC Book Image ${index}`} className="w-full h-auto" />
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
                                    <img src={url} alt={`Vehicle Image ${index}`} className="w-full h-auto" />
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
                     <h3 className="text-xl font-bold mt-5">Fuel Bill Images</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {bookingDetails.fuelBillImageURLs.length > 0 ? (
                            bookingDetails.fuelBillImageURLs.map((url, index) => (
                                <div key={index} className="max-w-xs">
                                    <img src={url} alt={`Fuel Bill Image ${index}`} className="w-full h-auto" />
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
                                    <img src={url} alt={`Vehicle Image ${index}`} className="w-full h-auto" />
                                </div>
                            ))
                        ) : (
                            <p className="col-span-full">No Vehicle Images available.</p>
                        )}
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
                        <td className="p-2">{bookingDetails.newStatus}, {bookingDetails.editedTime}</td>
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
                </tbody>
            </table>
            {showForm && (
            <form onSubmit={handleFormSubmit} className="mt-8">
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
                    <select
                        id="companyAmount"
                        name="companyAmount"
                        value={formData.companyAmount}
                        onChange={handleFormChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    >
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
                    <textarea
                        id="remark"
                        name="remark"
                        value={formData.remark}
                        onChange={handleFormChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Submit
                </button>
            </form>
        )}
            <div className="flex justify-end mt-5">
                
                <button onClick={() => setShowForm(!showForm)} className="ml-4 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                    {showForm ? 'Close Form' : 'Booking Completed'}
                </button>
            </div>
        </div>
    );
};

export default ViewMore;
