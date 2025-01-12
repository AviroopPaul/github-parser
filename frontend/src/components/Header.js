import React from "react";
import { useNavigate } from "react-router-dom";

function Header({ userData, onLogout }) {
  return (
    <header className="bg-gray-800 border-b border-cyan-900/30">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={userData?.avatar_url}
              alt="Profile"
              className="w-10 h-10 rounded-full border-2 border-cyan-400"
            />
            <div>
              <h2 className="text-xl font-semibold text-cyan-400">
                {userData?.name || userData?.login}
              </h2>
              {userData?.email && (
                <p className="text-sm text-gray-400">{userData.email}</p>
              )}
            </div>
          </div>
          <nav className="flex items-center space-x-6">
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md
                hover:bg-red-500 transition-colors duration-300
                border border-red-500/30 hover:shadow-lg hover:shadow-red-500/20"
            >
              Logout
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
