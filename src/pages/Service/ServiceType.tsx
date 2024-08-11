import React, { useEffect, useRef, useState } from 'react';
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';

function ServiceType() {
  const [serviceTypes, setServiceTypes] = useState([]);
  const [newServiceType, setNewServiceType] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [editing, setEditing] = useState(false);
  const [currentService, setCurrentService] = useState({ id: '', name: '', salary: '', basicSalaryKM: '', salaryPerKM: '' });
  const [newBasicSalaryKM, setNewBasicSalaryKM] = useState('');
  const [newSalaryPerKM, setNewSalaryPerKM] = useState('');
  const [errors, setErrors] = useState({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const editRef = useRef(null);

  useEffect(() => {
    const fetchServices = async () => {
      const db = getFirestore();
      const serviceRef = collection(db, 'service');
      try {
        const snapshot = await getDocs(serviceRef);
        const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setServiceTypes(services);
      } catch (error) {
        console.error('Error fetching service types:', error);
      }
    };
    fetchServices();
  }, []);

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

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

    setErrors(newErrors);
    return isValid;
  };

  const addServiceType = async () => {
    setFormSubmitted(true);
    if (!validateForm()) {
      return;
    }

    const newService = {
      name: newServiceType,
      salary: newSalary,
      basicSalaryKM: newBasicSalaryKM,
      salaryPerKM: newSalaryPerKM
    };

    try {
      const db = getFirestore();
      const serviceRef = collection(db, 'service');
      const docRef = await addDoc(serviceRef, newService);
      setServiceTypes([...serviceTypes, { ...newService, id: docRef.id }]);
      setNewServiceType('');
      setNewSalary('');
      setNewBasicSalaryKM('');
      setNewSalaryPerKM('');
      setFormSubmitted(false); // Reset form submission state
    } catch (error) {
      console.error('Error adding service type:', error);
    }
  };

  const deleteServiceType = async (id) => {
    const confirmDeletion = window.prompt('To confirm deletion, please type the password "SERVICE":');
    if (confirmDeletion !== 'SERVICE') {
      alert('Incorrect password. Deletion canceled.');
      return;
    }

    try {
      const db = getFirestore();
      const serviceRef = doc(db, 'service', id);
      await deleteDoc(serviceRef);
      setServiceTypes(serviceTypes.filter(service => service.id !== id));
    } catch (error) {
      console.error('Error deleting service type:', error);
      alert(`Error deleting service: ${error.message}`);
    }
  };

  const editServiceType = (service) => {
    setEditing(true);
    setCurrentService({ 
      id: service.id, 
      name: service.name, 
      salary: service.salary, 
      basicSalaryKM: service.basicSalaryKM, 
      salaryPerKM: service.salaryPerKM 
    });
    editRef.current.scrollIntoView({ behavior: 'smooth' });

  };

  const updateServiceType = async () => {
    const { id, name, salary, basicSalaryKM, salaryPerKM } = currentService;
    try {
      const db = getFirestore();
      const serviceRef = doc(db, 'service', id);
      await updateDoc(serviceRef, { name, salary, basicSalaryKM, salaryPerKM });
      setServiceTypes(serviceTypes.map(service => service.id === id ? { ...service, name, salary, basicSalaryKM, salaryPerKM } : service));
      setEditing(false);
      setCurrentService({ id: '', name: '', salary: '', basicSalaryKM: '', salaryPerKM: '' });
    } catch (error) {
      console.error('Error updating service type:', error);
      alert(`Error updating service: ${error.message}`);
    }
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <table style={{ width: '100%', marginBottom: '20px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>Service Name</th>
            <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>First Kilometers</th>
            <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>Additional Amount For Each ONE Km</th>
            <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>First Kilometers Amount</th>
            <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {serviceTypes.map((service, index) => (
            <tr key={index}>
              <td style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd' }}>{service.name}</td>
              <td style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd' }}>{service.basicSalaryKM}</td>
              <td style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd' }}>{service.salaryPerKM}</td>
              <td style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd' }}>{service.salary}</td>
              <td style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd' }}>
                <button style={{ padding: '5px 10px', marginRight: '5px', backgroundColor: 'blue', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }} onClick={() => editServiceType(service)}>
                  Edit
                </button>
                <button style={{ padding: '5px 10px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }} onClick={() => deleteServiceType(service.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editing && (
        <div ref={editRef}>
                    <input
            type="text"
            value={currentService.name}
            onChange={(e) => setCurrentService({ ...currentService, name: e.target.value })}
            style={{ textAlign: 'left', padding: '8px', border: '3px solid #ddd', backgroundColor: '#f2f2f2' }} />
          <input
            type="text"
            value={currentService.basicSalaryKM}
            placeholder="KM for Basic Salary"
            onChange={(e) => setCurrentService({ ...currentService, basicSalaryKM: e.target.value })}
            style={{ textAlign: 'left', padding: '8px', border: '3px solid #ddd', backgroundColor: '#f2f2f2' }} />
          <input
            type="text"
            value={currentService.salaryPerKM}
            placeholder="Salary per KM"
            onChange={(e) => setCurrentService({ ...currentService, salaryPerKM: e.target.value })}
            style={{ textAlign: 'left', padding: '8px', border: '3px solid #ddd', backgroundColor: '#f2f2f2' }} />
          <input
            type="text"
            value={currentService.salary}
            onChange={(e) => setCurrentService({ ...currentService, salary: e.target.value })}
            style={{ textAlign: 'left', padding: '8px', border: '3px solid #ddd', backgroundColor: '#f2f2f2' }} />
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginLeft: '5px'
            }}
            onClick={updateServiceType}
          >
            Update
          </button>
        </div>
      )}
      <div>
        <input
          type="text"
          placeholder="New Service Name"
          value={newServiceType}
          onChange={e => setNewServiceType(e.target.value)}
          style={{ textAlign: 'left', padding: '8px', border: '3px solid #ddd', backgroundColor: '#f2f2f2', marginTop: '20px' }} />
        {formSubmitted && !newServiceType && <span style={{ color: 'red' }}>Service Type is required</span>}

        <input
          type="text"
          placeholder="First Kilometers"
          value={newBasicSalaryKM}
          onChange={e => setNewBasicSalaryKM(e.target.value)}
          style={{ textAlign: 'left', padding: '8px', border: '3px solid #ddd', backgroundColor: '#f2f2f2' }} />
        {formSubmitted && !newBasicSalaryKM && <span style={{ color: 'red' }}>Basic Salary KM is required</span>}

        <input
          type="text"
          placeholder="Additional Amount For Each ONE Km"
          value={newSalaryPerKM}
          onChange={e => setNewSalaryPerKM(e.target.value)}
          style={{ textAlign: 'left', padding: '8px', border: '3px solid #ddd', backgroundColor: '#f2f2f2' }} />
        {formSubmitted && !newSalaryPerKM && <span style={{ color: 'red' }}>Salary Per KM is required</span>}

        <input
          type="text"
          placeholder="First Kilometers Amount"
          value={newSalary}
          onChange={e => setNewSalary(e.target.value)}
          style={{ textAlign: 'left', padding: '8px', border: '3px solid #ccc', backgroundColor: '#f2f2f2' }} />
        {formSubmitted && !newSalary && <span style={{ color: 'red' }}>Salary is required</span>}

        <button
          onClick={addServiceType}
          style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginLeft: "5px" }}
        >
          Add Service Type
        </button>
      </div>
    </div>
  );
}

export default ServiceType;
