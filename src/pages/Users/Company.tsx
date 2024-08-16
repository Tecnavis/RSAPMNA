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
const Company = () => {
    const [items, setItems] = useState([] as any);
    const db = getFirestore();
    const navigate = useNavigate();
    const uid = sessionStorage.getItem('uid')
    const [isModalVisible, setModalVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const role =sessionStorage.getItem('role');

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
                        console.log('Document data:', doc.data());
                        return { id: doc.id, ...doc.data() };
                    });

                console.log('Filtered items:', filteredItems);
                setItems(filteredItems);
                console.log('State updated with fetched data.');
            } catch (error) {
                console.error('Error fetching data:', error); // Log errors if any
            }
        };

        console.log('useEffect triggered to fetch data.');
        fetchData().catch(console.error); // Correctly call fetchData inside useEffect
    }, []);
   
    const handleDelete = async (userId) => {
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
    const openDeleteModal = (item) => {
        setItemToDelete(item);
        setModalVisible(true);
    };
    const closeModal = () => {
        setModalVisible(false);
        setItemToDelete(null);
    };

    
    const handleEdit = (item) => {
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
                <div className="table-responsive mb-5 ">
                    <table>
                        <thead>
                            <tr>
                                <th>Photo</th>
                                <th>Driver Name</th>
                                <th>ID Number</th>
                                <th>Phone Number</th>
                                <th>Service Types</th>
                                <th>Basic Amount</th>
                                <th className="!text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => {
                                return (
                                    <tr key={item.id}>
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
            <ConfirmationModal isVisible={isModalVisible} onConfirm={() => handleDelete(itemToDelete?.id)} onCancel={closeModal} />
        </div>
    );
};

export default Company;
