import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../context/AuthContext';
import { formatDateWithTimezone } from '../../utils/timezone';

export function DetectionHistory() {
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { timezone } = useAuth();

  useEffect(() => {
    fetchDetections();
  }, []);

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
                className={`p-4 border rounded ${detection.has_violation ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}
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

                  {detection.file_type === 'video' ? (
                    <video
                      src={api.detection.getVideoUrl(detection.annotated_image_path)}
                      controls
                      className="w-32 h-24 object-cover rounded border"
                    />
                  ) : detection.annotated_image_path ? (
                    <img
                      src={api.detection.getImageUrl(detection.annotated_image_path)}
                      alt="Detection result"
                      className="w-32 h-24 object-cover rounded border"
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}