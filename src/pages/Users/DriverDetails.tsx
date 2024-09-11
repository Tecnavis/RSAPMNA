import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import IconArrowForward from '../../components/Icon/IconArrowForward';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';

type Driver = {
    driverName: string;
    idnumber: string;
    phone: string;
    personalphone: string;
    password: string;
    selectedServices: string[];
    basicSalaries: Record<string, number>;
    basicSalaryKm: Record<string, number>;
    salaryPerKm: Record<string, number>;
    serviceVehicle: Record<string, string>;
};

const DriverDetails = () => {
    const { id } = useParams();
    const [driver, setDriver] = useState<Driver | null>(null);
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid');

    useEffect(() => {
        const fetchDriver = async () => {
            if (uid && id) { // Ensure uid and id are defined
                try {
                    const docRef = doc(db, `user/${uid}/driver`, id);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data() as Driver;
                        setDriver(data);
                    } else {
                        console.log(`Document with ID ${id} does not exist!`);
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            } else {
                console.error('UID or ID is undefined.');
            }
        };

        fetchDriver().catch(console.error);
    }, [db, id, uid]);

    if (!driver) {
        return <div>Loading...</div>;
    }

    return (
        <div className="grid xl:grid-cols-1 gap-6 grid-cols-1">
            <div className='panel'>
                <h2 style={{ textAlign: 'center' }}>{driver.driverName}</h2>
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
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = '#0056b3')}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = '#007bff')}
                >
                    Click here for more details
                    <span style={{ marginLeft: '8px' }}>
                        <IconArrowLeft />
                    </span>
                </Link>
            </h2>
            {driver && (
                <table style={{ width: "100%", borderCollapse: "collapse", borderSpacing: "0" }}>
                    <thead>
                        <tr>
                            <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left", backgroundColor: "#f2f2f2", fontWeight: "bold" }}>Service Type</th>
                            <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left", backgroundColor: "#f2f2f2", fontWeight: "bold" }}>Basic Amount</th>
                            <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left", backgroundColor: "#f2f2f2", fontWeight: "bold" }}>KM for Basic Salary</th>
                            <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left", backgroundColor: "#f2f2f2", fontWeight: "bold" }}>Salary Per Km</th>
                            <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Vehicle Number</th>
                        </tr>
                    </thead>
                    <tbody>
                        {driver.selectedServices.map((service, index) => (
                            <tr key={index}>
                                <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>{service}</td>
                                <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>{driver.basicSalaries[service]}</td>
                                <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>{driver.basicSalaryKm[service]} KM</td>
                                <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>{driver.salaryPerKm[service]} /km</td>
                                <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>{driver.serviceVehicle[service]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default DriverDetails;
