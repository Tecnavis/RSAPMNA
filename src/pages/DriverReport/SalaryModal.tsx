import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

interface SalaryModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (salaryAmount: number, transactionId: string) => void;
    salaryAmount: number;  // Add salaryAmount prop
}

const SalaryModal: React.FC<SalaryModalProps> = ({ open, onClose, onConfirm, salaryAmount }) => {
    const [enteredSalaryAmount, setEnteredSalaryAmount] = useState(salaryAmount.toString());
    const [transactionId, setTransactionId] = useState('');

    const handleConfirm = () => {
        if (!enteredSalaryAmount || !transactionId) {
            alert('Please enter both salary amount and transaction ID.');
            return;
        }
        onConfirm(parseFloat(enteredSalaryAmount), transactionId);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Enter Salary Details</DialogTitle>
            <DialogContent>
                {/* Display salaryAmount at the top */}
                <h3 style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                    Total Salary: {salaryAmount.toFixed(2)}
                </h3>
                <TextField
                    label="Total Salary Amount"
                    type="text"
                    fullWidth
                    margin="dense"
                    value={enteredSalaryAmount}
                    onChange={(e) => setEnteredSalaryAmount(e.target.value)}
                />
                <TextField
                    label="Transaction ID"
                    fullWidth
                    margin="dense"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">Cancel</Button>
                <Button onClick={handleConfirm} color="primary">Confirm</Button>
            </DialogActions>
        </Dialog>
    );
};

export default SalaryModal;
