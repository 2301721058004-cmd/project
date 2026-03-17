import React, { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { useSound } from '../hooks/useSound';
import { useAuth } from '../context/AuthContext';

export function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [loadingZones, setLoadingZones] = useState(true);
  const fileInputRef = useRef(null);
  const { playAlert } = useSound();
  const { isAdmin } = useAuth();

  // Fetch zones on component mount
  useEffect(() => {
    const fetchZones = async () => {
      try {
        setLoadingZones(true);
        const response = isAdmin
          ? await api.admin.getZones()
          : await api.supervisor.getZones();
        setZones(Array.isArray(response.zones) ? response.zones : []);
        if (response.zones && response.zones.length > 0) {
          setSelectedZone(response.zones[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch zones:', err);
        setError('Unable to load zones');
      } finally {
        setLoadingZones(false);
      }
    };

    fetchZones();
  }, [isAdmin]);

  const isVideo = (file) => file.type.startsWith('video/');
  const isImage = (file) => file.type.startsWith('image/');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image or video first');
      return;
    }

    // Ensure zone is selected if zones exist
    if (zones.length > 0 && !selectedZone) {
      setError('Please select a zone');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (selectedZone) {
      formData.append('zone_id', selectedZone);
    }

    try {
      const response = await api.detection.upload(formData);
      setResult(response.detection);

      if (response.detection?.has_violation) {
        playAlert();
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (isImage(file) || isVideo(file))) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">
            Helmet Detection
          </h1>
          <p className="text-gray-500">
            Upload an image or video to analyze safety compliance
          </p>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
          />
        )}

        <Card>

          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${preview
                ? 'border-orange-400 bg-orange-50'
                : 'border-orange-200 hover:border-orange-400 hover:bg-orange-50'
              }`}
          >
            {preview ? (
              <div className="space-y-6">
                {isImage(selectedFile) ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-64 rounded-xl shadow-md mx-auto"
                  />
                ) : (
                  <video
                    src={preview}
                    controls
                    className="max-h-64 rounded-xl shadow-md mx-auto w-full"
                    style={{ display: 'block' }}
                  />
                )}

                <div>
                  <p className="text-gray-600 mb-4">
                    {selectedFile.name}
                  </p>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                      setResult(null);
                    }}
                  >
                    Choose Different File
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto">
                  <svg
                    className="w-10 h-10 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-gray-700 text-lg mb-2">
                    Drop your image or video here
                  </p>
                  <p className="text-gray-500 text-sm mb-6">
                    or click to browse
                  </p>

                  <Button onClick={() => fileInputRef.current?.click()}>
                    Select File
                  </Button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Detect Button */}
          {selectedFile && (
            <div className="mt-8 space-y-4">
              {/* Zone Selector */}
              {zones.length > 0 && (
                <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="text-sm font-medium text-gray-700">
                    Assign Zone:
                  </label>
                  <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    disabled={loadingZones}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select a zone...</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name} {zone.location ? `- ${zone.location}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="text-center">
                <Button
                  onClick={handleUpload}
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  className="px-12"
                >
                  {loading ? 'Analyzing with AI...' : '🔍 Detect Helmets'}
                </Button>
              </div>
            </div>
          )}

          {/* Result Modal */}
          {result && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-xl max-w-3xl w-full my-8 shadow-2xl" style={{ contain: 'layout style paint' }}>
                {/* Modal Header */}
                <div className={`p-8 border-b ${result.has_violation ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 ${result.has_violation ? 'bg-red-100' : 'bg-green-100'}`}>
                        {result.has_violation ? '⚠️' : '✅'}
                      </div>
                      <div>
                        <h2 className={`text-2xl font-bold ${result.has_violation ? 'text-red-600' : 'text-green-600'}`}>
                          {result.has_violation ? 'Violations Detected!' : 'All Safe'}
                        </h2>
                        <p className="text-gray-600 mt-1">
                          {result.violations_count} person(s) without proper helmet
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setResult(null)}
                      className="text-3xl text-gray-400 hover:text-gray-600 font-bold"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto" style={{ contain: 'layout style paint' }}>
                  {result.annotated_image_path && (
                    <>
                      {selectedFile && isImage(selectedFile) ? (
                        <div style={{ overflow: 'hidden', borderRadius: '0.75rem' }}>
                          <img
                            src={api.detection.getImageUrl(result.annotated_image_path)}
                            alt="Detection result"
                            className="w-full rounded-xl border-2 border-orange-200"
                            style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                          />
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Violation Frame */}
                          {result.file_type === 'video' && result.has_violation && (
                            <div>
                              <h4 className="text-lg font-semibold text-gray-700 mb-3">
                                📸 Violation Frame
                              </h4>
                              {result.extra_data?.violation_image_path ? (
                                <div style={{ overflow: 'hidden', borderRadius: '0.75rem', maxHeight: '400px' }}>
                                  <img
                                    src={api.detection.getImageUrl(result.extra_data.violation_image_path)}
                                    alt="Violation frame"
                                    className="w-full rounded-xl border-2 border-red-300"
                                    style={{ display: 'block', maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
                                  />
                                </div>
                              ) : null}
                            </div>
                          )}

                          {/* Full Annotated Video */}
                          <div>
                            <h4 className="text-lg font-semibold text-gray-700 mb-3">
                              🎬 Full Annotated Video
                            </h4>
                            <div style={{ overflow: 'hidden', borderRadius: '0.75rem', backgroundColor: '#000', width: '100%', aspectRatio: '16/9', maxHeight: '400px' }}>
                              <video
                                src={api.detection.getVideoUrl(result.annotated_image_path)}
                                controls
                                className="w-full h-full"
                                style={{ display: 'block' }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {result.file_type === 'video' && result.extra_data && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <p className="text-gray-600 text-sm">Total Frames</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {result.extra_data.total_frames}
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <p className="text-gray-600 text-sm">Violations</p>
                        <p className="text-2xl font-bold text-red-600">
                          {result.extra_data.frames_with_violations}
                        </p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <p className="text-gray-600 text-sm">Avg/Frame</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {result.extra_data.average_violations_per_frame}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-gray-600 text-sm">Processed</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {result.extra_data.processed_frames}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setResult(null)}
                    className="px-6"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
