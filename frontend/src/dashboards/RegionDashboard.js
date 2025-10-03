// File: RegionDashboard.js - Enhanced with full approval workflow functionality
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RegionDashboard = () => {
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
        confirmPassword: '',
        landSizeHectares: '',
        cropTypes: '',
        landType: '',
        farmingExperience: '',
        irrigationType: '',
        farmingMethod: '',
        primaryCrops: '',
        secondaryCrops: '',
        soilType: '',
        hasLivestock: false,
        livestockTypes: '',
        annualIncome: '',
        educationLevel: ''
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
        price: '',
        subCategory: '',
        unit: '',
        manufacturer: '',
        expiryDate: ''
    });

    // Request Management State - Enhanced with approval workflow
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
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [adminForm, setAdminForm] = useState({
        fullName: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        zoneName: ''
    });

    // Report Management State
    const [reports, setReports] = useState([]);
    const [showReportModal, setShowReportModal] = useState(false);
    const [editingReport, setEditingReport] = useState(null);
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

        if (!token || userType !== 'Region' || !userData) {
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
                filtered = requests.filter(req => req.region_status === 'Pending');
                break;
            case 'approved':
                filtered = requests.filter(req => req.region_status === 'Approved');
                break;
            case 'accepted':
                filtered = requests.filter(req => req.region_status === 'Accepted');
                break;
            case 'rejected':
                filtered = requests.filter(req => req.region_status === 'Rejected');
                break;
            default:
                filtered = requests;
        }
        setFilteredRequests(filtered);
    };

    const fetchDashboardData = async() => {
        try {
            const token = localStorage.getItem('token');

            // Fetch Zone admins in scope
            const adminsResponse = await fetch('http://localhost:5000/api/admins/admins', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (adminsResponse.ok) {
                const data = await adminsResponse.json();
                const zoneAdmins = data.filter(item =>
                    item.type === 'admin' &&
                    item.role === 'Zone' &&
                    item.region_name === user.region_name
                );
                setAdmins(zoneAdmins);
                setStats(prev => ({...prev, totalAdmins: zoneAdmins.length }));
                console.log('Zone admins data:', zoneAdmins);
            } else {
                console.error('Failed to fetch admins:', await adminsResponse.text());
            }

            // Fetch farmers in scope
            const farmersResponse = await fetch('http://localhost:5000/api/admins/farmers', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (farmersResponse.ok) {
                const data = await farmersResponse.json();
                const regionFarmers = data.farmers ?
                    data.farmers.filter(farmer => farmer.region_name === user.region_name) :
                    data.filter(farmer => farmer.region_name === user.region_name);
                setFarmers(regionFarmers);
                setStats(prev => ({...prev, totalFarmers: regionFarmers.length }));
                console.log('Farmers data:', regionFarmers);
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
                console.log('Products data:', productsData);
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
                console.log('My products data:', myProductsData);
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
                console.log('Other products data:', otherProductsData);
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
                console.log('All requests data:', requestsData);

                // Filter requests to only show those from farmers in the same region
                const regionRequests = requestsData.filter(req =>
                    req.region_name === user.region_name
                );
                console.log('User region_name:', user.region_name);
                console.log('User data:', user);
                setRequests(regionRequests);
                setFilteredRequests(regionRequests);
                console.log('Region requests:', regionRequests);

                // Calculate stats from requests data
                const totalRequests = regionRequests.length;
                const pendingRequests = regionRequests.filter(req => req.region_status === 'Pending').length;
                const approvedRequests = regionRequests.filter(req => req.region_status === 'Approved').length;
                const acceptedRequests = regionRequests.filter(req => req.region_status === 'Accepted').length;
                const rejectedRequests = regionRequests.filter(req => req.region_status === 'Rejected').length;

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
                console.log('Reports data:', reportsData);
            } else {
                console.error('Failed to fetch reports:', await reportsResponse.text());
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
                alert('Passwords do not match');
                return;
            }

            const url = editingAdmin ?
                `http://localhost:5000/api/admins/edit/${editingAdmin.id}` :
                'http://localhost:5000/api/admins/register';

            const method = editingAdmin ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName: adminForm.fullName,
                    phoneNumber: adminForm.phoneNumber,
                    password: adminForm.password,
                    confirmPassword: adminForm.confirmPassword,
                    role: 'Zone',
                    region_name: user.region_name,
                    zone_name: adminForm.zoneName
                })
            });

            if (response.ok) {
                setShowAdminModal(false);
                setEditingAdmin(null);
                resetAdminForm();
                fetchDashboardData();
                alert(editingAdmin ? 'Zone admin updated successfully' : 'Zone admin created successfully');
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Error processing admin');
            }
        } catch (error) {
            console.error('Error processing admin:', error);
            alert('Error processing admin');
        }
    };

    const resetAdminForm = () => {
        setAdminForm({
            fullName: '',
            phoneNumber: '',
            password: '',
            confirmPassword: '',
            zoneName: ''
        });
    };

    const handleEditAdmin = (admin) => {
        setEditingAdmin(admin);
        setAdminForm({
            fullName: admin.full_name,
            phoneNumber: admin.phone_number,
            password: '',
            confirmPassword: '',
            zoneName: admin.zone_name || ''
        });
        setShowAdminModal(true);
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

            // Validate required fields
            if (!productForm.subCategory || !productForm.expiryDate) {
                alert('Sub category and expiry date are required');
                return;
            }

            const url = editingProduct ?
                `http://localhost:5000/api/admins/editproduct/${editingProduct.id}` :
                'http://localhost:5000/api/admins/addproduct';

            const method = editingProduct ? 'PUT' : 'POST';

            console.log('Submitting product:', {
                name: productForm.name,
                category: productForm.category,
                sub_category: productForm.subCategory,
                amount: productForm.amount,
                unit: productForm.unit,
                description: productForm.description,
                price: productForm.price,
                manufacturer: productForm.manufacturer,
                expiry_date: productForm.expiryDate
            });

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
            console.log('Server response:', responseData);

            if (response.ok) {
                setShowProductModal(false);
                setEditingProduct(null);
                resetProductForm();
                fetchDashboardData();
                alert(editingProduct ? 'Product updated successfully' : 'Product added successfully');
            } else {
                alert(responseData.message || 'Error processing product');
            }
        } catch (error) {
            console.error('Error processing product:', error);
            alert('Error processing product');
        }
    };

    const resetProductForm = () => {
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
            subCategory: product.sub_category || '',
            amount: product.amount,
            unit: product.unit || '',
            description: product.description,
            price: product.price,
            manufacturer: product.manufacturer || '',
            expiryDate: product.expiry_date || ''
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

    // Request Management Functions - Enhanced with approval workflow
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
        const pendingRequests = filteredRequests.filter(r => r.region_status === 'Pending');
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
            'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            'Approved': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            'Accepted': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        };

        return ( <
            span className = { `px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || ''}` } > { status } <
            /span>
        );
    };

    // Add helper function to check if Region admin can act on request
    const canRegionAdminAct = (request) => {
        // Region admin can only act on requests that have been approved by zone and are pending at region level
        return request.zone_status === 'Approved' && request.region_status === 'Pending';
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
            h4 className = "font-semibold text-gray-900 dark:text-white" > { formatLevel }
            Level < /h4> <
            p className = "text-gray-700 dark:text-gray-300" > < strong > Status: < /strong> {status || 'Pending'}</p > { admin && < p className = "text-gray-700 dark:text-gray-300" > < strong > Admin: < /strong> {admin}</p > } { feedback && < p className = "text-gray-700 dark:text-gray-300" > < strong > Feedback: < /strong> {feedback}</p > } { date && < p className = "text-gray-700 dark:text-gray-300" > < strong > Date: < /strong> {new Date(date).toLocaleString()}</p > } <
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
                setEditingReport(null);
                resetReportForm();
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

    const resetReportForm = () => {
        setReportForm({
            title: '',
            reportType: 'Misconduct',
            description: '',
            evidence: '',
            priority: 'Medium',
            reportedAdminId: ''
        });
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
        return <div className = "flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white" > Loading... < /div>;
    }

    return ( <
        div className = { `flex min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}` } > { /* Sidebar */ } <
        div className = { `w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg p-4 flex flex-col` } >
        <
        h2 className = "text-xl font-bold mb-6 text-gray-900 dark:text-white" > Region Dashboard < /h2> <
        nav className = "flex-1" >
        <
        button className = { `w-full text-left py-2 px-4 rounded mb-2 ${activeTab === 'overview'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }` }
        onClick = {
            () => setActiveTab('overview')
        } > 📊Overview <
        /button> <
        button className = { `w-full text-left py-2 px-4 rounded mb-2 ${activeTab === 'admins'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }` }
        onClick = {
            () => setActiveTab('admins')
        } > 👤Zone Admins <
        /button> <
        button className = { `w-full text-left py-2 px-4 rounded mb-2 ${activeTab === 'farmers'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }` }
        onClick = {
            () => setActiveTab('farmers')
        } > 👨‍🌾Farmers <
        /button> <
        button className = { `w-full text-left py-2 px-4 rounded mb-2 ${activeTab === 'products'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }` }
        onClick = {
            () => setActiveTab('products')
        } > 🛒Products <
        /button> <
        button className = { `w-full text-left py-2 px-4 rounded mb-2 ${activeTab === 'requests'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }` }
        onClick = {
            () => setActiveTab('requests')
        } > 📋Requests <
        /button> <
        button className = { `w-full text-left py-2 px-4 rounded mb-2 ${activeTab === 'reports'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }` }
        onClick = {
            () => setActiveTab('reports')
        } > 🔍Reports <
        /button> < /
        nav > <
        div className = "mt-auto" >
        <
        button className = "w-full py-2 px-4 rounded mb-2 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
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
        h1 className = "text-2xl font-semibold text-gray-900 dark:text-white" >
        Welcome, { user.fullName }(Region Admin) <
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
                h3 className = "text-2xl font-bold text-gray-900 dark:text-white" > { stats.totalFarmers } < /h3> <
                p className = "text-gray-600 dark:text-gray-300" > Farmers < /p> < /
                div > <
                div className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                h3 className = "text-2xl font-bold text-gray-900 dark:text-white" > { stats.totalProducts } < /h3> <
                p className = "text-gray-600 dark:text-gray-300" > Products < /p> < /
                div > <
                div className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                h3 className = "text-2xl font-bold text-gray-900 dark:text-white" > { stats.totalAdmins } < /h3> <
                p className = "text-gray-600 dark:text-gray-300" > Zone Admins < /p> < /
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
                className = "py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded dark:bg-green-600 dark:hover:bg-green-700" > 👤Manage Zone Admins <
                /button> <
                button onClick = {
                    () => setActiveTab('products')
                }
                className = "py-3 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded dark:bg-purple-600 dark:hover:bg-purple-700" > 🛒Manage Products <
                /button> <
                button onClick = {
                    () => setShowAdminModal(true)
                }
                className = "py-3 px-4 bg-teal-500 hover:bg-teal-600 text-white rounded dark:bg-teal-600 dark:hover:bg-teal-700" > ➕Add Zone Admin <
                /button> <
                button onClick = {
                    () => setShowProductModal(true)
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

        { /* Zone Admins Tab */ } {
            activeTab === 'admins' && ( <
                div >
                <
                div className = "flex justify-between items-center mb-6" >
                <
                div >
                <
                h2 className = "text-2xl font-bold text-gray-900 dark:text-white" > Zone Admin Management < /h2> <
                p className = "text-gray-600 dark:text-gray-300" > Managing zone admins in your region: { user.region_name } < /p> < /
                div > <
                button onClick = {
                    () => setShowAdminModal(true)
                }
                className = "bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded dark:bg-green-600 dark:hover:bg-green-700" > ➕Add New Zone Admin <
                /button> < /
                div >

                <
                div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" > {
                    admins.map((admin) => ( <
                        div key = { admin.id }
                        className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                        <
                        div className = "mb-4" >
                        <
                        h3 className = "text-lg font-semibold text-gray-900 dark:text-white" > { admin.full_name } < /h3> <
                        p className = "text-gray-600 dark:text-gray-300" > 📞Phone: { admin.phone_number } < /p> <
                        p className = "text-gray-600 dark:text-gray-300" > 🏛️Zone: { admin.zone_name } < /p> <
                        p className = "text-gray-600 dark:text-gray-300" > 📅Created: { new Date(admin.created_at).toLocaleDateString() } < /p> < /
                        div > <
                        div className = "flex space-x-2 mb-4" >
                        <
                        button onClick = {
                            () => handleEditAdmin(admin)
                        }
                        className = "bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm dark:bg-blue-600 dark:hover:bg-blue-700" > ✏️Edit <
                        /button> < /
                        div > <
                        div >
                        <
                        h4 className = "font-semibold text-gray-900 dark:text-white" > Recent Activities: < /h4> { /* Display recent activities for this admin */ } <
                        p className = "text-sm mt-2 text-gray-500 dark:text-gray-400" > No recent activities < /p> <
                        /div> <
                        /div>
                    ))
                } {
                    admins.length === 0 && ( <
                        p className = "col-span-full text-center py-8 text-gray-500 dark:text-gray-400" >
                        No zone admins found in your region. <
                        /p>
                    )
                } <
                /div> <
                /div>
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
                h2 className = "text-2xl font-bold text-gray-900 dark:text-white" > Farmer Profiles(View Only) < /h2> <
                p className = "text-gray-600 dark:text-gray-300" > Viewing farmers in your region: { user.region_name } < /p> <
                /div> <
                /div> <
                div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" > {
                    farmers.map((farmer) => ( <
                        div key = { farmer.id }
                        className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                        <
                        div className = "mb-4" >
                        <
                        h3 className = "text-lg font-semibold text-gray-900 dark:text-white mb-2" > { farmer.full_name } < /h3> <
                        div className = "grid grid-cols-1 gap-1 mb-2 text-gray-600 dark:text-gray-300" >
                        <
                        p > 📞Phone: { farmer.phone_number } < /p> <
                        p > 🌍Region: { farmer.region_name || 'N/A' } < /p> <
                        p > �️Zone: { farmer.zone_name || 'N/A' } < /p> <
                        p > 🏘️Woreda: { farmer.woreda_name || 'N/A' } < /p> <
                        p > 📍Kebele: { farmer.kebele_name || 'N/A' } < /p> <
                        p > 🌾Land Size: { farmer.land_size_hectares || 'N/A' }
                        hectares < /p> <
                        p > 🌱Crop Types: { farmer.crop_types || 'N/A' } < /p> <
                        p > 🌦️Crop Season: { farmer.crops_season || 'N/A' } < /p> <
                        p > 🏞️Land Type: { farmer.land_type || 'N/A' } < /p> <
                        p > 📈Farming Experience: { farmer.farming_experience || 'N/A' }
                        years < /p> <
                        p > 💧Irrigation Type: { farmer.irrigation_type || 'N/A' } < /p> <
                        p > 🚜Farming Method: { farmer.farming_method || 'N/A' } < /p> <
                        p > �Primary Crops: { farmer.primary_crops || 'N/A' } < /p> <
                        p > 🌿Secondary Crops: { farmer.secondary_crops || 'N/A' } < /p> <
                        p > 🏔️Soil Type: { farmer.soil_type || 'N/A' } < /p> <
                        p > 🐄Has Livestock: { farmer.has_livestock ? 'Yes' : 'No' } < /p> {
                            farmer.has_livestock ? ( <
                                p > 🐄Livestock Types: { farmer.livestock_types || 'N/A' } < /p>
                            ) : null
                        } <
                        p > 💰Annual Income: { farmer.annual_income ? `$${farmer.annual_income}` : 'N/A' } < /p> <
                        p > 🎓Education Level: { farmer.education_level || 'N/A' } < /p> <
                        p > 📅Registered: { farmer.created_at ? new Date(farmer.created_at).toLocaleDateString() : 'N/A' } < /p> <
                        /div> <
                        /div> <
                        div >
                        <
                        h4 className = "font-semibold text-gray-900 dark:text-white" > Recent Requests: < /h4> {
                            requests.filter(req => req.farmer_id === farmer.id).slice(0, 3).map(req => ( <
                                div key = { req.id }
                                className = "flex justify-between items-center mt-2" >
                                <
                                span className = "text-sm text-gray-600 dark:text-gray-300" > { req.product_name } < /span> { getStatusBadge(req.region_status) } <
                                /div>
                            ))
                        } {
                            requests.filter(req => req.farmer_id === farmer.id).length === 0 && ( <
                                p className = "text-sm mt-2 text-gray-500 dark:text-gray-400" > No requests from this farmer < /p>
                            )
                        } <
                        /div> <
                        /div>
                    ))
                } {
                    farmers.length === 0 && ( <
                        p className = "col-span-full text-center py-8 text-gray-500 dark:text-gray-400" >
                        No farmers found in your region. <
                        /p>
                    )
                } <
                /div> <
                /div>
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
                h2 className = "text-2xl font-bold text-gray-900 dark:text-white" > Product Management < /h2> <
                p className = "text-gray-600 dark:text-gray-300" > Managing products in your region < /p> < /
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
                button className = { `py-2 px-4 rounded ${productFilter === 'all'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}` }
                onClick = {
                    () => setProductFilter('all')
                } >
                All Products <
                /button> <
                button className = { `py-2 px-4 rounded ${productFilter === 'own'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}` }
                onClick = {
                    () => setProductFilter('own')
                } >
                My Products <
                /button> <
                button className = { `py-2 px-4 rounded ${productFilter === 'others'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}` }
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
                            h3 className = "text-lg font-semibold text-gray-900 dark:text-white" > { product.name } < /h3> <
                            div className = "flex gap-2 mt-2" >
                            <
                            span className = "px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs" > { product.category } <
                            /span> {
                            product.sub_category && ( <
                                span className = "px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs" > { product.sub_category } <
                                /span>
                            )
                        } <
                        /div> <
                        p className = "text-sm text-gray-600 dark:text-gray-300 mt-2" > { product.description } < /p> <
                        p className = "text-gray-700 dark:text-gray-300" > 💰Price: Birr { product.price }
                        per { product.unit || 'unit' } < /p> <
                        p className = "text-gray-700 dark:text-gray-300" > 📦Amount: { product.amount } { product.unit || 'units' } < /p> {
                        product.manufacturer && ( <
                            p className = "text-gray-700 dark:text-gray-300" > 🏭Manufacturer: { product.manufacturer } < /p>
                        )
                    } {
                        product.expiry_date && ( <
                            p className = "text-gray-700 dark:text-gray-300" > 📅Expires: { new Date(product.expiry_date).toLocaleDateString() } < /p>
                        )
                    } {
                        productFilter !== 'own' && ( <
                            >
                            <
                            p className = "text-gray-700 dark:text-gray-300" > 👤Added by: { product.created_by_name }({ product.admin_role }) < /p> <
                            p className = "text-gray-700 dark:text-gray-300" > 📍Location: { product.region_name }
                            /{product.zone_name}/ { product.woreda_name }
                            /{product.kebele_name}</p >
                            <
                            />
                        )
                    } <
                    p className = "text-gray-700 dark:text-gray-300" > 📅Created: { new Date(product.created_at).toLocaleDateString() } < /p> < /
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
                p className = "col-span-full text-center py-8 text-gray-500 dark:text-gray-400" > {
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

{ /* Enhanced Requests Tab with Full Approval Workflow */ } {
    activeTab === 'requests' && ( <
        div >
        <
        div className = "mb-6" >
        <
        h2 className = "text-2xl font-bold text-gray-900 dark:text-white" > Request Management < /h2> <
        p className = "text-gray-600 dark:text-gray-300" > Manage farmer requests in your region: { user.region_name } < /p> < /
        div >

        <
        div className = { `p-4 rounded shadow mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
        <
        div className = "flex flex-wrap items-center gap-4 mb-4" >
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
        /div>

        {
            filteredRequests.filter(r => r.region_status === 'Pending').length > 0 && ( <
                div className = "flex flex-wrap items-center gap-2" >
                <
                select value = { bulkAction }
                onChange = {
                    (e) => setBulkAction(e.target.value)
                }
                className = { `p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` } >
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
                className = "bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700" > { selectedRequests.length === filteredRequests.filter(r => r.region_status === 'Pending').length ? 'Deselect All' : 'Select All Pending' } <
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
                    h3 className = "text-lg font-semibold text-gray-900 dark:text-white" > { request.product_name } < /h3> <
                    p className = "text-gray-600 dark:text-gray-300" > 👨‍🌾Farmer: { request.farmer_name } < /p> <
                    p className = "text-gray-600 dark:text-gray-300" > 📞Phone: { request.farmer_phone } < /p> <
                    p className = "text-gray-600 dark:text-gray-300" > 📅Requested: { new Date(request.created_at).toLocaleDateString() } < /p> <
                    p className = "text-gray-600 dark:text-gray-300" > 📦Amount: { request.amount || request.quantity } < /p> <
                    p className = "text-gray-600 dark:text-gray-300" > 💰Price: Birr { request.product_price || 'N/A' } < /p> <
                    p className = "text-gray-600 dark:text-gray-300" > 💵Total Cost: Birr { request.product_price ? (request.product_price * (request.amount || request.quantity)).toFixed(2) : 'N/A' } < /p> < /
                    div > <
                    div className = "flex flex-col items-end" >
                    <
                    div className = "mb-2" > { getStatusBadge(request.region_status) } <
                    /div> {
                    request.region_status === 'Pending' && canRegionAdminAct(request) && ( <
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
                request.region_status === 'Pending' && canRegionAdminAct(request) && ( <
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
                    span className = "text-xs text-gray-600 dark:text-gray-300" > Select < /span> < /
                    div >
                )
            } <
            /div> < /
            div > <
            /div>
        ))
} {
    filteredRequests.length === 0 && ( <
        p className = "text-center py-8 text-gray-500 dark:text-gray-400" > No requests found. < /p>
    )
} <
/div> < /
div >
)
}

{ /* Reports Tab */ } {
    activeTab === 'reports' && ( <
            div >
            <
            div className = "flex justify-between items-center mb-6" >
            <
            div >
            <
            h2 className = "text-2xl font-bold text-gray-900 dark:text-white" > Report Management < /h2> <
            p className = "text-gray-600 dark:text-gray-300" > Managing admin reports in your region < /p> < /
            div > <
            button onClick = {
                () => setShowReportModal(true)
            }
            className = "bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded dark:bg-green-600 dark:hover:bg-green-700" > ➕Create New Report <
            /button> < /
            div >

            <
            div className = "grid grid-cols-1 gap-4" > {
                reports.map((report) => ( <
                        div key = { report.id }
                        className = { `p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                        <
                        div className = "flex justify-between items-start mb-3" >
                        <
                        div >
                        <
                        h4 className = "font-semibold text-gray-900 dark:text-white" > { report.title } < /h4> <
                        p className = "text-sm text-gray-600 dark:text-gray-300" >
                        Reported by: { report.reporter_name || 'Admin' } <
                        /p> < /
                        div > <
                        div className = "flex flex-col items-end" >
                        <
                        span className = { `px-2 py-1 rounded-full text-xs font-medium ${
                                                    report.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    report.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                                                    report.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                                                    report.status === 'Dismissed' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }` } > { report.status } <
                        /span> <
                        span className = { `mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                    report.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                                                    report.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                                                    report.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }` } > { report.priority }
                        Priority <
                        /span> < /
                        div > <
                        /div>

                        <
                        div className = "space-y-2 mb-4" >
                        <
                        p className = "text-sm text-gray-600 dark:text-gray-300" >
                        Type: { report.report_type } <
                        /p> <
                        p className = "text-sm text-gray-600 dark:text-gray-300" >
                        Description: { report.description } <
                        /p> {
                        report.evidence && ( <
                            p className = "text-sm text-gray-600 dark:text-gray-300" >
                            Evidence: { report.evidence } <
                            /p>
                        )
                    } {
                        report.resolution_notes && ( <
                            p className = "text-sm text-gray-600 dark:text-gray-300" >
                            Resolution Notes: { report.resolution_notes } <
                            /p>
                        )
                    } <
                    /div>

                    {
                        report.status === 'Pending' || report.status === 'Under Review' ? ( <
                            div className = "flex gap-2" >
                            <
                            button onClick = {
                                () => handleUpdateReportStatus(report.id, 'Resolved')
                            }
                            className = "flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm" >
                            Mark Resolved <
                            /button> <
                            button onClick = {
                                () => handleUpdateReportStatus(report.id, 'Dismissed')
                            }
                            className = "flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm" >
                            Dismiss <
                            /button> < /
                            div >
                        ) : ( <
                            p className = "text-xs text-gray-400 dark:text-gray-500" >
                            Resolved on: { new Date(report.resolved_at || report.updated_at).toLocaleString() } <
                            /p>
                        )
                    } <
                    /div>
                ))
        } {
            reports.length === 0 && ( <
                p className = "text-center py-8 text-gray-500 dark:text-gray-400" > No reports found. < /p>
            )
        } <
        /div> < /
    div >
)
} <
/main> < /
div >

    { /* Enhanced Admin Modal */ } {
        showAdminModal && ( <
            div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
            <
            div className = { `w-full max-w-md p-6 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'} max-h-[90vh] overflow-y-auto` } >
            <
            h2 className = "text-xl font-bold mb-6 text-gray-900 dark:text-white" > { editingAdmin ? 'Edit Zone Admin' : 'Add New Zone Admin' } <
            /h2> <
            form onSubmit = { handleAdminSubmit } >
            <
            div className = "space-y-4" >
            <
            div >
            <
            label className = "block mb-1 text-gray-700 dark:text-gray-300" > Full Name * < /label> <
            input type = "text"
            required value = { adminForm.fullName }
            onChange = {
                (e) => setAdminForm({...adminForm, fullName: e.target.value })
            }
            className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` }
            /> < /
            div > <
            div >
            <
            label className = "block mb-1 text-gray-700 dark:text-gray-300" > Phone Number * < /label> <
            input type = "tel"
            required value = { adminForm.phoneNumber }
            onChange = {
                (e) => setAdminForm({...adminForm, phoneNumber: e.target.value })
            }
            className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` }
            /> < /
            div > <
            div >
            <
            label className = "block mb-1 text-gray-700 dark:text-gray-300" > Zone Name * < /label> <
            input type = "text"
            required value = { adminForm.zoneName }
            onChange = {
                (e) => setAdminForm({...adminForm, zoneName: e.target.value })
            }
            className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` }
            /> < /
            div > <
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
            className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` }
            /> < /
            div > <
            /div>

            <
            div className = "flex justify-end space-x-2 mt-6" >
            <
            button type = "button"
            onClick = {
                () => {
                    setShowAdminModal(false);
                    setEditingAdmin(null);
                    resetAdminForm();
                }
            }
            className = "bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700" >
            Cancel <
            /button> <
            button type = "submit"
            className = "bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-700" > { editingAdmin ? 'Update Admin' : 'Create Admin' } <
            /button> < /
            div > <
            /form> < /
            div > <
            /div>
        )
    }

