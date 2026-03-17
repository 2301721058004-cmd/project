import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Alert } from '../../components/ui/Alert';
import { User, Mail, Building, Shield, Lock, Save, Camera as CameraIcon } from 'lucide-react';

export function Profile() {
    const { user, setUser } = useAuth();
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        company: user?.company || '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password && formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const updateData = {
                full_name: formData.full_name,
                company: formData.company
            };

            if (formData.password) {
                updateData.password = formData.password;
            }

            const response = await api.auth.updateProfile(updateData);

            // Update local user context if needed (requires setUser in context)
            if (setUser) {
                setUser(response.user);
            }

            setSuccess('Profile updated successfully');
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        } catch (err) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-800 tracking-tight mb-2">
                    User <span className="text-orange-500">Profile</span>
                </h1>
                <p className="text-gray-500 font-medium">Manage your personal information and security settings</p>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} className="mb-6" />}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column - Profile Card */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-3xl border border-orange-100 shadow-xl shadow-orange-50 overflow-hidden relative group">
                        <div className="h-24 bg-gradient-to-r from-orange-500 to-orange-400" />

                        <div className="px-6 pb-8 text-center -mt-12">
                            <div className="relative inline-block mb-4">
                                <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-lg group-hover:scale-105 transition-transform duration-500">
                                    <div className="w-full h-full rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 font-black text-3xl">
                                        {user?.full_name?.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-gray-800 mb-1">{user?.full_name}</h2>
                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4">
                                {user?.role} ACCOUNT
                            </p>

                            <div className="space-y-3 pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <Mail className="w-4 h-4 text-orange-400" />
                                    <span className="truncate">{user?.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <Building className="w-4 h-4 text-orange-400" />
                                    <span>{user?.company || 'No Company Set'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <Shield className="w-4 h-4 text-orange-400" />
                                    <span className="capitalize">{user?.role} Permissions</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Edit Form */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="border border-orange-100 !p-8 shadow-xl shadow-orange-50/50">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-orange-500" />
                                    Personal Details
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <InputField
                                        label="Full Name"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        placeholder="Enter your full name"
                                        required
                                    />
                                    <InputField
                                        label="Company Name"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleChange}
                                        placeholder="Enter your company"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-orange-500" />
                                    Security Settings
                                </h3>
                                <p className="text-xs text-gray-400 mb-4 italic">Leave blank if you don't want to change your password</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField
                                        label="New Password"
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                    />
                                    <InputField
                                        label="Confirm Password"
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="px-8 shadow-lg shadow-orange-200"
                                    disabled={loading}
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {loading ? 'Updating...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
