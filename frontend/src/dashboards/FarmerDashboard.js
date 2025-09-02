import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FarmerDashboard.css';

const FarmerDashboard = () => {
    const [activeTab, setActiveTab] = useState('requests');
    const [user, setUser] = useState(null);
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
    }, [navigate]);

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

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
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

    const handleEditRequest = (request) => {
        // Only allow editing if request is pending
        if (request.status !== 'Pending') {
            alert('Only pending requests can be edited');
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

    const getStatusBadge = (status) => {
        const statusClasses = {
            'Pending': 'status-pending',
            'Accepted': 'status-accepted',
            'Rejected': 'status-rejected',
            'Approved': 'status-approved',
            'Kebele_Approved': 'status-kebele-approved',
            'Woreda_Approved': 'status-woreda-approved',
            'Zone_Approved': 'status-zone-approved',
            'Region_Approved': 'status-region-approved'
        };

        // Format status for display
        const formatStatus = (status) => {
            return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        };

        return ( <
            span className = { `status-badge ${statusClasses[status] || ''}` } > { formatStatus(status) } <
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
            div className = "level-status" >
            <
            h4 > { formatLevel }
            Level < /h4> <
            p > < strong > Status: < /strong> {status || 'Pending'}</p > { admin && < p > < strong > Admin: < /strong> {admin}</p > } { feedback && < p > < strong > Feedback: < /strong> {feedback}</p > } { date && < p > < strong > Date: < /strong> {new Date(date).toLocaleString()}</p > } <
            /div>
        );
    };

    if (loading) {
        return <div className = "loading" > Loading... < /div>;
    }

    if (error) {
        return <div className = "error" > { error } < /div>;
    }

    return ( <
        div className = "farmer-dashboard" > { /* Sidebar */ } <
        div className = "sidebar" >
        <
        h2 > Farmer Dashboard < /h2> <
        nav >
        <
        button className = { activeTab === 'requests' ? 'active' : '' }
        onClick = {
            () => setActiveTab('requests')
        } > 📋My Requests <
        /button> <
        button className = { activeTab === 'products' ? 'active' : '' }
        onClick = {
            () => setActiveTab('products')
        } > 🛒Available Products <
        /button> < /
        nav > <
        /div>

        { /* Main Content */ } <
        div className = "main-content" >
        <
        header >
        <
        h1 > Welcome, { user.fullName }(Farmer) < /h1> <
        button onClick = { handleLogout }
        className = "logout-btn" >
        Logout <
        /button> < /
        header >

        <
        main > { /* Requests Tab */ } {
            activeTab === 'requests' && ( <
                div className = "requests-tab" >
                <
                div className = "tab-header" >
                <
                h2 > My Requests < /h2> <
                p > Manage your product requests < /p> <
                button onClick = {
                    () => setShowRequestModal(true)
                }
                className = "add-btn" > ➕New Request <
                /button> < /
                div >

                <
                div className = "requests-list" > {
                    requests.map((request) => ( <
                            div key = { request.id }
                            className = "request-card" >
                            <
                            div className = "request-info" >
                            <
                            h3 > { request.product_name } < /h3> <
                            p > 📦Category: { request.category } < /p> <p>💵Price:{request.price}</p > <
                            p > 🔢Quantity: { request.quantity } < /p> {
                            request.note && < p > 📝Note: { request.note } < /p>} <
                            p > 📅Date: { new Date(request.created_at).toLocaleDateString() } < /p> { getStatusBadge(request.status) } {
                            request.handled_by_admin && ( <
                                p > 👤Handled by: { request.handled_by_admin } < /p>
                            )
                        } <
                        /div> <
                        div className = "request-actions" >
                        <
                        button onClick = {
                            () => fetchRequestStatusDetail(request.id)
                        }
                        className = "status-btn" > 📊View Status Details <
                        /button> {
                        request.status === 'Pending' && ( <
                            >
                            <
                            button onClick = {
                                () => handleEditRequest(request)
                            }
                            className = "edit-btn" > ✏️Edit <
                            /button> <
                            button onClick = {
                                () => handleDeleteRequest(request.id)
                            }
                            className = "delete-btn" > 🗑️Delete <
                            /button> < / >
                        )
                    } {
                        (request.status === 'Accepted' || request.status === 'Rejected') && ( <
                            p > Processed < /p>
                        )
                    } <
                    /div> < /
                    div >
                ))
        } {
            requests.length === 0 && ( <
                p > No requests found.Create your first request! < /p>
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
        div className = "tab-header" >
        <
        h2 > Available Products < /h2> <
        p > Products available across the country < /p> < /
        div >

        <
        div className = "products-list" > {
            products.map((product) => ( <
                div key = { product.id }
                className = "product-card" >
                <
                div className = "product-info" >
                <
                h3 > { product.name } < /h3> <
                p > { product.description } < /p> <
                p > 📦Category: { product.category } < /p> <
                p > 💰Amount: { product.amount } < /p> <p>💵Price:{product.price}</p > <
                p > 📅Added: { new Date(product.created_at).toLocaleDateString() } < /p> < /
                div > <
                div className = "product-actions" >
                <
                button onClick = {
                    () => {
                        setRequestForm({
                            product_id: product.id.toString(),
                            quantity: '',
                            note: ''
                        });
                        setEditingRequest(null);
                        setShowRequestModal(true);
                    }
                }
                className = "request-btn" > 📋Request This Product <
                /button> < /
                div > <
                /div>
            ))
        } {
            products.length === 0 && ( <
                p > No products available at the moment. < /p>
            )
        } <
        /div> < /
        div >
    )
}

{ /* Request Modal */ } {
    showRequestModal && ( <
            div className = "modal" >
            <
            div className = "modal-content" >
            <
            h3 > { editingRequest ? 'Edit Request' : 'Create New Request' } < /h3> <
            form onSubmit = { handleRequestSubmit } >
            <
            div className = "form-group" >
            <
            label > Product: < /label> <
            select value = { requestForm.product_id }
            onChange = {
                (e) => setRequestForm({...requestForm, product_id: e.target.value })
            }
            required disabled = { editingRequest } >
            <
            option value = "" > Select a product < /option> {
            products.map((product) => ( <
                option key = { product.id }
                value = { product.id } > { product.name } - { product.category } <
                /option>
            ))
        } <
        /select> < /
    div > <
        div className = "form-group" >
        <
        label > Quantity: < /label> <
    input type = "number"
    min = "1"
    value = { requestForm.quantity }
    onChange = {
        (e) => setRequestForm({...requestForm, quantity: e.target.value })
    }
    required / >
        <
        /div> <
    div className = "form-group" >
        <
        label > Note(Optional): < /label> <
    textarea value = { requestForm.note }
    onChange = {
        (e) => setRequestForm({...requestForm, note: e.target.value })
    }
    rows = "3"
    placeholder = "Any additional information about your request..." / >
        <
        /div> <
    div className = "modal-actions" >
        <
        button type = "submit" > { editingRequest ? 'Update Request' : 'Create Request' } < /button> <
    button type = "button"
    onClick = {
            () => {
                setShowRequestModal(false);
                setEditingRequest(null);
                setRequestForm({ product_id: '', quantity: '', note: '' });
            }
        } >
        Cancel <
        /button> < /
    div > <
        /form> < /
    div > <
        /div>
)
}

{ /* Status Detail Modal */ } {
    showStatusModal && selectedRequest && ( <
        div className = "modal" >
        <
        div className = "modal-content status-modal" >
        <
        h3 > Request Status Details < /h3> <
        div className = "status-overview" >
        <
        h4 > Overall Status: { getStatusBadge(selectedRequest.status) } < /h4> <
        p > < strong > Product: < /strong> {selectedRequest.product_name}</p >
        <
        p > < strong > Quantity: < /strong> {selectedRequest.quantity}</p > { selectedRequest.note && < p > < strong > Note: < /strong> {selectedRequest.note}</p > } <
        /div>

        <
        div className = "approval-levels" > { getLevelStatus('kebele', selectedRequest) } { getLevelStatus('woreda', selectedRequest) } { getLevelStatus('zone', selectedRequest) } { getLevelStatus('region', selectedRequest) } { getLevelStatus('federal', selectedRequest) } <
        /div>

        <
        div className = "modal-actions" >
        <
        button type = "button"
        onClick = {
            () => {
                setShowStatusModal(false);
                setSelectedRequest(null);
            }
        } >
        Close <
        /button> < /
        div > <
        /div> < /
        div >
    )
} <
/main> < /
div > <
    /div>
);
};

export default FarmerDashboard;