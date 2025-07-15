import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import Sidebar from '../components/Sidebar';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Logo from '../components/Logo';
import { useUser } from '../context/UserContext';

const UploadDocument = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const isAdmin = user?.role === 'admin';

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !file) {
      setToast({ type: 'error', message: 'Fill in all fields and select a file.' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setToast(null);

    try {
      // Create the document
      const createRes = await apiClient.post('/api/documents', { title });
      const documentId = createRes.data._id;

      const formData = new FormData();
      formData.append('file', file);

      // Upload with progress tracking
      await apiClient.post(
        `/api/documents/${documentId}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            const percent = Math.round((evt.loaded * 100) / evt.total);
            setUploadProgress(percent);
          }
        }
      );

      setToast({ type: 'success', message: 'Upload successful! Redirecting...' });
      // auto-redirect after short delay
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      console.error('Upload error:', err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Upload failed' });
    } finally {
      setIsUploading(false);
    }
  };

  // auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-600">You must be an admin to upload documents.</p>
      </div>
    );
  }

  return (
     <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-dark">
      {/* Header */}
      <header className="relative bg-primary shadow p-4 flex items-center justify-between dark:bg-primaryAlt">
        {/* Left: Logo and Hamburger */}
        <div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="bg-white text-primary-600 px-4 py-2 rounded-lg font-semibold focus:outline-none transition-transform transform hover:scale-105 hover:shadow-lg flex items-center space-x-2 lg:hidden dark:bg-gray-700 dark:text-white"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <span className="hidden lg:inline">
            <Logo className="truncate text-neutral dark:text-white xs:text-base md:text-lg lg:text-4xl" navigate={navigate} useClick={true} />
          </span>
        </div>
      </header>
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} navigate={navigate} />
      <main className="flex-grow p-6">
        <div className="max-w-2xl mx-auto bg-white dark:bg-neutral shadow-md rounded-lg p-8 space-y-6">
          <div>
            <Logo className="h-10" />
          </div>
          <h2 className="text-2xl font-semibold text-primary">Upload Document</h2>

          {toast && (
            <div
              className={`fixed top-4 right-4 px-4 py-2 rounded shadow-md text-white ${
                toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
              }`}
            >
              {toast.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Document Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter document title"
                disabled={isUploading}
              />
            </div>

            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select PDF File
              </label>
              <input
                id="file"
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full mt-1 text-gray-800"
                disabled={isUploading}
              />
            </div>

            {isUploading && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Upload Progress: {uploadProgress}%
                </label>
                <progress className="w-full h-2" value={uploadProgress} max="100"></progress>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default UploadDocument;
