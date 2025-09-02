// File: KebeleDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const KebeleDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [user, setUser] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const navigate = useNavigate();

    // Farmer Management State
    const [farmers, setFarmers] = useState([]);
    const [showFarmerModal, setShowFarmerModal] = useState(false);
    const [editingFarmer, setEditingFarmer] = useState(null);
    const [farmerForm, setFarmerForm] = useState({
        fullName: '',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
    });

    // Product Management State
    const [products, setProducts] = useState([]);
    const [myProducts, setMyProducts] = useState([]);
    const [otherProducts, setOtherProducts] = useState([]);
    const [productFilter, setProductFilter] = useState('all');
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: '',
        category: '',
        amount: '',
        description: '',
        price: ''
    });

    // Request Management State
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [selectedRequests, setSelectedRequests] = useState([]);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [requestStatus, setRequestStatus] = useState('');
    const [decisionReason, setDecisionReason] = useState('');
    const [bulkAction, setBulkAction] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Stats State
    const [stats, setStats] = useState({
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        acceptedRequests: 0,
        totalFarmers: 0,
        totalProducts: 0
    });

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user') || 'null');
        const userType = localStorage.getItem('userType');

        if (!token || userType !== 'Kebele' || !userData) {
            navigate('/login');
            return;
        }

        setUser(userData);
    }, [navigate]);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    useEffect(() => {
        if (requests.length > 0) {
            filterRequestsByStatus();
        }
    }, [statusFilter, requests]);

    useEffect(() => {
        // Apply dark mode to the entire document
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const filterRequestsByStatus = () => {
        if (statusFilter === 'all') {
            setFilteredRequests(requests);
            return;
        }

        let filtered = [];
        switch (statusFilter) {
            case 'pending':
                filtered = requests.filter(req => req.kebele_status === 'Pending');
                break;
            case 'approved':
                filtered = requests.filter(req => req.kebele_status === 'Approved');
                break;
            case 'accepted':
                filtered = requests.filter(req => req.kebele_status === 'Accepted');
                break;
            case 'rejected':
                filtered = requests.filter(req => req.kebele_status === 'Rejected');
                break;
            default:
                filtered = requests;
        }
        setFilteredRequests(filtered);
    };

    const fetchDashboardData = async() => {
        try {
            const token = localStorage.getItem('token');

            // Fetch farmers in scope
            const farmersResponse = await fetch('http://localhost:5000/api/admins/admins', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (farmersResponse.ok) {
                const data = await farmersResponse.json();
                const farmersData = data.filter(item => item.type === 'farmer');
                setFarmers(farmersData);
                setStats(prev => ({...prev, totalFarmers: farmersData.length }));
                console.log('Farmers data:', farmersData); // Debug log
            } else {
                console.error('Failed to fetch farmers:', await farmersResponse.text());
            }

            // Fetch all products
            const productsResponse = await fetch('http://localhost:5000/api/admins/getproducts', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (productsResponse.ok) {
                const productsData = await productsResponse.json();
                setProducts(productsData);
                setStats(prev => ({...prev, totalProducts: productsData.length }));
                console.log('Products data:', productsData); // Debug log
            } else {
                console.error('Failed to fetch products:', await productsResponse.text());
            }

            // Fetch my products
            const myProductsResponse = await fetch('http://localhost:5000/api/admins/myproducts', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (myProductsResponse.ok) {
                const myProductsData = await myProductsResponse.json();
                setMyProducts(myProductsData);
                console.log('My products data:', myProductsData); // Debug log
            } else {
                console.error('Failed to fetch my products:', await myProductsResponse.text());
            }

            // Fetch other admins' products
            const otherProductsResponse = await fetch('http://localhost:5000/api/admins/otherproducts', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (otherProductsResponse.ok) {
                const otherProductsData = await otherProductsResponse.json();
                setOtherProducts(otherProductsData);
                console.log('Other products data:', otherProductsData); // Debug log
            } else {
                console.error('Failed to fetch other products:', await otherProductsResponse.text());
            }

            // Fetch requests with detailed status
            const requestsResponse = await fetch('http://localhost:5000/api/admins/requests/status', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (requestsResponse.ok) {
                const requestsData = await requestsResponse.json();
                console.log('All requests data:', requestsData); // Debug log

                // Filter requests to only show those from farmers in the same kebele
                const kebeleRequests = requestsData.filter(req =>
                    req.kebele_name === user.kebele_name
                );
                console.log('User kebele_name:', user.kebele_name); // Debug log
                console.log('User data:', user); // Debug log
                setRequests(kebeleRequests);
                setFilteredRequests(kebeleRequests);
                console.log('Kebele requests:', kebeleRequests); // Debug log

                // Calculate stats from requests data
                const totalRequests = kebeleRequests.length;
                const pendingRequests = kebeleRequests.filter(req => req.kebele_status === 'Pending').length;
                const approvedRequests = kebeleRequests.filter(req => req.kebele_status === 'Approved').length;
                const acceptedRequests = kebeleRequests.filter(req => req.kebele_status === 'Accepted').length;
                const rejectedRequests = kebeleRequests.filter(req => req.kebele_status === 'Rejected').length;

                setStats(prev => ({
                    ...prev,
                    totalRequests,
                    pendingRequests,
                    approvedRequests,
                    acceptedRequests,
                    rejectedRequests
                }));
            } else {
                console.error('Failed to fetch requests:', await requestsResponse.text());
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        navigate('/login');
    };

    // Farmer Management Functions
    const handleFarmerSubmit = async(e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            if (farmerForm.password !== farmerForm.confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            const url = editingFarmer ?
                `http://localhost:5000/api/admins/kebele/farmer/${editingFarmer.id}` :
                'http://localhost:5000/api/admins/createfarmer';

            const method = editingFarmer ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName: farmerForm.fullName,
                    phoneNumber: farmerForm.phoneNumber,
                    password: farmerForm.password,
                    role: 'Farmer',
                    region_name: user.region_name,
                    zone_name: user.zone_name,
                    woreda_name: user.woreda_name,
                    kebele_name: user.kebele_name
                })
            });

            if (response.ok) {
                setShowFarmerModal(false);
                setEditingFarmer(null);
                setFarmerForm({ fullName: '', phoneNumber: '', password: '', confirmPassword: '' });
                fetchDashboardData();
                alert(editingFarmer ? 'Farmer updated successfully' : 'Farmer registered successfully');
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Error processing farmer');
            }
        } catch (error) {
            console.error('Error processing farmer:', error);
            alert('Error processing farmer');
        }
    };

    const handleEditFarmer = (farmer) => {
        setEditingFarmer(farmer);
        setFarmerForm({
            fullName: farmer.full_name,
            phoneNumber: farmer.phone_number,
            password: '',
            confirmPassword: ''
        });
        setShowFarmerModal(true);
    };

    const handleDeleteFarmer = async(farmerId) => {
        if (window.confirm('Are you sure you want to delete this farmer?')) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5000/api/admins/kebele/farmer/${farmerId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    fetchDashboardData();
                    alert('Farmer deleted successfully');
                } else {
                    const errorData = await response.json();
                    alert(errorData.message || 'Error deleting farmer');
                }
            } catch (error) {
                console.error('Error deleting farmer:', error);
                alert('Error deleting farmer');
            }
        }
    };

    // Product Management Functions
    const handleProductSubmit = async(e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            // Validate positive values
            if (parseFloat(productForm.amount) <= 0) {
                alert('Amount must be a positive number');
                return;
            }

            if (parseFloat(productForm.price) <= 0) {
                alert('Price must be a positive number');
                return;
            }

            const url = editingProduct ?
                `http://localhost:5000/api/admins/editproduct/${editingProduct.id}` :
                'http://localhost:5000/api/admins/addproduct';

            const method = editingProduct ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: productForm.name,
                    category: productForm.category,
                    amount: productForm.amount,
                    description: productForm.description,
                    price: productForm.price
                })
            });

            if (response.ok) {
                setShowProductModal(false);
                setEditingProduct(null);
                setProductForm({
                    name: '',
                    category: '',
                    amount: '',
                    description: '',
                    price: ''
                });
                fetchDashboardData();
                alert(editingProduct ? 'Product updated successfully' : 'Product added successfully');
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Error processing product');
            }
        } catch (error) {
            console.error('Error processing product:', error);
            alert('Error processing product');
        }
    };

    const handleEditProduct = (product) => {
        // Check if product belongs to current admin
        if (product.created_by_admin_id !== user.id) {
            alert('You can only edit your own products');
            return;
        }

        setEditingProduct(product);
        setProductForm({
            name: product.name,
            category: product.category,
            amount: product.amount,
            description: product.description,
            price: product.price
        });
        setShowProductModal(true);
    };

    const handleDeleteProduct = async(productId) => {
        // Check if product belongs to current admin
        const product = products.find(p => p.id === productId);
        if (product && product.created_by_admin_id !== user.id) {
            alert('You can only delete your own products');
            return;
        }

        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5000/api/admins/deleteproduct/${productId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    fetchDashboardData();
                    alert('Product deleted successfully');
                } else {
                    const errorData = await response.json();
                    alert(errorData.message || 'Error deleting product');
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Error deleting product');
            }
        }
    };

    // Request Management Functions - Updated for multi-level approval
    const updateRequestStatus = async(requestId, status, reason = '') => {
        try {
            const token = localStorage.getItem('token');

            // Map frontend status to database status values
            let dbStatus = status;
            // Backend expects uppercase status values
            if (status === 'Approved') dbStatus = 'Approved';
            if (status === 'Rejected') dbStatus = 'Rejected';
            if (status === 'Accepted') dbStatus = 'Accepted';
            if (status === 'Pending') dbStatus = 'Pending';

            const response = await fetch(`http://localhost:5000/api/admins/requests/${requestId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: dbStatus,
                    feedback: reason
                })
            });

            const responseData = await response.json();

            if (response.ok) {
                setShowRequestModal(false);
                setSelectedRequest(null);
                setRequestStatus('');
                setDecisionReason('');
                fetchDashboardData();
                alert(`Request ${status} successfully`);
            } else {
                alert(responseData.message || 'Error updating request');
            }
        } catch (error) {
            console.error('Error updating request:', error);
            alert('Error updating request');
        }
    };

    const handleStatusUpdate = (request, status) => {
        setSelectedRequest(request);
        setRequestStatus(status);
        setShowRequestModal(true);
    };

    const confirmStatusUpdate = () => {
        if (selectedRequest && requestStatus) {
            updateRequestStatus(selectedRequest.id, requestStatus, decisionReason);
        }
    };

    const toggleRequestSelection = (requestId) => {
        if (selectedRequests.includes(requestId)) {
            setSelectedRequests(selectedRequests.filter(id => id !== requestId));
        } else {
            setSelectedRequests([...selectedRequests, requestId]);
        }
    };

    const selectAllRequests = () => {
        const pendingRequests = filteredRequests.filter(r => r.kebele_status === 'Pending');
        if (selectedRequests.length === pendingRequests.length) {
            setSelectedRequests([]);
        } else {
            setSelectedRequests(pendingRequests.map(r => r.id));
        }
    };

    const handleBulkUpdate = async() => {
        if (!bulkAction || selectedRequests.length === 0) {
            alert('Please select an action and at least one request');
            return;
        }

        try {
            const token = localStorage.getItem('token');

            for (const requestId of selectedRequests) {
                // Map bulk action to database status values
                let dbStatus = 'Pending';
                if (bulkAction === 'approve') dbStatus = 'Approved';
                if (bulkAction === 'accept') dbStatus = 'Accepted';
                if (bulkAction === 'reject') dbStatus = 'Rejected';

                await fetch(`http://localhost:5000/api/admins/requests/${requestId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        status: dbStatus
                    })
                });
            }

            setBulkAction('');
            setSelectedRequests([]);
            fetchDashboardData();
            alert('Bulk update completed successfully');
        } catch (error) {
            console.error('Error performing bulk update:', error);
            alert('Error performing bulk update');
        }
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            'Approved': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            'Accepted': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        };

        return ( <
            span className = { `px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || ''}` } > { status } <
            /span>
        );
    };

    // Add helper function to check if Kebele admin can act on request
    const canKebeleAdminAct = (request) => {
        // Kebele admin can only act on requests that are pending at their level
        return request.kebele_status === 'Pending';
    };

    const getLevelStatus = (level, request) => {
        const status = request[`${level}_status`];
        const admin = request[`${level}_admin_name`];
        const feedback = request[`${level}_feedback`];
        const date = request[`${level}_approved_at`];

        const formatLevel = level.charAt(0).toUpperCase() + level.slice(1);

        return ( <
            div className = "mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded" >
            <
            h4 className = "font-semibold dark:text-white" > { formatLevel }
            Level < /h4> <
            p className = "dark:text-gray-300" > < strong > Status: < /strong> {status || 'Pending'}</p > { admin && < p className = "dark:text-gray-300" > < strong > Admin: < /strong> {admin}</p > } { feedback && < p className = "dark:text-gray-300" > < strong > Feedback: < /strong> {feedback}</p > } { date && < p className = "dark:text-gray-300" > < strong > Date: < /strong> {new Date(date).toLocaleString()}</p > } <
            /div>
        );
    };

    const viewRequestDetails = async(requestId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admins/requests/${requestId}/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const requestDetails = await response.json();
                setSelectedRequest(requestDetails);
                setShowRequestModal(true);
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Error fetching request details');
            }
        } catch (error) {
            console.error('Error fetching request details:', error);
            alert('Error fetching request details');
        }
    };

    // Filter products based on selected filter
    const getFilteredProducts = () => {
        switch (productFilter) {
            case 'own':
                return myProducts;
            case 'others':
                return otherProducts;
            case 'all':
            default:
                return products;
        }
    };

    if (!user) {
        return <div className = "flex justify-center items-center h-screen dark:bg-gray-900" > Loading... < /div>;
    }

    return ( <
        div className = { `flex min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}` } > { /* Sidebar */ } <
        div className = { `w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg p-4 flex flex-col` } >
        <
        h2 className = "text-xl font-bold mb-6 dark:text-white" > Kebele Dashboard < /h2> <
        nav className = "flex-1" >
        <
        button className = { `w-full text-left py-2 px-4 rounded mb-2 ${activeTab === 'overview' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white'}` }
        onClick = {
            () => setActiveTab('overview')
        } > 📊Overview <
        /button> <
        button className = { `w-full text-left py-2 px-4 rounded mb-2 ${activeTab === 'farmers' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white'}` }
        onClick = {
            () => setActiveTab('farmers')
        } > 👨‍🌾Farmers <
        /button> <
        button className = { `w-full text-left py-2 px-4 rounded mb-2 ${activeTab === 'products' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white'}` }
        onClick = {
            () => setActiveTab('products')
        } > 🛒Products <
        /button> <
        button className = { `w-full text-left py-2 px-4 rounded mb-2 ${activeTab === 'requests' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white'}` }
        onClick = {
            () => setActiveTab('requests')
        } > 📋Requests <
        /button> < /
        nav > <
        div className = "mt-auto" >
        <
        button className = "w-full py-2 px-4 rounded mb-2 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white"
        onClick = {
            () => setDarkMode(!darkMode)
        } > { darkMode ? '☀️ Light Mode' : '🌙 Dark Mode' } <
        /button> < /
        div > <
        /div>

        { /* Main Content */ } <
        div className = "flex-1 flex flex-col" >
        <
        header className = { `${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm p-4 flex justify-between items-center` } >
        <
        h1 className = "text-2xl font-semibold dark:text-white" > Welcome, { user.fullName }(Kebele Admin) < /h1> <
        button onClick = { handleLogout }
        className = "bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded dark:bg-red-600 dark:hover:bg-red-700" >
        Logout <
        /button> < /
        header >

        <
        main className = "flex-1 p-6 overflow-auto" > { /* Overview Tab */ } {
            activeTab === 'overview' && ( <
                div >
                <
                h2 className = "text-2xl font-bold mb-6 dark:text-white" > System Overview < /h2> <
                div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" >
                <
                div className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                h3 className = "text-2xl font-bold dark:text-white" > { stats.totalRequests } < /h3> <
                p className = "dark:text-gray-300" > Total Requests < /p> < /
                div > <
                div className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                h3 className = "text-2xl font-bold dark:text-white" > { stats.pendingRequests } < /h3> <
                p className = "dark:text-gray-300" > Pending Requests < /p> < /
                div > <
                div className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                h3 className = "text-2xl font-bold dark:text-white" > { stats.approvedRequests } < /h3> <
                p className = "dark:text-gray-300" > Approved Requests < /p> < /
                div > <
                div className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                h3 className = "text-2xl font-bold dark:text-white" > { stats.acceptedRequests } < /h3> <
                p className = "dark:text-gray-300" > Accepted Requests < /p> < /
                div > <
                div className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                h3 className = "text-2xl font-bold dark:text-white" > { stats.rejectedRequests } < /h3> <
                p className = "dark:text-gray-300" > Rejected Requests < /p> < /
                div > <
                div className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                h3 className = "text-2xl font-bold dark:text-white" > { stats.totalFarmers } < /h3> <
                p className = "dark:text-gray-300" > Farmers < /p> < /
                div > <
                div className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                h3 className = "text-2xl font-bold dark:text-white" > { stats.totalProducts } < /h3> <
                p className = "dark:text-gray-300" > Products < /p> < /
                div > <
                /div>

                <
                div className = { `p-6 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                h2 className = "text-xl font-bold mb-4 dark:text-white" > Quick Actions < /h2> <
                div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" >
                <
                button onClick = {
                    () => setActiveTab('requests')
                }
                className = "py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded dark:bg-blue-600 dark:hover:bg-blue-700" > 📋Manage Requests <
                /button> <
                button onClick = {
                    () => setActiveTab('farmers')
                }
                className = "py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded dark:bg-green-600 dark:hover:bg-green-700" > 👨‍🌾Manage Farmers <
                /button> <
                button onClick = {
                    () => setActiveTab('products')
                }
                className = "py-3 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded dark:bg-purple-600 dark:hover:bg-purple-700" > 🛒Manage Products <
                /button> <
                button onClick = {
                    () => setShowFarmerModal(true)
                }
                className = "py-3 px-4 bg-teal-500 hover:bg-teal-600 text-white rounded dark:bg-teal-600 dark:hover:bg-teal-700" > ➕Register Farmer <
                /button> <
                button onClick = {
                    () => setShowProductModal(true)
                }
                className = "py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded dark:bg-orange-600 dark:hover:bg-orange-700" > ➕Add Product <
                /button> < /
                div > <
                /div> < /
                div >
            )
        }

        { /* Farmers Tab */ } {
            activeTab === 'farmers' && ( <
                    div >
                    <
                    div className = "flex justify-between items-center mb-6" >
                    <
                    div >
                    <
                    h2 className = "text-2xl font-bold dark:text-white" > Farmer Management < /h2> <
                    p className = "dark:text-gray-300" > Managing farmers in your kebele: { user.kebele_name } < /p> < /
                    div > <
                    button onClick = {
                        () => setShowFarmerModal(true)
                    }
                    className = "bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded dark:bg-green-600 dark:hover:bg-green-700" > ➕Register New Farmer <
                    /button> < /
                    div >

                    <
                    div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" > {
                        farmers.map((farmer) => ( <
                                div key = { farmer.id }
                                className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                                <
                                div className = "mb-4" >
                                <
                                h3 className = "text-lg font-semibold dark:text-white" > { farmer.full_name } < /h3> <
                                p className = "dark:text-gray-300" > 📞Phone: { farmer.phone_number } < /p> <
                                p className = "dark:text-gray-300" > 📍Kebele: { farmer.kebele_name } < /p> <
                                p className = "dark:text-gray-300" > 📅Registered: { new Date(farmer.created_at).toLocaleDateString() } < /p> < /
                                div > <
                                div className = "flex space-x-2 mb-4" >
                                <
                                button onClick = {
                                    () => handleEditFarmer(farmer)
                                }
                                className = "bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm dark:bg-blue-600 dark:hover:bg-blue-700" > ✏️Edit <
                                /button> <
                                button onClick = {
                                    () => handleDeleteFarmer(farmer.id)
                                }
                                className = "bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm dark:bg-red-600 dark:hover:bg-red-700" > 🗑️Delete <
                                /button> < /
                                div > <
                                div >
                                <
                                h4 className = "font-semibold dark:text-white" > Recent Requests: < /h4> {
                                requests
                                .filter(req => req.farmer_id === farmer.id)
                                .slice(0, 3)
                                .map(req => ( <
                                    div key = { req.id }
                                    className = "flex justify-between items-center mt-2" >
                                    <
                                    span className = "text-sm dark:text-gray-300" > { req.product_name } < /span> { getStatusBadge(req.kebele_status) } < /
                                    div >
                                ))
                            } {
                                requests.filter(req => req.farmer_id === farmer.id).length === 0 && ( <
                                    p className = "text-sm mt-2 dark:text-gray-300" > No requests from this farmer < /p>
                                )
                            } <
                            /div> < /
                            div >
                        ))
                } {
                    farmers.length === 0 && ( <
                        p className = "col-span-full text-center py-8 dark:text-gray-300" > No farmers found in your kebele. < /p>
                    )
                } <
                /div> < /
            div >
        )
    }

    { /* Products Tab */ } {
        activeTab === 'products' && ( <
                div >
                <
                div className = "flex justify-between items-center mb-6" >
                <
                div >
                <
                h2 className = "text-2xl font-bold dark:text-white" > Product Management < /h2> <
                p className = "dark:text-gray-300" > Managing products in your kebele < /p> < /
                div > <
                button onClick = {
                    () => setShowProductModal(true)
                }
                className = "bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded dark:bg-green-600 dark:hover:bg-green-700" > ➕Add New Product <
                /button> < /
                div >

                <
                div className = "mb-6" >
                <
                div className = "flex space-x-4 mb-4" >
                <
                button className = { `py-2 px-4 rounded ${productFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-white'}` }
                onClick = {
                    () => setProductFilter('all')
                } >
                All Products <
                /button> <
                button className = { `py-2 px-4 rounded ${productFilter === 'own' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-white'}` }
                onClick = {
                    () => setProductFilter('own')
                } >
                My Products <
                /button> <
                button className = { `py-2 px-4 rounded ${productFilter === 'others' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-white'}` }
                onClick = {
                    () => setProductFilter('others')
                } >
                Other Admins ' Products < /
                button > <
                /div> < /
                div >

                <
                div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" > {
                    getFilteredProducts().map((product) => ( <
                            div key = { product.id }
                            className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                            <
                            div className = "mb-4" >
                            <
                            h3 className = "text-lg font-semibold dark:text-white" > { product.name } < /h3> <
                            p className = "text-sm dark:text-gray-300" > { product.description } < /p> <
                            p className = "dark:text-gray-300" > 💰Price: Birr { product.price } < /p> <
                            p className = "dark:text-gray-300" > 📦Amount: { product.amount } < /p> {
                            productFilter !== 'own' && ( <
                                >
                                <
                                p className = "dark:text-gray-300" > 👤Added by: { product.created_by_name }({ product.admin_role }) < /p> <
                                p className = "dark:text-gray-300" > 📍Location: { product.region_name }
                                / {product.zone_name} / { product.woreda_name }
                                / {product.kebele_name}</p >
                                <
                                />
                            )
                        } <
                        p className = "dark:text-gray-300" > 📅Created: { new Date(product.created_at).toLocaleDateString() } < /p> < /
                        div > {
                            product.created_by_admin_id === user.id && ( <
                                div className = "flex space-x-2" >
                                <
                                button onClick = {
                                    () => handleEditProduct(product)
                                }
                                className = "bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm dark:bg-blue-600 dark:hover:bg-blue-700" > ✏️Edit <
                                /button> <
                                button onClick = {
                                    () => handleDeleteProduct(product.id)
                                }
                                className = "bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm dark:bg-red-600 dark:hover:bg-red-700" > 🗑️Delete <
                                /button> < /
                                div >
                            )
                        } <
                        /div>
                    ))
            } {
                getFilteredProducts().length === 0 && ( <
                    p className = "col-span-full text-center py-8 dark:text-gray-300" > {
                        productFilter === 'own' ?
                        "You haven't added any products yet." : productFilter === 'others' ?
                            "No products from other admins." : "No products found."
                    } <
                    /p>
                )
            } <
            /div> < /
        div >
    )
}

{ /* Requests Tab */ } {
    activeTab === 'requests' && ( <
        div >
        <
        div className = "mb-6" >
        <
        h2 className = "text-2xl font-bold dark:text-white" > Request Management < /h2> <
        p className = "dark:text-gray-300" > Manage farmer requests in your kebele: { user.kebele_name } < /p> < /
        div >

        <
        div className = { `p-4 rounded shadow mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
        <
        div className = "flex flex-wrap items-center gap-4 mb-4" >
        <
        div >
        <
        label className = "mr-2 dark:text-white" > Filter by Status: < /label> <
        select value = { statusFilter }
        onChange = {
            (e) => setStatusFilter(e.target.value)
        }
        className = { `p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white border'}` } >
        <
        option value = "all" > All Requests < /option> <
        option value = "pending" > Pending < /option> <
        option value = "approved" > Approved < /option> <
        option value = "accepted" > Accepted < /option> <
        option value = "rejected" > Rejected < /option> < /
        select > <
        /div>

        {
            filteredRequests.filter(r => r.kebele_status === 'Pending').length > 0 && ( <
                div className = "flex flex-wrap items-center gap-2" >
                <
                select value = { bulkAction }
                onChange = {
                    (e) => setBulkAction(e.target.value)
                }
                className = { `p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white border'}` } >
                <
                option value = "" > Select Bulk Action < /option> <
                option value = "approve" > Approve < /option> <
                option value = "accept" > Accept < /option> <
                option value = "reject" > Reject < /option> < /
                select > <
                button onClick = { handleBulkUpdate }
                className = "bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-700" >
                Apply to Selected <
                /button> <
                button onClick = { selectAllRequests }
                className = "bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700" > { selectedRequests.length === filteredRequests.filter(r => r.kebele_status === 'Pending').length ? 'Deselect All' : 'Select All Pending' } <
                /button> < /
                div >
            )
        } <
        /div> < /
        div >

        <
        div className = "grid grid-cols-1 gap-4" > {
            filteredRequests.map((request) => ( <
                    div key = { request.id }
                    className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                    <
                    div className = "flex justify-between items-start mb-4" >
                    <
                    div >
                    <
                    h3 className = "text-lg font-semibold dark:text-white" > { request.product_name } < /h3> <
                    p className = "dark:text-gray-300" > 👨‍🌾Farmer: { request.farmer_name } < /p> <
                    p className = "dark:text-gray-300" > 📞Phone: { request.farmer_phone } < /p> <
                    p className = "dark:text-gray-300" > 📅Requested: { new Date(request.created_at).toLocaleDateString() } < /p> <
                    p className = "dark:text-gray-300" > 📦Amount: { request.amount } < /p> <
                    p className = "dark:text-gray-300" > 💰Price: Birr { request.product_price || 'N/A' } < /p> <
                    p className = "dark:text-gray-300" > 💵Total Cost: Birr { request.product_price ? (request.product_price * request.amount).toFixed(2) : 'N/A' } < /p> < /
                    div > <
                    div className = "flex flex-col items-end" >
                    <
                    div className = "mb-2" > { getStatusBadge(request.kebele_status) } <
                    /div> {
                    request.kebele_status === 'Pending' && canKebeleAdminAct(request) && ( <
                        div className = "flex space-x-2" >
                        <
                        button onClick = {
                            () => handleStatusUpdate(request, 'Approved')
                        }
                        className = "bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs dark:bg-blue-600 dark:hover:bg-blue-700" >
                        Approve <
                        /button> <
                        button onClick = {
                            () => handleStatusUpdate(request, 'Accepted')
                        }
                        className = "bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-xs dark:bg-green-600 dark:hover:bg-green-700" >
                        Accept <
                        /button> <
                        button onClick = {
                            () => handleStatusUpdate(request, 'Rejected')
                        }
                        className = "bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs dark:bg-red-600 dark:hover:bg-red-700" >
                        Reject <
                        /button> < /
                        div >
                    )
                } <
                button onClick = {
                    () => viewRequestDetails(request.id)
                }
                className = "mt-2 bg-gray-500 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs dark:bg-gray-600 dark:hover:bg-gray-700" >
                View Details <
                /button> {
                request.kebele_status === 'Pending' && ( <
                    div className = "mt-2" >
                    <
                    input type = "checkbox"
                    checked = { selectedRequests.includes(request.id) }
                    onChange = {
                        () => toggleRequestSelection(request.id)
                    }
                    className = "mr-1" /
                    >
                    <
                    span className = "text-xs dark:text-gray-300" > Select < /span> < /
                    div >
                )
            } <
            /div> < /
            div > <
            /div>
        ))
} {
    filteredRequests.length === 0 && ( <
        p className = "text-center py-8 dark:text-gray-300" > No requests found. < /p>
    )
} <
/div> < /
div >
)
} <
/main> < /
div >

    { /* Farmer Modal */ } {
        showFarmerModal && ( <
            div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
            <
            div className = { `w-full max-w-md p-6 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
            <
            h2 className = "text-xl font-bold mb-4 dark:text-white" > { editingFarmer ? 'Edit Farmer' : 'Register New Farmer' } <
            /h2> <
            form onSubmit = { handleFarmerSubmit } >
            <
            div className = "mb-4" >
            <
            label className = "block mb-1 dark:text-gray-300" > Full Name < /label> <
            input type = "text"
            required value = { farmerForm.fullName }
            onChange = {
                (e) => setFarmerForm({...farmerForm, fullName: e.target.value })
            }
            className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white border'}` }
            /> < /
            div > <
            div className = "mb-4" >
            <
            label className = "block mb-1 dark:text-gray-300" > Phone Number < /label> <
            input type = "tel"
            required value = { farmerForm.phoneNumber }
            onChange = {
                (e) => setFarmerForm({...farmerForm, phoneNumber: e.target.value })
            }
            className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white border'}` }
            /> < /
            div > <
            div className = "mb-4" >
            <
            label className = "block mb-1 dark:text-gray-300" > Password < /label> <
            input type = "password"
            required = {!editingFarmer }
            value = { farmerForm.password }
            onChange = {
                (e) => setFarmerForm({...farmerForm, password: e.target.value })
            }
            className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white border'}` }
            /> < /
            div > <
            div className = "mb-6" >
            <
            label className = "block mb-1 dark:text-gray-300" > Confirm Password < /label> <
            input type = "password"
            required = {!editingFarmer }
            value = { farmerForm.confirmPassword }
            onChange = {
                (e) => setFarmerForm({...farmerForm, confirmPassword: e.target.value })
            }
            className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white border'}` }
            /> < /
            div > <
            div className = "flex justify-end space-x-2" >
            <
            button type = "button"
            onClick = {
                () => {
                    setShowFarmerModal(false);
                    setEditingFarmer(null);
                    setFarmerForm({ fullName: '', phoneNumber: '', password: '', confirmPassword: '' });
                }
            }
            className = "bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700" >
            Cancel <
            /button> <
            button type = "submit"
            className = "bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-700" > { editingFarmer ? 'Update Farmer' : 'Register Farmer' } <
            /button> < /
            div > <
            /form> < /
            div > <
            /div>
        )
    }

{ /* Product Modal */ } {
    showProductModal && ( <
        div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
        <
        div className = { `w-full max-w-md p-6 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
        <
        h2 className = "text-xl font-bold mb-4 dark:text-white" > { editingProduct ? 'Edit Product' : 'Add New Product' } <
        /h2> <
        form onSubmit = { handleProductSubmit } >
        <
        div className = "mb-4" >
        <
        label className = "block mb-1 dark:text-gray-300" > Product Name < /label> <
        input type = "text"
        required value = { productForm.name }
        onChange = {
            (e) => setProductForm({...productForm, name: e.target.value })
        }
        className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white border'}` }
        /> < /
        div > <
        div className = "mb-4" >
        <
        label className = "block mb-1 dark:text-gray-300" > Amount(Quantity) < /label> <
        input type = "number"
        required min = "1"
        step = "1"
        value = { productForm.amount }
        onChange = {
            (e) => setProductForm({...productForm, amount: e.target.value })
        }
        className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white border'}` }
        /> < /
        div > <
        div className = "mb-4" >
        <
        label className = "block mb-1 dark:text-gray-300" > Price(Birr) < /label> <
        input type = "number"
        required min = "0.01"
        step = "0.01"
        value = { productForm.price }
        onChange = {
            (e) => setProductForm({...productForm, price: e.target.value })
        }
        className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white border'}` }
        /> < /
        div > <
        div className = "mb-6" >
        <
        label className = "block mb-1 dark:text-gray-300" > Description < /label> <
        textarea value = { productForm.description }
        onChange = {
            (e) => setProductForm({...productForm, description: e.target.value })
        }
        className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white border'}` }
        rows = "3" /
        >
        <
        /div> <
        div className = "flex justify-end space-x-2" >
        <
        button type = "button"
        onClick = {
            () => {
                setShowProductModal(false);
                setEditingProduct(null);
                setProductForm({ name: '', category: '', amount: '', description: '', price: '' });
            }
        }
        className = "bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700" >
        Cancel <
        /button> <
        button type = "submit"
        className = "bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-700" > { editingProduct ? 'Update Product' : 'Add Product' } <
        /button> < /
        div > <
        /form> < /
        div > <
        /div>
    )
}

{ /* Request Status Modal */ } {
    showRequestModal && selectedRequest && ( <
            div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
            <
            div className = { `w-full max-w-2xl p-6 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'} max-h-screen overflow-y-auto` } >
            <
            h2 className = "text-xl font-bold mb-4 dark:text-white" > Request Details < /h2>

            <
            div className = "mb-6" >
            <
            h3 className = "text-lg font-semibold dark:text-white" > { selectedRequest.product_name } < /h3> <
            p className = "dark:text-gray-300" > 👨‍🌾Farmer: { selectedRequest.farmer_name } < /p> <
            p className = "dark:text-gray-300" > 📞Phone: { selectedRequest.farmer_phone } < /p> <
            p className = "dark:text-gray-300" > 📅Requested: { new Date(selectedRequest.created_at).toLocaleDateString() } < /p> <
            p className = "dark:text-gray-300" > 📦Amount: { selectedRequest.amount } < /p> <
            p className = "dark:text-gray-300" > 💰Price: Birr { selectedRequest.product_price || 'N/A' } < /p> <
            p className = "dark:text-gray-300" > 💵Total Cost: Birr { selectedRequest.product_price ? (selectedRequest.product_price * selectedRequest.amount).toFixed(2) : 'N/A' } < /p> <
            div className = "mt-2" > { getStatusBadge(selectedRequest.kebele_status) } <
            /div> < /
            div >

            <
            div className = "mb-6" >
            <
            h3 className = "text-lg font-semibold dark:text-white" > Approval Workflow < /h3> <
            div className = "mt-4 space-y-4 max-h-96 overflow-y-auto" > { getLevelStatus('kebele', selectedRequest) } { getLevelStatus('woreda', selectedRequest) } { getLevelStatus('zone', selectedRequest) } { getLevelStatus('region', selectedRequest) } { getLevelStatus('federal', selectedRequest) } <
            /div> < /
            div >

            {
                requestStatus && canKebeleAdminAct(selectedRequest) && ( <
                    div className = "mb-6" >
                    <
                    h3 className = "text-lg font-semibold mb-2 dark:text-white" > Update Status < /h3> <
                    div className = "mb-4" >
                    <
                    label className = "block mb-1 dark:text-gray-300" > Reason / Feedback(Optional) < /label> <
                    textarea value = { decisionReason }
                    onChange = {
                        (e) => setDecisionReason(e.target.value)
                    }
                    className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white border'}` }
                    rows = "3"
                    placeholder = "Enter reason for your decision..." /
                    >
                    <
                    /div> < /
                    div >
                )
            }

            <
            div className = "flex justify-end space-x-2" >
            <
            button onClick = {
                () => {
                    setShowRequestModal(false);
                    setSelectedRequest(null);
                    setRequestStatus('');
                    setDecisionReason('');
                }
            }
            className = "bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700" >
            Close <
            /button> {
            requestStatus && canKebeleAdminAct(selectedRequest) && ( <
                button onClick = { confirmStatusUpdate }
                className = { `py-2 px-4 rounded text-white ${
                                        requestStatus === 'Approved' 
                                            ? 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                                            : requestStatus === 'Accepted'
                                            ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
                                            : 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                                    }` } >
                Confirm { requestStatus } <
                /button>
            )
        } <
        /div> < /
    div > <
        /div>
)
} <
/div>
);
};

export default KebeleDashboard;