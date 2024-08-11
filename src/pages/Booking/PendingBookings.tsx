import React, { useEffect, useState } from 'react';
import { DataTable } from 'mantine-datatable';
import { Link } from 'react-router-dom';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

type RecordData = {
    index: number;
    customerName: string;
    fileNumber: string;
    phoneNumber: string;
    serviceType: string;
    vehicleNumber: string;
    vehicleModel: string;
    comments: string;
    id: string; 
    status: string; 
    bookingStatus:string;
    dateTime: string;
};

const PendingBookings = () => {
    const [recordsData, setRecordsData] = useState<RecordData[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<RecordData[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const PAGE_SIZES = [10, 25, 'All'];
    const db = getFirestore();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const statusConditions = ['booking added','Contacted Customer', 'Vehicle Picked', 'Vehicle Confirmed', 'To DropOff Location', 'Vehicle dropoff'];
                const q = query(collection(db, 'bookings'), where('status', 'in', statusConditions));
                const querySnapshot = await getDocs(q);
                const dataWithIndex = querySnapshot.docs
                    .map((doc) => ({
                        ...doc.data(),
                        id: doc.id,
                    }))
                    .filter((record) => record.status !== 'Order Completed'); // Filter out 'Order Completed'
                
                setRecordsData(dataWithIndex);
                setFilteredRecords(dataWithIndex); // Set filtered records to initial data
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
            (record.serviceType?.toLowerCase().includes(term) ?? false) ||
            (record.vehicleNumber?.toLowerCase().includes(term) ?? false) ||
            (record.vehicleModel?.toLowerCase().includes(term) ?? false) ||
            (record.comments?.toLowerCase().includes(term) ?? false) ||
            (record.status?.toLowerCase().includes(term) ?? false) ||
            (record.bookingStatus?.toLowerCase().includes(term) ?? false) ||
            (record.dateTime?.toLowerCase().includes(term) ?? false)
        );
        setFilteredRecords(filtered);
    }, [searchTerm, recordsData]);
    const totalPages = Math.ceil(filteredRecords.length / pageSize);

    const displayedRecords = pageSize === 'All' ? filteredRecords : filteredRecords.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', color: '#333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h5 style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>
                    Pending Bookings
                </h5>
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
            </div>

            <div style={{
                padding: '20px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                borderRadius: '10px',
                backgroundColor: '#fff',
                overflowX: 'auto'
            }}>
                <div className="datatables">
                    <DataTable
                        noRecordsText="No results match your search query"
                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        records={displayedRecords}
                        columns={[
                            { accessor: 'dateTime', title: 'Booking Date & Time' },
                            { accessor: 'fileNumber', title: 'File Number' },
                            { accessor: 'customerName', title: 'Customer Name' },
                            { accessor: 'phoneNumber', title: 'Phone Number' },
                            {
                                accessor: 'viewMore',
                                title: 'View More',
                                render: (rowData: RecordData) => (
                                    <Link to={`/bookings/newbooking/viewmore/${rowData.id}`}>
                                        <button
                                            style={{
                                                backgroundColor: '#ffc107',
                                                color: '#212529',
                                                border: 'none',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.3s',
                                                animation: 'pulse 1.5s infinite',
                                            }}
                                        >
                                            Pending
                                        </button>
                                    </Link>
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

export default PendingBookings;
