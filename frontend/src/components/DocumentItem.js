import React from 'react';

export default function DocumentItem({ doc, selected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-2 rounded mb-1 transition-colors 
        ${
          selected
            ? 'bg-primary text-white'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
    >
      {doc.title}
    </button>
  );
}
