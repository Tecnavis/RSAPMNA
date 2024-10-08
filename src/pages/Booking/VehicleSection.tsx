import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import React, { useState, useEffect, useRef } from 'react';

const VehicleSection = ({
    showroomLocation,
    totalSalary,
    onUpdateTotalSalary,
    insuranceAmountBody,
    onInsuranceAmountBodyChange,
    serviceCategory,
    updatedTotalSalary,
    onServiceCategoryChange,
    onAdjustValueChange,
    adjustValue,
    onInsuranceChange,
    bodyShope,
}) => {
    const [showRoom, setShowRoom] = useState({
        availableServices: serviceCategory || '',
        hasInsurance: '',
        insuranceAmount: '',
        insurance: bodyShope || '', // Initialize insurance with bodyShope
        insuranceAmountBody: insuranceAmountBody || '', // Allow insurance amount to be an empty string for manual entry
    });
    // const [updatedTotalSalary, setUpdatedTotalSalary] = useState('');
    const adjustmentApplied = useRef(false);
    const uid = sessionStorage.getItem('uid');
    //    ------------------------------------------------------------
    const db = getFirestore();

    useEffect(() => {
        const fetchInsuranceAmountBody = async () => {
            const showroomRef = collection(db, `user/${uid}/showroom`);
            const q = query(showroomRef, where('Location', '==', showroomLocation));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const showroomData = querySnapshot.docs[0].data(); // Get the first matching document
                console.log('Fetched insuranceAmountBody:', showroomData); // Log the value

                if (showroomData.insuranceAmountBody) {
                    console.log('Fetched insuranceAmountBody:', showroomData.insuranceAmountBody); // Log the value

                    setShowRoom((prevShowRoom) => ({
                        ...prevShowRoom,
                        insuranceAmountBody: showroomData.insuranceAmountBody,
                    }));
                    onInsuranceAmountBodyChange(showroomData.insuranceAmountBody);
                } else {
                    console.log('No insuranceAmountBody found in the document');
                }
            } else {
                console.log('No matching showroom found for the given location');
            }
        };

        if (showroomLocation) {
            fetchInsuranceAmountBody();
        }
    }, [showroomLocation, onInsuranceAmountBodyChange]);
    useEffect(() => {
        if (bodyShope !== showRoom.insurance) {
            setShowRoom((prevShowRoom) => ({
                ...prevShowRoom,
                insurance: bodyShope, // <-- Update insurance field with bodyShope
            }));
        }
    }, [bodyShope]);
    useEffect(() => {
        if (serviceCategory !== showRoom.availableServices) {
            setShowRoom((prevShowRoom) => ({
                ...prevShowRoom,
                availableServices: serviceCategory,
            }));
        }
    }, [serviceCategory]);

    const handleServiceChange = (e) => {
        const { value } = e.target;
        setShowRoom((prevShowRoom) => ({
            ...prevShowRoom,
            availableServices: value,
            insurance: '',
        }));

        if (value === 'Body Shop') {
            onServiceCategoryChange(value);
        }
    };

    const handleBodyInsuranceChange = (e) => {
        const { value } = e.target;
        setShowRoom((prevShowRoom) => ({
            ...prevShowRoom,
            insurance: value,
        }));
        onInsuranceChange(value);
    };

    const handleInsuranceAmountChange = (e) => {
        const { value } = e.target;
        setShowRoom((prevShowRoom) => ({
            ...prevShowRoom,
            insuranceAmountBody: value, // Update the local state
        }));
        onInsuranceAmountBodyChange(value);
    };

    const handleAdjustValueChange = (e) => {
        const { value } = e.target;
        onAdjustValueChange(value);
    };
    const applyAdjustment = (event) => {
        // Prevent default form behavior if applicable
        if (event) event.preventDefault();
    
        const adjustedSalary = parseFloat(adjustValue);
    
        if (adjustedSalary > updatedTotalSalary) {
            // Call the function to update the total salary
            onUpdateTotalSalary(adjustedSalary);
            adjustmentApplied.current = true;
        } else {
            // Show confirmation dialog
            const confirmAction = window.confirm('Adjusting salary below the current total. Are you sure?');
            
            if (confirmAction) {
                const password = prompt('Enter password to apply the adjustment: Password=Adjust');
                
                if (password === 'Adjust') {
                    // Call the function to update the total salary
                    onUpdateTotalSalary(adjustedSalary);
                    adjustmentApplied.current = true;
                } else {
                    alert('Incorrect password. Adjustment not applied.');
                }
            } else {
                alert('Adjustment not applied.');
            }
        }
    };
    

    return (
        <div className="mb-5">
            <h1>Service Category</h1>
            <div className="mb-2" style={{ alignItems: 'center', border: '1px solid #ccc', padding: '10px', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                <label className="mr-4" style={{ marginRight: '10px', fontSize: '1em', color: '#333' }}>
                    <input
                        type="radio"
                        name="availableServices"
                        value="Service Center"
                        checked={showRoom.availableServices === 'Service Center'}
                        onChange={handleServiceChange}
                        className="mr-1"
                        style={{ marginRight: '5px' }}
                    />
                    Service Center
                </label>
                <label className="mr-4" style={{ marginRight: '10px', fontSize: '1em', color: '#333' }}>
                    <input
                        type="radio"
                        name="availableServices"
                        value="Body Shop"
                        checked={showRoom.availableServices === 'Body Shop'}
                        onChange={handleServiceChange}
                        className="mr-1"
                        style={{ marginRight: '5px' }}
                    />
                    Accident
                </label>
                {showRoom.availableServices === 'Body Shop' && (
                    <div className="mb-2" style={{ marginLeft: '10px', backgroundColor: '#ffeeba', padding: '10px', borderRadius: '5px', fontSize: '0.9em' }}>
                        <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>Payment Method</p>
                        <label className="mr-2" style={{ marginRight: '10px', fontSize: '1em' }}>
                            <input
                                type="radio"
                                name="insurance"
                                value="insurance"
                                checked={showRoom.insurance === 'insurance'}
                                onChange={handleBodyInsuranceChange}
                                className="mr-1"
                                style={{ marginRight: '5px' }}
                            />
                            Insurance
                        </label>
                        <label className="mr-2" style={{ marginRight: '10px', fontSize: '1em' }}>
                            <input
                                type="radio"
                                name="insurance"
                                value="ready"
                                checked={showRoom.insurance === 'ready'}
                                onChange={handleBodyInsuranceChange}
                                className="mr-1"
                                style={{ marginRight: '5px' }}
                            />
                            Ready Payment
                        </label>
                        <label className="mr-2" style={{ marginRight: '10px', fontSize: '1em' }}>
                            <input
                                type="radio"
                                name="insurance"
                                value="both"
                                checked={showRoom.insurance === 'both'}
                                onChange={handleBodyInsuranceChange}
                                className="mr-1"
                                style={{ marginRight: '5px' }}
                            />
                            Both
                        </label>
                        {showRoom.insurance === 'insurance' && (
                            <div className="mt-2" style={{ marginTop: '10px', fontSize: '0.9em' }}>
                                <label style={{ marginRight: '10px', fontSize: '1em', color: '#333' }}>Insurance Amount:</label>
                                <input
                                    type="number"
                                    name="insuranceAmount"
                                    value={showRoom.insuranceAmountBody} // Bind state to input
                                    onChange={handleInsuranceAmountChange} // Update state and parent component
                                    style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
                                />
                            </div>
                        )}
                    </div>
                )}
                <label className="mr-4" style={{ marginRight: '10px', fontSize: '1em', color: '#333' }}>
                    <input
                        type="radio"
                        name="availableServices"
                        value="Showroom"
                        checked={showRoom.availableServices === 'Showroom'}
                        onChange={handleServiceChange}
                        className="mr-1"
                        style={{ marginRight: '5px' }}
                    />
                    Showroom
                </label>
            </div>
            <br />
            <div>
                <div>
                    <label style={{ fontSize: '1em', color: '#333' }}>Adjustment Value:</label>
                    <input type="number" value={adjustValue} onChange={handleAdjustValueChange} style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }} />
                    <button
                        onClick={applyAdjustment}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '5px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            marginLeft: '10px',
                        }}
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VehicleSection;
