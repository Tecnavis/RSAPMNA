import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import IconArrowForward from '../../components/Icon/IconArrowForward';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';

const DriverDetails = () => {
    const { id } = useParams();
    const [driver, setDriver] = useState(null);
    const db = getFirestore();
console.log("driver",driver)
    useEffect(() => {
        const fetchDriver = async () => {
            try {
                const docRef = doc(db, 'driver', id); // Construct reference to the document with the provided ID
                const docSnap = await getDoc(docRef); // Fetch the document snapshot

                if (docSnap.exists()) {
                    const data = docSnap.data(); // Extract the data from the document snapshot
                    setDriver(data); // Update the state with the fetched data
                } else {
                    console.log(`Document with ID ${id} does not exist!`);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchDriver().catch(console.error);
    }, [db, id]); // Include dependencies in the dependency array

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
                        <td  style={{ fontWeight: 'bold', paddingRight: '10px' }}>Driver Name:</td>
                        <td>{driver.driverName}</td>
                    </tr>
                    <tr>
                        <td style={{ fontWeight: 'bold', paddingRight: '10px' }}>ID Number:</td>
                        <td>{driver.idnumber}</td>
                    </tr>
                    {/* <tr>
                        <td style={{ fontWeight: 'bold', paddingRight: '10px' }}>Company Name:</td>
                        <td>{driver.companyName}</td>
                    </tr> */}
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
                    {/* <tr>
                        <td style={{ fontWeight: 'bold', paddingRight: '10px' }}>Advance Payment/Credit Limit Amount:</td>
                        <td>{driver.advancePayment}</td>
                    </tr> */}
        
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
                    onMouseEnter={(e) => (e.target.style.color = '#0056b3')}
                    onMouseLeave={(e) => (e.target.style.color = '#007bff')}
                >
                    Click here for more details
                    <IconArrowLeft style={{ marginLeft: '8px' }} />
                </Link>
            </h2>
                               {driver && (
    <table style={{ width: "100%", borderCollapse: "collapse", borderSpacing: "0" }}>
        <thead>
            <tr>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left", backgroundColor: "#f2f2f2", fontWeight: "bold" }}>Service Type</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left", backgroundColor: "#f2f2f2", fontWeight: "bold" }}>Basic Amount</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left", backgroundColor: "#f2f2f2", fontWeight: "bold" }}>KM for Basic Salary</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left", backgroundColor: "#f2f2f2", fontWeight: "bold" }}>SalaryPerKm</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left", backgroundColor: "#f2f2f2", fontWeight: "bold" }}>Vehicle Number</th>

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
