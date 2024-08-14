import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconPencil from '../../components/Icon/IconPencil';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import IconUserPlus from '../../components/Icon/IconUserPlus';
import { getFirestore, collection, getDocs, where, query, doc, updateDoc } from 'firebase/firestore';
import IconMenuScrumboard from '../../components/Icon/Menu/IconMenuScrumboard';

const CompanyCreatn = () => {
    const [items, setItems] = useState([] as any);
    const db = getFirestore();
    const navigate = useNavigate();
    const uid = sessionStorage.getItem('uid')

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
                    .map((doc) => ({ id: doc.id, ...doc.data() }));

                setItems(filteredItems);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [uid, db]);

    const handleDelete = async (userId: string) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this user?');
        if (confirmDelete) {
            const enteredPassword = window.prompt('Please enter the password to confirm deletion:');
            const requiredPassword = 'RSA@123';

            if (enteredPassword === requiredPassword) {
                try {
                    const userDoc = doc(db, `user/${uid}/driver`, userId);
                    await updateDoc(userDoc, { status: 'deleted from UI' });
                    
                    setItems((prevItems: any) => prevItems.filter((item: any) => item.id !== userId));
                    alert('User deleted successfully.');
                } catch (error) {
                    console.error('Error deleting user:', error);
                    alert('Failed to delete user.');
                }
            } else {
                window.alert('Incorrect password. Deletion aborted.');
            }
        }
    };

    const handleEdit = (item) => {
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
                                <th>Company Name</th>
                                <th>Driver Name</th>
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
                                    <td>{item.companyName}</td>
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
                                                    <button type="button" onClick={() => handleDelete(item.id)}>
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
        </div>
    );
};

export default CompanyCreatn;