{ /* Enhanced Product Modal */ } {
    showProductModal && ( <
            div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
            <
            div className = { `w-full max-w-2xl p-6 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'} max-h-[90vh] overflow-y-auto` } >
            <
            h2 className = "text-xl font-bold mb-6 text-gray-900 dark:text-white" > { editingProduct ? 'Edit Product' : 'Add New Product' } <
            /h2> <
            form onSubmit = { handleProductSubmit } >
            <
            div className = "grid grid-cols-1 md:grid-cols-2 gap-4" >
            <
            div >
            <
            label className = "block mb-1 text-gray-700 dark:text-gray-300" > Product Name * < /label> <
            input type = "text"
            required value = { productForm.name }
            onChange = {
                (e) => setProductForm({...productForm, name: e.target.value })
            }
            className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` }
            /> < /
            div > <
            div >
            <
            label className = "block mb-1 text-gray-700 dark:text-gray-300" > Category * < /label> <
            select required value = { productForm.category }
            onChange = {
                (e) => {
                    setProductForm({
                        ...productForm,
                        category: e.target.value,
                        subCategory: '',
                        unit: ''
                    });
                }
            }
            className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` } >
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
            div >
            <
            label className = "block mb-1 text-gray-700 dark:text-gray-300" > Sub - Category * < /label> <
            select required value = { productForm.subCategory }
            onChange = {
                (e) => setProductForm({...productForm, subCategory: e.target.value })
            }
            className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` } >
            <
            option value = "" > Select Sub - Category < /option> {
            productCategories[productForm.category].subcategories.map(subcat => ( <
                option key = { subcat }
                value = { subcat } > { subcat } < /option>
            ))
        } <
        /select> < /
        div >
    )
} {
    productForm.category && ( <
            div >
            <
            label className = "block mb-1 text-gray-700 dark:text-gray-300" > Unit * < /label> <
            select required value = { productForm.unit }
            onChange = {
                (e) => setProductForm({...productForm, unit: e.target.value })
            }
            className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` } >
            <
            option value = "" > Select Unit < /option> {
            productCategories[productForm.category].units.map(unit => ( <
                option key = { unit }
                value = { unit } > { unit } < /option>
            ))
        } <
        /select> < /
    div >
)
} <
div >
    <
    label className = "block mb-1 text-gray-700 dark:text-gray-300" > Amount(Quantity) * < /label> <
