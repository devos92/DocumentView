import React from 'react';
import { ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen bg-gray-100 flex items-center justify-center">
      <div className="container flex flex-col md:flex-row items-center justify-center px-5 text-gray-700">
        <div className="max-w-md">
          <div className="text-5xl font-dark font-bold">404</div>
          <p className="text-2xl md:text-3xl font-light leading-normal">
            Sorry we couldn't find this page.
          </p>
          <p className="mb-8 text-base">
            But don’t worry, you can go back to our dashboard and try again.
          </p>

          <button
            className="mt-auto bg-primary text-white py-2 px-4 my-2 rounded-md text-sm font-semibold hover:bg-primary-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500"
            onClick={() => navigate('/')}
          >
            Back to dashboard
          </button>
        </div>
        <div className="max-w-lg hidden sm:block">
            <ComputerDesktopIcon className="w-56 h-56" />
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;
