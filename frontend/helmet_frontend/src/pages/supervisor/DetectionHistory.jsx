import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useSound } from '../../hooks/useSound';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../context/AuthContext';
import { formatDateWithTimezone } from '../../utils/timezone';

export function DetectionHistory() {
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDetection, setSelectedDetection] = useState(null);
  const { timezone } = useAuth();
  const { playViolationAlert } = useSound();

  useEffect(() => {
    fetchDetections();
  }, []);

  // Play violation alert when a violation detection is selected
  useEffect(() => {
    if (selectedDetection && selectedDetection.has_violation) {
      playViolationAlert();
    }
  }, [selectedDetection, playViolationAlert]);

  const fetchDetections = async () => {
    try {
      const response = await api.supervisor.getDetections();
      setDetections(Array.isArray(response.detections) ? response.detections : []);
    } catch (err) {
      setError('Failed to load detection history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">My Detection History</h1>

      {error && <Alert type="error" message={error} />}

      <Card title={`All Detections (${detections.length})`}>
        {detections.length === 0 ? (
          <p className="text-gray-500">No detections recorded yet</p>
        ) : (
          <div className="space-y-4">
            {detections.map((detection) => (
              <div
                key={detection.id}
                onClick={() => setSelectedDetection(detection)}
                className={`p-4 border rounded cursor-pointer hover:shadow-md transition-all ${detection.has_violation ? 'bg-red-50 border-red-200 hover:border-red-400' : 'bg-green-50 border-green-200 hover:border-green-400'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl ${detection.has_violation ? '⚠️' : '✅'}`}></span>
                      <span className={`font-semibold ${detection.has_violation ? 'text-red-700' : 'text-green-700'}`}>
                        {detection.has_violation ? 'Violation Detected' : 'Safe - Helmet Worn'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDateWithTimezone(detection.timestamp, timezone, 'datetime')}
                    </p>
                    <p className="text-sm text-gray-500">
                      Detected by: {detection.uploaded_by_name || 'System'}
                    </p>
                  </div>

                  {detection.annotated_image_path ? (
                    <img
                      src={api.detection.getImageUrl(detection.annotated_image_path)}
                      alt="Detection result"
                      className="w-32 h-24 object-cover rounded border"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDetection(detection);
                      }}
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {selectedDetection && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedDetection(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`sticky top-0 p-6 border-b flex justify-between items-center ${selectedDetection.has_violation ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <h2 className={`text-2xl font-bold ${selectedDetection.has_violation ? 'text-red-600' : 'text-green-600'}`}>
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
              {/* Image */}
              {selectedDetection.annotated_image_path && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Detection Image</h3>
                  <div className="bg-gray-100 rounded-lg border border-gray-300 overflow-hidden">
                    <img
                      src={api.detection.getImageUrl(selectedDetection.annotated_image_path)}
                      alt="Detection result"
                      className="w-full max-h-[400px] object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p className={`text-lg font-bold ${selectedDetection.has_violation ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedDetection.has_violation ? 'VIOLATION' : 'SAFE'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Violations</p>
                  <p className="text-lg font-bold text-orange-600">{selectedDetection.violations_count || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Detection Time</p>
                  <p className="text-sm font-semibold text-gray-800">{formatDateWithTimezone(selectedDetection.timestamp, timezone, 'datetime')}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Camera</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedDetection.camera_name || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}