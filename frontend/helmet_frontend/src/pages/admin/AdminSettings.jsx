import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../context/AuthContext';
import { Mail, Phone, MapPin, Bell, Clock, Eye, EyeOff } from 'lucide-react';

export function AdminSettings() {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    email_alerts: true,
    system_alerts: true,
    report_frequency: 'weekly',
    timezone: 'UTC',
    theme: 'light'
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (setting, value) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    if (setting === 'theme') {
      setSuccess(`Theme changed to ${value} mode`);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleToggle = (setting) => {
    setSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
  };

  const handleSave = async () => {
    setSuccess('Settings saved successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleProfileEdit = () => {
    setEditingProfile(!editingProfile);
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-gray-800 mb-8">
          Settings <span className="text-orange-500">&</span> Preferences
        </h1>

        {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} className="mb-6" />}

        {/* Profile Section */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
            <Button
              variant={editingProfile ? 'danger' : 'primary'}
              onClick={handleProfileEdit}
            >
              {editingProfile ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>

          {!editingProfile ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Name</p>
                  <p className="text-lg font-semibold text-gray-800">{profileData.full_name}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Email</p>
                  <p className="text-lg font-semibold text-gray-800">{profileData.email}</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Phone</p>
                <p className="text-lg font-semibold text-gray-800">{profileData.phone || 'Not provided'}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <InputField
                name="full_name"
                label="Full Name"
                value={profileData.full_name}
                onChange={(e) => handleProfileChange('full_name', e.target.value)}
              />
              <InputField
                name="email"
                label="Email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
              />
              <InputField
                name="phone"
                label="Phone"
                value={profileData.phone}
                onChange={(e) => handleProfileChange('phone', e.target.value)}
              />
            </div>
          )}
        </Card>

        {/* Notification Settings */}
        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-700">Push Notifications</p>
                <p className="text-sm text-gray-500">Instant alerts on mobile</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications_enabled}
                  onChange={() => handleToggle('notifications_enabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-700">Email Alerts</p>
                <p className="text-sm text-gray-500">Daily summary reports</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.email_alerts}
                  onChange={() => handleToggle('email_alerts')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-700">System Alerts</p>
                <p className="text-sm text-gray-500">Critical system notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.system_alerts}
                  onChange={() => handleToggle('system_alerts')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block font-semibold text-gray-700 mb-2">Report Frequency</label>
              <select
                value={settings.report_frequency}
                onChange={(e) => handleChange('report_frequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Regional Settings */}
        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-800">Regional</h2>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="block font-semibold text-gray-700 mb-2">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="EST">EST (Eastern Standard Time)</option>
              <option value="CST">CST (Central Standard Time)</option>
              <option value="PST">PST (Pacific Standard Time)</option>
              <option value="GMT">GMT (Greenwich Mean Time)</option>
            </select>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex gap-4">
          <Button onClick={handleSave} variant="primary">
            Save Settings
          </Button>
          <Button variant="outline">Cancel</Button>
        </div>
      </div>
    </div>
  );
}
