import React from 'react';

const InvoiceModal = ({ selectedBookings, bookings, onClose, onGenerateInvoice }) => {
    const selectedBookingDetails = selectedBookings.map(bookingId => bookings.find(b => b.id === bookingId));

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
            <div className="bg-white p-5 rounded-lg shadow-lg w-3/4 max-w-2xl">
                <h2 className="text-2xl font-bold mb-4 text-center">Generate Invoice</h2>
                <table className="table-auto w-full text-left whitespace-no-wrap">
                    <thead>
                        <tr>
                            <th className="px-4 py-2">File Number</th>
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Service Type</th>
                            <th className="px-4 py-2">Service Vehicle</th>
                            <th className="px-4 py-2">Total Driver Salary</th>
                            <th className="px-4 py-2">Transfered Salary</th>
                            <th className="px-4 py-2">Balance Salary</th>
                        </tr>
                    </thead>
                    <tbody>
                        {selectedBookingDetails.map((booking) => (
                            <tr key={booking.id}>
                                <td className="border px-4 py-2">{booking.fileNumber}</td>
                                <td className="border px-4 py-2">{new Date(booking.dateTime).toLocaleDateString()}</td>
                                <td className="border px-4 py-2">{booking.serviceType}</td>
                                <td className="border px-4 py-2">{booking.serviceVehicle}</td>
                                <td className="border px-4 py-2">{booking.totalDriverSalary}</td>
                                <td className="border px-4 py-2">{booking.transferedSalary}</td>
                                <td className="border px-4 py-2">{booking.balanceSalary}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mt-4 flex justify-center">
                    
                    <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg mr-3" onClick={onGenerateInvoice}>
                        Generate Invoice
                    </button>
                    <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
