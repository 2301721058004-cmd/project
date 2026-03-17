import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Alert } from '../../components/ui/Alert';

export function ManageCameras() {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [newCamera, setNewCamera] = useState({ name: '', location: '', rtsp_url: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [detectFile, setDetectFile] = useState(null);
  const [detectPreview, setDetectPreview] = useState(null);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [detectLoading, setDetectLoading] = useState(false);
  const [detectResult, setDetectResult] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const response = await api.admin.getZones();
      const zonesData = Array.isArray(response.zones) ? response.zones : [];
      setZones(zonesData);
      if (zonesData.length > 0 && !selectedZone) {
        setSelectedZone(zonesData[0].id);
      }
    } catch (err) {
      setError('Failed to load zones');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCamera = async (e) => {
    e.preventDefault();
    if (!selectedZone) {
      setError('Please select a zone');
      return;
    }

    try {
      await api.admin.addCamera(selectedZone, newCamera);
      setNewCamera({ name: '', location: '', rtsp_url: '' });
      setSuccess('Camera added successfully');
      fetchZones();
    } catch (err) {
      setError(err.message || 'Failed to add camera');
    }
  };

  const handleDetectFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDetectFile(file);
      setDetectPreview(URL.createObjectURL(file));
      setDetectResult(null);
      setError('');
    }
  };

  const handleDetectUpload = async () => {
    if (!detectFile) {
      setError('Please select an image or video');
      return;
    }

    if (!selectedCamera) {
      setError('Please select a camera');
      return;
    }

    const camera = allCameras.find(c => c.id === selectedCamera);
    if (!camera) {
      setError('Camera not found');
      return;
    }

    setDetectLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', detectFile);
    formData.append('zone_id', camera.zone_id);
    formData.append('camera_id', selectedCamera);

    try {
      const response = await api.detection.upload(formData);
      setDetectResult({
        ...response.detection,
        camera_name: camera.name,
        zone_name: zones.find(z => z.id === camera.zone_id)?.name || 'Unknown Zone'
      });
      setDetectFile(null);
      setDetectPreview(null);
    } catch (err) {
      setError(err.message || 'Detection failed');
    } finally {
      setDetectLoading(false);
    }
  };

  const isImage = (file) => file && file.type.startsWith('image/');
  const isVideo = (file) => file && file.type.startsWith('video/');

  // Get all cameras across zones
  const allCameras = zones.flatMap(zone => 
    (zone.cameras || []).map(cam => ({
      ...cam,
      zone_id: zone.id,
      zone_name: zone.name
    }))
  );

  const selectedZoneData = zones.find(z => z.id === selectedZone);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Manage Cameras</h1>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <Card title="Add New Camera" className="mb-8 shadow-md border-orange-100">
        <form onSubmit={handleAddCamera} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Zone Assignment</label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition"
                required
              >
                <option value="">-- Select Zone --</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </div>

            <InputField
              label="Camera Name"
              name="name"
              placeholder="e.g. Front Gate, Mobile Cam 1"
              value={newCamera.name}
              onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Location Description"
              name="location"
              placeholder="e.g. Entrance, North Wing"
              value={newCamera.location}
              onChange={(e) => setNewCamera({ ...newCamera, location: e.target.value })}
            />

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Stream/IP URL</label>
              <InputField
                name="rtsp_url"
                placeholder="RTSP or HTTP (e.g. http://192.168.1.5:8080/shot.jpg)"
                value={newCamera.rtsp_url}
                onChange={(e) => setNewCamera({ ...newCamera, rtsp_url: e.target.value })}
              />
              <p className="text-[10px] text-gray-400 mt-1">
                For mobile IP Webcams, use the <b>shot.jpg</b> URL for best real-time performance.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" className="px-8 shadow-lg shadow-orange-200">
              Add Camera to Zone
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Test Detection by Camera" className="mb-8 shadow-md border-blue-100">
        <div className="space-y-6">
          {/* Camera Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-bold mb-2">Select Camera</label>
              {allCameras.length === 0 ? (
                <p className="text-gray-500 text-sm">No cameras available. Add cameras first.</p>
              ) : (
                <select
                  value={selectedCamera}
                  onChange={(e) => {
                    setSelectedCamera(e.target.value);
                    setDetectResult(null);
                    setDetectFile(null);
                    setDetectPreview(null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                >
                  <option value="">-- Select a Camera --</option>
                  {allCameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.name} ({camera.zone_name}) - {camera.location}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            {selectedCamera && (
              <Button
                variant="secondary"
                onClick={() => {
                  const camera = allCameras.find(c => c.id === selectedCamera);
                  if (camera) {
                    navigate(`/admin/violations?zone_id=${camera.zone_id}&camera_id=${selectedCamera}`);
                  }
                }}
                className="w-full"
              >
                📊 View Violations
              </Button>
            )}
          </div>

          {selectedCamera && (
            <>
              {/* File Upload Area */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Upload Image or Video</label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
                      setDetectFile(file);
                      setDetectPreview(URL.createObjectURL(file));
                      setDetectResult(null);
                    }
                  }}
                  className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50 hover:bg-blue-100 transition"
                >
                  {detectPreview ? (
                    <div className="space-y-4">
                      {isImage(detectFile) ? (
                        <img src={detectPreview} alt="Preview" className="max-h-48 mx-auto rounded" />
                      ) : (
                        <video 
                          src={detectPreview} 
                          className="max-h-48 mx-auto rounded"
                          style={{ display: 'block' }}
                        />
                      )}
                      <p className="text-sm text-gray-600">{detectFile.name}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDetectFile(null);
                          setDetectPreview(null);
                          setDetectResult(null);
                        }}
                      >
                        Choose Different File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-3xl">📤</div>
                      <p className="text-gray-700">Drop your image or video here</p>
                      <p className="text-gray-500 text-sm">or click to browse</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Browse Files
                      </Button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleDetectFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Detect Button */}
              {detectPreview && (
                <div className="flex gap-4">
                  <Button
                    onClick={handleDetectUpload}
                    variant="primary"
                    disabled={detectLoading}
                    className="flex-1"
                  >
                    {detectLoading ? '🔄 Detecting...' : '🔍 Run Detection'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Detection Result Modal */}
      {detectResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-8" style={{ contain: 'layout style paint' }}>
            {/* Modal Header */}
            <div className={`p-6 border-b ${detectResult.has_violation ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${detectResult.has_violation ? 'bg-red-100' : 'bg-green-100'}`}>
                    {detectResult.has_violation ? '⚠️' : '✅'}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Camera: <span className="font-bold">{detectResult.camera_name}</span></p>
                    <p className="text-sm text-gray-600">Zone: <span className="font-bold">{detectResult.zone_name}</span></p>
                    <h3 className={`text-lg font-bold ${detectResult.has_violation ? 'text-red-600' : 'text-green-600'}`}>
                      {detectResult.has_violation ? 'Violations Detected!' : 'All Safe'}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setDetectResult(null)}
                  className="text-2xl text-gray-500 hover:text-gray-700 font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto" style={{ contain: 'layout style paint' }}>
              {detectResult.has_violation && (
                <p className="text-sm text-gray-700 p-3 bg-red-100 rounded border border-red-300">
                  🚨 {detectResult.violations_count} person(s) without proper helmet
                </p>
              )}

              {detectResult.annotated_image_path && (
                <div className="space-y-3">
                  {isImage(detectFile) ? (
                    <div style={{ overflow: 'hidden', borderRadius: '0.5rem' }}>
                      <img
                        src={api.detection.getImageUrl(detectResult.annotated_image_path)}
                        alt="Detection result"
                        className="w-full rounded-lg border border-gray-300"
                        style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {detectResult.file_type === 'video' && detectResult.has_violation && detectResult.extra_data?.violation_image_path && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">📸 Violation Frame</p>
                          <div style={{ overflow: 'hidden', borderRadius: '0.5rem', maxHeight: '300px' }}>
                            <img
                              src={api.detection.getImageUrl(detectResult.extra_data.violation_image_path)}
                              alt="Violation frame"
                              className="w-full rounded-lg border-2 border-red-300"
                              style={{ display: 'block', maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
                            />
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">🎬 Annotated Video</p>
                        <p className="text-xs text-gray-500 mb-2">Click the video to expand full screen</p>
                        <div style={{ overflow: 'hidden', borderRadius: '0.5rem', backgroundColor: '#000', width: '100%', aspectRatio: '16/9', maxHeight: '300px' }}>
                          <video
                            src={api.detection.getVideoUrl(detectResult.annotated_image_path)}
                            controls
                            className="w-full h-full"
                            style={{ display: 'block' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {detectResult.file_type === 'video' && detectResult.extra_data && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-xs text-gray-600">Total Frames</p>
                    <p className="text-lg font-bold text-blue-600">{detectResult.extra_data.total_frames}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <p className="text-xs text-gray-600">Violation Frames</p>
                    <p className="text-lg font-bold text-red-600">{detectResult.extra_data.frames_with_violations}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setDetectResult(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card title="Cameras by Zone">
        {zones.length === 0 ? (
          <p className="text-gray-500">No zones available. Create a zone first.</p>
        ) : (
          <div className="space-y-6">
            {zones.map((zone) => (
              <div key={zone.id} className="border rounded p-4">
                <h3 className="font-semibold mb-2">{zone.name}</h3>
                {(!zone.cameras || zone.cameras.length === 0) ? (
                  <p className="text-sm text-gray-500">No cameras in this zone</p>
                ) : (
                  <div className="space-y-2">
                    {zone.cameras.map((camera) => (
                      <div key={camera.id} className="bg-gray-50 p-2 rounded text-sm">
                        <span className="font-medium">{camera.name}</span>
                        {camera.location && <span className="text-gray-600"> - {camera.location}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}