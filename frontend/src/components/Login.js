// components/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({
        phoneNumber: '',
        password: '',
        userType: 'Farmer' // Default to Farmer for better UX
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const userTypes = [
        { value: 'Federal', label: 'Federal Admin' },
        { value: 'Region', label: 'Region Admin' },
        { value: 'Zone', label: 'Zone Admin' },
        { value: 'Woreda', label: 'Woreda Admin' },
        { value: 'Kebele', label: 'Kebele Admin' },
        { value: 'Farmer', label: 'Farmer' }
    ];

    const handleSubmit = async(e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let endpoint = '';
            let requestBody = {};

            // Determine the correct API endpoint and request body based on user type
            if (formData.userType === 'Farmer') {
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
                        // Note: The backend admin login doesn't use requestedUserType
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

            // Handle response based on user type
            if (formData.userType === 'Farmer') {
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

                // Validate that the selected user type matches the actual user type
                if (formData.userType !== actualUserType) {
                    throw new Error(`Your account is registered as ${actualUserType}, not ${formData.userType}. Please select the correct user type.`);
                }

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

    return ( <
        div className = "min-h-screen flex items-center justify-center bg-gray-100" >
        <
        div className = "bg-white p-8 rounded-lg shadow-md w-96" >
        <
        h2 className = "text-2xl font-bold text-center mb-6 text-gray-800" >
        Agricultural System Login <
        /h2>

        {
            error && ( <
                div className = "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" > { error } <
                /div>
            )
        }

        <
        form onSubmit = { handleSubmit }
        className = "space-y-4" >
        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        User Type <
        /label> <
        select value = { formData.userType }
        onChange = {
            (e) => setFormData({...formData, userType: e.target.value })
        }
        className = "w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        required > {
            userTypes.map((type) => ( <
                option key = { type.value }
                value = { type.value } > { type.label } <
                /option>
            ))
        } <
        /select> < /
        div >

        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Phone Number <
        /label> <
        input type = "tel"
        value = { formData.phoneNumber }
        onChange = {
            (e) => setFormData({...formData, phoneNumber: e.target.value })
        }
        className = "w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        placeholder = "+251911234567"
        required /
        >
        <
        /div>

        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Password <
        /label> <
        input type = "password"
        value = { formData.password }
        onChange = {
            (e) => setFormData({...formData, password: e.target.value })
        }
        className = "w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        placeholder = "Enter your password"
        required /
        >
        <
        /div>

        <
        button type = "submit"
        disabled = { loading }
        className = "w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" > { loading ? 'Logging in...' : 'Login' } <
        /button> < /
        form >

        <
        div className = "mt-6 p-4 bg-gray-50 rounded" >
        <
        h3 className = "font-semibold text-gray-700 mb-2" > Login Information: < /h3> <
        div className = "text-sm text-gray-600 space-y-1" >
        <
        p > < strong > Farmers: < /strong> Use your registered phone number and password</p >
        <
        p > < strong > Admins: < /strong> Use your admin credentials</p >
        <
        p className = "text-xs text-gray-500" >
        Farmers should select "Farmer"
        as user type <
        /p> < /
        div > <
        /div> < /
        div > <
        /div>
    );
};

export default Login;