input type = "number"
required min = "1"
step = "1"
value = { productForm.amount }
onChange = {
    (e) => setProductForm({...productForm, amount: e.target.value })
}
className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` }
/> < /
div > <
    div >
    <
    label className = "block mb-1 text-gray-700 dark:text-gray-300" > Price(Birr) * < /label> <
input type = "number"
required min = "0.01"
step = "0.01"
value = { productForm.price }
onChange = {
    (e) => setProductForm({...productForm, price: e.target.value })
}
className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` }
/> < /
div > <
    div >
    <
    label className = "block mb-1 text-gray-700 dark:text-gray-300" > Manufacturer / Brand < /label> <
input type = "text"
value = { productForm.manufacturer }
onChange = {
    (e) => setProductForm({...productForm, manufacturer: e.target.value })
}
placeholder = "e.g., John Deere, Bayer"
className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` }
/> < /
div > <
    div >
    <
    label className = "block mb-1 text-gray-700 dark:text-gray-300" > Expiry Date * < /label> <
input type = "date"
required value = { productForm.expiryDate }
onChange = {
    (e) => setProductForm({...productForm, expiryDate: e.target.value })
}
className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` }
/> < /
div > <
    /div> <
div className = "mt-4" >
    <
    label className = "block mb-1 text-gray-700 dark:text-gray-300" > Description < /label> <
