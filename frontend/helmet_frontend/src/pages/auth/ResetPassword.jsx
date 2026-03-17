import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

export function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }
        if (password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        setLoading(true);
        setError('');

        try {
            await axios.post('http://localhost:5000/api/auth/reset-password', {
                token,
                password
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired token');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h2>
                    <p className="text-gray-600 mb-6">This password reset link is invalid or has expired.</p>
                    <Link to="/forgot-password" title="Go back" className="text-orange-500 font-bold">Request a new link</Link>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{
                backgroundImage: 'url("https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="absolute inset-0 bg-black/40" />

            <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-2">
                    Reset Password
                </h2>
                <p className="text-gray-500 text-center text-sm mb-8">
                    Enter your new password below.
                </p>

                {success ? (
                    <div className="text-center">
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                            Password has been reset successfully! Redirecting to login...
                        </div>
                        <Link to="/login" className="text-orange-500 font-medium">Click here if not redirected</Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
