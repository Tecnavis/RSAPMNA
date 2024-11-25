import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconPencil from '../../components/Icon/IconPencil';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import IconUserPlus from '../../components/Icon/IconUserPlus';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import ConfirmationModal from './ConfirmationModal/ConfirmationModal'; // Import the modal component
import defaultImage from '../../assets/css/images/user-front-side-with-white-background.jpg';

interface User {
    id: string;
    name: string;
    email: string;
    address: string;
    phone_number: string;
    userName: string;
    password: string;
    profileImage?: string;
}

const Staff: React.FC = () => {
    const [items, setItems] = useState<User[]>([]);
    const [editData, setEditData] = useState<User | null>(null);
    const [isModalVisible, setModalVisible] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<User | null>(null);
    const db = getFirestore();
    const navigate = useNavigate();
    const uid = sessionStorage.getItem('uid');

    useEffect(() => {
        const fetchData = async () => {
            if (uid) {
                const querySnapshot = await getDocs(collection(db, `user/${uid}/users`));
                setItems(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User)));
            }
        };
        fetchData().catch(console.error);
    }, [uid, db]);

    const handleDelete = async (userId: string) => {
        try {
            if (uid) {
                const userRef = doc(db, `user/${uid}/users`, userId);
                await deleteDoc(userRef);
                setItems((prevItems) => prevItems.filter((item) => item.id !== userId));
            }
        } catch (error) {
            console.error('Error deleting document: ', error);
        }
        setModalVisible(false);
    };

    const openDeleteModal = (item: User) => {
        setItemToDelete(item);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setItemToDelete(null);
    };

    return (
        <div className="grid xl:grid-cols-1 gap-6 grid-cols-1">
            <div className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Staffs Details</h5>
                    <Link to="/users/user-add" className="font-semibold text-success hover:text-gray-400 dark:text-gray-400 dark:hover:text-gray-600">
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
                                <th>#</th>
                                <th>Photo</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Address</th>
                                <th>Phone Number</th>
                                <th>User Name</th>
                                <th>Password </th>
                                <th className="!text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item,index) => (
                                <tr key={item.id}>
                                    <td>{index+1}</td>
                                    <td>
                                        <div className="w-14 h-14 rounded-full overflow-hidden">
                                            <img src={item.profileImage || defaultImage} className="w-full h-full object-cover" alt="Profile" />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="whitespace-nowrap">{item.name}</div>
                                    </td>
                                    <td>{item.email}</td>
                                    <td>{item.address}</td>
                                    <td>{item.phone_number}</td>
                                    <td>{item.userName}</td>
                                    <td>{item.password}</td>
                                    <td className="text-center">
                                        <ul className="flex items-center justify-center gap-2">
                                            <li>
                                                <Tippy content="Edit">
                                                    <button type="button" onClick={() => navigate(`/users/user-add/${item.id}`, { state: { editData: item } })}>
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
                                        </ul>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationModal isVisible={isModalVisible} onConfirm={() => handleDelete(itemToDelete?.id || '')} onCancel={closeModal} />
        </div>
    );
};

export default Staff;
