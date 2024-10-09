import React, { useEffect, useState } from 'react';
import { DataTable } from 'mantine-datatable';
import { Link, useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';
import styles from './newbooking.module.css';
import { Pagination } from '@mantine/core'; // Import Pagination from Mantine

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

                setRecordsData(data);
                setFilteredRecords(data);
            } catch (error) {
                console.error('Error fetching data: ', error);
            }
        };

        fetchData().catch(console.error);
    }, [db, uid]);

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
        setPage(1); // Reset to first page when search term changes
    }, [searchTerm, recordsData]);

    const handleEdit = (rowData: RecordData) => {
        navigate(`/bookings/booking/${rowData.id}`, { state: { editData: rowData } });
    };

    const totalPages = Math.ceil(filteredRecords.length / pageSize);
    const displayedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
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

            <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                    width: '100%',
                    boxSizing: 'border-box',
                    marginBottom: '10px',
                }}
            />

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
                        {displayedRecords.map((rowData) => (
                            <tr
                                key={rowData.id}
                                style={{
                                    backgroundColor: rowData.bookingStatus === "ShowRoom Booking" ? "#f8d7da" : "transparent",
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

<div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Pagination
        total={totalPages}
        page={page}
        onChange={setPage}
        // Remove styles prop or adjust it according to Mantine's documentation
        styles={{ item: { margin: '0 5px' } }} // Update to valid styles based on the Pagination component's expected structure
    />
    <select
        value={pageSize}
        onChange={(e) => {
            const value = e.target.value;
            setPageSize(value === 'All' ? filteredRecords.length : parseInt(value, 10));
            setPage(1); // Reset to the first page when page size changes
        }}
        style={{
            padding: '5px',
            borderRadius: '5px',
            border: '1px solid #ccc',
        }}
    >
        {PAGE_SIZES.map(size => (
            <option key={size} value={size}>{size}</option>
        ))}
    </select>
</div>

        </div>
    );
};

export default NewBooking;
