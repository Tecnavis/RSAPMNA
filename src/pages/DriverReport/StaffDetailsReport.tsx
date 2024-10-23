import React, { useEffect, useState } from 'react';
import { format } from 'date-fns'; // Assuming you're using date-fns for formatting dates
import { useParams } from 'react-router-dom';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Staff {
    name: string;
    phone_number: string;
  
}
interface Booking {
    bookingId: string;
    userName: string;
    amount: number;
    date: string;
    // Add other booking fields as needed
}
const StaffDetailsReport = () => {
    const [staff, setStaff] = useState(null); // Fetch and set your staff data
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [receivedAmount, setReceivedAmount] = useState('');
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [password, setPassword] = useState('');
    const { id } = useParams<{ id: string }>();
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid') || '';
    const [bookings, setBookings] = useState<Booking[]>([]);

console.log("id",id)
useEffect(() => {
    const fetchStaffDetails = async () => {
        if (!uid) {
            console.error("UID is not defined");
            return; // Exit if uid is not defined
        }

        try {
            const docRef = doc(db, `user/${uid}/users`, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setStaff(docSnap.data() as Staff); // Set the staff data
            } else {
                console.log("No such document!");
                setStaff(null); // Clear the state if no document exists
            }
        } catch (error) {
            console.error("Error fetching staff details: ", error);
        }
    };

    fetchStaffDetails();
}, [id, uid]);
useEffect(() => {
    const fetchBookings = async () => {
        if (!staff || !staff.userName) return;

        try {
            const bookingsQuery = query(
                collection(db, `user/${uid}/bookings`),
                where("userName", "==", staff.userName)
            );
            const querySnapshot = await getDocs(bookingsQuery);
            const fetchedBookings = querySnapshot.docs
                .map((doc) => doc.data() as Booking)
                .filter((booking) => {
                    const bookingDate = new Date(booking.date);
                    const isMatchingMonth = selectedMonth
                        ? bookingDate.getMonth() + 1 === parseInt(selectedMonth)
                        : true;
                    const isMatchingYear = selectedYear
                        ? bookingDate.getFullYear() === parseInt(selectedYear)
                        : true;
                    return isMatchingMonth && isMatchingYear;
                });

            setBookings(fetchedBookings);
        } catch (error) {
            console.error("Error fetching bookings: ", error);
        }
    };

    fetchBookings();
}, [staff, selectedMonth, selectedYear, uid]);


    // Replace these with actual data fetching logic
    const calculateNetTotalAmountInHand = () => {
        // Implement your logic here
        return 0; // Placeholder
    };

    const handleAmountReceiveChange = (amount) => {
        // Implement the logic for handling amount received
    };

    return (
        <div className="container mx-auto my-10 p-5 bg-gray-50 shadow-lg rounded-lg">
            <h1 className="text-4xl font-extrabold mb-6 text-center text-gray-900 shadow-md p-3 rounded-lg bg-gradient-to-r from-indigo-300 to-red-300">Staff Details Report</h1>

            {staff ? (
                <>
                    <div className="container-fluid mb-5">
                        <div className="flex flex-wrap text-center md:text-left">
                            <div className="w-full md:w-1/2 mb-4 p-6 bg-white shadow-lg rounded-lg transition-transform duration-300 hover:scale-105">
                                <h2 className="text-2xl font-bold text-gray-800 mb-2 border-b-2 border-gray-200 pb-2">
                                    👤 Staff: <span className="text-indigo-600">{staff.name}</span>
                                </h2>
                                <div className="mt-4">
                                    <p className="text-lg text-gray-700">
                                        📞 <span className="font-medium">Phone:</span> {staff.phone_number}
                                    </p>
                                    
                                </div>
                            </div>

                            <div className="w-[560px] h-[165px] ml-6 flex justify-center md:justify-end p-2 bg-white rounded-lg shadow-lg transform transition-all duration-300 hover:shadow-xl hover:scale-105">
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                                    <span className="text-3xl mr-2">💵</span>
                                    Net Total Amount in Hand:
                                    <span className="text-yellow-300 text-2xl ml-2 font-extrabold">{calculateNetTotalAmountInHand()}</span>
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div className="container-fluid mb-5">
                        <div className="flex flex-wrap justify-between items-center text-center md:text-left">
                            <div className="w-full md:w-auto flex flex-col md:flex-row items-center md:justify-end">
                                <div className="flex items-center mb-4 md:mb-0 space-x-2">
                                    <label htmlFor="month" className="text-gray-700 font-semibold text-lg">
                                        Filter by Month:
                                    </label>
                                    <select
                                        id="month"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 ease-in-out"
                                    >
                                        <option value="">All Months</option>
                                        {Array.from({ length: 12 }, (_, index) => {
                                            const month = index + 1;
                                            return (
                                                <option key={month} value={month.toString()}>
                                                    {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <label htmlFor="year" className="text-gray-700 font-semibold text-lg">
                                        Filter by Year:
                                    </label>
                                    <select
                                        id="year"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 ease-in-out"
                                    >
                                        <option value="">All Years</option>
                                        {Array.from({ length: 5 }, (_, index) => {
                                            const year = new Date().getFullYear() - index;
                                            return (
                                                <option key={year} value={year.toString()}>
                                                    {year}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional components or logic for displaying staff report can go here */}

                    <button
                        onClick={() => setModalIsOpen(true)}
                        className={`px-6 py-2 font-semibold rounded-md text-white transition duration-300 ease-in-out bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50`}
                    >
                        Record Amount Received
                    </button>

                  

                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white shadow-md rounded-lg">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 border-b-2 border-gray-300">Booking ID</th>
                                    <th className="px-6 py-3 border-b-2 border-gray-300">Staff Amount</th>
                                </tr>
                            </thead>
                            <tbody>
    {bookings.map((booking) => (
        <tr key={booking.bookingId}>
            <td className="px-6 py-4 border-b">{booking.bookingId}</td>
            <td className="px-6 py-4 border-b">
                {booking.staffReceivedAmounts?.length > 0
                    ? booking.staffReceivedAmounts.join(', ') // Assuming this is an array of amounts
                    : 'No amounts recorded'}
            </td>
        </tr>
    ))}
</tbody>


                        </table>
                    </div>                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default StaffDetailsReport;
