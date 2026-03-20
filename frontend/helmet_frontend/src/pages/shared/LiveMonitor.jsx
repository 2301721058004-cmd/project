import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import { AlertCircle, Play, Square, Video, ShieldAlert, X } from 'lucide-react';

export const LiveMonitor = () => {
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [rtspUrl, setRtspUrl] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState('');
  const [recentAlerts, setRecentAlerts] = useState([]);
  const seenAlertIds = useRef(new Set());

  // Fetch zones on mount
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const profile = await api.auth.me();
        const isAdmin = profile.data?.role === 'admin';
        const response = isAdmin ? await api.admin.getZones() : await api.supervisor.getZones();
        setZones(Array.isArray(response.zones) ? response.zones : []);
      } catch (error) {
        console.error('Failed to fetch zones:', error);
      }
    };
    fetchZones();
  }, []);

  // Update cameras when zone changes
  useEffect(() => {
    if (selectedZone) {
      const zone = zones.find(z => String(z.id) === String(selectedZone) || String(z._id) === String(selectedZone));
      setCameras(zone?.cameras || []);
      setSelectedCamera('');
    } else {
      setCameras([]);
    }
  }, [selectedZone, zones]);

  // Polling for violations when streaming
  useEffect(() => {
    if (!isStreaming) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await api.detection.getRecentViolations({ seconds: 5 });
        if (res.data?.violations) {
          const newAlerts = [];
          res.data.violations.forEach((violation) => {
            if (
              violation.camera_id === selectedCamera &&
              !seenAlertIds.current.has(violation._id)
            ) {
              seenAlertIds.current.add(violation._id);
              newAlerts.push(violation);
            }
          });

          if (newAlerts.length > 0) {
            setRecentAlerts(prev => [...prev, ...newAlerts].slice(-5)); // Keep last 5 alerts
          }
        }
      } catch (err) {
        console.error('Error polling for violations', err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [isStreaming, selectedCamera]);

  const handleStartStream = () => {
    if (!selectedZone || !selectedCamera || !rtspUrl) {
      setStreamError('Please select a zone, camera, and enter the RTSP URL.');
      return;
    }
    setStreamError('');
    seenAlertIds.current.clear();
    setRecentAlerts([]);
    setIsStreaming(true);
  };

  const handleStopStream = () => {
    setIsStreaming(false);
  };

  const removeAlert = (id) => {
    setRecentAlerts(prev => prev.filter(alert => alert._id !== id));
  };

  // The stream URL generated to hit the backend MJPEG generator
  // Added timestamp to bust cache when restarting stream
  const getStreamUrl = () => {
    return `http://127.0.0.1:5000/api/stream/feed?url=${encodeURIComponent(rtspUrl)}&zone_id=${selectedZone}&camera_id=${selectedCamera}&t=${Date.now()}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-inter text-gray-900 tracking-tight">Live RTSP Monitoring</h1>
          <p className="text-gray-500 mt-1">Connect directly to an IP camera stream and detect safety violations in real-time.</p>
        </div>
        <div className="flex items-center bg-gray-100 p-2 rounded-lg border border-gray-200">
          <div className={`w-3 h-3 rounded-full mr-2 ${isStreaming ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm font-medium text-gray-700">{isStreaming ? 'STREAMING ACTIVE' : 'OFFLINE'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Controls Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center">
              <Video className="w-5 h-5 mr-2 text-primary" />
              Stream Setup
            </h2>

            {streamError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-600">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{streamError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                <select
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50 text-sm"
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  disabled={isStreaming}
                >
                  <option value="">Select Zone</option>
                  {zones.map((zone) => (
                    <option key={zone.id || zone._id} value={zone.id || zone._id}>{zone.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Camera / Intersection</label>
                <select
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50 text-sm"
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  disabled={!selectedZone || isStreaming}
                >
                  <option value="">Select Camera</option>
                  {cameras.map((cam) => (
                    <option key={cam.id || cam._id} value={cam.id || cam._id}>{cam.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RTSP URL</label>
                <input
                  type="text"
                  placeholder="rtsp://192.168.1.100:554/live"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50 text-sm font-mono"
                  value={rtspUrl}
                  onChange={(e) => setRtspUrl(e.target.value)}
                  disabled={isStreaming}
                />
              </div>

              <div className="pt-2">
                {!isStreaming ? (
                  <button
                    onClick={handleStartStream}
                    className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium shadow-md transition-all flex items-center justify-center transform active:scale-[0.98]"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Connect & Start AI
                  </button>
                ) : (
                  <button
                    onClick={handleStopStream}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-md transition-all flex items-center justify-center transform active:scale-[0.98]"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    Stop Stream
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Video Player Area */}
        <div className="lg:col-span-3">
          <div className="bg-black/95 rounded-xl border border-gray-800 shadow-xl overflow-hidden relative aspect-video flex flex-col items-center justify-center group h-[450px] md:h-[600px] w-full">
            
            {!isStreaming ? (
              <div className="flex flex-col items-center text-gray-500">
                <Video className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">Stream is currently offline</p>
                <p className="text-sm mt-2 max-w-md text-center">Select a zone, camera, and provide an RTSP URL from your IP-cam or mobile app to begin real-time YOLO detection.</p>
              </div>
            ) : (
              <img
                src={getStreamUrl()}
                alt="Live AI Stream"
                className="w-full h-full object-contain pointer-events-none"
                style={{ filter: 'brightness(1.05) contrast(1.05)' }}
                onError={(e) => {
                  setStreamError('Connection to stream lost or could not be established.');
                  setIsStreaming(false);
                }}
              />
            )}

            {/* Overlays */}
            {isStreaming && (
              <div className="absolute top-4 right-4 flex space-x-2">
                <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full animate-pulse flex items-center shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-white mr-2"></span>
                  LIVE AI TRACKING
                </span>
              </div>
            )}
            
            {/* Pop-up Violation Alerts */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-50">
              {recentAlerts.map(alert => (
                <div key={alert._id} className="bg-red-500/90 backdrop-blur-md text-white border border-red-400 p-4 rounded-lg shadow-2xl flex items-start animate-fade-in-up w-80">
                  <ShieldAlert className="w-6 h-6 mr-3 flex-shrink-0 animate-bounce" />
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">Violation Detected!</h4>
                    <p className="text-xs text-red-100 mt-0.5">Persons without helmet: {alert.violations_count}</p>
                    <p className="text-[10px] opacity-75 mt-1">{new Date(alert.created_at).toLocaleTimeString()}</p>
                  </div>
                  <button onClick={() => removeAlert(alert._id)} className="text-white hover:bg-red-400/50 rounded p-1 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
