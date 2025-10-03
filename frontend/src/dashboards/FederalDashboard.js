import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FederalDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [user, setUser] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const navigate = useNavigate();

    // Product Management State
    const [products, setProducts] = useState([]);
    const [myProducts, setMyProducts] = useState([]);
    const [otherProducts, setOtherProducts] = useState([]);
    const [productFilter, setProductFilter] = useState('all');
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: '',
        category: '',
        amount: '',
        description: '',
        price: '',
        subCategory: '',
        unit: '',
        manufacturer: '',
        expiryDate: ''
    });
    const [productError, setProductError] = useState('');

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

    // Admin Management State
    const [admins, setAdmins] = useState([]);
    const [regions, setRegions] = useState([]);
    const [regionFilter, setRegionFilter] = useState('all');
    const [showAdminForm, setShowAdminForm] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [adminForm, setAdminForm] = useState({
        fullName: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        role: 'Region',
        region_name: ''
    });
    const [adminError, setAdminError] = useState('');

    // Farmer Management State
    const [farmers, setFarmers] = useState([]);
    const [farmerFilter, setFarmerFilter] = useState('all');

    // Report Management State
    const [reports, setReports] = useState([]);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportForm, setReportForm] = useState({
        title: '',
        reportType: 'Misconduct',
        description: '',
        evidence: '',
        priority: 'Medium',
        reportedAdminId: ''
    });

    // Stats State
    const [stats, setStats] = useState({
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        acceptedRequests: 0,
        totalFarmers: 0,
        totalProducts: 0,
        totalAdmins: 0,
        totalReports: 0
    });

    // Product categories with subcategories
    const productCategories = {
        'Chemicals': {
            subcategories: ['Fertilizers', 'Pesticides', 'Herbicides', 'Fungicides', 'Insecticides', 'Growth Regulators'],
            units: ['kg', 'liters', 'bottles', 'sachets']
        },
        'Machinery': {
            subcategories: ['Tractors', 'Plows', 'Harvesters', 'Seeders', 'Cultivators', 'Irrigation Equipment'],
            units: ['units', 'pieces']
        },
        'Seeds': {
            subcategories: ['Cereal Seeds', 'Vegetable Seeds', 'Fruit Seeds', 'Legume Seeds', 'Cash Crop Seeds'],
            units: ['kg', 'packets', 'bags']
        },
        'Tools': {
            subcategories: ['Hand Tools', 'Cutting Tools', 'Measuring Tools', 'Safety Equipment', 'Storage Equipment'],
            units: ['pieces', 'sets', 'units']
        },
        'Livestock': {
            subcategories: ['Feed', 'Vaccines', 'Supplements', 'Equipment', 'Medicine'],
            units: ['kg', 'liters', 'bottles', 'doses']
        },
        'Organic': {
            subcategories: ['Organic Fertilizers', 'Bio-pesticides', 'Compost', 'Organic Seeds'],
            units: ['kg', 'liters', 'bags']
        }
    };

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user') || 'null');
        const userType = localStorage.getItem('userType');

        if (!token || userType !== 'Federal' || !userData) {
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
                filtered = requests.filter(req => req.federal_status === 'Pending');
                break;
            case 'approved':
                filtered = requests.filter(req => req.federal_status === 'Approved');
                break;
            case 'accepted':
                filtered = requests.filter(req => req.federal_status === 'Accepted');
                break;
            case 'rejected':
                filtered = requests.filter(req => req.federal_status === 'Rejected');
                break;
            default:
                filtered = requests;
        }
        setFilteredRequests(filtered);
    };

    const fetchDashboardData = async() => {
        try {
            const token = localStorage.getItem('token');

            // Fetch Region admins
            const adminsResponse = await fetch('http://localhost:5000/api/admins/admins', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (adminsResponse.ok) {
                const data = await adminsResponse.json();
                const regionAdmins = data.filter(item =>
                    item.type === 'admin' && item.role === 'Region'
                );
                setAdmins(regionAdmins);
                setStats(prev => ({...prev, totalAdmins: regionAdmins.length }));

                // Extract unique regions for filtering
                const uniqueRegions = [...new Set(regionAdmins.map(admin => admin.region_name))];
                setRegions(uniqueRegions);
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
            }

            // Fetch requests with detailed status
            const requestsResponse = await fetch('http://localhost:5000/api/admins/requests/status', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (requestsResponse.ok) {
                const requestsData = await requestsResponse.json();
                setRequests(requestsData);
                setFilteredRequests(requestsData);

                // Calculate stats from requests data
                const totalRequests = requestsData.length;
                const pendingRequests = requestsData.filter(req => req.federal_status === 'Pending').length;
                const approvedRequests = requestsData.filter(req => req.federal_status === 'Approved').length;
                const acceptedRequests = requestsData.filter(req => req.federal_status === 'Accepted').length;
                const rejectedRequests = requestsData.filter(req => req.federal_status === 'Rejected').length;

                setStats(prev => ({
                    ...prev,
                    totalRequests,
                    pendingRequests,
                    approvedRequests,
                    acceptedRequests,
                    rejectedRequests
                }));
            }

            // Fetch all farmers
            const farmersResponse = await fetch('http://localhost:5000/api/admins/farmers', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (farmersResponse.ok) {
                const farmersData = await farmersResponse.json();
                const allFarmers = farmersData.farmers || farmersData;
                setFarmers(allFarmers);
                setStats(prev => ({...prev, totalFarmers: allFarmers.length }));
            }

            // Fetch reports
            const reportsResponse = await fetch('http://localhost:5000/api/admins/reports', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (reportsResponse.ok) {
                const reportsData = await reportsResponse.json();
                setReports(reportsData.reports || reportsData);
                setStats(prev => ({...prev, totalReports: (reportsData.reports || reportsData).length }));
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

    // Admin Management Functions
    const handleAdminSubmit = async(e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            if (adminForm.password !== adminForm.confirmPassword) {
                setAdminError('Passwords do not match');
                return;
            }

            if (!editingAdmin && adminForm.password.length < 6) {
                setAdminError('Password must be at least 6 characters long');
                return;
            }

            const url = editingAdmin ?
                `http://localhost:5000/api/admins/edit/${editingAdmin.id}` :
                'http://localhost:5000/api/admins/register';

            const method = editingAdmin ? 'PUT' : 'POST';

            const submitData = {
                fullName: adminForm.fullName,
                phoneNumber: adminForm.phoneNumber,
                role: 'Region',
                password: adminForm.password,
                confirmPassword: adminForm.confirmPassword,
                region_name: adminForm.region_name,

            };

            if (adminForm.password) {
                submitData.password = adminForm.password;
                submitData.confirmPassword = adminForm.confirmPassword;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });

            const data = await response.json();

            if (response.ok) {
                setShowAdminForm(false);
                setEditingAdmin(null);
                setAdminForm({
                    fullName: '',
                    phoneNumber: '',
                    password: '',
                    confirmPassword: '',
                    role: 'Region',
                    region_name: ''
                });
                setAdminError('');
                fetchDashboardData();
                alert(editingAdmin ? 'Admin updated successfully' : 'Admin registered successfully');
            } else {
                setAdminError(data.message || 'Error processing admin');
            }
        } catch (error) {
            console.error('Error processing admin:', error);
            setAdminError('Server error occurred');
        }
    };


    const editAdmin = (admin) => {
        setEditingAdmin(admin);
        setAdminForm({
            fullName: admin.full_name || '',
            phoneNumber: admin.phone_number || '',
            password: '',
            confirmPassword: '',
            role: admin.role || 'Region',
            region_name: admin.region_name || ''
        });
        setShowAdminForm(true);
    };

    // Product Management Functions
    const handleProductSubmit = async(e) => {
        e.preventDefault();
        setProductError('');

        // Validate product amount and price
        if (!productForm.name || !productForm.category || !productForm.subCategory || !productForm.unit || !productForm.amount || !productForm.price || !productForm.expiryDate) {
            setProductError('Product name, category, amount, price, sub category, unit, and expiry date are required');
            return;
        }
        if (parseInt(productForm.amount) < 1) {
            setProductError('Product amount must be at least 1');
            return;
        }
        if (parseFloat(productForm.price) <= 0) {
            setProductError('Product price must be greater than 0');
            return;
        }

        try {
            const token = localStorage.getItem('token');
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
                    sub_category: productForm.subCategory,
                    amount: productForm.amount,
                    unit: productForm.unit,
                    description: productForm.description,
                    price: productForm.price,
                    manufacturer: productForm.manufacturer,
                    expiry_date: productForm.expiryDate
                })
            });

            const responseData = await response.json();

            if (response.ok) {
                setShowProductForm(false);
                setEditingProduct(null);
                setProductForm({
                    name: '',
                    category: '',
                    amount: '',
                    description: '',
                    price: '',
                    subCategory: '',
                    unit: '',
                    manufacturer: '',
                    expiryDate: ''
                });
                fetchDashboardData();
                alert(editingProduct ? 'Product updated successfully' : 'Product added successfully');
            } else {
                setProductError(responseData.message || 'Error processing product');
            }
        } catch (error) {
            console.error('Error processing product:', error);
            setProductError('Server error occurred');
        }
    };

    const handleEditProduct = (product) => {
        // Federal admin can only edit their own products
        if (product.created_by_admin_id !== user.id) {
            alert('You can only edit your own products');
            return;
        }

        setEditingProduct(product);
        setProductForm({
            name: product.name,
            category: product.category,
            subCategory: product.sub_category || '',
            amount: product.amount,
            unit: product.unit || '',
            description: product.description,
            price: product.price,
            manufacturer: product.manufacturer || '',
            expiryDate: product.expiry_date || ''
        });
        setShowProductForm(true);
    };

    const handleDeleteProduct = async(productId) => {
        // Federal admin can only delete their own products
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

    // Request Management Functions
    const updateRequestStatus = async(requestId, status, reason = '') => {
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`http://localhost:5000/api/admins/requests/${requestId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: status,
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

    const canFederalAdminAct = (request) => {
        // Federal admin can act on requests that have been approved by region and are pending at federal level
        return request.region_status === 'Approved' && request.federal_status === 'Pending';
    };

    const canDeleteRequest = (request) => {
        // Federal admin can delete rejected requests
        return request.federal_status === 'Rejected';
    };

    const handleDeleteRequest = async(requestId) => {
        if (!window.confirm('Are you sure you want to delete this rejected request?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admins/deleterequest/${requestId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchDashboardData();
                alert('Request deleted successfully');
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Error deleting request');
            }
        } catch (error) {
            console.error('Error deleting request:', error);
            alert('Error deleting request');
        }
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

    // Report Management Functions
    const handleReportSubmit = async(e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            if (!reportForm.reportedAdminId) {
                alert('Please select an admin to report');
                return;
            }

            const response = await fetch('http://localhost:5000/api/admins/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    reported_admin_id: reportForm.reportedAdminId,
                    report_type: reportForm.reportType,
                    title: reportForm.title,
                    description: reportForm.description,
                    evidence: reportForm.evidence,
                    priority: reportForm.priority
                })
            });

            if (response.ok) {
                setShowReportModal(false);
                setReportForm({
                    title: '',
                    reportType: 'Misconduct',
                    description: '',
                    evidence: '',
                    priority: 'Medium',
                    reportedAdminId: ''
                });
                fetchDashboardData();
                alert('Report submitted successfully');
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Error submitting report');
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            alert('Error submitting report');
        }
    };

    const handleUpdateReportStatus = async(reportId, status) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admins/reports/${reportId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: status,
                    resolution_notes: status === 'Resolved' ? 'Issue has been resolved' : 'Report dismissed as invalid'
                })
            });

            if (response.ok) {
                fetchDashboardData();
                alert('Report status updated successfully');
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Error updating report status');
            }
        } catch (error) {
            console.error('Error updating report status:', error);
            alert('Error updating report status');
        }
    };

    // Helper Functions
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

    // Filter admins based on region filter
    const getFilteredAdmins = () => {
        if (regionFilter === 'all') {
            return admins;
        }
        return admins.filter(admin => admin.region_name === regionFilter);
    };

    // Filter farmers based on selected filter
    const getFilteredFarmers = () => {
        if (farmerFilter === 'all') {
            return farmers;
        }
        return farmers.filter(farmer => farmer.region_name === farmerFilter);
    };

    if (!user) {
        return ( <
            div className = "flex justify-center items-center h-screen dark:bg-gray-900" >
            Loading... <
            /div>
        );
    }

    return ( <
        div className = { `flex h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}` } > { /* Sidebar */ } <
        div className = "w-64 bg-blue-800 dark:bg-gray-800 text-white" >
        <
        div className = "p-4" >
        <
        h2 className = "text-xl font-bold" > Federal Dashboard < /h2> <
        div className = "mt-4 flex items-center" >
        <
        span className = "mr-2" > Dark Mode < /span> <
        button onClick = {
            () => setDarkMode(!darkMode)
        }
        className = { `relative inline-flex h-6 w-11 items-center rounded-full ${darkMode ? 'bg-blue-600' : 'bg-gray-200'}` } >
        <
        span className = { `inline-block h-4 w-4 transform rounded-full bg-white transition ${darkMode ? 'translate-x-6' : 'translate-x-1'}` }
        /> < /
        button > <
        /div> < /
        div > <
        nav className = "mt-6" >
        <
        button className = { `w-full text-left px-4 py-2 ${activeTab === 'overview' ? 'bg-blue-700 dark:bg-gray-700' : 'hover:bg-blue-700 dark:hover:bg-gray-700'}` }
        onClick = {
            () => setActiveTab('overview')
        } > 📊Overview <
        /button> <
        button className = { `w-full text-left px-4 py-2 ${activeTab === 'requests' ? 'bg-blue-700 dark:bg-gray-700' : 'hover:bg-blue-700 dark:hover:bg-gray-700'}` }
        onClick = {
            () => setActiveTab('requests')
        } > 📋Requests <
        /button> <
        button className = { `w-full text-left px-4 py-2 ${activeTab === 'products' ? 'bg-blue-700 dark:bg-gray-700' : 'hover:bg-blue-700 dark:hover:bg-gray-700'}` }
        onClick = {
            () => setActiveTab('products')
        } > 📦Products <
        /button> <
        button className = { `w-full text-left px-4 py-2 ${activeTab === 'admins' ? 'bg-blue-700 dark:bg-gray-700' : 'hover:bg-blue-700 dark:hover:bg-gray-700'}` }
        onClick = {
            () => setActiveTab('admins')
        } > 👥Admins <
        /button> <
        button className = { `w-full text-left px-4 py-2 ${activeTab === 'farmers' ? 'bg-blue-700 dark:bg-gray-700' : 'hover:bg-blue-700 dark:hover:bg-gray-700'}` }
        onClick = {
            () => setActiveTab('farmers')
        } > 👨‍🌾Farmers <
        /button> <
        button className = { `w-full text-left px-4 py-2 ${activeTab === 'reports' ? 'bg-blue-700 dark:bg-gray-700' : 'hover:bg-blue-700 dark:hover:bg-gray-700'}` }
        onClick = {
            () => setActiveTab('reports')
        } > 🔍Reports <
        /button> < /
        nav > <
        /div>

        { /* Main Content */ } <
        div className = "flex-1 flex flex-col" >
        <
        header className = { `${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm p-4 flex justify-between items-center` } >
        <
        h1 className = "text-2xl font-semibold text-gray-900 dark:text-white" >
        Welcome, { user.fullName }(Federal Admin) <
        /h1> <
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
                h2 className = "text-2xl font-bold mb-6 text-gray-900 dark:text-white" > System Overview < /h2> <
                div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" >
                <
                div className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                h3 className = "text-2xl font-bold text-gray-900 dark:text-white" > { stats.totalRequests } < /h3> <
                p className = "text-gray-600 dark:text-gray-300" > Total Requests < /p> < /
                div > <
                div className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                h3 className = "text-2xl font-bold text-gray-900 dark:text-white" > { stats.pendingRequests } < /h3> <
                p className = "text-gray-600 dark:text-gray-300" > Pending Requests < /p> < /
                div > <
                div className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                h3 className = "text-2xl font-bold text-gray-900 dark:text-white" > { stats.approvedRequests } < /h3> <
                p className = "text-gray-600 dark:text-gray-300" > Approved Requests < /p> < /
                div > <
                div className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                h3 className = "text-2xl font-bold text-gray-900 dark:text-white" > { stats.acceptedRequests } < /h3> <
                p className = "text-gray-600 dark:text-gray-300" > Accepted Requests < /p> < /
                div > <
                div className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                h3 className = "text-2xl font-bold text-gray-900 dark:text-white" > { stats.rejectedRequests } < /h3> <
                p className = "text-gray-600 dark:text-gray-300" > Rejected Requests < /p> < /
                div > <
                div className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                h3 className = "text-2xl font-bold text-gray-900 dark:text-white" > { stats.totalProducts } < /h3> <
                p className = "text-gray-600 dark:text-gray-300" > Products < /p> < /
                div > <
                div className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                h3 className = "text-2xl font-bold text-gray-900 dark:text-white" > { stats.totalAdmins } < /h3> <
                p className = "text-gray-600 dark:text-gray-300" > Region Admins < /p> < /
                div > <
                div className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                h3 className = "text-2xl font-bold text-gray-900 dark:text-white" > { stats.totalFarmers } < /h3> <
                p className = "text-gray-600 dark:text-gray-300" > Farmers < /p> < /
                div > <
                /div>

                <
                div className = { `p-6 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                h2 className = "text-xl font-bold mb-4 text-gray-900 dark:text-white" > Quick Actions < /h2> <
                div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" >
                <
                button onClick = {
                    () => setActiveTab('requests')
                }
                className = "py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded dark:bg-blue-600 dark:hover:bg-blue-700" > 📋Manage Requests <
                /button> <
                button onClick = {
                    () => setActiveTab('admins')
                }
                className = "py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded dark:bg-green-600 dark:hover:bg-green-700" > 👥Manage Region Admins <
                /button> <
                button onClick = {
                    () => setActiveTab('products')
                }
                className = "py-3 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded dark:bg-purple-600 dark:hover:bg-purple-700" > 🛒Manage Products <
                /button> <
                button onClick = {
                    () => setShowAdminForm(true)
                }
                className = "py-3 px-4 bg-teal-500 hover:bg-teal-600 text-white rounded dark:bg-teal-600 dark:hover:bg-teal-700" > ➕Add Region Admin <
                /button> <
                button onClick = {
                    () => setShowProductForm(true)
                }
                className = "py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded dark:bg-orange-600 dark:hover:bg-orange-700" > ➕Add Product <
                /button> <
                button onClick = {
                    () => setShowReportModal(true)
                }
                className = "py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded dark:bg-red-600 dark:hover:bg-red-700" > 🔍Create Report <
                /button> < /
                div > <
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
                h2 className = "text-2xl font-bold text-gray-900 dark:text-white" > Request Management < /h2> <
                p className = "text-gray-600 dark:text-gray-300" > Manage all requests nationwide < /p> < /
                div >

                <
                div className = { `p-4 rounded shadow mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                div className = "flex items-center gap-4 mb-4" >
                <
                div >
                <
                label className = "mr-2 text-gray-700 dark:text-gray-200" > Filter by Status: < /label> <
                select value = { statusFilter }
                onChange = {
                    (e) => setStatusFilter(e.target.value)
                }
                className = { `p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` } >
                <
                option value = "all" > All Requests < /option> <
                option value = "pending" > Pending < /option> <
                option value = "approved" > Approved < /option> <
                option value = "accepted" > Accepted < /option> <
                option value = "rejected" > Rejected < /option> < /
                select > <
                /div> < /
                div > <
                /div>

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
                            h3 className = "text-lg font-semibold text-gray-900 dark:text-white" > { request.product_name } < /h3> <
                            p className = "text-gray-600 dark:text-gray-300" > Request ID: { request.id } < /p> <
                            p className = "text-gray-600 dark:text-gray-300" > Farmer: { request.farmer_name } < /p> <
                            p className = "text-gray-600 dark:text-gray-300" > Location: { request.region_name }, { request.zone_name }, { request.woreda_name }, { request.kebele_name } < /p> <
                            p className = "text-gray-600 dark:text-gray-300" > Quantity: { request.quantity } < /p> < /
                            div > <
                            div className = "text-right" >
                            <
                            div className = "mb-2" > { getStatusBadge(request.federal_status) } < /div> <
                            p className = "text-sm text-gray-500 dark:text-gray-400" >
                            Created: { new Date(request.created_at).toLocaleDateString() } <
                            /p> < /
                            div > <
                            /div>

                            <
                            div className = "grid grid-cols-1 md:grid-cols-4 gap-2 mb-4" > { getLevelStatus('kebele', request) } { getLevelStatus('woreda', request) } { getLevelStatus('zone', request) } { getLevelStatus('region', request) } <
                            /div>

                            <
                            div className = "flex justify-between items-center" >
                            <
                            div className = "flex gap-2" >
                            <
                            button onClick = {
                                () => viewRequestDetails(request.id)
                            }
                            className = "px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm dark:bg-blue-600 dark:hover:bg-blue-700" >
                            View Details <
                            /button> {
                            canDeleteRequest(request) && ( <
                                button onClick = {
                                    () => handleDeleteRequest(request.id)
                                }
                                className = "px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm dark:bg-red-600 dark:hover:bg-red-700" >
                                Delete <
                                /button>
                            )
                        } <
                        /div> {
                        canFederalAdminAct(request) && ( <
                            div className = "flex gap-2" >
                            <
                            button onClick = {
                                () => handleStatusUpdate(request, 'Approved')
                            }
                            className = "px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm dark:bg-green-600 dark:hover:bg-green-700" >
                            Approve <
                            /button> <
                            button onClick = {
                                () => handleStatusUpdate(request, 'Accepted')
                            }
                            className = "px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm dark:bg-blue-600 dark:hover:bg-blue-700" >
                            Accept <
                            /button> <
                            button onClick = {
                                () => handleStatusUpdate(request, 'Rejected')
                            }
                            className = "px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm dark:bg-red-600 dark:hover:bg-red-700" >
                            Reject <
                            /button> < /
                            div >
                        )
                    } <
                    /div> < /
                    div >
                ))
        } <
        /div>

        {
            filteredRequests.length === 0 && ( <
                div className = { `p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded shadow` } >
                <
                p className = "text-gray-500 dark:text-gray-400" > No requests found < /p> < /
                div >
            )
        } <
        /div>
    )
}

{ /* Products Tab */ } {
    activeTab === 'products' && ( <
        div >
        <
        div className = "mb-6" >
        <
        h2 className = "text-2xl font-bold text-gray-900 dark:text-white" > Product Management < /h2> <
        p className = "text-gray-600 dark:text-gray-300" > Manage products across all regions < /p> < /
        div >

        <
        div className = { `p-4 rounded shadow mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
        <
        div className = "flex justify-between items-center mb-4" >
        <
        div className = "flex items-center gap-4" >
        <
        div >
        <
        label className = "mr-2 text-gray-700 dark:text-gray-200" > Filter: < /label> <
        select value = { productFilter }
        onChange = {
            (e) => setProductFilter(e.target.value)
        }
        className = { `p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` } >
        <
        option value = "all" > All Products < /option> <
        option value = "own" > My Products < /option> <
        option value = "others" > Other Admins ' Products</option> < /
        select > <
        /div> < /
        div > <
        button onClick = {
            () => setShowProductForm(true)
        }
        className = "bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded dark:bg-green-600 dark:hover:bg-green-700" >
        Add Product <
        /button> < /
        div > <
        /div>

        <
        div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" > {
            getFilteredProducts().map((product) => ( <
                    div key = { product.id }
                    className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                    <
                    div className = "flex justify-between items-start mb-2" >
                    <
                    h3 className = "text-lg font-semibold text-gray-900 dark:text-white" > { product.name } < /h3> <
                    span className = { `px-2 py-1 rounded text-xs ${product.created_by_admin_id === user.id ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}` } > { product.created_by_admin_id === user.id ? 'Owned' : 'Other' } <
                    /span> < /
                    div > <
                    p className = "text-gray-600 dark:text-gray-300 mb-2" > Category: { product.category } < /p> <
                    p className = "text-gray-600 dark:text-gray-300 mb-2" > Sub Category: { product.sub_category } < /p> <
                    p className = "text-gray-600 dark:text-gray-300 mb-2" > Amount: { product.amount } { product.unit } < /p> <
                    p className = "text-gray-600 dark:text-gray-300 mb-2" > Price: Birr { product.price } < /p> {
                    product.description && ( <
                        p className = "text-gray-600 dark:text-gray-300 mb-2" > Description: { product.description } < /p>
                    )
                } {
                    product.manufacturer && ( <
                        p className = "text-gray-600 dark:text-gray-300 mb-2" > Manufacturer: { product.manufacturer } < /p>
                    )
                } {
                    product.expiry_date && ( <
                        p className = "text-gray-600 dark:text-gray-300 mb-2" >
                        Expiry: { new Date(product.expiry_date).toLocaleDateString() } <
                        /p>
                    )
                } <
                div className = "flex justify-between items-center mt-4" >
                <
                span className = "text-sm text-gray-500 dark:text-gray-400" >
                Added: { new Date(product.created_at).toLocaleDateString() } <
                /span> {
                product.created_by_admin_id === user.id && ( <
                    div className = "flex gap-2" >
                    <
                    button onClick = {
                        () => handleEditProduct(product)
                    }
                    className = "px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm dark:bg-blue-600 dark:hover:bg-blue-700" >
                    Edit <
                    /button> <
                    button onClick = {
                        () => handleDeleteProduct(product.id)
                    }
                    className = "px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm dark:bg-red-600 dark:hover:bg-red-700" >
                    Delete <
                    /button> < /
                    div >
                )
            } <
            /div> < /
            div >
        ))
} <
/div>

{
    getFilteredProducts().length === 0 && ( <
        div className = { `p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded shadow` } >
        <
        p className = "text-gray-500 dark:text-gray-400" > No products found < /p> < /
        div >
    )
} <
/div>
)
}

{ /* Admins Tab */ } {
    activeTab === 'admins' && ( <
            div >
            <
            div className = "mb-6" >
            <
            h2 className = "text-2xl font-bold text-gray-900 dark:text-white" > Region Admin Management < /h2> <
            p className = "text-gray-600 dark:text-gray-300" > Manage all region administrators < /p> < /
            div >

            <
            div className = { `p-4 rounded shadow mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
            <
            div className = "flex justify-between items-center mb-4" >
            <
            div className = "flex items-center gap-4" >
            <
            div >
            <
            label className = "mr-2 text-gray-700 dark:text-gray-200" > Filter by Region: < /label> <
            select value = { regionFilter }
            onChange = {
                (e) => setRegionFilter(e.target.value)
            }
            className = { `p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` } >
            <
            option value = "all" > All Regions < /option> {
            regions.map((region) => ( <
                option key = { region }
                value = { region } > { region } < /option>
            ))
        } <
        /select> < /
    div > <
        /div> <
    button onClick = {
        () => setShowAdminForm(true)
    }
    className = "bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded dark:bg-green-600 dark:hover:bg-green-700" >
        Add Region Admin <
        /button> < /
    div > <
        /div>

    <
    div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" > {
            getFilteredAdmins().map((admin) => ( <
                div key = { admin.id }
                className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                h3 className = "text-lg font-semibold text-gray-900 dark:text-white" > { admin.full_name } < /h3> <
                p className = "text-gray-600 dark:text-gray-300" > Phone: { admin.phone_number } < /p> <
                p className = "text-gray-600 dark:text-gray-300" > Phone: { admin.password } < /p> <
                p className = "text-gray-600 dark:text-gray-300" > Phone: { admin.confirmPassword } < /p> <


                p className = "text-gray-600 dark:text-gray-300" > Region: { admin.region_name } < /p> <
                p className = "text-gray-600 dark:text-gray-300" > Role: { admin.role } < /p> <
                div className = "flex justify-between items-center mt-4" >
                <
                span className = "text-sm text-gray-500 dark:text-gray-400" >
                Created: { new Date(admin.created_at).toLocaleDateString() } <
                /span> <
                div className = "flex gap-2" >
                <
                button onClick = {
                    () => editAdmin(admin)
                }
                className = "px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm dark:bg-blue-600 dark:hover:bg-blue-700" >
                Edit <
                /button> < /
                div > <
                /div> < /
                div >
            ))
        } <
        /div>

    {
        getFilteredAdmins().length === 0 && ( <
            div className = { `p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded shadow` } >
            <
            p className = "text-gray-500 dark:text-gray-400" > No region admins found < /p> < /
            div >
        )
    } <
    /div>
)
}

{ /* Farmers Tab */ } {
    activeTab === 'farmers' && ( <
            div >
            <
            div className = "mb-6" >
            <
            h2 className = "text-2xl font-bold text-gray-900 dark:text-white" > Farmer Management < /h2> <
            p className = "text-gray-600 dark:text-gray-300" > View all farmers across the country < /p> < /
            div >

            <
            div className = { `p-4 rounded shadow mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
            <
            div className = "flex items-center gap-4" >
            <
            div >
            <
            label className = "mr-2 text-gray-700 dark:text-gray-200" > Filter by Region: < /label> <
            select value = { farmerFilter }
            onChange = {
                (e) => setFarmerFilter(e.target.value)
            }
            className = { `p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` } >
            <
            option value = "all" > All Regions < /option> {
            regions.map((region) => ( <
                option key = { region }
                value = { region } > { region } < /option>
            ))
        } <
        /select> < /
    div > <
        /div> < /
    div >

        <
        div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" > {
            getFilteredFarmers().map((farmer) => ( <
                    div key = { farmer.id }
                    className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                    <
                    div className = "mb-4" >
                    <
                    h3 className = "text-lg font-semibold text-gray-900 dark:text-white mb-3" > { farmer.full_name } < /h3> <
                    div className = "grid grid-cols-1 gap-1 mb-4 text-gray-600 dark:text-gray-300" >
                    <
                    p > 📞Phone: { farmer.phone_number } < /p> <
                    p > 📍Kebele: { farmer.kebele_name || 'N/A' } < /p> <
                    p > 🌍Region: { farmer.region_name || 'N/A' } < /p> <
                    p > 🗺️Zone: { farmer.zone_name || 'N/A' } < /p> <
                    p > 🏘️Woreda: { farmer.woreda_name || 'N/A' } < /p> <
                    p > 🌦️Crop Season: { farmer.crops_season || 'N/A' } < /p> <
                    p > 🌾Land Size: { farmer.land_size_hectares || 'N/A' }
                    hectares < /p> <
                    p > 🌱Crop Types: { farmer.crop_types || 'N/A' } < /p> <
                    p > 🏞️Land Type: { farmer.land_type || 'N/A' } < /p> <
                    p > 📈Farming Experience: { farmer.farming_experience || 'N/A' }
                    years < /p> <
                    p > 💧Irrigation Type: { farmer.irrigation_type || 'N/A' } < /p> <
                    p > 🚜Farming Method: { farmer.farming_method || 'N/A' } < /p> <
                    p > 🌾Primary Crops: { farmer.primary_crops || 'N/A' } < /p> <
                    p > 🌿Secondary Crops: { farmer.secondary_crops || 'N/A' } < /p> <
                    p > 🏔️Soil Type: { farmer.soil_type || 'N/A' } < /p> <
                    p > 🐄Has Livestock: { farmer.has_livestock ? 'Yes' : 'No' } < /p> {
                    farmer.has_livestock && ( <
                        p > 🐄Livestock Types: { farmer.livestock_types || 'N/A' } < /p>
                    )
                } <
                p > 💰Annual Income: { farmer.annual_income ? `$${farmer.annual_income}` : 'N/A' } < /p> <
                p > 🎓Education Level: { farmer.education_level || 'N/A' } < /p> <
                p > 📅Registered: { new Date(farmer.created_at).toLocaleDateString() } < /p> < /
                div > <
                /div> < /
                div >
            ))
} <
/div>

{
    getFilteredFarmers().length === 0 && ( <
        div className = { `p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded shadow` } >
        <
        p className = "text-gray-500 dark:text-gray-400" > No farmers found < /p> < /
        div >
    )
} <
/div>
)
}

{ /* Reports Tab */ } {
    activeTab === 'reports' && ( <
            div >
            <
            div className = "mb-6" >
            <
            h2 className = "text-2xl font-bold text-gray-900 dark:text-white" > Report Management < /h2> <
            p className = "text-gray-600 dark:text-gray-300" > Manage reports and misconduct cases < /p> < /
            div >

            <
            div className = "mb-6" >
            <
            button onClick = {
                () => setShowReportModal(true)
            }
            className = "bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded dark:bg-green-600 dark:hover:bg-green-700" >
            Create Report <
            /button> < /
            div >

            <
            div className = "grid grid-cols-1 gap-4" > {
                reports.map((report) => ( <
                        div key = { report.id }
                        className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                        <
                        div className = "flex justify-between items-start mb-4" >
                        <
                        div >
                        <
                        h3 className = "text-lg font-semibold text-gray-900 dark:text-white" > { report.title } < /h3> <
                        p className = "text-gray-600 dark:text-gray-300" > Type: { report.report_type } < /p> <
                        p className = "text-gray-600 dark:text-gray-300" > Priority: { report.priority } < /p> <
                        p className = "text-gray-600 dark:text-gray-300" > Reported Admin: { report.reported_admin_name } < /p> <
                        p className = "text-gray-600 dark:text-gray-300" > Description: { report.description } < /p> {
                        report.evidence && ( <
                            p className = "text-gray-600 dark:text-gray-300" > Evidence: { report.evidence } < /p>
                        )
                    } <
                    /div> <
                    div className = "text-right" >
                    <
                    div className = "mb-2" >
                    <
                    span className = { `px-2 py-1 rounded text-xs ${report.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                report.status === 'Resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                }` } > { report.status } <
                    /span> < /
                    div > <
                    p className = "text-sm text-gray-500 dark:text-gray-400" >
                    Created: { new Date(report.created_at).toLocaleDateString() } <
                    /p> < /
                    div > <
                    /div>

                    {
                        report.resolution_notes && ( <
                            div className = "mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded" >
                            <
                            h4 className = "font-semibold dark:text-white" > Resolution Notes < /h4> <
                            p className = "dark:text-gray-300" > { report.resolution_notes } < /p> < /
                            div >
                        )
                    }

                    <
                    div className = "flex justify-end gap-2" > {
                        report.status === 'Pending' && ( <
                            >
                            <
                            button onClick = {
                                () => handleUpdateReportStatus(report.id, 'Resolved')
                            }
                            className = "px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm dark:bg-green-600 dark:hover:bg-green-700" >
                            Mark Resolved <
                            /button> <
                            button onClick = {
                                () => handleUpdateReportStatus(report.id, 'Dismissed')
                            }
                            className = "px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm dark:bg-red-600 dark:hover:bg-red-700" >
                            Dismiss <
                            /button> < / >
                        )
                    } <
                    /div> < /
                    div >
                ))
        } <
        /div>

    {
        reports.length === 0 && ( <
            div className = { `p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded shadow` } >
            <
            p className = "text-gray-500 dark:text-gray-400" > No reports found < /p> < /
            div >
        )
    } <
    /div>
)
} <
/main> < /
div >

    { /* Product Form Modal */ } {
        showProductForm && ( <
                div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto" >
                <
                div className = { `w-full max-w-md rounded shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} my-8` } >
                <
                div className = "max-h-[80vh] overflow-y-auto" >
                <
                h2 className = "text-xl font-bold mb-4 text-gray-900 dark:text-white" > { editingProduct ? 'Edit Product' : 'Add New Product' } <
                /h2> <
                form onSubmit = { handleProductSubmit } >
                <
                div className = "mb-4" >
                <
                label className = "block text-gray-700 dark:text-gray-200 mb-2" > Product Name < /label> <
                input type = "text"
                value = { productForm.name }
                onChange = {
                    (e) => setProductForm({...productForm, name: e.target.value })
                }
                className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
                required /
                >
                <
                /div> <
                div className = "mb-4" >
                <
                label className = "block text-gray-700 dark:text-gray-200 mb-2" > Category < /label> <
                select value = { productForm.category }
                onChange = {
                    (e) => setProductForm({
                        ...productForm,
                        category: e.target.value,
                        subCategory: '',
                        unit: ''
                    })
                }
                className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
                required >
                <
                option value = "" > Select Category < /option> {
                Object.keys(productCategories).map(category => ( <
                    option key = { category }
                    value = { category } > { category } < /option>
                ))
            } <
            /select> < /
        div > {
                productForm.category && ( <
                    >
                    <
                    div className = "mb-4" >
                    <
                    label className = "block text-gray-700 dark:text-gray-200 mb-2" > Sub Category < /label> <
                    select value = { productForm.subCategory }
                    onChange = {
                        (e) => setProductForm({...productForm, subCategory: e.target.value })
                    }
                    className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
                    required >
                    <
                    option value = "" > Select Sub Category < /option> {
                    productCategories[productForm.category].subcategories.map(sub => ( <
                        option key = { sub }
                        value = { sub } > { sub } < /option>
                    ))
                } <
                /select> < /
                div > <
                div className = "mb-4" >
                <
                label className = "block text-gray-700 dark:text-gray-200 mb-2" > Unit < /label> <
                select value = { productForm.unit }
                onChange = {
                    (e) => setProductForm({...productForm, unit: e.target.value })
                }
                className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
                required >
                <
                option value = "" > Select Unit < /option> {
                productCategories[productForm.category].units.map(unit => ( <
                    option key = { unit }
                    value = { unit } > { unit } < /option>
                ))
            } <
            /select> < /
        div > <
            />
    )
} <
div className = "mb-4" >
    <
    label className = "block text-gray-700 dark:text-gray-200 mb-2" > Amount < /label> <
input type = "number"
value = { productForm.amount }
onChange = {
    (e) => setProductForm({...productForm, amount: e.target.value })
}
className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
min = "1"
required /
    >
    <
    /div> <
div className = "mb-4" >
    <
    label className = "block text-gray-700 dark:text-gray-200 mb-2" > Price(Birr) < /label> <
input type = "number"
step = "0.01"
value = { productForm.price }
onChange = {
    (e) => setProductForm({...productForm, price: e.target.value })
}
className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
min = "0.01"
required /
    >
    <
    /div> <
div className = "mb-4" >
    <
    label className = "block text-gray-700 dark:text-gray-200 mb-2" > Manufacturer < /label> <
input type = "text"
value = { productForm.manufacturer }
onChange = {
    (e) => setProductForm({...productForm, manufacturer: e.target.value })
}
className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
/> < /
div > <
    div className = "mb-4" >
    <
    label className = "block text-gray-700 dark:text-gray-200 mb-2" > Expiry Date < /label> <
input type = "date"
value = { productForm.expiryDate }
onChange = {
    (e) => setProductForm({...productForm, expiryDate: e.target.value })
}
className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
required /
    >
    <
    /div> <
div className = "mb-4" >
    <
    label className = "block text-gray-700 dark:text-gray-200 mb-2" > Description < /label> <
textarea value = { productForm.description }
onChange = {
    (e) => setProductForm({...productForm, description: e.target.value })
}
className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
rows = "3" /
    >
    <
    /div> {
productError && ( <
    div className = "mb-4 p-2 bg-red-100 text-red-700 rounded dark:bg-red-900 dark:text-red-300" > { productError } <
    /div>
)
} <
div className = "flex justify-end gap-2" >
    <
    button type = "button"
onClick = {
    () => {
        setShowProductForm(false);
        setEditingProduct(null);
        setProductForm({
            name: '',
            category: '',
            amount: '',
            description: '',
            price: '',
            subCategory: '',
            unit: '',
            manufacturer: '',
            expiryDate: ''
        });
        setProductError('');
    }
}
className = "px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded dark:bg-gray-600 dark:hover:bg-gray-700" >
    Cancel <
    /button> <
button type = "submit"
className = "px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded dark:bg-blue-600 dark:hover:bg-blue-700" > { editingProduct ? 'Update Product' : 'Add Product' } <
    /button> < /
div > <
    /form> < /
div >
    <
    /div> < /
div >
)
}

{ /* Admin Form Modal */ } {
    showAdminForm && ( <
        div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
        <
        div className = { `w-full max-w-md p-6 rounded shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
        <
        h2 className = "text-xl font-bold mb-4 text-gray-900 dark:text-white" > { editingAdmin ? 'Edit Region Admin' : 'Add Region Admin' } <
        /h2> <
        form onSubmit = { handleAdminSubmit } >
        <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-200 mb-2" > Full Name < /label> <
        input type = "text"
        value = { adminForm.fullName }
        onChange = {
            (e) => setAdminForm({...adminForm, fullName: e.target.value })
        }
        className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
        required /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-200 mb-2" > Phone Number < /label> <
        input type = "tel"
        value = { adminForm.phoneNumber }
        onChange = {
            (e) => setAdminForm({...adminForm, phoneNumber: e.target.value })
        }
        className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
        required /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-200 mb-2" > Region < /label> <
        input type = "text"
        value = { adminForm.region_name }
        onChange = {
            (e) => setAdminForm({...adminForm, region_name: e.target.value })
        }
        className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
        placeholder = "Enter region name"
        required /
        >
        <
        /div> {!editingAdmin && ( < >  <
        div >
        <
        label className = "block mb-1 text-gray-700 dark:text-gray-300" >
        Password {!editingAdmin && '*' } <
        /label> <
        input type = "password"
        required = {!editingAdmin }
        value = { adminForm.password }
        onChange = {
            (e) => setAdminForm({...adminForm, password: e.target.value })
        }
        className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` }
        /> < /
        div > <
        div >
        <
        label className = "block mb-1 text-gray-700 dark:text-gray-300" >
        Confirm Password {!editingAdmin && '*' } <
        /label> <
        input type = "password"
        required = {!editingAdmin }
        value = { adminForm.confirmPassword }
        onChange = {
            (e) => setAdminForm({...adminForm, confirmPassword: e.target.value })
        }
        className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
        /> < /
        div > < />
    )
} {
    adminError && ( <
        div className = "mb-4 p-2 bg-red-100 text-red-700 rounded dark:bg-red-900 dark:text-red-300" > { adminError } <
        /div>
    )
} <
div className = "flex justify-end gap-2" >
    <
    button type = "button"
onClick = {
    () => {
        setShowAdminForm(false);
        setEditingAdmin(null);
        setAdminForm({
            fullName: '',
            phoneNumber: '',
            password: '',
            confirmPassword: '',
            role: 'Region',
            region_name: ''
        });
        setAdminError('');
    }
}
className = "px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded dark:bg-gray-600 dark:hover:bg-gray-700" >
    Cancel <
    /button> <
button type = "submit"
className = "px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded dark:bg-blue-600 dark:hover:bg-blue-700" > { editingAdmin ? 'Update Admin' : 'Add Admin' } <
    /button> < /
div > <
    /form> < /
div > <
    /div>
)
}

