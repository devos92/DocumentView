import React, { useEffect, useState } from 'react';
import TiptapEditor from './richtext/TiptapEditor';

const DescriptionEditor = ({ description, onChange, canEdit, isEditMode, setIsEditMode }) => {
    const [localDescription, setLocalDescription] = useState(description);

    useEffect(() => {
        setLocalDescription(description);
    }, [description]);

    const handleSave = () => {
        onChange(localDescription);
        setIsEditMode(false);
    };

    const handleCancel = () => {
        setLocalDescription(description);
        setIsEditMode(false);
    };

    return (
        <>
            {isEditMode && canEdit ? (
                <div className="mt-6 p-4 bg-gray-50 border rounded-lg shadow-md">
                    <TiptapEditor content={localDescription} setContent={setLocalDescription}/>
                    <div className="flex justify-end mt-2">
                        <div className="flex space-x-2">
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition"
                            >
                                Save
                            </button>
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    className={`tiptap-content tiptap-content-inactive text-sm text-gray-600 ${canEdit ? 'cursor-pointer can-edit' : ''}`}
                    onClick={() => canEdit && setIsEditMode(true)}
                >
                    <div dangerouslySetInnerHTML={{ __html: description || 'No description provided.' }} />
                </div>
            )}
        </>
    );
};

export default DescriptionEditor;