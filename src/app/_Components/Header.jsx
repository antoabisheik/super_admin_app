import React from 'react';
import { Plus } from 'lucide-react';

const Header = ({ title, count, onNewClick }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
          {count && (
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm font-medium">
              {count}
            </span>
          )}
        </div>
        <button 
          onClick={onNewClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Organization</span>
        </button>
      </div>
    </header>
  );
};

export default Header;