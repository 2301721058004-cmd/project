import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Alert } from '../../components/ui/Alert';

export function ManageZones() {
  const [zones, setZones] = useState([]);
  const [newZone, setNewZone] = useState({ name: '', location: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const response = await api.admin.getZones();
      setZones(Array.isArray(response.zones) ? response.zones : []);
    } catch (err) {
      setError('Failed to load zones');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    try {
      await api.admin.createZone(newZone);
      setNewZone({ name: '', location: '' });
      setSuccess('Zone created successfully');
      fetchZones();
    } catch (err) {
      setError(err.message || 'Failed to create zone');
    }
  };

  const handleDeleteZone = async (zoneId) => {
    if (!window.confirm('Are you sure you want to delete this zone?')) return;
    
    try {
      await api.admin.deleteZone(zoneId);
      setSuccess('Zone deleted successfully');
      fetchZones();
    } catch (err) {
      setError('Failed to delete zone');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Manage Zones</h1>
      
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <Card title="Create New Zone" className="mb-8">
        <form onSubmit={handleCreateZone} className="flex gap-4">
          <div className="flex-1">
            <InputField
              name="name"
              placeholder="Zone Name"
              value={newZone.name}
              onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
              required
            />
          </div>
          <div className="flex-1">
            <InputField
              name="location"
              placeholder="Location"
              value={newZone.location}
              onChange={(e) => setNewZone({ ...newZone, location: e.target.value })}
            />
          </div>
          <Button type="submit" variant="success">Create Zone</Button>
        </form>
      </Card>

      <Card title="All Zones">
        {zones.length === 0 ? (
          <p className="text-gray-500">No zones created yet</p>
        ) : (
          <div className="space-y-4">
            {zones.map((zone) => (
              <div key={zone.id} className="flex items-center justify-between p-4 border rounded">
                <div>
                  <h3 className="font-semibold">{zone.name}</h3>
                  <p className="text-sm text-gray-600">{zone.location}</p>
                  <p className="text-xs text-gray-500">
                    {zone.cameras?.length || 0} cameras, {zone.supervisors?.length || 0} supervisors
                  </p>
                </div>
                <Button variant="danger" size="sm" onClick={() => handleDeleteZone(zone.id)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}