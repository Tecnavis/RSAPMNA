import React, { useEffect, useState } from 'react';
import { DataTable } from 'mantine-datatable';
import { Link, useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, orderBy, query, where, onSnapshot } from 'firebase/firestore';
import styles from './newbooking.module.css';
import { Modal, Pagination } from '@mantine/core'; // Import Pagination from Mantine

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
    requestBool: boolean;
    requestBool1: boolean;
    currentLocation?: string;
};
const statuses = [
    'booking added',
    'called to customer',
    'Order Received',
    'On the way to pickup location',
    'Vehicle Picked',
    'Vehicle Confirmed',

    'On the way to dropoff location',
    'Vehicle Dropped',
    'Order Completed',
    'Cancelled',
];
// ---------------------------------------------------------------
const NewBooking = () => {
    const [recordsData, setRecordsData] = useState<RecordData[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<RecordData[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<RecordData | null>(null);

    const PAGE_SIZES = [10, 25, 'All'];
    const db = getFirestore();
    const navigate = useNavigate();
    const uid = sessionStorage.getItem('uid');
    const currentDate = new Date().toISOString().split('T')[0];
    const [isModalOpen, setIsModalOpen] = useState(false);
    useEffect(() => {
        // Set up real-time listener with onSnapshot
        const q = query(
            collection(db, `user/${uid}/bookings`),
            orderBy('createdAt', 'desc') // Sort by creation date
        );

        // Listen for changes to the collection
        const unsubscribe = onSnapshot(
            q,
            (querySnapshot) => {
                let data: RecordData[] = querySnapshot.docs.map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                })) as RecordData[];

                // Filter out records where the status is 'Order Completed'
                const filteredData = data.filter((record) => record.status !== 'Order Completed');

                console.log('Filtered Data:', filteredData);
                setRecordsData(filteredData);
                setFilteredRecords(data);
            },
            (error) => {
                console.error('Error fetching data: ', error);
            }
        );

        // Clean up the listener when the component is unmounted
        return () => unsubscribe();
    }, [uid]);

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
    // -----------------------------------------
    const handleTrackDetails = (rowData: RecordData) => {
        setSelectedRecord(rowData); // Store the selected record data
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRecord(null);
    };

    // Helper function to get button styles
    const getStatusButtonStyle = (status: any, selectedStatus: any) => {
        if (status === selectedStatus) {
            return { backgroundColor: 'green', color: '#fff' };
        } else if (statuses.indexOf(status) < statuses.indexOf(selectedStatus)) {
            return { backgroundColor: 'lightgreen', color: '#333', cursor: 'not-allowed' };
        } else {
            return { backgroundColor: '#d9d9d9', color: '#333' };
        }
    };
    const handleStatusClick = (bookingId: string) => {
        navigate(`/bookings/newbooking/track/${bookingId}`);
    };
    const handlePickChange = (rowData: RecordData): void => {
    // Process rowData
    console.log(rowData);
};
const handleDropChange = (rowData: RecordData): void => {
    // Process rowData
    console.log(rowData);
};    return (
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
            {/* Color Legend Section */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
                    <span
                        style={{
                            width: '20px', // Increased size
                            height: '20px', // Increased size
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            display: 'inline-block',
                            marginRight: '8px',
                            border: '2px solid #d6d6d6', // Solid border
                        }}
                    ></span>
                    <span>Booking (Today)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
                    <span
                        style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: '#e0f7fa',
                            borderRadius: '50%',
                            display: 'inline-block',
                            marginRight: '8px',
                            border: '2px solid #a3a3a3',
                        }}
                    ></span>
                    <span>ShowRoom Booking (Today)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
                    <span
                        style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: '#ffffe0',
                            borderRadius: '50%',
                            display: 'inline-block',
                            marginRight: '8px',
                            border: '2px solid #d6d6d6',
                        }}
                    ></span>
                    <span>ShowRoom Booking (Past Date)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span
                        style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: '#f8d7da',
                            borderRadius: '50%',
                            display: 'inline-block',
                            marginRight: '8px',
                            border: '2px solid #c3c3c3',
                        }}
                    ></span>
                    <span>Other Bookings (Past Date)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span
                        style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: '#f1807e',
                            borderRadius: '50%',
                            display: 'inline-block',
                            marginRight: '8px',
                            border: '2px solid #c3c3c3',
                        }}
                    ></span>
                    <span>Rejected Bookings</span>
                </div>
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
                            <th>#</th>
                            <th>Date & Time</th>
                            <th>Name</th>
                            <th>File Number</th>
                            <th>Phone Number</th>
                            <th>Driver</th>
                            <th>View More</th>
                            <th>Edit</th>
                            <th>Tracking</th>
                            {displayedRecords.some(row => row.requestBool || row.requestBool1) && (
            <th colSpan={3}>Change Location</th>
        )}



                        </tr>
                    </thead>
                    <tbody>
                        {displayedRecords.map((rowData, index) => {
                            // Convert dateTime (e.g., "24/09/2024, 02:21:48 pm") to YYYY-MM-DD format
                            const dateTimeFormatted = rowData.dateTime
                                ? rowData.dateTime.split(',')[0].split('/').reverse().join('-') // Converts to "2024-09-24"
                                : '';

                            let rowBackgroundColor = '#ffffff'; // Default background color

                            // Check conditions for setting the row color
                            if (rowData.status === 'Rejected') {
                                rowBackgroundColor = '#f1807e'; // Light red color for 'Rejected' status
                            } else if (rowData.bookingStatus === 'ShowRoom Booking' && dateTimeFormatted !== currentDate) {
                                rowBackgroundColor = '#ffffe0'; // Yellow color if condition matches
                            } else if (rowData.bookingStatus === 'ShowRoom Booking') {
                                rowBackgroundColor = '#e0f7fa'; // Light blue color for "ShowRoom Booking"
                            } else if (dateTimeFormatted !== currentDate) {
                                rowBackgroundColor = '#f8d7da'; // Light red color for other date mismatch cases
                            }

                            return (
                                <tr
                                    key={rowData.id}
                                    style={{
                                        backgroundColor: rowBackgroundColor,
                                    }}
                                >
                                    <td data-label="#"> {index + 1} </td>
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
                                    <td data-label="Tracking">
                                        <button
                                            onClick={() => handleTrackDetails(rowData)}
                                            style={{
                                                padding: '5px 10px',
                                                color: '#fff',
                                                backgroundColor: '#28a745',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Track Details
                                        </button>
                                    </td>
                                    {rowData.requestBool == true && (
                                        <td data-label="Change Pickup Location">
                                            <button
                                                onClick={() => handlePickChange(rowData)}
                                                style={{
                                                    padding: '5px 10px',
                                                    color: '#fff',
                                                    backgroundColor: '#dc3545', // changed background for distinction
                                                    borderRadius: '5px',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.3s',
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
                                            >
                                                Pickup Change Request
                                            </button>
                                        </td>
                                    )}
                                    {rowData.requestBool1 == true && (
                                        <td data-label="Change Dropoff Location">
                                            <button
                                                onClick={() => handleDropChange(rowData)}
                                                style={{
                                                    padding: '5px 10px',
                                                    color: '#fff',
                                                    backgroundColor: '#dc3545', // changed background for distinction
                                                    borderRadius: '5px',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.3s',
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#c82333')}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
                                            >
                                                Dropoff Change Request
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>

                    <Modal opened={isModalOpen} onClose={closeModal} title="Track Details">
                        {selectedRecord ? (
                            <div>
                                <p>
                                    <strong>Booking Status:</strong> {selectedRecord.status}
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
                                    {statuses.map((status) => (
                                        <button
                                            key={status}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '5px',
                                                border: 'none',
                                                ...getStatusButtonStyle(status, selectedRecord.status),
                                            }}
                                            disabled={statuses.indexOf(status) < statuses.indexOf(selectedRecord.status)}
                                            onClick={() => handleStatusClick(selectedRecord.id)} // Call the handler on click
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p>No record selected.</p>
                        )}
                    </Modal>
                </table>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Pagination
                    total={totalPages}
                    page={page}
                    onChange={setPage}
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
                    {PAGE_SIZES.map((size) => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default NewBooking;
