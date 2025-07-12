import { CheckIcon, PaperAirplaneIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import apiClient from "../api/apiClient";
import { useModal } from '../context/ModalContext';
import { useUser } from "../context/UserContext";
import { charmOptions, generateNiceReferenceId, getStatusClass } from '../helpers/IssueHelpers';
import { GetUserAvatar } from '../helpers/UserHelpers';
import DescriptionEditor from './DescriptionEditor';
import "./IssueView.css";

// Helper function to format date in DD/MM/YYYY format
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

// Helper function to format dates in a "smart" way (e.g., "just now", "1 hr ago")
function formatSmartDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? '1 min ago' : `${diffInMinutes} mins ago`;
  } else if (diffInHours < 24) {
    return diffInHours === 1 ? '1 hr ago' : `${diffInHours} hrs ago`;
  } else if (diffInDays === 1) {
    return 'yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return formatDate(dateString);
  }
}

function IssueView({ issue, onClose }, ref) {
  const { user } = useUser();
  const { openModal, closeModal } = useModal();

  // State variables
  const [originalIssue, setOriginalIssue] = useState(issue); // Detailed issue data
  const [editedIssue, setEditedIssue] = useState({ ...issue }); // Copy of issue for editing
  useEffect(() => { // when the originalIssue changes, update the editedIssue
    setEditedIssue({ ...originalIssue });
  }, [originalIssue]);

  const [currentStatus, setCurrentStatus] = useState(() => {
    // Initialize currentStatus based on the latest status in status_history
    if (issue.status_history && issue.status_history.length > 0) {
      return issue.status_history[issue.status_history.length - 1].status_id;
    }
    return null; // Default to null if no status_history
  });
  const [canEdit, setCanEdit] = useState(false); // Permission to edit
  const [isAdmin, setIsAdmin] = useState(false); // Check if user is admin

  // State for header fields
  const [isTitleBeingEdited, setIsTitleBeingEdited] = useState(false);
  const [isStatusBeingEdited, setIsStatusBeingEdited] = useState(false);
  const [isCharmBeingEdited, setIsCharmBeingEdited] = useState(false);
  const [isDescriptionBeingEdited, setIsDescriptionBeingEdited] = useState(false);

  // State for occurrences
  const [newOccurrence, setNewOccurrence] = useState(null); // New occurrence input
  const [selectedOccurrence, setSelectedOccurrence] = useState(null); // Selected occurrence for editing
  const [editedOccurrence, setEditedOccurrence] = useState(null); // Edited occurrence object

  // State for comments
  const [newComment, setNewComment] = useState(""); // New comment input
  const [editedComment, setEditedComment] = useState(null); // Edited comment object

  // Other states
  const [toast, setToast] = useState(null); // Toast notification state
  const [username, setUserName] = useState(""); // Reporter's username
  const [attachments, setAttachments] = useState([]); // List of attachments
  const [attachmentError, setAttachmentError] = useState(null); // Attachment error message
  const [images, setImages] = useState([]); // Selected images for upload
  const [imagePreviews, setImagePreviews] = useState([]); // Image preview URLs
  const fileInputRef = useRef(null); // Create a ref for the file input
  const [isDragging, setIsDragging] = useState(false); // Drag-and-drop state

  // Function to display toast notifications
  const showToast = (message, type, duration = 5000, onConfirm = null) => {
    setToast({ message, type, onConfirm, duration });
    if (!onConfirm) {
      setTimeout(() => setToast(null), duration);
    }
  };

  // Fetch issue details from the server
  const fetchIssueDetails = useCallback(async () => {
    try {
      const response = await apiClient.get(`/api/issues/${issue._id}`);
      const fetchedIssue = response.data;
      setOriginalIssue(fetchedIssue);
      setEditedIssue({ ...fetchedIssue }); // Update editedIssue with fetched data
      fetchUsername(response.data.reporter_id); // Fetch reporter's username
      fetchAttachments(); // Fetch attachments if necessary
    } catch (error) {
      console.error('Error fetching issue details:', error);
      showToast('Error fetching issue details', 'error');
    }
  }, [issue._id]);



  const fetchUsername = async (reporterId) => {
    try {
      const response = await apiClient.get(`/api/users/${reporterId}`);
      const reporter = response.data;
      setUserName(reporter.username); // Set reporter's username
    } catch (error) {
      console.error('Error fetching reporter username:', error);
      showToast('Error fetching reporter username', 'error');
    }
  };

  // Fetch attachments for the issue
  const fetchAttachments = async () => {
    try {
      const response = await apiClient.get(`/api/attachments/${issue._id}`);
      setAttachments(response.data);
      setAttachmentError(null);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      setAttachmentError('Failed to load attachments. Please try again later.');
    }
  };

  // useEffect to fetch issue details on component mount or when issue ID changes
  useEffect(() => {
    fetchIssueDetails();

    // Set permissions based on user role and issue reporter
    const userCanEdit = user.role === 'admin' || user.id === issue.reporter_id;
    setCanEdit(userCanEdit);
    setIsAdmin(user.role === 'admin');
  }, [issue._id, user, fetchIssueDetails, issue.reporter_id]);

  // useEffect to update currentStatus when detailedIssue changes
  useEffect(() => {
    if (originalIssue.status_history && originalIssue.status_history.length > 0) {
      setCurrentStatus(
        originalIssue.status_history[originalIssue.status_history.length - 1].status_id
      );
    } else {
      setCurrentStatus(null); // Or set to a default status ID if desired
    }
  }, [originalIssue]);

  // Function to handle saving edits
  const handleSave = async () => {
    if (canEdit) {
      try {
        const updatedIssue = {
          ...editedIssue,
          status_id: currentStatus,
          status_history: [
            ...editedIssue.status_history,
            { status_id: currentStatus, date: new Date() },
          ],
          updated_at: new Date().toISOString(),
        };

        // Prepare data to send to the backend
        const dataToSend = {
          ...updatedIssue,
          occurrences: updatedIssue.occurrences.map((occurrence) => ({
            ...occurrence,
            user_id: occurrence.user_id || user.id,
          })),
        };

        const response = await apiClient.put(`/api/issues/${issue._id}`, dataToSend);

        setOriginalIssue(response.data.updatedIssue);

        onClose(response.data.updatedIssue);
      } catch (error) {
        console.error('Error updating issue:', error);
        showToast('Error updating issue', 'error');
      }
    }
  };

  // Function to handle canceling edits
  const handleCancel = () => {
    if (canEdit) {
      setEditedIssue(originalIssue);
      if (originalIssue.status_history && originalIssue.status_history.length > 0) {
        setCurrentStatus(
          originalIssue.status_history[originalIssue.status_history.length - 1].status_id
        );
      } else {
        setCurrentStatus(null);
      }
    }
  };

  // Helper function to check if there are unsaved changes
  function hasUnsavedChanges(editedIssue, originalIssue) {
    return (
      editedIssue.title !== originalIssue.title ||
      editedIssue.description !== originalIssue.description ||
      JSON.stringify(editedIssue.status_history) !== JSON.stringify(originalIssue.status_history)
    );
  }

  // Helper function to prompt the user to save changes
  async function promptToSaveChangesIfNecessary(messageType, openModal, closeModal, handleSave, handleCancel, unsavedChangesCheck) {
    if (unsavedChangesCheck) {
      return new Promise((resolve) => {
        openModal(
          <div className="bg-white p-6 rounded shadow-lg text-center w-3/4 mx-auto">
            <h2 className="text-lg text-dark font-semibold mb-4">
              {messageType === 'CloseRequest' && 'You have unsaved changes. Do you want to save them before proceeding?'}
              {messageType === 'OccurrenceEdit' && 'Before editing occurrences, you must finalise your changes to the issue.'}
              {messageType === 'CommentEdit' && 'Before editing comments, you must finalise your changes to the issue.'}
              {messageType === 'AttachmentEdit' && 'Before managing attachments, you must finalise your changes to the issue.'}
            </h2>
            <div className="flex justify-center">
              <button
                className="mr-4 px-6 py-2 bg-primary text-white rounded hover:bg-primaryHover"
                onClick={async () => {
                  closeModal();
                  await handleSave();
                  resolve(true);
                }}
              >
                Save
              </button>
              <button
                className="mr-4 px-6 py-2 bg-gray-300 text-dark rounded hover:bg-gray-400"
                onClick={() => {
                  closeModal();
                  handleCancel();
                  resolve(true);
                }}
              >
                Discard
              </button>
              <button
                className="px-6 py-2 bg-gray-300 text-dark rounded hover:bg-gray-400"
                onClick={() => {
                  closeModal();
                  resolve(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>,
          false
        );
      });
    }
    return true;
  }

  // Function to handle closing the issue view
  // This method is used implicitly by ModalContext when the user clicks outside the modal
  const onUserCloseRequest = useCallback(async () => {
    // If any field is being edited, deny the close request
    if (isTitleBeingEdited || isStatusBeingEdited || isCharmBeingEdited || isDescriptionBeingEdited) {
      return false;
    }

    // If there are unsaved changes, prompt the user to save them; if the user selects "Cancel", deny the close request
    const unsavedChangesCheck = hasUnsavedChanges(editedIssue, originalIssue);
    const canClose = await promptToSaveChangesIfNecessary(
      'CloseRequest',
      openModal,
      closeModal,
      handleSave,
      handleCancel,
      unsavedChangesCheck
    );
    return canClose;
  }, [editedIssue, originalIssue, openModal]);

  useImperativeHandle(ref, () => ({
    onUserCloseRequest,
  }));

  // Function to handle input changes in edit mode
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'status_id') {
      const statusId = Number(value);
      setCurrentStatus(statusId); // Update currentStatus
      setEditedIssue({
        ...editedIssue,
        status_id: statusId,
        status_history: [
          ...editedIssue.status_history,
          { status_id: statusId, date: new Date() },
        ],
      });
    } else {
      setEditedIssue({ ...editedIssue, [name]: value });
    }
  };

  // Function to get the status text based on status ID
  const getStatusText = (statusId) => {
    switch (statusId) {
      case 1:
        return 'Complete';
      case 2:
        return 'In Progress';
      case 3:
          return 'Cancelled';
      case 4:
          return 'Pending';
      default:
          return 'Unknown';
    }
  };

  // Functions for handling occurrences

  // Add a new occurrence
  const handleAddOccurrence = async () => {
    if (!newOccurrence || !newOccurrence.description?.trim() || !newOccurrence.time) {
      return;
    }

    const unsavedChangesCheck = hasUnsavedChanges(editedIssue, originalIssue);
    const proceed = await promptToSaveChangesIfNecessary(
      'OccurrenceEdit',
      openModal,
      closeModal,
      handleSave,
      handleCancel,
      unsavedChangesCheck
    );
    if (!proceed) return;

    try {
      const response = await apiClient.post(`/api/occurrences/${issue._id}`, {
        description: newOccurrence.description,
        created_at: newOccurrence.time,
        user_id: user.id,
      });

      setOriginalIssue({
        ...originalIssue,
        occurrences: [...originalIssue.occurrences, response.data.occurrence],
      });
      setNewOccurrence("");
    } catch (error) {
      console.error("Error adding occurrence:", error);
      showToast("Failed to add occurrence", "error");
    }
  };

  // Select an occurrence for editing
  const handleSelectOccurrence = async (occurrence) => {
    if (selectedOccurrence && selectedOccurrence._id === occurrence._id) {
      return;
    }

    if (isAdmin || user.id === occurrence.user_id) {
      const unsavedChangesCheck = hasUnsavedChanges(editedIssue, originalIssue);
      const proceed = await promptToSaveChangesIfNecessary(
        'OccurrenceEdit',
        openModal,
        closeModal,
        handleSave,
        handleCancel,
        unsavedChangesCheck
      );
      if (!proceed) return;

      setSelectedOccurrence(
        selectedOccurrence && selectedOccurrence._id === occurrence._id ? null : occurrence
      );
      setEditedOccurrence({
        description: occurrence.description,
        time: occurrence.created_at ? new Date(occurrence.created_at).toISOString().slice(0, 16) : '',
      });
    }
  };

  // Edit an occurrence
  const handleEditOccurrence = async (occurrence) => {
    if (!isAdmin && user.id !== occurrence.user_id._id) {
      showToast("You do not have permission to edit this occurrence", "error");
      return;
    }

    const unsavedChangesCheck = hasUnsavedChanges(editedIssue, originalIssue);
    const proceed = await promptToSaveChangesIfNecessary(
      'OccurrenceEdit',
      openModal,
      closeModal,
      handleSave,
      handleCancel,
      unsavedChangesCheck
    );
    if (!proceed) return;

    try {
      const response = await apiClient.put(
        `/api/occurrences/${issue._id}/${occurrence._id}`,
        {
          description: editedOccurrence.description,
          created_at: editedOccurrence.time,
        }
      );

      const updatedOccurrences = originalIssue.occurrences.map((occ) =>
        occ._id === occurrence._id ? response.data.occurrence : occ
      );

      setOriginalIssue({ ...originalIssue, occurrences: updatedOccurrences });
      setSelectedOccurrence(null);
      setEditedOccurrence(null);
    } catch (error) {
      console.error("Error updating occurrence:", error);
      showToast("Error updating occurrence", "error");
    }
  };

  // Open modal asking if the user wants to delete an occurrence
  const promptDeleteOccurrence = async (occurrence) => {
    const unsavedChangesCheck = hasUnsavedChanges(editedIssue, originalIssue);
    const proceed = await promptToSaveChangesIfNecessary(
      'OccurrenceEdit',
      openModal,
      closeModal,
      handleSave,
      handleCancel,
      unsavedChangesCheck
    );
    if (!proceed) return;

    openModal(
      <div className="bg-white p-6 rounded shadow-lg text-center w-3/4 mx-auto">
        <h2 className="text-lg text-dark font-semibold mb-4">
          Are you sure you want to delete this occurrence?
        </h2>
        <div className="flex justify-center">
          <button
            className="mr-4 px-6 py-2 bg-primary text-white rounded hover:bg-primaryHover"
            onClick={async () => {
              await handleDeleteOccurrence(occurrence);
              closeModal();
            }}
          >
            Yes
          </button>
          <button
            className="px-6 py-2 bg-gray-300 text-dark rounded hover:bg-gray-400"
            onClick={closeModal}
          >
            No
          </button>
        </div>
      </div>
      , false);
  };

  // Function to handle deleting an occurrence
  const handleDeleteOccurrence = async (occurrence) => {
    console.log(`Deleting occurrence: ${occurrence._id}`);
    if (!isAdmin && user.id !== occurrence.user_id) {
      showToast("You do not have permission to delete this occurrence", "error");
      return;
    }

    try {
      await apiClient.delete(`/api/occurrences/${issue._id}/${occurrence._id}`);

      const updatedOccurrences = originalIssue.occurrences.filter(
        (occ) => occ._id !== occurrence._id
      );

      setOriginalIssue({ ...originalIssue, occurrences: updatedOccurrences });
      setSelectedOccurrence(null);
    } catch (error) {
      console.error("Error deleting occurrence:", error);
      showToast("Error deleting occurrence", "error");
    }
  };

  // Functions for handling comments

  // Add a new comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const unsavedChangesCheck = hasUnsavedChanges(editedIssue, originalIssue);
    const proceed = await promptToSaveChangesIfNecessary(
      'CommentEdit',
      openModal,
      closeModal,
      handleSave,
      handleCancel,
      unsavedChangesCheck
    );
    if (!proceed) return;

    try {
      const response = await apiClient.post(`/api/comments/${issue._id}`, {
        comment_text: newComment,
      });

      setOriginalIssue({
        ...originalIssue,
        comments: [...originalIssue.comments, response.data.comment],
      });
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      showToast("Error adding comment", "error");
    }
  };

  // Select a comment for editing
  const handleSelectComment = async (comment) => {
    if (isAdmin || user.id === comment.user_id._id) {
      const unsavedChangesCheck = hasUnsavedChanges(editedIssue, originalIssue);
      const proceed = await promptToSaveChangesIfNecessary(
        'CommentEdit',
        openModal,
        closeModal,
        handleSave,
        handleCancel,
        unsavedChangesCheck
      );
      if (!proceed) return;
      setEditedComment({ ...comment });
    }
  };

  // Edit a comment
  const handleEditComment = async (comment) => {
    if (!isAdmin && user.id !== comment.user_id._id) {
      showToast("You do not have permission to edit this comment", "error");
      return;
    }

    const unsavedChangesCheck = hasUnsavedChanges(editedIssue, originalIssue);
    const proceed = await promptToSaveChangesIfNecessary(
      'CommentEdit',
      openModal,
      closeModal,
      handleSave,
      handleCancel,
      unsavedChangesCheck
    );
    if (!proceed) return;

    try {
      const response = await apiClient.put(
        `/api/comments/${issue._id}/${comment._id}`,
        {
          comment_text: editedComment,
        }
      );

      setOriginalIssue((prevState) => ({
        ...prevState,
        comments: prevState.comments.map((c) =>
          c._id === comment._id ? response.data.comment : c
        ),
      }));
      setEditedComment(null);
    } catch (error) {
      console.error("Error updating comment:", error);
      showToast("Error updating comment", "error");
    }
  };

  // Open modal asking if the user wants to delete a comment
  const promptDeleteComment = async (comment) => {
    const unsavedChangesCheck = hasUnsavedChanges(editedIssue, originalIssue);
    const proceed = await promptToSaveChangesIfNecessary(
      'CommentEdit',
      openModal,
      closeModal,
      handleSave,
      handleCancel,
      unsavedChangesCheck
    );
    if (!proceed) return;

    openModal(
      <div className="bg-white p-6 rounded shadow-lg text-center w-3/4 mx-auto">
        <h2 className="text-lg text-dark font-semibold mb-4">
          Are you sure you want to delete this comment?
        </h2>
        <div className="flex justify-center">
          <button
            className="mr-4 px-6 py-2 bg-primary text-white rounded hover:bg-primaryHover"
            onClick={async () => {
              await handleDeleteComment(comment);
              closeModal();
            }}
          >
            Yes
          </button>
          <button
            className="px-6 py-2 bg-gray-300 text-dark rounded hover:bg-gray-400"
            onClick={closeModal}
          >
            No
          </button>
        </div>
      </div>
      , false);
  };

  // Delete a comment
  const handleDeleteComment = async (comment) => {
    if (!isAdmin && user.id !== comment.user_id._id) {
      showToast("You do not have permission to delete this comment", "error");
      return;
    }

    try {
      await apiClient.delete(`/api/comments/${issue._id}/${comment._id}`);

      setOriginalIssue((prevState) => ({
        ...prevState,
        comments: prevState.comments.filter((c) => c._id !== comment._id),
      }));
    } catch (error) {
      console.error("Error deleting comment:", error);
      showToast("Error deleting comment", "error");
    }
  };

  // Functions for handling attachments and image uploads

  // Handle drag over event for image upload
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Handle drag leave event for image upload
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Handle drop event for image upload
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageSelection(Array.from(e.dataTransfer.files));
    }
  };

  // Handle image selection for upload
  const handleImageSelection = (files) => {
    const newImages = [...images, ...files];
    const newPreviews = [...imagePreviews, ...files.map((file) => URL.createObjectURL(file))];
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  // Remove an image from the selection
  const handleRemoveImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  // Upload selected files
  const handleFileUpload = async () => {
    if (images.length === 0) {
      showToast('Please select files to upload', 'error');
      return;
    }

    const unsavedChangesCheck = hasUnsavedChanges(editedIssue, originalIssue);
    const proceed = await promptToSaveChangesIfNecessary(
      'AttachmentEdit',
      openModal,
      closeModal,
      handleSave,
      handleCancel,
      unsavedChangesCheck
    );
    if (!proceed) return;

    const formData = new FormData();
    images.forEach((file) => {
      formData.append('file', file);
    });

    try {
      const response = await apiClient.post(`/api/attachments/${issue._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showToast('Files uploaded successfully', 'success');
      setImages([]);
      setImagePreviews([]);
      fetchIssueDetails(); // Refresh the issue view
    } catch (error) {
      console.error('Error uploading files:', error);
      showToast('Error uploading files', 'error');
    }
  };

  // Handle image click to open full preview
  const handleImageClick = (imageSrc) => {
    openModal(
      <div className="relative">
        <img src={imageSrc} alt="Full Preview" className="rounded-lg max-w-full max-h-full mx-auto" />
      </div>
    );
  };

  // Open modal asking if the user wants to delete an attachment
  const promptDeleteAttachment = async (attachmentId) => {
    const unsavedChangesCheck = hasUnsavedChanges(editedIssue, originalIssue);
    const proceed = await promptToSaveChangesIfNecessary(
      'AttachmentEdit',
      openModal,
      closeModal,
      handleSave,
      handleCancel,
      unsavedChangesCheck
    );
    if (!proceed) return;

    openModal(
      <div className="bg-white p-6 rounded shadow-lg text-center w-3/4 mx-auto">
        <h2 className="text-lg text-dark font-semibold mb-4">
          Are you sure you want to delete this attachment?
        </h2>
        <div className="flex justify-center">
          <button
            className="mr-4 px-6 py-2 bg-primary text-white rounded hover:bg-primaryHover"
            onClick={async () => {
              await handleDeleteAttachment(attachmentId);
              closeModal();
            }}
          >
            Yes
          </button>
          <button
            className="px-6 py-2 bg-gray-300 text-dark rounded hover:bg-gray-400"
            onClick={closeModal}
          >
            No
          </button>
        </div>
      </div>
    , false);
  };

  // Function to handle deleting an attachment
  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await apiClient.delete(`/api/attachments/${issue._id}/${attachmentId}`);
      fetchAttachments(); // Refresh the attachments list
    } catch (error) {
      console.error('Error deleting attachment:', error);
      showToast('Error deleting attachment', 'error');
    }
  };

  // Open modal asking if the user wants to delete the issue
  const promptDeleteIssue = async () => {
    // const unsavedChangesCheck = hasUnsavedChanges(editedIssue, originalIssue);
    // const proceed = await promptToSaveChangesIfNecessary(
    //   'CloseRequest',
    //   openModal,
    //   closeModal,
    //   handleSave,
    //   handleCancel,
    //   unsavedChangesCheck
    // );
    // if (!proceed) return; // If we're deleting the issue, we don't need to save changes

    openModal(
      <div className="bg-white p-6 rounded shadow-lg text-center w-3/4 mx-auto">
        <h2 className="text-lg text-dark font-semibold mb-4">
          Are you sure you want to delete this issue?
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          This action cannot be undone.
          <br />
          All occurrences, comments, and attachments will be permanently deleted.
        </p>
        <div className="flex justify-center">
          <button
            className="mr-4 px-6 py-2 bg-primary text-white rounded hover:bg-primaryHover"
            onClick={async () => {
              await handleDeleteIssue();
              closeModal();
            }}
          >
            Yes
          </button>
          <button
            className="px-6 py-2 bg-gray-300 text-dark rounded hover:bg-gray-400"
            onClick={closeModal}
          >
            No
          </button>
        </div>
      </div>
      , false);
  };

  // Function to handle deleting the issue
  const handleDeleteIssue = async () => {
    try {
      await apiClient.delete(`/api/issues/${issue._id}`);
      onClose(); // Close the issue view
    } catch (error) {
      console.error('Error deleting issue:', error);
      showToast('Error deleting issue', 'error');
    } finally {
      closeModal();
    }
  };

  const charmButtonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (charmButtonRef.current && !charmButtonRef.current.contains(event.target)) {
        setIsCharmBeingEdited(false);
      }
    };

    if (isCharmBeingEdited) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCharmBeingEdited]);

  // Render the component
  return (
    <div className="relative mx-auto md:p-5 shadow-lg rounded-md bg-white max-h-[calc(100vh-40px)] overflow-y-auto">
      <div className="mt-3">
        <div className="mt-2 pl-7 pr-3 lg:pr-7 py-3">
          {/* Issue header section */}
          <div className="issue-header flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
            {/* Charm Selector */}
            <div className="relative" ref={charmButtonRef}>
              <button
                type="button"
                onClick={() => setIsCharmBeingEdited(!isCharmBeingEdited)}
                className={`bg-gray-300 border border-secondary p-2 rounded-full text-center flex justify-center items-center w-14 h-14 text-4xl ${canEdit ? 'hover:bg-gray-400 cursor-pointer' : ''}`}
                disabled={!canEdit}
              >
                {editedIssue.charm}
              </button>

              {isCharmBeingEdited && canEdit ? (
                <div className="absolute left-0 mt-2 p-2 bg-white border border-gray-200 shadow-lg rounded grid grid-cols-4 gap-2 overflow-visible z-10 w-80">
                  {charmOptions.map((charmOption, index) => (
                    <div
                      key={index}
                      className={`cursor-pointer p-1 rounded-lg text-xl flex justify-center items-center ${editedIssue.charm === charmOption ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
                      onClick={() => {
                        setEditedIssue({ ...editedIssue, charm: charmOption });
                        setIsCharmBeingEdited(false);
                      }}
                    >
                      {charmOption}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Title Input/Display */}
            <div className="flex-grow">
              {isTitleBeingEdited && canEdit ? (
                <input
                  type="text"
                  value={editedIssue.title}
                  onChange={(e) => setEditedIssue({ ...editedIssue, title: e.target.value })}
                  onBlur={() => setIsTitleBeingEdited(false)}
                  autoFocus
                  className="text-xl font-bold mb-2 w-full p-2 border border-gray-300 rounded"
                  placeholder="Issue Title"
                />
              ) : (
                <h1
                  className={`text-xl font-bold mb-2 ${canEdit ? 'hover:underline cursor-pointer' : ''}`}
                  onClick={() => canEdit && setIsTitleBeingEdited(true)}
                >
                  {editedIssue.title}
                </h1>
              )}
            </div>

            {/* Status and Reference ID Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
              <div className="flex flex-col space-y-2">
                {isStatusBeingEdited && canEdit ? (
                  <select
                    name="status_id"
                    value={currentStatus || ''}
                    onChange={handleInputChange}
                    onBlur={() => setIsStatusBeingEdited(false)}
                    className="p-2 border border-gray-300 rounded h-[42px]"
                    autoFocus
                  >
                    <option value={1}>Complete</option>
                    <option value={2}>In Progress</option>
                    <option value={3}>Cancelled</option>
                    <option value={4}>Pending</option>
                  </select>
                ) : (
                  <span
                    className={`text-sm ${getStatusClass(currentStatus)} ${canEdit ? 'cursor-pointer hover:underline' : ''}`}
                    onClick={() => canEdit && setIsStatusBeingEdited(true)}
                  >
                    {getStatusText(currentStatus)}
                  </span>
                )}
                <p
                  className="text-sm text-gray-600 cursor-pointer hover:underline text-center"
                  onClick={() => {
                    navigator.clipboard.writeText(generateNiceReferenceId(originalIssue));
                    showToast('Reference ID copied to clipboard', 'info', 1000);
                  }}
                >
                  {generateNiceReferenceId(originalIssue)}
                </p>
              </div>


              {/* Delete Issue Button */}
              {(isAdmin || user.id === originalIssue.reporter_id) && (
                <button
                  onClick={promptDeleteIssue}
                  className="p-4 bg-gray-300 text-gray-600 hover:text-red-500 rounded-full hover:bg-red-100 focus:outline-none"
                  title="Delete Issue"
                >
                  <TrashIcon className="w-5 h-5" /> {/* Icon for Delete Button */}
                </button>
              )}
            </div>
          </div>

          {/* Issue body section */}
          <div className="issue-body flex flex-col md:flex-row">
            <div className="issue-main">
              {/* Description section */}
              <div className="mt-4">
                <h2 className="text-xl font-bold mb-2">Description</h2>
                <DescriptionEditor
                  description={editedIssue.description}
                  onChange={(newDescription) => setEditedIssue({ ...editedIssue, description: newDescription })}
                  canEdit={canEdit}
                  isEditMode={isDescriptionBeingEdited}
                  setIsEditMode={setIsDescriptionBeingEdited}
                />
              </div>

              {/* Occurrences section */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-bold">Occurrences</h2>
                </div>
                <ul className="occurrences-list">
                  {(originalIssue.occurrences || []).map((occurrence) => (
                    <li
                      key={occurrence._id}
                      className={`occurrence-item mb-2 p-3 rounded-lg shadow-sm transition-all duration-200
                        ${isAdmin || user.id === occurrence.user_id
                          ? selectedOccurrence?._id === occurrence._id
                            ? "bg-green-50 hover:bg-green-100 border-l-4 cursor-pointer border-green-500"
                            : "bg-blue-50 hover:bg-blue-100 border-l-4 cursor-pointer border-blue-500"
                          : "bg-gray-50 border-l-4 border-gray-300"
                        }`}
                      onClick={() => handleSelectOccurrence(occurrence)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-600">
                            <strong>Created at: </strong>
                            {(selectedOccurrence && selectedOccurrence._id === occurrence._id && selectedOccurrence.user_id?._id === user.id) ? (
                              <input
                                type="datetime-local"
                                value={editedOccurrence.time}
                                onChange={(e) => setEditedOccurrence({ ...editedOccurrence, time: e.target.value })}
                                className="w-full p-2 border rounded mb-2"
                                max={new Date().toISOString().slice(0, 16)}
                              />
                            ) : (
                              <span
                                title={
                                  occurrence.created_at
                                    ? new Date(occurrence.created_at).toLocaleString()
                                    : ''
                                }
                              >
                                {occurrence.created_at
                                  ? formatSmartDate(occurrence.created_at)
                                  : 'N/A'}
                              </span>
                            )}
                            {(!selectedOccurrence || selectedOccurrence._id !== occurrence._id || selectedOccurrence.user_id?._id !== user.id) && (
                              <>
                                <br />
                                <p className="mt-1">
                                  <strong>Reported by: </strong>
                                  {occurrence.user_id?.username || 'Unknown'}
                                </p>
                              </>
                            )}
                          </p>
                          {(selectedOccurrence && selectedOccurrence._id === occurrence._id && selectedOccurrence.user_id?._id === user.id) ? (
                            <>
                              <p className="mt-1">
                                <strong>Description:</strong>
                              </p>
                              <textarea
                                value={editedOccurrence.description}
                                onChange={(e) => setEditedOccurrence({ ...editedOccurrence, description: e.target.value })}
                                className="w-full p-2 border rounded mb-2"
                              />
                            </>
                          ) : (
                            <p className="mt-1">
                              <strong>Description:</strong> {occurrence.description}
                            </p>
                          )}
                        </div>
                        {(selectedOccurrence && selectedOccurrence._id === occurrence._id) ? (
                          <div className="flex flex-col items-center space-y-2">
                            {selectedOccurrence?.user_id === user.id ? (
                              <button
                                onClick={() => handleEditOccurrence(occurrence)}
                                className="p-1 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                                title="Save"
                              >
                                <CheckIcon className="w-5 h-5" />
                              </button>
                            ) : null}
                            <button
                              onClick={() => setSelectedOccurrence(null)}
                              className="p-1 bg-gray-500 text-white text-sm font-medium rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                              title="Cancel"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => promptDeleteOccurrence(occurrence)}
                              className="p-1 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                              title="Delete"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Add new occurrence section */}
              <div className="mt-6 p-4 bg-gray-50 border rounded-lg shadow-md">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Add a New Occurrence</h3>

                {/* Date/Time Picker */}
                <div className="mb-4">
                  <label className="block text-gray-700 mb-1">Occurrence Date and Time:</label>
                  <input
                    type="datetime-local"
                    value={newOccurrence?.time || ''}
                    onChange={(e) => setNewOccurrence({ ...newOccurrence, time: e.target.value })}
                    max={new Date().toISOString().slice(0, 16)}
                    className="w-full p-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:border-blue-500 focus:ring focus:ring-blue-100 transition"
                  />
                </div>

                {/* Occurrence Text Area */}
                <textarea
                  value={newOccurrence?.description || ''}
                  onChange={(e) => setNewOccurrence({ ...newOccurrence, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-blue-500 focus:ring focus:ring-blue-100 transition"
                  placeholder="Describe the occurrence..."
                />

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2">
                  {newOccurrence && newOccurrence.description?.trim() && newOccurrence.time && (
                    <button
                      onClick={handleAddOccurrence}
                      className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition flex items-center"
                    >
                      <CheckIcon className="w-4 h-4 mr-1" />
                      Add Occurrence
                    </button>
                  )}
                  {newOccurrence ? (
                    <button
                      onClick={() => {
                        setNewOccurrence(null);
                      }}
                      className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition flex items-center"
                    >
                      <XMarkIcon className="w-4 h-4 mr-1" />
                      Discard
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Attachments section */}
              <div className="mt-4">
                {attachmentError || attachments.length > 0 ? (
                  <h2 className="text-xl font-bold mb-2">Attachments</h2>
                ) : null}
                {attachmentError && <p className="text-red-500">{attachmentError}</p>}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {attachments.map((attachment) => (
                    <div className="hover:bg-gray-200 rounded-md h-40 flex items-center justify-center relative overflow-hidden group">
                      <div className="relative w-full h-full flex items-center justify-center">
                        {/* <div
                          className="absolute inset-0 bg-cover bg-center filter blur-lg opacity-0 group-hover:opacity-100"
                          style={{ backgroundImage: `url(${attachment.signedUrl})` }}
                        ></div> */}
                        <img
                          src={attachment.signedUrl}
                          alt="Attachment"
                          className="relative rounded-md object-contain max-h-full max-w-full cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageClick(attachment.signedUrl);
                          }}
                        />
                      </div>
                      {(isAdmin || user.id === attachment.user_id) && (
                        <div className="absolute top-1 right-1 flex space-x-2 bg-gray-300 bg-opacity-0 rounded-full p-1 group-hover:bg-opacity-50 hover:bg-opacity-100">
                          <button
                            onClick={() => promptDeleteAttachment(attachment._id)}
                            title="Delete attachment"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* File upload input */}
                <div className="mt-4">
                  <h2 className="text-lg font-bold mb-2">Upload Attachments</h2>
                  <div
                    className={`mb-4 p-4 h-32 border-2 ${
                      isDragging ? 'border-primary' : 'border-secondary'
                    } border-dashed rounded cursor-pointer flex justify-center items-center`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('fileInput').click()}
                  >
                    <p className="text-sm text-gray-500">
                      {images.length > 0
                        ? `${images.length} file(s) selected`
                        : (
                          <>
                            <span className="block sm:hidden">Tap to select files</span>
                            <span className="hidden sm:block">Drag & drop images here, or click to select</span>
                          </>
                        )}
                    </p>
                  </div>
                  <input
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageSelection(Array.from(e.target.files))}
                    className="hidden"
                  />
                  {imagePreviews.length > 0 && (
                    <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index}`}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex justify-center items-center opacity-0 group-hover:opacity-100"
                            onClick={() => handleRemoveImage(index)}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {images.length > 0 && (
                    <div className="flex justify-start space-x-2">
                      <button
                        onClick={handleFileUpload}
                        className="px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      >
                        Upload Selected Files
                      </button>
                      <button
                        onClick={() => {
                          setImages([]);
                          setImagePreviews([]);
                        }}
                        className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments section */}
              <div className="mt-4">
                <h2 className="text-xl font-bold mb-2">Comments</h2>
                <ul className="comments-list">
                  {(originalIssue.comments || []).map((comment) => (
                    <li
                      key={comment._id}
                      className="comment-item mb-4 p-4 bg-white border rounded-lg shadow-md flex items-start space-x-4 transition-all duration-200"
                    >
                      {/* User Icon */}
                      <div className="w-10 h-10 flex-shrink-0">
                        <img
                          src={GetUserAvatar(comment.user_id?._id)}
                          alt="User Avatar"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </div>

                      {/* Comment Content */}
                      <div className="flex-grow">
                        {/* User name and comment date */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                          <span className="font-semibold text-gray-800 truncate">
                            {comment.user_id?.username || 'Unknown User'}
                          </span>
                          {comment.created_at ? (
                            <span
                              className="text-sm text-gray-500 truncate sm:ml-2"
                              title={comment.created_at ? new Date(comment.created_at).toLocaleString() : ''}
                            >
                              {formatSmartDate(comment.created_at)}
                            </span>
                          ) : null}
                        </div>

                        {/* Comment text */}
                        {editedComment?._id === comment._id ? (
                          <textarea
                            value={editedComment.comment_text}
                            onChange={(e) => setEditedComment({ ...editedComment, comment_text: e.target.value })}
                            className="w-full p-2 border rounded mb-2"
                          />
                        ) : (
                          <p className="mt-2 text-gray-700">
                            {comment.comment_text}
                          </p>
                        )}

                        {/* Edit/Delete actions for admins or comment owners */}
                        {(isAdmin || user.id === comment.user_id?._id) && (
                          <>
                            {editedComment?._id === comment._id ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditComment(comment)}
                                  className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditedComment(null)}
                                  className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="mt-2 flex space-x-2">
                                {user.id === comment.user_id?._id && (
                                  <button
                                    onClick={() => handleSelectComment(comment)}
                                    className="text-blue-500 text-sm hover:underline"
                                  >
                                    Edit
                                  </button>
                                )}
                                <button
                                  onClick={() => promptDeleteComment(comment)}
                                  className="text-red-500 text-sm hover:underline"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Add new comment section */}
              <div className="mt-6 p-4 bg-gray-50 border rounded-lg shadow-md">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Add a New Comment</h3>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:border-blue-500 focus:ring focus:ring-blue-100 transition"
                  placeholder="Write your comment here..."
                />
                <div className="flex justify-end space-x-2">
                  {newComment.trim() && (
                    <button
                      onClick={handleAddComment}
                      className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition flex items-center"
                    >
                      <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                      Send
                    </button>
                  )}
                  {newComment.trim() && (
                    <button
                      onClick={() => setNewComment('')}
                      className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition flex items-center"
                    >
                      <XMarkIcon className="w-5 h-5 mr-2" />
                      Discard
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* Issue sidebar with metadata */}
            <div className="issue-sidebar mt-4 md:mt-0 md:ml-4">
              <div className="issue-meta">
                <p className="md:mb-4">
                  <strong>Reported by: </strong>{" "}
                  <span className="inline md:block">
                    {username.split('.').map(part => part.replace(/\d+$/, '')).join(' ')}
                  </span>
                </p>

                <div>
                  <p className="md:mb-4">
                    <strong>Created at:</strong>{" "}
                    <span
                      title={originalIssue.created_at ? new Date(originalIssue.created_at).toLocaleString() : ''}
                      className="inline md:block"
                    >
                      {originalIssue.created_at ? formatSmartDate(originalIssue.created_at) : 'N/A'}
                    </span>
                  </p>
                  <p className="md:mb-4">
                    <strong>Updated at:</strong>{" "}
                    <span
                      title={originalIssue.updated_at ? new Date(originalIssue.updated_at).toLocaleString() : ''}
                      className="inline md:block"
                    >
                      {originalIssue.updated_at ? formatSmartDate(originalIssue.updated_at) : 'N/A'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {toast && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-6 max-w-sm w-full">
            <p
              className={`text-center mb-4 ${
                toast.type === "success"
                  ? "text-green-600"
                  : toast.type === "error"
                  ? "text-red-600"
                  : toast.type === "warning"
                  ? "text-yellow-600"
                  : "text-blue-600"
              }`}
            >
              {toast.message}
            </p>
            {toast.onConfirm ? (
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    toast.onConfirm();
                    setToast(null);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setToast(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setToast(null)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                OK
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default forwardRef(IssueView);