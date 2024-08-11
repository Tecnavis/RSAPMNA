import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getFirestore, collection, doc, updateDoc } from 'firebase/firestore';

const UpdateBooking = () => {
    const location = useLocation();
    const bookData = location.state.booking;
    const [bookingDetails, setBookingDetails] = useState({
        company: bookData.company || '',
        fileNumber: bookData.fileNumber || '',
        customerName: bookData.customerName || '',
        phoneNumber: bookData.phoneNumber || '',
        mobileNumber: bookData.mobileNumber || '',
        pickupLocation: bookData.pickupLocation || '',
        dropoffLocation: bookData.dropoffLocation || '',
        distance: bookData.distance || '',
        serviceType: bookData.serviceType || '',
        serviceVehicle: bookData.serviceVehicle || '',
        selectedDriver: bookData.selectedDriver || '',
        totalSalary: bookData.totalSalary || '',
        vehicleNumber: bookData.vehicleNumber || '',
        vehicleModel: bookData.vehicleModel || '',
        comments: bookData.comments || '',
    });

    const db = getFirestore();

    const handleInputChange = (name, value) => {
        setBookingDetails({
            ...bookingDetails,
            [name]: value,
        });
    };

    const handleUpdateBooking = async () => {
        try {
            const bookingRef = doc(db, 'bookings', bookData.id);
            await updateDoc(bookingRef, bookingDetails);
            console.log('Booking successfully updated!');
        } catch (error) {
            console.error('Error updating booking:', error);
        }
    };

    // Render form inputs for each field in bookingDetails
    return (
        <div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h5 className="font-semibold text-lg dark:text-white-light">Add Bookings</h5>

                <div style={{ padding: '6px', flex: 1, marginTop: '2rem', marginRight: '6rem', marginLeft: '6rem', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', padding: '1rem' }}>
                        <h5 className="font-semibold text-lg dark:text-white-light mb-5 p-4">Book Now</h5>
                        <div style={{ padding: '1rem' }}>
                            <h5 className="font-semibold text-lg dark:text-white-light">
                                R<span className="text-danger">S</span>A{bookingDetails.fileNumber}
                            </h5>
                        </div>{' '}
                        <div style={{ width: '100%' }}>
                            <div className="mt-4 flex items-center">
                                <label htmlFor="company" className="ltr:mr-3 rtl:ml-2 w-1/3 mb-0">
                                    Company
                                </label>
                                <select
                                    id="company"
                                    name="company"
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    }}
                                    onChange={(e) => handleInputChange('company', e.target.value)}
                                    value={bookingDetails.company}
                                >
                                    <option value="">Select Company</option>
                                    <option value="rsa">RSA</option>
                                    <option value="self">Self</option>
                                </select>
                            </div>
                            <div className="flex items-center mt-4">
                                <label htmlFor="fileNumber" className="ltr:mr-3 rtl:ml-2 w-1/3 mb-0">
                                    File Number
                                </label>
                                {bookingDetails.company === 'self' ? (
                                    <h5 className="font-semibold text-lg dark:text-white-light">
                                        R<span className="text-danger">S</span>A{bookingId}
                                    </h5>
                                ) : (
                                    <input
                                        id="fileNumber"
                                        type="text"
                                        name="fileNumber"
                                        className="form-input lg:w-[250px] w-2/3"
                                        placeholder="Enter File Number"
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            border: '1px solid #ccc',
                                            borderRadius: '5px',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                        }}
                                        value={bookingDetails.fileNumber}
                                        onChange={(e) => handleInputChange('fileNumber', e.target.value)}
                                    />
                                )}
                            </div>
                            <div className="mt-4 flex items-center">
                                <label htmlFor="customerName" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Customer Name
                                </label>
                                <input
                                    id="customerName"
                                    type="text"
                                    name="customerName"
                                    className="form-input flex-1"
                                    placeholder="Enter Name"
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    }}
                                    value={bookingDetails.customerName}
                                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                                />
                            </div>
                            <div className="mt-4 flex items-center">
                                <label htmlFor="phoneNumber" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Phone Number
                                </label>
                                <input
                                    id="phoneNumber"
                                    type="phoneNumber"
                                    name="phoneNumber"
                                    className="form-input flex-1"
                                    placeholder="Enter Phone number"
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    }}
                                    value={bookingDetails.phoneNumber}
                                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                />
                            </div>
                            <div className="mt-4 flex items-center">
                                <label htmlFor="mobileNumber" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Mobile Number
                                </label>
                                <input
                                    id="mobileNumber"
                                    type="text"
                                    name="mobileNumber"
                                    className="form-input flex-1"
                                    placeholder="Enter Mobile number"
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    }}
                                    value={bookingDetails.mobileNumber}
                                    onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                                />
                            </div>{' '}
                            <div className="mt-4 flex items-center">
                                <label htmlFor="distance" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Distance (KM)
                                </label>
                                <input
                                    id="distance"
                                    type="string"
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
                                    value={bookingDetails.distance}
                                    readOnly
                                />
                            </div>
                            <div className="flex items-center mt-4">
                                <label htmlFor="serviceType" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Service Type
                                </label>
                                <select
                                    id="serviceType"
                                    name="serviceType"
                                    className="form-select flex-1"
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    }}
                                    value={bookingDetails.serviceType}
                                    onChange={(e) => handleInputChange('serviceType', e.target.value)}
                                >
                                    <option value="">Select Service Type</option>
                                    <option value="Flat bed">Flat bed</option>
                                    <option value="Under Lift">Under Lift</option>
                                    <option value="Rsr By Car">Rsr By Car</option>
                                    <option value="Rsr By Bike">Rsr By Bike</option>
                                    <option value="Custody">Custody</option>
                                    <option value="Hydra Crane">Hydra Crane</option>
                                    <option value="Jump start">Jump start</option>
                                    <option value="Tow Wheeler Fbt">Tow Wheeler Fbt</option>
                                    <option value="Zero Digri Flat Bed">Zero Digri Flat Bed</option>
                                    <option value="Undet Lift 407">Undet Lift 407</option>
                                    <option value="S Lorry Crane Bed">S Lorry Crane Bed</option>
                                </select>
                            </div>
                            <div className="flex items-center mt-4">
                                <label htmlFor="serviceVehicle" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Service Vehicle Number
                                </label>
                                <input
                                    id="serviceVehicle"
                                    type="text"
                                    name="serviceVehicle"
                                    className="form-input flex-1"
                                    placeholder="Enter Service Vehicle Number"
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    }}
                                    value={bookingDetails.serviceVehicle}
                                    onChange={(e) => handleInputChange('serviceVehicle', e.target.value)}
                                />
                            </div>





                            
                            <div className="mt-4 flex items-center">
                                <label htmlFor="vehicleNumber" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Customer Vehicle Number
                                </label>
                                <input
                                    id="vehicleNumber"
                                    type="text"
                                    name="vehicleNumber"
                                    className="form-input flex-1"
                                    placeholder="Enter vehicle number"
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    }}
                                    value={bookingDetails.vehicleNumber}
                                    onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                                />
                            </div>
                            <div className="flex items-center mt-4">
                                <label htmlFor="vehicleModel" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Brand Name
                                </label>
                                <input
                                    id="vehicleModel"
                                    name="vehicleModel"
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
                                    value={bookingDetails.vehicleModel}
                                    onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                                />
                            </div>
                            <div className="mt-4 flex items-center">
                                <textarea
                                    id="reciever-name"
                                    name="reciever-name"
                                    className="form-input flex-1"
                                    placeholder="Comments"
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '5px',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    }}
                                    value={bookingDetails.comments}
                                    onChange={(e) => handleInputChange('comments', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                                <button
                                className='btn btn-primary'
                                    type="button"
                                    onClick={handleUpdateBooking}                                    style={{
                                        padding: '0.5rem',
                                        width: '100%',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                    }}
                                >
Update                                </button>
                            </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateBooking;