{ /* Request Status Modal */ } {
    showRequestModal && ( <
            div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
            <
            div className = { `w-full max-w-2xl p-6 rounded shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
            <
            h2 className = "text-xl font-bold mb-4 text-gray-900 dark:text-white" > { selectedRequest && selectedRequest.id ? 'Request Details' : 'Update Request Status' } <
            /h2> {
            selectedRequest && ( <
                div className = "mb-4" >
                <
                h3 className = "text-lg font-semibold text-gray-900 dark:text-white" > { selectedRequest.product_name } < /h3> <
                p className = "text-gray-600 dark:text-gray-300" > Farmer: { selectedRequest.farmer_name } < /p> <
                p className = "text-gray-600 dark:text-gray-300" > Quantity: { selectedRequest.quantity } < /p> <
                div className = "grid grid-cols-1 md:grid-cols-4 gap-2 mt-4" > { getLevelStatus('kebele', selectedRequest) } { getLevelStatus('woreda', selectedRequest) } { getLevelStatus('zone', selectedRequest) } { getLevelStatus('region', selectedRequest) } <
                /div> < /
                div >
            )
        } {
            requestStatus && ( <
                div className = "mb-4" >
                <
                label className = "block text-gray-700 dark:text-gray-200 mb-2" > Decision Reason(Optional) < /label> <
                textarea value = { decisionReason }
                onChange = {
                    (e) => setDecisionReason(e.target.value)
                }
                className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
                rows = "3"
                placeholder = "Enter reason for your decision..." /
                >
                <
                /div>
            )
        } <
        div className = "flex justify-end gap-2" >
        <
        button onClick = {
            () => {
                setShowRequestModal(false);
                setSelectedRequest(null);
                setRequestStatus('');
                setDecisionReason('');
            }
        }
    className = "px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded dark:bg-gray-600 dark:hover:bg-gray-700" >
        Close <
        /button> {
    requestStatus && ( <
        button onClick = { confirmStatusUpdate }
        className = "px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded dark:bg-blue-600 dark:hover:bg-blue-700" >
        Confirm { requestStatus } <
        /button>
    )
} <
/div> < /
div > <
    /div>
)
}

{ /* Report Modal */ } {
    showReportModal && ( <
            div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
            <
            div className = { `w-full max-w-md p-6 rounded shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
            <
            h2 className = "text-xl font-bold mb-4 text-gray-900 dark:text-white" > Create Report < /h2> <
            form onSubmit = { handleReportSubmit } >
            <
            div className = "mb-4" >
            <
            label className = "block text-gray-700 dark:text-gray-200 mb-2" > Report Title < /label> <
            input type = "text"
            value = { reportForm.title }
            onChange = {
                (e) => setReportForm({...reportForm, title: e.target.value })
            }
            className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
            required /
            >
            <
            /div> <
            div className = "mb-4" >
            <
            label className = "block text-gray-700 dark:text-gray-200 mb-2" > Report Type < /label> <
            select value = { reportForm.reportType }
            onChange = {
                (e) => setReportForm({...reportForm, reportType: e.target.value })
            }
            className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` } >
            <
            option value = "Misconduct" > Misconduct < /option> <
            option value = "Performance" > Performance Issue < /option> <
            option value = "Corruption" > Corruption < /option> <
            option value = "Other" > Other < /option> < /
            select > <
            /div> <
            div className = "mb-4" >
            <
            label className = "block text-gray-700 dark:text-gray-200 mb-2" > Reported Admin < /label> <
            select value = { reportForm.reportedAdminId }
            onChange = {
                (e) => setReportForm({...reportForm, reportedAdminId: e.target.value })
            }
            className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
            required >
            <
            option value = "" > Select Admin < /option> {
            admins.map(admin => ( <
                option key = { admin.id }
                value = { admin.id } > { admin.full_name }({ admin.region_name }) <
                /option>
            ))
        } <
        /select> < /
    div > <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-200 mb-2" > Priority < /label> <
    select value = { reportForm.priority }
    onChange = {
        (e) => setReportForm({...reportForm, priority: e.target.value })
    }
    className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` } >
        <
        option value = "Low" > Low < /option> <
    option value = "Medium" > Medium < /option> <
    option value = "High" > High < /option> <
    option value = "Critical" > Critical < /option> < /
    select > <
        /div> <
    div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-200 mb-2" > Description < /label> <
    textarea value = { reportForm.description }
    onChange = {
        (e) => setReportForm({...reportForm, description: e.target.value })
    }
    className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
    rows = "3"
    required /
        >
        <
        /div> <
    div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-200 mb-2" > Evidence(Optional) < /label> <
    input type = "text"
    value = { reportForm.evidence }
    onChange = {
        (e) => setReportForm({...reportForm, evidence: e.target.value })
    }
    className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
    placeholder = "Links, references, etc." /
        >
        <
        /div> <
    div className = "flex justify-end gap-2" >
        <
        button type = "button"
    onClick = {
        () => {
            setShowReportModal(false);
            setReportForm({
                title: '',
                reportType: 'Misconduct',
                description: '',
                evidence: '',
                priority: 'Medium',
                reportedAdminId: ''
            });
        }
    }
    className = "px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded dark:bg-gray-600 dark:hover:bg-gray-700" >
        Cancel <
        /button> <
    button type = "submit"
    className = "px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded dark:bg-blue-600 dark:hover:bg-blue-700" >
        Submit Report <
        /button> < /
    div > <
        /form> < /
    div > <
        /div>
)
} <
/div>
);
};

export default FederalDashboard;