
  import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const OrderDetails = () => {
  const { id } = useParams();
    const navigate = useNavigate();
    console.log('id', id);
    const [bookingDetails, setBookingDetails] = useState(null);
    const db = getFirestore();
    const { search } = useLocation();
    const [showPickupDetails, setShowPickupDetails] = useState(false);
    const [showDropoffDetails, setShowDropoffDetails] = useState(false);
    const queryParams = new URLSearchParams(search);
    const [editData, setEditData] = useState(null);
    const [staffName, setStaffName] = useState('Admin');
    const [ShowRoom, setShowRoom] = useState('');

    console.log('first', bookingDetails);
    
    
    useEffect(() => {
        const fetchBookingDetails = async () => {
            try {
                const docRef = doc(db, 'bookings', id);
                const docSnap = await getDoc(docRef);
                console.log('Document data:', docSnap.data());

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setBookingDetails({
                        ...data,
                        kilometer: data.kilometer || 'No data',
                        kilometerdrop: data.kilometerdrop || 'No data',
                        photo: data.photo,
                        photodrop: data.photodrop,
                        rcBookImageURLs: data.rcBookImageURLs || [],
                        vehicleImageURLs: data.vehicleImageURLs || [],
                        vehicleImgURLs: data.vehicleImgURLs || [],
                        fuelBillImageURLs: data.fuelBillImageURLs || [],
                    });
                    if (data.staffId) {
                        fetchStaffName(data.staffId);
                    }
                } else {
                    console.log(`Document with ID ${id} does not exist!`);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        const fetchStaffName = async (staffId) => {
            try {
                const staffDocRef = doc(db, 'users', staffId);
                const staffDocSnap = await getDoc(staffDocRef);

                if (staffDocSnap.exists()) {
                    setStaffName(staffDocSnap.data().name);
                } else {
                    console.log(`Staff with ID ${staffId} does not exist!`);
                }
            } catch (error) {
                console.error('Error fetching staff data:', error);
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

   

    if (!bookingDetails) {
        return <div>Loading...</div>;
    }

    const containerStyle = {
        margin: '2rem',
        padding: '1rem',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
        borderRadius: '10px',
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
    };

    const thStyle = {
        backgroundColor: '#f2f2f2',
        padding: '8px',
        textAlign: 'left',
        fontWeight: 'bold',
    };

    const tdStyle = {
        padding: '8px',
        borderBottom: '1px solid #ddd',
    };

    return (
        <div style={containerStyle}>
            <h5 className="font-semibold text-lg dark:text-white-light mb-5">Booking Details </h5>
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
                    {bookingDetails.kilometer && (
                        <div className="my-4">
                            <strong>Pickup Kilometer:</strong> {bookingDetails.kilometer}
                        </div>
                    )}
                    {bookingDetails.photo && (
                        <div className="my-4 flex ">
                            <strong>Pickup Km Photo:</strong>
                            <img src={bookingDetails.photo} alt="Dropoff Km Photo" className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5" />
                        </div>
                    )}

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

                    <h2 className="text-xl font-bold mt-5">Vehicle Images(Pickup)</h2>
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
                    {bookingDetails.kilometerdrop && (
                        <div className="my-4">
                            <strong>Dropoff Kilometer:</strong> {bookingDetails.kilometerdrop}
                        </div>
                    )}
                    {bookingDetails.photodrop && (
                        <div className="my-4 flex ">
                            <strong>Dropoff Km Photo:</strong>
                            <img src={bookingDetails.photodrop} alt="Dropoff Km Photo" className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5" />
                        </div>
                    )}
                    <h3 className="text-xl font-bold mt-5">Fuel Bill Images</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {bookingDetails.fuelBillImageURLs.length > 0 ? (
                            bookingDetails.fuelBillImageURLs.map((url, index) => (
                                <div key={index} className="max-w-xs">
                                    <img src={url} alt={`RC Book Image ${index}`} className="w-full h-auto" />
                                </div>
                            ))
                        ) : (
                            <p className="col-span-3">No RC Book Images available.</p>
                        )}
                    </div>

                    <h2 className="text-xl font-bold mt-5">Vehicle Images(Dropoff)</h2>
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

            <table style={tableStyle}>
                <tbody>
                    <tr>
                        <td style={thStyle}>Date & Time :</td>
                        <td style={tdStyle}>{bookingDetails.dateTime} </td>
                    </tr>
                    <tr>
                        <td style={thStyle}>Booking ID :</td>
                        <td style={tdStyle}>{bookingDetails.bookingId} </td>
                    </tr>
                    <tr>
                        <td style={thStyle}>Staff Name</td>
                        <td style={thStyle}>{staffName}</td>
                    </tr>
                    <tr>
                        <td style={thStyle}>Edited person</td>
                        <td style={thStyle}>{bookingDetails.newStatus} , {bookingDetails.editedTime} </td>
                    </tr>
                    <tr>
                        <td style={thStyle}>Amount without insurance :</td>
                        <td style={tdStyle}>{bookingDetails.totalSalary} </td>
                    </tr>
                    <tr>
                        <td style={thStyle}>Payable Amount with insurance:</td>
                        <td style={tdStyle}>{bookingDetails.updatedTotalSalary} </td>
                    </tr>
                    <tr>
                        <td style={thStyle}>Company :</td>
                        <td style={tdStyle}>{bookingDetails.company}</td>
                    </tr>
                    <tr>
                        <td style={thStyle}>TrappedLocation :</td>
                        <td style={tdStyle}>{bookingDetails.trappedLocation}</td>
                    </tr>
                    <tr>
                        <td style={thStyle}>Showroom :</td>
                        <td style={tdStyle}>{bookingDetails.showroomLocation}</td>
                    </tr>
                    <tr>
                        <td style={thStyle}>File Number :</td>
                        <td style={tdStyle}>{bookingDetails.fileNumber}</td>
                    </tr>

                    <tr>
                        <td style={thStyle}>CustomerName :</td>
                        <td style={tdStyle}>{bookingDetails.customerName}</td>
                    </tr>
                    <tr>
                        <td style={thStyle}>Driver :</td>
                        <td style={tdStyle}>{bookingDetails.driver}</td>
                    </tr>
                    <tr>
                        <td style={thStyle}>Customer VehicleNumber :</td>
                        <td style={tdStyle}>{bookingDetails.vehicleNumber}</td>
                    </tr>
                    <tr>
                        <td style={thStyle}>Brand Name :</td>
                        <td style={tdStyle}>{bookingDetails.vehicleModel}</td>
                    </tr>
                    <tr>
                        <td style={thStyle}>phoneNumber :</td>
                        <td style={tdStyle}>{bookingDetails.phoneNumber}</td>
                    </tr>
                    <tr>
                        <td style={thStyle}>MobileNumber :</td>
                        <td style={tdStyle}>{bookingDetails.mobileNumber}</td>
                    </tr>
                    <tr>
                        <td style={thStyle}>Start Location:</td>
                        <td style={tdStyle}>
                            {bookingDetails.baseLocation
                                ? `${bookingDetails.baseLocation.name}, Lat: ${bookingDetails.baseLocation.lat}, Lng: ${bookingDetails.baseLocation.lng}`
                                : 'Location not selected'}
                        </td>
                    </tr>
                    <tr>
                        <td style={thStyle}>Pickup Location:</td>
                        <td style={tdStyle}>
                            {bookingDetails.pickupLocation
                                ? `${bookingDetails.pickupLocation.name}, Lat: ${bookingDetails.pickupLocation.lat}, Lng: ${bookingDetails.pickupLocation.lng}`
                                : 'Location not selected'}
                        </td>
                    </tr>
                    <tr>
                        <td style={thStyle}>DropOff Location:</td>
                        <td style={tdStyle}>
                            {bookingDetails.dropoffLocation
                                ? `${bookingDetails.dropoffLocation.name}, Lat: ${bookingDetails.dropoffLocation.lat}, Lng: ${bookingDetails.dropoffLocation.lng}`
                                : 'Location not selected'}
                        </td>
                    </tr>

                    <tr>
                        <td style={thStyle}>Distance :</td>
                        <td style={tdStyle}>{bookingDetails.distance}</td>
                    </tr>
                    <tr>
                        <td style={thStyle}>ServiceType :</td>
                        <td style={tdStyle}>{bookingDetails.serviceType}</td>
                    </tr>
                    <tr>
                        <td style={thStyle}>Service Vehicle Number :</td>
                        <td style={tdStyle}>{bookingDetails.serviceVehicle}</td>
                    </tr>
                    <tr>
                        <td style={thStyle}>Comments :</td>
                        <td style={tdStyle}>{bookingDetails.comments}</td>
                    </tr>
                </tbody>
             </table>
        </div>
    );
};



export default OrderDetails;
