// src/pages/dashboard/Dashboard.js
import React, { useCallback, useEffect, useState } from 'react';
import { Bars3Icon, InformationCircleIcon } from '@heroicons/react/24/outline';
import Fuse from 'fuse.js';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import Logo from '../../components/Logo';
import Sidebar from '../../components/Sidebar';
import DocumentItem from '../../components/DocumentItem';
import { useNavigate } from 'react-router-dom';
import DocumentViewer from '../../components/DocumentViewer';
import { useModal } from '../../context/ModalContext';
import { useUser } from '../../context/UserContext';
import '../../styles/base.css';
import '../../styles/loadingRing.css';

const Dashboard = () => {
  const { user } = useUser();
  const isAdmin = user?.role === 'admin';
  const { openModal, closeModal } = useModal();

  const [docs, setDocs] = useState([]);
  const [filteredDocs, setF] = useState([]);
  const [searchTerm, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  // 1) fetch metadata
  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/documents');
      setDocs(res.data);
      setF(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // 2) search
  const fuse = new Fuse(docs, { keys: ['title'], threshold: 0.3 });
  const handleSearch = (e) => {
    const t = e.target.value;
    setSearch(t);
    setF(t ? fuse.search(t).map((r) => r.item) : docs);
  };

  const openDocument = async (doc) => {
    try {
      const { data: atts } = await apiClient.get(
        `/api/documents/${doc._id}/signedUrls`
      );
      if (!atts.length) return alert('No attachments');
      openModal(
        <DocumentViewer
          fileUrl={atts[0].signedUrl}
          title={doc.title}
          onClose={closeModal}
        />
      );
    } catch (err) {
      console.error(err);
      alert('Could not load document');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="lds-ring">
          <div />
          <div />
          <div />
          <div />
        </div>
        <p>Loading…</p>
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
            <Logo
              className="truncate text-neutral dark:text-white xs:text-base md:text-lg lg:text-4xl"
              navigate={navigate}
              useClick={true}
            />
          </span>
        </div>

        <input
          className="px-4 py-2 w-64 rounded-lg focus:outline-none"
          placeholder="Search…"
          value={searchTerm}
          onChange={handleSearch}
        />
        {isAdmin && (
          <Link
            to="/upload"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Upload
          </Link>
        )}
      </header>

      <div className="flex flex-grow">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          navigate={navigate}
        />

        <main className="flex-1 p-4 overflow-auto">
          {filteredDocs.length === 0 ? (
            <div className="text-center text-gray-500">
              <InformationCircleIcon className="w-6 h-6 inline mr-1" />
              No documents.
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <DocumentItem
                key={doc._id}
                doc={doc}
                onClick={() => openDocument(doc)}
              />
            ))
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
