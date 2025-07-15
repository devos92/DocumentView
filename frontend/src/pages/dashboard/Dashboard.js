import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bars3Icon,
  InformationCircleIcon,
  QueueListIcon,
  RectangleGroupIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import Fuse from 'fuse.js';
import { useNavigate, Link } from 'react-router-dom';
import Select from 'react-select';
import apiClient from '../../api/apiClient';
import Logo from '../../components/Logo';
import Sidebar from '../../components/Sidebar';
import DocumentItem from '../../components/DocumentItem';
import { useUser } from '../../context/UserContext';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import '../../styles/base.css';
import '../../styles/loadingRing.css';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const isAdmin = user?.role === 'admin';

  const [fetched, setFetched] = useState(false);
  const [docs, setDocs] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docUrls, setDocUrls] = useState([]);
  const [numPages, setNumPages] = useState(null);
  const [layoutType, setLayoutType] = useState(
    localStorage.getItem('layoutType') || 'masonry'
  );
  const [isLayoutDropdownOpen, setIsLayoutDropdownOpen] = useState(false);

  const fetchDocs = useCallback(async () => {
    setFetched(false);
    try {
      const res = await apiClient.get('/api/documents');
      const list = Array.isArray(res.data) ? res.data : [];
      setDocs(list);
      setFilteredDocs(list);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setFetched(true);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // Search with Fuse.js
  const fuse = new Fuse(docs, { keys: ['title'], threshold: 0.3 });
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setFilteredDocs(term ? fuse.search(term).map((r) => r.item) : docs);
  };
  useEffect(() => {
    if (!selectedDoc) return;
    apiClient
      .get(`/api/documents/${selectedDoc._id}/signedUrls`)
      .then((res) => {
        console.log(
          'Received PDF URLs:',
          res.data.map((a) => a.signedUrl)
        );
        setDocUrls(res.data.map((a) => a.signedUrl));
      })
      .catch(console.error);
  }, [selectedDoc]);

  // When a doc is selected, fetch its signedUrls

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  if (!fetched)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="lds-ring">
          <div />
          <div />
          <div />
          <div />
        </div>
        <p>Loading...</p>
      </div>
    );

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-dark">
      {/* Header */}
      <header className="relative bg-primary shadow p-4 flex items-center justify-between dark:bg-primaryAlt">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              /* toggle sidebar */
            }}
            className="lg:hidden"
          >
            <Bars3Icon className="w-6 h-6 text-white" />
          </button>
          <Logo className="h-8 text-white" />
        </div>
        <input
          type="text"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={handleSearch}
          className="absolute left-1/2 transform -translate-x-1/2 px-4 py-2 w-64 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
        />
        <div className="flex items-center space-x-4">
          {isAdmin && (
            <Link
              to="/upload"
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg"
            >
              Upload
            </Link>
          )}
          <div className="relative hidden md:block">
            <button
              onClick={() => setIsLayoutDropdownOpen((o) => !o)}
              className="text-white"
            >
              {layoutType === 'masonry' ? (
                <RectangleGroupIcon className="w-6 h-6" />
              ) : layoutType === 'grid' ? (
                <Squares2X2Icon className="w-6 h-6" />
              ) : (
                <QueueListIcon className="w-6 h-6" />
              )}
            </button>
            {isLayoutDropdownOpen && (
              <div className="absolute right-0 mt-2 bg-white dark:bg-neutral rounded shadow-lg">
                <button
                  onClick={() => {
                    setLayoutType('masonry');
                    setIsLayoutDropdownOpen(false);
                  }}
                  className="flex items-center px-4 py-2 hover:bg-gray-100"
                >
                  <RectangleGroupIcon className="w-5 h-5 mr-2" /> Adaptive
                </button>
                <button
                  onClick={() => {
                    setLayoutType('grid');
                    setIsLayoutDropdownOpen(false);
                  }}
                  className="flex items-center px-4 py-2 hover:bg-gray-100"
                >
                  <Squares2X2Icon className="w-5 h-5 mr-2" /> Grid
                </button>
                <button
                  onClick={() => {
                    setLayoutType('list');
                    setIsLayoutDropdownOpen(false);
                  }}
                  className="flex items-center px-4 py-2 hover:bg-gray-100"
                >
                  <QueueListIcon className="w-5 h-5 mr-2" /> List
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-grow">
        <Sidebar />
        <main className="flex-grow p-4 flex space-x-6">
          {/* Sidebar List of Documents */}
          <aside className="w-1/4 bg-white dark:bg-neutral shadow rounded-lg p-4 space-y-2 overflow-auto">
            {filteredDocs.map((doc) => (
              <DocumentItem
                key={doc._id}
                doc={doc}
                selected={selectedDoc?._id === doc._id}
                onSelect={() => setSelectedDoc(doc)}
              />
            ))}
            {filteredDocs.length === 0 && (
              <p className="text-gray-500">No documents found.</p>
            )}
          </aside>

          {/* Inline PDF Viewer */}
          <section className="flex-1 bg-white dark:bg-neutral shadow rounded-lg p-4 overflow-auto">
            {selectedDoc && docUrls.length > 0 ? (
              <Document file={docUrls[0]} onLoadSuccess={onDocumentLoadSuccess}>
                {Array.from({ length: numPages }, (_, idx) => (
                  <Page key={idx} pageNumber={idx + 1} width={600} />
                ))}
              </Document>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <InformationCircleIcon className="w-6 h-6 mr-2" /> Select a
                document to view
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
