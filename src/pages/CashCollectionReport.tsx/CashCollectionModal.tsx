import React, { useState } from 'react';
import { updateDoc, addDoc, collection } from 'firebase/firestore';

const CashCollectionModal = ({ netTotalAmountInHand, setNetTotalAmountInHand, driverId, driver, bookings, setBookings, db }) => {
    const [receivedAmount, setReceivedAmount] = useState('');

    const handleSubmit = async () => {
        try {
            const received = parseFloat(receivedAmount);
            const updatedNetTotal = netTotalAmountInHand - received;

            // Update driver's netTotalAmountInHand
            await updateDoc(doc(db, 'driver', driverId), { netTotalAmountInHand: updatedNetTotal });

            // Add new booking
            const newBooking = {
                dateTime: new Date().toISOString(),
                fileNumber: `Booking-${bookings.length + 1}`,
                amount: received,
                selectedDriver: driverId,
            };

            const bookingsRef = collection(db, 'bookings');
            await addDoc(bookingsRef, newBooking);

            // Update local state
            setNetTotalAmountInHand(updatedNetTotal);
            setBookings([...bookings, newBooking]);

            // Close modal or handle further UI updates
            console.log('Received amount processed:', received);
        } catch (error) {
            console.error('Error handling received amount:', error);
        }
    };

    return (
        <div className="fixed z-10 inset-0 overflow-y-auto hidden" id="modal">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Enter Received Amount</h3>
                                <div className="mt-2">
                                    <input
                                        type="number"
                                        value={receivedAmount}
                                        onChange={(e) => setReceivedAmount(e.target.value)}
                                        placeholder="Enter received amount"
                                        className="block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            onClick={handleSubmit}
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-500 text-base font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Submit
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashCollectionModal;
