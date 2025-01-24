import React from 'react';

interface ConfirmationModal1Props {
    isOpen: boolean;
    onConfirm1: () => void;
    onCancel1: () => void;
    message: string;
}

const ConfirmationModal1: React.FC<ConfirmationModal1Props> = ({ isOpen, onConfirm1, onCancel1, message }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        }}>
            <div style={{
                background: 'linear-gradient(145deg, #ffffff, #f1f1f1)',
                padding: '30px',
                borderRadius: '12px',
                textAlign: 'center',
                width: '400px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            }}>
                <h2 style={{
                    marginBottom: '15px',
                    color: '#333',
                    fontSize: '22px',
                    fontWeight: 600,
                }}>
                    Confirmation
                </h2>
                <p style={{
                    fontSize: '16px',
                    color: '#555',
                    marginBottom: '30px',
                    lineHeight: '1.5',
                }}>
                    {message}
                </p>
                <div>
                    <button onClick={onConfirm1} style={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        padding: '12px 30px',
                        fontSize: '16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        marginRight: '10px',
                        transition: 'background-color 0.3s ease, transform 0.2s',
                    }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#45a049')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4CAF50')}
                    >
                        Confirm
                    </button>
                    <button onClick={onCancel1} style={{
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        padding: '12px 30px',
                        fontSize: '16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease, transform 0.2s',
                    }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#d32f2f')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f44336')}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal1;
