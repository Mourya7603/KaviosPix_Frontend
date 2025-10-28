import React from 'react';
import { FaCamera, FaSearch, FaUser, FaSignOutAlt } from 'react-icons/fa';
import './Header.css';

const Header = ({ onSearch, searchQuery, user, onLogout }) => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <FaCamera className="logo-icon" />
          <span className="logo-text">KaviosPix</span>
        </div>
      </div>

      <div className="header-center">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search your photos..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="search-input"
          />
          <FaSearch className="search-icon" />
        </div>
      </div>

      <div className="header-right">
        {user && (
          <div className="user-menu">
            <FaUser className="user-icon" />
            <span className="user-name">{user.name}</span>
            <button onClick={onLogout} className="logout-btn">
              <FaSignOutAlt className="logout-icon" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;