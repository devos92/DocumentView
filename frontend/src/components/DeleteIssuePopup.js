import React from 'react';
import apiClient from '../api/apiClient';

const DeleteIssuePopup = ({ closeHandler, issue}) => {

    function deleteHandler(issue) {
        closeHandler(); // Close the delete issue popup.
        const id = issue._id;

        const deleteIssue = async () => {
            try {
                const response = await apiClient.delete(`api/issues/${id}`)
                console.log('Issue deleted:', response);
                window.location.reload();
            } catch (error) {
                console.log('There was an error deleting the issue:', error);
            }
        };
        deleteIssue();
    }

    return (
        <div className="bg-white p-6 rounded shadow-lg w-full md:w-1/2 lg:w-1/3 mx-auto">
            <h2 className="text-lg text-dark font-semibold mb-4 text-center">"{issue.title}"</h2>
            <h2 className="text-lg text-dark font-semibold mb-4 text-center">Are you sure you want to delete this issue?</h2>
            <button onClick={() => deleteHandler(issue)}>Delete</button>
            <button onClick={closeHandler}>Close</button>
        </div>
    );
};

export default DeleteIssuePopup;