import { Link, NavLink } from 'react-router-dom';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useState, useEffect } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconTrashLines from '../../../components/Icon/IconTrashLines';
import IconEdit from '../../../components/Icon/IconEdit';
import IconEye from '../../../components/Icon/IconEye';
import { collection, getDocs, getFirestore, doc, deleteDoc, query } from 'firebase/firestore';

interface Driver {
    id: string;
    driverName?: string;
    profileImageUrl?: string;
    email?: string;
    phone?: string;
    expenseName?: string;
    amount?: number;
    createdAt?: string;
}
interface Expense {
    id: string;
    expenseName?: string;
    amount?: number;
}
const ExpenseSummery = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Driver List'));
    }, [dispatch]);

    const [items, setItems] = useState<Driver[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [page, setPage] = useState<number>(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<Driver[]>([]);
    const [records, setRecords] = useState<Driver[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<Driver[]>([]);
    const [search, setSearch] = useState<string>('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'driverName',
        direction: 'asc',
    });

    const db = getFirestore();
    const uid = sessionStorage.getItem('uid') || '';

    useEffect(() => {
        const fetchDriversAndExpenses = async () => {
            try {
                const driversQuery = query(collection(db, `user/${uid}/driver`));
                const driversSnapshot = await getDocs(driversQuery);

                const driversData = await Promise.all(
                    driversSnapshot.docs.map(async (driverDoc) => {
                        const driverData: Driver = { id: driverDoc.id, ...driverDoc.data() } as Driver;
                
                        // Fetch Expenses sub-collection
                        const expensesQuery = query(collection(db, `user/${uid}/driver/${driverDoc.id}/Expenses`));
                        const expensesSnapshot = await getDocs(expensesQuery);
                        const expenses = expensesSnapshot.docs.map((expenseDoc) => {
                            const data = expenseDoc.data();
                            return {
                                id: expenseDoc.id,
                                expenseName: data?.expenseName || 'N/A', // Fallback to 'N/A' if undefined
                            };
                        });
                        
                        // Assign the latest expense name or any other logic you prefer
                        driverData.expenseName = expenses.length > 0 ? expenses[0].expenseName : 'N/A'; // Default value if no expense
                
                        return driverData;
                    })
                );
                

                setItems(driversData);
                setInitialRecords(sortBy(driversData, 'driverName'));
                setLoading(false);
            } catch (error) {
                console.error('Error fetching drivers and expenses:', error);
                setLoading(false);
            }
        };

        fetchDriversAndExpenses();
    }, [db, uid]);

    useEffect(() => {
        const filteredRecords = items.filter((item) => {
            return (
                item.driverName?.toLowerCase().includes(search.toLowerCase()) ||
                item.email?.toLowerCase().includes(search.toLowerCase()) ||
                item.phone?.toLowerCase().includes(search.toLowerCase())
            );
        });
        setInitialRecords(filteredRecords);
    }, [search, items]);

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

    const deleteRow = async (id: string) => {
        if (window.confirm('Are you sure want to delete selected row ?')) {
            try {
                await deleteDoc(doc(db, `user/${uid}/driver`, id));
                const updatedRecords = items.filter((item) => item.id !== id);
                setItems(updatedRecords);
                setInitialRecords(updatedRecords);
                setRecords(updatedRecords.slice((page - 1) * pageSize, page * pageSize));
                setSelectedRecords([]);
            } catch (error) {
                console.error('Error deleting driver:', error);
            }
        }
    };

    return (
        <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
            <div className="expense-table">
                <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
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
                        className="whitespace-nowrap table-hover expense-table"
                        records={records}
                        columns={[
                            {
                                accessor: 'driverName',
                                sortable: true,
                                render: ({ driverName }) => <div className="font-semibold">{driverName}</div>,
                            },
                            {
                                accessor: 'profileImageUrl',
                                sortable: false,
                                render: ({ profileImageUrl }) => (
                                    <div className="flex items-center font-semibold">
                                        <img
                                            className="h-8 w-8 rounded-full object-cover"
                                            src={profileImageUrl}
                                            alt="Driver"
                                        />
                                    </div>
                                ),
                            },
                            {
                                accessor: 'email',
                                sortable: true,
                            },
                            {
                                accessor: 'phone',
                                sortable: true,
                            },
                            {
                                accessor: 'expenseName',
                                title: 'Expense Name',
                                sortable: true,
                                render: ({ expenseName }) => <div>{expenseName}</div>,
                            },
                            {
                                accessor: 'amount',
                                title: 'Expense Amount',
                                sortable: true,
                                render: ({ amount }) => <div>{amount}</div>,
                            },
                            {
                                accessor: 'createdAt',
                                title: 'Date & Time',
                                sortable: true,
                                render: ({ createdAt }) => <div>{createdAt}</div>,
                            },
                            {
                                accessor: 'action',
                                title: 'Actions',
                                sortable: false,
                                textAlignment: 'center',
                                render: ({ id }) => (
                                    <div className="flex gap-4 items-center w-max mx-auto">
                                        <NavLink to={`/apps/driver/edit/${id}`} className="flex hover:text-info">
                                            <IconEdit className="w-4.5 h-4.5" />
                                        </NavLink>
                                        <NavLink to={`/apps/driver/view/${id}`} className="flex hover:text-primary">
                                            <IconEye />
                                        </NavLink>
                                        <button type="button" className="flex hover:text-danger" onClick={() => deleteRow(id)}>
                                            <IconTrashLines />
                                        </button>
                                    </div>
                                ),
                            },
                        ]}
                        highlightOnHover
                        totalRecords={initialRecords.length}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={setPage}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        sortStatus={sortStatus}
                        onSortStatusChange={setSortStatus}
                        selectedRecords={selectedRecords}
                        onSelectedRecordsChange={setSelectedRecords}
                        paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                    />
                </div>
            </div>
        </div>
    );
};

export default ExpenseSummery;
