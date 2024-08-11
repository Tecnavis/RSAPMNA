import React, { useEffect, useState } from 'react';
import { DataTable } from 'mantine-datatable';
import { Link, useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
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
        const filtered = recordsData.filter(record =>
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
        console.log(rowData)
        navigate(`/bookings/booking/${rowData.id}`, { state: { editData: rowData } });
    };

    const totalPages = Math.ceil(filteredRecords.length / pageSize);

    const displayedRecords = pageSize === 'All' ? filteredRecords : filteredRecords.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', color: '#333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h5 style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>
                    New Bookings
                </h5>

                <Link to="/bookings/booking" style={{ textDecoration: 'none' }}>
                    <button style={{
                        padding: '10px 20px',
                        color: '#fff',
                        backgroundColor: '#28a745',
                        border: 'none',
                        borderRadius: '7px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                        transition: 'background-color 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#28a745'}>
                        Add Booking
                    </button>
                </Link>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    style={{
                        padding: '10px',
                        borderRadius: '5px',
                        border: '1px solid #ccc',
                        width: '300px',
                        marginRight: '10px',
                        fontSize: '16px'
                    }}
                />
                <button
                    onClick={() => setSearchTerm(searchTerm)}
                    style={{
                        padding: '10px 20px',
                        color: '#fff',
                        backgroundColor: '#007bff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                        transition: 'background-color 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}>
                    Search
                </button>
            </div>

            <div style={{
                padding: '20px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                borderRadius: '10px',
                backgroundColor: '#fff',
                overflowX: 'auto'
            }}>
                <div>
                    <DataTable
                        noRecordsText="No results match your search query"
                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        records={displayedRecords}
                        columns={[
                            { accessor: 'dateTime', title: 'Date & Time' },
                            // { accessor: 'bookingId', title: 'Booking ID' },
                            { accessor: 'customerName', title: 'Name' },
                            { accessor: 'fileNumber', title: 'File Number' },
                            { accessor: 'phoneNumber', title: 'Phone Number' },
                            { accessor: 'driver', title: 'Driver' },
                            {
                                accessor: 'viewmore',
                                title: 'View More',
                                render: (rowData) => (
                                    <Link
                                        to={`/bookings/newbooking/viewmore/${rowData.id}`}
                                        style={{
                                            padding: '5px 10px',
                                            color: '#fff',
                                            backgroundColor: '#007bff',
                                            borderRadius: '5px',
                                            textDecoration: 'none',
                                            display: 'inline-block',
                                            transition: 'background-color 0.3s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}>
                                        View More
                                    </Link>
                                ),
                            },
                            {
                                accessor: 'edit',
                                title: 'Edit',
                                render: (rowData) => (
                                    <button
                                        onClick={() => handleEdit(rowData)}
                                        style={{
                                            padding: '5px 10px',
                                            color: '#fff',
                                            backgroundColor: '#ffc107',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.3s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0a800'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffc107'}>
                                        Edit
                                    </button>
                                ),
                            },
                        ]}
                        totalRecords={filteredRecords.length}
                        recordsPerPage={pageSize === 'All' ? filteredRecords.length : pageSize}
                        page={page}
                        onPageChange={(p) => setPage(p)}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={(size) => {
                            setPageSize(size === 'All' ? filteredRecords.length : size);
                            setPage(1); // reset to first page when page size changes
                        }}
                        minHeight={200}
                        rowStyle={(record) =>
                            record.bookingStatus === 'ShowRoom Booking' ? { backgroundColor: '#ffeeba' } : {}
                        }
                        paginationText={({ from, to, totalRecords }) =>
                            `Showing ${from} to ${to} of ${totalRecords} entries`
                        }
                    />
                </div>
            </div>
        </div>
    );
};

export default NewBooking;
