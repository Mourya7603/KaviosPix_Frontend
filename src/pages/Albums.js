import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { 
  FaFolder, 
  FaTrash, 
  FaPlus, 
  FaSpinner,
  FaUserFriends,
  FaLock,
  FaExclamationTriangle
} from 'react-icons/fa';
import './Albums.css';

const Albums = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState(null);
  const [albumName, setAlbumName] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const navigate = useNavigate();
  const { success, error } = useToast();

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      const response = await axios.get('/albums');
      setAlbums(response.data.albums);
    } catch (err) {
      console.error('Failed to load albums:', err);
      error('Failed to load albums');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!albumName.trim()) return;

    try {
      const response = await axios.post('/albums', {
        name: albumName,
        description: albumDescription
      });
      setAlbums(prev => [response.data.album, ...prev]);
      setShowCreateModal(false);
      setAlbumName('');
      setAlbumDescription('');
      success('Album created successfully!');
    } catch (err) {
      console.error('Failed to create album:', err);
      error('Failed to create album');
    }
  };

  const handleDeleteClick = (albumId, albumName) => {
    setAlbumToDelete({ id: albumId, name: albumName });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!albumToDelete) return;

    try {
      await axios.delete(`/albums/${albumToDelete.id}`);
      setAlbums(prev => prev.filter(album => album.albumId !== albumToDelete.id));
      success('Album deleted successfully!');
    } catch (err) {
      console.error('Failed to delete album:', err);
      error('Failed to delete album');
    } finally {
      setShowDeleteModal(false);
      setAlbumToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setAlbumToDelete(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <FaSpinner className="loading-spinner" />
        <p>Loading albums...</p>
      </div>
    );
  }

  return (
    <div className="albums-page">
      <div className="page-header">
        <h1>Albums</h1>
        <button 
          className="create-album-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <FaPlus className="btn-icon" />
          Create Album
        </button>
      </div>

      <div className="albums-grid">
        {albums.map(album => (
          <div 
            key={album.albumId} 
            className="album-card"
            onClick={() => navigate(`/album/${album.albumId}`)}
          >
            <div className="album-cover">
              <div className="album-placeholder">
                <FaFolder className="album-icon" />
              </div>
              <div className="album-actions">
                <button
                  className="action-btn delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(album.albumId, album.name);
                  }}
                  title="Delete album"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            <div className="album-info">
              <h3 className="album-title">{album.name}</h3>
              <p className="album-description">{album.description || 'No description'}</p>
              <div className="album-meta">
                <span className="shared-badge">
                  {album.sharedWith?.length > 0 ? (
                    <>
                      <FaUserFriends className="badge-icon" />
                      Shared with {album.sharedWith.length}
                    </>
                  ) : (
                    <>
                      <FaLock className="badge-icon" />
                      Private
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {albums.length === 0 && (
          <div className="empty-state">
            <FaFolder className="empty-icon" />
            <h3>No albums yet</h3>
            <p>Create your first album to start organizing photos</p>
            <button 
              className="create-album-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <FaPlus className="btn-icon" />
              Create Album
            </button>
          </div>
        )}
      </div>

      {/* Create Album Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create New Album</h2>
            <form onSubmit={handleCreateAlbum}>
              <div className="form-group">
                <label>Album Name *</label>
                <input
                  type="text"
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  placeholder="Enter album name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={albumDescription}
                  onChange={(e) => setAlbumDescription(e.target.value)}
                  placeholder="Enter album description (optional)"
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="secondary-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  <FaPlus className="btn-icon" />
                  Create Album
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <div className="delete-modal-header">
              <FaExclamationTriangle className="warning-icon" />
              <h2>Delete Album</h2>
            </div>
            <div className="delete-modal-content">
              <p>
                Are you sure you want to delete <strong>"{albumToDelete?.name}"</strong>?
              </p>
              <p className="warning-text">
                This action cannot be undone. All photos in this album will be moved to trash.
              </p>
            </div>
            <div className="modal-actions">
              <button 
                className="secondary-btn"
                onClick={handleDeleteCancel}
              >
                Cancel
              </button>
              <button 
                className="danger-btn"
                onClick={handleDeleteConfirm}
              >
                <FaTrash className="btn-icon" />
                Delete Album
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Albums;