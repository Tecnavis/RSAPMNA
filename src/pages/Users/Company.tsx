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
interface Item {
    id: string;
    driverName: string;
    idnumber: string;
    phone: string;
    selectedServices: Record<string, string>;
    basicSalaries: Record<string, number>;
    profileImageUrl?: string;
    companyName?: string;
    status?: string;
    personalphone: string;
    password?: string;
    confirmPassword?: string;
    advancePayment?: string;
    serviceVehicle?: Record<string, any>; // Define actual type instead of 'any'
    salaryPerKm?: Record<string, any>; // Define actual type instead of 'any'
    basicSalaryKm?: Record<string, any>; // Define actual type instead of 'any'
    baseLocation?: string;
}


const Company: React.FC = () => {
    const [items, setItems] = useState<Item[]>([]);
    const db = getFirestore();
      const [searchTerm, setSearchTerm] = useState('');
      const [filteredItems, setFilteredItems] = useState<Item[]>([]);

    const navigate = useNavigate();
    const uid = sessionStorage.getItem('uid');
    const [isModalVisible, setModalVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
    const role = sessionStorage.getItem('role');

    useEffect(() => {
        const fetchData = async () => {
            console.log('Fetching data from Firestore...');
    
            const driverCollection = collection(db, `user/${uid}/driver`);
            console.log('Driver collection reference:', driverCollection);
    
            // Create query to filter out items with companyName as 'RSA'
            const q = query(driverCollection, where('companyName', '!=', 'RSA'));
            console.log('Query created with parameters:', q);
    
            try {
                console.log('Executing query...');
                const querySnapshot = await getDocs(q);
                console.log('Query executed. Snapshot:', querySnapshot);
    
                // Further filter items client-side
                const filteredItems = querySnapshot.docs
                    .filter((doc) => {
                        const data = doc.data();
                        // Apply both filtering conditions
                        return data.companyName !== 'Company' && 
                               (!data.status || data.status === '');
                    })
                    .map((doc) => {
                        const data = doc.data();
                        console.log('Document data:', data);
    
                        // Ensure all required fields from the Item interface are present
                        return {
                            id: doc.id,
                            driverName: data.driverName || 'Unknown Driver', // Default value if missing
                            idnumber: data.idnumber || 'N/A',
                            phone: data.phone || 'N/A',
                            personalphone: data.personalphone || 'N/A',
                            password: data.password || '',
                            confirmPassword: data.confirmPassword || '',
                            advancePayment: data.advancePayment || '',
                            serviceVehicle: data.serviceVehicle || '',
                            salaryPerKm: data.salaryPerKm || '',
                            basicSalaryKm: data.basicSalaryKm || '',
                            baseLocation: data.baseLocation || '',
                            selectedServices: data.selectedServices || {}, // Use empty object as fallback
                            basicSalaries: data.basicSalaries || {}, // Use empty object as fallback
                            profileImageUrl: data.profileImageUrl || defaultImage,
                            companyName: data.companyName || '',
                            status: data.status || ''
                        };
                    });
    
                setItems(filteredItems);
                console.log('State updated with fetched data.');
            } catch (error) {
                console.error('Error fetching data:', error); // Log errors if any
            }
        };
    
        console.log('useEffect triggered to fetch data.');
        fetchData().catch(console.error); // Correctly call fetchData inside useEffect
    }, [uid]); // Add 'uid' as a dependency to refetch data when 'uid' changes
    useEffect(() => {
        const filtered = items.filter((item) => {
            const searchTermLower = searchTerm.toLowerCase();
            return (
                item.driverName.toLowerCase().includes(searchTermLower) ||
                item.idnumber.toLowerCase().includes(searchTermLower) ||
                item.phone.toLowerCase().includes(searchTermLower) ||
                (item.companyName?.toLowerCase().includes(searchTermLower) ?? false)
            );
        });
        setFilteredItems(filtered);
    }, [searchTerm, items]);
    
    const handleDelete = async (userId: string) => {
        try {
            const userDoc = doc(db, `user/${uid}/driver`, userId);
                    await updateDoc(userDoc, { status: 'deleted from UI' });
                    
                    // Update local state
                    setItems((prevItems: any) => prevItems.filter((item: any) => item.id !== userId));
        } catch (error) {
            console.error('Error deleting document: ', error);
        }
        setModalVisible(false);
    };
    const openDeleteModal = (item: Item) => {
        setItemToDelete(item);
        setModalVisible(true);
    };
    const closeModal = () => {
        setModalVisible(false);
        setItemToDelete(null);
    };

    
    const handleEdit = (item: Item) => {
        navigate(`/users/company-add/${item.id}`, { state: { editData: item } });
    };

    return (
        <div className="grid xl:grid-cols-1 gap-6 grid-cols-1">
            <div className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Providers Details</h5>
                    <Link to="/users/company-add" className="font-semibold text-success hover:text-gray-400 dark:text-gray-400 dark:hover:text-gray-600">
                        <span className="flex items-center">
                            <IconUserPlus className="me-2" />
                            Add New
                        </span>
                    </Link>
                </div>
                <div className="mb-5">
                    <input
                        type="text"
                        placeholder="Search by provider name"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div className="table-responsive mb-5 ">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Photo</th>
                                <th>Provider Name</th>
                                <th>ID Number</th>
                                <th>Phone Number</th>
                                <th>Service Types</th>
                                <th>Company Name</th>
                                <th className="!text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item, index) => {
                                return (
                                    <tr key={item.id}>
                                        <td>{index+1}</td>
                                        <td>  <div className="w-14 h-14 rounded-full overflow-hidden">
                                            <img src={item.profileImageUrl || defaultImage} className="w-full h-full object-cover" alt="Profile" />
                                        </div></td>
                                        <td>
                                            <div className="whitespace-nowrap">{item.driverName}</div>
                                        </td>
                                        <td>{item.idnumber}</td>
                                        <td>{item.phone}</td>
                                        <td>
                                            <ul>
                                                {Object.entries(item.selectedServices).map(([key, value]) => (
                                                    <li key={key}> {value}</li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td>
                                        {item.companyName}
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
                                                        <Link to={`/users/company/companydetails/${item.id}`}>
                                                        <IconMenuScrumboard className='text-success'/>
                                                        </Link>
                                                    </Tippy>
                                                </li>
                                            </ul>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            <ConfirmationModal 
  isVisible={isModalVisible} 
  onConfirm={() => itemToDelete?.id ? handleDelete(itemToDelete.id) : console.error("Item ID is missing")} 
  onCancel={closeModal} 
/>
        </div>
    );
};

export default Company;
