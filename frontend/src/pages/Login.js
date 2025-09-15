// pages/Login.js
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
                // Handle blocked IP
                if (response.status === 429 && data.blocked) {
                    throw new Error(`IP blocked for ${data.timeRemaining} minutes due to too many failed attempts`);
                }
                // Handle failed attempts with remaining count
                if (data.attemptsRemaining !== undefined) {
                    throw new Error(`${data.message} (${data.attemptsRemaining} attempts remaining)`);
                }
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
                navigate('/farmer-dashboard');

            } else {
                const adminData = data.user || data;
                const token = data.token;
                const actualUserType = adminData.role;

                if (!token || !actualUserType) {
                    throw new Error('Authentication error: Invalid response format');
                }

                // Auto-set the correct admin type based on user's actual role
                setFormData(prev => ({...prev, adminType: actualUserType }));

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

    return ( <
        div className = "min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50" > { /* Header */ } <
        div className = "bg-white shadow-sm border-b" >
        <
        div className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" >
        <
        div className = "flex justify-between items-center py-4" >
        <
        div className = "flex items-center space-x-3" >
        <
        div className = "text-2xl" > 🇪🇹 < /div> <
        div >
        <
        h1 className = "text-xl font-bold text-gray-900" > Ethiopian Agricultural Product Request System < /h1> <
        p className = "text-sm text-gray-600" > የኢትዮጵያ የግብርና ምርት ጥያቄ ስርዓት < /p> < /
        div > <
        /div> <
        div className = "flex items-center space-x-4" > { /* Language Toggle */ } <
        button className = "px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors" >
        EN <
        /button>

        { /* About Button */ } <
        a href = "/about"
        className = "text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-2 rounded-md hover:bg-blue-50 transition-colors" >
        About System <
        /a>

        { /* Login Button */ } <
        button className = "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium" >
        Login <
        /button> < /
        div > <
        /div> < /
        div > <
        /div>

        <
        div className = "flex min-h-screen items-center justify-center" > { /* Login Form */ } <
        div className = "w-full flex items-center justify-center p-8" >
        <
        div className = "bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md" > { /* Login Type Selection */ } <
        div className = "text-center mb-8" >
        <
        h2 className = "text-2xl font-bold text-gray-800 mb-2" > Welcome Back < /h2> <
        p className = "text-gray-600" > Choose your login type to
        continue < /p> < /
        div >

        <
        div className = "flex mb-6 bg-gray-100 rounded-lg p-1" >
        <
        button type = "button"
        onClick = {
            () => setLoginType('farmer')
        }
        className = { `flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all ${loginType === 'farmer'
                                        ? 'bg-green-500 text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-800'
                                    }` } > 🚜Farmer <
        /button> <
        button type = "button"
        onClick = {
            () => setLoginType('admin')
        }
        className = { `flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all ${loginType === 'admin'
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-800'
                                    }` } > 👨‍💼Administrator <
        /button> < /
        div >

        { /* Error Message */ } {
            error && ( <
                div className = "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4" > { error } <
                /div>
            )
        }

        { /* Login Form */ } <
        form onSubmit = { handleSubmit }
        className = "space-y-4" >

        { /* Phone Number */ } <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-2" >
        Phone Number <
        /label> <
        input type = "tel"
        value = { formData.phoneNumber }
        onChange = {
            (e) => setFormData({...formData, phoneNumber: e.target.value })
        }
        className = "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder = "+251911234567"
        required /
        >
        <
        /div>

        { /* Password */ } <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-2" >
        Password <
        /label> <
        input type = "password"
        value = { formData.password }
        onChange = {
            (e) => setFormData({...formData, password: e.target.value })
        }
        className = "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder = "Enter your password"
        required /
        >
        <
        /div>

        { /* Submit Button */ } <
        button type = "submit"
        disabled = { loading }
        className = { `w-full py-3 px-4 rounded-lg font-medium transition-all ${loginType === 'farmer'
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    } disabled:opacity-50 disabled:cursor-not-allowed` } > {
            loading ? ( <
                span className = "flex items-center justify-center" >
                <
                svg className = "animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns = "http://www.w3.org/2000/svg"
                fill = "none"
                viewBox = "0 0 24 24" >
                <
                circle className = "opacity-25"
                cx = "12"
                cy = "12"
                r = "10"
                stroke = "currentColor"
                strokeWidth = "4" > < /circle> <
                path className = "opacity-75"
                fill = "currentColor"
                d = "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" > < /path> < /
                svg >
                Signing In... <
                /span>
            ) : (
                `Sign In as ${loginType === 'farmer' ? 'Farmer' : 'Administrator'}`
            )
        } <
        /button> < /
        form >

        { /* Help Section */ } <
        div className = "mt-6 p-4 bg-gray-50 rounded-lg" >
        <
        h3 className = "font-semibold text-gray-700 mb-2" > 🔐Access Information < /h3> <
        div className = "text-sm text-gray-600 space-y-1" > {
            loginType === 'farmer' ? ( <
                div >
                <
                p > < strong > 🚜Farmers: < /strong> Use your registered phone number and password from your kebele admin</p >
                <
                p className = "text-xs text-gray-500 mt-1" > Submit product requests, track status, and manage your applications < /p> < /
                div >
            ) : ( <
                div >
                <
                p > < strong > 👨‍💼Administrators: < /strong> Use your credentials(registered phone number and password) from your admin</p >
                <
                p className = "text-xs text-gray-500 mt-1" > Approve / Accept / reject requests, manage users, and oversee your administrative area < /p > < /
                div >
            )
        } <
        /div> < /
        div > <
        /div> < /
        div > <
        /div>

        <
        /div>
    );
};

export default Login;