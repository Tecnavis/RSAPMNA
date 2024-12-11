import { Link, NavLink } from 'react-router-dom';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useState, useEffect } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconTrashLines from '../../../components/Icon/IconTrashLines';
import IconPlus from '../../../components/Icon/IconPlus';
import IconEdit from '../../../components/Icon/IconEdit';
import IconEye from '../../../components/Icon/IconEye';
import { collection, getDocs, getFirestore, query, updateDoc, doc, where, orderBy, DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';
import dayjs from 'dayjs';

const generateInvoiceId = (): string => {
    const timestamp = Date.now().toString();
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `INV-${timestamp}-${randomStr}`;
};

interface Booking {
    id: string;
    customerName?: string;
    email?: string;
    dateTime?: string;
    updatedTotalSalary?: number;
    paymentStatus?: string;
    selectedDriver?: string;
    invoice?: string;
    driverName?: string;
    driverImg?: string;
    createdAt?: Timestamp;
    fileNumber:string;
}

interface Driver {
    driverName?: string;
    profileImageUrl?: string;
}
interface ExtendedBooking extends Booking {
    bookingId: string;
}
const SalesSummary = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Invoice List'));
    }, [dispatch]);

    const [items, setItems] = useState<Booking[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [initialRecords, setInitialRecords] = useState<Booking[]>([]);
    const [records, setRecords] = useState<Booking[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<Booking[]>([]);
    const [search, setSearch] = useState<string>('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'customerName',
        direction: 'asc',
    });
    const [historyRange, setHistoryRange] = useState<string>('10');
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid') || '';
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords(initialRecords.slice(from, to));
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        const fetchBookingsAndDrivers = async () => {
            try {
                const bookingsQuery = query(
                    collection(db, `user/${uid}/bookings`),
                    where('status', '==', 'Order Completed')
                );
                const driversQuery = query(collection(db, `user/${uid}/driver`));
    
                const [bookingsSnapshot, driversSnapshot] = await Promise.all([
                    getDocs(bookingsQuery),
                    getDocs(driversQuery)
                ]);
    
                const driversData: Record<string, Driver> = {};
                driversSnapshot.forEach((doc) => {
                    driversData[doc.id] = doc.data() as Driver;
                });
    
                const bookingsData: ExtendedBooking[] = [];
                for (const docSnapshot of bookingsSnapshot.docs) {
                    const booking = docSnapshot.data() as Booking;
                
                    if (!booking.invoice) {
                        const invoiceId = generateInvoiceId();
                        booking.invoice = invoiceId;
                        await updateDoc(doc(db, `user/${uid}/bookings`, docSnapshot.id), { invoice: invoiceId });
                    }
    
                    const driverId = booking.selectedDriver;
                    const driver = driversData[driverId || ''];
                    if (driver) {
                        booking.driverName = driver.driverName;
                        booking.driverImg = driver.profileImageUrl;
                    }
    
                    // Add bookingId to each booking item
                    bookingsData.push({ bookingId: docSnapshot.id, ...booking });
                }
    
                // Filter bookings based on the search query (as in `filteredBookings`)
                const filteredBookings = bookingsData.filter((booking) =>
                    Object.values(booking).some((value) =>
                        value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
                    )
                );
    
                const sortedBookings = [...filteredBookings].sort((a, b) => {
                    const aCreatedAt = a.createdAt ? a.createdAt.toDate().getTime() : 0;
                    const bCreatedAt = b.createdAt ? b.createdAt.toDate().getTime() : 0;
                    
                    return bCreatedAt - aCreatedAt;
                  });
                  
    
                setItems(sortedBookings);
                setInitialRecords(sortedBookings);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching bookings or drivers:', error);
                setLoading(false);
            }
        };
    
        fetchBookingsAndDrivers();
    }, [db, uid, searchQuery]);  // Added searchQuery as a dependency
    
    

    useEffect(() => {
        const filterRecordsByDate = (records: Booking[]) => {
            const currentDate = dayjs();
            let filteredRecords = records;

            if (historyRange) {
                let dateRange = currentDate.subtract(parseInt(historyRange), 'day');
                if (historyRange === '30') {
                    dateRange = currentDate.subtract(1, 'month');
                } else if (historyRange === '90') {
                    dateRange = currentDate.subtract(3, 'months');
                }
                filteredRecords = records.filter((item) => dayjs(item.dateTime).isAfter(dateRange));
            }

            return filteredRecords;
        };

        const filteredRecords = filterRecordsByDate(items);
        setInitialRecords(filteredRecords);

        const total = filteredRecords.reduce((acc, record) => acc + (record.updatedTotalSalary || 0), 0);
        setTotalAmount(total);
    }, [historyRange, items]);

    useEffect(() => {
        const filteredRecords = initialRecords.filter((item) => {
            return (
                item.invoice?.toLowerCase().includes(search.toLowerCase()) ||
                item.customerName?.toLowerCase().includes(search.toLowerCase()) ||
                item.email?.toLowerCase().includes(search.toLowerCase()) ||
                item.dateTime?.toLowerCase().includes(search.toLowerCase()) ||
                item.updatedTotalSalary?.toString().toLowerCase().includes(search.toLowerCase()) ||
                item.paymentStatus?.toLowerCase().includes(search.toLowerCase())
            );
        });
        setInitialRecords(filteredRecords);
    }, [search, initialRecords]);

    useEffect(() => {
        const sortedRecords = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? sortedRecords.reverse() : sortedRecords);
        setPage(1);
    }, [sortStatus, initialRecords]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords(initialRecords.slice(from, to));
    }, [page, pageSize, initialRecords]);

    const deleteRow = (id: string) => {
        if (window.confirm('Are you sure want to delete selected row?')) {
            const updatedRecords = items.filter((item) => item.id !== id);
            setItems(updatedRecords);
            setInitialRecords(updatedRecords);
            setRecords(updatedRecords.slice((page - 1) * pageSize, page * pageSize));
            setSelectedRecords([]);
        }
    };
   
    return (
        <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
            <div className="invoice-table">
                <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                    <div className="flex gap-2 items-center">
                        <label htmlFor="historyRange" className="text-gray-700 dark:text-gray-300">
                            History:
                        </label>
                        <select id="historyRange" className="form-select w-auto" value={historyRange} onChange={(e) => setHistoryRange(e.target.value)}>
                            <option value="10">Last 10 Days</option>
                            <option value="30">Last 1 Month</option>
                            <option value="90">Last 3 Months</option>
                        </select>
                    </div>
                    <div className="ltr:ml-auto rtl:mr-auto">
                        <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                <div className="datatables pagination-padding">
                    <DataTable
                        className="whitespace-nowrap table-hover invoice-table"
                        records={records}
                        columns={[
                            {
                                accessor: 'invoice',
                                sortable: true,
                                render: ({ invoice, id }) => (
                                  <NavLink
  to={{
    pathname: `/general/sales/preview/${id}`, // Use the correct ID dynamically
  }}
>
  <div className="text-primary underline hover:no-underline font-semibold">{`#${invoice}`}</div>
</NavLink>

                                ),
                            },
                            {
                                accessor: 'File Number',
                                sortable: true,
                                render: ({ fileNumber }) => <div>{fileNumber}</div>,
                            },
                            {
                                accessor: 'driver',
                                sortable: true,
                                render: ({ driverName, driverImg }) => (
                                    <div className="flex items-center font-semibold">
                                        <div className="p-0.5 bg-white-dark/30 rounded-full w-max ltr:mr-2 rtl:ml-2">
                                            <img className="h-8 w-8 rounded-full object-cover" src={driverImg} alt={driverName} />
                                        </div>
                                        <div>{driverName}</div>
                                    </div>
                                ),
                            },
                            {
                                accessor: 'customerName',
                                sortable: true,
                                render: ({ customerName }) => <div>{customerName}</div>,
                            },
                            {
                                accessor: 'dateTime',
                                sortable: true,
                            },
                            {
                                accessor: 'payable amount',
                                sortable: true,
                                titleClassName: 'text-right',
                                render: ({ updatedTotalSalary }) => <div className="text-right font-semibold">{`${updatedTotalSalary}`}</div>,
                            },

                            {
                                accessor: 'status',
                                sortable: true,
                                render: ({ paymentStatus }) => <span className={`badge badge-outline-${paymentStatus === 'Paid' ? 'success' : 'warning'}`}>{paymentStatus}</span>,
                            },
                            {
                                accessor: 'action',
                                title: 'Actions',
                                render: (item) => (
                                    <div className="flex gap-4 items-center">
                                        <NavLink to={`/general/sales/preview/${item.id}`} className="btn btn-sm btn-outline-primary">
                                            <IconEye  className='text-primary'/>
                                        </NavLink>
                                        <NavLink to={`/general/sales/preview/edit/${item.id}`} className="btn btn-sm btn-outline-success">
                                            <IconEdit className='text-success'/>
                                        </NavLink>
                                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteRow(item.id)}>
                                            <IconTrashLines className='text-danger'/>
                                        </button>
                                    </div>
                                ),
                            },
                        ]}
                        totalRecords={initialRecords.length}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={(p) => setPage(p)}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        sortStatus={sortStatus}
                        onSortStatusChange={setSortStatus}
                        selectedRecords={selectedRecords}
                        onSelectedRecordsChange={setSelectedRecords}
                    />
                </div>

                <div className="mb-4.5 px-5 mt-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        Total Amount: <span className="text-primary">{typeof totalAmount === 'number' ? totalAmount.toFixed(2) : '0.00'}</span>
                    </h2>
                </div>
            </div>
        </div>
    );
};

export default SalesSummary;
