import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { useModal } from '../context/ModalContext';
import { generateNiceReferenceId, getStatusClass, getStatusText } from '../helpers/IssueHelpers';
import '../styles/loader.css';

/**
 * Issue Component: Renders an individual issue card with details like charm, title, status, description,
 * reference ID, and attachments (if available). Handles image loading, fallback on errors,
 * and opening modals for full image previews.
 */
export default function Issue({ data, openIssueModal }) {
    const { openModal, closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(true);
    const [isImageError, setIsImageError] = useState(false);
    const [attachments, setAttachments] = useState(data.attachments || []);

    /**
     * Fetches the attachments for the issue if they don't have signed URLs. This is done
     * via an API call to retrieve the correct URLs for image attachments.
     */
    const fetchAttachments = useCallback(async () => {
        try {
            const response = await apiClient.get(`/api/attachments/${data._id}`);
            const updatedAttachments = response.data.map(attachment => ({ ...attachment, signedUrl: attachment.signedUrl || '' }));
            setAttachments(updatedAttachments);
        } catch (error) {
            console.error('Error fetching attachments:', error);
        }
    }, [data._id]);

    /**
     * useEffect hook to fetch attachments when the component mounts if the signed URLs are missing.
     */
    useEffect(() => {
        if (attachments && attachments.length > 0 && !attachments[0].signedUrl) {
            fetchAttachments();
        }
    }, [attachments, fetchAttachments]);

    /**
     * useEffect hook to handle image loading. Once the attachments are fetched, this
     * attempts to load the first image and handle success or failure with appropriate states.
     */
    useEffect(() => {
        if (attachments && attachments.length > 0 && attachments[0].signedUrl) {
            const img = new Image();
            img.src = attachments[0].signedUrl;

            img.onload = () => setIsLoading(false); // Successfully loaded image
            img.onerror = (ev) => {
                setIsImageError(true); // Failed to load image
                setIsLoading(false);
                console.error(`Failed to load image '${attachments[0].signedUrl}':`, ev);
            };
        }
    }, [attachments]);

    /**
     * Extracts the latest status from the issue's status history and returns the appropriate CSS class for styling.
     */
    const latestStatus = data.status_history && data.status_history.length > 0
        ? data.status_history[data.status_history.length - 1].status_id
        : undefined;

    /**
     * Utility function to determine if a character is a letter, used to conditionally style
     * the charm icon differently depending on whether it's a letter or a symbol.
     */
    const isLetter = (char) => {
        return /\p{L}/u.test(char);
    };

    /**
     * Handles the click event on an attachment image. Opens a modal to display the image in full size.
     */
    const handleImageClick = (imageSrc) => {
        openModal(
            <div className="relative">
                <img src={imageSrc} alt="Full Preview" className="rounded-lg max-w-full max-h-full mx-auto" />
            </div>
        );
    };
    const [mouseDownPosition, setMouseDownPosition] = useState(null);

    const handleMouseDown = (e) => {
        setMouseDownPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = (e) => {
        const mouseUpPosition = { x: e.clientX, y: e.clientY };
        const distance = Math.sqrt(
            Math.pow(mouseUpPosition.x - mouseDownPosition.x, 2) +
            Math.pow(mouseUpPosition.y - mouseDownPosition.y, 2)
        );

        // If the distance is less than a threshold, consider it a click
        if (distance < 5) {
            openIssueModal();
        }
    };

    return (
        <div
            className="bg-white dark:bg-gray-400 shadow-md rounded-lg p-4 flex flex-col justify-between transition-transform transform hover:scale-105 hover:shadow-lg relative cursor-pointer"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        >
            {/* Header Line */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center flex-grow min-w-0">
                    {/* Charm Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 ${isLetter(data.charm) ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'} rounded-full flex justify-center items-center text-lg`}>
                        {data.charm}
                    </div>
                    {/* Issue Title */}
                    <h3
                        className="ml-2 text-lg font-semibold text-gray-800 line-clamp-2 overflow-hidden text-ellipsis flex-grow min-w-0"
                        title={data.title}
                    >
                        {data.title}
                    </h3>
                </div>
                {/* Status Indicator */}
                <div className={`px-2 py-1 rounded-full text-sm font-semibold ${getStatusClass(latestStatus)} flex-shrink-0`}>
                    {getStatusText(latestStatus)}
                </div>
            </div>

            {/* Description */}
            <div
                className="text-gray-700 mb-4 line-clamp-5 text-clip"
                dangerouslySetInnerHTML={{ __html: data.description }}
            ></div>

            {/* Reference */}
            <p className="text-sm text-gray-500 dark:text-gray-800 mb-4">
                <strong>Reference:</strong> {generateNiceReferenceId(data)}
            </p>

            {/* Attachments */}
            {attachments && attachments.length > 0 && (
                <div className="mb-4 relative">
                    <p className="text-sm text-gray-500 dark:text-gray-800 mb-4">
                        <strong>Attachment(s):</strong>
                    </p>
                    <div
                        className="bg-gray-200 rounded-md h-40 flex items-center justify-center relative overflow-hidden cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            closeModal();
                            handleImageClick(attachments[0].signedUrl);
                        }}
                    >
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="loader"></div>
                            </div>
                        )}
                        {isImageError ? (
                            <div className="absolute inset-0 flex items-center justify-center text-red-500">
                                <ExclamationCircleIcon className="h-6 w-6" />
                                <span className="ml-2">Failed to load image</span>
                            </div>
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <div
                                    className="absolute inset-0 bg-cover bg-center filter blur-lg"
                                    style={{ backgroundImage: `url(${attachments[0].signedUrl})` }}
                                ></div>
                                <img
                                    src={attachments[0].signedUrl}
                                    alt="Attachment"
                                    className="relative z-10 object-contain max-h-full max-w-full"
                                />
                            </div>
                        )}
                        {attachments.length > 1 && (
                            <div className="absolute top-2 right-2 bg-primary text-white text-xs rounded-full w-6 h-6 flex items-center justify-center z-20">
                                {attachments.length > 9 ? '9+' : attachments.length}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
