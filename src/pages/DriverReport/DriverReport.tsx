// import React, { useState, useEffect, ChangeEvent, MouseEvent } from 'react';
// import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
// import { Link } from 'react-router-dom';
// import IconEdit from '../../components/Icon/IconEdit';

// // Define the shape of a driver record
// interface Driver {
//     id: string;
//     driverName: string;
//     idnumber: string;
//     advancePayment: string;
//     companyName: string; // Assuming you have this field to filter drivers
// }

// // Define the shape of the edit driver form data
// interface EditDriverData {
//     driverName: string;
//     idnumber: string;
//     advancePayment: string;
// }

// const DriverReport: React.FC = () => {
//     const [drivers, setDrivers] = useState<Driver[]>([]);
//     const [editDriverId, setEditDriverId] = useState<string | null>(null);
//     const [editDriverData, setEditDriverData] = useState<EditDriverData>({
//         driverName: '',
//         idnumber: '',
//         advancePayment: ''
//     });
//     const [searchQuery, setSearchQuery] = useState<string>('');

//     const db = getFirestore();
//     const uid = sessionStorage.getItem('uid');

//     useEffect(() => {
//         const fetchDrivers = async () => {
//             if (!uid) {
//                 console.error('UID is not available');
//                 return;
//             }

//             try {
//                 const querySnapshot = await getDocs(collection(db, `user/${uid}/driver`));
//                 const driverList = querySnapshot.docs.map(doc => ({
//                     id: doc.id,
//                     ...doc.data()
//                 })) as Driver[];
//                 setDrivers(driverList);
//             } catch (error) {
//                 console.error('Error fetching drivers: ', error);
//             }
//         };

//         fetchDrivers();
//     }, [db, uid]);

//     const handleEditDriverClick = (driver: Driver) => {
//         setEditDriverId(driver.id);
//         setEditDriverData({
//             driverName: driver.driverName,
//             idnumber: driver.idnumber,
//             advancePayment: driver.advancePayment
//         });
//     };

//     const handleDriverInputChange = (e: ChangeEvent<HTMLInputElement>) => {
//         const { name, value } = e.target;
//         setEditDriverData(prevData => ({ ...prevData, [name]: value }));
//     };

//     const handleSaveDriverClick = async () => {
//         if (!editDriverId) return;

//         try {
//             const driverDocRef = doc(db, `user/${uid}/driver`, editDriverId);
//             await updateDoc(driverDocRef, editDriverData as { [key: string]: any }); // Type assertion here
//             setDrivers(prevDrivers =>
//                 prevDrivers.map(driver =>
//                     driver.id === editDriverId ? { ...driver, ...editDriverData } : driver
//                 )
//             );
//             setEditDriverId(null);
//         } catch (error) {
//             console.error('Error updating driver: ', error);
//         }
//     };

//     const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
//         setSearchQuery(e.target.value);
//     };

//     const filteredDrivers = drivers.filter(driver =>
//         driver.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         driver.idnumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         driver.advancePayment.toString().includes(searchQuery)
//     );

//     const companyDrivers = filteredDrivers.filter(driver => driver.companyName === 'Company');
//     const rsaDrivers = filteredDrivers.filter(driver => driver.companyName === 'RSA');
//     const otherDrivers = filteredDrivers.filter(driver => driver.companyName !== 'Company' && driver.companyName !== 'RSA');

//     const renderTable = (driversList: Driver[], title: string) => (
//         <div className="mb-8">
//             <h3 className="text-xl font-semibold mb-4">{title}</h3>
//             <table className="min-w-full bg-white">
//                 <thead>
//                     <tr className="bg-gray-100">
//                         <th className="py-2 px-4">Driver Name</th>
//                         <th className="py-2 px-4">Driver ID</th>
//                         <th className="py-2 px-4">Advance Payment</th>
//                         <th className="py-2 px-4">Actions</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {driversList.map(driver => (
//                         <tr key={driver.id} className="hover:bg-gray-50">
//                             <td className="border px-4 py-2">
//                                 {editDriverId === driver.id ? (
//                                     <input
//                                         type="text"
//                                         name="driverName"
//                                         value={editDriverData.driverName}
//                                         onChange={handleDriverInputChange}
//                                         className="border rounded p-1"
//                                     />
//                                 ) : (
//                                     driver.driverName
//                                 )}
//                             </td>
//                             <td className="border px-4 py-2">
//                                 {editDriverId === driver.id ? (
//                                     <input
//                                         type="text"
//                                         name="idnumber"
//                                         value={editDriverData.idnumber}
//                                         onChange={handleDriverInputChange}
//                                         className="border rounded p-1"
//                                     />
//                                 ) : (
//                                     driver.idnumber
//                                 )}
//                             </td>
//                             <td className="border px-4 py-2">
//                                 {editDriverId === driver.id ? (
//                                     <input
//                                         type="text"
//                                         name="advancePayment"
//                                         value={editDriverData.advancePayment}
//                                         onChange={handleDriverInputChange}
//                                         className="border rounded p-1"
//                                     />
//                                 ) : (
//                                     driver.advancePayment
//                                 )}
//                             </td>
//                             <td className="border px-4 py-2 flex gap-2 items-center">
//                                 {editDriverId === driver.id ? (
//                                     <button onClick={handleSaveDriverClick} className="text-green-500 hover:text-green-700">
//                                         Save
//                                     </button>
//                                 ) : (
//                                     <button onClick={() => handleEditDriverClick(driver)} className="text-green-500 hover:text-blue-700">
//                                         <IconEdit className="inline-block w-5 h-5" />
//                                     </button>
//                                 )}

