// src/components/DocumentViewer.js
import React from 'react';

export default function DocumentViewer({ fileUrl, title, onClose }) {
  return (
    <div className="bg-white p-4 rounded-lg max-w-4xl w-full max-h-full overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
     
      </div>
      <iframe
        src={fileUrl}
        title={title}
        className="relative
                                                     w-[90vw]
                                                     h-[90vh]
                                                     max-w-[90vw]
                                                     max-h-[90vh]
                                                    p-4"
      />
      <div className="mt-4 text-right">
        <a href={fileUrl} download className="text-blue-600 hover:underline">
          Download
        </a>
      </div>
    </div>
  );
}