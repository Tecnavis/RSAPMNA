import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ConfirmationModal = ({ isVisible, onConfirm, onCancel }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const role =sessionStorage.getItem('role');

    const handleTogglePassword = () => {
        setShowPassword(!showPassword);
    };

    if (!isVisible) return null;

    const handleConfirm = () => {
        if (password === 'RSA@123') {
            onConfirm();
            setPassword('');
            setError('');
        } else {
            setError('Incorrect password. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 flex items-start justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded shadow-lg mt-10">
                <h3 className="text-lg font-semibold">
                Enter Password {role !== 'staff' && 'RSA@123'} to Confirm 
                </h3>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-2 p-2 border rounded w-full pr-10"
                        placeholder="Enter password"
                    />
                    <span onClick={handleTogglePassword} className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer">
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                </div>
                {error && <p className="text-red-500 mt-2">{error}</p>}
                <div className="mt-4 flex justify-end gap-4">
                    <button type="button" className="btn btn-sm bg-red-500 text-white" onClick={handleConfirm}>
                        Confirm
                    </button>
                    <button type="button" className="btn btn-sm bg-gray-300" onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
