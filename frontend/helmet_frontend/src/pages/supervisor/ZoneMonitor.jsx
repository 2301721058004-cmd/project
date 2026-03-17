import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';

export function ZoneMonitor() {
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneStats, setZoneStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const response = await api.supervisor.getZones();
      const zonesData = Array.isArray(response.zones) ? response.zones : [];
      setZones(zonesData);
      if (zonesData.length > 0) {
        setSelectedZone(zonesData[0]);
        fetchZoneStats(zonesData[0].id);
      }
    } catch (err) {
      setError('Failed to load zones');
    } finally {
      setLoading(false);
    }
  };

  const fetchZoneStats = async (zoneId) => {
    try {
      const response = await api.supervisor.getZoneStats(zoneId);
      setZoneStats(response.stats || { total_detections: 0, total_violations: 0 });
    } catch (err) {
      console.error('Failed to load zone stats');
    }
  };

  const handleZoneChange = (zone) => {
    setSelectedZone(zone);
    fetchZoneStats(zone.id);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Zone Monitor</h1>

      {error && <Alert type="error" message={error} />}

      {zones.length === 0 ? (
        <Card>
          <p className="text-gray-500">No zones assigned to you</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card title="Your Zones">
              <div className="space-y-2">
                {zones.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => handleZoneChange(zone)}
                    className={`w-full text-left p-3 rounded transition ${selectedZone?.id === zone.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                  >
                    <p className="font-semibold">{zone.name}</p>
                    <p className={`text-sm ${selectedZone?.id === zone.id ? 'text-blue-100' : 'text-gray-600'}`}>
                      {zone.location}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedZone && (
              <>
                <Card title={selectedZone.name} className="mb-6">
                  <p className="text-gray-600 mb-4">{selectedZone.location}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 p-4 rounded">
                      <p className="text-sm text-gray-600">Total Detections</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {zoneStats?.total_detections || 0}
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded">
                      <p className="text-sm text-gray-600">Violations</p>
                      <p className="text-2xl font-bold text-red-600">
                        {zoneStats?.total_violations || 0}
                      </p>
                    </div>
                  </div>

                  <h4 className="font-semibold mb-2">Cameras ({selectedZone.cameras?.length || 0})</h4>
                  {(!selectedZone.cameras || selectedZone.cameras.length === 0) ? (
                    <p className="text-gray-500 text-sm">No cameras in this zone</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedZone.cameras.map((camera) => (
                        <div key={camera.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span>{camera.name}</span>
                          <span className={`text-xs px-2 py-1 rounded ${camera.is_active ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                            {camera.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}