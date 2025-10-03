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
    Building,
    AlertTriangle
} from 'lucide-react';

const FarmerDashboard = () => {
    const [activeTab, setActiveTab] = useState('requests');
    const [user, setUser] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [language, setLanguage] = useState('en');
    const [statusFilter, setStatusFilter] = useState('all');
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

    // Fetch dashboard data function
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

    // Filter requests function
    const filterRequestsByStatus = () => {
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
            units: 'units',
            createRequest: 'Create Request',
            productExpired: 'Product Expired',
            description: 'Description',
            unit: 'Unit',
            admin: 'Added by Admin',
            role: 'Role'
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
            units: 'ክፍሎች',
            createRequest: 'ጥያቄ ፍጠር',
            productExpired: 'ምርቱ ጊዜው አልፎበታል',
            description: 'መግለጫ',
            unit: 'አሃድ',
            admin: 'በአስተዳዳሪ የተጨመረ',
            role: 'ሚና'
        }
    };

    const t = translations[language];

    // Filter requests based on status
    const getFilteredRequests = () => {
        return filterRequestsByStatus();
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

            // Check if product is expired
            const selectedProduct = products.find(p => p.id === parseInt(requestForm.product_id));
            if (selectedProduct && isProductExpired(selectedProduct)) {
                alert('Cannot request expired product');
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

    // Check if product is expired
    const isProductExpired = (product) => {
        if (!product.expiry_date) return false;
        const expiryDate = new Date(product.expiry_date);
        const today = new Date();
        return expiryDate < today;
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

        return ( <
            span className = { `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusClasses[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600'}` } > { status } <
            /span>
        );
    };

    const getLevelStatus = (level, request) => {
        const status = request[`${level}_status`] || 'Pending';
        const admin = request[`${level}_admin_name`];
        const feedback = request[`${level}_feedback`];
        const date = request[`${level}_approved_at`];

        const formatLevel = level.charAt(0).toUpperCase() + level.slice(1);

        return ( <
            div className = "bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200" >
            <
            div className = "flex items-center mb-2" >
            <
            Building className = "w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" / >
            <
            h4 className = "font-semibold text-gray-900 dark:text-white" > { formatLevel }
            Level < /h4> < /
            div > <
            div className = "space-y-2" >
            <
            div className = "flex items-center" >
            <
            span className = "text-sm font-medium text-gray-700 dark:text-gray-300 mr-2" > Status: < /span> { getStatusBadge(status) } < /
            div > {
                admin && ( <
                    div className = "flex items-center" >
                    <
                    User className = "w-3 h-3 mr-1 text-gray-500 dark:text-gray-400" / >
                    <
                    span className = "text-sm font-medium text-gray-700 dark:text-gray-300 mr-2" > Admin: < /span> <
                    span className = "text-sm text-gray-600 dark:text-gray-300" > { admin } < /span> < /
                    div >
                )
            } {
                feedback && ( <
                    div className = "bg-gray-50 dark:bg-gray-700 p-2 rounded" >
                    <
                    span className = "text-sm font-medium text-gray-700 dark:text-gray-300" > Feedback: < /span> <
                    p className = "text-sm text-gray-600 dark:text-gray-300 mt-1" > { feedback } < /p> < /
                    div >
                )
            } {
                date && ( <
                    div className = "flex items-center" >
                    <
                    Calendar className = "w-3 h-3 mr-1 text-gray-500 dark:text-gray-400" / >
                    <
                    span className = "text-sm font-medium text-gray-700 dark:text-gray-300 mr-2" > Date: < /span> <
                    span className = "text-sm text-gray-600 dark:text-gray-300" > { new Date(date).toLocaleString() } < /span> < /
                    div >
                )
            } <
            /div> < /
            div >
        );
    };

    // Function to create request for a specific product
    const createRequestForProduct = (product) => {
        if (isProductExpired(product)) {
            alert('Cannot request expired product');
            return;
        }

        if (product.amount <= 0) {
            alert('Product is out of stock');
            return;
        }

        setRequestForm({
            product_id: product.id.toString(),
            quantity: '',
            note: ''
        });
        setEditingRequest(null);
        setShowRequestModal(true);
    };

    if (loading) {
        return ( <
            div className = "min-h-screen flex items-center justify-center" >
            <
            div className = "text-center" >
            <
            div className = "animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto" > < /div> <
            p className = "mt-4 text-lg" > Loading... < /p> < /
            div > <
            /div>
        );
    }

    if (error) {
        return ( <
            div className = "min-h-screen flex items-center justify-center" >
            <
            div className = "text-center text-red-600" >
            <
            p className = "text-xl" > { error } < /p> < /
            div > <
            /div>
        );
    }

    return ( <
        div className = { `flex min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}` } > { /* Sidebar */ } <
        div className = { `w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg p-4 flex flex-col` } >
        <
        div className = "p-6" >
        <
        h2 className = "text-xl font-bold mb-6 text-gray-900 dark:text-white" > { t.farmerPortal } < /h2>

        <
        nav className = "flex-1" >
        <
        button className = { `w-full py-2 px-4 rounded mb-2 text-left ${
                                activeTab === 'requests' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }` }
        onClick = {
            () => setActiveTab('requests')
        } > 📦{ t.myRequests } <
        /button>

        <
        button className = { `w-full py-2 px-4 rounded mb-2 text-left ${
                                activeTab === 'deliveries' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }` }
        onClick = {
            () => setActiveTab('deliveries')
        } > 🚚{ t.myDeliveries } <
        /button>

        <
        button className = { `w-full py-2 px-4 rounded mb-2 text-left ${
                                activeTab === 'products' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }` }
        onClick = {
            () => setActiveTab('products')
        } > 🛒{ t.availableProducts } <
        /button> < /
        nav >

        <
        div >
        <
        button className = "w-full py-2 px-4 rounded mb-2 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
        onClick = { toggleDarkMode } > { darkMode ? '☀️ Light Mode' : '🌙 Dark Mode' } <
        /button> <
        button className = "w-full py-2 px-4 rounded mb-2 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
        onClick = { toggleLanguage } > { language === 'en' ? '🇪🇹 አማርኛ' : '🇺🇸 English' } <
        /button> <
        button onClick = { handleLogout }
        className = "w-full py-2 px-4 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50" > 🚪{ t.logout } <
        /button> < /
        div > <
        /div> < /
        div >

        { /* Main Content */ } <
        div className = "flex-1 flex flex-col" >
        <
        header className = { `${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm p-4 flex justify-between items-center` } >
        <
        h1 className = "text-2xl font-semibold text-gray-900 dark:text-white" > { t.welcome }, { user && user.fullName }({ t.farmerDashboard }) <
        /h1> < /
        header >

        <
        main className = { `flex-1 p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}` } > { /* Requests Tab */ } {
            activeTab === 'requests' && ( <
                div className = "space-y-6" >
                <
                div className = "flex justify-between items-center mb-6" >
                <
                div >
                <
                h2 className = "text-2xl font-bold text-gray-900 dark:text-white" > { t.myRequests } < /h2> <
                p className = "text-gray-600 dark:text-gray-400" > { t.manageRequests } < /p> < /
                div > <
                button onClick = {
                    () => setShowRequestModal(true)
                }
                className = "flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors" >
                <
                Plus size = { 20 }
                className = "mr-2" / > { t.newRequest } <
                /button> < /
                div >

                { /* Status Filter */ } <
                div className = { `p-4 rounded shadow mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}` } >
                <
                div className = "flex items-center gap-4" >
                <
                label className = "text-gray-700 dark:text-gray-300 font-medium" > { t.filterBy }: < /label> <
                select value = { statusFilter }
                onChange = {
                    (e) => setStatusFilter(e.target.value)
                }
                className = { `p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` } >
                <
                option value = "all" > { t.all } < /option> <
                option value = "pending" > { t.pending } < /option> <
                option value = "approved" > { t.approved } < /option> <
                option value = "accepted" > { t.accepted } < /option> <
                option value = "rejected" > { t.rejected } < /option> < /
                select > <
                /div> < /
                div >

                <
                div className = "grid gap-4" > {
                    getFilteredRequests().map((request) => ( <
                            div key = { request.id }
                            className = "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300" >
                            <
                            div className = "flex justify-between items-start" >
                            <
                            div className = "flex-1" >
                            <
                            h3 className = "text-lg font-semibold text-gray-900 dark:text-white mb-2" > { request.product_name } <
                            /h3> <
                            div className = "grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400" >
                            <
                            div className = "flex items-center" >
                            <
                            Package className = "w-3 h-3 mr-1 text-gray-500" / >
                            <
                            span className = "font-medium mr-1" > { t.category }: < /span> { request.category } < /
                            div > <
                            div className = "flex items-center" >
                            <
                            span className = "font-medium mr-1" > { t.price }: < /span> { request.price } { t.birr } < /
                            div > <
                            div className = "flex items-center" >
                            <
                            span className = "font-medium mr-1" > { t.quantity }: < /span> { request.quantity } { request.unit || t.units } < /
                            div > <
                            div className = "flex items-center" >
                            <
                            Calendar className = "w-3 h-3 mr-1 text-gray-500" / >
                            <
                            span className = "font-medium mr-1" > { t.date }: < /span> { new Date(request.created_at).toLocaleDateString() } < /
                            div > {
                                request.sub_category && ( <
                                    div className = "flex items-center" >
                                    <
                                    span className = "font-medium mr-1" > { t.subCategory }: < /span> { request.sub_category } < /
                                    div >
                                )
                            } <
                            /div> {
                            request.note && ( <
                                p className = "mt-2 text-sm text-gray-600 dark:text-gray-400" >
                                <
                                span className = "font-medium" > Note: < /span> {request.note} < /
                                p >
                            )
                        } <
                        div className = "mt-3 flex items-center space-x-3" > {
                            (() => {
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
                            })()
                        } {
                            request.handled_by_admin && ( <
                                div className = "flex items-center" >
                                <
                                User className = "w-3 h-3 mr-1 text-gray-500" / >
                                <
                                span className = "text-sm text-gray-600 dark:text-gray-400" >
                                Handled by: { request.handled_by_admin } <
                                /span> < /
                                div >
                            )
                        } <
                        /div> < /
                        div >

                        <
                        div className = "flex flex-col space-y-2 ml-4" >
                        <
                        button onClick = {
                            () => fetchRequestStatusDetail(request.id)
                        }
                        className = "flex items-center px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors text-sm" >
                        <
                        Eye size = { 16 }
                        className = "mr-1" / > { t.viewDetails } <
                        /button>

                        {
                            canConfirmDelivery(request) && ( <
                                button onClick = {
                                    () => handleConfirmDelivery(request)
                                }
                                className = "flex items-center px-3 py-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/50 rounded-lg transition-colors text-sm" >
                                <
                                Check size = { 16 }
                                className = "mr-1" / > { t.confirmDelivery } <
                                /button>
                            )
                        }

                        {
                            canEditOrDelete(request) && ( <
                                >
                                <
                                button onClick = {
                                    () => handleEditRequest(request)
                                }
                                className = "flex items-center px-3 py-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/50 rounded-lg transition-colors text-sm" >
                                <
                                Edit size = { 16 }
                                className = "mr-1" / > { t.edit } <
                                /button> <
                                button onClick = {
                                    () => handleDeleteRequest(request.id)
                                }
                                className = "flex items-center px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors text-sm" >
                                <
                                Trash2 size = { 16 }
                                className = "mr-1" / > { t.delete } <
                                /button> < / >
                            )
                        } <
                        /div> < /
                        div > <
                        /div>
                    ))
            }

            {
                getFilteredRequests().length === 0 && ( <
                    div className = "text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700" >
                    <
                    Package size = { 48 }
                    className = "mx-auto text-gray-400 mb-4" / >
                    <
                    p className = "text-gray-600 dark:text-gray-400" > { statusFilter === 'all' ? t.noRequests : language === 'en' ? `No ${statusFilter} requests found.` : `ምንም ${statusFilter === 'pending' ? 'በመጠባበቅ ላይ' : statusFilter === 'approved' ? 'የተፈቀደ' : statusFilter === 'accepted' ? 'የተቀበለ' : 'የተከለከለ'} ጥያቄዎች አልተገኙም` } < /p> < /
                    div >
                )
            } <
            /div> < /
            div >
        )
    }

    { /* Deliveries Tab */ } {
        activeTab === 'deliveries' && ( <
            div className = "space-y-6" >
            <
            div className = "mb-6" >
            <
            h2 className = "text-2xl font-bold text-gray-900 dark:text-white" > { t.myDeliveries } < /h2> <
            p className = "text-gray-600 dark:text-gray-400" > { t.trackDeliveries } < /p> < /
            div >

            <
            div className = "grid gap-4" > {
                deliveries.map((delivery) => ( <
                        div key = { delivery.id }
                        className = "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300" >
                        <
                        div className = "flex justify-between items-start" >
                        <
                        div className = "flex-1" >
                        <
                        h3 className = "text-lg font-semibold text-gray-900 dark:text-white mb-2" > { delivery.product_name } <
                        /h3> <
                        div className = "grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400" >
                        <
                        div className = "flex items-center" >
                        <
                        Package className = "w-3 h-3 mr-1 text-gray-500" / >
                        <
                        span className = "font-medium mr-1" > { t.category }: < /span> { delivery.category } < /
                        div > <
                        div className = "flex items-center" >
                        <
                        span className = "font-medium mr-1" > { t.price }: < /span> { delivery.price } { t.birr } < /
                        div > <
                        div className = "flex items-center" >
                        <
                        span className = "font-medium mr-1" > { t.quantity }: < /span> { delivery.quantity } { delivery.unit || t.units } < /
                        div > <
                        div className = "flex items-center" >
                        <
                        Calendar className = "w-3 h-3 mr-1 text-gray-500" / >
                        <
                        span className = "font-medium mr-1" > { t.date }: < /span> { new Date(delivery.delivery_date).toLocaleDateString() } < /
                        div > {
                            delivery.sub_category && ( <
                                div className = "flex items-center" >
                                <
                                span className = "font-medium mr-1" > { t.subCategory }: < /span> { delivery.sub_category } < /
                                div >
                            )
                        } <
                        /div> {
                        delivery.delivery_note && ( <
                            p className = "mt-2 text-sm text-gray-600 dark:text-gray-400" >
                            <
                            span className = "font-medium" > Delivery Note: < /span> {delivery.delivery_note} < /
                            p >
                        )
                    } <
                    div className = "mt-3" > {
                        getStatusBadge(delivery.delivery_status)
                    } <
                    /div> < /
                    div > <
                    /div> < /
                    div >
                ))
        }

        {
            deliveries.length === 0 && ( <
                div className = "text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700" >
                <
                Truck size = { 48 }
                className = "mx-auto text-gray-400 mb-4" / >
                <
                p className = "text-gray-600 dark:text-gray-400" > { t.noDeliveries } < /p> < /
                div >
            )
        } <
        /div> < /
        div >
    )
}

{ /* Products Tab */ } {
    activeTab === 'products' && ( <
        div className = "space-y-6" >
        <
        div className = "mb-6" >
        <
        h2 className = "text-2xl font-bold text-gray-900 dark:text-white" > { t.availableProducts } < /h2> <
        p className = "text-gray-600 dark:text-gray-400" > { t.productsAvailable } < /p> < /
        div >

        <
        div className = "grid gap-6 md:grid-cols-2 lg:grid-cols-3" > {
            products.map((product) => {
                const expired = isProductExpired(product);
                return ( <
                    div key = { product.id }
                    className = { `bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 transition-all duration-300 hover:shadow-md ${
                                        expired 
                                            ? 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                                            : 'border-gray-200 dark:border-gray-700'
                                    }` } >
                    <
                    div className = "p-6" > {
                        expired && ( <
                            div className = "flex items-center mb-3 p-2 bg-red-100 dark:bg-red-900/40 rounded-lg" >
                            <
                            AlertTriangle className = "w-4 h-4 text-red-600 dark:text-red-400 mr-2" / >
                            <
                            span className = "text-sm font-medium text-red-600 dark:text-red-400" > { t.productExpired } < /span> < /
                            div >
                        )
                    }

                    <
                    h3 className = { `text-xl font-bold mb-3 ${
                                            expired 
                                                ? 'text-red-700 dark:text-red-300' 
                                                : 'text-gray-900 dark:text-white'
                                        }` } > { product.name } <
                    /h3>

                    <
                    div className = "space-y-3" >
                    <
                    div className = "flex justify-between" >
                    <
                    span className = "font-medium text-gray-700 dark:text-gray-300" > { t.category }: < /span> <
                    span className = "text-gray-900 dark:text-white" > { product.category } < /span> < /
                    div >

                    {
                        product.sub_category && ( <
                            div className = "flex justify-between" >
                            <
                            span className = "font-medium text-gray-700 dark:text-gray-300" > { t.subCategory }: < /span> <
                            span className = "text-gray-900 dark:text-white" > { product.sub_category } < /span> < /
                            div >
                        )
                    }

                    {
                        product.price && ( <
                            div className = "flex justify-between" >
                            <
                            span className = "font-medium text-gray-700 dark:text-gray-300" > { t.price }: < /span> <
                            span className = "text-gray-900 dark:text-white" > { product.price } { t.birr } < /span> < /
                            div >
                        )
                    }

                    <
                    div className = "flex justify-between" >
                    <
                    span className = "font-medium text-gray-700 dark:text-gray-300" > { t.amount }: < /span> <
                    span className = { `font-bold ${
                                                product.amount > 0 
                                                    ? 'text-green-600 dark:text-green-400' 
                                                    : 'text-red-600 dark:text-red-400'
                                            }` } > { product.amount } {
                        product.unit ? product.unit : t.units
                    } < /span> < /
                    div >

                    {
                        product.unit && ( <
                            div className = "flex justify-between" >
                            <
                            span className = "font-medium text-gray-700 dark:text-gray-300" > { t.unit }: < /span> <
                            span className = "text-gray-900 dark:text-white" > { product.unit } < /span> < /
                            div >
                        )
                    }

                    {
                        product.manufacturer && ( <
                            div className = "flex justify-between" >
                            <
                            span className = "font-medium text-gray-700 dark:text-gray-300" > { t.manufacturer }: < /span> <
                            span className = "text-gray-900 dark:text-white" > { product.manufacturer } < /span> < /
                            div >
                        )
                    }

                    {
                        product.expiry_date && ( <
                            div className = "flex justify-between" >
                            <
                            span className = "font-medium text-gray-700 dark:text-gray-300" > { t.expires }: < /span> <
                            span className = { `font-medium ${
                                                        expired 
                                                            ? 'text-red-600 dark:text-red-400' 
                                                            : 'text-gray-900 dark:text-white'
                                                    }` } > { new Date(product.expiry_date).toLocaleDateString() } < /span> < /
                            div >
                        )
                    }

                    <
                    div className = "flex justify-between" >
                    <
                    span className = "font-medium text-gray-700 dark:text-gray-300" > { t.added }: < /span> <
                    span className = "text-gray-900 dark:text-white" > { new Date(product.created_at).toLocaleDateString() } < /span> < /
                    div >

                    {
                        product.created_by_admin_name && ( <
                            div className = "flex justify-between" >
                            <
                            span className = "font-medium text-gray-700 dark:text-gray-300" > { t.admin }: < /span> <
                            span className = "text-gray-900 dark:text-white" > { product.created_by_admin_name } < /span> < /
                            div >
                        )
                    }

                    {
                        product.description && ( <
                            div className = "mt-3 pt-3 border-t border-gray-200 dark:border-gray-700" >
                            <
                            span className = "font-medium text-gray-700 dark:text-gray-300" > { t.description }: < /span> <
                            p className = "mt-1 text-sm text-gray-600 dark:text-gray-400" > { product.description } < /p> < /
                            div >
                        )
                    } <
                    /div>

                    <
                    div className = "mt-4 pt-4 border-t border-gray-200 dark:border-gray-700" >
                    <
                    button onClick = {
                        () => createRequestForProduct(product)
                    }
                    disabled = { expired || product.amount <= 0 }
                    className = { `w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                                                expired || product.amount <= 0
                                                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                            }` } > { t.createRequest } <
                    /button> < /
                    div > <
                    /div> < /
                    div >
                );
            })
        } <
        /div>

        {
            products.length === 0 && ( <
                div className = "text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700" >
                <
                ShoppingCart size = { 48 }
                className = "mx-auto text-gray-400 mb-4" / >
                <
                p className = "text-gray-600 dark:text-gray-400" > { t.noProducts } < /p> < /
                div >
            )
        } <
        /div>
    )
} <
/main> < /
div >

    { /* Request Modal */ } {
        showRequestModal && ( <
                div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
                <
                div className = { `w-full max-w-md rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6` } >
                <
                h3 className = "text-xl font-bold mb-4 text-gray-900 dark:text-white" > { editingRequest ? t.edit : t.newRequest } < /h3> <
                form onSubmit = { handleRequestSubmit } >
                <
                div className = "space-y-4" >
                <
                div >
                <
                label className = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" > { t.category } < /label> <
                select value = { requestForm.product_id }
                onChange = {
                    (e) => setRequestForm({...requestForm, product_id: e.target.value })
                }
                className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
                required >
                <
                option value = "" > { t.selectProduct } < /option> {
                products.filter(product => !isProductExpired(product) && product.amount > 0).map(product => ( <
                    option key = { product.id }
                    value = { product.id } > { product.name } - { product.category } - { product.price } { t.birr } <
                    /option>
                ))
            } <
            /select> < /
        div >

            <
            div >
            <
            label className = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" > { t.quantity } < /label> <
        input type = "number"
        value = { requestForm.quantity }
        onChange = {
            (e) => setRequestForm({...requestForm, quantity: e.target.value })
        }
        className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
        min = "1"
        required /
            >
            <
            /div>

        <
        div >
            <
            label className = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" > Note(Optional) < /label> <
        textarea value = { requestForm.note }
        onChange = {
            (e) => setRequestForm({...requestForm, note: e.target.value })
        }
        rows = "3"
        className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
        /> < /
        div > <
            /div>

        <
        div className = "flex justify-end space-x-3 mt-6" >
            <
            button type = "button"
        onClick = {
            () => {
                setShowRequestModal(false);
                setEditingRequest(null);
                setRequestForm({ product_id: '', quantity: '', note: '' });
            }
        }
        className = "px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" >
            Cancel <
            /button> <
        button type = "submit"
        className = "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors" > { editingRequest ? t.update : t.submit } <
            /button> < /
        div > <
            /form> < /
        div > <
            /div>
    )
}

{ /* Status Detail Modal */ } {
    showStatusModal && selectedRequest && ( <
            div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
            <
            div className = { `w-full max-w-2xl rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 max-h-[90vh] overflow-y-auto` } >
            <
            div className = "flex justify-between items-center mb-6" >
            <
            h3 className = "text-xl font-bold text-gray-900 dark:text-white" > Request Status Details < /h3> <
            button onClick = {
                () => setShowStatusModal(false)
            }
            className = "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" > ✕ <
            /button> < /
            div >

            <
            div className = "space-y-4" >
            <
            div className = "grid grid-cols-2 gap-4 text-sm" >
            <
            div >
            <
            span className = "font-medium text-gray-700 dark:text-gray-300" > Product: < /span> <
            span className = "ml-2 text-gray-900 dark:text-white" > { selectedRequest.product_name } < /span> < /
            div > <
            div >
            <
            span className = "font-medium text-gray-700 dark:text-gray-300" > Category: < /span> <
            span className = "ml-2 text-gray-900 dark:text-white" > { selectedRequest.category } < /span> < /
            div > <
            div >
            <
            span className = "font-medium text-gray-700 dark:text-gray-300" > Quantity: < /span> <
            span className = "ml-2 text-gray-900 dark:text-white" > { selectedRequest.quantity } < /span> < /
            div > <
            div >
            <
            span className = "font-medium text-gray-700 dark:text-gray-300" > Requested: < /span> <
            span className = "ml-2 text-gray-900 dark:text-white" > { new Date(selectedRequest.created_at).toLocaleString() } < /span> < /
            div > <
            /div>

            <
            div className = "space-y-4" >
            <
            h4 className = "font-semibold text-gray-900 dark:text-white" > Approval Status by Level < /h4> {
            getLevelStatus('kebele', selectedRequest)
        } {
            getLevelStatus('woreda', selectedRequest)
        } {
            getLevelStatus('zone', selectedRequest)
        } {
            getLevelStatus('region', selectedRequest)
        } {
            getLevelStatus('federal', selectedRequest)
        } <
        /div> < /
    div > <
        /div> < /
    div >
)
}

{ /* Delivery Confirmation Modal */ } {
    showDeliveryModal && confirmingDelivery && ( <
        div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
        <
        div className = { `w-full max-w-md rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6` } >
        <
        h3 className = "text-xl font-bold mb-4 text-gray-900 dark:text-white" > { t.confirmDelivery } < /h3> <
        p className = "text-gray-600 dark:text-gray-400 mb-4" >
        Please confirm that you have received the delivery
        for { confirmingDelivery.product_name }. <
        /p> <
        form onSubmit = { submitDeliveryConfirmation } >
        <
        div className = "mb-4" >
        <
        label className = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" > Delivery Note(Optional) < /label> <
        textarea value = { deliveryNote }
        onChange = {
            (e) => setDeliveryNote(e.target.value)
        }
        rows = "3"
        className = { `w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border border-gray-300 text-gray-900'}` }
        placeholder = "Add any notes about the delivery..." /
        >
        <
        /div> <
        div className = "flex justify-end space-x-3" >
        <
        button type = "button"
        onClick = {
            () => {
                setShowDeliveryModal(false);
                setConfirmingDelivery(null);
                setDeliveryNote('');
            }
        }
        className = "px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" >
        Cancel <
        /button> <
        button type = "submit"
        className = "px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors" >
        Confirm Delivery <
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

export default FarmerDashboard;