import React from "react";
import './Index.css';

interface IndexModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const IndexModal: React.FC<IndexModalProps> = ({ title, message, onConfirm, onCancel }) => {
    return (
        <div className="modal">
            <div className="modal-content">
                <h3>{title}</h3>
                <p>{message}</p>
                <button onClick={onConfirm}>Yes</button>
                <button onClick={onCancel}>No</button>
            </div>
        </div>
    );
};

export default IndexModal;
