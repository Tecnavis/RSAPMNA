import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import styles from './serviceType.module.css';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconPencil from '../../components/Icon/IconPencil';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import { Button } from '@mui/material';
import ConfirmationModal from '../Users/ConfirmationModal/ConfirmationModal'; // Import the modal component
import { useNavigate } from 'react-router-dom';

const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
};
interface ServiceType {
    id: string;
    name: string;
    salary: string;
    basicSalaryKM: string;
    salaryPerKM: string;
    expensePerKM: string;  
}

interface Errors {
    newServiceType?: string;
    newSalary?: string;
    newBasicSalaryKM?: string;
    newSalaryPerKM?: string;
    newExpensePerKM?: string;  
}
const ServiceType: React.FC = () => {
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [newServiceType, setNewServiceType] = useState<string>('');
    const [newSalary, setNewSalary] = useState<string>('');
    const [newBasicSalaryKM, setNewBasicSalaryKM] = useState<string>('');
    const [newSalaryPerKM, setNewSalaryPerKM] = useState<string>('');
    const [newExpensePerKM, setNewExpensePerKM] = useState<string>('');  // New field
    const [currentService, setCurrentService] = useState<ServiceType | null>(null);
    const [errors, setErrors] = useState<Errors>({});
    const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
    const [open, setOpen] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isModalVisible, setModalVisible] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const uid = sessionStorage.getItem('uid');
    const navigate = useNavigate(); 
    useEffect(() => {
        const fetchServices = async () => {
            if (!uid) return; 

            const db = getFirestore();
            const serviceRef = collection(db, `user/${uid}/service`);
            try {
                const snapshot = await getDocs(serviceRef);
                const services = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ServiceType[];
                setServiceTypes(services);
            } catch (error) {
                console.error('Error fetching service types:', error);
            }
        };
        fetchServices();
    }, [uid]);

    const validateForm = (): boolean => {
        let isValid = true;
        const newErrors: Errors = {};

        if (!newServiceType.trim()) {
            newErrors.newServiceType = 'Service type is required';
            isValid = false;
        }

        if (!newBasicSalaryKM.trim()) {
            newErrors.newBasicSalaryKM = 'Basic salary per KM is required';
            isValid = false;
        }

        if (!newSalaryPerKM.trim()) {
            newErrors.newSalaryPerKM = 'Salary per KM is required';
            isValid = false;
        }

        if (!newSalary.trim()) {
            newErrors.newSalary = 'Salary is required';
            isValid = false;
        }
        
        if (!newExpensePerKM.trim()) {  // Validate new field
            newErrors.newExpensePerKM = 'Expense per KM is required';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };


    const handleOpen = (service: ServiceType | null = null) => {
        if (service) {
            setIsEditMode(true);
            setCurrentService(service);
            setNewServiceType(service.name);
            setNewSalary(service.salary);
            setNewBasicSalaryKM(service.basicSalaryKM);
            setNewSalaryPerKM(service.salaryPerKM);
            setNewExpensePerKM(service.expensePerKM); 
        } else {
            setIsEditMode(false);
            setCurrentService(null);
            setNewServiceType('');
            setNewSalary('');
            setNewBasicSalaryKM('');
            setNewSalaryPerKM('');
            setNewExpensePerKM('');
        }
        setErrors({});
        setFormSubmitted(false);
        setOpen(true);
    };
    const handleClose = () => setOpen(false);

    const addServiceType = async () => {
        setFormSubmitted(true);
        if (!validateForm()) {
            return;
        }

        const newService: Omit<ServiceType, 'id'> = {
            name: newServiceType,
            salary: newSalary,
            basicSalaryKM: newBasicSalaryKM,
            salaryPerKM: newSalaryPerKM,
            expensePerKM: newExpensePerKM,
        };

        try {
            if (!uid) return; // Ensure UID exists before adding

            const db = getFirestore();
            const serviceRef = collection(db, `user/${uid}/service`);
            const docRef = await addDoc(serviceRef, newService);
            setServiceTypes([...serviceTypes, { ...newService, id: docRef.id }]);
            handleClose();
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error adding service type:', error.message);
            } else {
                console.error('Unknown error adding service type:', error);
            }
        }
    };

    const updateServiceType = async () => {
        setFormSubmitted(true);
        if (!validateForm()) {
            return;
        }

        if (!currentService) return;

        const { id } = currentService;
        const updatedService = {
            name: newServiceType,
            salary: newSalary,
            basicSalaryKM: newBasicSalaryKM,
            salaryPerKM: newSalaryPerKM,
            expensePerKM: newExpensePerKM,
        };

        try {
            if (!uid) return; // Ensure UID exists before updating

            const db = getFirestore();
            const serviceRef = doc(db, `user/${uid}/service`, id);
            await updateDoc(serviceRef, updatedService);
            setServiceTypes(serviceTypes.map((service) => (service.id === id ? { ...service, ...updatedService } : service)));
            handleClose();
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error updating service type:', error.message);
            } else {
                console.error('Unknown error updating service type:', error);
            }
        }
    };

    const handleDelete = async (id: string) => {
        try {
            if (!uid) return; // Ensure UID exists before deleting

            const db = getFirestore();
            const serviceRef = doc(db, `user/${uid}/service`, id);
            await deleteDoc(serviceRef);
            setServiceTypes(serviceTypes.filter((service) => service.id !== id));
            setModalVisible(false);
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error deleting service type:', error.message);
                alert(`Error deleting service: ${error.message}`);
            } else {
                console.error('Unknown error deleting service type:', error);
            }
        }
    };

    const openDeleteModal = (item: string) => {
        setItemToDelete(item);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setItemToDelete(null);
    };

    return (
        <div>
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12 my-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <button className={styles.addButton} onClick={() => handleOpen()}>
                            Add Service Type
                        </button>
                    </div>
                </div>
            </div>
            <table className={styles.tableContainer}>
                <thead>
                    <tr>
                        <th className={styles.tableHeader}>Service Name</th>
                        <th className={styles.tableHeader}>First Kilometers</th>
                        <th className={styles.tableHeader}>Additional Amount Per Km</th>
                        <th className={styles.tableHeader}>First Kilometers Amount</th>
                        <th className={styles.tableHeader}>Expense per KM</th>  {/* New column */}

                        <th className={styles.tableHeader}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {serviceTypes.map((service, index) => (
                        <tr key={index} className={styles.tableRow}>
                            <td className={styles.tableCell} data-label="Service Name">
                                <span>{service.name}</span>
                            </td>
                            <td className={styles.tableCell} data-label="First Kilometers">
                                <span>{service.basicSalaryKM}</span>
                            </td>
                            <td className={styles.tableCell} data-label="Additional Amount Per Km">
                                <span>{service.salaryPerKM}</span>
                            </td>
                            <td className={styles.tableCell} data-label="First Kilometers Amount">
                                <span>{service.salary}</span>
                            </td>
                            <td className={styles.tableCell} data-label="Expense per KM">
                                <span>{service.expensePerKM}</span>  {/* New data display */}
                            </td>
                            <td className={styles.tableActions} data-label="Actions">
                                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '50%', justifyContent: 'center' }}>
                                    <button onClick={() => handleOpen(service)}>
                                        <IconPencil className="text-primary" />
                                    </button>
                                    <button onClick={() => openDeleteModal(service.id)}>
                                        <IconTrashLines className="text-danger" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Modal open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
                <Box sx={style}>
                    <div>
                        <label htmlFor="serviceName">Service Name</label>
                        <input id="serviceName" type="text" value={newServiceType} onChange={(e) => setNewServiceType(e.target.value)} className={`${styles.formInput} form-input`} />
                        {formSubmitted && errors.newServiceType && <span style={{ color: 'red' }}>{errors.newServiceType}</span>}
                    </div>
                    <div>
                        <label htmlFor="basicSalaryKM">First Kilometers</label>
                        <input id="basicSalaryKM" type="number" value={newBasicSalaryKM} onChange={(e) => setNewBasicSalaryKM(e.target.value)} className={`${styles.formInput} form-input`} />
                        {formSubmitted && errors.newBasicSalaryKM && <span style={{ color: 'red' }}>{errors.newBasicSalaryKM}</span>}
                    </div>
                    <div>
                        <label htmlFor="salaryPerKM">Additional Amount Per Km</label>
                        <input id="salaryPerKM" type="number" value={newSalaryPerKM} onChange={(e) => setNewSalaryPerKM(e.target.value)} className={`${styles.formInput} form-input`} />
                        {formSubmitted && errors.newSalaryPerKM && <span style={{ color: 'red' }}>{errors.newSalaryPerKM}</span>}
                    </div>
                    <div>
                        <label htmlFor="salary">First Kilometers Amount</label>
                        <input id="salary" type="number" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} className={`${styles.formInput} form-input`} />
                        {formSubmitted && errors.newSalary && <span style={{ color: 'red' }}>{errors.newSalary}</span>}
                    </div>
                     <div style={{ marginBottom: '16px' }}>
                            <label className={styles.label}>Expense per KM</label> {/* New input field */}
                            <input
                                type="text"
                                value={newExpensePerKM}
                                onChange={(e) => setNewExpensePerKM(e.target.value)}
                                className={styles.inputField}
                            />
                            {formSubmitted && errors.newExpensePerKM && <span className={styles.error}>{errors.newExpensePerKM}</span>}
                        </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '25px' }}>
                        <Button variant="outlined" color="error" onClick={handleClose}>
                            Close
                        </Button>
                        <Button variant="contained" color="success" onClick={isEditMode ? updateServiceType : addServiceType} className={styles.submitButton}>
                            {isEditMode ? 'Update Service' : 'Add Service'}
                        </Button>
                    </div>
                </Box>
            </Modal>
            <ConfirmationModal
    isVisible={isModalVisible}
    onConfirm={() => {
        if (itemToDelete) {
            handleDelete(itemToDelete);
        }
    }}
    onCancel={closeModal}
/>

        </div>
    );
}

export default ServiceType;
