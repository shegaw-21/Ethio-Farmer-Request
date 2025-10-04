import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ZoneDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [user, setUser] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const navigate = useNavigate();

    // Woreda Admin Management State
    const [woredaAdmins, setWoredaAdmins] = useState([]);
    const [showWoredaForm, setShowWoredaForm] = useState(false);
    const [editingWoreda, setEditingWoreda] = useState(null);
    const [woredaForm, setWoredaForm] = useState({
        fullName: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        woreda_name: ''
    });
    const [woredaError, setWoredaError] = useState('');

    // Product Management State
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [productFilter, setProductFilter] = useState('all'); // all, own, others
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: '',
        category: '',
        amount: '',
        price: '',
        description: '',
        sub_category: '',
        unit: '',
        expiry_date: ''
    });
    const [productError, setProductError] = useState('');

    // Request Management State
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestStatus, setRequestStatus] = useState('');
    const [decisionReason, setDecisionReason] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Stats State
    const [stats, setStats] = useState({
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        acceptedRequests: 0,
        totalWoredaAdmins: 0,
        totalProducts: 0
    });
    // Farmers and Reports State
    const [farmers, setFarmers] = useState([]);
    const [reports, setReports] = useState([]); // Reports Management State
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
    const [woredas, setWoredas] = useState([]);
    const [kebeles, setKebeles] = useState([]);
    const [woredaFilter, setWoredaFilter] = useState('all');
    const [kebeleFilter, setKebeleFilter] = useState('all');
    const [filteredFarmers, setFilteredFarmers] = useState([]);


    // Apply dark mode to the entire document
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user') || 'null');
        const userType = localStorage.getItem('userType');

        if (!token || userType !== 'Zone' || !userData) {
            navigate('/login');
            return;
        }

        setUser(userData);
        fetchDashboardData(userData);

    }, [navigate]);

    useEffect(() => {
        if (products.length > 0) {
            filterProducts();
        }
    }, [productFilter, products]);

    useEffect(() => {
        if (requests.length > 0) {
            filterRequests();
        }
    }, [statusFilter, requests]);

    const filterProducts = () => {
        let filtered = [...products];

        // Filter by product ownership
        if (productFilter === 'own') {
            filtered = filtered.filter(product => product.created_by_admin_id === user.id);
        } else if (productFilter === 'others') {
            filtered = filtered.filter(product => product.created_by_admin_id !== user.id);
        }

        setFilteredProducts(filtered);
    };

    const filterRequests = () => {
        let filtered = [...requests];

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(req => req.status === statusFilter);
        }

        setFilteredRequests(filtered);
    };
    const fetchDashboardData = async(userData) => {
        try {
            const token = localStorage.getItem('token');

            // Fetch woreda admins
            const adminsResponse = await fetch('http://localhost:5000/api/admins/admins', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (adminsResponse.ok) {
                const data = await adminsResponse.json();
                const woredaAdminsData = data.filter(item => item.type === 'admin' && item.role === 'Woreda');
                setWoredaAdmins(woredaAdminsData);
                setStats(prev => ({...prev, totalWoredaAdmins: woredaAdminsData.length }));
            }

            // Fetch all products
            const productsResponse = await fetch('http://localhost:5000/api/admins/getproducts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (productsResponse.ok) {
                const productsData = await productsResponse.json();
                setProducts(productsData);
                filterProducts();
                setStats(prev => ({...prev, totalProducts: productsData.length }));
            }

            // Fetch requests with detailed status
            const requestsResponse = await fetch('http://localhost:5000/api/admins/requests/status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (requestsResponse.ok) {
                const requestsData = await requestsResponse.json();
                setRequests(requestsData);
                filterRequests();

                // Calculate stats
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

            // ✅ Fetch farmers & reports after everything else
            await fetchFarmers(token, userData);
            await fetchReports(token);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };
    const fetchFarmers = async(token, userObj) => {
        try {
            if (!token || !userObj) return;

            const farmersResponse = await fetch('http://localhost:5000/api/admins/farmers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!farmersResponse.ok) {
                console.error('Failed to fetch farmers:', await farmersResponse.text());
                return;
            }

            const data = await farmersResponse.json();
            console.log('Raw farmers data:', data);

            const farmersList = Array.isArray(data) ? data : (data.farmers || []);
            console.log('Farmers list:', farmersList);

            const zoneFarmers = farmersList.filter(
                farmer => farmer.region_name === userObj.region_name &&
                farmer.zone_name === userObj.zone_name
            );
            console.log('Filtered zone farmers:', zoneFarmers);

            setFarmers(zoneFarmers);
            setFilteredFarmers(zoneFarmers); // Initialize filtered farmers
            setStats(prev => ({...prev, totalFarmers: zoneFarmers.length }));

            // Extract unique woredas and kebeles
            const uniqueWoredas = [...new Set(zoneFarmers.map(f => f.woreda_name).filter(Boolean))];
            setWoredas(uniqueWoredas);

            const uniqueKebeles = [...new Set(zoneFarmers.map(f => f.kebele_name).filter(Boolean))];
            setKebeles(uniqueKebeles);

        } catch (error) {
            console.error('Error fetching farmers:', error);
        }
    };

    // Update filtered farmers when filters change
    useEffect(() => {
        let result = [...farmers];

        if (woredaFilter !== 'all') {
            result = result.filter(farmer => farmer.woreda_name === woredaFilter);
        }

        if (kebeleFilter !== 'all') {
            result = result.filter(farmer => farmer.kebele_name === kebeleFilter);
        }

        setFilteredFarmers(result);
    }, [farmers, woredaFilter, kebeleFilter]);

    // Update kebeles when woreda filter changes
    useEffect(() => {
        if (woredaFilter === 'all') {
            const allKebeles = [...new Set(farmers.map(f => f.kebele_name).filter(Boolean))];
            setKebeles(allKebeles);
        } else {
            const kebelesInWoreda = [...new Set(
                farmers
                .filter(f => f.woreda_name === woredaFilter)
                .map(f => f.kebele_name)
                .filter(Boolean)
            )];
            setKebeles(kebelesInWoreda);
            // Reset kebele filter if the selected kebele is not in the new woreda
            if (kebeleFilter !== 'all' && !kebelesInWoreda.includes(kebeleFilter)) {
                setKebeleFilter('all');
            }
        }
    }, [woredaFilter, farmers]);
    const fetchReports = async(token) => {
        try {
            if (!token) return;

            const reportsResponse = await fetch('http://localhost:5000/api/admins/reports', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!reportsResponse.ok) return;
            const reportsData = await reportsResponse.json();
            const list = reportsData.reports || (Array.isArray(reportsData) ? reportsData : []);

            setReports(list);
            setStats(prev => ({...prev, totalReports: list.length }));
        } catch (error) {
            console.error('Error fetching reports:', error);
        }
    };
    const handleUpdateReportStatus = async(reportId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admins/reports/${reportId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                alert(`Report ${newStatus} successfully`);
                fetchDashboardData(user); // refresh reports
            } else {
                const data = await response.json();
                alert(data.message || 'Error updating report status');
            }
        } catch (error) {
            console.error('Error updating report:', error);
            alert('Server error updating report');
        }
    };

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
                fetchDashboardData(user);
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        navigate('/login');
    };

    // Woreda Admin Management Functions
    const handleWoredaSubmit = async(e) => {
        e.preventDefault();
        setWoredaError('');

        if (woredaForm.password !== woredaForm.confirmPassword && !editingWoreda) {
            setWoredaError('Passwords do not match');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            let url, method;

            if (editingWoreda) {
                url = `http://localhost:5000/api/admins/edit/${editingWoreda.id}`;
                method = 'PUT';
            } else {
                url = 'http://localhost:5000/api/admins/register';
                method = 'POST';
            }

            const submitData = {
                fullName: woredaForm.fullName,
                phoneNumber: woredaForm.phoneNumber,
                password: woredaForm.password,
                confirmPassword: woredaForm.confirmPassword,
                role: 'Woreda',
                region_name: user.region_name,
                zone_name: user.zone_name,
                woreda_name: woredaForm.woreda_name
            };

            if (editingWoreda && !submitData.password) {
                delete submitData.password;
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
                setShowWoredaForm(false);
                setEditingWoreda(null);
                setWoredaForm({
                    fullName: '',
                    phoneNumber: '',
                    password: '',
                    confirmPassword: '',
                    woreda_name: ''
                });
                fetchDashboardData(user);
                alert(editingWoreda ? 'Woreda admin updated successfully' : 'Woreda admin registered successfully');
            } else {
                setWoredaError(data.message || 'Error processing woreda admin');
            }
        } catch (error) {
            console.error('Error processing woreda admin:', error);
            setWoredaError('Server error occurred');
        }
    };
    const editWoredaAdmin = (admin) => {
        setEditingWoreda(admin);
        setWoredaForm({
            fullName: admin.full_name || '',
            phoneNumber: admin.phone_number || '',
            password: '',
            confirmPassword: '',
            woreda_name: admin.woreda_name || ''
        });
        setShowWoredaForm(true);
    };

    // Product Management Functions
    const handleProductSubmit = async(e) => {
        e.preventDefault();
        setProductError('');

        // Validate product amount and price
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
                body: JSON.stringify(productForm)
            });

            if (response.ok) {
                setShowProductForm(false);
                setEditingProduct(null);
                setProductForm({ name: '', category: '', amount: '', price: '', description: '', sub_category: '', unit: '', expiry_date: '' });
                fetchDashboardData(user);
                alert(editingProduct ? 'Product updated successfully' : 'Product added successfully');
            } else {
                const errorData = await response.json();
                setProductError(errorData.message || 'Error saving product');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            setProductError('Error saving product');
        }
    };

    const deleteProduct = async(productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admins/deleteproduct/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchDashboardData(user);
                alert('Product deleted successfully');
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Error deleting product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error deleting product');
        }
    };

    const editProduct = (product) => {
        // Check if product belongs to current admin
        if (product.created_by_admin_id !== user.id) {
            alert('You can only edit your own products');
            return;
        }

        setEditingProduct(product);
        setProductForm({
            name: product.name || '',
            category: product.category || '',
            amount: product.amount || '',
            price: product.price || '',
            description: product.description || '',
            sub_category: product.sub_category || '',
            unit: product.unit || '',
            expiry_date: product.expiry_date ? product.expiry_date.split('T')[0] : ''
        });
        setShowProductForm(true);
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
                fetchDashboardData(user);
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

    // Check if Zone admin can act on this request
    const canZoneAdminAct = (request) => {
        // Zone admin can only act on requests that have been approved by Woreda admin
        return request.woreda_status === 'Approved' && request.zone_status === 'Pending';
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            'Approved': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            'Accepted': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || ''}`}>{status}</span>
        );
    };
    const getPriorityBadge = (priority) => {
        const priorityClasses = {
            High: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            Low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityClasses[priority] || ''}`}>{priority}</span>
        );
    };

    // NEW renderFarmers function styled like RegionDashboard.js
    const renderFarmers = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Farmer Profiles (View Only)</h2>
                    <p className="text-gray-600 dark:text-gray-300">Viewing farmers in your zone: {user.zone_name}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFarmers.map((farmer) => (
                    <div key={farmer.id} className={`p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{farmer.full_name}</h3>
                            <div className="grid grid-cols-1 gap-1 mb-2 text-gray-600 dark:text-gray-300">
                                <p>📞 Phone: {farmer.phone_number}</p>
                                <p>🌍 Region: {farmer.region_name || 'N/A'}</p>
                                <p>🗺️ Zone: {farmer.zone_name || 'N/A'}</p>
                                <p>🏘️ Woreda: {farmer.woreda_name || 'N/A'}</p>
                                <p>📍 Kebele: {farmer.kebele_name || 'N/A'}</p>
                                <p>🌾 Land Size: {farmer.land_size_hectares || 'N/A'} hectares</p>
                                <p>🌱 Crop Types: {farmer.crop_types || 'N/A'}</p>
                                <p>🌦️ Crop Season: {farmer.crops_season || 'N/A'}</p>
                                <p>🏞️ Land Type: {farmer.land_type || 'N/A'}</p>
                                <p>📈 Farming Experience: {farmer.farming_experience || 'N/A'} years</p>
                                <p>💧 Irrigation Type: {farmer.irrigation_type || 'N/A'}</p>
                                <p>🚜 Farming Method: {farmer.farming_method || 'N/A'}</p>
                                <p>🌿 Primary Crops: {farmer.primary_crops || 'N/A'}</p>
                                <p>🌿 Secondary Crops: {farmer.secondary_crops || 'N/A'}</p>
                                <p>🏔️ Soil Type: {farmer.soil_type || 'N/A'}</p>
                                <p>🐄 Has Livestock: {farmer.has_livestock ? 'Yes' : 'No'}</p>
                                {farmer.has_livestock ? (
                                    <p>🐄 Livestock Types: {farmer.livestock_types || 'N/A'}</p>
                                ) : null}
                                <p>💰 Annual Income: {farmer.annual_income ? `$${farmer.annual_income}` : 'N/A'}</p>
                                <p>🎓 Education Level: {farmer.education_level || 'N/A'}</p>
                                <p>📅 Registered: {farmer.created_at ? new Date(farmer.created_at).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">Recent Requests:</h4>
                            {requests.filter(req => req.farmer_id === farmer.id).slice(0, 3).map(req => (
                                <div key={req.id} className="flex justify-between items-center mt-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">{req.product_name}</span>
                                    {getStatusBadge(req.zone_status)}
                                </div>
                            ))}
                            {requests.filter(req => req.farmer_id === farmer.id).length === 0 && (
                                <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">No requests from this farmer</p>
                            )}
                        </div>
                    </div>
                ))}
                {filteredFarmers.length === 0 && (
                    <p className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                        No farmers found in your zone.
                    </p>
                )}
            </div>
        </div>
    );

    // NEW renderReports function styled like RegionDashboard.js
    const renderReports = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Report Management</h2>
                    <p className="text-gray-600 dark:text-gray-300">Managing admin reports in your zone</p>
                </div>
                <button
                    onClick={() => setShowReportModal(true)}
                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded dark:bg-green-600 dark:hover:bg-green-700"
                >
                    ➕ Create New Report
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {reports.map((report) => (
                    <div key={report.id} className={`p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">{report.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Reported by: {report.reporter_name || 'Admin'}
                                </p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    report.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                    report.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                                    report.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                                    report.status === 'Dismissed' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {report.status}
                                </span>
                                <span className={`mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                                    report.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                                    report.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                                    report.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                }`}>
                                    {report.priority} Priority
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Type: {report.report_type}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Description: {report.description}
                            </p>
                            {report.evidence && (
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Evidence: {report.evidence}
                                </p>
                            )}
                            {report.resolution_notes && (
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Resolution Notes: {report.resolution_notes}
                                </p>
                            )}
                        </div>

                        {report.status === 'Pending' || report.status === 'Under Review' ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleUpdateReportStatus(report.id, 'Resolved')}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm"
                                >
                                    ✅ Mark as Resolved
                                </button>
                                <button
                                    onClick={() => handleUpdateReportStatus(report.id, 'Dismissed')}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm"
                                >
                                    ❌ Dismiss
                                </button>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Report has been {report.status.toLowerCase()}
                            </div>
                        )}
                    </div>
                ))}
                {reports.length === 0 && (
                    <p className="text-center py-8 text-gray-500 dark:text-gray-400">No reports found.</p>
                )}
            </div>
        </div>
    );

