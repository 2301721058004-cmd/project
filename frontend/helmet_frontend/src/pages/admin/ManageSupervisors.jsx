import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Alert } from '../../components/ui/Alert';

export function ManageSupervisors() {
  const [supervisors, setSupervisors] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Create/Edit form states
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    company: '',
  });

  // Assignment states
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [selectedZone, setSelectedZone] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [supervisorsRes, zonesRes] = await Promise.all([
        api.admin.getSupervisors(),
        api.admin.getZones(),
      ]);
      
      setSupervisors(Array.isArray(supervisorsRes.supervisors) ? supervisorsRes.supervisors : []);
      setZones(Array.isArray(zonesRes.zones) ? zonesRes.zones : []);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ full_name: '', email: '', password: '', company: '' });
    setEditingId(null);
    setIsCreateMode(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.full_name || !formData.email) {
      setError('Full name and email are required');
      return;
    }

    if (isCreateMode && !formData.password) {
      setError('Password is required for new supervisors');
      return;
    }

    try {
      if (editingId) {
        // Update existing
        const updateData = {
          full_name: formData.full_name,
          email: formData.email,
          company: formData.company,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        await api.admin.updateSupervisor(editingId, updateData);
        setSuccess(`Supervisor "${formData.full_name}" updated successfully`);
      } else {
        // Create new
        await api.admin.createSupervisor({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          company: formData.company,
        });
        setSuccess(`Supervisor "${formData.full_name}" created successfully`);
      }
      
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleEdit = (supervisor) => {
    setFormData({
      full_name: supervisor.full_name,
      email: supervisor.email,
      password: '',
      company: supervisor.company || '',
    });
    setEditingId(supervisor.id);
    setIsCreateMode(false);
  };

  const handleDelete = async (supervisorId, supervisorName) => {
    if (!window.confirm(`Are you sure you want to delete supervisor "${supervisorName}"?`)) {
      return;
    }

    try {
      await api.admin.deleteSupervisor(supervisorId);
      setSuccess(`Supervisor "${supervisorName}" deleted successfully`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete supervisor');
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedSupervisor || !selectedZone) {
      setError('Please select both supervisor and zone');
      return;
    }

    try {
      await api.admin.assignSupervisor(selectedZone, selectedSupervisor);
      setSuccess('Supervisor assigned successfully');
      setSelectedSupervisor('');
      setSelectedZone('');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to assign supervisor');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Manage Supervisors</h1>
      
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Create/Edit Supervisor Form */}
      <Card title={editingId ? `Edit Supervisor` : 'Create New Supervisor'} className="mb-8 shadow-md border-green-100">
        <form onSubmit={handleCreateOrUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Full Name"
              name="full_name"
              placeholder="e.g. John Doe"
              value={formData.full_name}
              onChange={handleInputChange}
              required
            />

            <InputField
              label="Email"
              name="email"
              type="email"
              placeholder="e.g. john@example.com"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Company"
              name="company"
              placeholder="Optional: Company name"
              value={formData.company}
              onChange={handleInputChange}
            />

            <InputField
              label={editingId ? 'Password (leave blank to keep current)' : 'Password'}
              name="password"
              type="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleInputChange}
              required={!editingId}
            />
          </div>

          <div className="flex gap-3 justify-end">
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" variant="success">
              {editingId ? 'Update Supervisor' : 'Create Supervisor'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Assign Supervisor to Zone */}
      <Card title="Assign Supervisor to Zone" className="mb-8 shadow-md border-blue-100">
        <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Select Supervisor</label>
            <select
              value={selectedSupervisor}
              onChange={(e) => setSelectedSupervisor(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">-- Select Supervisor --</option>
              {supervisors.map((supervisor) => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.full_name} ({supervisor.email})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Select Zone</label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">-- Select Zone --</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>
          
          <Button type="submit" variant="primary" className="px-6">
            Assign
          </Button>
        </form>
      </Card>

      {/* All Supervisors Table */}
      <Card title={`All Supervisors (${supervisors.length})`}>
        {supervisors.length === 0 ? (
          <p className="text-gray-500">No supervisors registered yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Company</th>
                  <th className="px-4 py-2 text-left">Assigned Zones</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {supervisors.map((supervisor) => {
                  const assignedZones = zones.filter(z => 
                    z.supervisors?.includes(supervisor.id)
                  );
                  
                  return (
                    <tr key={supervisor.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-semibold">{supervisor.full_name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{supervisor.email}</td>
                      <td className="px-4 py-2 text-sm">{supervisor.company || '-'}</td>
                      <td className="px-4 py-2 text-sm">
                        {assignedZones.length === 0 ? (
                          <span className="text-gray-500 italic">None</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {assignedZones.map(z => (
                              <span key={z.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {z.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => handleEdit(supervisor)}
                          className="px-3 py-1 text-xs"
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDelete(supervisor.id, supervisor.full_name)}
                          className="px-3 py-1 text-xs"
                        >
                          🗑️ Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}