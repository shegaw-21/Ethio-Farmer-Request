// components/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [loginType, setLoginType] = useState('farmer'); // 'farmer' or 'admin'
    const [formData, setFormData] = useState({
        phoneNumber: '',
        password: '',
        adminType: 'Federal' // For admin dropdown
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const adminTypes = [
        { value: 'Federal', label: 'Federal Admin', icon: '🏛️' },
        { value: 'Region', label: 'Region Admin', icon: '🌍' },
        { value: 'Zone', label: 'Zone Admin', icon: '📍' },
        { value: 'Woreda', label: 'Woreda Admin', icon: '🏘️' },
        { value: 'Kebele', label: 'Kebele Admin', icon: '🏠' }
    ];

    const handleSubmit = async(e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let endpoint = '';
            let requestBody = {};

            // Determine the correct API endpoint and request body based on login type
            if (loginType === 'farmer') {
                endpoint = 'http://localhost:5000/api/farmers/login';
                requestBody = {
                    phoneNumber: formData.phoneNumber,
                    password: formData.password
                };
            } else {
                endpoint = 'http://localhost:5000/api/admins/login';
                requestBody = {
                    phoneNumber: formData.phoneNumber,
                    password: formData.password
                };
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            console.log('API Response:', data); // For debugging

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Handle response based on login type
            if (loginType === 'farmer') {
                // Farmer login response structure
                const farmerData = data.farmer || data;
                const token = data.token;

                if (!token) {
                    throw new Error('Authentication error: No token received');
                }

                // Store token and user data
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(farmerData));
                localStorage.setItem('userType', 'Farmer');

                // Redirect to farmer dashboard
                navigate('/farmer-dashboard');

            } else {
                // Admin login response structure
                const adminData = data.user || data;
                const token = data.token;
                const actualUserType = adminData.role;

                if (!token || !actualUserType) {
                    throw new Error('Authentication error: Invalid response format');
                }

                // Auto-set the correct admin type based on user's actual role
                setFormData(prev => ({ ...prev, adminType: actualUserType }));

                // Store token and user data
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(adminData));
                localStorage.setItem('userType', actualUserType);

                // Redirect to appropriate admin dashboard
                switch (actualUserType) {
                    case 'Federal':
                        navigate('/federal-dashboard');
                        break;
                    case 'Region':
                        navigate('/region-dashboard');
                        break;
                    case 'Zone':
                        navigate('/zone-dashboard');
                        break;
                    case 'Woreda':
                        navigate('/woreda-dashboard');
                        break;
                    case 'Kebele':
                        navigate('/kebele-dashboard');
                        break;
                    default:
                        navigate('/');
                }
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200">
                <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl -m-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">🌾 AgriSystem</h1>
                        <p className="text-gray-600">Choose your login type</p>
                    </div>

                    {/* Login Type Selection */}
                    <div className="flex mb-6 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-1.5 shadow-inner">
                        <button
                            type="button"
                            onClick={() => setLoginType('farmer')}
                            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                                loginType === 'farmer'
                                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-white hover:shadow-sm'
                            }`}
                        >
                            🚜 Farmer Login
                        </button>
                        <button
                            type="button"
                            onClick={() => setLoginType('admin')}
                            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                                loginType === 'admin'
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-white hover:shadow-sm'
                            }`}
                        >
                            👨‍💼 Admin Login
                        </button>
                </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 shadow-sm">
                            <div className="flex items-center">
                                <span className="text-red-500 mr-2">⚠️</span>
                                {error}
                            </div>
                        </div>
                    )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Phone Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="+251911234567"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                            loginType === 'farmer'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Logging in...
                            </span>
                        ) : (
                            `Login as ${loginType === 'farmer' ? 'Farmer' : 'Admin'}`
                        )}
                    </button>
                </form>

                {/* Info Section */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-2">📋 Login Information</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                        {loginType === 'farmer' ? (
                            <div>
                                <p><strong>🚜 Farmers:</strong> Use your registered phone number and password</p>
                                <p className="text-xs text-gray-500 mt-1">Access your farm data, requests, and updates</p>
                            </div>
                        ) : (
                            <div>
                                <p><strong>👨‍💼 Admins:</strong> Select your admin level and use your credentials</p>
                                <p className="text-xs text-gray-500 mt-1">Manage farmers, approvals, and system data</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default Login;
