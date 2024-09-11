import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconPencil from '../../components/Icon/IconPencil';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import IconUserPlus from '../../components/Icon/IconUserPlus';
import { getFirestore, collection, getDocs, where, query, doc, updateDoc } from 'firebase/firestore';
import IconMenuScrumboard from '../../components/Icon/Menu/IconMenuScrumboard';
import defaultImage from '../../assets/css/images/user-front-side-with-white-background.jpg'
import ConfirmationModal from './ConfirmationModal/ConfirmationModal'; // Import the modal component

// Define the type for driver item
interface DriverItem {
    id: string;
    companyName: string;
    driverName: string;
    idnumber: string;
    phone: string;
    selectedServices: Record<string, string>;
    basicSalaries: Record<string, number>;
    status?: string;
}

// Define the component
const CompanyCreatn: React.FC = () => {
    const [items, setItems] = useState<DriverItem[]>([]);
    const db = getFirestore();
    const navigate = useNavigate();
    const uid = sessionStorage.getItem('uid') || '';
    const [isModalVisible, setModalVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<DriverItem | null>(null);
    const role = sessionStorage.getItem('role');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const driverCollection = collection(db, `user/${uid}/driver`);
                const q = query(driverCollection, where('companyName', '==', 'Company')); 
                const querySnapshot = await getDocs(q);
                
                // Filter the fetched data based on status
                const filteredItems = querySnapshot.docs
                    .filter((doc) => {
                        const data = doc.data();
                        return !data.status || data.status === 'Active'; // Adjust status as needed
                    })
                    .map((doc) => ({ id: doc.id, ...doc.data() } as DriverItem));

                setItems(filteredItems);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [uid, db]);

    const handleDelete = async (userId: string) => {
        try {
            const userDoc = doc(db, `user/${uid}/driver`, userId);
            await updateDoc(userDoc, { status: 'deleted from UI' });
            
            // Update local state
            setItems(prevItems => prevItems.filter(item => item.id !== userId));
        } catch (error) {
            console.error('Error deleting document: ', error);
        }
        setModalVisible(false);
    };

    const openDeleteModal = (item: DriverItem) => {
        setItemToDelete(item);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setItemToDelete(null);
    };

    const handleEdit = (item: DriverItem) => {
        navigate(`/users/companycreation/companycreationadd/${item.id}`, { state: { editData: item } });
    };

    return (
        <div className="grid xl:grid-cols-1 gap-6 grid-cols-1">
            <div className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Company Details</h5>
                    <Link to="/users/companycreation/companycreationadd" className="font-semibold text-success hover:text-gray-400 dark:text-gray-400 dark:hover:text-gray-600">
                        <span className="flex items-center">
                            <IconUserPlus className="me-2" />
                            Add New
                        </span>
                    </Link>
                </div>
                <div className="table-responsive mb-5">
                    <table>
                        <thead>
                            <tr>
                                <th>Id</th>
                                {/* <th>Company Name</th> */}
                                <th>Company Name</th>
                                <th>Driver ID Number</th>
                                <th>Phone Number</th>
                                <th>Service Types</th>
                                <th>Basic Salary</th>
                                <th className="!text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{index + 1}</td>
                                    {/* <td>{item.companyName}</td> */}
                                    <td>
                                        <div className="whitespace-nowrap">{item.driverName}</div>
                                    </td>
                                    <td>{item.idnumber}</td>
                                    <td>{item.phone}</td>
                                    <td>
                                        <ul>
                                            {Object.entries(item.selectedServices).map(([key, value]) => (
                                                <li key={key}>{value}</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td>
                                        <ul>
                                            {Object.entries(item.basicSalaries).map(([key, value]) => (
                                                <li key={key}>{key}: {value}</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="text-center">
                                        <ul className="flex items-center justify-center gap-2">
                                            <li>
                                                <Tippy content="Edit">
                                                    <button type="button" onClick={() => handleEdit(item)}>
                                                        <IconPencil className="text-primary" />
                                                    </button>
                                                </Tippy>
                                            </li>
                                            <li>
                                                <Tippy content="Delete">
                                                    <button type="button" onClick={() => openDeleteModal(item)}>
                                                        <IconTrashLines className="text-danger" />
                                                    </button>
                                                </Tippy>
                                            </li>
                                            <li>
                                                <Tippy content="More">
                                                    <Link to={`/users/companycreation/companycreationdetails/${item.id}`}>
                                                        <IconMenuScrumboard className="text-success" />
                                                    </Link>
                                                </Tippy>
                                            </li>
                                        </ul>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <ConfirmationModal isVisible={isModalVisible} onConfirm={() => itemToDelete && handleDelete(itemToDelete.id)} onCancel={closeModal} />
        </div>
    );
};

export default CompanyCreatn;
