import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../context/AuthContext';
import { formatDateWithTimezone } from '../../utils/timezone';

export function ViolationHistory() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [violations, setViolations] = useState([]);
  const [filters, setFilters] = useState({ zone_id: '', camera_id: '' });
  const [zones, setZones] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { timezone } = useAuth();

  useEffect(() => {
    // Load URL params on mount
    const zoneId = searchParams.get('zone_id') || '';
    const cameraId = searchParams.get('camera_id') || '';
    
    setFilters({ zone_id: zoneId, camera_id: cameraId });
    
    fetchZones();
    fetchViolations(zoneId, cameraId);
  }, [searchParams]);

  const fetchZones = async () => {
    try {
      const response = await api.admin.getZones();
      setZones(Array.isArray(response.zones) ? response.zones : []);
    } catch (err) {
      console.error('Failed to load zones');
    }
  };

  const fetchCameras = async (zoneId) => {
    try {
      if (!zoneId) {
        setCameras([]);
        return;
      }
      const response = await api.admin.getZones();
      const zone = response.zones.find(z => z.id === zoneId);
      if (zone) {
        setCameras(zone.cameras || []);
      }
    } catch (err) {
      console.error('Failed to load cameras');
    }
  };

  const fetchViolations = async (zoneId = filters.zone_id, cameraId = filters.camera_id) => {
    try {
      setLoading(true);
      const params = {};
      if (zoneId) params.zone_id = zoneId;
      if (cameraId) params.camera_id = cameraId;
      
      const response = await api.admin.getViolations(params);
      setViolations(Array.isArray(response.violations) ? response.violations : []);
    } catch (err) {
      setError('Failed to load violations');
    } finally {
      setLoading(false);
    }
  };

  const handleZoneChange = async (e) => {
    const zoneId = e.target.value;
    setFilters({ zone_id: zoneId, camera_id: '' });
    await fetchCameras(zoneId);
    navigate(`?zone_id=${zoneId}`);
  };

  const handleCameraChange = (e) => {
    const cameraId = e.target.value;
    setFilters(prev => ({ ...prev, camera_id: cameraId }));
    const zoneId = filters.zone_id;
    const newUrl = cameraId 
      ? `?zone_id=${zoneId}&camera_id=${cameraId}`
      : `?zone_id=${zoneId}`;
    navigate(newUrl);
  };

  const applyFilters = () => {
    fetchViolations(filters.zone_id, filters.camera_id);
  };

  const clearFilters = () => {
    setFilters({ zone_id: '', camera_id: '' });
    setCameras([]);
    navigate('');
    setLoading(true);
    setViolations([]);
  };

  // Get selected zone and camera names
  const selectedZone = zones.find(z => z.id === filters.zone_id);
  const selectedCamera = cameras.find(c => c.id === filters.camera_id);

  // Enrich violations with zone and camera names (using API values as primary)
  const enrichedViolations = violations.map(violation => ({
    ...violation,
    zone_name: violation.zone_name || selectedZone?.name || 'Unknown Zone',
    camera_name: violation.camera_name || selectedCamera?.name || 'Unknown Camera',
  }));

  if (loading && violations.length === 0) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Violation History</h1>
        {(filters.zone_id || filters.camera_id) && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="text-sm"
          >
            Clear Filters
          </Button>
        )}
      </div>
      
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Filter by Zone</label>
            <select
              value={filters.zone_id}
              onChange={handleZoneChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
            >
              <option value="">All Zones</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>

          {filters.zone_id && cameras.length > 0 && (
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Filter by Camera</label>
              <select
                value={filters.camera_id}
                onChange={handleCameraChange}
                className="shadow border rounded w-full py-2 px-3 text-gray-700"
              >
                <option value="">All Cameras</option>
                {cameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>{camera.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={applyFilters}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Apply Filters
          </button>
        </div>
      </Card>

      <Card title={`Violations ${filters.zone_id ? `in ${selectedZone?.name}` : '(All Zones)'} ${filters.camera_id ? `from ${selectedCamera?.name}` : ''}(${enrichedViolations.length})`}>
        {enrichedViolations.length === 0 ? (
          <p className="text-gray-500">No violations found</p>
        ) : (
          <div className="space-y-4">
            {enrichedViolations.map((violation) => (
              <div key={violation.id} className="flex items-start gap-4 p-4 border rounded bg-red-50">
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-red-700">Safety Violation Detected</p>
                      <p className="text-sm text-gray-600">
                        {formatDateWithTimezone(violation.timestamp, timezone, 'datetime')}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm">
                      {violation.violations_count} person(s)
                    </span>
                  </div>
                  
                  {violation.file_type === 'video' ? (
                    <video 
                      src={api.detection.getVideoUrl(violation.annotated_image_path)}
                      controls
                      className="mt-2 max-w-xs rounded border"
                    />
                  ) : violation.annotated_image_path ? (
                    <img
                      src={api.detection.getImageUrl(violation.annotated_image_path)}
                      alt="Violation"
                      className="mt-2 max-w-xs rounded border"
                    />
                  ) : null}
                  
                  <div className="mt-2 text-sm text-gray-600 grid grid-cols-2 gap-4">
                    <div>
                      <p><strong>Zone:</strong> {violation.zone_name}</p>
                      <p><strong>Camera:</strong> {violation.camera_name}</p>
                    </div>
                    <div>
                      <p><strong>Detected by:</strong> {violation.uploaded_by_name || 'System'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}