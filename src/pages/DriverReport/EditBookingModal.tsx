import React, { useState } from 'react';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const EditBookingModal = ({ booking, onClose, onSave }) => {
    const [formData, setFormData] = useState({ ...booking });
    const db = getFirestore();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const bookingRef = doc(db, 'bookings', booking.id);
            await updateDoc(bookingRef, formData);
            onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error updating booking:', error);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-5 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Edit Booking</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700">File Number</label>
                        <input
                            type="text"
                            name="fileNumber"
                            value={formData.fileNumber}
                            onChange={handleChange}
                            className="border rounded px-2 py-1 w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Service Type</label>
                        <input
                            type="text"
                            name="serviceType"
                            value={formData.serviceType}
                            onChange={handleChange}
                            className="border rounded px-2 py-1 w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Service Vehicle</label>
                        <input
                            type="text"
                            name="serviceVehicle"
                            value={formData.serviceVehicle}
                            onChange={handleChange}
                            className="border rounded px-2 py-1 w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Total Driver Salary</label>
                        <input
                            type="number"
                            name="totalDriverSalary"
                            value={formData.totalDriverSalary}
                            onChange={handleChange}
                            className="border rounded px-2 py-1 w-full"
                        />
                    </div>
                    
                    <div className="flex justify-end">
                        <button type="button" onClick={onClose} className="mr-2 bg-gray-500 text-white px-3 py-1 rounded">Cancel</button>
                        <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditBookingModal;
