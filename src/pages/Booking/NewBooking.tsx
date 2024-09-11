import React, { useEffect, useState } from 'react';
import { DataTable } from 'mantine-datatable';
import { Link, useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';
import styles from './newbooking.module.css';
type RecordData = {
    index: number;
    customerName: string;
    fileNumber: string;
    phoneNumber: string;
    driver: string;
    totalSalary: string;
    photo: string;
    id: string;
    dateTime: string;
    status: string;
    bookingStatus: string;
    createdAt: any;
};

const NewBooking = () => {
    const [recordsData, setRecordsData] = useState<RecordData[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<RecordData[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const PAGE_SIZES = [10, 25, 'All'];
    const db = getFirestore();
    const navigate = useNavigate();
    const uid = sessionStorage.getItem('uid');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const q = query(collection(db, `user/${uid}/bookings`), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                let data: RecordData[] = querySnapshot.docs.map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                })) as RecordData[];

                console.log('Sorted data:', data);

                setRecordsData(data);
                setFilteredRecords(data);
            } catch (error) {
                console.error('Error fetching data: ', error);
            }
        };

        fetchData().catch(console.error);
    }, [db]);

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        const filtered = recordsData.filter(
            (record) =>
                (record.customerName?.toLowerCase().includes(term) ?? false) ||
                (record.fileNumber?.toLowerCase().includes(term) ?? false) ||
                (record.phoneNumber?.toLowerCase().includes(term) ?? false) ||
                (record.driver?.toLowerCase().includes(term) ?? false) ||
                (record.dateTime?.toLowerCase().includes(term) ?? false) ||
                (record.bookingStatus?.toLowerCase().includes(term) ?? false)
        );
        setFilteredRecords(filtered);
    }, [searchTerm, recordsData]);

    const handleEdit = (rowData: RecordData) => {
        console.log(rowData);
        navigate(`/bookings/booking/${rowData.id}`, { state: { editData: rowData } });
    };

    const totalPages = Math.ceil(filteredRecords.length / pageSize);

    const displayedRecords = pageSize === 'All' ? filteredRecords : filteredRecords.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div style={{fontFamily: 'Arial, sans-serif', color: '#333' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h5 style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>New Bookings</h5>

            <Link to="/bookings/booking" style={{ textDecoration: 'none' }}>
                <button
                    style={{
                        padding: '10px 20px',
                        color: '#fff',
                        backgroundColor: '#28a745',
                        border: 'none',
                        borderRadius: '7px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                        transition: 'background-color 0.3s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#218838')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#28a745')}
                >
                    Add Booking
                </button>
            </Link>
        </div>

        <div className={styles.tableContainer}>
        <table className={styles.table}>
    <thead>
        <tr>
            <th>Date & Time</th>
            <th>Name</th>
            <th>File Number</th>
            <th>Phone Number</th>
            <th>Driver</th>
            <th>View More</th>
            <th>Edit</th>
        </tr>
    </thead>
    <tbody>
        {recordsData.map((rowData) => (
            <tr
                key={rowData.id}
                style={{
                    backgroundColor: rowData.bookingStatus === "ShowRoom Booking" ? "#f8d7da" : "transparent", 
                    // Adjust color as needed
                }}
            >
                <td data-label="Date & Time">{rowData.dateTime}</td>
                <td data-label="Name">{rowData.customerName}</td>
                <td data-label="File Number">{rowData.fileNumber}</td>
                <td data-label="Phone Number">{rowData.phoneNumber}</td>
                <td data-label="Driver">{rowData.driver}</td>
                <td data-label="View More">
                    <Link
                        to={`/bookings/newbooking/viewmore/${rowData.id}`}
                        style={{
                            padding: '5px 10px',
                            color: '#fff',
                            backgroundColor: '#007bff',
                            borderRadius: '5px',
                            textDecoration: 'none',
                            display: 'inline-block',
                            transition: 'background-color 0.3s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
                    >
                        View More
                    </Link>
                </td>
                <td data-label="Edit">
                    <button
                        onClick={() => handleEdit(rowData)}
                        style={{
                            padding: '5px 10px',
                            color: '#fff',
                            backgroundColor: '#ffc107',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0a800')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffc107')}
                    >
                        Edit
                    </button>
                </td>
            </tr>
        ))}
    </tbody>
</table>

        </div>
    </div>
    );
};

export default NewBooking;
