import React, { useState, useEffect } from 'react';
import { FaTrash, FaUndo, FaSearch, FaSpinner, FaImages, FaStar, FaFolder, FaExclamationTriangle} from 'react-icons/fa';
import axios from 'axios';
import './Trash.css';
import { useToast } from '../context/ToastContext';

const Trash = ({ searchQuery }) => {
  const [deletedItems, setDeletedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [emptyTrashConfirm, setEmptyTrashConfirm] = useState(false);
  const { success, error, info } = useToast();

  // Mock data function
  const getMockData = () => {
    return [
      {
        id: 'img1',
        type: 'image',
        name: 'beach.jpg',
        thumbnailUrl: 'https://via.placeholder.com/60',
        size: 2500000,
        deletedAt: new Date().toISOString(),
        originalAlbum: 'Vacation Photos',
        originalAlbumId: 'album1',
        tags: ['beach', 'summer'],
        isFavorite: true
      },
      {
        id: 'album1',
        type: 'album',
        name: 'Vacation Photos',
        size: 15000000,
        deletedAt: new Date(Date.now() - 86400000).toISOString(),
        itemCount: 23
      },
      {
        id: 'img2',
        type: 'image',
        name: 'mountain.png',
        thumbnailUrl: 'https://via.placeholder.com/60',
        size: 1800000,
        deletedAt: new Date(Date.now() - 172800000).toISOString(),
        originalAlbum: 'Nature Shots',
        originalAlbumId: 'album2',
        tags: ['mountain', 'nature'],
        isFavorite: false
      }
    ];
  };

  useEffect(() => {
    const loadDeletedItems = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/trash');
        setDeletedItems(response.data.items || []);
      } catch (err) {
        console.error('Failed to load trash items:', err);
        error('Failed to load trash items');
        setDeletedItems(getMockData());
      } finally {
        setLoading(false);
      }
    };

    loadDeletedItems();
  }, [error]);

  const handleRestore = async (item) => {
    try {
      setRestoring(item.id);
      info(`Restoring ${item.name}...`);
      
      if (item.type === 'image') {
        await axios.post(`/trash/images/${item.id}/restore`);
      } else if (item.type === 'album') {
        await axios.post(`/trash/albums/${item.id}/restore`);
      }
      
      setDeletedItems(prev => prev.filter(i => i.id !== item.id));
      success(`${item.type === 'image' ? 'Image' : 'Album'} restored successfully!`);
    } catch (err) {
      console.error('Restore failed:', err);
      error('Failed to restore item. Please try again.');
    } finally {
      setRestoring(null);
    }
  };

  const handlePermanentDelete = async (item) => {
    setDeleteConfirm({ item, type: 'single' });
  };

  const handleEmptyTrashClick = () => {
    setEmptyTrashConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    const { item, type } = deleteConfirm;
    
    try {
      setDeleting(item.id);
      info(`Deleting ${item.name}...`);
      
      if (item.type === 'image') {
        await axios.delete(`/trash/images/${item.id}`);
      } else if (item.type === 'album') {
        await axios.delete(`/trash/albums/${item.id}`);
      }
      
      setDeletedItems(prev => prev.filter(i => i.id !== item.id));
      success('Item permanently deleted.');
    } catch (err) {
      console.error('Permanent delete failed:', err);
      error('Failed to delete item. Please try again.');
    } finally {
      setDeleting(null);
      setDeleteConfirm(null);
    }
  };

  const confirmEmptyTrash = async () => {
    try {
      setLoading(true);
      info('Emptying trash...');
      await axios.delete('/trash/empty');
      setDeletedItems([]);
      success('Trash emptied successfully.');
    } catch (err) {
      console.error('Empty trash failed:', err);
      error('Failed to empty trash. Please try again.');
    } finally {
      setLoading(false);
      setEmptyTrashConfirm(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
    setEmptyTrashConfirm(false);
  };

  const filteredItems = deletedItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
    item.originalAlbum?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getItemIcon = (item) => {
    if (item.type === 'image') {
      return <FaImages />;
    } else if (item.type === 'album') {
      return <FaFolder />;
    }
    return <FaTrash />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / 1024 / 1024;
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="trash-loading">
        <FaSpinner className="loading-spinner" />
        <p>Loading trash items...</p>
      </div>
    );
  }

  return (
    <div className="trash-page">
      {/* Delete Confirmation Modal */}
      {(deleteConfirm || emptyTrashConfirm) && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirmation-header">
              <FaExclamationTriangle className="warning-icon" />
              <h3>
                {emptyTrashConfirm ? 'Empty Trash' : 'Delete Permanently'}
              </h3>
            </div>
            <div className="confirmation-body">
              {emptyTrashConfirm ? (
                <>
                  <p>
                    Are you sure you want to empty the entire trash?
                  </p>
                  <p className="warning-text">
                    This will permanently delete {deletedItems.length} {deletedItems.length === 1 ? 'item' : 'items'} from Cloudinary and cannot be undone.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Are you sure you want to permanently delete <strong>"{deleteConfirm.item.name}"</strong>?
                  </p>
                  <p className="warning-text">
                    This will permanently delete the {deleteConfirm.item.type} from Cloudinary storage and cannot be undone.
                  </p>
                </>
              )}
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
                onClick={emptyTrashConfirm ? confirmEmptyTrash : confirmDelete}
                disabled={loading}
              >
                <FaTrash />
                {emptyTrashConfirm ? 'Empty Trash' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="trash-header">
        <div className="header-content">
          <div className="header-icon">
            <FaTrash />
          </div>
          <div className="header-info">
            <h1>Trash</h1>
            <p>
              {deletedItems.length} {deletedItems.length === 1 ? 'item' : 'items'} in trash
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
        </div>
        
        {deletedItems.length > 0 && (
          <div className="header-actions">
            <button 
              className="empty-trash-btn"
              onClick={handleEmptyTrashClick}
              disabled={loading}
            >
              <FaTrash />
              Empty Trash
            </button>
          </div>
        )}
      </div>

      {searchQuery && (
        <div className="search-results-info">
          <FaSearch className="search-icon" />
          Showing {filteredItems.length} of {deletedItems.length} items
        </div>
      )}

      <div className="trash-content">
        {filteredItems.length === 0 ? (
          <div className="empty-trash">
            <div className="empty-icon">
              <FaTrash />
            </div>
            <h3>
              {searchQuery ? 'No items found' : 'Trash is empty'}
            </h3>
            <p>
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Deleted items will appear here for 30 days before being permanently deleted'
              }
            </p>
          </div>
        ) : (
          <div className="trash-items">
            {filteredItems.map(item => (
              <div key={item.id} className="trash-item">
                <div className="item-preview">
                  {item.type === 'image' && item.thumbnailUrl ? (
                    <img 
                      src={item.thumbnailUrl} 
                      alt={item.name}
                      className="item-thumbnail"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`item-icon ${item.type === 'image' && item.thumbnailUrl ? 'fallback' : ''}`}>
                    {getItemIcon(item)}
                  </div>
                </div>
                
                <div className="item-info">
                  <div className="item-name">{item.name}</div>
                  <div className="item-type">{item.type === 'image' ? 'Image' : 'Album'}</div>
                  
                  <div className="item-details">
                    <span>Deleted on {formatDate(item.deletedAt)}</span>
                    <span>•</span>
                    <span>{formatFileSize(item.size)}</span>
                    {item.originalAlbum && (
                      <>
                        <span>•</span>
                        <span>From {item.originalAlbum}</span>
                      </>
                    )}
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div className="item-tags">
                      {item.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="tag">#{tag}</span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="tag-more">+{item.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  {item.isFavorite && (
                    <div className="favorite-indicator">
                      <FaStar /> Favorite
                    </div>
                  )}
                </div>

                <div className="item-actions">
                  <button
                    className="restore-btn"
                    onClick={() => handleRestore(item)}
                    disabled={restoring === item.id}
                    title={`Restore to ${item.originalAlbum || 'original location'}`}
                  >
                    {restoring === item.id ? <FaSpinner className="spinner" /> : <FaUndo />}
                    <span>Restore</span>
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handlePermanentDelete(item)}
                    disabled={deleting === item.id}
                    title="Delete permanently from Cloudinary"
                  >
                    {deleting === item.id ? <FaSpinner className="spinner" /> : <FaTrash />}
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Trash;