import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc, DocumentData } from 'firebase/firestore';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';

// Define types for the driver data
interface Driver {
    driverName: string;
    idnumber: string;
    company: string;
    phone: string;
    personalphone: string;
    password: string;
    advancePayment: number;
    selectedServices: string[];
    basicSalaries?: { [key: string]: number };
    basicSalaryKm?: { [key: string]: number };
    salaryPerKm?: { [key: string]: number };
    serviceVehicle?: { [key: string]: string };
}
interface IconArrowLeftProps {
    style?: React.CSSProperties; // Add style prop here
}
const CompanyDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>(); // Type the useParams hook
    const [driver, setDriver] = useState<Driver | null>(null); // Type state
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid') || '';

    useEffect(() => {
        const fetchDriver = async () => {
            try {
                if (!id) return; // Check if id is available
                const docRef = doc(db, `user/${uid}/driver`, id); // Construct reference to the document with the provided ID
                const docSnap = await getDoc(docRef); // Fetch the document snapshot

                if (docSnap.exists()) {
                    const data = docSnap.data() as Driver; // Cast the data to Driver type
                    setDriver(data); // Update the state with the fetched data
                } else {
                    console.log(`Document with ID ${id} does not exist!`);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchDriver().catch(console.error);
    }, [db, id, uid]); // Include dependencies in the dependency array

    if (!driver) {
        return <div>Loading...</div>;
    }

    return (
        <div className="grid xl:grid-cols-1 gap-6 grid-cols-1">
            <div className='panel'>
                <h1 style={{ textAlign: 'center', fontSize: 'x-large' }}><b>{driver.driverName}</b></h1>
            </div>
            <table className='panel p-4' style={{ borderCollapse: 'collapse', width: '100%', maxWidth: '600px', margin: 'auto' }}>
                <tbody>
                    <tr>
                        <td style={{ fontWeight: 'bold', paddingRight: '10px' }}>Driver Name:</td>
                        <td>{driver.driverName}</td>
                    </tr>
                    <tr>
                        <td style={{ fontWeight: 'bold', paddingRight: '10px' }}>ID Number:</td>
                        <td>{driver.idnumber}</td>
                    </tr>
                    <tr>
                        <td style={{ fontWeight: 'bold', paddingRight: '10px' }}>Company Name:</td>
                        <td>{driver.company}</td>
                    </tr>
                    <tr>
                        <td style={{ fontWeight: 'bold', paddingRight: '10px' }}>Phone Number:</td>
                        <td>{driver.phone}</td>
                    </tr>
                    <tr>
                        <td style={{ fontWeight: 'bold', paddingRight: '10px' }}>Personal Phone Number:</td>
                        <td>{driver.personalphone}</td>
                    </tr>
                    <tr>
                        <td style={{ fontWeight: 'bold', paddingRight: '10px' }}>Password:</td>
                        <td>{driver.password}</td>
                    </tr>
                    <tr>
                        <td style={{ fontWeight: 'bold', paddingRight: '10px' }}>Credit Limit Amount:</td>
                        <td>{driver.advancePayment}</td>
                    </tr>
                </tbody>
            </table>
            <h2 style={{ textAlign: 'center', margin: '20px 0' }}>
    <Link
        to={`/users/driver/driverdetails/cashcollection/${id}`}
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: '#007bff',
            fontWeight: 'bold',
            fontSize: '1.5em',
            transition: 'color 0.3s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#0056b3')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#007bff')}
    >
        Click here for more details
        <span style={{ marginLeft: '8px' }}>
            <IconArrowLeft />
        </span>
    </Link>
</h2>


            {driver.selectedServices && (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", borderSpacing: "0" }}>
                        <thead>
                            <tr>
                                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left", backgroundColor: "#f2f2f2", fontWeight: "bold" }}>Service Type</th>
                                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left", backgroundColor: "#f2f2f2", fontWeight: "bold" }}>Basic Salary</th>
                                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left", backgroundColor: "#f2f2f2", fontWeight: "bold" }}>KM for Basic Salary</th>
                                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left", backgroundColor: "#f2f2f2", fontWeight: "bold" }}>SalaryPerKm</th>
                                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left", backgroundColor: "#f2f2f2", fontWeight: "bold" }}>Vehicle Number</th>
                            </tr>
                        </thead>
                        <tbody>
                            {driver.selectedServices.map((service, index) => (
                                <tr key={index}>
                                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>{service}</td>
                                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>{driver.basicSalaries?.[service]}</td>
                                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>{driver.basicSalaryKm?.[service]} KM</td>
                                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>{driver.salaryPerKm?.[service]} /km</td>
                                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>{driver.serviceVehicle?.[service]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default CompanyDetails;
