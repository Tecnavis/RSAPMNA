import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

interface SalaryModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (salaryAmount: number, transactionId: string) => void;
}

const SalaryModal: React.FC<SalaryModalProps> = ({ open, onClose, onConfirm }) => {
    const [salaryAmount, setSalaryAmount] = useState('');
    const [transactionId, setTransactionId] = useState('');

    const handleConfirm = () => {
        if (!salaryAmount || !transactionId) {
            alert('Please enter both salary amount and transaction ID.');
            return;
        }
        onConfirm(parseFloat(salaryAmount), transactionId);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Enter Salary Details</DialogTitle>
            <DialogContent>
                <TextField
                    label="Total Salary Amount"
                    type="text"
                    fullWidth
                    margin="dense"
                    value={salaryAmount}
                    onChange={(e) => setSalaryAmount(e.target.value)}
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
