import React from 'react';

export default function DocumentItem({ doc, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer p-4 mb-2 bg-white rounded shadow hover:bg-gray-100 dark:bg-neutral dark:hover:bg-neutral-700"
    >
      <h3 className="font-medium">{doc.title}</h3>
      <p className="text-sm text-gray-500">
        {new Date(doc.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
