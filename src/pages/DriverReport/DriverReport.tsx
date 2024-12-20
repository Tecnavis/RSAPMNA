import React, { useState, useEffect, ChangeEvent } from 'react';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import IconEdit from '../../components/Icon/IconEdit';

interface Driver {
    id: string;
    driverName: string;
    idnumber: string;
    companyName: string;
    netTotalAmountInHand: number;
    totalSalaryAmount?:number;
    advance?: number;
}

interface EditDriverData {
    driverName: string;
    idnumber: string;
}
interface Booking {
    driverId: string;
    amount: number;
    receivedAmount: number;
    companyBooking:boolean;
    balance:number;
    balanceCompany:number;
    selectedDriver:string;
    selectedCompany:string;
}
const DriverReport: React.FC = () => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [editDriverId, setEditDriverId] = useState<string | null>(null);
    const [editDriverData, setEditDriverData] = useState<EditDriverData>({
        driverName: '',
        idnumber: '',
    });
    const [searchQuery, setSearchQuery] = useState<string>('');

    const db = getFirestore();
    const uid = sessionStorage.getItem('uid');

    useEffect(() => {
        const fetchDriversWithNetTotal = async () => {
            if (!uid) {
                console.error('UID is not available');
                return;
            }
            try {
                // Step 1: Fetch all drivers
                const driverSnapshot = await getDocs(collection(db, `user/${uid}/driver`));
                const driverList = driverSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Driver[];
    
                // Step 2: Fetch all bookings
                const bookingsSnapshot = await getDocs(collection(db, `user/${uid}/bookings`));
                const bookings = bookingsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        driverId: data.driverId ?? '',
                        amount: data.amount ?? 0,
                        receivedAmount: data.receivedAmount ?? 0,
                        companyBooking: data.companyBooking ?? false,
                        balance: data.balance ?? 0,
                        balanceCompany: data.balanceCompany ?? 0,
                        selectedCompany: data.selectedCompany ?? '',

                        selectedDriver: data.selectedDriver ?? '',

                    };
                }) as Booking[];
                
    
                // Step 3: Calculate net total amount for each driver
                const updatedDrivers = driverList.map(driver => {
                    // Filter bookings for the driver based on conditions
                    const driverBookings = bookings.filter(
                        booking => 
                            (booking.companyBooking === false && booking.selectedDriver === driver.id) ||
                            (booking.companyBooking === true && booking.selectedCompany === driver.id)
                    );
    
                    console.log("Bookings for Driver:", driver.id, driverBookings);
    
                    // Separate logic for company and individual bookings
                    const totalBalance = driverBookings
                        .filter(b => !b.companyBooking)
                        .reduce((sum, b) => sum + (Number(b.balance) || 0), 0);
    
                    const totalCompanyBalance = driverBookings
                        .filter(b => b.companyBooking)
                        .reduce((sum, b) => sum + (Number(b.balanceCompany) || 0), 0);
    
                    const advance = driver.advance || 0; // Default to 0 if advance is missing
    
                    return {
                        ...driver,
                        netTotalAmountInHand: driverBookings.some(b => b.companyBooking)
                            ? totalCompanyBalance + advance
                            : totalBalance + advance,
                    };
                });
    
                // Update state
                setDrivers(updatedDrivers);
            } catch (error) {
                console.error('Error fetching drivers or bookings: ', error);
            }
        };
    
        fetchDriversWithNetTotal();
    }, [db, uid]);
    
    

    const handleEditDriverClick = (driver: Driver) => {
        setEditDriverId(driver.id);
        setEditDriverData({
            driverName: driver.driverName,
            idnumber: driver.idnumber,
        });
    };

    const handleDriverInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditDriverData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSaveDriverClick = async () => {
        if (!editDriverId) return;
        try {
            const driverDocRef = doc(db, `user/${uid}/driver`, editDriverId);
            await updateDoc(driverDocRef, editDriverData as { [key: string]: any });
            setDrivers(prevDrivers =>
                prevDrivers.map(driver =>
                    driver.id === editDriverId ? { ...driver, ...editDriverData } : driver
                )
            );
            setEditDriverId(null);
        } catch (error) {
            console.error('Error updating driver: ', error);
        }
    };

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const filteredDrivers = drivers.filter(driver =>
        driver.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.idnumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const companyDrivers = filteredDrivers.filter(driver => driver.companyName === 'Company');
    const rsaDrivers = filteredDrivers.filter(driver => driver.companyName === 'RSA');
    const otherDrivers = filteredDrivers.filter(driver => driver.companyName !== 'Company' && driver.companyName !== 'RSA');

    const renderTable = (driversList: Driver[], title: string) => {
        const header = title === 'Company Details' || title === 'Providers Details'
            ? 'Company Name'
            : 'Driver Name';

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
                            {(title === 'PMNA Drivers' || title === 'Providers Details') && (
                            <th className="py-2 px-4">Total Salary Amount</th>
                        )}
                            <th className="py-2 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    {driversList.map((driver, index) => (
                            <tr key={driver.id} className="hover:bg-gray-50">
                                 <td className="border px-4 py-2">{index + 1}</td> 
                                <td className="border px-4 py-2">
                                    {header === 'Company Name'
                                        ? driver.driverName
                                        : (editDriverId === driver.id
                                            ? <input
                                                type="text"
                                                name="driverName"
                                                value={editDriverData.driverName}
                                                onChange={handleDriverInputChange}
                                                className="border rounded p-1"
                                              />
                                            : driver.driverName)
                                    }
                                </td>
                                <td className="border px-4 py-2">
                                    {editDriverId === driver.id ? (
                                        <input
                                            type="text"
                                            name="idnumber"
                                            value={editDriverData.idnumber}
                                            onChange={handleDriverInputChange}
                                            className="border rounded p-1"
                                        />
                                    ) : (
                                        driver.idnumber
                                    )}
                                </td>
                                <td className="border px-4 py-2">
                                    {driver.netTotalAmountInHand?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) ?? '0'}
                                </td>
{(title === 'PMNA Drivers' || title === 'Providers Details') && (
                                <td className="border px-4 py-2">
                                    {driver.totalSalaryAmount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) ?? 'N/A'}
                                </td>
                            )}
                                <td className="border px-4 py-2 flex gap-2 items-center">
                                    {/* {editDriverId === driver.id ? (
                                        <button onClick={handleSaveDriverClick} className="text-green-500 hover:text-green-700">
                                            Save
                                        </button>
                                    ) : (
                                        <button onClick={() => handleEditDriverClick(driver)} className="text-green-500 hover:text-blue-700">
                                            <IconEdit className="inline-block w-5 h-5" />
                                        </button>
                                    )} */}
                                   
                                    {(title === 'PMNA Drivers' || title === 'Providers Details') && (
 <Link
 to={`/users/driver/driverdetails/cashcollection/${driver.id}`}
 className="text-blue-500 hover:text-blue-700 bg-blue-100 px-2 py-1 rounded-md shadow-md"
>
 View Cash Collection Report
</Link>



)}
            {(title === 'Company Details' ) && (
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
                                        to={`/driverreport/salaryreport/${driver.id}`}
                                        className="text-blue-500 hover:text-blue-700 bg-blue-100 px-2 py-1 rounded-md shadow-md"
                                    >
                                        View Salary Details
                                    </Link>
                                )}
                                    {(title === 'PMNA Drivers' || title === 'Providers Details') && (
    <Link
        to={`/driverreport/expensedetails/${driver.id}`}
        className="text-blue-500 hover:text-blue-700 bg-blue-100 px-2 py-1 rounded-md shadow-md"
    >
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
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="p-2 border border-gray-300 rounded w-full outline-none"
                />
            </div>
            {renderTable(rsaDrivers, 'PMNA Drivers')}
            {renderTable(otherDrivers, 'Providers Details')}
            {renderTable(companyDrivers, 'Company Details')}
        </div>
    );
};

export default DriverReport;
