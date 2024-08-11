import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconPencil from '../../components/Icon/IconPencil';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import IconUserPlus from '../../components/Icon/IconUserPlus';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import IconMenuScrumboard from '../../components/Icon/Menu/IconMenuScrumboard';

const Driver = () => {
    const [items, setItems] = useState([] as any);
    const [editData, setEditData] = useState(null);
    const db = getFirestore();
    const navigate = useNavigate();
    console.log("data", items);

    useEffect(() => {
        const fetchData = async () => {
            const driverCollection = collection(db, 'driver');
            const q = query(driverCollection, where('companyName', '==', 'RSA'));
            const querySnapshot = await getDocs(q);

            // Filter out deleted items
            const deletedIds = JSON.parse(localStorage.getItem('deletedUserIds') || '[]');
            const filteredItems = querySnapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter((item: any) => !deletedIds.includes(item.id));

            setItems(filteredItems);
        };
        fetchData().catch(console.error);
    }, []);

    const handleDelete = async (userId: string) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this user?');
        if (confirmDelete) {
            const enteredIdNumber = window.prompt('Please enter the ID number of the driver:');
            const driver = items.find((item: any) => item.id === userId);

            if (driver && enteredIdNumber === driver.idnumber) {
                // Update the local state
                setItems((prevItems: any) => prevItems.filter((item: any) => item.id !== userId));

                // Store the deleted ID in localStorage
                let deletedIds = JSON.parse(localStorage.getItem('deletedUserIds') || '[]');
                deletedIds.push(userId);
                localStorage.setItem('deletedUserIds', JSON.stringify(deletedIds));
            } else {
                window.alert('ID number is incorrect. Deletion aborted.');
            }
        }
    };

    const handleEdit = (item) => {
        navigate(`/users/driver-add/${item.id}`, { state: { editData: item } });
    };

    return (
        <div className="grid xl:grid-cols-1 gap-6 grid-cols-1">
            <div className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Driver Details</h5>
                    <Link to="/users/driver-add" className="font-semibold text-success hover:text-gray-400 dark:text-gray-400 dark:hover:text-gray-600">
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
                                <th>Driver Name</th>
                                <th>ID Number</th>
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
                                                    <button type="button" onClick={() => handleDelete(item.id)}>
                                                        <IconTrashLines className="text-danger" />
                                                    </button>
                                                </Tippy>
                                            </li>
                                            <li>
                                                <Tippy content="More">
                                                    <Link to={`/users/driver/driverdetails/${item.id}`}>
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
        </div>
    );
};

export default Driver;