//                                 <Link
//                                     to={`/users/driver/driverdetails/cashcollection/${driver.id}`}
//                                     className="text-blue-500 hover:text-blue-700 bg-blue-100 px-2 py-1 rounded-md shadow-md"
//                                 >
//                                     View Cash Collection Report
//                                 </Link>

//                                 <Link
//                                     to={`/driverreport/salaryreport/${driver.id}`}
//                                     className="text-blue-500 hover:text-blue-700 bg-blue-100 px-2 py-1 rounded-md shadow-md"
//                                 >
//                                     View Salary Details
//                                 </Link>
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//         </div>
//     );

//     return (
//         <div className="container mx-auto px-4">
//             <h2 className="text-2xl font-semibold mb-4">Reports</h2>
//             <div className="mb-4 w-full">
//                 <input
//                     type="text"
//                     placeholder="Search..."
//                     value={searchQuery}
//                     onChange={handleSearchChange}
//                     className="p-2 border border-gray-300 rounded w-full outline-none"
//                 />
//             </div>
//             {renderTable(companyDrivers, 'Company Details')}
//             {renderTable(rsaDrivers, 'PMNA Drivers')}
//             {renderTable(otherDrivers, 'Providers Details')}
//         </div>
//     );
// };

// export default DriverReport;
import React, { useState, useEffect, ChangeEvent, MouseEvent } from 'react';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import IconEdit from '../../components/Icon/IconEdit';

// Define the shape of a driver record
interface Driver {
    id: string;
    driverName: string;
    idnumber: string;
    // advancePayment: string;
    companyName: string; // Assuming you have this field to filter drivers
}

// Define the shape of the edit driver form data
interface EditDriverData {
    driverName: string;
    idnumber: string;
    // advancePayment: string;
}

const DriverReport: React.FC = () => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [editDriverId, setEditDriverId] = useState<string | null>(null);
    const [editDriverData, setEditDriverData] = useState<EditDriverData>({
        driverName: '',
        idnumber: '',
        // advancePayment: ''
    });
    const [searchQuery, setSearchQuery] = useState<string>('');

    const db = getFirestore();
    const uid = sessionStorage.getItem('uid');

    useEffect(() => {
        const fetchDrivers = async () => {
            if (!uid) {
                console.error('UID is not available');
                return;
            }

            try {
                const querySnapshot = await getDocs(collection(db, `user/${uid}/driver`));
                const driverList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Driver[];
                setDrivers(driverList);
            } catch (error) {
                console.error('Error fetching drivers: ', error);
            }
        };

        fetchDrivers();
    }, [db, uid]);

    const handleEditDriverClick = (driver: Driver) => {
        setEditDriverId(driver.id);
        setEditDriverData({
            driverName: driver.driverName,
            idnumber: driver.idnumber,
            // advancePayment: driver.advancePayment
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
            await updateDoc(driverDocRef, editDriverData as { [key: string]: any }); // Type assertion here
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
        // driver.advancePayment.toString().includes(searchQuery)
    );

    const companyDrivers = filteredDrivers.filter(driver => driver.companyName === 'Company');
    const rsaDrivers = filteredDrivers.filter(driver => driver.companyName === 'RSA');
    const otherDrivers = filteredDrivers.filter(driver => driver.companyName !== 'Company' && driver.companyName !== 'RSA');

    const renderTable = (driversList: Driver[], title: string) => {
        // Determine the header based on the title
        const header = title === 'Company Details' || title === 'Providers Details'
            ? 'Company Name'
            : 'Driver Name';

        return (
            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">{title}</h3>
                <table className="min-w-full bg-white">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="py-2 px-4">{header}</th>
                            <th className="py-2 px-4">Driver ID</th>
                            {/* <th className="py-2 px-4">Advance Payment</th> */}
                            <th className="py-2 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {driversList.map(driver => (
                            <tr key={driver.id} className="hover:bg-gray-50">
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
                                {/* <td className="border px-4 py-2">
                                    {editDriverId === driver.id ? (
                                        <input
                                            type="text"
                                            name="advancePayment"
                                            value={editDriverData.advancePayment}
                                            onChange={handleDriverInputChange}
                                            className="border rounded p-1"
                                        />
                                    ) : (
                                        driver.advancePayment
                                    )}
                                </td> */}
                                <td className="border px-4 py-2 flex gap-2 items-center">
                                    {editDriverId === driver.id ? (
                                        <button onClick={handleSaveDriverClick} className="text-green-500 hover:text-green-700">
                                            Save
                                        </button>
                                    ) : (
                                        <button onClick={() => handleEditDriverClick(driver)} className="text-green-500 hover:text-blue-700">
                                            <IconEdit className="inline-block w-5 h-5" />
                                        </button>
                                    )}

                                    <Link
                                        to={`/users/driver/driverdetails/cashcollection/${driver.id}`}
                                        className="text-blue-500 hover:text-blue-700 bg-blue-100 px-2 py-1 rounded-md shadow-md"
                                    >
                                        View Cash Collection Report
                                    </Link>

                                    <Link
                                        to={`/driverreport/salaryreport/${driver.id}`}
                                        className="text-blue-500 hover:text-blue-700 bg-blue-100 px-2 py-1 rounded-md shadow-md"
                                    >
                                        View Salary Details
                                    </Link>
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
            {renderTable(companyDrivers, 'Company Details')}
            {renderTable(rsaDrivers, 'PMNA Drivers')}
            {renderTable(otherDrivers, 'Providers Details')}
        </div>
    );
};

export default DriverReport;
