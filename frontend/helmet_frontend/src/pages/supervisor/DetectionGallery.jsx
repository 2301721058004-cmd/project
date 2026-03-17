import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../context/AuthContext';
import { formatDateWithTimezone } from '../../utils/timezone';

export function DetectionGallery() {
  const [detections, setDetections] = useState([]);
  const [filteredDetections, setFilteredDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'violations', 'safe'
    sortBy: 'recent', // 'recent', 'oldest'
  });
  const [selectedDetection, setSelectedDetection] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'
  const { timezone } = useAuth();

  useEffect(() => {
    fetchDetections();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [detections, filters]);

  const fetchDetections = async () => {
    try {
      setLoading(true);
      const response = await api.supervisor.getDetections();
      const detectionsData = Array.isArray(response.detections) ? response.detections : [];
      setDetections(detectionsData);
    } catch (err) {
      setError('Failed to load detection gallery');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...detections];

    // Filter by type
    if (filters.type === 'violations') {
      filtered = filtered.filter(d => d.has_violation);
    } else if (filters.type === 'safe') {
      filtered = filtered.filter(d => !d.has_violation);
    }

    // Sort
    if (filters.sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    setFilteredDetections(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const stats = {
    total: detections.length,
    violations: detections.filter(d => d.has_violation).length,
    safe: detections.filter(d => !d.has_violation).length,
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Detection Gallery</h1>
        <p className="text-gray-600">View all detection results with images and analysis</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Detections</p>
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Violations Found</p>
          <p className="text-3xl font-bold text-red-600">{stats.violations}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Safe Detections</p>
          <p className="text-3xl font-bold text-green-600">{stats.safe}</p>
        </div>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Filter by Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Type</label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Detections ({stats.total})</option>
              <option value="violations">Violations Only ({stats.violations})</option>
              <option value="safe">Safe Only ({stats.safe})</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* View Mode */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">View</label>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg border ${viewMode === 'grid' ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                🔲 Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg border ${viewMode === 'list' ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                ≡ List
              </button>
            </div>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchDetections}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
          >
            🔄 Refresh
          </button>
        </div>
      </Card>

      {/* Results */}
      {filteredDetections.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📸</div>
            <p className="text-gray-600 text-lg mb-2">No detections found</p>
            <p className="text-gray-400">Try adjusting your filters or upload new detection files</p>
          </div>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDetections.map((detection) => (
                <div
                  key={detection.id}
                  onClick={() => setSelectedDetection(detection)}
                  className={`rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 ${detection.has_violation ? 'border-red-300' : 'border-green-300'}`}
                >
                  {/* Image/Video */}
                  {detection.annotated_image_path ? (
                    <div className="relative h-48 bg-gray-200 overflow-hidden group">
                      {detection.file_type === 'video' ? (
                        <>
                          <video className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                              <span className="text-white text-lg">▶</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <img
                            src={api.detection.getImageUrl(detection.annotated_image_path)}
                            alt="Detection"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              console.error('Failed to load image:', detection.annotated_image_path, api.detection.getImageUrl(detection.annotated_image_path));
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#e5e7eb; color:#9ca3af;"><span>Failed to load</span></div>';
                            }}
                            onLoad={(e) => {
                              console.log('Image loaded successfully:', detection.annotated_image_path);
                            }}
                          />
                          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                        </>
                      )}
                      <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1 ${detection.has_violation ? 'bg-red-500' : 'bg-green-500'}`}>
                        {detection.has_violation ? '⚠️ VIOLATION' : '✅ SAFE'}
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-500">No {detection.file_type}</span>
                    </div>
                  )}

                  {/* Info */}
                  <div className={`p-4 ${detection.has_violation ? 'bg-red-50' : 'bg-green-50'}`}>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      {detection.has_violation ? 'Violation Detected' : 'Safe Area'}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600">
                        <span className="font-semibold">{detection.violations_count}</span> person(s) detected
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateWithTimezone(detection.timestamp, timezone, 'datetime')}
                      </p>
                      <p className="text-xs text-gray-500">
                        File Type: <span className="font-semibold">{detection.file_type}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // List View
            <Card>
              <div className="space-y-4">
                {filteredDetections.map((detection, index) => (
                  <div
                    key={detection.id}
                    onClick={() => setSelectedDetection(detection)}
                    className={`flex items-center gap-4 p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all duration-300 ${detection.has_violation ? 'bg-red-50 border-red-400' : 'bg-green-50 border-green-400'}`}
                  >
                    <div className={`w-12 h-12 rounded flex items-center justify-center text-xl flex-shrink-0 ${detection.has_violation ? 'bg-red-200' : 'bg-green-200'}`}>
                      {detection.has_violation ? '⚠️' : '✅'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800">
                        {detection.has_violation ? 'Safety Violation' : 'Safe Detection'}
                      </p>
                      <p className="text-sm text-gray-600 font-semibold">
                        {formatDateWithTimezone(detection.timestamp, timezone, 'datetime')}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">{detection.file_type.toUpperCase()}</p>
                      <p className="text-xs text-gray-400">ID: {detection.id.substring(0, 8)}...</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedDetection && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedDetection(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedDetection.has_violation ? '⚠️ Violation Details' : '✅ Detection Details'}
              </h2>
              <button
                onClick={() => setSelectedDetection(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Video or Image */}
              {selectedDetection.file_type === 'video' && selectedDetection.annotated_image_path ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Annotated Detection Video</h3>
                  <div className="bg-gray-100 rounded-lg border border-gray-300 overflow-hidden">
                    <video
                      controls
                      className="w-full max-h-96"
                      controlsList="nodownload"
                    >
                      <source
                        src={api.detection.getVideoUrl(selectedDetection.annotated_image_path)}
                        type="video/mp4"
                      />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              ) : selectedDetection.annotated_image_path ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Detection Image</h3>
                  <div className="bg-gray-100 rounded-lg border border-gray-300 overflow-hidden">
                    <img
                      src={api.detection.getImageUrl(selectedDetection.annotated_image_path)}
                      alt="Detection result"
                      className="w-full max-h-96 object-contain"
                      onError={(e) => {
                        console.error('Failed to load full-size image:', api.detection.getImageUrl(selectedDetection.annotated_image_path));
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div style="padding:2rem; text-align:center; color:#9ca3af;"><p>Failed to load image</p><small>File not found or access denied</small></div>';
                      }}
                      onLoad={(e) => {
                        console.log('Full-size image loaded successfully:', selectedDetection.annotated_image_path);
                      }}
                    />
                  </div>
                </div>
              ) : null}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p className={`text-xl font-bold ${selectedDetection.has_violation ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedDetection.has_violation ? 'VIOLATION' : 'SAFE'}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">People Without Helmets</p>
                  <p className="text-xl font-bold text-gray-800">{selectedDetection.violations_count}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">File Type</p>
                  <p className="text-xl font-bold text-gray-800">{selectedDetection.file_type.toUpperCase()}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Timestamp</p>
                  <p className="text-sm font-semibold text-gray-800">{formatDateWithTimezone(selectedDetection.timestamp, timezone, 'datetime')}</p>
                </div>
              </div>

              {/* Detection Objects */}
              {selectedDetection.detections && selectedDetection.detections.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Detected Objects ({selectedDetection.detections.length})</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedDetection.detections.map((detection, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-800">{detection.class}</p>
                            <p className="text-xs text-gray-600">Confidence: {(detection.confidence * 100).toFixed(1)}%</p>
                          </div>
                          {detection.is_violation && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">Violation</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Violation Frames Gallery (for videos) */}
              {selectedDetection.file_type === 'video' && selectedDetection.extra_data?.violation_frames_paths && selectedDetection.extra_data.violation_frames_paths.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Violation Frames ({selectedDetection.extra_data.violation_frames_paths.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                    {selectedDetection.extra_data.violation_frames_paths.map((framePath, idx) => (
                      <div key={idx} className="rounded-lg overflow-hidden border border-red-200 bg-red-50 cursor-pointer hover:shadow-md transition-shadow">
                        <img
                          src={api.detection.getImageUrl(framePath)}
                          alt={`Violation frame ${idx + 1}`}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3C/svg%3E';
                          }}
                        />
                        <div className="px-2 py-1 text-xs font-semibold text-red-700 text-center bg-red-100">
                          Frame {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Individual annotated frames with detected violations from the video
                  </p>
                </div>
              )}

              {/* Extra Data */}
              {selectedDetection.extra_data && Object.keys(selectedDetection.extra_data).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Info</h3>
                  <div className="bg-gray-50 p-4 rounded border border-gray-200 text-sm space-y-2">
                    {Object.entries(selectedDetection.extra_data).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-semibold text-gray-800">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
