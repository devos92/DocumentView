import { Bars3Icon, DocumentArrowDownIcon, DocumentChartBarIcon, PhotoIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import apiClient from '../../api/apiClient';
import Logo from '../../components/Logo';
import Sidebar from '../../components/Sidebar';
import { useUser } from '../../context/UserContext';

import '../../styles/base.css';
import '../../styles/loadingRing.css';

import { BarGraph } from '../../components/graphs/Bar';
import { LineGraph } from '../../components/graphs/Line';
import { PieChart } from '../../components/graphs/Pie';

const DataVisualisation = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Used for loading the issues.
  const [fetched, setFetched] = useState(false);

  const { user } = useUser(); // Fetch authenticated user data from the context
  const [noIssuesMessage, setNoIssuesMessage] = useState(''); // Holds message to display when no issues are found
  const [allIssues, setAllIssues] = useState([]); // All issues retrieved from the API
  const [filteredIssues, setFilteredIssues] = useState([]); // Issues filtered based on search term or filter type
  const [updateTrigger, setUpdateTrigger] = useState(0); // Trigger to force re-fetch of issues
  const [filterType, setFilterType] = useState(localStorage.getItem('filterType') || 'all'); // Filter type for issues, initialized from localStorage
  const [statusFilter, setStatusFilter] = useState('all'); // State for the status filter

  const [graphType, setGraphType] = useState("added"); // Used for changing which graph is displayed.

  /**
  * Fetches issues from the API based on the filter type and user context.
  * Uses useCallback to memorize the function, preventing unnecessary re-fetching on re-renders.
  */
  const fetchIssues = useCallback(async () => {
    if (!user || !user.id) {
      console.error('User data is not available yet.');
      return;
    }

    setFetched(false); // Ensure UI shows loading wheel when fetching begins

    try {
      // Clear previous issues state
      setAllIssues([]);
      setFilteredIssues([]);
      setNoIssuesMessage(''); // Clear any existing messages

      let endpoint = 'api/issues'; // Default endpoint to fetch all issues
      if (filterType === 'myIssues' && user.id) {
        endpoint = `api/issues?userId=${user.id}`; // Fetch only issues reported by the current user
      }

      const response = await apiClient.get(endpoint); // Fetch issues from API

      if (response.data.success) {
        let issues = response.data.data;

        // Apply status filter
        if (statusFilter !== 'all') {
          issues = issues.filter((issue) => {
            // Extract the latest status_id from status_history
            const latestStatus = issue.status_history.length > 0 ? issue.status_history[issue.status_history.length - 1].status_id : null;
            return latestStatus === parseInt(statusFilter);
          });
        }

        setAllIssues(issues); // Set the issues data
        setFilteredIssues(issues);
        setNoIssuesMessage(''); // Clear any existing message
      } else {
        setNoIssuesMessage(response.data.message); // Display the message from the backend
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      setNoIssuesMessage('Error fetching issues. Please try again later.');
    } finally {
      setFetched(true); // Ensure UI shows that fetching is complete
    }
  }, [filterType, statusFilter, user]);

  /**
  * useEffect hook to fetch issues whenever the filter type, update trigger, or user context changes.
  */
  useEffect(() => {
    fetchIssues();
  }, [fetchIssues, updateTrigger]);

  /**
   * useEffect hook to fix the issue with the chart not resizing when the window is resized.
   */
  useEffect(() => {
    const handleResize = () => {
      setUpdateTrigger(prev => prev + 1); // This will cause a re-render and update the chart.
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Ref to track the dropdown element
  const exportDropdownRef = useRef(null);

  // Function to toggle export dropdown
  const toggleExportDropdown = () => {
    setIsExportDropdownOpen((prev) => !prev);
  };

  // Close dropdown if clicked outside of it
  const handleClickOutside = useCallback((event) => {
    if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
      setIsExportDropdownOpen(false);
    }
  }, []);

  // Attach the event listener on component mount and cleanup on unmount
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  /**
  * Handles changes in the filter type dropdown.
  * Saves the selected filter type to localStorage for persistence across sessions.
  * @param {Object} event - The event object from the filter dropdown.
  */
  const handleFilterChange = (event) => {
    const selectedFilter = event.target.value;
    setFilterType(selectedFilter);
    localStorage.setItem('filterType', selectedFilter); // Persist filter type to localStorage
  };

  // Return loading screen if issues have not been fetched yet
  if (!fetched) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="lds-ring"><div></div><div></div><div></div><div></div></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }


  // For counting how many issues were added per month.
  let addedIssuesPerMonth = {
    "January": 0,
    "February": 0,
    "March": 0,
    "April": 0,
    "May": 0,
    "June": 0,
    "July": 0,
    "August": 0,
    "September": 0,
    "October": 0,
    "November": 0,
    "December": 0
  }

  // For counting how many issues were added per month.
  let solvedIssuesPerMonth = {
    "January": 0,
    "February": 0,
    "March": 0,
    "April": 0,
    "May": 0,
    "June": 0,
    "July": 0,
    "August": 0,
    "September": 0,
    "October": 0,
    "November": 0,
    "December": 0
  }

  // For counting the statuses of issues.
  let issueStatusCount = {
    "Complete": 0,
    "In Progress": 0,
    "Cancelled": 0,
    "Pending": 0
  }

  let date = '';
  let issueMonth = '';
  let last = 0;
  filteredIssues && filteredIssues.map((issue) => { // For each issue retrieved from the database...
    date = new Date(issue.created_at); // ... convert the date it was created to a Date object...
    issueMonth = date.toLocaleString('default', { month: 'long' }); // ... get only the month...
    addedIssuesPerMonth[issueMonth] += 1 // ... and count the issue's occurrence in that month.

    last = issue.status_history.length - 1 // Used to get the last item in the status_history array.

    // For counting issue statuses.
    switch (issue.status_history[last].status_id) { // Gets the most recent status_id for the given issue.
      case 1:
        issueStatusCount["Complete"] += 1;
        solvedIssuesPerMonth[issueMonth] += 1;
        break;
      case 2:
        issueStatusCount["In Progress"] += 1;
        break;
      case 3:
        issueStatusCount["Cancelled"] += 1;
        break;
      default:
        issueStatusCount["Pending"] += 1;
        break;
    }
  })

  // Puts the added issue per month data into a format Chart.JS is happy with.
  const graphData = {
    labels: [ // X-axis.
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    datasets: [
      {
        label: "Issues Added",
        data: addedIssuesPerMonth, // Y-axis.
        borderColor: ["#185D78"],
        backgroundColor: ["#185D78"],
        borderWidth: 1,
      },
    ]
  }

  // Puts the solved issue per month data into a format Chart.JS is happy with.
  const lineData = {
    labels: [ // X-axis.
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    datasets: [
      {
        label: "Issues Solved",
        data: solvedIssuesPerMonth, // Y-axis.
        borderColor: ["#185D78"],
      },
    ]
  }

  // Puts the issue status data into a format Chart.JS is happy with.
  var pieData = [];
  for (var i in issueStatusCount) {
    pieData.push(issueStatusCount[i])
  }
  const pieChartData = {
    labels: ["Complete", "In Progress", "Cancelled", "Pending"],
    datasets: [
      {
        label: "Issue Status",
        data: pieData,
        backgroundColor: [
          "#A0DAB1",
          "#FFF3B0",
          "#FFB3B3",
          "#D3D3D3",
        ],
        hoverOffset: 4,
      }
    ]
  }

  // Used to control which graph is being displayed on screen.
  function displayGraph() {
    switch (graphType) {
      case 'added':
        return (
          <div className="chart-container flex flex-auto relative min-w-0 max-w-4xl">
            <BarGraph graphData={graphData} />
          </div>
        );
      case 'solved':
        return (
          <div className="chart-container flex flex-auto relative min-w-0 max-w-4xl">
            <LineGraph graphData={lineData} />
          </div>
        );
      case 'status':
        return (
          <div className="chart-container flex flex-auto relative min-w-0 max-w-2xl">
            <PieChart graphData={pieChartData} />
          </div>
        );
      default:
        return 'Error.';
    }
  }

  // Utility function to generate a default filename
  const generateDefaultFilename = (filterType, graphType) => {
    const now = new Date();
    const dateTime = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    return `${dateTime}_${filterType}_${graphType}`;
  };

  // Function to export the chart as PNG
  const exportToPNG = async () => {
    if (isExporting) {
      console.warn('Export already in progress. Please wait for the current export to complete.');
      return;
    }

    setIsExporting(true);
    setIsExportDropdownOpen(false);

    const chartElement = document.querySelector('.chart-container');
    if (!chartElement) return;

    try {
      const dataUrl = await toPng(chartElement);
      const link = document.createElement('a');
      link.download = `${generateDefaultFilename(filterType, graphType)}.png`;
      link.href = dataUrl;
      link.click();
      alert('Chart exported successfully!');
    } catch (err) {
      console.error('Error exporting to PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Function to export the chart as PDF
  const exportToPDF = async () => {
    if (isExporting) {
      console.warn('Export already in progress. Please wait for the current export to complete.');
      return;
    }

    setIsExporting(true);
    setIsExportDropdownOpen(false);

    const chartElement = document.querySelector('.chart-container');
    if (!chartElement) return;

    try {
      const dataUrl = await toPng(chartElement);
      const img = new Image();
      img.src = dataUrl;

      img.onload = async () => {
        const imgWidth = img.width;
        const imgHeight = img.height;

        // Determine orientation: if the image is wider than tall, use landscape
        const orientation = imgWidth > imgHeight ? 'landscape' : 'portrait';
        const pdf = new jsPDF({ orientation });

        // Get PDF dimensions
        const pdfWidth = orientation === 'landscape' ? pdf.internal.pageSize.getHeight() : pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

        // Add image to the PDF
        pdf.addImage(dataUrl, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 20);
        pdf.save(`${generateDefaultFilename(filterType, graphType)}.pdf`);
        alert('Chart exported successfully!');
      };
    } catch (err) {
      console.error('Error exporting to PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Function to export data as Excel
  const exportToXLSX = () => {
    if (isExporting) {
      console.warn('Export already in progress. Please wait for the current export to complete.');
      return;
    }

    setIsExporting(true);
    setIsExportDropdownOpen(false);

    try {
      const worksheet = XLSX.utils.json_to_sheet(filteredIssues);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Issues');
      XLSX.writeFile(workbook, `${generateDefaultFilename(filterType, graphType)}.xlsx`);
      alert('Issues exported successfully!');
    } catch (err) {
      console.error('Error exporting to XLSX:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-dark">
      {/* Header */}
      <header className="relative bg-primary shadow p-4 flex items-center justify-between dark:bg-primaryAlt">
        {/* Left: Logo and Hamburger */}
        <div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="bg-white  text-primary-600 px-4 py-2 rounded-lg font-semibold focus:outline-none transition-transform transform hover:scale-105 hover:shadow-lg flex items-center space-x-2 lg:hidden dark:bg-gray-800 dark:text-white dark:placeholder-white">
            <Bars3Icon className="w-6 h-6" />
          </button>
          <span className="hidden lg:inline">
            <Logo className="truncate text-neutral dark:text-white xs:text-base md:text-lg lg:text-4xl" navigate={navigate} useClick={true} />
          </span>
        </div>
      </header>

      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} navigate={navigate} />

        {/* Main Content */}
        <main className="flex-grow p-6">

          {/* Drop down menus */}
          <div className="flex flex-col space-y-4">

            {/* Filters and Export Button */}
            <div className="flex justify-between items-center min-w-0 mb-4">
              {/* Filters Parent */}
              <div className="flex-grow flex space-x-4 justify-center ">
                {/* Filter Dropdown */}
                <select
                  onChange={handleFilterChange}
                  value={filterType}
                  className="bg-white text-primary-600 py-2 rounded-lg font-semibold focus:outline-none transition-transform transform hover:scale-105 hover:shadow-lg dark:bg-gray-800 dark:text-white"
                >
                  <option value="all">All Issues</option>
                  <option value="myIssues">My Issues</option>
                </select>

                {/* "Sort by category" dropdown */}
                <select
                  onChange={(e) => setGraphType(e.target.value)}
                  value={graphType}
                  className="bg-white text-primary-600  py-2 rounded-lg font-semibold focus:outline-none transition-transform transform hover:scale-105 hover:shadow-lg dark:bg-gray-800 dark:text-white"
                >
                  <option value="added">Added issues / month</option>
                  <option value="solved">Completed issues / month</option>
                  <option value="status">Status of current issues</option>
                </select>
              </div>

              {/* Export Button */}
              <div className="relative ml-4 hidden sm:block" ref={exportDropdownRef}>

                <button
                  onClick={toggleExportDropdown}
                  className={`bg-primary text-white px-2 lg:px-4 py-2 rounded-lg shadow hover:bg-primaryAlt dark:bg-primaryAlt flex items-center ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <div className="lg:mr-2 inset-0 flex items-center justify-center">
                      <div className="loader"></div>
                    </div>
                  ) : (
                    <DocumentArrowDownIcon className="w-6 h-6 lg:mr-2" />
                  )}
                  <span className="hidden lg:inline">{isExporting ? 'Exporting...' : 'Export to...'}</span>
                </button>
                {isExportDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg py-2 z-10 dark:bg-gray-800">
                    <button
                      onClick={exportToPNG}
                      className=" w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 flex items-center"
                    >
                      <PhotoIcon className="w-5 h-5 mr-2" />
                      Export to PNG
                    </button>
                    <button
                      onClick={exportToPDF}
                      className=" w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 flex items-center"
                    >
                      <DocumentChartBarIcon className="w-5 h-5 mr-2" />
                      Export to PDF
                    </button>
                    <button
                      onClick={exportToXLSX}
                      className=" w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 flex items-center"
                    >
                      <TableCellsIcon className="w-5 h-5 mr-2" />
                      Export to XLSX
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Graph display */}
          <div className='flex justify-center'>
            {displayGraph()}
          </div>

        </main>
      </div>
    </div>
  );
}

export default DataVisualisation;
