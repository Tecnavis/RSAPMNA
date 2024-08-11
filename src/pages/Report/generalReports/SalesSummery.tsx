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
import { collection, getDocs, getFirestore, query, updateDoc, doc, where, orderBy } from 'firebase/firestore';
import dayjs from 'dayjs';

const generateInvoiceId = () => {
    const timestamp = Date.now().toString(); // Current timestamp
    const randomStr = Math.random().toString(36).substring(2, 8); // Random string
    return `INV-${timestamp}-${randomStr}`;
};

const SalesSummary = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Invoice List'));
    }, [dispatch]);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const PAGE_SIZES = [10, 20, 30, 50, 100]; // Define page sizes here
    const [initialRecords, setInitialRecords] = useState([]);
    const [records, setRecords] = useState([]);
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'customerName',
        direction: 'asc',
    });
    const [historyRange, setHistoryRange] = useState('10'); // State for history range filter
    const [totalAmount, setTotalAmount] = useState(0); // State for total amount
    const db = getFirestore();

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        const fetchBookingsAndDrivers = async () => {
            try {
                const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
                const driversQuery = query(collection(db, 'driver'));

                const [bookingsSnapshot, driversSnapshot] = await Promise.all([
                    getDocs(bookingsQuery),
                    getDocs(driversQuery)
                ]);

                const driversData = {};
                driversSnapshot.forEach((doc) => {
                    driversData[doc.id] = doc.data();
                });

                const bookingsData = [];
                for (const docSnapshot of bookingsSnapshot.docs) {
                    const booking = docSnapshot.data();

                    if (!booking.invoice) {
                        const invoiceId = generateInvoiceId();
                        booking.invoice = invoiceId;
                        // Update the Firestore document with the new invoice ID
                        await updateDoc(doc(db, 'bookings', docSnapshot.id), { invoice: invoiceId });
                    }
                    // Add driver information
                    const driverId = booking.selectedDriver;
                    const driver = driversData[driverId];
                    if (driver) {
                        booking.driverName = driver.driverName;
                        booking.driverImg = driver.profileImageUrl; // Assuming there's an 'img' field in the driver data
                    }
                    bookingsData.push({ id: docSnapshot.id, ...booking });
                }

                // Sort bookingsData by createdAt in descending order
                const sortedBookingsData = sortBy(bookingsData, (booking) => -dayjs(booking.dateTime).valueOf());

                setItems(sortedBookingsData);
                setInitialRecords(sortedBookingsData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching bookings or drivers:', error);
                setLoading(false);
            }
        };

        fetchBookingsAndDrivers();
    }, [db]);

    useEffect(() => {
        const filterRecordsByDate = (records) => {
            const currentDate = dayjs();
            let filteredRecords = records;

            if (historyRange) {
                let dateRange = currentDate.subtract(parseInt(historyRange), 'day');
                if (historyRange === '30') {
                    dateRange = currentDate.subtract(1, 'month');
                } else if (historyRange === '90') {
                    dateRange = currentDate.subtract(3, 'months');
                }
                filteredRecords = records.filter((item) =>
                    dayjs(item.dateTime).isAfter(dateRange)
                );
            }

            return filteredRecords;
        };

        const filteredRecords = filterRecordsByDate(items);
        setInitialRecords(filteredRecords);

        // Calculate total amount
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
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    const deleteRow = (id) => {
        if (window.confirm('Are you sure want to delete selected row ?')) {
            const updatedRecords = items.filter(item => item.id !== id);
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
                        <select
                            id="historyRange"
                            className="form-select w-auto"
                            value={historyRange}
                            onChange={(e) => setHistoryRange(e.target.value)}
                        >
                            <option value="10">Last 10 Days</option>
                            <option value="30">Last 1 Month</option>
                            <option value="90">Last 3 Months</option>
                        </select>
                    </div>
                    <div className="ltr:ml-auto rtl:mr-auto">
                        <input 
                            type="text" 
                            className="form-input w-auto" 
                            placeholder="Search..." 
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)} 
                        />
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
                                            pathname: `/general/sales/preview/${id}`, // Ensure `${id}` is correctly interpolated
                                        }}
                                    >
                                        <div className="text-primary underline hover:no-underline font-semibold">{`#${invoice}`}</div>
                                    </NavLink>
                                ),
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
                                render: ({ customerName }) => <div>{customerName}</div>
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
                                            <IconEye />
                                        </NavLink>
                                        <NavLink to={`/general/sales/preview/edit/${item.id}`} className="btn btn-sm btn-outline-success">
                                            <IconEdit />
                                        </NavLink>
                                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteRow(item.id)}>
                                            <IconTrashLines />
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
                        loading={loading}
                    />
                </div>

                <div className="mb-4.5 px-5 mt-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
    Total Amount: <span className="text-primary">{(typeof totalAmount === 'number' ? totalAmount.toFixed(2) : '0.00')}</span>
</h2>

                </div>
            </div>
        </div>
    );
};

export default SalesSummary;
