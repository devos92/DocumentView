import React from 'react';
import { useModal } from '../context/ModalContext';

const LogoutConfirmation = ({ onConfirm, onCancel }) => {
  const { closeModal } = useModal();
    return (
      <div className="bg-white p-6 rounded shadow-lg text-center">
        <h2 className="text-lg text-dark font-semibold mb-4">Are you sure you want to logout?</h2>
        <div className="flex justify-center">
          <button
            className="mr-4 px-6 py-2 bg-primary text-white rounded hover:bg-primaryHover"
            onClick={onConfirm}
          >
            Yes
          </button>
          <button
            className="px-6 py-2 bg-gray-300 text-dark rounded hover:bg-gray-400"
            onClick={() => {
              onCancel();
              closeModal();
            }}
          >
            No
          </button>
        </div>
      </div>
    );
  };


export default LogoutConfirmation;