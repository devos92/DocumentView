import {
  Bars3Icon,
  InformationCircleIcon,
  QueueListIcon,
  RectangleGroupIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import Fuse from 'fuse.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import apiClient from '../../api/apiClient';
import FluentLayout from '../../components/FluentLayout';
import Issue from '../../components/Issue';
import IssueView from '../../components/IssueView';
import Logo from '../../components/Logo';
import Sidebar from '../../components/Sidebar';
import { useModal } from '../../context/ModalContext';
import { useUser } from '../../context/UserContext';
import { Link } from 'react-router-dom';
import { generateNiceReferenceId } from '../../helpers/IssueHelpers';
import '../../styles/base.css';
import '../../styles/loadingRing.css';

/**
 * Dashboard component for displaying and managing documents.
 * Includes functionalities such as adding, deleting, searching, and filtering documents.
 * The component retrieves documents based on the authenticated user's context and filter preferences.
 */
const Dashboard = () => {
  const navigate = useNavigate(); // React Router hook for programmatic navigation
  const [setPopupHandler] = useState(() => () => {}); // Handler function for different popups
  const [fetched, setFetched] = useState(false); // State to track if the documents have been fetched
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State to control sidebar visibility
  const [searchTerm, setSearchTerm] = useState(''); // Search term for filtering documents
  const [noDocsMessage, setNoIssuesMessage] = useState(''); // Holds message to display when no documents are found
  const [allIssues, setAllIssues] = useState([]); // All documents retrieved from the API
  const [filteredDocs, setFilteredIssues] = useState([]); // Issues filtered based on search term or filter type
  const [updateTrigger, setUpdateTrigger] = useState(0); // Trigger to force re-fetch of documents
  const [filterType, setFilterType] = useState(
    localStorage.getItem('filterType') || 'all'
  ); // Filter type for documents, initialized from localStorage
  const [statusFilter, setStatusFilter] = useState(
    JSON.parse(localStorage.getItem('statusFilter')) || []
  ); // State for the status filter
  const { user } = useUser(); // Fetch authenticated user data from the context
  const [layoutType, setLayoutType] = useState(
    localStorage.getItem('layoutType') || 'masonry'
  ); // Layout type for displaying documents - masonry, grid, or list
  const [isLayoutDropdownOpen, setIsLayoutDropdownOpen] = useState(false); // State to control visibility of the layout dropdown
  const { openModal, closeModal } = useModal();

  /**
   * Fetches documents from the API based on the filter type and user context.
   * Uses useCallback to memoize the function, preventing unnecessary re-fetching on re-renders.
   */
  const fetchDocs = useCallback(async () => {
    if (!user || !user.id) {
      console.error('User data is not available yet.');
      return;
    }

    setFetched(false); // Ensure UI shows loading wheel when fetching begins

    try {
      // Clear previous documents state
      setAllIssues([]);
      setFilteredIssues([]);
      setNoIssuesMessage(''); // Clear any existing messages

      let endpoint = 'api/documents'; // Default endpoint to fetch all documents
      if (filterType === 'myIssues' && user.id) {
        endpoint = `api/documents?userId=${user.id}`; // Fetch only documents reported by the current user
      }

      const response = await apiClient.get(endpoint); // Fetch documents from API

      if (response.data.success) {
        let documents = response.data.data;
        documents = documents.map((issue) => ({
          ...issue,
          ref_id: generateNiceReferenceId(issue),
        }));

        // Apply status filter
        if (statusFilter.length > 0) {
          documents = documents.filter((issue) => {
            // Extract the latest status_id from status_history
            const latestStatus =
              issue.status_history.length > 0
                ? issue.status_history[issue.status_history.length - 1]
                    .status_id
                : null;
            return statusFilter.includes(latestStatus);
          });
        }

        setAllIssues(documents); // Set the documents data
        setFilteredIssues(documents);
        setNoIssuesMessage(''); // Clear any existing message
      } else {
        setNoIssuesMessage(response.data.message); // Display the message from the backend
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setNoIssuesMessage('Error fetching documents. Please try again later.');
    } finally {
      setFetched(true); // Ensure UI shows that fetching is complete
    }
  }, [filterType, statusFilter, user]);

  /**
   * useEffect hook to fetch documents whenever the filter type, update trigger, or user context changes.
   */
  useEffect(() => {
    fetchDocs();
  }, [fetchDocs, updateTrigger]);

  /**
   * Triggers a re-fetch of documents when a modal is closed, if the object was updated.
   * @param {Object} changed - Flag to indicate if the object was updated.
   */
  const closeModalCallback = (changed) => {
    closeModal();
    if (changed) {
      setUpdateTrigger((prev) => prev + 1);
    }
  };

  // Configuration for Fuse.js
  const fuseOptions = {
    keys: ['title', 'description', 'ref_id'],
    threshold: 0.3, // Adjust the threshold for fuzzy matching
  };

  // Initialize Fuse.js with all documents
  const fuse = new Fuse(allIssues, fuseOptions);

  /**
   * Handles user input for searching documents.
   * @param {Object} event - The event object from the search input.
   */
  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);

    let newFilteredIssues;

    if (!term) {
      // If search term is empty, show all documents
      newFilteredIssues = allIssues;
    } else {
      // Use Fuse.js for fuzzy search
      const result = fuse.search(term);
      newFilteredIssues = result.map(({ item }) => item);
    }

    // Apply status filter
    const statusFilteredIssues =
      statusFilter.length === 0
        ? newFilteredIssues
        : newFilteredIssues.filter((issue) =>
            statusFilter.includes(issue.status_id)
          );

    setFilteredIssues(statusFilteredIssues);
  };

  const handleFilterChange = (selectedOption) => {
    const selectedFilters = selectedOption.value;
    setFilterType(selectedFilters);
    localStorage.setItem('filterType', selectedFilters);
  };

  const handleLayoutChange = (type) => {
    setLayoutType(type);
    localStorage.setItem('layoutType', type);
    setIsLayoutDropdownOpen(false);
  };

  const toggleLayoutDropdown = () => {
    setIsLayoutDropdownOpen(!isLayoutDropdownOpen);
  };

  const handleStatusFilterChange = (selectedOptions) => {
    const selectedStatuses = selectedOptions.map((option) => option.value);
    setStatusFilter(selectedStatuses);
    localStorage.setItem('statusFilter', JSON.stringify(selectedStatuses));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isLayoutDropdownOpen && !event.target.closest('.layout-dropdown')) {
        setIsLayoutDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLayoutDropdownOpen]);

  // Return loading screen if documents have not been fetched yet
  if (!fetched) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="lds-ring">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const filterOptions = [
    // Insertion order depicts the order in the dropdown
    { value: 'all', label: 'All Issues' },
    { value: 'myIssues', label: 'My Issues' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-dark">
      {/* Header */}
      <header className="relative bg-primary shadow p-4 flex items-center justify-between dark:bg-primaryAlt">
        {/* Left: Logo and Hamburger */}
        <div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="bg-white text-primary-600 px-4 py-2 rounded-lg font-semibold focus:outline-none transition-transform transform hover:scale-105 hover:shadow-lg flex items-center space-x-2 lg:hidden dark:bg-gray-800 dark:text-white dark:placeholder-white"
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

        {/* Search Bar */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-64 max-w-md sm:w-full px-4">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={handleSearch}
            className="px-4 py-2 border rounded-lg w-full text-black focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-center dark:bg-gray-800 dark:text-white dark:placeholder-white"
            style={{ textAlign: 'center' }}
          />
        </div>

        {/* Right: New Issue Button and Layout Toggle */}
        <div className="flex items-center space-x-4">
          <div className="relative layout-dropdown hidden md:block">
            <button
              onClick={toggleLayoutDropdown}
              className="bg-white text-primary-600 px-4 py-2 rounded-lg font-semibold focus:outline-none transition-transform transform hover:scale-105 hover:shadow-lg dark:bg-gray-800 dark:text-white dark:placeholder-white"
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
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 layout-dropdown-menu dark:bg-neutral dark:border-gray-700">
                <button
                  onClick={() => handleLayoutChange('masonry')}
                  className={`block w-full text-left px-4 py-2 text-gray-700  dark:hover:text-gray-100 dark:hover:bg-gray-700 ${
                    layoutType === 'masonry'
                      ? 'bg-gray-100 dark:text-gray-100 dark:bg-gray-700'
                      : ''
                  }`}
                >
                  <RectangleGroupIcon className="w-5 h-5 inline mr-2" />
                  Adaptive
                </button>
                <button
                  onClick={() => handleLayoutChange('grid')}
                  className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 dark:hover:text-gray-100 dark:hover:bg-gray-700 ${
                    layoutType === 'grid'
                      ? 'bg-gray-100 dark:bg-gray-700 dark:text-gray-100'
                      : ''
                  }`}
                >
                  <Squares2X2Icon className="w-5 h-5 inline mr-2" />
                  Grid
                </button>
                <button
                  onClick={() => handleLayoutChange('list')}
                  className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 dark:hover:text-gray-100 dark:hover:bg-gray-700 ${
                    layoutType === 'list'
                      ? 'bg-gray-100 dark:text-gray-100 dark:bg-gray-700'
                      : ''
                  }`}
                >
                  <QueueListIcon className="w-5 h-5 inline mr-2" />
                  List
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-grow">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          navigate={navigate}
        />

        {/* Main Content */}
        <main className="flex-grow p-4 overflow-y-auto">
          <div className="flex space-x-4 items-center mb-4">
            {/* Filter Dropdown */}
            {user?.role === 'admin' && (
              <Link
                to="/upload"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all"
              >
                Upload Document
              </Link>
            )}

            <div className="bg-white rounded-lg transition-transform transform hover:scale-105 hover:shadow-lg z-10">
              <Select
                id="filter-select"
                options={filterOptions}
                value={
                  filterOptions.find((option) => filterType === option.value) ||
                  null
                }
                onChange={handleFilterChange}
                className="text-primary-600 font-semibold focus:outline-none"
                placeholder="Filter by Owner"
              />
            </div>
          </div>
          {/* Display message if no documents found */}
          {noDocsMessage && (
            <div className="flex justify-center items-center text-center text-red-500 mb-4 h-full dark:text-red-400">
              {noDocsMessage}
            </div>
          )}
          {filteredDocs.length === 0 && !noDocsMessage && (
            <div className="flex justify-center items-center text-center text-gray-500 mb-4 h-full dark:text-gray-400">
              <InformationCircleIcon className="w-6 h-6 inline mr-2" />
              No documents found. Try changing the search term or filters
            </div>
          )}
          <FluentLayout
            layoutType={layoutType}
            items={filteredDocs}
            renderItem={(issue, index) => (
              <Issue
                key={issue._id}
                index={index}
                data={issue}
                closeIssueModal={closeModalCallback}
                className="bg-background shadow-md rounded-lg p-4 min-h-[200px] flex flex-col justify-between dark:bg-neutral"
              />
            )}
          />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
