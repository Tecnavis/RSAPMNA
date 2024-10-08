import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconPencil from '../../components/Icon/IconPencil';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import IconUserPlus from '../../components/Icon/IconUserPlus';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';

// Define an interface for the customer item
interface CustomerItem {
    id: string;
    customerName: string;
    location: string;
    email: string;
    address: string;
    phone_number: string;
}

const Customer: React.FC = () => {
    const [items, setItems] = useState<CustomerItem[]>([]);
    const [editData, setEditData] = useState<CustomerItem | null>(null);
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid')!;
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, `user/${uid}/customer`));
                const fetchedItems: CustomerItem[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomerItem));
                setItems(fetchedItems);
            } catch (error) {
                console.error('Error fetching data: ', error);
            }
        };
        fetchData();
    }, [db, uid]);

    const handleDelete = async (userId: string) => {
        try {
            const userRef = doc(db, `user/${uid}/customer`, userId);
            await deleteDoc(userRef);
            setItems(prevItems => prevItems.filter(item => item.id !== userId));
        } catch (error) {
            console.error('Error deleting document: ', error);
        }
    };

    const handleEdit = (item: CustomerItem) => {
        navigate(`/users/customer-add/${item.id}`, { state: { editData: item } });
    };

    return (
        <div className="grid xl:grid-cols-1 gap-6 grid-cols-1">
            <div className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Customer Details</h5>
                    <Link to="/users/customer-add" className="font-semibold text-success hover:text-gray-400 dark:text-gray-400 dark:hover:text-gray-600">
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
                                <th>Customer Name</th>
                                <th>Location</th>
                                <th>Email</th>
                                <th>Address</th>
                                <th>Phone Number</th>
                                <th className="!text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <div className="whitespace-nowrap">{item.customerName}</div>
                                    </td>
                                    <td>{item.location}</td>
                                    <td>{item.email}</td>
                                    <td>{item.address}</td>
                                    <td>{item.phone_number}</td>
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
                                                    <button type="button" onClick={() => handleDelete(item.id)}>
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
        </div>
    );
};

export default Customer;
