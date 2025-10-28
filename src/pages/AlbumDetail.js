import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  FaCloudUploadAlt, 
  FaStar, 
  FaRegStar, 
  FaTrash, 
  FaSearch, 
  FaImages, 
  FaCloud,
  FaSpinner,
  FaFolder,
  FaUserFriends,
  FaLock,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaShare,
  FaExclamationTriangle
} from 'react-icons/fa';
import { 
  MdCloudUpload, 
  MdPhotoLibrary,
  MdCloud
} from 'react-icons/md';
import { 
  RiCloudLine 
} from 'react-icons/ri';
import './AlbumDetail.css';

const AlbumDetail = ({ searchQuery }) => {
  const { albumId } = useParams();
  const [images, setImages] = useState([]);
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Toast notification system
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type };
    setToasts(prev => [...prev, toast]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const loadAlbumData = useCallback(async () => {
    try {
      setLoading(true);
      const [albumsResponse, imagesResponse] = await Promise.all([
        axios.get('/albums'),
        axios.get(`/albums/${albumId}/images`)
      ]);
      
      const currentAlbum = albumsResponse.data.albums.find(a => a.albumId === albumId);
      setAlbum(currentAlbum);
      setImages(imagesResponse.data.images);
    } catch (error) {
      console.error('Failed to load album data:', error);
      showToast('Failed to load album data', 'error');
    } finally {
      setLoading(false);
    }
  }, [albumId, showToast]);

  useEffect(() => {
    loadAlbumData();
  }, [loadAlbumData]);

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Filter valid image files
    const validFiles = files.filter(file => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!allowedTypes.includes(file.type)) {
        showToast(`Skipping ${file.name}: Invalid file type. Only images are allowed.`, 'warning');
        return false;
      }
      
      if (file.size > maxSize) {
        showToast(`Skipping ${file.name}: File too large. Maximum size is 5MB.`, 'warning');
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        
        console.log('Uploading file to Cloudinary:', file.name);

        await axios.post(`/albums/${albumId}/images`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = (progressEvent.loaded / progressEvent.total) * 100;
              setUploadProgress(progress);
            }
          }
        });

        // Update progress for multiple files
        const progress = ((i + 1) / validFiles.length) * 100;
        setUploadProgress(progress);
      }

      // Reload images after all uploads
      await loadAlbumData();
      showToast(`Successfully uploaded ${validFiles.length} image(s) to Cloudinary!`, 'success');
      
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || 'Upload failed. Please try again.';
      showToast(`Upload failed: ${errorMessage}`, 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      event.target.value = ''; // Reset file input
    }
  };

  const handleFavorite = async (imageId, isFavorite) => {
    try {
      await axios.put(`/albums/${albumId}/images/${imageId}/favorite`, {
        isFavorite
      });
      setImages(prev => prev.map(img => 
        img.imageId === imageId ? { ...img, isFavorite } : img
      ));
      
      // Update selected image if it's open
      if (selectedImage && selectedImage.imageId === imageId) {
        setSelectedImage(prev => ({ ...prev, isFavorite }));
      }

      showToast(isFavorite ? 'Added to favorites' : 'Removed from favorites', 'success');
    } catch (error) {
      console.error('Failed to update favorite:', error);
      showToast('Failed to update favorite status', 'error');
    }
  };

  const handleDeleteImage = async (imageId, imageName) => {
    setDeleteConfirm({ imageId, imageName });
  };

  const confirmDelete = async () => {
  if (!deleteConfirm) return;

  const { imageId, imageName } = deleteConfirm;
  
  try {
    await axios.delete(`/albums/${albumId}/images/${imageId}`);
    
    // Get the current filtered images before deletion
    const currentFilteredImages = getFilteredImages();
    const deletedImageIndex = currentFilteredImages.findIndex(img => img.imageId === imageId);
    
    // Remove from images state
    setImages(prev => prev.filter(img => img.imageId !== imageId));
    
    // Close modal if the deleted image is open in lightbox
    if (selectedImage && selectedImage.imageId === imageId) {
      setSelectedImage(null);
    }
    
    // If we're in lightbox view and deleted the current image, adjust the index
    if (selectedImage && selectedImage.imageId === imageId) {
      const newFilteredImages = getFilteredImages();
      if (newFilteredImages.length > 0) {
        // Show next image if available, otherwise previous
        const newIndex = deletedImageIndex >= newFilteredImages.length ? newFilteredImages.length - 1 : deletedImageIndex;
        setCurrentImageIndex(Math.max(0, newIndex));
        setSelectedImage(newFilteredImages[Math.max(0, newIndex)]);
      } else {
        // No images left, close lightbox
        setSelectedImage(null);
        setCurrentImageIndex(0);
      }
    }
    
    showToast('Image deleted successfully from Cloudinary and your album.', 'success');
  } catch (error) {
    console.error('Failed to delete image:', error);
    showToast('Failed to delete image', 'error');
  } finally {
    setDeleteConfirm(null);
  }
};

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // Image click handler - opens the lightbox
  const handleImageClick = (image, index) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
  };

  // Close lightbox
  const handleCloseLightbox = () => {
    setSelectedImage(null);
    setCurrentImageIndex(0);
  };

  // Navigate to next image
  const handleNextImage = () => {
    const filteredImages = getFilteredImages();
    const nextIndex = (currentImageIndex + 1) % filteredImages.length;
    setCurrentImageIndex(nextIndex);
    setSelectedImage(filteredImages[nextIndex]);
  };

  // Navigate to previous image
  const handlePrevImage = () => {
    const filteredImages = getFilteredImages();
    const prevIndex = (currentImageIndex - 1 + filteredImages.length) % filteredImages.length;
    setCurrentImageIndex(prevIndex);
    setSelectedImage(filteredImages[prevIndex]);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedImage) return;
      
      switch(e.key) {
        case 'Escape':
          handleCloseLightbox();
          break;
        case 'ArrowRight':
          handleNextImage();
          break;
        case 'ArrowLeft':
          handlePrevImage();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, currentImageIndex]);

  // Download image
  const handleDownload = async (image) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = image.name || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Image download started', 'success');
    } catch (error) {
      console.error('Download failed:', error);
      showToast('Failed to download image', 'error');
    }
  };

  // Share image
  const handleShare = async (image) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: image.name,
          text: `Check out this image from ${album?.name}`,
          url: image.url,
        });
        showToast('Image shared successfully', 'success');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          showToast('Failed to share image', 'error');
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(image.url);
        showToast('Image URL copied to clipboard!', 'success');
      } catch (error) {
        console.error('Failed to copy URL:', error);
        showToast('Sharing not supported on this browser', 'warning');
      }
    }
  };

  const getFilteredImages = () => {
    return images.filter(image =>
      image.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      image.person?.some(person => person.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const filteredImages = getFilteredImages();

  if (loading) {
    return (
      <div className="loading-container">
        <FaSpinner className="loading-spinner" />
        <p>Loading album...</p>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="error-container">
        <h2>Album not found</h2>
        <p>The album you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  return (
    <div className="album-detail">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`toast toast-${toast.type}`}
            onClick={() => removeToast(toast.id)}
          >
            <div className="toast-message">{toast.message}</div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <FaTimes />
            </button>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirmation-header">
              <FaExclamationTriangle className="warning-icon" />
              <h3>Delete Image</h3>
            </div>
            <div className="confirmation-body">
              <p>
                Are you sure you want to delete <strong>"{deleteConfirm.imageName}"</strong>?
              </p>
              <p className="warning-text">
                This will permanently delete the image from Cloudinary and cannot be undone.
              </p>
            </div>
            <div className="confirmation-actions">
              <button 
                className="btn btn-cancel"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={confirmDelete}
              >
                <FaTrash />
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="album-header">
        <div className="album-info">
          <h1>{album.name}</h1>
          <p>{album.description || 'No description'}</p>
          <div className="album-stats">
            <span>
              <FaImages className="stat-icon" />
              {images.length} {images.length === 1 ? 'photo' : 'photos'}
            </span>
            <span>•</span>
            <span>
              {album.sharedWith?.length > 0 ? (
                <>
                  <FaUserFriends className="stat-icon" />
                  Shared with {album.sharedWith.length}
                </>
              ) : (
                <>
                  <FaLock className="stat-icon" />
                  Private
                </>
              )}
            </span>
            <span>•</span>
            <span>
              <RiCloudLine className="stat-icon" />
              Cloudinary Storage
            </span>
          </div>
        </div>
        
        <div className="upload-section">
          <label className={`upload-btn ${uploading ? 'uploading' : ''}`}>
            {uploading ? (
              <>
                <FaSpinner className="upload-spinner" />
                Uploading to Cloudinary... {Math.round(uploadProgress)}%
              </>
            ) : (
              <>
                <MdCloudUpload className="upload-icon" />
                Upload to Cloudinary
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageUpload}
              disabled={uploading}
              multiple
              style={{ display: 'none' }}
            />
          </label>
          {uploading && (
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>

      {searchQuery && (
        <div className="search-results-info">
          <FaSearch className="search-icon" />
          Showing {filteredImages.length} of {images.length} photos matching "{searchQuery}"
        </div>
      )}

      <div className="images-grid">
        {filteredImages.map((image, index) => (
          <div key={image.imageId} className="image-card">
            <div className="image-container">
              <img 
                src={image.thumbnailUrl || image.url} 
                alt={image.name}
                loading="lazy"
                onClick={() => handleImageClick(image, index)}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjFGNUY5Ii8+CjxwYXRoIGQ9Ik04MCA2MEgxMjBWOTBIMTAwVjgwSDgwVjYwWk04MCAxMDBIMTIwVjEyMEg4MFYxMDBaTTYwIDgwSDcwVjkwSDYwVjgwWk02MCAxMDBINzBWMTEwSDYwVjEwMFpNNjAgMTIwSDcwVjEzMEg2MFYxMjBaTTgwIDEyMEgxMjBWMTQwSDgwVjEyMFpNOTEgNTBMMTA5IDY4TDk3IDgwTDExOSAxMDJMOTcgMTI0TDEwOSAxMzJMOTEgMTUwTDczIDEzMkw4NSAxMjBMNjMgOThMODUgNzZMNzMgNjhMOTEgNTBaIiBmaWxsPSIjQ0RDRUNGIi8+Cjwvc3ZnPgo=';
                }}
              />
              
              <div className="image-actions">
                <button
                  className={`action-btn favorite-btn ${image.isFavorite ? 'favorited' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFavorite(image.imageId, !image.isFavorite);
                  }}
                  title={image.isFavorite ? 'Remove favorite' : 'Add to favorites'}
                >
                  {image.isFavorite ? <FaStar /> : <FaRegStar />}
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteImage(image.imageId, image.name);
                  }}
                  title="Delete from Cloudinary"
                >
                  <FaTrash />
                </button>
              </div>

              {image.isFavorite && (
                <div className="favorite-badge">
                  <FaStar />
                </div>
              )}

              <div className="cloudinary-badge" title="Stored in Cloudinary">
                <RiCloudLine />
              </div>
            </div>

            <div className="image-info">
              <div className="image-name" title={image.name}>
                {image.name.length > 20 ? `${image.name.substring(0, 20)}...` : image.name}
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
                <span>{new Date(image.uploadedAt).toLocaleDateString()}</span>
                <span>{(image.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            </div>
          </div>
        ))}
        
        {filteredImages.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              {searchQuery ? <FaSearch /> : <MdPhotoLibrary />}
            </div>
            <h3>
              {searchQuery ? 'No photos found' : 'No photos in Cloudinary yet'}
            </h3>
            <p>
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Upload some photos to Cloudinary to get started'
              }
            </p>
            {!searchQuery && (
              <label className="upload-btn">
                <MdCloudUpload className="upload-icon" />
                Upload to Cloudinary
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="lightbox-overlay" onClick={handleCloseLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-header">
              <div className="lightbox-info">
                <h3>{selectedImage.name}</h3>
                <p>From {album.name}</p>
              </div>
              <div className="lightbox-actions">
                <button
                  className="lightbox-btn"
                  onClick={() => handleDownload(selectedImage)}
                  title="Download"
                >
                  <FaDownload />
                </button>
                <button
                  className="lightbox-btn"
                  onClick={() => handleShare(selectedImage)}
                  title="Share"
                >
                  <FaShare />
                </button>
                <button
                  className={`lightbox-btn favorite-btn ${selectedImage.isFavorite ? 'favorited' : ''}`}
                  onClick={() => handleFavorite(selectedImage.imageId, !selectedImage.isFavorite)}
                  title={selectedImage.isFavorite ? 'Remove favorite' : 'Add to favorites'}
                >
                  {selectedImage.isFavorite ? <FaStar /> : <FaRegStar />}
                </button>
                <button
                  className="lightbox-close"
                  onClick={handleCloseLightbox}
                  title="Close"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="lightbox-image-container">
              <img 
                src={selectedImage.url} 
                alt={selectedImage.name}
                className="lightbox-image"
              />
              
              <button 
                className="lightbox-nav lightbox-prev"
                onClick={handlePrevImage}
                title="Previous image"
              >
                <FaChevronLeft />
              </button>
              
              <button 
                className="lightbox-nav lightbox-next"
                onClick={handleNextImage}
                title="Next image"
              >
                <FaChevronRight />
              </button>
            </div>

            <div className="lightbox-footer">
              <div className="lightbox-meta">
                <span>Uploaded: {new Date(selectedImage.uploadedAt).toLocaleDateString()}</span>
                <span>Size: {(selectedImage.size / 1024 / 1024).toFixed(1)} MB</span>
                {selectedImage.tags && selectedImage.tags.length > 0 && (
                  <div className="lightbox-tags">
                    {selectedImage.tags.map((tag, index) => (
                      <span key={index} className="tag">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="lightbox-counter">
                {currentImageIndex + 1} / {filteredImages.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumDetail;