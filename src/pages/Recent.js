import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaHistory,
  FaCalendarAlt,
  FaSort,
  FaFilter,
  FaImages,
  FaFolder,
  FaSearch,
  FaSpinner,
  FaStar,
  FaRegStar,
  FaCloud,
  FaClock
} from 'react-icons/fa';
import { RiCloudLine } from 'react-icons/ri';
import { MdPhotoLibrary, MdViewDay, MdViewWeek} from 'react-icons/md';
import './Recent.css';

const Recent = ({ searchQuery }) => {
  const [recentImages, setRecentImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest'
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'
  const navigate = useNavigate();

  // Load all recent images from all albums
  const loadRecentImages = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all albums
      const albumsResponse = await axios.get('/albums');
      const albumsData = albumsResponse.data.albums;

      // Get images from all albums
      const imagePromises = albumsData.map(album =>
        axios.get(`/albums/${album.albumId}/images`)
      );

      const imageResponses = await Promise.all(imagePromises);
      
      // Combine all images with album info
      const allImages = imageResponses.flatMap((response, index) =>
        response.data.images.map(image => ({
          ...image,
          albumName: albumsData[index].name,
          albumId: albumsData[index].albumId,
          uploadedAt: new Date(image.uploadedAt)
        }))
      );

      setRecentImages(allImages);
      
    } catch (error) {
      console.error('Failed to load recent images:', error);
      alert('Failed to load recent images');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecentImages();
  }, [loadRecentImages]);

  const handleFavoriteToggle = async (imageId, albumId, currentFavoriteStatus) => {
    try {
      await axios.put(`/albums/${albumId}/images/${imageId}/favorite`, {
        isFavorite: !currentFavoriteStatus
      });

      // Update local state
      setRecentImages(prev => prev.map(img =>
        img.imageId === imageId ? { ...img, isFavorite: !currentFavoriteStatus } : img
      ));
      
    } catch (error) {
      console.error('Failed to update favorite:', error);
      alert('Failed to update favorite status');
    }
  };
  const handleNavigateToAlbum = (albumId) => {
    navigate(`/album/${albumId}`);
  };

  const handleImageClick = (image) => {
    navigate(`/album/${image.albumId}`);
  };

  // Filter and sort images
  const getFilteredAndSortedImages = () => {
    let filtered = recentImages;

    // Apply time filter
    const now = new Date();
    switch (timeFilter) {
      case 'today':
        filtered = filtered.filter(image => {
          const imageDate = new Date(image.uploadedAt);
          return imageDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(image => new Date(image.uploadedAt) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(image => new Date(image.uploadedAt) >= monthAgo);
        break;
      default:
        // 'all' - no time filter
        break;
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(image =>
        image.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        image.person?.some(person => person.toLowerCase().includes(searchQuery.toLowerCase())) ||
        image.albumName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      } else {
        return new Date(a.uploadedAt) - new Date(b.uploadedAt);
      }
    });

    return filtered;
  };

  const filteredImages = getFilteredAndSortedImages();

  // Group images by date for list view
  const groupImagesByDate = (images) => {
    const groups = {};
    images.forEach(image => {
      const date = new Date(image.uploadedAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(image);
    });
    return groups;
  };

  const imagesByDate = groupImagesByDate(filteredImages);

  // Get time filter options
  const getTimeFilterText = () => {
    switch (timeFilter) {
      case 'today': return 'Today';
      case 'week': return 'Past Week';
      case 'month': return 'Past Month';
      default: return 'All Time';
    }
  };

  if (loading) {
    return (
      <div className="recent-loading">
        <FaSpinner className="loading-spinner" />
        <p>Loading recent photos...</p>
      </div>
    );
  }

  return (
    <div className="recent-page">
      <div className="recent-header">
        <div className="header-content">
          <div className="header-icon">
            <FaHistory />
          </div>
          <div className="header-info">
            <h1>Recently Added</h1>
            <p>
              {filteredImages.length} {filteredImages.length === 1 ? 'photo' : 'photos'} 
              {timeFilter !== 'all' && ` from ${getTimeFilterText().toLowerCase()}`}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
        </div>
        
        <div className="header-stats">
          <div className="stat-item">
            <FaImages className="stat-icon" />
            <span>{recentImages.length} total uploads</span>
          </div>
          <div className="stat-item">
            <RiCloudLine className="stat-icon" />
            <span>Cloudinary Storage</span>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="recent-controls">
        <div className="controls-left">
          <div className="filter-group">
            <FaFilter className="control-icon" />
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
            </select>
          </div>

          <div className="filter-group">
            <FaSort className="control-icon" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        <div className="controls-right">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <MdViewDay />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <MdViewWeek />
            </button>
          </div>
        </div>
      </div>

      {searchQuery && (
        <div className="search-results-info">
          <FaSearch className="search-icon" />
          Showing {filteredImages.length} of {recentImages.length} recent photos
        </div>
      )}

      <div className="recent-content">
        {filteredImages.length === 0 ? (
          <div className="empty-recent">
            <div className="empty-icon">
              <FaHistory />
            </div>
            <h3>
              {searchQuery ? 'No recent photos found' : 'No recent uploads'}
            </h3>
            <p>
              {searchQuery 
                ? 'Try adjusting your search terms or time filter'
                : timeFilter !== 'all' 
                  ? `No photos uploaded ${getTimeFilterText().toLowerCase()}`
                  : 'Upload some photos to see them here'
              }
            </p>
            {!searchQuery && timeFilter === 'all' && (
              <button 
                className="upload-now-btn"
                onClick={() => navigate('/albums')}
              >
                <MdPhotoLibrary className="btn-icon" />
                Upload Photos
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="recent-grid">
            {filteredImages.map(image => (
              <div key={image.imageId} className="recent-image-card">
                <div className="image-container">
                  <img 
                    src={image.thumbnailUrl || image.url} 
                    alt={image.name}
                    loading="lazy"
                    onClick={() => handleImageClick(image)}
                  />
                  
                  <div className="image-actions">
                    <button
                      className={`action-btn favorite-btn ${image.isFavorite ? 'favorited' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavoriteToggle(image.imageId, image.albumId, image.isFavorite);
                      }}
                      title={image.isFavorite ? 'Remove favorite' : 'Add to favorites'}
                    >
                      {image.isFavorite ? <FaStar /> : <FaRegStar />}
                    </button>
                   
                  </div>

                  <div className="image-badges">
                    {image.isFavorite && (
                      <div className="favorite-badge" title="Favorite">
                        <FaStar />
                      </div>
                    )}
                    <div className="cloudinary-badge" title="Stored in Cloudinary">
                      <RiCloudLine />
                    </div>
                    <div className="recent-badge" title="Recently Uploaded">
                      <FaClock />
                    </div>
                  </div>

                  <div className="upload-time">
                    <FaClock className="time-icon" />
                    {getTimeAgo(image.uploadedAt)}
                  </div>
                </div>

                <div className="image-info">
                  <div className="image-name" title={image.name}>
                    {image.name.length > 20 ? `${image.name.substring(0, 20)}...` : image.name}
                  </div>
                  
                  <div className="image-source">
                    <FaFolder className="source-icon" />
                    <span 
                      className="source-text" 
                      title={image.albumName}
                      onClick={() => handleNavigateToAlbum(image.albumId)}
                    >
                      {image.albumName}
                    </span>
                  </div>

                  {image.tags && image.tags.length > 0 && (
                    <div className="image-tags">
                      {image.tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className="tag">#{tag}</span>
                      ))}
                      {image.tags.length > 2 && (
                        <span className="tag-more">+{image.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                  
                  <div className="image-meta">
                    <span className="meta-item">
                      <FaCalendarAlt className="meta-icon" />
                      {image.uploadedAt.toLocaleDateString()}
                    </span>
                    <span className="meta-item">
                      <FaCloud className="meta-icon" />
                      {(image.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="recent-list">
            {Object.entries(imagesByDate).map(([date, images]) => (
              <div key={date} className="date-group">
                <div className="date-header">
                  <FaCalendarAlt className="date-icon" />
                  <h3 className="date-title">
                    {date === new Date().toDateString() ? 'Today' : 
                     date === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString() ? 'Yesterday' : 
                     date}
                  </h3>
                  <span className="date-count">{images.length} photos</span>
                </div>
                
                <div className="date-images">
                  {images.map(image => (
                    <div key={image.imageId} className="recent-list-item">
                      <div 
                        className="list-image"
                        onClick={() => handleImageClick(image)}
                      >
                        <img 
                          src={image.thumbnailUrl || image.url} 
                          alt={image.name}
                          loading="lazy"
                        />
                      </div>
                      
                      <div className="list-info">
                        <div className="list-details">
                          <div className="list-name" title={image.name}>
                            {image.name}
                          </div>
                          <div className="list-album">
                            <FaFolder className="album-icon" />
                            <span 
                              className="album-text"
                              onClick={() => handleNavigateToAlbum(image.albumId)}
                            >
                              {image.albumName}
                            </span>
                          </div>
                          <div className="list-meta">
                            <span className="meta-item">
                              <FaClock className="meta-icon" />
                              {getTimeAgo(image.uploadedAt)}
                            </span>
                            <span className="meta-item">
                              <FaCloud className="meta-icon" />
                              {(image.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                          </div>
                        </div>
                        
                        <div className="list-actions">
                          <button
                            className={`action-btn favorite-btn ${image.isFavorite ? 'favorited' : ''}`}
                            onClick={() => handleFavoriteToggle(image.imageId, image.albumId, image.isFavorite)}
                            title={image.isFavorite ? 'Remove favorite' : 'Add to favorites'}
                          >
                            {image.isFavorite ? <FaStar /> : <FaRegStar />}
                          </button>
                          
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get time ago string
const getTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
};

export default Recent;