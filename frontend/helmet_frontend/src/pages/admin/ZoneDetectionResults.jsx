import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../context/AuthContext';
import { formatDateWithTimezone } from '../../utils/timezone';

export function ZoneDetectionResults() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'violations', 'safe'
  });
  const [expandedZones, setExpandedZones] = useState({});
  const [selectedDetection, setSelectedDetection] = useState(null);
  const { timezone } = useAuth();

  useEffect(() => {
    fetchZoneDetections();
  }, [filters]);

  const fetchZoneDetections = async () => {
    try {
      setLoading(true);
      const filterParams = {};
      if (filters.type === 'violations') {
        filterParams.has_violation = 'true';
      } else if (filters.type === 'safe') {
        filterParams.has_violation = 'false';
      }

      const response = await api.detection.getEventsByZone(filterParams);
      const zonesData = Array.isArray(response.zones) ? response.zones : [];
      setZones(zonesData);

      // Auto-expand zones with violations
      if (filters.type !== 'all') {
        const expanded = {};
        zonesData.forEach(zone => {
          if (zone.violations > 0) {
            expanded[zone.zone_id || 'no-zone'] = true;
          }
        });
        setExpandedZones(expanded);
      }
    } catch (err) {
      setError('Failed to load zone detection results');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { value } = e.target;
    setFilters(prev => ({ ...prev, type: value }));
  };

  const toggleZoneExpand = (zoneId) => {
    setExpandedZones(prev => ({
      ...prev,
      [zoneId || 'no-zone']: !prev[zoneId || 'no-zone']
    }));
  };

  const stats = {
    totalZones: zones.length,
    totalDetections: zones.reduce((sum, z) => sum + z.total, 0),
    totalViolations: zones.reduce((sum, z) => sum + z.violations, 0),
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
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Zone Detection Results</h1>
        <p className="text-gray-600">View detection results organized by zones</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="p-6">
            <div className="text-sm font-medium text-blue-600 mb-1">Total Zones</div>
            <div className="text-3xl font-bold text-blue-900">{stats.totalZones}</div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="p-6">
            <div className="text-sm font-medium text-green-600 mb-1">Total Detections</div>
            <div className="text-3xl font-bold text-green-900">{stats.totalDetections}</div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="p-6">
            <div className="text-sm font-medium text-red-600 mb-1">Total Violations</div>
            <div className="text-3xl font-bold text-red-900">{stats.totalViolations}</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <div className="p-6">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filter by:</span>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Detections</option>
                <option value="violations">Violations Only</option>
                <option value="safe">Safe Only</option>
              </select>
            </label>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && <Alert type="error" message={error} className="mb-8" />}

      {/* No Data */}
      {zones.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No detections found for the selected filters</p>
        </Card>
      )}

      {/* Zones List */}
      <div className="space-y-4">
        {zones.map((zone) => (
          <Card key={zone.zone_id || 'no-zone'} className="overflow-hidden">
            {/* Zone Header */}
            <div
              className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-colors"
              onClick={() => toggleZoneExpand(zone.zone_id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-2xl">
                    {expandedZones[zone.zone_id || 'no-zone'] ? '▼' : '▶'}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{zone.zone_name}</h2>
                    {zone.location && (
                      <p className="text-sm text-gray-600">{zone.location}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{zone.total}</div>
                    <div className="text-xs text-gray-600">Detections</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{zone.violations}</div>
                    <div className="text-xs text-gray-600">Violations</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detections List */}
            {expandedZones[zone.zone_id || 'no-zone'] && (
              <div className="border-t border-gray-200">
                {zone.detections.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No detections in this zone
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {zone.detections.map((detection) => (
                      <div
                        key={detection.id}
                        className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedDetection(detection)}
                      >
                        <div className="flex items-start gap-4">
                          {/* Thumbnail */}
                          {detection.file_type === 'video' ? (
                            <video
                              src={api.detection.getVideoUrl(detection.annotated_image_path)}
                              controls
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          ) : detection.annotated_image_path ? (
                            <img
                              src={api.detection.getImageUrl(detection.annotated_image_path)}
                              alt="Detection"
                              className="w-24 h-24 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : null}

                          {/* Detection Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${detection.has_violation
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-green-100 text-green-700'
                                }`}>
                                {detection.has_violation ? '⚠️ VIOLATION' : '✓ Safe'}
                              </span>
                              {detection.has_violation && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                  {detection.violations_count} violation{detection.violations_count !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Timestamp:</span>
                                <p className="font-medium text-gray-900">
                                  {formatDateWithTimezone(detection.timestamp, timezone)}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600">Detected by:</span>
                                <p className="font-medium text-gray-900">
                                  {detection.uploaded_by_name || 'System'}
                                </p>
                              </div>
                            </div>

                            {/* Detection Details */}
                            {detection.detections && detection.detections.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs font-medium text-gray-600 mb-2">Detected Objects:</p>
                                <div className="flex flex-wrap gap-2">
                                  {detection.detections.map((obj, idx) => (
                                    <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                      {obj.class} ({(obj.confidence * 100).toFixed(0)}%)
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Detailed View Modal */}
      {selectedDetection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Detection Details</h3>
                <button
                  onClick={() => setSelectedDetection(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {selectedDetection.file_type === 'video' ? (
                <video
                  src={api.detection.getVideoUrl(selectedDetection.annotated_image_path)}
                  controls
                  className="w-full rounded-lg mb-4"
                />
              ) : selectedDetection.annotated_image_path ? (
                <img
                  src={api.detection.getImageUrl(selectedDetection.annotated_image_path)}
                  alt="Detection"
                  className="w-full rounded-lg mb-4"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : null}

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`font-medium ${selectedDetection.has_violation
                      ? 'text-red-600'
                      : 'text-green-600'
                    }`}>
                    {selectedDetection.has_violation ? '⚠️ VIOLATION' : '✓ Safe'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Timestamp</p>
                  <p className="font-medium text-gray-900">
                    {formatDateWithTimezone(selectedDetection.timestamp, timezone)}
                  </p>
                </div>

                {selectedDetection.has_violation && (
                  <div>
                    <p className="text-sm text-gray-600">Violations Count</p>
                    <p className="font-medium text-red-600">{selectedDetection.violations_count}</p>
                  </div>
                )}

                {selectedDetection.detections && selectedDetection.detections.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Detected Objects</p>
                    <div className="space-y-2">
                      {selectedDetection.detections.map((obj, idx) => (
                        <div key={idx} className="p-3 bg-blue-50 rounded">
                          <p className="font-medium text-gray-900">{obj.class}</p>
                          <p className="text-sm text-gray-600">Confidence: {(obj.confidence * 100).toFixed(2)}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Violation Frames Gallery (for videos) */}
                {selectedDetection.file_type === 'video' && selectedDetection.extra_data?.violation_frames_paths && selectedDetection.extra_data.violation_frames_paths.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Violation Frames ({selectedDetection.extra_data.violation_frames_paths.length})
                    </p>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                      {selectedDetection.extra_data.violation_frames_paths.map((framePath, idx) => (
                        <div key={idx} className="rounded overflow-hidden border border-red-200 bg-red-50">
                          <img
                            src={api.detection.getImageUrl(framePath)}
                            alt={`Violation frame ${idx + 1}`}
                            className="w-full h-24 object-cover"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3C/svg%3E';
                            }}
                          />
                          <div className="px-1 py-0.5 text-xs font-semibold text-red-700 text-center bg-red-100">
                            F{idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
