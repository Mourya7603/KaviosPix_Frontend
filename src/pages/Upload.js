import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaCloudUploadAlt,
  FaImages,
  FaFolderPlus,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
  FaCloud,
  FaPhotoVideo
} from 'react-icons/fa';
import { RiCloudLine } from 'react-icons/ri';
import './Upload.css';

const Upload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState('');
  const [createNewAlbum, setCreateNewAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  const [albums, setAlbums] = useState([]);
  const [uploadResults, setUploadResults] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  // Load user's albums
  const loadAlbums = useCallback(async () => {
    try {
      const response = await axios.get('/albums');
      setAlbums(response.data.albums);
      if (response.data.albums.length > 0) {
        setSelectedAlbum(response.data.albums[0].albumId);
      }
    } catch (error) {
      console.error('Failed to load albums:', error);
    }
  }, []);

  React.useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const validFiles = Array.from(files).filter(file => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!allowedTypes.includes(file.type)) {
        alert(`Skipping ${file.name}: Invalid file type. Only images are allowed.`);
        return false;
      }
      
      if (file.size > maxSize) {
        alert(`Skipping ${file.name}: File too large. Maximum size is 5MB.`);
        return false;
      }
      
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending'
    }))]);
  };

  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const createAlbum = async () => {
    if (!newAlbumName.trim()) {
      alert('Please enter an album name');
      return null;
    }

    try {
      const response = await axios.post('/albums', {
        name: newAlbumName,
        description: newAlbumDescription
      });
      
      setAlbums(prev => [response.data.album, ...prev]);
      setSelectedAlbum(response.data.album.albumId);
      setCreateNewAlbum(false);
      
      return response.data.album.albumId;
    } catch (error) {
      console.error('Failed to create album:', error);
      alert('Failed to create album');
      return null;
    }
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }

    if (!selectedAlbum && !createNewAlbum) {
      alert('Please select an album or create a new one');
      return;
    }

    setUploading(true);
    setUploadResults([]);

    let targetAlbumId = selectedAlbum;

    // Create new album if needed
    if (createNewAlbum) {
      targetAlbumId = await createAlbum();
      if (!targetAlbumId) {
        setUploading(false);
        return;
      }
    }

    const results = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const fileData = selectedFiles[i];
      
      try {
        setUploadProgress(prev => ({
          ...prev,
          [fileData.id]: 0
        }));

        const formData = new FormData();
        formData.append('file', fileData.file);

        await axios.post(`/albums/${targetAlbumId}/images`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = (progressEvent.loaded / progressEvent.total) * 100;
              setUploadProgress(prev => ({
                ...prev,
                [fileData.id]: progress
              }));
            }
          }
        });

        results.push({
          id: fileData.id,
          name: fileData.file.name,
          status: 'success',
          message: 'Uploaded successfully'
        });

      } catch (error) {
        console.error(`Upload failed for ${fileData.file.name}:`, error);
        results.push({
          id: fileData.id,
          name: fileData.file.name,
          status: 'error',
          message: error.response?.data?.message || 'Upload failed'
        });
      }
    }

    setUploadResults(results);
    setUploading(false);

    // Show summary
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;

    if (failed === 0) {
      alert(`Successfully uploaded ${successful} files to Cloudinary!`);
      setSelectedFiles([]);
      setUploadProgress({});
      
      // Navigate to the album after successful upload
      setTimeout(() => {
        navigate(`/album/${targetAlbumId}`);
      }, 1000);
    } else {
      alert(`Upload completed: ${successful} successful, ${failed} failed`);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return <FaPhotoVideo className="file-type-icon" />;
    }
    return <FaCloud className="file-type-icon" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="upload-page">
      <div className="upload-header">
        <div className="header-content">
          <div className="header-icon">
            <FaCloudUploadAlt />
          </div>
          <div className="header-info">
            <h1>Upload Photos</h1>
            <p>Upload photos to your albums using Cloudinary storage</p>
          </div>
        </div>
      </div>

      <div className="upload-container">
        {/* File Selection Area */}
        <div className="upload-area">
          <div 
            className={`drop-zone ${dragActive ? 'drag-active' : ''} ${selectedFiles.length > 0 ? 'has-files' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFiles.length === 0 ? (
              <div className="drop-zone-content">
                <FaCloudUploadAlt className="upload-icon" />
                <h3>Drag & Drop your photos here</h3>
                <p>or</p>
                <label className="file-select-btn">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                  />
                  Browse Files
                </label>
                <p className="file-requirements">
                  Supports JPEG, PNG, GIF, WebP • Max 5MB per file
                </p>
              </div>
            ) : (
              <div className="files-selected">
                <div className="files-header">
                  <FaImages className="files-icon" />
                  <span>{selectedFiles.length} files selected</span>
                  <label className="add-more-btn">
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleFileSelect}
                    />
                    Add More
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="selected-files">
              <h4>Selected Files</h4>
              <div className="files-list">
                {selectedFiles.map((fileData) => (
                  <div key={fileData.id} className="file-item">
                    <div className="file-info">
                      {getFileIcon(fileData.file.type)}
                      <div className="file-details">
                        <span className="file-name">{fileData.file.name}</span>
                        <span className="file-size">{formatFileSize(fileData.file.size)}</span>
                      </div>
                    </div>
                    <div className="file-actions">
                      {uploadProgress[fileData.id] !== undefined && (
                        <div className="upload-progress">
                          <div 
                            className="progress-bar"
                            style={{ width: `${uploadProgress[fileData.id]}%` }}
                          ></div>
                          <span className="progress-text">
                            {Math.round(uploadProgress[fileData.id])}%
                          </span>
                        </div>
                      )}
                      <button
                        className="remove-btn"
                        onClick={() => removeFile(fileData.id)}
                        disabled={uploading}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Album Selection */}
        <div className="album-selection">
          <h3>Choose Destination</h3>
          
          <div className="album-options">
            <label className="option-radio">
              <input
                type="radio"
                name="albumOption"
                checked={!createNewAlbum}
                onChange={() => setCreateNewAlbum(false)}
              />
              <span className="radio-label">Select existing album</span>
            </label>

            {!createNewAlbum && (
              <select
                value={selectedAlbum}
                onChange={(e) => setSelectedAlbum(e.target.value)}
                className="album-select"
                disabled={uploading}
              >
                <option value="">Choose an album...</option>
                {albums.map(album => (
                  <option key={album.albumId} value={album.albumId}>
                    {album.name} ({album.imageCount || 0} photos)
                  </option>
                ))}
              </select>
            )}

            <label className="option-radio">
              <input
                type="radio"
                name="albumOption"
                checked={createNewAlbum}
                onChange={() => setCreateNewAlbum(true)}
              />
              <span className="radio-label">Create new album</span>
            </label>

            {createNewAlbum && (
              <div className="new-album-form">
                <input
                  type="text"
                  placeholder="Album name"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  className="album-name-input"
                  disabled={uploading}
                />
                <textarea
                  placeholder="Album description (optional)"
                  value={newAlbumDescription}
                  onChange={(e) => setNewAlbumDescription(e.target.value)}
                  className="album-description-input"
                  disabled={uploading}
                  rows="3"
                />
              </div>
            )}
          </div>
        </div>

        {/* Upload Results */}
        {uploadResults.length > 0 && (
          <div className="upload-results">
            <h3>Upload Results</h3>
            <div className="results-list">
              {uploadResults.map((result) => (
                <div key={result.id} className={`result-item ${result.status}`}>
                  {result.status === 'success' ? (
                    <FaCheckCircle className="result-icon success" />
                  ) : (
                    <FaExclamationTriangle className="result-icon error" />
                  )}
                  <span className="result-name">{result.name}</span>
                  <span className="result-message">{result.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="upload-actions">
          <button
            className="cancel-btn"
            onClick={() => {
              if (selectedFiles.length > 0 && !uploading) {
                if (window.confirm('Are you sure you want to cancel? All selected files will be lost.')) {
                  setSelectedFiles([]);
                  setUploadProgress({});
                  setUploadResults([]);
                }
              } else {
                navigate('/albums');
              }
            }}
            disabled={uploading}
          >
            Cancel
          </button>
          
          <button
            className="upload-btn"
            onClick={uploadFiles}
            disabled={uploading || selectedFiles.length === 0}
          >
            {uploading ? (
              <>
                <FaSpinner className="upload-spinner" />
                Uploading to Cloudinary...
              </>
            ) : (
              <>
                <RiCloudLine className="cloud-icon" />
                Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'File' : 'Files'}
              </>
            )}
          </button>
        </div>

        {/* Cloudinary Info */}
        <div className="cloudinary-info">
          <RiCloudLine className="cloudinary-icon" />
          <div className="cloudinary-details">
            <h4>Cloudinary Storage</h4>
            <p>Your photos will be securely stored in Cloudinary with automatic optimization and fast delivery.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;