const getLevelStatus = (level, request) => {
    const status = request[`${level}_status`];
    const admin = request[`${level}_admin_name`];
    const feedback = request[`${level}_feedback`];
    const date = request[`${level}_approved_at`];

    const formatLevel = level.charAt(0).toUpperCase() + level.slice(1);

    return (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <h4 className="font-semibold dark:text-white">{formatLevel} Level</h4>
            <p className="dark:text-gray-300"><strong>Status:</strong> {status || 'Pending'}</p>
            {admin && <p className="dark:text-gray-300"><strong>Admin:</strong> {admin}</p>}
            {feedback && <p className="dark:text-gray-300"><strong>Feedback:</strong> {feedback}</p>}
            {date && <p className="dark:text-gray-300"><strong>Date:</strong> {new Date(date).toLocaleString()}</p>}
        </div>
    );
};

if (!user) {
    return <div className="flex justify-center items-center h-screen dark:bg-gray-900">Loading...</div>;
}

return (
        <div className={`flex h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
            {/* Sidebar */}
            <div className="w-64 bg-blue-800 dark:bg-gray-800 text-white">
                <div className="p-4">
                    <h2 className="text-xl font-bold">Zone Dashboard</h2>
                    <div className="mt-4 flex items-center">
                        <span className="mr-2">Dark Mode</span>
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full ${darkMode ? 'bg-blue-600' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
                <nav className="mt-6">
                    <button
                        className={`w-full text-left px-4 py-2 ${activeTab === 'overview' ? 'bg-blue-700 dark:bg-gray-700' : 'hover:bg-blue-700 dark:hover:bg-gray-700'}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        📊 Overview
                    </button>
                    <button
                        className={`w-full text-left px-4 py-2 ${activeTab === 'woredas' ? 'bg-blue-700 dark:bg-gray-700' : 'hover:bg-blue-700 dark:hover:bg-gray-700'}`}
                        onClick={() => setActiveTab('woredas')}
                    >
                        👥 Woreda Admins
                    </button>
                    <button
                        className={`w-full text-left px-4 py-2 ${activeTab === 'products' ? 'bg-blue-700 dark:bg-gray-700' : 'hover:bg-blue-700 dark:hover:bg-gray-700'}`}
                        onClick={() => setActiveTab('products')}
                    >
                        📦 Products
                    </button>
                    <button
                        className={`w-full text-left px-4 py-2 ${activeTab === 'requests' ? 'bg-blue-700 dark:bg-gray-700' : 'hover:bg-blue-700 dark:hover:bg-gray-700'}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        📋 Requests
                    </button>
                    <button
                        className={`w-full text-left px-4 py-2 ${activeTab === 'farmers' ? 'bg-blue-700 dark:bg-gray-700' : 'hover:bg-blue-700 dark:hover:bg-gray-700'}`}
                        onClick={() => setActiveTab('farmers')}
                    >
                        👨‍🌾 Farmers
                    </button>
                    <button
                        className={`w-full text-left px-4 py-2 ${activeTab === 'reports' ? 'bg-blue-700 dark:bg-gray-700' : 'hover:bg-blue-700 dark:hover:bg-gray-700'}`}
                        onClick={() => setActiveTab('reports')}
                    >
                        🔍 Reports
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <header className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold dark:text-white">Welcome, {user.fullName} (Zone Admin)</h1>
                        <p className="text-gray-600 dark:text-gray-300">Region: {user.region_name} | Zone: {user.zone_name}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded dark:bg-red-600 dark:hover:bg-red-700"
                    >
                        Logout
                    </button>
                </header>

                <main className="p-4">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="overview-tab">
                            <h2 className="text-2xl font-bold mb-4 dark:text-white">System Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                                    <h3 className="text-2xl font-bold dark:text-white">{stats.totalRequests}</h3>
                                    <p className="dark:text-gray-300">Total Requests</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                                    <h3 className="text-2xl font-bold dark:text-white">{stats.pendingRequests}</h3>
                                    <p className="dark:text-gray-300">Pending Requests</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                                    <h3 className="text-2xl font-bold dark:text-white">{stats.approvedRequests}</h3>
                                    <p className="dark:text-gray-300">Approved Requests</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                                    <h3 className="text-2xl font-bold dark:text-white">{stats.acceptedRequests}</h3>
                                    <p className="dark:text-gray-300">Accepted Requests</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                                    <h3 className="text-2xl font-bold dark:text-white">{stats.rejectedRequests}</h3>
                                    <p className="dark:text-gray-300">Rejected Requests</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                                    <h3 className="text-2xl font-bold dark:text-white">{stats.totalWoredaAdmins}</h3>
                                    <p className="dark:text-gray-300">Woreda Admins</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                                    <h3 className="text-2xl font-bold dark:text-white">{stats.totalProducts}</h3>
                                    <p className="dark:text-gray-300">Products</p>
                                </div>
                            </div>

                            <div className="quick-actions bg-white dark:bg-gray-800 p-4 rounded shadow">
                                <h2 className="text-xl font-bold mb-4 dark:text-white">Quick Actions</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <button
                                        onClick={() => setActiveTab('requests')}
                                        className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded text-center dark:bg-blue-600 dark:hover:bg-blue-700"
                                    >
                                        📋 Manage Requests
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('woredas')}
                                        className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded text-center dark:bg-blue-600 dark:hover:bg-blue-700"
                                    >
                                        👥 Manage Woreda Admins
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('products')}
                                        className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded text-center dark:bg-blue-600 dark:hover:bg-blue-700"
                                    >
                                        📦 Manage Products
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingWoreda(null);
                                            setWoredaForm({
                                                fullName: '',
                                                phoneNumber: '',
                                                password: '',
                                                confirmPassword: '',
                                                woreda_name: ''
                                            });
                                            setShowWoredaForm(true);
                                        }}
                                        className="bg-green-500 hover:bg-green-600 text-white p-3 rounded text-center dark:bg-green-600 dark:hover:bg-green-700"
                                    >
                                        ➕ Register Woreda Admin
                                    </button>
                                    <button
                                        onClick={() => setShowProductForm(true)}
                                        className="bg-green-500 hover:bg-green-600 text-white p-3 rounded text-center dark:bg-green-600 dark:hover:bg-green-700"
                                    >
                                        ➕ Add Product
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Woreda Admins Tab */}
                    {activeTab === 'woredas' && (
                        <div className="woredas-tab">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold dark:text-white">Woreda Admin Management</h2>
                                <button
                                    onClick={() => {
                                        setEditingWoreda(null);
                                        setWoredaForm({
                                            fullName: '',
                                            phoneNumber: '',
                                            password: '',
                                            confirmPassword: '',
                                            woreda_name: ''
                                        });
                                        setShowWoredaForm(true);
                                    }}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded dark:bg-green-600 dark:hover:bg-green-700"
                                >
                                    Register Woreda Admin
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {woredaAdmins.map((admin) => (
                                    <div key={admin.id} className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                                        <h3 className="text-lg font-semibold dark:text-white">{admin.full_name}</h3>
                                        <p className="text-gray-600 dark:text-gray-300">📞 Phone: {admin.phone_number}</p>
                                        <p className="text-gray-600 dark:text-gray-300">📍 Woreda: {admin.woreda_name}</p>
                                        <p className="text-gray-600 dark:text-gray-300">📅 Registered: {new Date(admin.created_at).toLocaleDateString()}</p>
                                        <div className="mt-4 flex space-x-2">
                                            <button
                                                onClick={() => editWoredaAdmin(admin)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded dark:bg-blue-600 dark:hover:bg-blue-700"
                                            >
                                                ✏️ Edit
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {woredaAdmins.length === 0 && (
                                    <p className="text-gray-600 dark:text-gray-300">No Woreda admins found in your zone.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Products Tab */}
                    {activeTab === 'products' && (
                        <div className="products-tab">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold dark:text-white">Product Management</h2>
                                <button
                                    onClick={() => setShowProductForm(true)}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded dark:bg-green-600 dark:hover:bg-green-700"
                                >
                                    Add Product
                                </button>
                            </div>

                            {/* Product Filter */}
                            <div className="mb-4 flex items-center space-x-4">
                                <label className="font-medium dark:text-white">Filter Products:</label>
                                <select
                                    value={productFilter}
                                    onChange={(e) => setProductFilter(e.target.value)}
                                    className="border rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                >
                                    <option value="all">All Products</option>
                                    <option value="own">My Products</option>
                                    <option value="others">Other Admins' Products</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredProducts.map((product) => (
                                    <div key={product.id} className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                                        <h3 className="text-lg font-semibold dark:text-white">{product.name}</h3>
                                        <p className="text-gray-600 dark:text-gray-300">📦 Category: {product.category}</p>
                                        <p className="text-gray-600 dark:text-gray-300">💰 Price: Br {product.price}</p>
                                        <p className="text-gray-600 dark:text-gray-300">📊 Amount: {product.amount}</p>
                                        <p className="text-gray-600 dark:text-gray-300">📝 Description: {product.description}</p>
                                        <p className="text-gray-600 dark:text-gray-300">📍 Location: {product.region_name}/{product.zone_name}/{product.woreda_name}</p>
                                        <p className="text-gray-600 dark:text-gray-300">👤 Added by: {product.created_by_name}</p>
                                        <p className="text-gray-600 dark:text-gray-300">📅 Added: {new Date(product.created_at).toLocaleDateString()}</p>
                                        <div className="mt-4 flex space-x-2">
                                            {product.created_by_admin_id === user.id && (
                                                <>
                                                    <button
                                                        onClick={() => editProduct(product)}
                                                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded dark:bg-blue-600 dark:hover:bg-blue-700"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        onClick={() => deleteProduct(product.id)}
                                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded dark:bg-red-600 dark:hover:bg-red-700"
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <p className="text-gray-600 dark:text-gray-300">No products found.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Requests Tab */}
                    {activeTab === 'requests' && (
                            <div className="requests-tab">
                                <h2 className="text-2xl font-bold mb-4 dark:text-white">Request Management</h2>

                                {/* Status Filter */}
                                <div className="mb-4 flex items-center space-x-4">
                                    <label className="font-medium dark:text-white">Filter by Status:</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="border rounded p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    >
                                        <option value="all">All Requests</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Accepted">Accepted</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {filteredRequests.map((request) => (
                                        <div key={request.id} className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold dark:text-white">{request.product_name}</h3>
                                                    <p className="text-gray-600 dark:text-gray-300">👨‍🌾 Farmer: {request.farmer_name}</p>
                                                    <p className="text-gray-600 dark:text-gray-300">📞 Phone: {request.farmer_phone}</p>
                                                    <p className="text-gray-600 dark:text-gray-300">📦 Amount: {request.amount || request.quantity}</p>
                                                    <p className="text-gray-600 dark:text-gray-300">📅 Requested: {new Date(request.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <div className="mb-2">{getStatusBadge(request.zone_status)}</div>
                                                    {canZoneAdminAct(request) && (
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => handleStatusUpdate(request, 'Approved')}
                                                                className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs dark:bg-blue-600 dark:hover:bg-blue-700"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(request, 'Accepted')}
                                                                className="bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-xs dark:bg-green-600 dark:hover:bg-green-700"
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(request, 'Rejected')}
                                                                className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs dark:bg-red-600 dark:hover:bg-red-700"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => viewRequestDetails(request.id)}
                                                        className="mt-2 bg-gray-500 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs dark:bg-gray-600 dark:hover:bg-gray-700"
                                                    >
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredRequests.length === 0 && (
                                        <p className="text-gray-600 dark:text-gray-300">No requests found.</p>
                                    )}
                                </div>
                            </div>
                        )}

                    {/* Farmers Tab */}
                    {activeTab === 'farmers' && renderFarmers()}

                    {/* Reports Tab */}
                    {activeTab === 'reports' && renderReports()}
                </main>
            </div>

            {/* Woreda Admin Form Modal */}
            {showWoredaForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">{editingWoreda ? 'Edit Woreda Admin' : 'Register Woreda Admin'}</h2>
                        {woredaError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{woredaError}</div>}
                        <form onSubmit={handleWoredaSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={woredaForm.fullName}
                                    onChange={(e) => setWoredaForm({...woredaForm, fullName: e.target.value})}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                                <input
                                    type="text"
                                    value={woredaForm.phoneNumber}
                                    onChange={(e) => setWoredaForm({...woredaForm, phoneNumber: e.target.value})}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2">Woreda Name</label>
                                <input
                                    type="text"
                                    value={woredaForm.woreda_name}
                                    onChange={(e) => setWoredaForm({...woredaForm, woreda_name: e.target.value})}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    required
                                />
                            </div>
                            {!editingWoreda && (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Password</label>
                                        <input
                                            type="password"
                                            value={woredaForm.password}
                                            onChange={(e) => setWoredaForm({...woredaForm, password: e.target.value})}
                                            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                            required
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={woredaForm.confirmPassword}
                                            onChange={(e) => setWoredaForm({...woredaForm, confirmPassword: e.target.value})}
                                            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                            required
                                        />
                                    </div>
                                </>
                            )}
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowWoredaForm(false);
                                        setEditingWoreda(null);
                                    }}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded dark:bg-blue-600 dark:hover:bg-blue-700"
                                >
                                    {editingWoreda ? 'Update' : 'Register'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Product Form Modal */}
            {showProductForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md max-h-screen overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                        {productError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{productError}</div>}
                        <form onSubmit={handleProductSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2">Product Name</label>
                                <input
                                    type="text"
                                    value={productForm.name}
                                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2">Category</label>
                                <input
                                    type="text"
                                    value={productForm.category}
                                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={productForm.amount}
                                    onChange={(e) => setProductForm({...productForm, amount: e.target.value})}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2">Price (Birr)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={productForm.price}
                                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2">Sub Category *</label>
                                <input
                                    type="text"
                                    value={productForm.sub_category}
                                    onChange={(e) => setProductForm({...productForm, sub_category: e.target.value})}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2">Unit *</label>
                                <input
                                    type="text"
                                    value={productForm.unit}
                                    onChange={(e) => setProductForm({...productForm, unit: e.target.value})}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    placeholder="e.g., kg, liter, piece"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2">Expiry Date *</label>
                                <input
                                    type="date"
                                    value={productForm.expiry_date}
                                    onChange={(e) => setProductForm({...productForm, expiry_date: e.target.value})}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2">Description</label>
                                <textarea
                                    value={productForm.description}
                                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    rows="3"
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowProductForm(false);
                                        setEditingProduct(null);
                                    }}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded dark:bg-blue-600 dark:hover:bg-blue-700"
                                >
                                    {editingProduct ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Request Detail Modal */}
            {showRequestModal && selectedRequest && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-2xl max-h-screen overflow-y-auto">
                            <h2 className="text-xl font-bold mb-4 dark:text-white">Request Details</h2>

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold dark:text-white">Product Information</h3>
                                <p className="dark:text-gray-300"><strong>Name:</strong> {selectedRequest.product_name}</p>
                                <p className="dark:text-gray-300"><strong>Category:</strong> {selectedRequest.category}</p>
                                <p className="dark:text-gray-300"><strong>Price:</strong> Br {selectedRequest.price}</p>
                                <p className="dark:text-gray-300"><strong>Requested Quantity:</strong> {selectedRequest.quantity}</p>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold dark:text-white">Farmer Information</h3>
                                <p className="dark:text-gray-300"><strong>Name:</strong> {selectedRequest.farmer_name}</p>
                                <p className="dark:text-gray-300"><strong>Location:</strong> {selectedRequest.region_name}/{selectedRequest.zone_name}/{selectedRequest.woreda_name}/{selectedRequest.kebele_name}</p>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold dark:text-white">Request Status History</h3>
                                <div className="space-y-4 mt-2">
                                    {getLevelStatus('woreda', selectedRequest)}
                                    {getLevelStatus('zone', selectedRequest)}
                                    {getLevelStatus('region', selectedRequest)}
                                    {getLevelStatus('federal', selectedRequest)}
                                </div>
                            </div>

                            {requestStatus && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold dark:text-white">Update Status to: {requestStatus}</h3>
                                    <div className="mt-2">
                                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Reason (Optional):</label>
                                        <textarea
                                            value={decisionReason}
                                            onChange={(e) => setDecisionReason(e.target.value)}
                                            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                            rows="3"
                                            placeholder="Enter reason for your decision..."
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => {
                                        setShowRequestModal(false);
                                        setSelectedRequest(null);
                                        setRequestStatus('');
                                        setDecisionReason('');
                                    }}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-white"
                                >
                                    Close
                                </button>
                                {requestStatus && (
                                    <button
                                        onClick={confirmStatusUpdate}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded dark:bg-blue-600 dark:hover:bg-blue-700"
                                    >
                                        Confirm {requestStatus}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className={`w-full max-w-md p-6 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'} max-h-[90vh] overflow-y-auto`}>
                        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
                            Create New Report
                        </h2>
                        <form onSubmit={handleReportSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block mb-1 text-gray-700 dark:text-gray-300">Report Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={reportForm.title}
                                        onChange={(e) => setReportForm({...reportForm, title: e.target.value})}
                                        className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-gray-700 dark:text-gray-300">Reported Admin *</label>
                                    <select
                                        required
                                        value={reportForm.reportedAdminId}
                                        onChange={(e) => setReportForm({...reportForm, reportedAdminId: e.target.value})}
                                        className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}`}
                                    >
                                        <option value="">Select Admin to Report</option>
                                        {woredaAdmins.map(admin => (
                                            <option key={admin.id} value={admin.id}>{admin.full_name} ({admin.role})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 text-gray-700 dark:text-gray-300">Report Type *</label>
                                    <select
                                        required
                                        value={reportForm.reportType}
                                        onChange={(e) => setReportForm({...reportForm, reportType: e.target.value})}
                                        className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}`}
                                    >
                                        <option value="Misconduct">Misconduct</option>
                                        <option value="Incompetence">Incompetence</option>
                                        <option value="Abuse of Power">Abuse of Power</option>
                                        <option value="Corruption">Corruption</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 text-gray-700 dark:text-gray-300">Priority</label>
                                    <select
                                        value={reportForm.priority}
                                        onChange={(e) => setReportForm({...reportForm, priority: e.target.value})}
                                        className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}`}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 text-gray-700 dark:text-gray-300">Description *</label>
                                    <textarea
                                        required
                                        value={reportForm.description}
                                        onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                                        className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}`}
                                        rows="4"
                                        placeholder="Describe the incident in detail..."
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-gray-700 dark:text-gray-300">Evidence (Optional)</label>
                                    <textarea
                                        value={reportForm.evidence}
                                        onChange={(e) => setReportForm({...reportForm, evidence: e.target.value})}
                                        className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300 text-gray-900'}`}
                                        rows="3"
                                        placeholder="Any supporting evidence or documentation..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReportModal(false);
                                        setEditingReport(null);
                                        resetReportForm();
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-700"
                                >
                                    Submit Report
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ZoneDashboard;
