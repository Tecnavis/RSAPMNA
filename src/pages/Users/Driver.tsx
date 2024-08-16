import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconPencil from '../../components/Icon/IconPencil';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import IconUserPlus from '../../components/Icon/IconUserPlus';
import { getFirestore, collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import IconMenuScrumboard from '../../components/Icon/Menu/IconMenuScrumboard';

const Driver = () => {
    const [items, setItems] = useState([] as any);
    const [editData, setEditData] = useState(null);
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid')
    const navigate = useNavigate();
    console.log("data", items);
    const role =sessionStorage.getItem('role');

    const fetchData = async () => {
        console.log('Fetching data from Firestore...');
    
        const driverCollection = collection(db, `user/${uid}/driver`);
        console.log('Driver collection reference:', driverCollection);
        
        const q = query(
            driverCollection,
            where('companyName', '==', 'RSA')
            // No condition for `status` here
        );
        console.log('Query created with parameters:', q);
    
        try {
            console.log('Executing query...');
            const querySnapshot = await getDocs(q);
            console.log('Query executed. Snapshot:', querySnapshot);
    
            // Filter items client-side
            const filteredItems = querySnapshot.docs.filter((doc) => {
                const data = doc.data();
                return !data.status || data.status === ''; // Check if `status` is missing or empty
            }).map((doc) => {
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
    

    useEffect(() => {
        console.log('useEffect triggered to fetch data.');
        fetchData().catch(console.error); // Correctly call fetchData inside useEffect
    }, []);

   
    const handleDelete = async (userId: string) => {
        console.log('handleDelete called with userId:', userId);
    
        // Prompt user to enter the password
        const enteredPassword = prompt('Please enter the password to confirm deletion:');
        console.log('User entered password:', enteredPassword);
    
        // Check if the entered password matches the required password
        const requiredPassword = 'RSA@123';
        if (enteredPassword === requiredPassword) {
            console.log('Password is correct, proceeding with deletion.');
    
            // Confirm deletion
            const confirmDelete = window.confirm('Are you sure you want to delete this user?');
            console.log('User confirmed deletion:', confirmDelete);
    
            if (confirmDelete) {
                try {
                    console.log('Preparing to update document with userId:', userId);
                    
                    // Get document reference
                    const userDoc = doc(db, `user/${uid}/driver`, userId);
                    console.log('Document reference obtained:', userDoc);
    
                    // Update document status
                    await updateDoc(userDoc, { status: 'deleted from UI' });
                    console.log('Document updated successfully');
    
                    // Update local state
                    setItems((prevItems) => {
                        const updatedItems = prevItems.filter(item => item.id !== userId);
                        console.log('Items state updated:', updatedItems);
                        return updatedItems;
                    });
    
                    alert('User deleted successfully.');
                    console.log('User deletion confirmed by alert');
                } catch (error) {
                    console.error('Error deleting user:', error);
                    alert('Failed to delete user.');
                    console.error('Error details:', error);
                }
            } else {
                console.log('User cancelled the deletion.');
            }
        } else {
            console.log('Incorrect password, deletion canceled.');
            alert('Incorrect password. Deletion canceled.');
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
