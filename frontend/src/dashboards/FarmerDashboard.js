import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Moon, 
    Sun, 
    Package, 
    Truck, 
    ShoppingCart, 
    LogOut, 
    Plus, 
    Edit, 
    Trash2, 
    Eye, 
    Check,
    MapPin,
    Calendar,
    User,
    Building
} from 'lucide-react';

const FarmerDashboard = () => {
    const [activeTab, setActiveTab] = useState('requests');
    const [user, setUser] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [language, setLanguage] = useState('en'); // 'en' for English, 'am' for Amharic
    const [statusFilter, setStatusFilter] = useState('all'); // Filter for request status
    const navigate = useNavigate();

    // Request Management State
    const [requests, setRequests] = useState([]);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [editingRequest, setEditingRequest] = useState(null);
    const [requestForm, setRequestForm] = useState({
        product_id: '',
        quantity: '',
        note: ''
    });

    // Products State
    const [products, setProducts] = useState([]);
    
    // Deliveries State
    const [deliveries, setDeliveries] = useState([]);
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [confirmingDelivery, setConfirmingDelivery] = useState(null);
    const [deliveryNote, setDeliveryNote] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user') || 'null');
        const userType = localStorage.getItem('userType');

        if (!token || userType !== 'Farmer' || !userData) {
            navigate('/login');
            return;
        }

        setUser(userData);
        fetchDashboardData();
        
        // Load preferences
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        const savedLanguage = localStorage.getItem('language') || 'en';
        setDarkMode(savedDarkMode);
        setLanguage(savedLanguage);
    }, [navigate]);

    useEffect(() => {
        // Apply dark mode to the entire document
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const fetchDashboardData = async() => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Fetch ALL products available in the country
            const productsResponse = await fetch('http://localhost:5000/api/farmers/products', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (productsResponse.ok) {
                const productsData = await productsResponse.json();
                setProducts(productsData);
            } else {
                console.error('Failed to fetch products');
                setError('Failed to load products');
            }

            // Fetch farmer's requests
            const requestsResponse = await fetch('http://localhost:5000/api/farmers/requests', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (requestsResponse.ok) {
                const requestsData = await requestsResponse.json();
                setRequests(requestsData);
            } else {
                console.error('Failed to fetch requests');
            }

            // Fetch farmer's deliveries
            const deliveriesResponse = await fetch('http://localhost:5000/api/farmers/deliveries', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (deliveriesResponse.ok) {
                const deliveriesData = await deliveriesResponse.json();
                setDeliveries(deliveriesData);
            } else {
                console.error('Failed to fetch deliveries');
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Error loading dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const fetchRequestStatusDetail = async(requestId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/farmers/request/${requestId}/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const statusData = await response.json();
                setSelectedRequest(statusData);
                setShowStatusModal(true);
            } else {
                alert('Failed to fetch request status details');
            }
        } catch (error) {
            console.error('Error fetching status details:', error);
            alert('Error fetching status details');
        }
    };

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('darkMode', newDarkMode.toString());
    };

    const toggleLanguage = () => {
        const newLanguage = language === 'en' ? 'am' : 'en';
        setLanguage(newLanguage);
        localStorage.setItem('language', newLanguage);
    };

    // Translation object
    const translations = {
        en: {
            farmerPortal: 'Farmer Portal',
            myRequests: 'My Requests',
            myDeliveries: 'My Deliveries',
            availableProducts: 'Available Products',
            logout: 'Logout',
            welcome: 'Welcome',
            farmerDashboard: 'Farmer Dashboard',
            manageRequests: 'Manage your product requests',
            trackDeliveries: 'Track your confirmed deliveries',
            productsAvailable: 'Products available across the country',
            newRequest: 'New Request',
            viewDetails: 'View Details',
            confirmDelivery: 'Confirm Delivery',
            edit: 'Edit',
            delete: 'Delete',
            requestProduct: 'Request Product',
            noRequests: 'No requests found. Create your first request!',
            noDeliveries: 'No confirmed deliveries yet.',
            noProducts: 'No products available at the moment.',
            category: 'Category',
            price: 'Price',
            quantity: 'Quantity',
            date: 'Date',
            location: 'Location',
            subCategory: 'Sub-category',
            amount: 'Amount',
            manufacturer: 'Manufacturer',
            expires: 'Expires',
            added: 'Added',
            confirmed: 'Confirmed',
            delivered: 'Delivered',
            all: 'All',
            pending: 'Pending',
            approved: 'Approved',
            accepted: 'Accepted',
            rejected: 'Rejected',
            filterBy: 'Filter by Status',
            birr: 'Birr',
            units: 'units'
        },
        am: {
            farmerPortal: 'የገበሬ መግቢያ',
            myRequests: 'የእኔ ጥያቄዎች',
            myDeliveries: 'የእኔ መላኪያዎች',
            availableProducts: 'ያሉ ምርቶች',
            logout: 'ውጣ',
            welcome: 'እንኳን ደህና መጣህ',
            farmerDashboard: 'የገበሬ ዳሽቦርድ',
            manageRequests: 'የምርት ጥያቄዎችዎን ያስተዳድሩ',
            trackDeliveries: 'የተረጋገጡ መላኪያዎችዎን ይከታተሉ',
            productsAvailable: 'በሀገሪቱ ውስጥ ያሉ ምርቶች',
            newRequest: 'አዲስ ጥያቄ',
            viewDetails: 'ዝርዝር ይመልከቱ',
            confirmDelivery: 'መላኪያ ያረጋግጡ',
            edit: 'አርትዕ',
            delete: 'ሰርዝ',
            requestProduct: 'ምርት ጠይቅ',
            noRequests: 'ምንም ጥያቄዎች አልተገኙም። የመጀመሪያ ጥያቄዎን ይፍጠሩ!',
            noDeliveries: 'ገና የተረጋገጠ መላኪያ የለም።',
            noProducts: 'በአሁኑ ጊዜ ምንም ምርቶች አይገኙም።',
            category: 'ምድብ',
            price: 'ዋጋ',
            quantity: 'መጠን',
            date: 'ቀን',
            location: 'አካባቢ',
            subCategory: 'ንዑስ ምድብ',
            amount: 'መጠን',
            manufacturer: 'አምራች',
            expires: 'ያለቀበት',
            added: 'የተጨመረ',
            confirmed: 'የተረጋገጠ',
            delivered: 'የተላከ',
            all: 'ሁሉም',
            pending: 'በመጠባበቅ ላይ',
            approved: 'የተፈቀደ',
            accepted: 'የተቀበለ',
            rejected: 'የተከለከለ',
            filterBy: 'በሁኔታ አጣራ',
            birr: 'ብር',
            units: 'ክፍሎች'
        }
    };

    const t = translations[language];

    // Filter requests based on status
    const getFilteredRequests = () => {
        if (statusFilter === 'all') return requests;
        
        return requests.filter(request => {
            const levelStatuses = [
                request.kebele_status,
                request.woreda_status,
                request.zone_status,
                request.region_status,
                request.federal_status
            ];
            
            // Check if any level has rejected the request
            const hasRejection = levelStatuses.some(status => status === 'Rejected');
            
            // Check if any level has accepted the request (specifically Accepted)
            const hasAccepted = levelStatuses.some(status => status === 'Accepted');
            
            // Check if any level has approved the request (specifically Approved)
            const hasApproved = levelStatuses.some(status => status === 'Approved');
            
            // Determine display status based on priority and filter type
            if (statusFilter === 'rejected') {
                return hasRejection;
            } else if (statusFilter === 'accepted') {
                return hasAccepted && !hasRejection;
            } else if (statusFilter === 'approved') {
                return hasApproved && !hasRejection && !hasAccepted;
            } else if (statusFilter === 'pending') {
                return !hasRejection && !hasAccepted && !hasApproved;
            }
            
            return false;
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        localStorage.removeItem('darkMode');
        document.documentElement.classList.remove('dark');
        navigate('/login');
    };

    // Request Management Functions
    const handleRequestSubmit = async(e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            if (!requestForm.product_id || !requestForm.quantity) {
                alert('Product and quantity are required');
                return;
            }

            if (requestForm.quantity <= 0) {
                alert('Quantity must be greater than 0');
                return;
            }

            const url = editingRequest ?
                `http://localhost:5000/api/farmers/request/${editingRequest.id}` :
                'http://localhost:5000/api/farmers/request';

            const method = editingRequest ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    product_id: parseInt(requestForm.product_id),
                    quantity: parseInt(requestForm.quantity),
                    note: requestForm.note
                })
            });

            const responseData = await response.json();

            if (response.ok) {
                setShowRequestModal(false);
                setEditingRequest(null);
                setRequestForm({ product_id: '', quantity: '', note: '' });
                fetchDashboardData();
                alert(editingRequest ? 'Request updated successfully' : 'Request created successfully');
            } else {
                alert(responseData.message || 'Error processing request');
            }
        } catch (error) {
            console.error('Error processing request:', error);
            alert('Error processing request');
        }
    };

    const canEditOrDelete = (request) => {
        // Allow edit/delete only if all kebele and above statuses are still Pending
        const higherLevelStatuses = [
            request.kebele_status,
            request.woreda_status,
            request.zone_status,
            request.region_status,
            request.federal_status
        ];

        return higherLevelStatuses.every(status => status === 'Pending');
    };

    const canConfirmDelivery = (request) => {
        // Check if request is accepted at any level
        const levelStatuses = [
            request.kebele_status,
            request.woreda_status,
            request.zone_status,
            request.region_status,
            request.federal_status
        ];

        return levelStatuses.some(status => status === 'Accepted');
    };

    const handleEditRequest = (request) => {
        if (!canEditOrDelete(request)) {
            alert('Cannot edit request: It has been processed beyond farmer level');
            return;
        }

        setEditingRequest(request);
        setRequestForm({
            product_id: request.product_id.toString(),
            quantity: request.quantity.toString(),
            note: request.note || ''
        });
        setShowRequestModal(true);
    };

    const handleDeleteRequest = async(requestId) => {
        const request = requests.find(r => r.id === requestId);
        if (!canEditOrDelete(request)) {
            alert('Cannot delete request: It has been processed beyond farmer level');
            return;
        }

        if (window.confirm('Are you sure you want to delete this request?')) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5000/api/farmers/request/${requestId}`, {
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

    const handleConfirmDelivery = async(request) => {
        setConfirmingDelivery(request);
        setDeliveryNote('');
        setShowDeliveryModal(true);
    };

    const submitDeliveryConfirmation = async(e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/farmers/requests/${confirmingDelivery.id}/confirm-delivery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    note: deliveryNote
                })
            });

            const responseData = await response.json();

            if (response.ok) {
                setShowDeliveryModal(false);
                setConfirmingDelivery(null);
                setDeliveryNote('');
                fetchDashboardData();
                alert('Delivery confirmed successfully');
            } else {
                alert(responseData.message || 'Error confirming delivery');
            }
        } catch (error) {
            console.error('Error confirming delivery:', error);
            alert('Error confirming delivery');
        }
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            'Pending': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
            'Accepted': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
            'Rejected': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
            'Approved': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusClasses[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}>
                {status}
            </span>
        );
    };

    const getLevelStatus = (level, request) => {
        const status = request[`${level}_status`] || 'Pending';
        const admin = request[`${level}_admin_name`];
        const feedback = request[`${level}_feedback`];
        const date = request[`${level}_approved_at`];

        const formatLevel = level.charAt(0).toUpperCase() + level.slice(1);

        return (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <div className="flex items-center mb-2">
                    <Building className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">{formatLevel} Level</h4>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Status:</span>
                        {getStatusBadge(status)}
                    </div>
                    {admin && (
                        <div className="flex items-center">
                            <User className="w-3 h-3 mr-1 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Admin:</span>
                            <span className="text-sm text-gray-600 dark:text-gray-300">{admin}</span>
                        </div>
                    )}
                    {feedback && (
                        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Feedback:</span>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{feedback}</p>
                        </div>
                    )}
                    {date && (
                        <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Date:</span>
                            <span className="text-sm text-gray-600 dark:text-gray-300">{new Date(date).toLocaleString()}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center text-red-600">
                    <p className="text-xl">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
            {/* Sidebar */}
            <div className={`w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg p-4 flex flex-col`}>
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">{t.farmerPortal}</h2>

                    <nav className="flex-1">
                        <button 
                            className={`w-full py-2 px-4 rounded mb-2 text-left ${
                                activeTab === 'requests' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                            onClick={() => setActiveTab('requests')}
                        >
                            📦 {t.myRequests}
                        </button>

                        <button 
                            className={`w-full py-2 px-4 rounded mb-2 text-left ${
                                activeTab === 'deliveries' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                            onClick={() => setActiveTab('deliveries')}
                        >
                            🚚 {t.myDeliveries}
                        </button>

                        <button 
                            className={`w-full py-2 px-4 rounded mb-2 text-left ${
                                activeTab === 'products' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                            onClick={() => setActiveTab('products')}
                        >
                            🛒 {t.availableProducts}
                        </button>
                    </nav>

                    <div>
                        <button 
                            className="w-full py-2 px-4 rounded mb-2 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                            onClick={toggleDarkMode}
                        >
                            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                        </button>
                        <button 
                            className="w-full py-2 px-4 rounded mb-2 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                            onClick={toggleLanguage}
                        >
                            {language === 'en' ? '🇪🇹 አማርኛ' : '🇺🇸 English'}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full py-2 px-4 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50"
                        >
                            🚪 {t.logout}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm p-4 flex justify-between items-center`}>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {t.welcome}, {user?.fullName} ({t.farmerDashboard})
                    </h1>
                </header>

                <main className={`flex-1 p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                    {/* Requests Tab */}
                    {activeTab === 'requests' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.myRequests}</h2>
                                    <p className="text-gray-600 dark:text-gray-400">{t.manageRequests}</p>
                                </div>
                                <button 
                                    onClick={() => setShowRequestModal(true)}
                                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    <Plus size={20} className="mr-2" />
                                    {t.newRequest}
                                </button>
                            </div>

                            {/* Status Filter */}
                            <div className={`p-4 rounded shadow mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="flex items-center gap-4">
                                    <label className="text-gray-700 dark:text-gray-300 font-medium">{t.filterBy}:</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className={`p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}`}
                                    >
                                        <option value="all">{t.all}</option>
                                        <option value="pending">{t.pending}</option>
                                        <option value="approved">{t.approved}</option>
                                        <option value="accepted">{t.accepted}</option>
                                        <option value="rejected">{t.rejected}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {getFilteredRequests().map((request) => (
                                    <div key={request.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                    {request.product_name}
                                                </h3>
                                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center">
                                                        <Package className="w-3 h-3 mr-1 text-gray-500" />
                                                        <span className="font-medium mr-1">{t.category}:</span> {request.category}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="font-medium mr-1">{t.price}:</span> {request.price} {t.birr}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="font-medium mr-1">{t.quantity}:</span> {request.quantity} {request.unit || t.units}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Calendar className="w-3 h-3 mr-1 text-gray-500" />
                                                        <span className="font-medium mr-1">{t.date}:</span> {new Date(request.created_at).toLocaleDateString()}
                                                    </div>
                                                    {request.sub_category && (
                                                        <div className="flex items-center">
                                                            <span className="font-medium mr-1">{t.subCategory}:</span> {request.sub_category}
                                                        </div>
                                                    )}
                                                </div>
                                                {request.note && (
                                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                        <span className="font-medium">Note:</span> {request.note}
                                                    </p>
                                                )}
                                                <div className="mt-3 flex items-center space-x-3">
                                                    {(() => {
                                                        const levelStatuses = [
                                                            request.kebele_status,
                                                            request.woreda_status,
                                                            request.zone_status,
                                                            request.region_status,
                                                            request.federal_status
                                                        ];
                                                        
                                                        // Check if any level has rejected the request
                                                        const hasRejection = levelStatuses.some(status => status === 'Rejected');
                                                        
                                                        // Check if any level has accepted the request
                                                        const hasAccepted = levelStatuses.some(status => status === 'Accepted');
                                                        
                                                        // Check if any level has approved the request
                                                        const hasApproved = levelStatuses.some(status => status === 'Approved');
                                                        
                                                        // Determine display status: Rejected > Accepted > Approved > Original status
                                                        let displayStatus;
                                                        if (hasRejection) {
                                                            displayStatus = 'Rejected';
                                                        } else if (hasAccepted) {
                                                            displayStatus = 'Accepted';
                                                        } else if (hasApproved) {
                                                            displayStatus = 'Approved';
                                                        } else {
                                                            displayStatus = request.status;
                                                        }
                                                        
                                                        return getStatusBadge(displayStatus);
                                                    })()}
                                                    {request.handled_by_admin && (
                                                        <div className="flex items-center">
                                                            <User className="w-3 h-3 mr-1 text-gray-500" />
                                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                                Handled by: {request.handled_by_admin}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col space-y-2 ml-4">
                                                <button 
                                                    onClick={() => fetchRequestStatusDetail(request.id)}
                                                    className="flex items-center px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors text-sm"
                                                >
                                                    <Eye size={16} className="mr-1" />
                                                    {t.viewDetails}
                                                </button>

                                                {canConfirmDelivery(request) && (
                                                    <button 
                                                        onClick={() => handleConfirmDelivery(request)}
                                                        className="flex items-center px-3 py-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/50 rounded-lg transition-colors text-sm"
                                                    >
                                                        <Check size={16} className="mr-1" />
                                                        {t.confirmDelivery}
                                                    </button>
                                                )}

                                                {canEditOrDelete(request) && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleEditRequest(request)}
                                                            className="flex items-center px-3 py-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/50 rounded-lg transition-colors text-sm"
                                                        >
                                                            <Edit size={16} className="mr-1" />
                                                            {t.edit}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteRequest(request.id)}
                                                            className="flex items-center px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors text-sm"
                                                        >
                                                            <Trash2 size={16} className="mr-1" />
                                                            {t.delete}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {getFilteredRequests().length === 0 && (
                                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <Package size={48} className="mx-auto text-gray-400 mb-4" />
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {statusFilter === 'all' ? t.noRequests : 
                                                language === 'en' ? `No ${statusFilter} requests found.` : 
                                                `ምንም ${statusFilter === 'pending' ? 'በመጠባበቅ ላይ ያሉ' : 
                                                statusFilter === 'approved' ? 'የተፈቀዱ' : 
                                                statusFilter === 'accepted' ? 'የተቀበሉ' : 
                                                statusFilter === 'rejected' ? 'የተከለከሉ' : statusFilter} ጥያቄዎች አልተገኙም።`
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Deliveries Tab */}
                    {activeTab === 'deliveries' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.myDeliveries}</h2>
                                <p className="text-gray-600 dark:text-gray-400">{t.trackDeliveries}</p>
                            </div>

                            <div className="grid gap-4">
                                {deliveries.map((delivery) => (
                                    <div key={delivery.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                    {delivery.product_name}
                                                </h3>
                                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center">
                                                        <Package className="w-3 h-3 mr-1 text-gray-500" />
                                                        <span className="font-medium mr-1">{t.category}:</span> {delivery.category}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="font-medium mr-1">{t.price}:</span> {delivery.price} {t.birr}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="font-medium mr-1">{t.quantity}:</span> {delivery.quantity} {delivery.unit || t.units}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Calendar className="w-3 h-3 mr-1 text-gray-500" />
                                                        <span className="font-medium mr-1">{t.delivered}:</span> {new Date(delivery.delivered_at).toLocaleDateString()}
                                                    </div>
                                                    {delivery.sub_category && (
                                                        <div className="flex items-center">
                                                            <span className="font-medium mr-1">{t.subCategory}:</span> {delivery.sub_category}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                                    <p className="text-sm font-medium text-green-800 dark:text-green-400 mb-1">
                                                        Accepted by {delivery.accepted_role} Level
                                                    </p>
                                                    {delivery.accepted_admin_name && (
                                                        <p className="text-sm text-green-700 dark:text-green-300">
                                                            Admin: {delivery.accepted_admin_name}
                                                        </p>
                                                    )}
                                                    {delivery.confirmation_date && (
                                                        <p className="text-sm text-green-700 dark:text-green-300">
                                                            Confirmed: {new Date(delivery.confirmation_date).toLocaleString()}
                                                        </p>
                                                    )}
                                                    {delivery.confirmation_note && (
                                                        <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                                                            Note: {delivery.confirmation_note}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="ml-4">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700">
                                                    <Check className="w-3 h-3 mr-1" />
                                                    Confirmed
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {deliveries.length === 0 && (
                                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <Truck size={48} className="mx-auto text-gray-400 mb-4" />
                                        <p className="text-gray-600 dark:text-gray-400">{t.noDeliveries}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Products Tab */}
                    {activeTab === 'products' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.availableProducts}</h2>
                                <p className="text-gray-600 dark:text-gray-400">{t.productsAvailable}</p>
                            </div>

                            <div className="grid gap-4">
                                {products.map((product) => (
                                    <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                    {product.name}
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-400 mb-4">{product.description}</p>
                                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center">
                                                        <Package className="w-3 h-3 mr-1 text-gray-500" />
                                                        <span className="font-medium mr-1">{t.category}:</span> {product.category}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="font-medium mr-1">{t.subCategory}:</span> {product.sub_category || 'N/A'}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="font-medium mr-1">{t.amount}:</span> {product.amount} {product.unit || t.units}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="font-medium mr-1">{t.price}:</span> {product.price} {t.birr}
                                                    </div>
                                                    {product.manufacturer && (
                                                        <div className="flex items-center">
                                                            <Building className="w-3 h-3 mr-1 text-gray-500" />
                                                            <span className="font-medium mr-1">{t.manufacturer}:</span> {product.manufacturer}
                                                        </div>
                                                    )}
                                                    {product.admin_location && (
                                                        <div className="flex items-center col-span-2">
                                                            <MapPin className="w-3 h-3 mr-1 text-gray-500" />
                                                            <span className="font-medium mr-1">{t.location}:</span> {product.admin_location}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center">
                                                        <Calendar className="w-3 h-3 mr-1 text-gray-500" />
                                                        <span className="font-medium mr-1">{t.added}:</span> {new Date(product.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                {product.expiry_date && (
                                                    <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                                                        <div className="flex items-center text-amber-600 dark:text-amber-400">
                                                            <Calendar className="w-3 h-3 mr-1" />
                                                            <span className="text-sm font-medium">{t.expires}:</span>
                                                            <span className="text-sm ml-1">{new Date(product.expiry_date).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="ml-4">
                                                <button 
                                                    onClick={() => {
                                                        setRequestForm({
                                                            product_id: product.id.toString(),
                                                            quantity: '',
                                                            note: ''
                                                        });
                                                        setEditingRequest(null);
                                                        setShowRequestModal(true);
                                                    }}
                                                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                                >
                                                    <Package size={16} className="mr-2" />
                                                    {t.requestProduct}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {products.length === 0 && (
                                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
                                        <p className="text-gray-600 dark:text-gray-400">{t.noProducts}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                {editingRequest ? t.edit + ' ' + t.newRequest : t.newRequest}
                            </h3>
                            <form onSubmit={handleRequestSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t.availableProducts}:
                                    </label>
                                    <select 
                                        value={requestForm.product_id}
                                        onChange={(e) => setRequestForm({...requestForm, product_id: e.target.value})}
                                        disabled={editingRequest}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">{language === 'en' ? 'Select a product' : 'ምርት ይምረጡ'}</option>
                                        {products.map((product) => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} - {product.category} ({product.price} Birr)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t.quantity}:
                                    </label>
                                    <input 
                                        type="number"
                                        min="1"
                                        value={requestForm.quantity}
                                        onChange={(e) => setRequestForm({...requestForm, quantity: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {language === 'en' ? 'Note (Optional)' : 'ማስታወሻ (አማራጭ)'}:
                                    </label>
                                    <textarea 
                                        value={requestForm.note}
                                        onChange={(e) => setRequestForm({...requestForm, note: e.target.value})}
                                        rows="3"
                                        placeholder={language === 'en' ? 'Any additional information about your request...' : 'ስለ ጥያቄዎ ተጨማሪ መረጃ...'}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button 
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                    >
                                        {editingRequest ? (language === 'en' ? 'Update Request' : 'ጥያቄ አዘምን') : (language === 'en' ? 'Create Request' : 'ጥያቄ ፍጠር')}
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setShowRequestModal(false);
                                            setEditingRequest(null);
                                            setRequestForm({ product_id: '', quantity: '', note: '' });
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Detail Modal */}
            {showStatusModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{language === 'en' ? 'Request Status Details' : 'የጥያቄ ሁኔታ ዝርዝሮች'}</h3>
                            
                            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center mb-3">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mr-3">{language === 'en' ? 'Overall Status' : 'አጠቃላይ ሁኔታ'}:</h4>
                                    {(() => {
                                        const levelStatuses = [
                                            selectedRequest.kebele_status,
                                            selectedRequest.woreda_status,
                                            selectedRequest.zone_status,
                                            selectedRequest.region_status,
                                            selectedRequest.federal_status
                                        ];
                                        
                                        // Check if any level has rejected the request
                                        const hasRejection = levelStatuses.some(status => status === 'Rejected');
                                        
                                        // Check if any level has accepted the request
                                        const hasAccepted = levelStatuses.some(status => status === 'Accepted');
                                        
                                        // Check if any level has approved the request
                                        const hasApproved = levelStatuses.some(status => status === 'Approved');
                                        
                                        // Determine display status: Rejected > Accepted > Approved > Original status
                                        let displayStatus;
                                        if (hasRejection) {
                                            displayStatus = 'Rejected';
                                        } else if (hasAccepted) {
                                            displayStatus = 'Accepted';
                                        } else if (hasApproved) {
                                            displayStatus = 'Approved';
                                        } else {
                                            displayStatus = selectedRequest.status;
                                        }
                                        
                                        return getStatusBadge(displayStatus);
                                    })()}
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center">
                                        <Package className="w-3 h-3 mr-1 text-gray-500" />
                                        <span className="font-medium mr-1">Product:</span> {selectedRequest.product_name}
                                    </div>
                                    <div className="flex items-center">
                                        <span className="font-medium mr-1">Quantity:</span> {selectedRequest.quantity} {selectedRequest.unit || 'units'}
                                    </div>
                                    <div className="flex items-center">
                                        <span className="font-medium mr-1">Price:</span> {selectedRequest.price} Birr
                                    </div>
                                </div>
                                {selectedRequest.note && (
                                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                                        <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Note:</span>
                                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{selectedRequest.note}</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 dark:text-white">{language === 'en' ? 'Approval Levels' : 'የፈቃድ ደረጃዎች'}:</h4>
                                <div className="grid gap-4">
                                    {getLevelStatus('kebele', selectedRequest)}
                                    {getLevelStatus('woreda', selectedRequest)}
                                    {getLevelStatus('zone', selectedRequest)}
                                    {getLevelStatus('region', selectedRequest)}
                                    {getLevelStatus('federal', selectedRequest)}
                                </div>
                            </div>

                            <div className="flex justify-end pt-6">
                                <button 
                                    onClick={() => {
                                        setShowStatusModal(false);
                                        setSelectedRequest(null);
                                    }}
                                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                                >
                                    {language === 'en' ? 'Close' : 'ዝጋ'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delivery Confirmation Modal */}
            {showDeliveryModal && confirmingDelivery && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t.confirmDelivery}</h3>
                            
                            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <p className="font-medium text-green-800 dark:text-green-400">
                                    {language === 'en' ? 'Product' : 'ምርት'}: {confirmingDelivery.product_name}
                                </p>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    {t.quantity}: {confirmingDelivery.quantity}
                                </p>
                            </div>

                            <form onSubmit={submitDeliveryConfirmation} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {language === 'en' ? 'Confirmation Note (Optional)' : 'የማረጋገጫ ማስታወሻ (አማራጭ)'}:
                                    </label>
                                    <textarea 
                                        value={deliveryNote}
                                        onChange={(e) => setDeliveryNote(e.target.value)}
                                        rows="3"
                                        placeholder={language === 'en' ? 'Any notes about the delivery...' : 'ስለ መላኪያው ማስታወሻ...'}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="flex space-x-3">
                                    <button 
                                        type="submit"
                                        className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                    >
                                        <Check size={16} className="mr-2" />
                                        {t.confirmDelivery}
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setShowDeliveryModal(false);
                                            setConfirmingDelivery(null);
                                            setDeliveryNote('');
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FarmerDashboard;