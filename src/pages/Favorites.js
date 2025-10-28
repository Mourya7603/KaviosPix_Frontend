import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaStar,
  FaRegStar,
  FaTrash,
  FaImages,
  FaSearch,
  FaSpinner,
  FaHeart,
  FaFolder,
  FaCalendarAlt,
  FaCloud
} from 'react-icons/fa';
import { RiCloudLine } from 'react-icons/ri';
import './Favorites.css';

const Favorites = ({ searchQuery }) => {
  const [favoriteImages, setFavoriteImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [albums, setAlbums] = useState({});
  const navigate = useNavigate();

  // Load all favorite images from all albums
  const loadFavoriteImages = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all albums first
      const albumsResponse = await axios.get('/albums');
      const albumsData = albumsResponse.data.albums;
      
      // Create albums map for quick lookup
      const albumsMap = {};
      albumsData.forEach(album => {
        albumsMap[album.albumId] = album;
      });
      setAlbums(albumsMap);

      // Get favorite images from all albums
      const favoritePromises = albumsData.map(album =>
        axios.get(`/albums/${album.albumId}/images?favorites=true`)
      );

      const favoriteResponses = await Promise.all(favoritePromises);
      
      // Combine all favorite images
      const allFavorites = favoriteResponses.flatMap((response, index) =>
        response.data.images.map(image => ({
          ...image,
          albumName: albumsData[index].name,
          albumId: albumsData[index].albumId
        }))
      );

      setFavoriteImages(allFavorites);
      
    } catch (error) {
      console.error('Failed to load favorite images:', error);
      alert('Failed to load favorite images');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavoriteImages();
  }, [loadFavoriteImages]);

  const handleFavoriteToggle = async (imageId, albumId, currentFavoriteStatus) => {
    try {
      await axios.put(`/albums/${albumId}/images/${imageId}/favorite`, {
        isFavorite: !currentFavoriteStatus
      });

      // Remove from favorites list
      setFavoriteImages(prev => prev.filter(img => img.imageId !== imageId));
      
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

  // Filter favorites based on search query
  const filteredFavorites = favoriteImages.filter(image =>
    image.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    image.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
    image.person?.some(person => person.toLowerCase().includes(searchQuery.toLowerCase())) ||
    image.albumName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group favorites by album
  const favoritesByAlbum = filteredFavorites.reduce((acc, image) => {
    if (!acc[image.albumId]) {
      acc[image.albumId] = {
        albumName: image.albumName,
        images: []
      };
    }
    acc[image.albumId].images.push(image);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="favorites-loading">
        <FaSpinner className="loading-spinner" />
        <p>Loading your favorite photos...</p>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <div className="header-content">
          <div className="header-icon">
            <FaHeart />
          </div>
          <div className="header-info">
            <h1>Favorites</h1>
            <p>
              {favoriteImages.length} {favoriteImages.length === 1 ? 'favorite photo' : 'favorite photos'} 
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
        </div>
        
        <div className="header-stats">
          <div className="stat-item">
            <FaImages className="stat-icon" />
            <span>{Object.keys(favoritesByAlbum).length} albums</span>
          </div>
          <div className="stat-item">
            <RiCloudLine className="stat-icon" />
            <span>Cloudinary Storage</span>
          </div>
        </div>
      </div>

      {searchQuery && (
        <div className="favorites-search-results-info">
          <FaSearch className="search-icon" />
          Showing {filteredFavorites.length} of {favoriteImages.length} favorite photos
        </div>
      )}

      <div className="favorites-content">
        {filteredFavorites.length === 0 ? (
          <div className="favorites-empty">
            <div className="empty-icon">
              <FaHeart />
            </div>
            <h3>
              {searchQuery ? 'No favorite photos found' : 'No favorite photos yet'}
            </h3>
            <p>
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Start by marking some photos as favorites in your albums'
              }
            </p>
            {!searchQuery && (
              <button 
                className="favorites-browse-btn"
                onClick={() => navigate('/albums')}
              >
                <FaFolder className="btn-icon" />
                Browse Albums
              </button>
            )}
          </div>
        ) : (
          <div className="favorites-grid">
            {Object.entries(favoritesByAlbum).map(([albumId, albumData]) => (
              <div key={albumId} className="favorites-album-section">
                <div 
                  className="favorites-album-header"
                  onClick={() => handleNavigateToAlbum(albumId)}
                >
                  <FaFolder className="favorites-album-icon" />
                  <h3 className="favorites-album-name">{albumData.albumName}</h3>
                  <span className="favorites-album-count">
                    {albumData.images.length} {albumData.images.length === 1 ? 'photo' : 'photos'}
                  </span>
                </div>
                
                <div className="favorites-album-images-grid">
                  {albumData.images.map(image => (
                    <div key={image.imageId} className="favorites-image-card">
                      <div className="favorites-image-container">
                        <img 
                          src={image.thumbnailUrl || image.url} 
                          alt={image.name}
                          loading="lazy"
                          onClick={() => handleImageClick(image)}
                        />
                        
                        <div className="favorites-image-actions">
                          <button
                            className="favorites-action-btn favorites-favorite-btn favorited"
                            onClick={() => handleFavoriteToggle(image.imageId, image.albumId, image.isFavorite)}
                            title="Remove from favorites"
                          >
                            <FaStar />
                          </button>
                        </div>

                        <div className="favorites-image-badges">
                          <div className="favorites-favorite-badge" title="Favorite">
                            <FaHeart />
                          </div>
                          <div className="favorites-cloudinary-badge" title="Stored in Cloudinary">
                            <RiCloudLine />
                          </div>
                        </div>
                      </div>

                      <div className="favorites-image-info">
                        <div className="favorites-image-name" title={image.name}>
                          {image.name.length > 20 ? `${image.name.substring(0, 20)}...` : image.name}
                        </div>
                        
                        {image.tags && image.tags.length > 0 && (
                          <div className="favorites-image-tags">
                            {image.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="favorites-tag">#{tag}</span>
                            ))}
                            {image.tags.length > 2 && (
                              <span className="favorites-tag-more">+{image.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                        
                        <div className="favorites-image-meta">
                          <span className="favorites-meta-item">
                            <FaCalendarAlt className="favorites-meta-icon" />
                            {new Date(image.uploadedAt).toLocaleDateString()}
                          </span>
                          <span className="favorites-meta-item">
                            <FaCloud className="favorites-meta-icon" />
                            {(image.size / 1024 / 1024).toFixed(1)} MB
                          </span>
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

export default Favorites;