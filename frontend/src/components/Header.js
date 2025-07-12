import React from 'react';

const Header = () => {
  return (
    <header className="text-dark body-font w-full bg-secondary">
      <div className="flex w-full h-16 flex-wrap p-5 flex-col md:flex-row items-center">

        {/* Search Bar */}
        <div className="md:ml-auto md:mr-auto w-full md:w-auto flex justify-center items-center">
          <input
            type="text"
            className="w-full md:w-64 py-2 px-4 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Search issues..."
          />
          <button className="ml-2 bg-primary hover:bg-primaryHover text-white py-2 px-4 rounded">
            Search
          </button>
        </div>

        {/* Button */}
        <button className="inline-flex items-center bg-neutral border-0 py-1 px-3 focus:outline-none hover:bg-accent rounded text-base mt-4 md:mt-0 text-dark">
          Button
        </button>
      </div>
    </header>
  );
};

export default Header;