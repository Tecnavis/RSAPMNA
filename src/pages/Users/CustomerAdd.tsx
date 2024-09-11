import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { addDoc, collection, getFirestore, doc, updateDoc, getDocs } from 'firebase/firestore';
import styles from './customer.module.css';

// Define an interface for the customer item
interface CustomerItem {
    id?: string;
    customerName: string;
    location: string;
    email: string;
    address: string;
    phone_number: string;
}

// Define the location state type
interface LocationState {
    editData?: CustomerItem;
}

const CustomerAdd: React.FC = () => {
    const [customerName, setCustomerName] = useState<string>('');
    const [customerNameError, setCustomerNameError] = useState<string>('');
    const [customerLocation, setCustomerLocation] = useState<string>(''); // Renamed from `location` to `customerLocation`
    const [email, setEmail] = useState<string>('');
    const [address, setAddress] = useState<string>('');
    const [phone_number, setPhone] = useState<string>('');
    const [phoneNumberError, setPhoneNumberError] = useState<string>('');
    const [editData, setEditData] = useState<CustomerItem | null>(null);
    const navigate = useNavigate();
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid')!;
    const location = useLocation();
    const state = location.state as LocationState | undefined;

    useEffect(() => {
        if (state?.editData) {
            setEditData(state.editData);
            setCustomerName(state.editData.customerName || '');
            setCustomerLocation(state.editData.location || ''); // Updated reference here
            setEmail(state.editData.email || '');
            setAddress(state.editData.address || '');
            setPhone(state.editData.phone_number || '');
        }
    }, [state]);

    const checkPhoneUnique = async (phone_number: string): Promise<boolean> => {
        const driversRef = collection(db, `user/${uid}/customer`);
        const querySnapshot = await getDocs(driversRef);
        let isUnique = true;

        querySnapshot.forEach((doc) => {
            if (doc.data().phone_number === phone_number) {
                isUnique = false;
            }
        });

        return isUnique;
    };

    const addOrUpdateItem = async () => {
        let isValid = true;

        // Validation checks
        if (!customerName) {
            setCustomerNameError('Customer name is required');
            isValid = false;
        } else {
            setCustomerNameError('');
        }

        let isPhoneUnique = true;
        if (!editData || editData.phone_number !== phone_number) {
            isPhoneUnique = await checkPhoneUnique(phone_number);
        }

        if (!phone_number) {
            setPhoneNumberError('Phone number is required');
            isValid = false;
        } else if (!/^[6-9]\d{9}$/.test(phone_number)) {
            setPhoneNumberError('Enter a valid phone number');
            isValid = false;
        } else if (!isPhoneUnique) {
            setPhoneNumberError('Phone number already used');
            isValid = false;
        } else {
            setPhoneNumberError('');
        }

        if (!isValid) return;

        try {
            const itemData: CustomerItem = {
                customerName: customerName.toUpperCase(),
                location: customerLocation, // Updated reference here
                email,
                address,
                phone_number,
            };

            if (editData) {
                const docRef = doc(db, `user/${uid}/customer`, editData.id!);
                await updateDoc(docRef, itemData as Partial<CustomerItem>);
                console.log('Document updated');
            } else {
                const docRef = await addDoc(collection(db, `user/${uid}/customer`), itemData);
                console.log('Document written with ID: ', docRef.id);
            }

            navigate('/users/customer');
        } catch (e) {
            console.error('Error adding/updating document: ', e);
        }
    };

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link to="#" className="text-primary hover:underline">
                        Users
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Customer Account Settings</span>
                </li>
            </ul>
            <div className="pt-5">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Customer Details</h5>
                </div>
                <div></div>

                <div>
                    <form className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 mb-5 bg-white dark:bg-black">
                        <h6 className="text-lg font-bold mb-5">General Information</h6>
                        <div className="flex flex-col sm:flex-row">
                            <div className="ltr:sm:mr-4 rtl:sm:ml-4 w-full sm:w-2/12 mb-5">
                                <img src="/assets/images/profile-34.jpeg" alt="img" className="w-20 h-20 md:w-32 md:h-32 rounded-full object-cover mx-auto" />
                            </div>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="customerName">Customer Name</label>
                                    <input
                                        id="customerName"
                                        type="text"
                                        placeholder="Enter Customer Name"
                                        className="form-input"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                    />
                                    {customerNameError && <span className={`${styles.error}`}>{customerNameError}</span>}
                                </div>
                                <div>
                                    <label htmlFor="location">Location</label>
                                    <input
                                        id="location"
                                        type="text"
                                        className="form-input"
                                        value={customerLocation} // Updated reference here
                                        onChange={(e) => setCustomerLocation(e.target.value)} // Updated reference here
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email">Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="@gmail.com"
                                        className="form-input"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="address">Address</label>
                                    <textarea
                                        id="address"
                                        placeholder="Enter Address"
                                        className="form-input"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="phone_number">Phone</label>
                                    <input
                                        id="phone_number"
                                        type="tel"
                                        placeholder="Phone number"
                                        className={`${styles.formInput} form-input`}
                                        value={phone_number}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                    {phoneNumberError && <span className={`${styles.error}`}>{phoneNumberError}</span>}
                                </div>
                                <div className="sm:col-span-2 mt-3">
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={addOrUpdateItem}
                                    >
                                        {editData ? 'Update' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CustomerAdd;
