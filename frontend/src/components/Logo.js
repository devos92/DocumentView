import React from 'react';
import './Logo.css';

const Logo = ({ navigate, useClick }) => {
  return (
    useClick ? (
      <button onClick={() => navigate('/')} className="text-primary-600 px-4 py-2 rounded-lg focus:outline-none transition-transform transform hover:scale-105 hover:shadow-lg flex items-center space-x-2 bg-white">
        <img src="../../logo256.png" alt="IssueStream logo" className="logo w-8 h-8" />
        <span className="hidden lg:inline text-logo red-hat-display-semi-bold">IssueStream</span>
      </button>
    ) : (
      <div className="flex items-center space-x-2">
        <img src="../../logo256.png" alt="IssueStream logo" className="logo w-8 h-8" />
        <span className="hidden lg:inline text-logo red-hat-display-semi-bold">IssueStream</span>
      </div>
    )
  );
};

export default Logo;