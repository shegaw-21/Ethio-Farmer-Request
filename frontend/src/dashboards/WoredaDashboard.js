import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const WoredaDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [user, setUser] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const navigate = useNavigate();

    // Admin/Farmer Management State
    const [admins, setAdmins] = useState([]);
    const [farmers, setFarmers] = useState([]);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [showFarmerModal, setShowFarmerModal] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [editingFarmer, setEditingFarmer] = useState(null);
    const [adminForm, setAdminForm] = useState({
        fullName: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        role: 'Kebele',
        kebele_name: ''
    });
    const [farmerForm, setFarmerForm] = useState({
        fullName: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        kebele_name: '',
        landSizeHectares: '',
        cropTypes: '',
        landType: '',
        cropsSeason: '',
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
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        category: '',
        sub_category: '',
        amount: '',
        price: '',
        unit: '',
        manufacturer: '',
        expiry_date: ''
    });
    const [productErrors, setProductErrors] = useState({});
    const [productView, setProductView] = useState('my');

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
    const [kebeleFilter, setKebeleFilter] = useState('all');

    // Report Management State
    const [reports, setReports] = useState([]);
    const [myReports, setMyReports] = useState([]);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportForm, setReportForm] = useState({
        reported_admin_id: '',
        report_type: 'Misconduct',
        title: '',
        description: '',
        evidence: '',
        priority: 'Medium'
    });
    const [reportStats, setReportStats] = useState({});

    // Stats State
    const [stats, setStats] = useState({
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        acceptedRequests: 0,
        totalAdmins: 0,
        totalFarmers: 0,
        totalProducts: 0,
        totalReports: 0
    });

    // Kebeles in this Woreda
    const [kebeles, setKebeles] = useState([]);

    // Toggle dark mode
    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.documentElement.classList.toggle('dark');
    };

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user') || 'null');
        const userType = localStorage.getItem('userType');

        if (!token || userType !== 'Woreda' || !userData) {
            navigate('/login');
            return;
        }

        setUser(userData);
        fetchDashboardData();
    }, [navigate]);

    useEffect(() => {
        if (requests.length > 0) {
            filterRequests();
        }
    }, [statusFilter, kebeleFilter, requests]);

    const filterRequests = useCallback(() => {
        let filtered = [...requests];

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(req => req.status === statusFilter);
        }

        // Filter by kebele
        if (kebeleFilter !== 'all') {
            filtered = filtered.filter(req => req.kebele_name === kebeleFilter);
        }

        setFilteredRequests(filtered);
    }, [statusFilter, kebeleFilter, requests]);

    const fetchDashboardData = async() => {
        try {
            const token = localStorage.getItem('token');

            // Fetch admins and farmers in scope
            const adminsResponse = await fetch('http://localhost:5000/api/admins/admins', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (adminsResponse.ok) {
                const data = await adminsResponse.json();
                const adminsData = data.filter(item => item.type === 'admin' && item.role === 'Kebele');
                const farmersData = data.filter(item => item.type === 'farmer');

                setAdmins(adminsData);
                setFarmers(farmersData);
                setStats(prev => ({
                    ...prev,
                    totalAdmins: adminsData.length,
                    totalFarmers: farmersData.length
                }));

                // Extract unique kebeles for filtering
                const uniqueKebeles = [...new Set(farmersData.map(f => f.kebele_name))];
                setKebeles(uniqueKebeles);
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
                filterRequests();

                // Calculate stats from requests data
                const totalRequests = requestsData.length;
                const pendingRequests = requestsData.filter(req => req.status === 'Pending').length;
                const approvedRequests = requestsData.filter(req => req.status === 'Approved').length;
                const acceptedRequests = requestsData.filter(req => req.status === 'Accepted').length;
                const rejectedRequests = requestsData.filter(req => req.status === 'Rejected').length;

                setStats(prev => ({
                    ...prev,
                    totalRequests,
                    pendingRequests,
                    approvedRequests,
                    acceptedRequests,
                    rejectedRequests
                }));
            }

            // Fetch reports
            const reportsResponse = await fetch('http://localhost:5000/api/admins/reports', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (reportsResponse.ok) {
                const reportsData = await reportsResponse.json();
                setReports(reportsData.reports || []);
            }

            // Fetch my reports
            const myReportsResponse = await fetch('http://localhost:5000/api/admins/reports/my', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (myReportsResponse.ok) {
                const myReportsData = await myReportsResponse.json();
                setMyReports(myReportsData.reports || []);
            }

            // Fetch report statistics
            const reportStatsResponse = await fetch('http://localhost:5000/api/admins/reports/statistics', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (reportStatsResponse.ok) {
                const reportStatsData = await reportStatsResponse.json();
                setReportStats(reportStatsData.statistics || {});
                setStats(prev => ({
                    ...prev,


                }));
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

            if (!editingAdmin && adminForm.password !== adminForm.confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            const url = editingAdmin ?
                `http://localhost:5000/api/admins/edit/${editingAdmin.id}` :
                'http://localhost:5000/api/admins/register';

            const method = editingAdmin ? 'PUT' : 'POST';

            // Prepare data for submission
            const submitData = {
                fullName: adminForm.fullName,
                phoneNumber: adminForm.phoneNumber,
                role: adminForm.role,
                region_name: user.region_name,
                zone_name: user.zone_name,
                woreda_name: user.woreda_name
            };

            // Only include password if it's being changed
            if (adminForm.password) {
                submitData.password = adminForm.password;
                submitData.confirmPassword = adminForm.confirmPassword;
            }

            // Only include kebele_name if it's provided
            if (adminForm.kebele_name) {
                submitData.kebele_name = adminForm.kebele_name;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });

            if (response.ok) {
                setShowAdminModal(false);
                setEditingAdmin(null);
                setAdminForm({
                    fullName: '',
                    phoneNumber: '',
                    password: '',
                    confirmPassword: '',
                    role: 'Kebele',
                    kebele_name: ''
                });
                fetchDashboardData();
                alert(editingAdmin ? 'Admin updated successfully' : 'Admin registered successfully');
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Error processing admin');
            }
        } catch (error) {
            console.error('Error processing admin:', error);
            alert('Error processing admin');
        }
    };

    // Farmer Management Functions
    const handleFarmerSubmit = async(e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            if (!editingFarmer && farmerForm.password !== farmerForm.confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            const url = editingFarmer ?
                `http://localhost:5000/api/admins/farmers/${editingFarmer.id}/profile` :
                'http://localhost:5000/api/admins/createfarmer';

            const method = editingFarmer ? 'PUT' : 'POST';

            // Prepare data for submission
            const submitData = {
                fullName: farmerForm.fullName,
                phoneNumber: farmerForm.phoneNumber,
                role: 'Farmer',
                region_name: user.region_name,
                zone_name: user.zone_name,
                woreda_name: user.woreda_name,
                kebele_name: farmerForm.kebele_name,
                landSizeHectares: farmerForm.landSizeHectares,
                cropTypes: farmerForm.cropTypes,
                landType: farmerForm.landType,
                cropsSeason: farmerForm.cropsSeason,
                farmingExperience: farmerForm.farmingExperience,
                irrigationType: farmerForm.irrigationType,
                farmingMethod: farmerForm.farmingMethod,
                primaryCrops: farmerForm.primaryCrops,
                secondaryCrops: farmerForm.secondaryCrops,
                soilType: farmerForm.soilType,
                hasLivestock: farmerForm.hasLivestock,
                livestockTypes: farmerForm.livestockTypes,
                annualIncome: farmerForm.annualIncome,
                educationLevel: farmerForm.educationLevel
            };

            // Only include password if it's being changed
            if (farmerForm.password) {
                submitData.password = farmerForm.password;
                submitData.confirmPassword = farmerForm.confirmPassword;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });

            if (response.ok) {
                setShowFarmerModal(false);
                setEditingFarmer(null);
                resetFarmerForm();
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

    const resetFarmerForm = () => {
        setFarmerForm({
            fullName: '',
            phoneNumber: '',
            password: '',
            confirmPassword: '',
            kebele_name: '',
            landSizeHectares: '',
            cropTypes: '',
            landType: '',
            cropsSeason: '',
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
    };

    const handleEditAdmin = (admin) => {
        setEditingAdmin(admin);
        setAdminForm({
            fullName: admin.full_name,
            phoneNumber: admin.phone_number,
            password: '',
            confirmPassword: '',
            role: admin.role,
            kebele_name: admin.kebele_name || ''
        });
        setShowAdminModal(true);
    };

    const handleEditFarmer = (farmer) => {
        setEditingFarmer(farmer);
        setFarmerForm({
            fullName: farmer.full_name,
            phoneNumber: farmer.phone_number,
            password: '',
            confirmPassword: '',
            kebele_name: farmer.kebele_name || '',
            landSizeHectares: farmer.land_size_hectares || '',
            cropTypes: farmer.crop_types || '',
            landType: farmer.land_type || '',
            cropsSeason: farmer.crops_season || '',
            farmingExperience: farmer.farming_experience || '',
            irrigationType: farmer.irrigation_type || '',
            farmingMethod: farmer.farming_method || '',
            primaryCrops: farmer.primary_crops || '',
            secondaryCrops: farmer.secondary_crops || '',
            soilType: farmer.soil_type || '',
            hasLivestock: farmer.has_livestock || false,
            livestockTypes: farmer.livestock_types || '',
            annualIncome: farmer.annual_income || '',
            educationLevel: farmer.education_level || ''
        });
        setShowFarmerModal(true);
    };


    // Product Management Functions
    const validateProductForm = () => {
        const errors = {};

        if (!productForm.name) errors.name = 'Product name is required';
        if (!productForm.category) errors.category = 'Category is required';
        if (!productForm.sub_category) errors.sub_category = 'Sub category is required';
        if (!productForm.amount) errors.amount = 'Amount is required';
        if (!productForm.price) errors.price = 'Price is required';
        if (!productForm.unit) errors.unit = 'Unit is required';
        if (!productForm.expiry_date) errors.expiry_date = 'Expiry date is required';

        setProductErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleProductSubmit = async(e) => {
        e.preventDefault();

        if (!validateProductForm()) {
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
                    description: productForm.description,
                    category: productForm.category,
                    sub_category: productForm.sub_category,
                    amount: productForm.amount,
                    price: productForm.price,
                    unit: productForm.unit,
                    manufacturer: productForm.manufacturer,
                    expiry_date: productForm.expiry_date
                })
            });

            if (response.ok) {
                setShowProductModal(false);
                setEditingProduct(null);
                setProductForm({
                    name: '',
                    description: '',
                    category: '',
                    sub_category: '',
                    amount: '',
                    price: '',
                    unit: '',
                    manufacturer: '',
                    expiry_date: ''
                });
                setProductErrors({});
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
        setEditingProduct(product);
        setProductForm({
            name: product.name,
            description: product.description,
            category: product.category,
            sub_category: product.sub_category || '',
            amount: product.amount,
            price: product.price,
            unit: product.unit || '',
            manufacturer: product.manufacturer || '',
            expiry_date: product.expiry_date ? product.expiry_date.split('T')[0] : ''
        });
        setProductErrors({});
        setShowProductModal(true);
    };

    const handleDeleteProduct = async(productId) => {
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

    const toggleRequestSelection = (requestId) => {
        if (selectedRequests.includes(requestId)) {
            setSelectedRequests(selectedRequests.filter(id => id !== requestId));
        } else {
            setSelectedRequests([...selectedRequests, requestId]);
        }
    };

    const selectAllRequests = () => {
        if (selectedRequests.length === filteredRequests.filter(r => canWoredaAdminAct(r)).length) {
            setSelectedRequests([]);
        } else {
            setSelectedRequests(filteredRequests.filter(r => canWoredaAdminAct(r)).map(r => r.id));
        }
    };

    const handleDeleteRequest = async(requestId) => {
        if (window.confirm('Are you sure you want to delete this request?')) {
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
                await fetch(`http://localhost:5000/api/admins/requests/${requestId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        status: bulkAction === 'approve' ? 'Approved' : bulkAction === 'accept' ? 'Accepted' : 'Rejected'
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

    // Report Management Functions
    const handleReportSubmit = async(e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            const response = await fetch('http://localhost:5000/api/admins/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(reportForm)
            });

            if (response.ok) {
                setShowReportModal(false);
                setReportForm({
                    reported_admin_id: '',
                    report_type: 'Misconduct',
                    title: '',
                    description: '',
                    evidence: '',
                    priority: 'Medium'
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

    const updateReportStatus = async(reportId, status, notes = '') => {
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
                    resolution_notes: notes
                })
            });

            if (response.ok) {
                fetchDashboardData();
                alert(`Report ${status} successfully`);
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Error updating report');
            }
        } catch (error) {
            console.error('Error updating report:', error);
            alert('Error updating report');
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

    const getLevelStatus = (level, request) => {
        const status = request[`${level}_status`];
        const admin = request[`${level}_admin_name`];
        const feedback = request[`${level}_feedback`];
        const date = request[`${level}_approved_at`];

        const formatLevel = level.charAt(0).toUpperCase() + level.slice(1);

        return ( <
            div className = "mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded" >
            <
            h4 className = "font-semibold text-gray-800 dark:text-white" > { formatLevel }
            Level < /h4> <
            p className = "text-sm text-gray-600 dark:text-gray-300" > < strong > Status: < /strong> {status || 'Pending'}</p > { admin && < p className = "text-sm text-gray-600 dark:text-gray-300" > < strong > Admin: < /strong> {admin}</p > } { feedback && < p className = "text-sm text-gray-600 dark:text-gray-300" > < strong > Feedback: < /strong> {feedback}</p > } { date && < p className = "text-sm text-gray-600 dark:text-gray-300" > < strong > Date: < /strong> {new Date(date).toLocaleString()}</p > } <
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
                alert('Error fetching request details');
            }
        } catch (error) {
            console.error('Error fetching request details:', error);
            alert('Error fetching request details');
        }
    };

    // Check if Woreda admin can act on this request
    const canWoredaAdminAct = (request) => {
        // Woreda admin can only act on requests that have been approved by Kebele admin
        return request.kebele_status === 'Approved' && request.woreda_status === 'Pending';
    };

    // Check if admin can delete this request (only rejected ones)
    const canDeleteRequest = (request) => {
        return request.status === 'Rejected' && request.woreda_status === 'Rejected';
    };

    if (!user) {
        return <div className = "flex items-center justify-center h-screen dark:bg-gray-900" > Loading... < /div>;
    }

    return ( <
        div className = { `flex min-h-screen ${darkMode ? 'dark' : ''}` } >
        <
        div className = "flex flex-col w-full dark:bg-gray-900 dark:text-white" > { /* Sidebar */ } <
        div className = "w-64 bg-gray-800 text-white fixed h-full" >
        <
        div className = "p-4" >
        <
        h2 className = "text-xl font-bold" > Woreda Dashboard < /h2> < /
        div > <
        nav className = "mt-6" >
        <
        button className = { `w-full text-left py-2 px-4 ${activeTab === 'overview' ? 'bg-gray-700' : 'hover:bg-gray-700'}` }
        onClick = {
            () => setActiveTab('overview')
        } > 📊Overview <
        /button> <
        button className = { `w-full text-left py-2 px-4 ${activeTab === 'admins' ? 'bg-gray-700' : 'hover:bg-gray-700'}` }
        onClick = {
            () => setActiveTab('admins')
        } > 👥Kebele Admins <
        /button> <
        button className = { `w-full text-left py-2 px-4 ${activeTab === 'farmers' ? 'bg-gray-700' : 'hover:bg-gray-700'}` }
        onClick = {
            () => setActiveTab('farmers')
        } > 👨‍🌾Farmers <
        /button> <
        button className = { `w-full text-left py-2 px-4 ${activeTab === 'products' ? 'bg-gray-700' : 'hover:bg-gray-700'}` }
        onClick = {
            () => setActiveTab('products')
        } > 🛒Products <
        /button> <
        button className = { `w-full text-left py-2 px-4 ${activeTab === 'requests' ? 'bg-gray-700' : 'hover:bg-gray-700'}` }
        onClick = {
            () => setActiveTab('requests')
        } > 📋Requests <
        /button> <
        button className = { `w-full text-left py-2 px-4 ${activeTab === 'reports' ? 'bg-gray-700' : 'hover:bg-gray-700'}` }
        onClick = {
            () => setActiveTab('reports')
        } > 📊Reports <
        /button> < /
        nav > <
        /div>

        { /* Main Content */ } <
        div className = "ml-64 flex-1 p-6" >
        <
        header className = "flex justify-between items-center mb-6" >
        <
        div >
        <
        h1 className = "text-2xl font-bold dark:text-white" > Welcome, { user.fullName }(Woreda Admin) < /h1> <
        p className = "text-gray-600 dark:text-gray-400" > Region: { user.region_name } | Zone: { user.zone_name } | Woreda: { user.woreda_name } < /p> < /
        div > <
        div className = "flex items-center space-x-4" >
        <
        button onClick = { toggleDarkMode }
        className = "p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600" > { darkMode ? '☀️' : '🌙' } <
        /button> <
        button onClick = { handleLogout }
        className = "bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded" >
        Logout <
        /button> < /
        div > <
        /header>

        <
        main > { /* Overview Tab */ } {
            activeTab === 'overview' && ( <
                div className = "overview-tab" >
                <
                h2 className = "text-xl font-semibold mb-4 dark:text-white" > System Overview < /h2> <
                div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" >
                <
                div className = "bg-white dark:bg-gray-800 p-4 rounded shadow" >
                <
                h3 className = "text-2xl font-bold dark:text-white" > { stats.totalRequests } < /h3> <
                p className = "text-gray-600 dark:text-gray-400" > Total Requests < /p> < /
                div > <
                div className = "bg-white dark:bg-gray-800 p-4 rounded shadow" >
                <
                h3 className = "text-2xl font-bold dark:text-white" > { stats.pendingRequests } < /h3> <
                p className = "text-gray-600 dark:text-gray-400" > Pending Requests < /p> < /
                div > <
                div className = "bg-white dark:bg-gray-800 p-4 rounded shadow" >
                <
                h3 className = "text-2xl font-bold dark:text-white" > { stats.approvedRequests } < /h3> <
                p className = "text-gray-600 dark:text-gray-400" > Approved Requests < /p> < /
                div > <
                div className = "bg-white dark:bg-gray-800 p-4 rounded shadow" >
                <
                h3 className = "text-2xl font-bold dark:text-white" > { stats.acceptedRequests } < /h3> <
                p className = "text-gray-600 dark:text-gray-400" > Accepted Requests < /p> < /
                div > <
                div className = "bg-white dark:bg-gray-800 p-4 rounded shadow" >
                <
                h3 className = "text-2xl font-bold dark:text-white" > { stats.rejectedRequests } < /h3> <
                p className = "text-gray-600 dark:text-gray-400" > Rejected Requests < /p> < /
                div > <
                div className = "bg-white dark:bg-gray-800 p-4 rounded shadow" >
                <
                h3 className = "text-2xl font-bold dark:text-white" > { stats.totalAdmins } < /h3> <
                p className = "text-gray-600 dark:text-gray-400" > Kebele Admins < /p> < /
                div > <
                div className = "bg-white dark:bg-gray-800 p-4 rounded shadow" >
                <
                h3 className = "text-2xl font-bold dark:text-white" > { stats.totalFarmers } < /h3> <
                p className = "text-gray-600 dark:text-gray-400" > Farmers < /p> < /
                div > <
                div className = "bg-white dark:bg-gray-800 p-4 rounded shadow" >
                <
                h3 className = "text-2xl font-bold dark:text-white" > { stats.totalProducts } < /h3> <
                p className = "text-gray-600 dark:text-gray-400" > Products < /p> < /
                div > <
                /div>

                <
                div className = "quick-actions bg-white dark:bg-gray-800 p-4 rounded shadow" >
                <
                h2 className = "text-xl font-semibold mb-4 dark:text-white" > Quick Actions < /h2> <
                div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" >
                <
                button onClick = {
                    () => setActiveTab('requests')
                }
                className = "bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-left" > 📋Manage Requests <
                /button> <
                button onClick = {
                    () => setActiveTab('admins')
                }
                className = "bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-left" > 👥Manage Kebele Admins <
                /button> <
                button onClick = {
                    () => setActiveTab('farmers')
                }
                className = "bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-left" > 👨‍🌾View Farmers <
                /button> <
                button onClick = {
                    () => setActiveTab('products')
                }
                className = "bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-left" > 🛒Manage Products <
                /button> <
                button onClick = {
                    () => setShowAdminModal(true)
                }
                className = "bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded text-left" > ➕Register Kebele Admin <
                /button> <
                button onClick = {
                    () => setShowProductModal(true)
                }
                className = "bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded text-left" > ➕Add Product <
                /button> < /
                div > <
                /div> < /
                div >
            )
        }

        { /* Kebele Admins Tab */ } {
            activeTab === 'admins' && ( <
                div className = "admins-tab" >
                <
                div className = "flex justify-between items-center mb-6" >
                <
                div >
                <
                h2 className = "text-xl font-semibold dark:text-white" > Kebele Admin Management < /h2> <
                p className = "text-gray-600 dark:text-gray-400" > Managing Kebele admins in your woreda: { user.woreda_name } < /p> < /
                div > <
                button onClick = {
                    () => setShowAdminModal(true)
                }
                className = "bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded" > ➕Register New Kebele Admin <
                /button> < /
                div >

                <
                div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" > {
                    admins.map((admin) => ( <
                        div key = { admin.id }
                        className = "bg-white dark:bg-gray-800 p-4 rounded shadow" >
                        <
                        div className = "admin-info mb-4" >
                        <
                        h3 className = "font-semibold dark:text-white" > { admin.full_name } < /h3> <
                        p className = "text-gray-600 dark:text-gray-400" > 📞Phone: { admin.phone_number } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 📍Kebele: { admin.kebele_name } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 📅Registered: { new Date(admin.created_at).toLocaleDateString() } < /p> < /
                        div > <
                        div className = "flex space-x-2" >
                        <
                        button onClick = {
                            () => handleEditAdmin(admin)
                        }
                        className = "bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm" > ✏️Edit <
                        /button> < /
                        div > <
                        /div>
                    ))
                } {
                    admins.length === 0 && ( <
                        p className = "text-gray-600 dark:text-gray-400 col-span-full" > No Kebele admins found in your woreda. < /p>
                    )
                } <
                /div> < /
                div >
            )
        }

        { /* Farmers Tab */ } {
            activeTab === 'farmers' && ( <
                    div className = "farmers-tab" >
                    <
                    div className = "tab-header mb-6" >
                    <
                    div className = "flex justify-between items-center mb-4" >
                    <
                    div >
                    <
                    h2 className = "text-xl font-semibold dark:text-white" > Farmer Management < /h2> <
                    p className = "text-gray-600 dark:text-gray-400" > Viewing farmers in your woreda: { user.woreda_name } < /p> < /
                    div > <
                    button onClick = {
                        () => setShowFarmerModal(true)
                    }
                    className = "bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded" > ➕Register New Farmer <
                    /button> < /
                    div >

                    <
                    div className = "filters mt-4" >
                    <
                    label className = "block text-gray-700 dark:text-gray-300 mb-2" > Filter by Kebele: < /label> <
                    select value = { kebeleFilter }
                    onChange = {
                        (e) => setKebeleFilter(e.target.value)
                    }
                    className = "border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" >
                    <
                    option value = "all" > All Kebeles < /option> {
                    kebeles.map(kebele => ( <
                        option key = { kebele }
                        value = { kebele } > { kebele } < /option>
                    ))
                } <
                /select> < /
            div > <
                /div>

            <
            div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" > {
                farmers
                .filter(farmer => kebeleFilter === 'all' || farmer.kebele_name === kebeleFilter)
                .map((farmer) => ( <
                        div key = { farmer.id }
                        className = "bg-white dark:bg-gray-800 p-4 rounded shadow" >
                        <
                        div className = "farmer-info mb-4" >
                        <
                        h3 className = "font-semibold dark:text-white" > { farmer.full_name } < /h3> <
                        p className = "text-gray-600 dark:text-gray-400" > 📞Phone: { farmer.phone_number } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 📍Kebele: { farmer.kebele_name } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 🌾Land Size: { farmer.land_size_hectares || 'N/A' }
                        hectares < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 🌱Primary Crops: { farmer.primary_crops || 'N/A' } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 📅Registered: { new Date(farmer.created_at).toLocaleDateString() } < /p> < /
                        div > <
                        div className = "flex space-x-2" >
                        <
                        button onClick = {
                            () => handleEditFarmer(farmer)
                        }
                        className = "bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm" > ✏️Edit <
                        /button> < /
                        div > <
                        div className = "farmer-requests mt-4" >
                        <
                        h4 className = "font-medium dark:text-white" > Recent Requests: < /h4> {
                        requests
                        .filter(req => req.farmer_id === farmer.id)
                        .slice(0, 3)
                        .map(req => ( <
                            div key = { req.id }
                            className = "flex justify-between items-center mt-2" >
                            <
                            span className = "text-sm text-gray-600 dark:text-gray-400" > { req.product_name } < /span> { getStatusBadge(req.status) } < /
                            div >
                        ))
                    } {
                        requests.filter(req => req.farmer_id === farmer.id).length === 0 && ( <
                            p className = "text-sm text-gray-600 dark:text-gray-400 mt-2" > No requests from this farmer < /p>
                        )
                    } <
                    /div> < /
                    div >
                ))
        } {
            farmers.length === 0 && ( <
                p className = "text-gray-600 dark:text-gray-400 col-span-full" > No farmers found in your woreda. < /p>
            )
        } <
        /div> < /
        div >
    )
}

{ /* Products Tab */ } {
    activeTab === 'products' && ( <
        div className = "products-tab" >
        <
        div className = "flex justify-between items-center mb-6" >
        <
        div >
        <
        h2 className = "text-xl font-semibold dark:text-white" > Product Management < /h2> <
        p className = "text-gray-600 dark:text-gray-400" > Managing products in your woreda < /p> < /
        div > <
        button onClick = {
            () => setShowProductModal(true)
        }
        className = "bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded" > ➕Add New Product <
        /button> < /
        div >

        { /* Product View Tabs */ } <
        div className = "mb-6" >
        <
        div className = "flex border-b border-gray-200 dark:border-gray-700" >
        <
        button className = { `py-2 px-4 ${productView === 'my' ? 'border-b-2 border-blue-500 text-blue-500 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}` }
        onClick = {
            () => setProductView('my')
        } >
        My Products <
        /button> <
        button className = { `py-2 px-4 ${productView === 'others' ? 'border-b-2 border-blue-500 text-blue-500 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}` }
        onClick = {
            () => setProductView('others')
        } >
        Other Admins ' Products < /
        button > <
        button className = { `py-2 px-4 ${productView === 'all' ? 'border-b-2 border-blue-500 text-blue-500 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}` }
        onClick = {
            () => setProductView('all')
        } >
        All Products <
        /button> < /
        div > <
        /div>

        { /* Products Display based on selected view */ } {
            productView === 'my' && ( <
                div className = "products-section mb-8" >
                <
                h3 className = "text-lg font-semibold mb-4 dark:text-white" > My Products < /h3> <
                div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" > {
                    myProducts.map((product) => ( <
                        div key = { product.id }
                        className = "bg-white dark:bg-gray-800 p-4 rounded shadow" >
                        <
                        div className = "product-info mb-4" >
                        <
                        h3 className = "font-semibold dark:text-white" > { product.name } < /h3> <
                        p className = "text-gray-600 dark:text-gray-400" > { product.description } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 📦Category: { product.category } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 📦Sub Category: { product.sub_category } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 💵Amount: { product.amount } { product.unit } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 💰Price: Br { product.price } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 🏭Manufacturer: { product.manufacturer || 'N/A' } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 📅Expiry: { product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : 'N/A' } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 📅Created: { new Date(product.created_at).toLocaleDateString() } < /p> < /
                        div > <
                        div className = "flex space-x-2" >
                        <
                        button onClick = {
                            () => handleEditProduct(product)
                        }
                        className = "bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm" > ✏️Edit <
                        /button> <
                        button onClick = {
                            () => handleDeleteProduct(product.id)
                        }
                        className = "bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm" > 🗑️Delete <
                        /button> < /
                        div > <
                        /div>
                    ))
                } {
                    myProducts.length === 0 && ( <
                        p className = "text-gray-600 dark:text-gray-400 col-span-full" > You haven 't added any products yet.</p>
                    )
                } <
                /div> < /
                div >
            )
        }

        {
            productView === 'others' && ( <
                div className = "products-section mb-8" >
                <
                h3 className = "text-lg font-semibold mb-4 dark:text-white" > Other Admins ' Products</h3> <
                div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" > {
                    otherProducts.map((product) => ( <
                        div key = { product.id }
                        className = "bg-white dark:bg-gray-800 p-4 rounded shadow" >
                        <
                        div className = "product-info mb-4" >
                        <
                        h3 className = "font-semibold dark:text-white" > { product.name } < /h3> <
                        p className = "text-gray-600 dark:text-gray-400" > { product.description } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 📦Category: { product.category } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 📦Sub Category: { product.sub_category } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 💵Amount: { product.amount } { product.unit } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 💰Price: Br. { product.price } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 🏭Manufacturer: { product.manufacturer || 'N/A' } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 📅Expiry: { product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : 'N/A' } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 👤Added by: { product.created_by_name } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 📅Created: { new Date(product.created_at).toLocaleDateString() } < /p> < /
                        div > <
                        /div>
                    ))
                } {
                    otherProducts.length === 0 && ( <
                        p className = "text-gray-600 dark:text-gray-400 col-span-full" > No products from other admins found. < /p>
                    )
                } <
                /div> < /
                div >
            )
        }

        {
            productView === 'all' && ( <
                div className = "products-section mb-8" >
                <
                h3 className = "text-lg font-semibold mb-4 dark:text-white" > All Products < /h3> <
                div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" > {
                    products.map((product) => ( <
                        div key = { product.id }
                        className = "bg-white dark:bg-gray-800 p-4 rounded shadow" >
                        <
                        div className = "product-info mb-4" >
                        <
                        h3 className = "font-semibold dark:text-white" > { product.name } < /h3> <
                        p className = "text-gray-600 dark:text-gray-400" > { product.description } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 📦Category: { product.category } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 📦Sub Category: { product.sub_category } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 💵Amount: { product.amount } { product.unit } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 💰Price: ብር { product.price } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 🏭Manufacturer: { product.manufacturer || 'N/A' } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 📅Expiry: { product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : 'N/A' } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 👤Added by: { product.created_by_name || 'You' } < /p> <
                        p className = "text-gray-600 dark:text-gray-400" > 📅Created: { new Date(product.created_at).toLocaleDateString() } < /p> < /
                        div > {
                            product.created_by_admin_id === user.id && ( <
                                div className = "flex space-x-2" >
                                <
                                button onClick = {
                                    () => handleEditProduct(product)
                                }
                                className = "bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm" > ✏️Edit <
                                /button> <
                                button onClick = {
                                    () => handleDeleteProduct(product.id)
                                }
                                className = "bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm" > 🗑️Delete <
                                /button> < /
                                div >
                            )
                        } <
                        /div>
                    ))
                } {
                    products.length === 0 && ( <
                        p className = "text-gray-600 dark:text-gray-400 col-span-full" > No products found. < /p>
                    )
                } <
                /div> < /
                div >
            )
        } <
        /div>
    )
}

{ /* Requests Tab */ } {
    activeTab === 'requests' && ( <
            div className = "requests-tab" >
            <
            div className = "tab-header mb-6" >
            <
            h2 className = "text-xl font-semibold dark:text-white" > Request Management < /h2> <
            p className = "text-gray-600 dark:text-gray-400" > Managing requests from farmers in your woreda < /p>

            <
            div className = "filters mt-4 flex flex-wrap gap-4" >
            <
            div >
            <
            label className = "block text-gray-700 dark:text-gray-300 mb-2" > Filter by Status: < /label> <
            select value = { statusFilter }
            onChange = {
                (e) => setStatusFilter(e.target.value)
            }
            className = "border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" >
            <
            option value = "all" > All Statuses < /option> <
            option value = "Pending" > Pending < /option> <
            option value = "Approved" > Approved < /option> <
            option value = "Accepted" > Accepted < /option> <
            option value = "Rejected" > Rejected < /option> < /
            select > <
            /div>

            <
            div >
            <
            label className = "block text-gray-700 dark:text-gray-300 mb-2" > Filter by Kebele: < /label> <
            select value = { kebeleFilter }
            onChange = {
                (e) => setKebeleFilter(e.target.value)
            }
            className = "border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" >
            <
            option value = "all" > All Kebeles < /option> {
            kebeles.map(kebele => ( <
                option key = { kebele }
                value = { kebele } > { kebele } < /option>
            ))
        } <
        /select> < /
    div >

        <
        div className = "bulk-actions" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Bulk Actions: < /label> <
    div className = "flex gap-2" >
        <
        select value = { bulkAction }
    onChange = {
        (e) => setBulkAction(e.target.value)
    }
    className = "border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" >
        <
        option value = "" > Select Action < /option> <
    option value = "approve" > Approve < /option> <
    option value = "accept" > Accept < /option> <
    option value = "reject" > Reject < /option> < /
    select > <
        button onClick = { handleBulkUpdate }
    className = "bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded" >
        Apply <
        /button> < /
    div > <
        /div> < /
    div > <
        /div>

    <
    div className = "overflow-x-auto" >
        <
        table className = "min-w-full bg-white dark:bg-gray-800 rounded shadow" >
        <
        thead >
        <
        tr className = "bg-gray-100 dark:bg-gray-700" >
        <
        th className = "py-2 px-4 text-left" >
        <
        input type = "checkbox"
    checked = { selectedRequests.length > 0 && selectedRequests.length === filteredRequests.filter(r => canWoredaAdminAct(r)).length }
    onChange = { selectAllRequests }
    className = "mr-2" /
        >
        Select <
        /th> <
    th className = "py-2 px-4 text-left" > Farmer < /th> <
    th className = "py-2 px-4 text-left" > Product < /th> <
    th className = "py-2 px-4 text-left" > Quantity < /th> <
    th className = "py-2 px-4 text-left" > Price < /th> <
    th className = "py-2 px-4 text-left" > Kebele < /th> <
    th className = "py-2 px-4 text-left" > Phone < /th> <
    th className = "py-2 px-4 text-left" > Status < /th> <
    th className = "py-2 px-4 text-left" > Actions < /th> < /
    tr > <
        /thead> <
    tbody > {
            filteredRequests.map((request) => ( <
                tr key = { request.id }
                className = "border-t border-gray-200 dark:border-gray-700" >
                <
                td className = "py-2 px-4" > {
                    canWoredaAdminAct(request) && ( <
                        input type = "checkbox"
                        checked = { selectedRequests.includes(request.id) }
                        onChange = {
                            () => toggleRequestSelection(request.id)
                        }
                        className = "mr-2" /
                        >
                    )
                } <
                /td> <
                td className = "py-2 px-4" > { request.farmer_name } < /td> <
                td className = "py-2 px-4" > { request.product_name } < /td> <
                td className = "py-2 px-4" > { request.quantity } < /td> <
                td className = "py-2 px-4" > Br { request.product_price } < /td> <
                td className = "py-2 px-4" > { request.kebele_name } < /td> <
                td className = "py-2 px-4" > { request.farmer_phone } < /td> <
                td className = "py-2 px-4" > { getStatusBadge(request.status) } < /td> <
                td className = "py-2 px-4" >
                <
                div className = "flex flex-wrap gap-2" >
                <
                button onClick = {
                    () => viewRequestDetails(request.id)
                }
                className = "bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-sm" > 👁️View <
                /button>

                {
                    canWoredaAdminAct(request) && ( <
                        >
                        <
                        button onClick = {
                            () => handleStatusUpdate(request, 'Approved')
                        }
                        className = "bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-sm" > ✅Approve <
                        /button> <
                        button onClick = {
                            () => handleStatusUpdate(request, 'Accepted')
                        }
                        className = "bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-sm" > ✔️Accept <
                        /button> <
                        button onClick = {
                            () => handleStatusUpdate(request, 'Rejected')
                        }
                        className = "bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-sm" > ❌Reject <
                        /button> < / >
                    )
                }

                {
                    canDeleteRequest(request) && ( <
                        button onClick = {
                            () => handleDeleteRequest(request.id)
                        }
                        className = "bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-sm" > 🗑️Delete <
                        /button>
                    )
                } <
                /div> < /
                td > <
                /tr>
            ))
        } {
            filteredRequests.length === 0 && ( <
                tr >
                <
                td colSpan = "9"
                className = "py-4 px-4 text-center text-gray-600 dark:text-gray-400" >
                No requests found with the current filters. <
                /td> < /
                tr >
            )
        } <
        /tbody> < /
    table > <
        /div> < /
    div >
)
}

{ /* Reports Tab */ } {
    activeTab === 'reports' && ( <
        div className = "reports-tab" >
        <
        div className = "flex justify-between items-center mb-6" >
        <
        div >
        <
        h2 className = "text-xl font-semibold dark:text-white" > Report Management < /h2> <
        p className = "text-gray-600 dark:text-gray-400" > Managing admin reports in your scope < /p> < /
        div > <
        button onClick = {
            () => setShowReportModal(true)
        }
        className = "bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded" > ➕Create Report <
        /button> < /
        div >

        { /* Report Statistics */ } <
        div className = "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" >
        <
        div className = "bg-white dark:bg-gray-800 p-4 rounded shadow" >
        <
        h3 className = "text-2xl font-bold dark:text-white" > { reportStats.total_reports || 0 } < /h3> <
        p className = "text-gray-600 dark:text-gray-400" > Total Reports < /p> < /
        div > <
        div className = "bg-white dark:bg-gray-800 p-4 rounded shadow" >
        <
        h3 className = "text-2xl font-bold dark:text-white" > { reportStats.pending_reports || 0 } < /h3> <
        p className = "text-gray-600 dark:text-gray-400" > Pending Reports < /p> < /
        div > <
        div className = "bg-white dark:bg-gray-800 p-4 rounded shadow" >
        <
        h3 className = "text-2xl font-bold dark:text-white" > { reportStats.resolved_reports || 0 } < /h3> <
        p className = "text-gray-600 dark:text-gray-400" > Resolved Reports < /p> < /
        div > <
        div className = "bg-white dark:bg-gray-800 p-4 rounded shadow" >
        <
        h3 className = "text-2xl font-bold dark:text-white" > { reportStats.critical_priority || 0 } < /h3> <
        p className = "text-gray-600 dark:text-gray-400" > Critical Priority < /p> < /
        div > <
        /div>

        { /* Reports List */ } <
        div className = "bg-white dark:bg-gray-800 rounded shadow" >
        <
        div className = "p-4 border-b border-gray-200 dark:border-gray-700" >
        <
        h3 className = "text-lg font-semibold dark:text-white" > All Reports < /h3> < /
        div > <
        div className = "overflow-x-auto" >
        <
        table className = "min-w-full" >
        <
        thead className = "bg-gray-50 dark:bg-gray-700" >
        <
        tr >
        <
        th className = "py-2 px-4 text-left" > Title < /th> <
        th className = "py-2 px-4 text-left" > Type < /th> <
        th className = "py-2 px-4 text-left" > Reporter < /th> <
        th className = "py-2 px-4 text-left" > Reported < /th> <
        th className = "py-2 px-4 text-left" > Priority < /th> <
        th className = "py-2 px-4 text-left" > Status < /th> <
        th className = "py-2 px-4 text-left" > Actions < /th> < /
        tr > <
        /thead> <
        tbody > {
            reports.map((report) => ( <
                tr key = { report.id }
                className = "border-t border-gray-200 dark:border-gray-700" >
                <
                td className = "py-2 px-4" > { report.title } < /td> <
                td className = "py-2 px-4" > { report.report_type } < /td> <
                td className = "py-2 px-4" > { report.reporter_name } < /td> <
                td className = "py-2 px-4" > { report.reported_name } < /td> <
                td className = "py-2 px-4" >
                <
                span className = { `px-2 py-1 rounded-full text-xs font-medium ${
                                                                report.priority === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                                                report.priority === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                                                                report.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                                                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                            }` } > { report.priority } <
                /span> < /
                td > <
                td className = "py-2 px-4" >
                <
                span className = { `px-2 py-1 rounded-full text-xs font-medium ${
                                                                report.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                                                report.status === 'Under Review' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                                                report.status === 'Resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                                                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                                            }` } > { report.status } <
                /span> < /
                td > <
                td className = "py-2 px-4" >
                <
                div className = "flex space-x-2" > {
                    report.status === 'Pending' && ( <
                        >
                        <
                        button onClick = {
                            () => updateReportStatus(report.id, 'Under Review')
                        }
                        className = "bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-sm" >
                        Review <
                        /button> <
                        button onClick = {
                            () => updateReportStatus(report.id, 'Resolved')
                        }
                        className = "bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-sm" >
                        Resolve <
                        /button> <
                        button onClick = {
                            () => updateReportStatus(report.id, 'Dismissed')
                        }
                        className = "bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-sm" >
                        Dismiss <
                        /button> < / >
                    )
                } {
                    report.status === 'Under Review' && ( <
                        >
                        <
                        button onClick = {
                            () => updateReportStatus(report.id, 'Resolved')
                        }
                        className = "bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-sm" >
                        Resolve <
                        /button> <
                        button onClick = {
                            () => updateReportStatus(report.id, 'Dismissed')
                        }
                        className = "bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-sm" >
                        Dismiss <
                        /button> < / >
                    )
                } <
                /div> < /
                td > <
                /tr>
            ))
        } {
            reports.length === 0 && ( <
                tr >
                <
                td colSpan = "7"
                className = "py-4 px-4 text-center text-gray-600 dark:text-gray-400" >
                No reports found. <
                /td> < /
                tr >
            )
        } <
        /tbody> < /
        table > <
        /div> < /
        div > <
        /div>
    )
} <
/main> < /
div > <
    /div>

{ /* Admin Registration/Edit Modal */ } {
    showAdminModal && ( <
        div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
        <
        div className = "bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md" >
        <
        h2 className = "text-xl font-semibold mb-4 dark:text-white" > { editingAdmin ? 'Edit Kebele Admin' : 'Register Kebele Admin' } <
        /h2> <
        form onSubmit = { handleAdminSubmit } >
        <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Full Name < /label> <
        input type = "text"
        value = { adminForm.fullName }
        onChange = {
            (e) => setAdminForm({...adminForm, fullName: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        required /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Phone Number < /label> <
        input type = "tel"
        value = { adminForm.phoneNumber }
        onChange = {
            (e) => setAdminForm({...adminForm, phoneNumber: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        required /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Kebele Name < /label> <
        input type = "text"
        value = { adminForm.kebele_name }
        onChange = {
            (e) => setAdminForm({...adminForm, kebele_name: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Password < /label> <
        input type = "password"
        value = { adminForm.password }
        onChange = {
            (e) => setAdminForm({...adminForm, password: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        required = {!editingAdmin }
        placeholder = { editingAdmin ? "Leave blank to keep current password" : "" }
        /> < /
        div > {!editingAdmin && ( <
                div className = "mb-4" >
                <
                label className = "block text-gray-700 dark:text-gray-300 mb-2" > Confirm Password < /label> <
                input type = "password"
                value = { adminForm.confirmPassword }
                onChange = {
                    (e) => setAdminForm({...adminForm, confirmPassword: e.target.value })
                }
                className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                required /
                >
                <
                /div>
            )
        } <
        div className = "flex justify-end space-x-2" >
        <
        button type = "button"
        onClick = {
            () => {
                setShowAdminModal(false);
                setEditingAdmin(null);
                setAdminForm({
                    fullName: '',
                    phoneNumber: '',
                    password: '',
                    confirmPassword: '',
                    role: 'Kebele',
                    kebele_name: ''
                });
            }
        }
        className = "bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-white" >
        Cancel <
        /button> <
        button type = "submit"
        className = "bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded" > { editingAdmin ? 'Update' : 'Register' } <
        /button> < /
        div > <
        /form> < /
        div > <
        /div>
    )
}

{ /* Farmer Registration/Edit Modal */ } {
    showFarmerModal && ( <
        div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
        <
        div className = "bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" >
        <
        h2 className = "text-xl font-semibold mb-4 dark:text-white" > { editingFarmer ? 'Edit Farmer' : 'Register New Farmer' } <
        /h2> <
        form onSubmit = { handleFarmerSubmit } >
        <
        div className = "grid grid-cols-1 md:grid-cols-2 gap-4" > { /* Basic Information */ } <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Full Name < /label> <
        input type = "text"
        value = { farmerForm.fullName }
        onChange = {
            (e) => setFarmerForm({...farmerForm, fullName: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        required /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Phone Number < /label> <
        input type = "tel"
        value = { farmerForm.phoneNumber }
        onChange = {
            (e) => setFarmerForm({...farmerForm, phoneNumber: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        required /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Kebele Name < /label> <
        input type = "text"
        value = { farmerForm.kebele_name }
        onChange = {
            (e) => setFarmerForm({...farmerForm, kebele_name: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        required /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Password < /label> <
        input type = "password"
        value = { farmerForm.password }
        onChange = {
            (e) => setFarmerForm({...farmerForm, password: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        required = {!editingFarmer }
        placeholder = { editingFarmer ? "Leave blank to keep current password" : "" }
        /> < /
        div > {!editingFarmer && ( <
                div className = "mb-4" >
                <
                label className = "block text-gray-700 dark:text-gray-300 mb-2" > Confirm Password < /label> <
                input type = "password"
                value = { farmerForm.confirmPassword }
                onChange = {
                    (e) => setFarmerForm({...farmerForm, confirmPassword: e.target.value })
                }
                className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                required /
                >
                <
                /div>
            )
        }

        { /* Agricultural Information */ } <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Land Size(Hectares) < /label> <
        input type = "number"
        step = "0.01"
        value = { farmerForm.landSizeHectares }
        onChange = {
            (e) => setFarmerForm({...farmerForm, landSizeHectares: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Crop Types < /label> <
        input type = "text"
        value = { farmerForm.cropTypes }
        onChange = {
            (e) => setFarmerForm({...farmerForm, cropTypes: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Land Type < /label> <
        input type = "text"
        value = { farmerForm.landType }
        onChange = {
            (e) => setFarmerForm({...farmerForm, landType: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Crops Season < /label> <
        input type = "text"
        value = { farmerForm.cropsSeason }
        onChange = {
            (e) => setFarmerForm({...farmerForm, cropsSeason: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Farming Experience < /label> <
        input type = "text"
        value = { farmerForm.farmingExperience }
        onChange = {
            (e) => setFarmerForm({...farmerForm, farmingExperience: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Irrigation Type < /label> <
        input type = "text"
        value = { farmerForm.irrigationType }
        onChange = {
            (e) => setFarmerForm({...farmerForm, irrigationType: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Farming Method < /label> <
        input type = "text"
        value = { farmerForm.farmingMethod }
        onChange = {
            (e) => setFarmerForm({...farmerForm, farmingMethod: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Primary Crops < /label> <
        input type = "text"
        value = { farmerForm.primaryCrops }
        onChange = {
            (e) => setFarmerForm({...farmerForm, primaryCrops: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Secondary Crops < /label> <
        input type = "text"
        value = { farmerForm.secondaryCrops }
        onChange = {
            (e) => setFarmerForm({...farmerForm, secondaryCrops: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Soil Type < /label> <
        input type = "text"
        value = { farmerForm.soilType }
        onChange = {
            (e) => setFarmerForm({...farmerForm, soilType: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Has Livestock < /label> <
        input type = "checkbox"
        checked = { farmerForm.hasLivestock }
        onChange = {
            (e) => setFarmerForm({...farmerForm, hasLivestock: e.target.checked })
        }
        className = "mr-2" /
        >
        <
        span className = "text-gray-700 dark:text-gray-300" > Yes, I have livestock < /span> < /
        div > <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Livestock Types < /label> <
        input type = "text"
        value = { farmerForm.livestockTypes }
        onChange = {
            (e) => setFarmerForm({...farmerForm, livestockTypes: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        disabled = {!farmerForm.hasLivestock }
        /> < /
        div > <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Annual Income < /label> <
        input type = "number"
        value = { farmerForm.annualIncome }
        onChange = {
            (e) => setFarmerForm({...farmerForm, annualIncome: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Education Level < /label> <
        select value = { farmerForm.educationLevel }
        onChange = {
            (e) => setFarmerForm({...farmerForm, educationLevel: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" >
        <
        option value = "" > Select Education Level < /option> <
        option value = "No formal education" > No formal education < /option> <
        option value = "Primary school" > Primary school < /option> <
        option value = "Secondary school" > Secondary school < /option> <
        option value = "High school" > High school < /option> <
        option value = "College/University" > College / University < /option> < /
        select > <
        /div> < /
        div > <
        div className = "flex justify-end space-x-2 mt-6" >
        <
        button type = "button"
        onClick = {
            () => {
                setShowFarmerModal(false);
                setEditingFarmer(null);
                resetFarmerForm();
            }
        }
        className = "bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-white" >
        Cancel <
        /button> <
        button type = "submit"
        className = "bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded" > { editingFarmer ? 'Update' : 'Register' } <
        /button> < /
        div > <
        /form> < /
        div > <
        /div>
    )
}

{ /* Product Add/Edit Modal */ } {
    showProductModal && ( <
        div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
        <
        div className = "bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md" >
        <
        h2 className = "text-xl font-semibold mb-4 dark:text-white" > { editingProduct ? 'Edit Product' : 'Add New Product' } <
        /h2> <
        form onSubmit = { handleProductSubmit } >
        <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Product Name < /label> <
        input type = "text"
        value = { productForm.name }
        onChange = {
            (e) => setProductForm({...productForm, name: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        required /
        >
        {
            productErrors.name && < p className = "text-red-500 text-sm mt-1" > { productErrors.name } < /p>}
        } <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Description < /label> <
        textarea value = { productForm.description }
        onChange = {
            (e) => setProductForm({...productForm, description: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        rows = "3" >
        <
        /textarea> < /
        div > <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Category < /label> <
        input type = "text"
        value = { productForm.category }
        onChange = {
            (e) => setProductForm({...productForm, category: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        required /
        >
        {
            productErrors.category && < p className = "text-red-500 text-sm mt-1" > { productErrors.category } < /p>}
        } <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Sub Category < /label> <
        input type = "text"
        value = { productForm.sub_category }
        onChange = {
            (e) => setProductForm({...productForm, sub_category: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        required /
        >
        {
            productErrors.sub_category && < p className = "text-red-500 text-sm mt-1" > { productErrors.sub_category } < /p>}
        } <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Amount < /label> <
        input type = "number"
        min = "1"
        step = "1"
        value = { productForm.amount }
        onChange = {
            (e) => setProductForm({...productForm, amount: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        required /
        >
        {
            productErrors.amount && < p className = "text-red-500 text-sm mt-1" > { productErrors.amount } < /p>}
        } <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Unit < /label> <
        input type = "text"
        value = { productForm.unit }
        onChange = {
            (e) => setProductForm({...productForm, unit: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        placeholder = "e.g., kg, pieces, liters"
        required /
        >
        {
            productErrors.unit && < p className = "text-red-500 text-sm mt-1" > { productErrors.unit } < /p>}
        } <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Price < /label> <
        input type = "number"
        value = { productForm.price }
        onChange = {
            (e) => setProductForm({...productForm, price: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        step = "0.01"
        min = "0.01"
        required /
        >
        {
            productErrors.price && < p className = "text-red-500 text-sm mt-1" > { productErrors.price } < /p>}
        } <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Manufacturer < /label> <
        input type = "text"
        value = { productForm.manufacturer }
        onChange = {
            (e) => setProductForm({...productForm, manufacturer: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Expiry Date < /label> <
        input type = "date"
        value = { productForm.expiry_date }
        onChange = {
            (e) => setProductForm({...productForm, expiry_date: e.target.value })
        }
        className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        required /
        >
        {
            productErrors.expiry_date && < p className = "text-red-500 text-sm mt-1" > { productErrors.expiry_date } < /p>}
        } <
        /div> <
        div className = "flex justify-end space-x-2" >
        <
        button type = "button"
        onClick = {
            () => {
                setShowProductModal(false);
                setEditingProduct(null);
                setProductForm({
                    name: '',
                    description: '',
                    category: '',
                    sub_category: '',
                    amount: '',
                    price: '',
                    unit: '',
                    manufacturer: '',
                    expiry_date: ''
                });
                setProductErrors({});
            }
        }
        className = "bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-white" >
        Cancel <
        /button> <
        button type = "submit"
        className = "bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded" > { editingProduct ? 'Update' : 'Add' } <
        /button> < /
        div > <
        /form> < /
        div > <
        /div>
    )
}

{ /* Request Status Update Modal */ } {
    showRequestModal && selectedRequest && ( <
            div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
            <
            div className = "bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" >
            <
            h2 className = "text-xl font-semibold mb-4 dark:text-white" > Request Details < /h2>

            <
            div className = "mb-6" >
            <
            h3 className = "font-semibold text-lg dark:text-white" > Request Information < /h3> <
            div className = "grid grid-cols-1 md:grid-cols-2 gap-4 mt-2" >
            <
            div >
            <
            p className = "text-gray-600 dark:text-gray-300" > < strong > Farmer: < /strong> {selectedRequest.farmer_name}</p >
            <
            p className = "text-gray-600 dark:text-gray-300" > < strong > Phone: < /strong> {selectedRequest.farmer_phone}</p >
            <
            p className = "text-gray-600 dark:text-gray-300" > < strong > Kebele: < /strong> {selectedRequest.kebele_name}</p >
            <
            /div> <
            div >
            <
            p className = "text-gray-600 dark:text-gray-300" > < strong > Product: < /strong> {selectedRequest.product_name}</p >
            <
            p className = "text-gray-600 dark:text-gray-300" > < strong > Quantity: < /strong> {selectedRequest.quantity}</p >
            <
            p className = "text-gray-600 dark:text-gray-300" > < strong > Request Date: < /strong> {new Date(selectedRequest.created_at).toLocaleString()}</p >
            <
            p className = "text-gray-600 dark:text-gray-300" > < strong > Status: < /strong> {getStatusBadge(selectedRequest.status)}</p >
            <
            /div> < /
            div > <
            /div>

            { /* Status at different levels */ } <
            div className = "mb-6" >
            <
            h3 className = "font-semibold text-lg dark:text-white" > Approval Status < /h3> { getLevelStatus('kebele', selectedRequest) } { getLevelStatus('woreda', selectedRequest) } { getLevelStatus('zone', selectedRequest) } { getLevelStatus('region', selectedRequest) } < /
            div >

            {
                requestStatus && ( <
                    div className = "mb-6" >
                    <
                    h3 className = "font-semibold text-lg dark:text-white" > Update Status < /h3> <
                    div className = "mt-4" >
                    <
                    label className = "block text-gray-700 dark:text-gray-300 mb-2" > Decision Reason(Optional): < /label> <
                    textarea value = { decisionReason }
                    onChange = {
                        (e) => setDecisionReason(e.target.value)
                    }
                    className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    rows = "3"
                    placeholder = "Provide reason for your decision" >
                    <
                    /textarea> < /
                    div > <
                    /div>
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
            className = "bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-white" >
            Close <
            /button> {
            requestStatus && ( <
                button onClick = { confirmStatusUpdate }
                className = { `py-2 px-4 rounded text-white ${
                                        requestStatus === 'Rejected' ? 'bg-red-500 hover:bg-red-600' : 
                                        requestStatus === 'Accepted' ? 'bg-green-500 hover:bg-green-600' : 
                                        'bg-blue-500 hover:bg-blue-600'
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

{ /* Report Creation Modal */ } {
    showReportModal && ( <
            div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
            <
            div className = "bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md" >
            <
            h2 className = "text-xl font-semibold mb-4 dark:text-white" > Create Report < /h2> <
            form onSubmit = { handleReportSubmit } >
            <
            div className = "mb-4" >
            <
            label className = "block text-gray-700 dark:text-gray-300 mb-2" > Reported Admin < /label> <
            select value = { reportForm.reported_admin_id }
            onChange = {
                (e) => setReportForm({...reportForm, reported_admin_id: e.target.value })
            }
            className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            required >
            <
            option value = "" > Select Admin to Report < /option> {
            admins.map((admin) => ( <
                option key = { admin.id }
                value = { admin.id } > { admin.full_name }({ admin.role }) - { admin.kebele_name } <
                /option>
            ))
        } <
        /select> < /
    div > <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Report Type < /label> <
    select value = { reportForm.report_type }
    onChange = {
        (e) => setReportForm({...reportForm, report_type: e.target.value })
    }
    className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
    required >
        <
        option value = "Misconduct" > Misconduct < /option> <
    option value = "Incompetence" > Incompetence < /option> <
    option value = "Abuse of Power" > Abuse of Power < /option> <
    option value = "Corruption" > Corruption < /option> <
    option value = "Other" > Other < /option> < /
    select > <
        /div> <
    div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Title < /label> <
    input type = "text"
    value = { reportForm.title }
    onChange = {
        (e) => setReportForm({...reportForm, title: e.target.value })
    }
    className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
    required /
        >
        <
        /div> <
    div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Description < /label> <
    textarea value = { reportForm.description }
    onChange = {
        (e) => setReportForm({...reportForm, description: e.target.value })
    }
    className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
    rows = "4"
    required >
        <
        /textarea> < /
    div > <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Evidence(Optional) < /label> <
    textarea value = { reportForm.evidence }
    onChange = {
        (e) => setReportForm({...reportForm, evidence: e.target.value })
    }
    className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
    rows = "3"
    placeholder = "Provide any evidence or additional details" >
        <
        /textarea> < /
    div > <
        div className = "mb-4" >
        <
        label className = "block text-gray-700 dark:text-gray-300 mb-2" > Priority < /label> <
    select value = { reportForm.priority }
    onChange = {
        (e) => setReportForm({...reportForm, priority: e.target.value })
    }
    className = "w-full border border-gray-300 rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" >
        <
        option value = "Low" > Low < /option> <
    option value = "Medium" > Medium < /option> <
    option value = "High" > High < /option> <
    option value = "Critical" > Critical < /option> < /
    select > <
        /div> <
    div className = "flex justify-end space-x-2" >
        <
        button type = "button"
    onClick = {
        () => {
            setShowReportModal(false);
            setReportForm({
                reported_admin_id: '',
                report_type: 'Misconduct',
                title: '',
                description: '',
                evidence: '',
                priority: 'Medium'
            });
        }
    }
    className = "bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-white" >
        Cancel <
        /button> <
    button type = "submit"
    className = "bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded" >
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

export default WoredaDashboard;