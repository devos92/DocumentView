// src/components/DocumentViewer.js
import React from 'react';
import IntextSearch from './IntextSearch'; // default export
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function DocumentViewer({ fileUrl, title, onClose }) {
  return (
    <div className="bg-white p-4 rounded-lg max-w-[90vw] max-h-[90vh] w-[90vw] h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-300" />
        </button>
      </div>

      {/* PDF viewer with in‑document search */}
      <div className="flex-1 overflow-auto border rounded">
        <IntextSearch file={fileUrl} />
      </div>

      {/* Download link */}
      <div className="mt-4 text-right">
        <a
          href={fileUrl}
          download
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Download
        </a>
      </div>
    </div>
  );
}
