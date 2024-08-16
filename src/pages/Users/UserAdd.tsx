import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { addDoc, collection, getFirestore, doc, updateDoc, getDocs } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import defaultImage from '../../assets/css/images/user-front-side-with-white-background.jpg';
import styles from './useradd.module.css'
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const UserAdd = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [phone_number, setPhone] = useState('');
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [editData, setEditData] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const navigate = useNavigate();
    const { state } = useLocation(); // Use the useLocation hook to access location state

    const db = getFirestore();
    const storage = getStorage();
    const uid = sessionStorage.getItem('uid');

    useEffect(() => {
        if (state && state.editData) {
            setEditData(state.editData);
            setName(state.editData.name || '');
            setEmail(state.editData.email || '');
            setAddress(state.editData.address || '');
            setPhone(state.editData.phone_number || '');
            setUserName(state.editData.userName || '');
            setPassword(state.editData.password || '');
            setConfirmPassword(state.editData.confirmPassword || '');
            setImagePreview(state.editData.profileImage || '');
        }
    }, [state]);
          
    const checkPhoneUnique = async (phone_number) => {
        const db = getFirestore();
        const uid = sessionStorage.getItem('uid');
        const usersRef = collection(db, `user/${uid}/users`);
        const querySnapshot = await getDocs(usersRef);
        let isUnique = true;
    
        querySnapshot.forEach((doc) => {
            if (doc.data().phone_number === phone_number) {
                isUnique = false;
            }
        });
    
        return isUnique;
    };
    
    const handleConfirmPasswordChange = (e) => {
        setConfirmPassword(e.target.value);
    };

    const validate = () => {
        let formErrors = {};

        if (!name.trim()) {
            formErrors.name = 'Name is required';
        } else if (name.length < 3) {
            formErrors.name = 'Name must be at least 3 characters';
        }

        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phone_number.trim()) {
            formErrors.phone_number = 'Phone number is required';
        } else if (!phoneRegex.test(phone_number)) {
            formErrors.phone_number = 'Enter a valid 10-digit Indian phone number';
        }

        if (!userName.trim()) {
            formErrors.userName = 'Username is required';
        } else if (userName.length < 3) {
            formErrors.userName = 'Username must be at least 3 characters';
        }

        if (!password.trim()) {
            formErrors.password = 'Password is required';
        } else if (password.length < 4) {
            formErrors.password = 'Password must be at least 4 characters';
        }

        if (password !== confirmPassword) {
            formErrors.confirmPassword = 'Password and confirm password do not match';
        }

        setErrors(formErrors);
        return Object.keys(formErrors).length === 0;
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const addOrUpdateItem = async () => {
        if (!validate()) return;

        if (uid) {
            try {
              // Assume you have an 'editData' object containing the original data, including the phone number
if (!editData || editData.phone_number !== phone_number) {
    // Check if the phone number is unique
    const isPhoneUnique = await checkPhoneUnique(phone_number);
    if (!isPhoneUnique) {
        console.error('Phone number already exists');
        alert('Phone number already exists. Please enter a different phone number.');
        return;
    }
}

// Continue with the rest of the code (e.g., saving the data)

                let profileImageUrl = '';

                if (profileImage) {
                    const imageRef = ref(storage, `profileImages/${profileImage.name}`);
                    await uploadBytes(imageRef, profileImage);
                    profileImageUrl = await getDownloadURL(imageRef);
                } else if (editData && editData.profileImage) {
                    profileImageUrl = editData.profileImage;
                }

                const itemData = {
                    name: name.toUpperCase(),
                    email,
                    address,
                    phone_number,
                    userName,
                    password,
                    role: "staff" ,

                    confirmPassword,
                    profileImage: profileImageUrl,
                };

                if (editData) {
                    const docRef = doc(db, `user/${uid}/users`, editData.id);
                    await updateDoc(docRef, itemData);
                    console.log('Document updated');
                } else {
                    const docRef = await addDoc(collection(db, `user/${uid}/users`), itemData);
                    console.log(docRef, 'this is the doc ref');
                    console.log('Document written with ID: ', docRef.id);
                }

                navigate('/users/staff');
            } catch (e) {
                console.error('Error adding/updating document: ', e);
            }
        } else {
            console.log('there is no uid ', uid);
        }
    };

    return (
        <div>
            <form className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 mb-5 bg-white dark:bg-black">
                <h6 className="text-lg font-bold mb-5">General Information</h6>
                <div className="flex flex-col sm:flex-row">
                    <div className="ltr:sm:mr-4 rtl:sm:ml-4 w-full sm:w-2/12 mb-5">
                        <img src={imagePreview || defaultImage} alt="Profile" className="w-20 h-20 md:w-32 md:h-32 rounded-full object-cover mx-auto" />
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="name">Name</label>
                            <input id="name" type="text" placeholder="Enter Name" className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
                            {errors.name && <p className="text-red-500">{errors.name}</p>}
                        </div>
                        <div>
                            <label htmlFor="email">Email</label>
                            <input id="email" type="email" placeholder="@gmail.com" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <label htmlFor="address">Address</label>
                            <textarea id="address" placeholder="Enter Address" className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} />
                        </div>

                        <div>
                            <label htmlFor="phone_number">Phone</label>
                            <input
                                id="phone_number"
                                type="number"
                                placeholder="phone number"
                                className={`${styles.formInput} form-input`}
                                value={phone_number}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                            {errors.phone_number && <p className="text-red-500">{errors.phone_number}</p>}
                        </div>
                        <div>
                            <label htmlFor="userName">User Name</label>
                            <input id="userName" type="text" placeholder="User Name" className="form-input" value={userName} onChange={(e) => setUserName(e.target.value)} />
                            {errors.userName && <p className="text-red-500">{errors.userName}</p>}
                        </div>
                        <div>
                            <label htmlFor="password">Password </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="password"
                                    className="form-input pr-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <span className="absolute end-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                            {errors.password && <p className="text-red-500">{errors.password}</p>}
                        </div>
                        <div>
                            <label htmlFor="confirmPassword">Confirm password </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Confirm Password"
                                    className="form-input pr-10"
                                    value={confirmPassword}
                                    onChange={handleConfirmPasswordChange}
                                />
                                <span className="absolute end-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                            {errors.confirmPassword && <p className="text-red-500">{errors.confirmPassword}</p>}
                        </div>

                        <div>
                            <label htmlFor="profileImage">Profile Image</label>
                            <input id="profileImage" type="file" accept=".jpg, .jpeg, .png" onChange={handleImageChange} className="form-input" />
                        </div>

                        <div className="sm:col-span-2 mt-3">
                            <button type="button" className="btn btn-primary" onClick={addOrUpdateItem}>
                                {editData ? 'Update' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default UserAdd;
