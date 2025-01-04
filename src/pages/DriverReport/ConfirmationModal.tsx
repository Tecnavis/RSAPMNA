import React, { useState } from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: () => void }) => {
  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 transition-all ${
        isOpen ? 'visible opacity-100' : 'invisible opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg w-96"
        onClick={(e) => e.stopPropagation()} // Prevents click from closing modal when clicking inside
      >
        <h2 className="text-xl font-semibold text-center mb-4">Confirm Salary Adjustment</h2>
        <p className="text-center mb-6">Are you sure you want to adjust the salary? This action cannot be undone.</p>
        <div className="flex justify-around">
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};


export default ConfirmationModal;
