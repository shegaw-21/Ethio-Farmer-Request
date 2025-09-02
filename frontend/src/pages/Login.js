// components/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({
        phoneNumber: '',
        password: '',
        userType: 'Federal' // Default to Federal admin
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

            // Determine the correct API endpoint based on user type
            if (formData.userType === 'Farmer') {
                endpoint = 'http://localhost:5000/api/farmers/login';
            } else {
                endpoint = 'http://localhost:5000/api/admins/login';
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber: formData.phoneNumber,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user || data.farmer));
            localStorage.setItem('userType', formData.userType);

            // Redirect to appropriate dashboard
            switch (formData.userType) {
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
                case 'Farmer':
                    navigate('/farmer-dashboard');
                    break;
                default:
                    navigate('/');
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
            (e) => setFormData({...formData, userType: e.target.value }) }
        className = "w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        required >
        {
            userTypes.map((type) => ( <
                option key = { type.value }
                value = { type.value } > { type.label } <
                /option>
            ))
        } <
        /select> <
        /div>

        <
        div >
        <
        label className = "block text-sm font-medium text-gray-700 mb-1" >
        Phone Number <
        /label> <
        input type = "tel"
        value = { formData.phoneNumber }
        onChange = {
            (e) => setFormData({...formData, phoneNumber: e.target.value }) }
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
            (e) => setFormData({...formData, password: e.target.value }) }
        className = "w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        placeholder = "Enter your password"
        required /
        >
        <
        /div>

        <
        button type = "submit"
        disabled = { loading }
        className = "w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" >
        { loading ? 'Logging in...' : 'Login' } <
        /button> <
        /form>

        <
        div className = "mt-6 p-4 bg-gray-50 rounded" >
        <
        h3 className = "font-semibold text-gray-700 mb-2" > Demo Credentials: < /h3> <
        div className = "text-sm text-gray-600 space-y-1" >
        <
        p > < strong > Federal Admin: < /strong> Your specific phone + password</p >
        <
        p > < strong > Other Users: < /strong> Credentials from database</p >
        <
        p className = "text-xs text-red-600" > Public credentials are invalid < /p> <
        /div> <
        /div> <
        /div> <
        /div>
    );
};

export default Login;