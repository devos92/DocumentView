import React, { useState } from 'react';
import apiClient from '../api/apiClient';
import { useModal } from '../context/ModalContext';
import { charmOptions } from '../helpers/IssueHelpers';
import TiptapEditor from './richtext/TiptapEditor';

/**
 * AddIssue component: This component provides a form for adding a new issue,
 * including options to select a charm, add a description, and upload attachments.
 * It supports drag-and-drop functionality for images and displays a preview of selected images.
 */
const AddIssue = ({ closeHandler }) => {
  const { closeModal } = useModal();

  // State for form fields
  const [title, setTitle] = useState(''); // Title of the issue
  const [description, setDescription] = useState(''); // Description of the issue
  const [charm, setCharm] = useState('⚠️'); // Default charm for the issue
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Controls visibility of the charm selection dropdown

  // State for handling image uploads
  const [images, setImages] = useState([]); // Array of selected image files
  const [imagePreviews, setImagePreviews] = useState([]); // Array of image preview URLs
  const [isDragging, setIsDragging] = useState(false); // Drag-and-drop state

  // State for displaying a preview modal
  const [previewImage, setPreviewImage] = useState(null); // Selected image to preview in modal

  /**
   * Handles form submission for creating a new issue.
   * Submits the issue data to the server and, if images are uploaded, handles the file uploads.
   * @param {Event} e - The form submission event.
   */
  const addHandler = (e) => {
    e.preventDefault(); // Prevent default form submission behaviour
    closeHandler(true); // Close the popup after submission

    const createIssue = async () => {
      const issueData = {
        title,
        description,
        charm,
      };

      try {
        // Create a new issue in the system
        const response = await apiClient.post('/api/issues', issueData, {
          headers: {
            'Content-Type': 'application/json', // JSON content type for issue creation
          },
        });

        const { issueID } = response.data; // Retrieve the created issue's ID

        // If images are selected, upload them as attachments
        if (images.length > 0) {
          await uploadAttachments(issueID);
        } else {
          window.location.reload(); // Reload the page if no attachments were uploaded
        }
      } catch (error) {
        console.error('Error creating issue:', error); // Log any errors encountered during issue creation
      }
    };

    /**
     * Uploads image attachments to the server for the created issue.
     * @param {string} issueId - The ID of the newly created issue.
     */
    const uploadAttachments = async (issueId) => {
      const formData = new FormData(); // FormData for handling file uploads
      images.forEach((image) => {
        formData.append('file', image); // Append each image file to FormData
        formData.append('title', image.name.split('.').slice(0, -1).join('.')); // Use the image's name as the title
      });

      try {
        // Upload attachments to the server
        await apiClient.post(`/api/attachments/${issueId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data', // Required content type for file uploads
          },
        });

        console.log('Attachments uploaded successfully.');
        window.location.reload(); // Reload the page after successful upload
      } catch (error) {
        console.error('Error uploading attachments:', error); // Log any errors encountered during file upload
      }
    };

    createIssue(); // Create the issue and handle attachments if applicable
  };

  /**
   * Handles drag-over event for drag-and-drop functionality.
   * @param {Event} e - The drag-over event.
   */
  const handleDragOver = (e) => {
    e.preventDefault(); // Prevent default drag behaviour
    setIsDragging(true); // Set dragging state to true
  };

  /**
   * Handles drag-leave event, resetting the dragging state.
   */
  const handleDragLeave = () => {
    setIsDragging(false); // Reset dragging state
  };

  /**
   * Handles drop event for drag-and-drop image upload.
   * @param {Event} e - The drop event.
   */
  const handleDrop = (e) => {
    e.preventDefault(); // Prevent default drop behaviour
    setIsDragging(false); // Reset dragging state

    // Extract files from the drop event
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files); // Convert FileList to Array
      handleImageSelection(files); // Handle the dropped images
    }
  };

  /**
   * Handles file input change event.
   * @param {Event} e - The file input change event.
   */
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files); // Convert FileList to Array
    handleImageSelection(files); // Handle the selected images
  };

  /**
   * Handles selection of images, updating the image state and generating previews.
   * @param {Array} files - Array of selected image files.
   */
  const handleImageSelection = (files) => {
    const newImages = [...images, ...files]; // Merge new images with existing ones
    const newPreviews = [...imagePreviews, ...files.map((file) => URL.createObjectURL(file))]; // Create preview URLs

    setImages(newImages); // Update state with selected images
    setImagePreviews(newPreviews); // Update state with image previews
  };

  /**
   * Removes a selected image from the state.
   * @param {number} index - Index of the image to remove.
   */
  const handleRemoveImage = (index) => {
    const newImages = images.filter((_, i) => i !== index); // Remove image from array
    const newPreviews = imagePreviews.filter((_, i) => i !== index); // Remove preview from array
    setImages(newImages); // Update images state
    setImagePreviews(newPreviews); // Update previews state
  };

  /**
   * Opens a modal to preview the selected image.
   * @param {string} imageUrl - URL of the image to preview.
   */
  const handlePreviewImage = (imageUrl) => {
    setPreviewImage(imageUrl); // Set the image to be displayed in the modal
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-lg max-w-3xl mx-auto max-h-screen overflow-auto">
      {/* Form Title */}
      <h2 className="text-2xl text-dark dark:text-white font-semibold mb-6 text-center">Add New Issue</h2>

      {/* Form for adding a new issue */}
      <form onSubmit={addHandler}>
        {/* Title Input */}
        <label className="block text-dark dark:text-white mb-2">Title:</label>
        <div className="mb-6 flex items-center space-x-4">
          {/* Charm Selection Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-gray-300 dark:bg-gray-700 border border-secondary p-2 rounded-full text-center flex justify-center items-center w-12 h-12 text-white"
            >
              {charm}
            </button>

            {/* Charm Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute left-0 mt-2 p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-lg rounded grid grid-cols-4 gap-2 overflow-visible z-10 w-80">
                {charmOptions.map((charmOption, index) => (
                  <div
                    key={index}
                    className={`cursor-pointer p-1 rounded-lg text-xl flex justify-center items-center ${
                      charm === charmOption ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-white'
                    }`}
                    onClick={() => {
                      setCharm(charmOption);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {charmOption}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Title Input Field */}
          <div className="flex-grow">
            <input
              className="bg-white dark:bg-gray-700 border border-secondary p-2 rounded outline-none w-full dark:text-white"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is the issue?"
              required
            />
          </div>
        </div>

        {/* Description Text Area */}
        <div className="mb-6">
          <label className="block text-dark dark:text-white mb-2">Description:</label>
          <TiptapEditor content={description} setContent={setDescription} />
        </div>

        {/* Attachments Section */}
        <label className="block text-dark dark:text-white mb-2">Attachments:</label>
        <div
          className={`mb-6 p-4 h-32 border-2 ${isDragging ? 'border-primary' : 'border-secondary'} border-dashed rounded cursor-pointer flex justify-center items-center dark:bg-gray-700`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('fileInput').click()}
        >
          {/* Attachment Prompt */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {images.length > 0
              ? `${images.length} file(s) selected`
              : (
                <>
                  <span className="block sm:hidden">Click to select image</span>
                  <span className="hidden sm:block">Drag & drop images here, or click to select</span>
                </>
              )}
          </p>
        </div>

        {/* Hidden File Input */}
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index}`}
                  className="w-full h-40 object-cover rounded"
                />

                {/* Preview Button */}
                <button
                  type="button"
                  className="absolute top-1 right-10 bg-blue-500 text-white rounded-full w-6 h-6 flex justify-center items-center opacity-0 group-hover:opacity-100"
                  onClick={() => handlePreviewImage(preview)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" transform="rotate(-45)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>

                {/* Remove Image Button */}
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

        {/* Form Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="mr-4 px-6 py-2 bg-primary text-white rounded hover:bg-primaryHover"
          >
            + Add
          </button>
          <button
            type="button"
            className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-dark dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500"
            onClick={() => {
              closeHandler(false);
              closeModal();
            }}
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative max-w-3xl max-h-[90vh] overflow-auto">
            <img src={previewImage} alt="Preview" className="max-w-full max-h-full" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-white text-black rounded-full w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddIssue;