textarea value = { productForm.description }
onChange = {
    (e) => setProductForm({...productForm, description: e.target.value })
}
className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` }
rows = "3"
placeholder = "Detailed description of the product, usage instructions, etc." /
    >
    <
    /div> <
div className = "flex justify-end space-x-2 mt-6" >
    <
    button type = "button"
onClick = {
    () => {
        setShowProductModal(false);
        setEditingProduct(null);
        resetProductForm();
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

{ /* Enhanced Request Status Modal */ } {
    showRequestModal && selectedRequest && ( <
            div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
            <
            div className = { `w-full max-w-2xl p-6 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'} max-h-screen overflow-y-auto` } >
            <
            h2 className = "text-xl font-bold mb-4 text-gray-900 dark:text-white" > Request Details < /h2>

            <
            div className = "mb-6" >
            <
            h3 className = "text-lg font-semibold text-gray-900 dark:text-white" > { selectedRequest.product_name } < /h3> <
            p className = "text-gray-600 dark:text-gray-300" > 👨‍🌾Farmer: { selectedRequest.farmer_name } < /p> <
            p className = "text-gray-600 dark:text-gray-300" > 📞Phone: { selectedRequest.farmer_phone } < /p> <
            p className = "text-gray-600 dark:text-gray-300" > 📅Requested: { new Date(selectedRequest.created_at).toLocaleDateString() } < /p> <
            p className = "text-gray-600 dark:text-gray-300" > 📦Amount: { selectedRequest.amount || selectedRequest.quantity } < /p> <
            p className = "text-gray-600 dark:text-gray-300" > 💰Price: Birr { selectedRequest.product_price || 'N/A' } < /p> <
            p className = "text-gray-600 dark:text-gray-300" > 💵Total Cost: Birr { selectedRequest.product_price ? (selectedRequest.product_price * (selectedRequest.amount || selectedRequest.quantity)).toFixed(2) : 'N/A' } < /p> <
            div className = "mt-2" > { getStatusBadge(selectedRequest.region_status) } <
            /div> < /
            div >

            <
            div className = "mb-6" >
            <
            h3 className = "text-lg font-semibold text-gray-900 dark:text-white" > Approval Workflow < /h3> <
            div className = "mt-4 space-y-4 max-h-96 overflow-y-auto" > { getLevelStatus('kebele', selectedRequest) } { getLevelStatus('woreda', selectedRequest) } { getLevelStatus('zone', selectedRequest) } { getLevelStatus('region', selectedRequest) } { getLevelStatus('federal', selectedRequest) } <
            /div> < /
            div >

            {
                requestStatus && canRegionAdminAct(selectedRequest) && ( <
                    div className = "mb-6" >
                    <
                    h3 className = "text-lg font-semibold mb-2 text-gray-900 dark:text-white" > Update Status < /h3> <
                    div className = "mb-4" >
                    <
                    label className = "block mb-1 text-gray-700 dark:text-gray-300" > Reason / Feedback(Optional) < /label> <
                    textarea value = { decisionReason }
                    onChange = {
                        (e) => setDecisionReason(e.target.value)
                    }
                    className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` }
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
            requestStatus && canRegionAdminAct(selectedRequest) && ( <
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
}

{ /* Enhanced Report Modal */ } {
    showReportModal && ( <
            div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
            <
            div className = { `w-full max-w-md p-6 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'} max-h-[90vh] overflow-y-auto` } >
            <
            h2 className = "text-xl font-bold mb-6 text-gray-900 dark:text-white" >
            Create New Report <
            /h2> <
            form onSubmit = { handleReportSubmit } >
            <
            div className = "space-y-4" >
            <
            div >
            <
            label className = "block mb-1 text-gray-700 dark:text-gray-300" > Report Title * < /label> <
            input type = "text"
            required value = { reportForm.title }
            onChange = {
                (e) => setReportForm({...reportForm, title: e.target.value })
            }
            className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` }
            /> < /
            div > <
            div >
            <
            label className = "block mb-1 text-gray-700 dark:text-gray-300" > Reported Admin * < /label> <
            select required value = { reportForm.reportedAdminId }
            onChange = {
                (e) => setReportForm({...reportForm, reportedAdminId: e.target.value })
            }
            className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` } >
            <
            option value = "" > Select Admin to Report < /option> {
            admins.map(admin => ( <
                option key = { admin.id }
                value = { admin.id } > { admin.full_name }({ admin.role }) <
                /option>
            ))
        } <
        /select> < /
    div > <
        div >
        <
        label className = "block mb-1 text-gray-700 dark:text-gray-300" > Report Type * < /label> <
    select required value = { reportForm.reportType }
    onChange = {
        (e) => setReportForm({...reportForm, reportType: e.target.value })
    }
    className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` } >
        <
        option value = "Misconduct" > Misconduct < /option> <
    option value = "Incompetence" > Incompetence < /option> <
    option value = "Abuse of Power" > Abuse of Power < /option> <
    option value = "Corruption" > Corruption < /option> <
    option value = "Other" > Other < /option> < /
    select > <
        /div> <
    div >
        <
        label className = "block mb-1 text-gray-700 dark:text-gray-300" > Priority < /label> <
    select value = { reportForm.priority }
    onChange = {
        (e) => setReportForm({...reportForm, priority: e.target.value })
    }
    className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` } >
        <
        option value = "Low" > Low < /option> <
    option value = "Medium" > Medium < /option> <
    option value = "High" > High < /option> <
    option value = "Critical" > Critical < /option> < /
    select > <
        /div> <
    div >
        <
        label className = "block mb-1 text-gray-700 dark:text-gray-300" > Description * < /label> <
    textarea required value = { reportForm.description }
    onChange = {
        (e) => setReportForm({...reportForm, description: e.target.value })
    }
    className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` }
    rows = "4"
    placeholder = "Describe the incident in detail..." /
        >
        <
        /div> <
    div >
        <
        label className = "block mb-1 text-gray-700 dark:text-gray-300" > Evidence(Optional) < /label> <
    textarea value = { reportForm.evidence }
    onChange = {
        (e) => setReportForm({...reportForm, evidence: e.target.value })
    }
    className = { `w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}` }
    rows = "3"
    placeholder = "Any supporting evidence or documentation..." /
        >
        <
        /div> < /
    div >

        <
        div className = "flex justify-end space-x-2 mt-6" >
        <
        button type = "button"
    onClick = {
        () => {
            setShowReportModal(false);
            setEditingReport(null);
            resetReportForm();
        }
    }
    className = "bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700" >
        Cancel <
        /button> <
    button type = "submit"
    className = "bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-700" >
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

export default RegionDashboard;