import React, { useState, useEffect, ChangeEvent } from 'react';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import IconEdit from '../../components/Icon/IconEdit';

interface User {
    id: string;
    userName: string;
    role: string;
}

interface EditUserData {
    userName: string;
    role: string;
}

const RsaStaffReport: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [editUserId, setEditUserId] = useState<string | null>(null);
    const [editUserData, setEditUserData] = useState<EditUserData>({ userName: '', role: '' });
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    const db = getFirestore();
    const uid = sessionStorage.getItem('uid') || '';

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const usersCollection = collection(db, `user/${uid}/users`);
                const userSnapshot = await getDocs(usersCollection);
                const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
                console.log("userList",userList)
                setUsers(userList);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [db, uid]);

    const handleEditUserClick = (user: User) => {
        setEditUserId(user.id);
        setEditUserData({ userName: user.userName, role: user.role });
    };

    const handleUserInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditUserData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSaveUserClick = async () => {
        if (!editUserId) return;

        try {
            const userDocRef = doc(db, `user/${uid}/users`, editUserId);
            await updateDoc(userDocRef, editUserData as { [key: string]: any });
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === editUserId ? { ...user, ...editUserData } : user
                )
            );
            setEditUserId(null);
        } catch (error) {
            console.error('Error updating user: ', error);
        }
    };

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const filteredUsers = users.filter(user =>
        user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderTable = (usersList: User[], title: string) => {
        return (
            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">{title}</h3>
                <table className="min-w-full bg-white">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="py-2 px-4">User Name</th>
                            {/* <th className="py-2 px-4">Role</th> */}
                            <th className="py-2 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usersList.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="border px-4 py-2">
                                    {editUserId === user.id ? (
                                        <input
                                            type="text"
                                            name="userName"
                                            value={editUserData.userName}
                                            onChange={handleUserInputChange}
                                            className="border rounded p-1"
                                        />
                                    ) : (
                                        user.userName
                                    )}
                                </td>
                               
                                <td className="border px-4 py-2 flex gap-2 items-center">
                                    {editUserId === user.id ? (
                                        <button onClick={handleSaveUserClick} className="text-green-500 hover:text-green-700">
                                            Save
                                        </button>
                                    ) : (
                                        <button onClick={() => handleEditUserClick(user)} className="text-green-500 hover:text-blue-700">
                                            <IconEdit className="inline-block w-5 h-5" />
                                        </button>
                                    )}
                                    <Link
                                        to={`/rsastaffReport/userdetails/${user.id}`}
                                        className="text-blue-500 hover:text-blue-700 bg-blue-100 px-2 py-1 rounded-md shadow-md"
                                    >
                                        View Details
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-4">RSA Staff Report</h2>
            <div className="mb-4 w-full">
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="p-2 border border-gray-300 rounded w-full outline-none"
                />
            </div>
            {renderTable(filteredUsers, 'RSA Staff')}
        </div>
    );
};

export default RsaStaffReport;
