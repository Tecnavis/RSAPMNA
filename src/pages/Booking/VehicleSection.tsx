import { collection, doc, getDoc, getDocs, getFirestore, query, where } from 'firebase/firestore';
import React, { useState, useEffect, useRef } from 'react';
interface VehicleSectionProps {
    showroomId: string | null; // Accept showroom ID
    onUpdateTotalSalary: (newSalary: number) => void;
    insuranceAmountBody: string;
    onInsuranceAmountBodyChange: (amount: string) => void;
    serviceCategory: string;
    updatedTotalSalary: number;
    onServiceCategoryChange: (category: string) => void;
    onAdjustValueChange: (value: string) => void;
    adjustValue: string;
    onInsuranceChange: (insurance: string) => void;
    bodyShope: string;
    onApplyAdjustment: () => void;
}

interface ShowRoomState {
    availableServices: string;
    hasInsurance: string;
    lifting: string;
    insuranceAmount: string;
    insurance: string;
    insuranceAmountBody: string;
}
const VehicleSection: React.FC<VehicleSectionProps> = ({
    showroomId,
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
    onApplyAdjustment,
}) => {
    const [showRoom, setShowRoom] = useState<ShowRoomState>({
        availableServices: serviceCategory || '',
        hasInsurance: '',
        lifting: '',
        insuranceAmount: '',
        insurance: bodyShope || '', // Initialize insurance with bodyShope
        insuranceAmountBody: insuranceAmountBody || '', // Allow insurance amount to be an empty string for manual entry
    });
    const [changedInsuranceAmountBody, setChangedInsuranceAmountBody] = useState<string>('');
    const [showNotification, setShowNotification] = useState<boolean>(false);
    const [isButtonGreen, setIsButtonGreen] = useState(false); // State to change button color
    const role = sessionStorage.getItem('role');
    const staffRole = sessionStorage.getItem('staffRole');

    const adjustmentApplied = useRef<boolean>(false);
    const uid = sessionStorage.getItem('uid') || '';
    const db = getFirestore();
    const handleApply = () => {
        onApplyAdjustment();
    };
    const fetchInsuranceAmountBody = async () => {
        if (changedInsuranceAmountBody || !showroomId) return;
    
        const db = getFirestore();
        const showroomDocRef = doc(db, `user/${uid}/showroom`, showroomId); // Correct reference
    
        try {
            const showroomSnapshot = await getDoc(showroomDocRef);
    
            if (showroomSnapshot.exists()) {
                const showroomData = showroomSnapshot.data();
                console.log('Fetched insuranceAmountBody:', showroomData);
    
                if (showroomData.insuranceAmountBody) {
                    setShowRoom((prevShowRoom) => ({
                        ...prevShowRoom,
                        insuranceAmountBody: String(showroomData.insuranceAmountBody),
                    }));
                    onInsuranceAmountBodyChange(showroomData.insuranceAmountBody);
                } else {
                    console.log('No insuranceAmountBody found in the document');
                }
            } else {
                console.log('No matching showroom found for the given ID');
            }
        } catch (error) {
            console.error('Error fetching showroom data:', error);
        }
    };
    
    // Use it inside useEffect correctly
    useEffect(() => {
        if (showroomId) {
            fetchInsuranceAmountBody();
        }
    }, [showroomId, changedInsuranceAmountBody, onInsuranceAmountBodyChange]);
    
    useEffect(() => {
        if (bodyShope === 'insurance' && showroomId) {
            // Fetch and set showroom's insuranceAmountBody
            fetchInsuranceAmountBody();
        } else if (bodyShope === 'both') {
            // Allow manual input for insuranceAmountBody
            setShowRoom((prev) => ({ ...prev, insuranceAmountBody: changedInsuranceAmountBody }));
        }
    }, [bodyShope, showroomId, changedInsuranceAmountBody]);
    useEffect(() => {
        if (bodyShope !== showRoom.insurance) {
            setShowRoom((prevShowRoom) => ({
                ...prevShowRoom,
                insurance: bodyShope,
                // <-- Update insurance field with bodyShope
            }));
        }
    }, [bodyShope]);
    useEffect(() => {
        if (!changedInsuranceAmountBody) { // Only update if the user hasn't already typed something
            setChangedInsuranceAmountBody(insuranceAmountBody);
        }
    }, [insuranceAmountBody]);
    
    useEffect(() => {
        if (serviceCategory !== showRoom.availableServices) {
            setShowRoom((prevShowRoom) => ({
                ...prevShowRoom,
                availableServices: serviceCategory,
            }));
        }
    }, [serviceCategory]);

    const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        console.log('valuess', value);
        setShowRoom((prevShowRoom) => ({
            ...prevShowRoom,
            availableServices: value,
            insurance: '',
        }));

        const validServices = ['Body Shop', 'Service Center', 'Showroom', 'lifting'];
        if (validServices.includes(value)) {
            onServiceCategoryChange(value);
        }
    };
    // -=======------------------------------------------------
    const handleBodyInsuranceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
    
        setShowRoom((prevShowRoom) => {
            const isNewInsuranceType = prevShowRoom.insurance !== value;
            return {
                ...prevShowRoom,
                insurance: value,
                insuranceAmountBody: isNewInsuranceType ? '' : prevShowRoom.insuranceAmountBody,
            };
        });
    
        if (showRoom.insurance !== value) {
            setChangedInsuranceAmountBody('');
            onInsuranceAmountBodyChange('');
        }
    
        onInsuranceChange(value);
    };
    
    const handleChangedInsuranceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;

        setChangedInsuranceAmountBody(value);
        setShowRoom((prevShowRoom) => ({
            ...prevShowRoom,
            insuranceAmountBody: value, // Allow manual updates
        }));

        onInsuranceAmountBodyChange(value); // Notify parent
    };
    const handleAdjustValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        onAdjustValueChange(value);
        if (value) {
            setShowNotification(true); // Show the notification when value is entered
            setIsButtonGreen(false); // Reset button color to default
        } else {
            setShowNotification(false); // Hide notification if input is cleared
        }
    };

    const applyAdjustment = (event?: React.MouseEvent<HTMLButtonElement>) => {
        // Prevent default form behavior if applicable
        if (event) event.preventDefault();

        const adjustedSalary = parseFloat(adjustValue);

        if (adjustedSalary > updatedTotalSalary) {
            // Call the function to update the total salary
            onUpdateTotalSalary(adjustedSalary);
            adjustmentApplied.current = true;
            setIsButtonGreen(true); // Change button color to green
            setShowNotification(false);
        } else {
            // Show confirmation dialog
            const confirmAction = window.confirm('Adjusting salary below the current total. Are you sure?');

            if (confirmAction) {
                let passwordPromptMessage = 'Enter password to apply the adjustment';
            let expectedPassword = 'Adjust';

            // If the role is admin or secondary_admin, set the expected password to 'RSA@123'
            if (role === 'admin' || staffRole === 'secondary admin'|| staffRole === 'verifier') {
                passwordPromptMessage = 'Enter password to apply the adjustment: Password=RSA@Adjust';
                expectedPassword = 'RSA@Adjust';
            }

            const password = prompt(passwordPromptMessage);

            if (password === expectedPassword) {
                // Call the function to update the total salary
                onUpdateTotalSalary(adjustedSalary);
                adjustmentApplied.current = true;
                setIsButtonGreen(true); // Change button color to green
                setShowNotification(false);
                } else {
                    alert('Incorrect password. Adjustment not applied.');
                }
            } else {
                alert('Adjustment not applied.');
            }
        }
    };
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        // Call both functions
        applyAdjustment(event); // First, apply the adjustment logic
        handleApply(); // Then, trigger the parent callback to handle additional logic
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
                        {showRoom.insurance === 'both' && (
                            <div className="mt-2" style={{ marginTop: '10px', fontSize: '0.9em' }}>
                                <label style={{ marginRight: '10px', fontSize: '1em', color: '#333' }}>Insurance Amount (if the insurance amount changes!):</label>
                                <input
                                    type="text"
                                    name="changedInsuranceAmountBody"
                                    value={changedInsuranceAmountBody} // Bind state to input
                                    onChange={handleChangedInsuranceChange} // Update state and parent component
                                    style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
                                />

                                <div
                                    style={{
                                        marginTop: '5px',
                                        color: '#ff0000',
                                        fontSize: '0.85em',
                                    }}
                                >
                                    Note: This is the billing Amount (insurance amount) send to the showroom!
                                </div>
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
                <label className="mr-4" style={{ marginRight: '10px', fontSize: '1em', color: '#333' }}>
                    <input
                        type="radio"
                        name="lifting"
                        value="lifting"
                        checked={showRoom.availableServices === 'lifting'}
                        onChange={handleServiceChange}
                        className="mr-1"
                        style={{ marginRight: '5px' }}
                    />
                    Lifting
                </label>
                <br />
                <div>
                    <div className="flex items-center ml-6">
                        <label style={{ fontSize: '1.5em', color: 'red', marginRight: '10px' }}>Adjustment Value:</label>
                        <input type="text" value={adjustValue} onChange={handleAdjustValueChange} style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }} />
                        <button
                            onClick={handleClick}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '5px',
                                backgroundColor: isButtonGreen ? 'green' : 'red',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                marginLeft: '10px',
                            }}
                        >
                            Apply
                        </button>
                        {showNotification && !isButtonGreen && <span style={{ color: 'red', marginLeft: '10px' }}>Click the apply button</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleSection;
