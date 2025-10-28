import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaHome,
  FaStar,
  FaImages,
  FaCloudUploadAlt,
  FaHistory,
  FaTrash,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import { MdAlbum } from 'react-icons/md';
import './Sidebar.css';

const Sidebar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { id: 'home', path: '/albums', icon: <FaHome />, label: 'Home', exact: true },
    { id: 'favorites', path: '/favorites', icon: <FaStar />, label: 'Favorites' },
    { id: 'albums', path: '/albums', icon: <MdAlbum />, label: 'Albums' },
    { id: 'recent', path: '/recent', icon: <FaHistory />, label: 'Recently Added' },
    { id: 'upload', path: '/upload', icon: <FaCloudUploadAlt />, label: 'Upload' },
    { id: 'trash', path: '/trash', icon: <FaTrash />, label: 'Trash' }
  ];

  const toggleSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeSidebar = () => {
    setIsMobileOpen(false);
  };

  // Close sidebar when clicking on nav link
  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      closeSidebar();
    }
  };

  // Close sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        closeSidebar();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button 
        className="mobile-menu-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay */}
      {isMobileOpen && (
        <div 
          className="mobile-overlay"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <FaImages className="logo-icon" />
            <span className="logo-text">KaviosPix</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <h3 className="nav-section-title">Library</h3>
            <ul className="nav-menu">
              {menuItems.map((item) => (
                <li key={item.id} className="nav-item">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => 
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                    end={item.exact}
                    onClick={handleNavClick}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

      </div>
    </>
  );
};

export default Sidebar;