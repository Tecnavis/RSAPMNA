import React, { useState, useEffect, ChangeEvent } from 'react';
import { getFirestore, collection, getDocs, doc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import IconEdit from '../../components/Icon/IconEdit';

interface Driver {
    id: string;
    driverName: string;
    idnumber: string;
    companyName: string;
    netTotalAmountInHand: number;
    totalSalaryAmount?: number;
    advance?: number;
    bookingCount?: number;
}

interface EditDriverData {
    driverName: string;
    idnumber: string;
}
interface Booking {
    driverId: string;
    amount: number | string;
    receivedAmount: number | string;
    companyBooking: boolean;
    balance: number;
    balanceCompany: number;
    selectedDriver: string;
    selectedCompany: string;
    updatedTotalSalary: string;
    receivedAmountCompany: number | string;
    transferedSalary: number | string; // New field for transferred salary
    totalDriverSalary: number | string;
    approve?: boolean;
    receivedUser?: string;
    OkClick?: boolean;
}
const DriverReport: React.FC = () => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [editDriverId, setEditDriverId] = useState<string | null>(null);
    const [otherDriversBookingCount, setOtherDriversBookingCount] = useState<number>(0);

    const [editDriverData, setEditDriverData] = useState<EditDriverData>({
        driverName: '',
        idnumber: '',
    });
    const [searchQuery, setSearchQuery] = useState<string>('');

    const db = getFirestore();
    const uid = sessionStorage.getItem('uid');

    useEffect(() => {
        if (!uid) {
            console.error('UID is not available');
            return;
        }

        // Fetch and listen for driver data in real-time
        const unsubscribeDrivers = onSnapshot(collection(db, `user/${uid}/driver`), (driverSnapshot) => {
            const driverList = driverSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Driver[];

            // Fetch and listen for booking data for totalBalance and totalCompanyBalance
            const unsubscribeBookingsForBalances = onSnapshot(query(collection(db, `user/${uid}/bookings`), where('status', '==', 'Order Completed')), (bookingsSnapshot) => {
                const bookingsForBalances = bookingsSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        driverId: data.driverId ?? '',
                        amount: data.amount ?? 0,
                        receivedAmount: data.receivedAmount ?? 0,
                        receivedAmountCompany: data.receivedAmountCompany ?? 0,
                        updatedTotalSalary: data.updatedTotalSalary ?? 0,
                        companyBooking: data.companyBooking ?? false,
                        balance: data.balance ?? 0,
                        balanceCompany: data.balanceCompany ?? 0,
                        selectedCompany: data.selectedCompany ?? '',
                        receivedUser: data.receivedUser ?? '',

                        selectedDriver: data.selectedDriver ?? '',
                        transferedSalary: data.transferedSalary ?? 0, // Added property
                        totalDriverSalary: data.totalDriverSalary ?? 0,
                        OkClick: data.OkClick ?? false, // Ensure this field exists
                    };
                }) as Booking[];

                // Fetch and listen for booking data for totalDriverSalary and totalTransferedSalary
                const unsubscribeBookingsForSalaries = onSnapshot(
                    query(collection(db, `user/${uid}/bookings`), where('status', '==', 'Order Completed'), where('bookingChecked', '==', true)),
                    (bookingsSnapshot) => {
                        const bookingsForSalaries = bookingsSnapshot.docs.map((doc) => {
                            const data = doc.data();
                            return {
                                id: doc.id,
                                driverId: data.selectedDriver ?? '',
                                transferedSalary: data.transferedSalary ?? 0, // Ensure this field exists
                                totalDriverSalary: data.totalDriverSalary ?? 0, // Ensure this field exists
                            };
                        });

                        // Step 3: Calculate net total amount for each driver
                        const updatedDrivers = driverList.map((driver) => {
                            // Filter bookings for the driver based on conditions
                            const driverBookingsForBalances = bookingsForBalances.filter(
                                (booking) => (booking.companyBooking === false && booking.selectedDriver === driver.id) || (booking.companyBooking === true && booking.selectedCompany === driver.id)
                            );
                            const bookingCount = driverBookingsForBalances.length;

                            const driverBookingsForSalaries = bookingsForSalaries.filter((booking) => booking.driverId === driver.id);

                            const totalBalance = driverBookingsForBalances
                                .filter((b) => !b.companyBooking)
                                .reduce((sum, b) => {
                                    // Check if the user is a "Staff" and adjust the amounts accordingly
                                    if (b.receivedUser === 'Staff') {
                                        console.log('User is Staff, setting amount and receivedAmount to 0 for booking:', b);
                                        b.amount = 0;
                                        b.receivedAmount = 0;
                                    }

                                    const received = Number(b.receivedAmount) || 0;
                                    const bookingAmount = Number(b.amount) || 0;
                                    const currentBalance = bookingAmount - received;

                                    console.log('Booking:', b);
                                    console.log('Received Amount:', received);
                                    console.log('Booking Amount:', bookingAmount);
                                    console.log('Current Balance for this booking:', currentBalance);
                                    console.log('Accumulated Sum Before:', sum);

                                    const newSum = sum + currentBalance;
                                    console.log('Accumulated Sum After:', newSum);
                                    return newSum;
                                }, 0);

                            console.log('Total Balance:', totalBalance);

                            const totalCompanyBalance = driverBookingsForBalances
                                .filter((b) => b.companyBooking)
                                .reduce((sum, b) => {
                                    const receivedCompany = Number(b.receivedAmountCompany) || 0;
                                    const updatedSalary = Number(b.updatedTotalSalary) || 0;
                                    // Check for OkClick to override balanceCompany to 0
                                    const balanceCompany = b.OkClick ? 0 : b.approve ? 0 : updatedSalary - receivedCompany;

                                    return sum + balanceCompany;
                                }, 0);

                            const totalDriverSalary = driverBookingsForSalaries.reduce((sum, b) => {
                                return sum + parseFloat(b.totalDriverSalary || 0);
                            }, 0);

                            const totalTransferedSalary = driverBookingsForSalaries.reduce((sum, b) => {
                                return sum + parseFloat(b.transferedSalary || 0);
                            }, 0);

                            const totalSalaryAmount = totalDriverSalary - totalTransferedSalary;

                            const advance = driver.advance || 0; // Default to 0 if advance is missing

                            return {
                                ...driver,
                                netTotalAmountInHand: driverBookingsForBalances.some((b) => b.companyBooking) ? totalCompanyBalance + advance : totalBalance + advance,
                                totalSalaryAmount: totalSalaryAmount,
                                bookingCount: bookingCount, 
                            };
                        });

                        // Update state
                        setDrivers(updatedDrivers);
                    }
                );

                // Clean up on unmount
                return () => unsubscribeBookingsForSalaries();
            });

            // Clean up on unmount
            return () => unsubscribeBookingsForBalances();
        });

        // Clean up on unmount
        return () => unsubscribeDrivers();
    }, [db, uid]);

    const handleDriverInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditDriverData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const filteredDrivers = drivers.filter((driver) => driver.driverName.toLowerCase().includes(searchQuery.toLowerCase()) || driver.idnumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const companyDrivers = filteredDrivers.filter((driver) => driver.companyName === 'Company');
    const rsaDrivers = filteredDrivers.filter((driver) => driver.companyName === 'RSA');
    const otherDrivers = filteredDrivers.filter((driver) => driver.companyName !== 'Company' && driver.companyName !== 'RSA');

    const renderTable = (driversList: Driver[], title: string) => {
        const header = title === 'Company Details' || title === 'Providers Details' ? 'Company Name' : 'Driver Name';

        return (
            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">{title}</h3>
                <table className="min-w-full bg-white">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="py-2 px-4">#</th>
                            <th className="py-2 px-4">{header}</th>
                            <th className="py-2 px-4">Driver ID</th>
                            <th className="py-2 px-4">Total Amount in Hand</th>
                            {(title === 'PMNA Drivers' || title === 'Providers Details') && <th className="py-2 px-4">Total Balance Salary Amount</th>}
                            {title === 'Providers Details' && (
                            <th className="py-2 px-4">Booking Count</th>
                        )}
                            <th className="py-2 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {driversList.map((driver, index) => (
                            <tr key={driver.id} className="hover:bg-gray-50">
                                <td className="border px-4 py-2">{index + 1}</td>
                                <td className="border px-4 py-2">
                                    {header === 'Company Name' ? (
                                        driver.driverName
                                    ) : editDriverId === driver.id ? (
                                        <input type="text" name="driverName" value={editDriverData.driverName} onChange={handleDriverInputChange} className="border rounded p-1" />
                                    ) : (
                                        driver.driverName
                                    )}
                                </td>
                                <td className="border px-4 py-2">
                                    {editDriverId === driver.id ? (
                                        <input type="text" name="idnumber" value={editDriverData.idnumber} onChange={handleDriverInputChange} className="border rounded p-1" />
                                    ) : (
                                        driver.idnumber
                                    )}
                                </td>
                                <td className="border px-4 py-2">{driver.netTotalAmountInHand?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) ?? '0'}</td>
                                {(title === 'PMNA Drivers' || title === 'Providers Details') && (
                                    <td className="border px-4 py-2">{driver.totalSalaryAmount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) ?? 'N/A'}</td>
                                )}
                                  {title === 'Providers Details' && (
                                <td className="border px-4 py-2">
                                    {driver.bookingCount ?? 0}
                                </td>
                            )}
                                <td className="border px-4 py-2 flex gap-2 items-center">
                                    {(title === 'PMNA Drivers' || title === 'Providers Details') && (
                                        <Link to={`/users/driver/driverdetails/cashcollection/${driver.id}`} className="text-blue-500 hover:text-blue-700 bg-blue-100 px-2 py-1 rounded-md shadow-md">
                                            View Cash Collection Report
                                        </Link>
                                    )}
                                    {title === 'Company Details' && (
                                        <Link
                                            to={`/users/driver/driverdetails/cashcollectioncompany/${driver.id}`}
                                            className="text-blue-500 hover:text-blue-700 bg-blue-100 px-2 py-1 rounded-md shadow-md"
                                        >
                                            View Cash Collection Report
                                        </Link>
                                    )}
                                    {/* Conditionally render "View Salary Details" */}
                                    {title !== 'Company Details' && (
                                        <Link
                                            to={{
                                                pathname: `/driverreport/salaryreport/${driver.id}`,
                                            }}
                                            //    state={{ netTotalAmountInHand: driver.netTotalAmountInHand }}
                                            className="text-blue-500 hover:text-blue-700 bg-blue-100 px-2 py-1 rounded-md shadow-md"
                                        >
                                            View Salary Details
                                        </Link>
                                    )}
                                    {(title === 'PMNA Drivers' || title === 'Providers Details') && (
                                        <Link to={`/driverreport/expensedetails/${driver.id}`} className="text-blue-500 hover:text-blue-700 bg-blue-100 px-2 py-1 rounded-md shadow-md">
                                            Expense Details
                                        </Link>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-4">Reports</h2>
            <div className="mb-4 w-full">
                <input type="text" placeholder="Search..." value={searchQuery} onChange={handleSearchChange} className="p-2 border border-gray-300 rounded w-full outline-none" />
            </div>
            {renderTable(rsaDrivers, 'PMNA Drivers')}
            {renderTable(otherDrivers, 'Providers Details')}
            {renderTable(companyDrivers, 'Company Details')}
        </div>
    );
};

export default DriverReport;
