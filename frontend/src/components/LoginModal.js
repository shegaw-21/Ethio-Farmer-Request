// components/LoginModal.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginModal = ({ isOpen, onClose, language = 'en' }) => {
    const [loginType, setLoginType] = useState('farmer'); // 'farmer' or 'admin'
    const [formData, setFormData] = useState({
        phoneNumber: '',
        password: '',
        adminType: 'Federal' // For admin dropdown
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const translations = {
        en: {
            welcomeBack: 'Welcome Back',
            chooseLoginType: 'Choose your login type to continue',
            farmer: 'Farmer',
            administrator: 'Administrator',
            adminLevel: 'Administrative Level',
            phoneNumber: 'Phone Number',
            password: 'Password',
            signIn: 'Sign In',
            signingIn: 'Signing In...',
            farmers: 'Farmers',
            administrators: 'Administrators',
            farmersDesc: 'Use your registered phone number and password',
            adminsDesc: 'Select your level and use your credentials',
            farmersAccess: 'Submit product requests, track status, and manage your applications',
            adminsAccess: 'Approve/reject requests, manage users, and oversee your administrative area',
            accessInfo: 'Access Information',
            close: 'Close'
        },
        am: {
            welcomeBack: 'እንኳን ደህና መጡ',
            chooseLoginType: 'ለመቀጠል የመግቢያ አይነትዎን ይምረጡ',
            farmer: 'ገበሬ',
            administrator: 'አስተዳዳሪ',
            adminLevel: 'የአስተዳደር ደረጃ',
            phoneNumber: 'ስልክ ቁጥር',
            password: 'የይለፍ ቃል',
            signIn: 'ግባ',
            signingIn: 'እየገባ...',
            farmers: 'ገበሬዎች',
            administrators: 'አስተዳዳሪዎች',
            farmersDesc: 'የተመዘገበ ስልክ ቁጥርዎን እና የይለፍ ቃልዎን ይጠቀሙ',
            adminsDesc: 'ደረጃዎን ይምረጡ እና ምስክርዎን ይጠቀሙ',
            farmersAccess: 'የምርት ጥያቄዎችን ያስገቡ፣ ሁኔታን ይከታተሉ እና ማመልከቻዎችዎን ያስተዳድሩ',
            adminsAccess: 'ጥያቄዎችን ይፈቅዱ/ይከልክሉ፣ ተጠቃሚዎችን ያስተዳድሩ እና የአስተዳደር አካባቢዎን ይቆጣጠሩ',
            accessInfo: 'የመዳረሻ መረጃ',
            close: 'ዝጋ'
        }
    };


    const t = translations[language];

    const handleSubmit = async(e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let endpoint = '';
            let requestBody = {};

            // Determine the correct API endpoint based on login type
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
            console.log('API Response:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Handle response based on login type
            if (loginType === 'farmer') {
                const farmerData = data.farmer || data;
                const token = data.token;

                if (!token) {
                    throw new Error('Authentication error: No token received');
                }

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(farmerData));
                localStorage.setItem('userType', 'Farmer');
                onClose();
                navigate('/farmer-dashboard');

            } else {
                const adminData = data.user || data;
                const token = data.token;
                const actualUserType = adminData.role;

                if (!token || !actualUserType) {
                    throw new Error('Authentication error: Invalid response format');
                }


                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(adminData));
                localStorage.setItem('userType', actualUserType);
                onClose();

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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200">
                <div className="p-8 bg-gradient-to-br from-white to-gray-50">
                    {/* Header with Close Button */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-center flex-1">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.welcomeBack}</h2>
                            <p className="text-gray-600">{t.chooseLoginType}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-xl font-bold ml-4"
                            title={t.close}
                        >
                            ✕
                        </button>
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
                            🚜 {t.farmer}
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
                            👨‍💼 {t.administrator}
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
                                {t.phoneNumber}
                            </label>
                            <input
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gradient-to-r from-white to-gray-50 shadow-sm"
                                placeholder="+251911234567"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t.password}
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gradient-to-r from-white to-gray-50 shadow-sm"
                                placeholder={language === 'en' ? 'Enter your password' : 'የይለፍ ቃልዎን ያስገቡ'}
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 px-4 rounded-lg font-medium transition-all shadow-lg ${
                                loginType === 'farmer'
                                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                            } disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t.signingIn}
                                </span>
                            ) : (
                                `${t.signIn} ${language === 'en' ? 'as' : 'እንደ'} ${loginType === 'farmer' ? t.farmer : t.administrator}`
                            )}
                        </button>
                    </form>

                    {/* Help Section */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-gray-700 mb-2">🔐 {t.accessInfo}</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                            {loginType === 'farmer' ? (
                                <div>
                                    <p><strong>🚜 {t.farmers}:</strong> {t.farmersDesc}</p>
                                    <p className="text-xs text-gray-500 mt-1">{t.farmersAccess}</p>
                                </div>
                            ) : (
                                <div>
                                    <p><strong>👨‍💼 {t.administrators}:</strong> {t.adminsDesc}</p>
                                    <p className="text-xs text-gray-500 mt-1">{t.adminsAccess}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
