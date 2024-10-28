import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { addDoc, collection, getFirestore, doc, updateDoc, getDocs } from 'firebase/firestore';
import IconPlusCircle from '../../components/Icon/IconPlusCircle';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, uploadBytes  } from 'firebase/storage';
import defualtImage from '../../assets/css/images/user-front-side-with-white-background.jpg';
import styles from './companyAdd.module.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
const DriverAdd = () => {
    const [driverName, setDriverName] = useState('');
    const [idnumber, setIdnumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [companyName, setCompanyName] = useState('RSA');

    const [personalphone, setPersonalPhone] = useState('');
    const [salaryPerKm, setSalaryPerKm] = useState<{ [key: string]: string }>({});
    const [basicSalaryKm, setBasicSalaryKm] = useState<{ [key: string]: string }>({});
    type EditData = {
        id: string;
        phone: string;
        driverName?: string;
        idnumber?: string;
        password?: string;
        confirmPassword?: string;
        serviceVehicle?: string;
        personalphone?: string;
        salaryPerKm?: string;
        basicSalaryKm?: string;
        selectedServices?: string[];
        basicSalaries?: { [key: string]: string };
        profileImageUrl?: string;
    };
    
    const [editData, setEditData] = useState<EditData | null>(null);
        const [showTable, setShowTable] = useState(false);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [basicSalaries, setBasicSalaries] = useState<{ [key: string]: string }>({});
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [serviceVehicle, setServiceVehicle] = useState<{ [key: string]: string }>({});

    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [advancePayment, setAdvancePayment] = useState('0');
    const [advance, setAdvance] = useState<number>(0);

    const storage = getStorage();
    const uid = sessionStorage.getItem('uid');
    const [serviceOptions, setServiceOptions] = useState<string[]>([]);
    const [imagePreview, setImagePreview] = useState('');
    const [serviceTypeError, setServiceTypeError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [phoneError, setPhoneError] = useState('');

    useEffect(() => {
        const fetchServiceOptions = async () => {
            try {
                const db = getFirestore();
                const serviceCollection = collection(db, `user/${uid}/service`);
                const serviceSnapshot = await getDocs(serviceCollection);
                const servicesList = serviceSnapshot.docs.map((doc) => doc.data().name); // Adjust this based on your data structure
                setServiceOptions(servicesList);
            } catch (error) {
                console.error('Error fetching services:', error);
            }
        };

        fetchServiceOptions();
    }, []);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };
    
    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(e.target.value);
    };
    

    const handleBasicSalaryChange = (service: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const updatedSalaries = { ...basicSalaries, [service]: e.target.value };
        setBasicSalaries(updatedSalaries);
    };
    
    const handleBasicSalaryKmChange = (service: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const updatedKm = { ...basicSalaryKm, [service]: e.target.value };
        setBasicSalaryKm(updatedKm);
    };
    
    const handleSalaryPerKmChange = (service: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const updatedsalaryPerKm = { ...salaryPerKm, [service]: e.target.value };
        setSalaryPerKm(updatedsalaryPerKm);
    };
    
    const handleServiceVehicle = (service: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const updatedServiceVehicle = { ...serviceVehicle, [service]: e.target.value };
        setServiceVehicle(updatedServiceVehicle);
    };
    
    const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const renderServiceOptions = () => {
        return (
            <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '16px' }}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                    }}
                >
                    {serviceOptions.map((option, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '1rem',
                                borderRadius: '12px',
                                backgroundColor: '#ffffff',
                                boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.1)',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                border: '2px solid transparent',
                                position: 'relative',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0px 12px 24px rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0px 6px 12px rgba(0, 0, 0, 0.1)';
                            }}
                        >
                            <input
                                type="checkbox"
                                value={option}
                                checked={selectedServices.includes(option)}
                                onChange={(e) => handleCheckboxChange(e.target.value, e.target.checked)}
                                id={`service-option-${index}`}
                                style={{
                                    marginRight: '1rem',
                                    accentColor: '#007bff',
                                    transform: 'scale(1.2)',
                                    cursor: 'pointer',
                                }}
                            />
                            <span style={{ fontSize: '18px' }}>{option}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const handleCheckboxChange = (value: string, isChecked: boolean) => {
        if (isChecked) {
            setSelectedServices([...selectedServices, value]);
        } else {
            setSelectedServices(selectedServices.filter((service) => service !== value));
        }
    };

    const navigate = useNavigate();
    const db = getFirestore();
    const { state } = useLocation(); // Use the useLocation hook to access location state

    useEffect(() => {
        if (state && state.editData) {
            setEditData(state.editData);
            setDriverName(state.editData.driverName || '');
            setIdnumber(state.editData.idnumber || '');
            setPhone(state.editData.phone || '');
            setPassword(state.editData.password || '');
            // setCompanyName(state.editData.companyName || '');
            setConfirmPassword(state.editData.confirmPassword || '');
            setServiceVehicle(state.editData.serviceVehicle || '');
            setPersonalPhone(state.editData.personalphone || '');
            setSalaryPerKm(state.editData.salaryPerKm || '');
            setBasicSalaryKm(state.editData.basicSalaryKm || '');

            setSelectedServices(state.editData.selectedServices || '');

            setBasicSalaries(state.editData.basicSalaries || '');
            setImagePreview(state.editData.profileImageUrl || '');
            // setAdvancePayment(state.editData.advancePayment || '');
        }
    }, [state]);
    const checkPhoneUnique = async (phone: string): Promise<boolean> => {
        const db = getFirestore();
        const uid = sessionStorage.getItem('uid');
        const driversRef = collection(db, `user/${uid}/driver`);
        const querySnapshot = await getDocs(driversRef);
        let isUnique = true;
    
        querySnapshot.forEach((doc) => {
            if (doc.data().phone === phone) {
                isUnique = false;
            }
        });
    
        return isUnique;
    };
    const addOrUpdateItem = async () => {
        let isValid = true;

        let isPhoneUnique = true;
        if (!editData || editData.phone !== phone) {
            isPhoneUnique = await checkPhoneUnique(phone);
        }

        if (!phone) {
            setPhoneError('Phone number is required');
            isValid = false;
        } else if (!/^[6-9]\d{9}$/.test(phone)) {
            setPhoneError('Enter a valid phone number');
            isValid = false;
        } else if (!isPhoneUnique) {
            setPhoneError('Phone number already used');
            isValid = false;
        } else {
            setPhoneError('');
        }

        if (!password) {
            setPasswordError('Password is required');
            isValid = false;
        } else if (password.length < 4) {
            setPasswordError('Min 4 characters');
            isValid = false;
        } else {
            setPasswordError('');
        }

        if (password !== confirmPassword) {
            setConfirmPasswordError('Password and confirm password do not match');
            isValid = false;
        } else {
            setConfirmPasswordError('');
        }
        if (selectedServices.length === 0) {
            setServiceTypeError('At least one service type is required');
            isValid = false;
        } else {
            setServiceTypeError('');
        }

        if (!isValid) return;

        try {
            let profileImageUrl = '';

            if (profileImage) {
                const storageRef = ref(storage, `profile_images/${profileImage.name}`);
                await uploadBytes(storageRef, profileImage);
                profileImageUrl = await getDownloadURL(storageRef);
            } else if (editData?.profileImageUrl) {
                profileImageUrl = editData.profileImageUrl;
            }

            const itemData = {
                driverName,
                idnumber,
                phone,
                personalphone,
                salaryPerKm,
                basicSalaryKm,
                selectedServices,
                companyName,
                serviceVehicle,
                basicSalaries,
                password,
                confirmPassword,
                profileImageUrl,
                advancePayment,
                advance

            };

            if (editData) {
                const docRef = doc(db, `user/${uid}/driver`, editData.id);
                await updateDoc(docRef, itemData);
                console.log('Document updated');
            } else {
                const docRef = await addDoc(collection(db, `user/${uid}/driver`), itemData);
                console.log('Document written with ID: ', docRef.id);
            }

            navigate('/users/driver');
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
                    <span>Driver Account Settings</span>
                </li>
            </ul>
            <div className="pt-5">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Driver Details</h5>
                </div>
                <div></div>

                <div>
                    <form className="border border-[#ebedf2] dark:border-[#191e3a] rounded-md p-4 mb-5 bg-white dark:bg-black">
                        <h6 className="text-lg font-bold mb-5">General Information</h6>
                        <div className="flex flex-col sm:flex-row">
                            <div className="ltr:sm:mr-4 rtl:sm:ml-4 w-full sm:w-2/12 mb-5">
                                <img src={imagePreview || defualtImage} alt="Profile" className="w-20 h-20 md:w-32 md:h-32 rounded-full object-cover mx-auto" />
                            </div>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="driverName">Driver Name</label>
                                    <input id="driverName" type="text" placeholder="Enter driver Name" className="form-input" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
                                </div>

                                <div>
                                    <label htmlFor="idnumber">ID number</label>
                                    <input id="idnumber" type="idnumber" className="form-input" value={idnumber} onChange={(e) => setIdnumber(e.target.value)} />
                                </div>
                                <div>
                                    <label htmlFor="phone">Phone</label>
                                    <input id="phone" type="number" placeholder="phone number" className={`${styles.formInput} form-input`} value={phone} onChange={(e) => setPhone(e.target.value)} />
                                    {phoneError && <span className={`${styles.error}`}>{phoneError}</span>}
                                </div>
                                <div>
                                    <label htmlFor="personalphone">Personal PhoneNumber</label>
                                    <input id="personalphone" type="number" className={`${styles.formInput} form-input`} value={personalphone} onChange={(e) => setPersonalPhone(e.target.value)} />
                                </div>
                                <div>
                                    <label htmlFor="password">Password</label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter password"
                                            className="form-input"
                                            value={password}
                                            onChange={handlePasswordChange}
                                        />
                                        <span className="absolute end-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </span>
                                    </div>

                                    {passwordError && <span className={`${styles.error}`}>{passwordError}</span>}
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="Confirm password"
                                            className="form-input"
                                            value={confirmPassword}
                                            onChange={handleConfirmPasswordChange}
                                        />
                                        <span className="absolute end-3 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                        </span>
                                    </div>

                                    <br />
                                    <div></div>
                                    {confirmPasswordError && <span className={`${styles.error}`}>{confirmPasswordError}</span>}
                                </div>

                                <div>
                                    <label style={{ cursor: 'pointer' }} className="flex items-center" onClick={() => setShowTable(true)}>
                                        <IconPlusCircle className="me-2" />
                                        Add Service Type
                                    </label>
                                    {showTable && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {renderServiceOptions()}
                                            <button
                                                style={{
                                                    padding: '8px 16px', // Increase padding for button
                                                    backgroundColor: '#007bff',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '5px', // Increase border radius for button
                                                    cursor: 'pointer',
                                                    display: 'block', // Ensure button takes full width
                                                    margin: 'auto', // Center the button horizontally
                                                }}
                                                className="mt-2"
                                                onClick={() => setShowTable(false)}
                                            >
                                                Done
                                            </button>
                                        </div>
                                    )}{' '}
                                    {serviceTypeError && <span className={`${styles.error}`}>{serviceTypeError}</span>}
                                </div>
                                <div>
                                    <label htmlFor="profileImage">Profile Image</label>
                                    <input id="profileImage" type="file" accept=".jpg, .jpeg, .png" onChange={handleProfileImageChange} className="form-input" />
                                </div>
                                <div className={`${styles.tableContainer} sm:col-span-2 mt-3`}>
                                    {selectedServices.length > 0 && (
                                        <table style={{ marginTop: '20px', borderCollapse: 'collapse', width: '100%' }}>
                                            <thead>
                                                <tr>
                                                    <th className={styles.tableCell}>Service Type</th>
                                                    <th className={styles.tableCell}>Basic Amount</th>
                                                    <th className={styles.tableCell}>KM for Basic Salary</th>
                                                    <th className={styles.tableCell}>SalaryPerKm</th>
                                                    <th className={styles.tableCell}>Vehicle Number</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedServices.map((service, index) => (
                                                    <tr key={index}>
                                                        <td className={styles.tableCell}>{service}</td>
                                                        <td className={styles.tableCell}>
                                                            <input
                                                                className={`${styles.formInput} form-input`}
                                                                type="number"
                                                                value={basicSalaries[service] || ''}
                                                                placeholder="Enter Basic Amount"
                                                                onChange={(e) => handleBasicSalaryChange(service, e)}
                                                            />
                                                        </td>
                                                        <td className={`${styles.tableCell} ${styles.inputWrapper} relative`}>
                                                            <input
                                                                className={`${styles.formInput} form-input`}
                                                                type="number"
                                                                value={basicSalaryKm[service] || ''}
                                                                onChange={(e) => handleBasicSalaryKmChange(service, e)}
                                                            />
                                                            <span style={{ position: 'absolute', right: '20px' }}>/km</span>
                                                        </td>
                                                        <td className={`${styles.tableCell} ${styles.inputWrapper} relative`}>
                                                            <input
                                                                className={`${styles.formInput} form-input`}
                                                                type="number"
                                                                value={salaryPerKm[service] || ''}
                                                                onChange={(e) => handleSalaryPerKmChange(service, e)}
                                                            />
                                                            <span style={{ position: 'absolute', right: '20px' }}>/km</span>
                                                        </td>
                                                        <td className={styles.tableCell}>
                                                            <input
                                                                className={`${styles.formInput} form-input`}
                                                                type="text"
                                                                value={serviceVehicle[service] || ''}
                                                                onChange={(e) => handleServiceVehicle(service, e)}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                                <button type="button" className="btn btn-primary mt-3" onClick={addOrUpdateItem}>
                                    {editData ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DriverAdd;
