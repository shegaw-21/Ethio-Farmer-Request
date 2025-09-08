import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * RegionDashboard
 * - Region can: view and act on requests (Approve/Accept/Reject) when Zone has Approved.
 * - Filters requests by region-level state: Pending (no region action yet), Accepted (region only), Approved (region only), Rejected (region only).
 * - Shows per-level timeline so you can see where a request was accepted/approved/rejected.
 * - Products: All / My Products / Other Admins' Products.
 * - Manage Zone Admins: add / edit / delete scoped to the Region.
 *
 * Notes:
 * - No optional chaining is used anywhere (per your requirement).
 * - Endpoints mirror your existing KebeleDashboard patterns to work with the same backend.
 * - Status PUT uses /api/admins/requests/:id/status; backend infers role and writes region_* fields.  :contentReference[oaicite:2]{index=2}
 * - Request shape expects region_status, zone_status, kebele_status, woreda_status etc.  :contentReference[oaicite:3]{index=3}
 */

const RegionDashboard = () => {
    const navigate = useNavigate();

    // Auth / User
    const [user, setUser] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    // Requests
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [statusFilter, setStatusFilter] = useState("pending"); // pending | accepted | approved | rejected | all
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [decisionReason, setDecisionReason] = useState("");
    const [requestAction, setRequestAction] = useState(""); // "Approved" | "Accepted" | "Rejected"

    // Bulk
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkAction, setBulkAction] = useState("");

    // Products
    const [products, setProducts] = useState([]);
    const [myProducts, setMyProducts] = useState([]);
    const [otherProducts, setOtherProducts] = useState([]);
    const [productFilter, setProductFilter] = useState("all"); // all | own | others

    // Zone Admins
    const [zoneAdmins, setZoneAdmins] = useState([]);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [adminForm, setAdminForm] = useState({
        fullName: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
        zone_name: "",
    });

    // Stats
    const [stats, setStats] = useState({
        totalRequests: 0,
        regionPending: 0,
        regionApproved: 0,
        regionAccepted: 0,
        regionRejected: 0,
        totalProducts: 0,
    });

    // Product Modal
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: "",
        category: "",
        subCategory: "",
        unit: "",
        amount: "",
        price: "",
        description: "",
        manufacturer: "",
        expiryDate: "",
    });

    // Product category helpers (optional, to help form UX)
    const productCategories = {
        Chemicals: {
            subcategories: ["Fertilizers", "Pesticides", "Herbicides", "Fungicides", "Insecticides", "Growth Regulators"],
            units: ["kg", "liters", "bottles", "sachets"],
        },
        Machinery: {
            subcategories: ["Tractors", "Plows", "Harvesters", "Seeders", "Cultivators", "Irrigation Equipment"],
            units: ["units", "pieces"],
        },
        Seeds: {
            subcategories: ["Cereal Seeds", "Vegetable Seeds", "Fruit Seeds", "Legume Seeds", "Cash Crop Seeds"],
            units: ["kg", "packets", "bags"],
        },
        Tools: {
            subcategories: ["Hand Tools", "Cutting Tools", "Measuring Tools", "Safety Equipment", "Storage Equipment"],
            units: ["pieces", "sets", "units"],
        },
        Livestock: {
            subcategories: ["Feed", "Vaccines", "Supplements", "Equipment", "Medicine"],
            units: ["kg", "liters", "bottles", "doses"],
        },
        Organic: {
            subcategories: ["Organic Fertilizers", "Bio-pesticides", "Compost", "Organic Seeds"],
            units: ["kg", "liters", "bags"],
        },
    };

    // --- Auth + Theme ---
    useEffect(() => {
        const token = localStorage.getItem("token");
        const userRaw = localStorage.getItem("user");
        const userType = localStorage.getItem("userType");

        let parsed = null;
        if (userRaw !== null) {
            parsed = JSON.parse(userRaw);
        }

        if (!token || userType !== "Region" || parsed === null) {
            navigate("/login");
            return;
        }
        setUser(parsed);
    }, [navigate]);

    useEffect(() => {
        if (user !== null) {
            fetchEverything();
        }
    }, [user]);

    useEffect(() => {
        if (darkMode === true) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [darkMode]);

    // --- Data fetchers ---
    const fetchEverything = async() => {
        try {
            const token = localStorage.getItem("token");

            // Requests (detailed status endpoint used in KebeleDashboard)
            const reqRes = await fetch("http://localhost:5000/api/admins/requests/status", {
                headers: { Authorization: "Bearer " + token },
            });
            if (reqRes.ok) {
                const allReq = await reqRes.json();

                // Filter to this region scope
                const regionReq = [];
                for (let i = 0; i < allReq.length; i++) {
                    const r = allReq[i];
                    if (r.region_name === user.region_name) {
                        regionReq.push(r);
                    }
                }

                setRequests(regionReq);
                applyRegionFilter(regionReq, statusFilter);

                // Stats from region-level columns  (DB has region_status etc.) :contentReference[oaicite:4]{index=4}
                const totalRequests = regionReq.length;
                let regionPending = 0;
                let regionApproved = 0;
                let regionAccepted = 0;
                let regionRejected = 0;

                for (let i = 0; i < regionReq.length; i++) {
                    const rr = regionReq[i];
                    const s = rr.region_status;
                    if (s === "Pending" || s === null || s === undefined || s === "") regionPending++;
                    else if (s === "Approved") regionApproved++;
                    else if (s === "Accepted") regionAccepted++;
                    else if (s === "Rejected") regionRejected++;
                }

                setStats(function(prev) {
                    return {
                        ...prev,
                        totalRequests: totalRequests,
                        regionPending: regionPending,
                        regionApproved: regionApproved,
                        regionAccepted: regionAccepted,
                        regionRejected: regionRejected,
                    };
                });
            }

            // Products
            const allProdRes = await fetch("http://localhost:5000/api/admins/getproducts", {
                headers: { Authorization: "Bearer " + token },
            });
            if (allProdRes.ok) {
                const data = await allProdRes.json();
                setProducts(data);
                setStats(function(prev) {
                    return {...prev, totalProducts: data.length };
                });
            }

            const myProdRes = await fetch("http://localhost:5000/api/admins/myproducts", {
                headers: { Authorization: "Bearer " + token },
            });
            if (myProdRes.ok) {
                const data = await myProdRes.json();
                setMyProducts(data);
            }

            const otherProdRes = await fetch("http://localhost:5000/api/admins/otherproducts", {
                headers: { Authorization: "Bearer " + token },
            });
            if (otherProdRes.ok) {
                const data = await otherProdRes.json();
                setOtherProducts(data);
            }

            // Admins (list & then filter Zone admins for this region)
            const adminsRes = await fetch("http://localhost:5000/api/admins/admins", {
                headers: { Authorization: "Bearer " + token },
            });
            if (adminsRes.ok) {
                const allAdmins = await adminsRes.json();
                const zones = [];
                for (let i = 0; i < allAdmins.length; i++) {
                    const a = allAdmins[i];
                    if (a.type === "zone" || a.role === "Zone") {
                        if (a.region_name === user.region_name) {
                            zones.push(a);
                        }
                    }
                }
                setZoneAdmins(zones);
            }
        } catch (e) {
            console.error("Error fetching region data:", e);
        }
    };

    // --- Filtering helpers ---
    const applyRegionFilter = (source, filter) => {
        // Your spec: "pending (all any pending request status below region , till region will not make status)".
        // We interpret this as: region-level Pending = region_status === 'Pending' (i.e., Region hasn't acted yet).
        // accepted = region_status === 'Accepted' (by Region only), approved = region_status === 'Approved' (by Region only),
        // rejected = region_status === 'Rejected' (by Region only).
        const result = [];
        for (let i = 0; i < source.length; i++) {
            const r = source[i];
            if (filter === "all") {
                result.push(r);
            } else if (filter === "pending" && (r.region_status === "Pending" || r.region_status === null || r.region_status === undefined || r.region_status === "")) {
                result.push(r);
            } else if (filter === "accepted" && r.region_status === "Accepted") {
                result.push(r);
            } else if (filter === "approved" && r.region_status === "Approved") {
                result.push(r);
            } else if (filter === "rejected" && r.region_status === "Rejected") {
                result.push(r);
            }
        }
        setFilteredRequests(result);
    };

    useEffect(() => {
        applyRegionFilter(requests, statusFilter);
    }, [statusFilter, requests]);

    // --- Actions ---
    const canRegionActOn = (req) => {
        // Region can act only if Zone approved and Region is still Pending (per your rule). 
        // "Region Level Approval: ... only if zones status is 'approved'." 
        // Also consistent with DB's multi-level columns. :contentReference[oaicite:5]{index=5}
        return req.zone_status === "Approved" && (req.region_status === "Pending" || req.region_status === null || req.region_status === undefined || req.region_status === "");
    };

    const getStatusBadge = (status) => {
        const map = {
            Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
            Approved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
            Accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            Rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        };
        const cls = map[status] ? map[status] : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
        return <span className = { "px-2 py-1 rounded-full text-xs font-medium " + cls } > { status ? status : "Pending" } < /span>;
    };

    const openRequestModal = (request, action) => {
        setSelectedRequest(request);
        setRequestAction(action);
        setDecisionReason("");
        setShowRequestModal(true);
    };

    const updateRequestStatus = async(requestId, status, feedback) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/admins/requests/" + requestId + "/status", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token,
                },
                body: JSON.stringify({ status: status, feedback: feedback }),
            });
            const data = await res.json();
            if (res.ok) {
                setShowRequestModal(false);
                setSelectedRequest(null);
                setRequestAction("");
                setDecisionReason("");
                await fetchEverything();
                alert("Request " + status + " successfully.");
            } else {
                alert(data.message ? data.message : "Error updating request.");
            }
        } catch (e) {
            console.error("Error updating request:", e);
            alert("Error updating request");
        }
    };

    const confirmRequestAction = () => {
        if (selectedRequest !== null && requestAction !== "") {
            updateRequestStatus(selectedRequest.id, requestAction, decisionReason);
        }
    };

    const toggleSelection = (id) => {
        const copy = selectedIds.slice();
        const idx = copy.indexOf(id);
        if (idx >= 0) {
            copy.splice(idx, 1);
        } else {
            copy.push(id);
        }
        setSelectedIds(copy);
    };

    const selectAllPendingAtRegion = () => {
        const pendingIds = [];
        for (let i = 0; i < filteredRequests.length; i++) {
            const r = filteredRequests[i];
            if (canRegionActOn(r)) {
                pendingIds.push(r.id);
            }
        }
        if (selectedIds.length === pendingIds.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(pendingIds);
        }
    };

    const doBulk = async() => {
        if (bulkAction === "" || selectedIds.length === 0) {
            alert("Pick a bulk action and select at least one request.");
            return;
        }
        try {
            const token = localStorage.getItem("token");
            for (let i = 0; i < selectedIds.length; i++) {
                const id = selectedIds[i];
                await fetch("http://localhost:5000/api/admins/requests/" + id + "/status", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token,
                    },
                    body: JSON.stringify({ status: bulkAction }),
                });
            }
            setSelectedIds([]);
            setBulkAction("");
            await fetchEverything();
            alert("Bulk update complete.");
        } catch (e) {
            console.error("Bulk error:", e);
            alert("Error performing bulk update");
        }
    };

    // --- View details ---
    const viewRequestDetails = async(requestId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/admins/requests/" + requestId + "/status", {
                headers: { Authorization: "Bearer " + token },
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedRequest(data);
                setShowRequestModal(true);
            } else {
                const err = await res.json();
                alert(err.message ? err.message : "Error fetching request details");
            }
        } catch (e) {
            console.error("Request details error:", e);
            alert("Error fetching request details");
        }
    };

    // --- Product CRUD ---
    const getFilteredProducts = () => {
        if (productFilter === "own") return myProducts;
        if (productFilter === "others") return otherProducts;
        return products;
    };

    const handleProductSubmit = async(e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        if (productForm.name.trim() === "" || productForm.category.trim() === "") {
            alert("Name and Category are required.");
            return;
        }
        const amt = parseFloat(productForm.amount);
        const pr = parseFloat(productForm.price);
        if (isNaN(amt) || amt <= 0) {
            alert("Amount must be a positive number.");
            return;
        }
        if (isNaN(pr) || pr <= 0) {
            alert("Price must be a positive number.");
            return;
        }

        const method = editingProduct === null ? "POST" : "PUT";
        const url =
            editingProduct === null ?
            "http://localhost:5000/api/admins/addproduct" :
            "http://localhost:5000/api/admins/editproduct/" + editingProduct.id;

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
                body: JSON.stringify({
                    name: productForm.name,
                    category: productForm.category,
                    subCategory: productForm.subCategory,
                    unit: productForm.unit,
                    amount: productForm.amount,
                    price: productForm.price,
                    description: productForm.description,
                    manufacturer: productForm.manufacturer,
                    expiryDate: productForm.expiryDate,
                }),
            });
            if (res.ok) {
                setShowProductModal(false);
                setEditingProduct(null);
                setProductForm({
                    name: "",
                    category: "",
                    subCategory: "",
                    unit: "",
                    amount: "",
                    price: "",
                    description: "",
                    manufacturer: "",
                    expiryDate: "",
                });
                await fetchEverything();
                alert(editingProduct === null ? "Product added" : "Product updated");
            } else {
                const err = await res.json();
                alert(err.message ? err.message : "Error saving product");
            }
        } catch (e) {
            console.error("Save product error:", e);
            alert("Error saving product");
        }
    };

    const handleEditProduct = (p) => {
        // Only my product editable
        if (p.created_by_admin_id !== user.id) {
            alert("You can only edit your own products.");
            return;
        }
        setEditingProduct(p);
        setProductForm({
            name: p.name,
            category: p.category,
            subCategory: p.sub_category ? p.sub_category : "",
            unit: p.unit ? p.unit : "",
            amount: p.amount,
            price: p.price,
            description: p.description ? p.description : "",
            manufacturer: p.manufacturer ? p.manufacturer : "",
            expiryDate: p.expiry_date ? p.expiry_date : "",
        });
        setShowProductModal(true);
    };

    const handleDeleteProduct = async(id) => {
        const p = findProductById(id);
        if (p !== null && p.created_by_admin_id !== user.id) {
            alert("You can only delete your own products.");
            return;
        }
        if (!window.confirm("Delete this product?")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/admins/deleteproduct/" + id, {
                method: "DELETE",
                headers: { Authorization: "Bearer " + token },
            });
            if (res.ok) {
                await fetchEverything();
                alert("Product deleted.");
            } else {
                const err = await res.json();
                alert(err.message ? err.message : "Error deleting product");
            }
        } catch (e) {
            console.error("Delete product error:", e);
            alert("Error deleting product");
        }
    };

    const findProductById = (id) => {
        // helper without optional chaining
        for (let i = 0; i < products.length; i++)
            if (products[i].id === id) return products[i];
        return null;
    };

    // --- Zone Admin CRUD ---
    const openAdminModal = (admin) => {
        if (admin === null) {
            setEditingAdmin(null);
            setAdminForm({
                fullName: "",
                phoneNumber: "",
                password: "",
                confirmPassword: "",
                zone_name: "",
            });
        } else {
            setEditingAdmin(admin);
            setAdminForm({
                fullName: admin.full_name,
                phoneNumber: admin.phone_number,
                password: "",
                confirmPassword: "",
                zone_name: admin.zone_name ? admin.zone_name : "",
            });
        }
        setShowAdminModal(true);
    };

    const saveZoneAdmin = async(e) => {
        e.preventDefault();
        if (adminForm.fullName.trim() === "" || adminForm.phoneNumber.trim() === "") {
            alert("Full name and phone number are required.");
            return;
        }
        if (editingAdmin === null && adminForm.password.trim() === "") {
            alert("Password is required for a new admin.");
            return;
        }
        if (adminForm.password !== adminForm.confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const payload = {
                fullName: adminForm.fullName,
                phoneNumber: adminForm.phoneNumber,
                password: adminForm.password,
                role: "Zone",
                region_name: user.region_name,
                zone_name: adminForm.zone_name,
            };

            let url = "";
            let method = "POST";
            if (editingAdmin === null) {
                // Create admin
                url = "http://localhost:5000/api/admins/createadmin";
                method = "POST";
            } else {
                // Update admin
                url = "http://localhost:5000/api/admins/admins/" + editingAdmin.id;
                method = "PUT";
            }

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setShowAdminModal(false);
                setEditingAdmin(null);
                await fetchEverything();
                alert(editingAdmin === null ? "Zone admin created" : "Zone admin updated");
            } else {
                const err = await res.json();
                alert(err.message ? err.message : "Error saving zone admin");
            }
        } catch (e) {
            console.error("Save zone admin error:", e);
            alert("Error saving zone admin");
        }
    };

    const deleteZoneAdmin = async(id) => {
        if (!window.confirm("Delete this zone admin?")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/admins/admins/" + id, {
                method: "DELETE",
                headers: { Authorization: "Bearer " + token },
            });
            if (res.ok) {
                await fetchEverything();
                alert("Zone admin deleted.");
            } else {
                const err = await res.json();
                alert(err.message ? err.message : "Error deleting zone admin");
            }
        } catch (e) {
            console.error("Delete zone admin error:", e);
            alert("Error deleting zone admin");
        }
    };

    // --- Misc ---
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userType");
        navigate("/login");
    };

    const LevelBlock = (levelKey, request) => {
        const status = request[levelKey + "_status"];
        const admin = request[levelKey + "_admin_name"];
        const feedback = request[levelKey + "_feedback"];
        const date = request[levelKey + "_approved_at"];
        const title = levelKey.charAt(0).toUpperCase() + levelKey.slice(1);
        return ( <
            div className = "mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded" >
            <
            h4 className = "font-semibold text-gray-900 dark:text-white" > { title }
            Level < /h4> <
            p className = "text-gray-700 dark:text-gray-300" >
            <
            strong > Status: < /strong> {status ? status : "Pending"} < /
            p > {
                admin ? ( <
                    p className = "text-gray-700 dark:text-gray-300" >
                    <
                    strong > Admin: < /strong> {admin} < /
                    p >
                ) : null
            } {
                feedback ? ( <
                    p className = "text-gray-700 dark:text-gray-300" >
                    <
                    strong > Feedback: < /strong> {feedback} < /
                    p >
                ) : null
            } {
                date ? ( <
                    p className = "text-gray-700 dark:text-gray-300" >
                    <
                    strong > Date: < /strong> {new Date(date).toLocaleString()} < /
                    p >
                ) : null
            } <
            /div>
        );
    };

    if (user === null) {
        return ( <
            div className = "flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white" >
            Loading... <
            /div>
        );
    }

    return ( <
        div className = { "flex min-h-screen " + (darkMode ? "dark bg-gray-900" : "bg-gray-100") } > { /* Sidebar */ } <
        div className = { "w-64 " + (darkMode ? "bg-gray-800" : "bg-white") + " shadow-lg p-4 flex flex-col" } >
        <
        h2 className = "text-xl font-bold mb-6 text-gray-900 dark:text-white" > Region Dashboard < /h2> <
        nav className = "flex-1" >
        <
        button className = {
            "w-full text-left py-2 px-4 rounded mb-2 " +
            (activeTab === "overview" ? "bg-blue-500 text-white" : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700")
        }
        onClick = {
            function() {
                setActiveTab("overview");
            }
        } > 📊Overview <
        /button> <
        button className = {
            "w-full text-left py-2 px-4 rounded mb-2 " +
            (activeTab === "requests" ? "bg-blue-500 text-white" : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700")
        }
        onClick = {
            function() {
                setActiveTab("requests");
            }
        } > 📋Requests <
        /button> <
        button className = {
            "w-full text-left py-2 px-4 rounded mb-2 " +
            (activeTab === "products" ? "bg-blue-500 text-white" : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700")
        }
        onClick = {
            function() {
                setActiveTab("products");
            }
        } > 🛒Products <
        /button> <
        button className = {
            "w-full text-left py-2 px-4 rounded mb-2 " +
            (activeTab === "zoneAdmins" ? "bg-blue-500 text-white" : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700")
        }
        onClick = {
            function() {
                setActiveTab("zoneAdmins");
            }
        } > 🧑‍💼Zone Admins <
        /button> < /
        nav > <
        div className = "mt-auto" >
        <
        button className = "w-full py-2 px-4 rounded mb-2 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
        onClick = {
            function() {
                setDarkMode(!darkMode);
            }
        } > { darkMode ? "☀️ Light Mode" : "🌙 Dark Mode" } <
        /button> < /
        div > <
        /div>

        { /* Main */ } <
        div className = "flex-1 flex flex-col" >
        <
        header className = {
            (darkMode ? "bg-gray-800" : "bg-white") + " shadow-sm p-4 flex justify-between items-center"
        } >
        <
        h1 className = "text-2xl font-semibold text-gray-900 dark:text-white" >
        Welcome, { user.fullName }(Region Admin)— { user.region_name } <
        /h1> <
        button onClick = { handleLogout }
        className = "bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded dark:bg-red-600 dark:hover:bg-red-700" >
        Logout <
        /button> < /
        header >

        <
        main className = "flex-1 p-6 overflow-auto" > { /* Overview */ } {
            activeTab === "overview" ? ( <
                div >
                <
                h2 className = "text-2xl font-bold mb-6 text-gray-900 dark:text-white" > System Overview < /h2> <
                div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8" >
                <
                div className = {
                    (darkMode ? "bg-gray-800" : "bg-white") + " p-4 rounded shadow"
                } >
                <
                h3 className = "text-2xl font-bold text-gray-900 dark:text-white" > { stats.totalRequests } < /h3> <
                p className = "text-gray-600 dark:text-gray-300" > Total Requests < /p> < /
                div > <
                div className = {
                    (darkMode ? "bg-gray-800" : "bg-white") + " p-4 rounded shadow"
                } >
                <
                h3 className = "text-2xl font-bold text-gray-900 dark:text-white" > { stats.regionPending } < /h3> <
                p className = "text-gray-600 dark:text-gray-300" > Pending @ Region < /p> < /
                div > <
                div className = {
                    (darkMode ? "bg-gray-800" : "bg-white") + " p-4 rounded shadow"
                } >
                <
                h3 className = "text-2xl font-bold text-gray-900 dark:text-white" > { stats.regionAccepted } < /h3> <
                p className = "text-gray-600 dark:text-gray-300" > Accepted by Region < /p> < /
                div > <
                div className = {
                    (darkMode ? "bg-gray-800" : "bg-white") + " p-4 rounded shadow"
                } >
                <
                h3 className = "text-2xl font-bold text-gray-900 dark:text-white" > { stats.regionApproved } < /h3> <
                p className = "text-gray-600 dark:text-gray-300" > Approved by Region < /p> < /
                div > <
                div className = {
                    (darkMode ? "bg-gray-800" : "bg-white") + " p-4 rounded shadow"
                } >
                <
                h3 className = "text-2xl font-bold text-gray-900 dark:text-white" > { stats.regionRejected } < /h3> <
                p className = "text-gray-600 dark:text-gray-300" > Rejected by Region < /p> < /
                div > <
                div className = {
                    (darkMode ? "bg-gray-800" : "bg-white") + " p-4 rounded shadow"
                } >
                <
                h3 className = "text-2xl font-bold text-gray-900 dark:text-white" > { stats.totalProducts } < /h3> <
                p className = "text-gray-600 dark:text-gray-300" > Products < /p> < /
                div > <
                /div>

                <
                div className = {
                    (darkMode ? "bg-gray-800" : "bg-white") + " p-6 rounded shadow"
                } >
                <
                h2 className = "text-xl font-bold mb-4 text-gray-900 dark:text-white" > Quick Actions < /h2> <
                div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" >
                <
                button onClick = {
                    function() {
                        setActiveTab("requests");
                    }
                }
                className = "py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded dark:bg-blue-600 dark:hover:bg-blue-700" > 📋Manage Requests <
                /button> <
                button onClick = {
                    function() {
                        setActiveTab("products");
                    }
                }
                className = "py-3 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded dark:bg-purple-600 dark:hover:bg-purple-700" > 🛒Manage Products <
                /button> <
                button onClick = {
                    function() {
                        setActiveTab("zoneAdmins");
                    }
                }
                className = "py-3 px-4 bg-teal-500 hover:bg-teal-600 text-white rounded dark:bg-teal-600 dark:hover:bg-teal-700" > 🧑‍💼Manage Zone Admins <
                /button> <
                button onClick = {
                    function() {
                        setShowProductModal(true);
                    }
                }
                className = "py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded dark:bg-orange-600 dark:hover:bg-orange-700" > ➕Add Product <
                /button> < /
                div > <
                /div> < /
                div >
            ) : null
        }

        { /* Requests */ } {
            activeTab === "requests" ? ( <
                    div >
                    <
                    div className = "mb-6" >
                    <
                    h2 className = "text-2xl font-bold text-gray-900 dark:text-white" > Request Management— { user.region_name } < /h2> <
                    p className = "text-gray-600 dark:text-gray-300" >
                    Region can approve / accept / reject a request only after Zone has Approved.Approved at Region→ moves to Federal.Accepted at Region→ product available at Region level; Rejected→ overall rejected. <
                    /p> < /
                    div >

                    <
                    div className = {
                        (darkMode ? "bg-gray-800" : "bg-white") + " p-4 rounded shadow mb-6"
                    } >
                    <
                    div className = "flex flex-wrap items-center gap-4" >
                    <
                    div >
                    <
                    label className = "mr-2 text-gray-700 dark:text-gray-200" > Filter: < /label> <
                    select value = { statusFilter }
                    onChange = {
                        function(e) {
                            setStatusFilter(e.target.value);
                        }
                    }
                    className = {
                        (darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border border-gray-300 text-gray-900") + " p-2 rounded"
                    } >
                    <
                    option value = "pending" > Pending(Region) < /option> <
                    option value = "accepted" > Accepted(Region) < /option> <
                    option value = "approved" > Approved(Region) < /option> <
                    option value = "rejected" > Rejected(Region) < /option> <
                    option value = "all" > All < /option> < /
                    select > <
                    /div>

                    {
                        filteredRequests.filter(function(r) { return canRegionActOn(r); }).length > 0 ? ( <
                            div className = "flex flex-wrap items-center gap-2" >
                            <
                            select value = { bulkAction }
                            onChange = {
                                function(e) {
                                    setBulkAction(e.target.value);
                                }
                            }
                            className = {
                                (darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border border-gray-300 text-gray-900") + " p-2 rounded"
                            } >
                            <
                            option value = "" > Select Bulk Action < /option> <
                            option value = "Approved" > Approve < /option> <
                            option value = "Accepted" > Accept < /option> <
                            option value = "Rejected" > Reject < /option> < /
                            select > <
                            button onClick = { doBulk }
                            className = "bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-700" >
                            Apply to Selected <
                            /button> <
                            button onClick = { selectAllPendingAtRegion }
                            className = "bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700" > {
                                selectedIds.length === filteredRequests.filter(function(r) { return canRegionActOn(r); }).length ?
                                "Deselect All" : "Select All Pending"
                            } <
                            /button> < /
                            div >
                        ) : null
                    } <
                    /div> < /
                    div >

                    <
                    div className = "grid grid-cols-1 gap-4" > {
                        filteredRequests.map(function(req) {
                                return ( <
                                    div key = { req.id }
                                    className = {
                                        (darkMode ? "bg-gray-800" : "bg-white") + " p-4 rounded shadow"
                                    } >
                                    <
                                    div className = "flex justify-between items-start mb-3" >
                                    <
                                    div >
                                    <
                                    h3 className = "text-lg font-semibold text-gray-900 dark:text-white" > { req.product_name } < /h3> <
                                    p className = "text-gray-600 dark:text-gray-300" > 👨‍🌾Farmer: { req.farmer_name } < /p> <
                                    p className = "text-gray-600 dark:text-gray-300" > 📞Phone: { req.farmer_phone } < /p> <
                                    p className = "text-gray-600 dark:text-gray-300" > 📅Requested: { new Date(req.created_at).toLocaleDateString() } < /p> <
                                    p className = "text-gray-600 dark:text-gray-300" > 📦Amount: { req.amount } < /p> <
                                    p className = "text-gray-600 dark:text-gray-300" > 💰Price: { req.product_price ? "Birr " + req.product_price : "N/A" } { req.unit ? "/ " + req.unit : "" } <
                                    /p> <
                                    p className = "text-gray-600 dark:text-gray-300" > 💵Total: { " " } { req.product_price ? "Birr " + (Number(req.product_price) * Number(req.amount)).toFixed(2) : "N/A" } <
                                    /p> < /
                                    div > <
                                    div className = "flex flex-col items-end" >
                                    <
                                    div className = "mb-2" > { getStatusBadge(req.region_status) } < /div> {
                                    canRegionActOn(req) ? ( <
                                        div className = "flex space-x-2" >
                                        <
                                        button onClick = {
                                            function() {
                                                openRequestModal(req, "Approved");
                                            }
                                        }
                                        className = "bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs dark:bg-blue-600 dark:hover:bg-blue-700" >
                                        Approve <
                                        /button> <
                                        button onClick = {
                                            function() {
                                                openRequestModal(req, "Accepted");
                                            }
                                        }
                                        className = "bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-xs dark:bg-green-600 dark:hover:bg-green-700" >
                                        Accept <
                                        /button> <
                                        button onClick = {
                                            function() {
                                                openRequestModal(req, "Rejected");
                                            }
                                        }
                                        className = "bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs dark:bg-red-600 dark:hover:bg-red-700" >
                                        Reject <
                                        /button> < /
                                        div >
                                    ) : null
                                }

                                <
                                button onClick = {
                                    function() {
                                        viewRequestDetails(req.id);
                                    }
                                }
                                className = "mt-2 bg-gray-500 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs dark:bg-gray-600 dark:hover:bg-gray-700" >
                                    View Details <
                                    /button>

                                {
                                    canRegionActOn(req) ? ( <
                                        div className = "mt-2" >
                                        <
                                        input type = "checkbox"
                                        className = "mr-1"
                                        checked = { selectedIds.indexOf(req.id) >= 0 }
                                        onChange = {
                                            function() {
                                                toggleSelection(req.id);
                                            }
                                        }
                                        /> <
                                        span className = "text-xs text-gray-600 dark:text-gray-300" > Select < /span> < /
                                        div >
                                    ) : null
                                } <
                                /div> < /
                                div >

                                    { /* Timeline per level */ } <
                                    div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" > { LevelBlock("kebele", req) } { LevelBlock("woreda", req) } { LevelBlock("zone", req) } { LevelBlock("region", req) } { LevelBlock("federal", req) } <
                                    /div> < /
                                div >
                            );
                        })
                } {
                    filteredRequests.length === 0 ? ( <
                        p className = "text-center py-8 text-gray-500 dark:text-gray-400" > No requests found. < /p>
                    ) : null
                } <
                /div> < /
            div >
        ): null
    }

    { /* Products */ } {
        activeTab === "products" ? ( <
            div >
            <
            div className = "flex justify-between items-center mb-6" >
            <
            div >
            <
            h2 className = "text-2xl font-bold text-gray-900 dark:text-white" > Product Management < /h2> <
            p className = "text-gray-600 dark:text-gray-300" > Manage Region - level products. < /p> < /
            div > <
            button onClick = {
                function() {
                    setShowProductModal(true);
                }
            }
            className = "bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded dark:bg-green-600 dark:hover:bg-green-700" > ➕Add New Product <
            /button> < /
            div >

            <
            div className = "mb-6" >
            <
            div className = "flex gap-3" >
            <
            button className = {
                "py-2 px-4 rounded " +
                (productFilter === "all" ?
                    "bg-blue-500 text-white" :
                    "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200")
            }
            onClick = {
                function() {
                    setProductFilter("all");
                }
            } >
            All Products <
            /button> <
            button className = {
                "py-2 px-4 rounded " +
                (productFilter === "own" ?
                    "bg-blue-500 text-white" :
                    "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200")
            }
            onClick = {
                function() {
                    setProductFilter("own");
                }
            } >
            My Products <
            /button> <
            button className = {
                "py-2 px-4 rounded " +
                (productFilter === "others" ?
                    "bg-blue-500 text-white" :
                    "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200")
            }
            onClick = {
                function() {
                    setProductFilter("others");
                }
            } >
            Other Admins ' Products < /
            button > <
            /div> < /
            div >

            <
            div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" > {
                getFilteredProducts().map(function(product) {
                        return ( <
                                div key = { product.id }
                                className = {
                                    (darkMode ? "bg-gray-800" : "bg-white") + " p-4 rounded shadow"
                                } >
                                <
                                div className = "mb-4" >
                                <
                                h3 className = "text-lg font-semibold text-gray-900 dark:text-white" > { product.name } < /h3> <
                                div className = "flex gap-2 mt-2" >
                                <
                                span className = "px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs" > { product.category } <
                                /span> {
                                product.sub_category ? ( <
                                    span className = "px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs" > { product.sub_category } <
                                    /span>
                                ) : null
                            } <
                            /div> <
                        p className = "text-sm text-gray-600 dark:text-gray-300 mt-2" > { product.description } < /p> <
                        p className = "text-gray-700 dark:text-gray-300" > 💰Price: Birr { product.price } { product.unit ? " / " + product.unit : "" } <
                            /p> <
                        p className = "text-gray-700 dark:text-gray-300" > 📦Amount: { product.amount } { product.unit ? product.unit : "units" } < /p> {
                        product.manufacturer ? ( <
                            p className = "text-gray-700 dark:text-gray-300" > 🏭Manufacturer: { product.manufacturer } < /p>
                        ) : null
                    } {
                        product.expiry_date ? ( <
                            p className = "text-gray-700 dark:text-gray-300" > 📅Expires: { new Date(product.expiry_date).toLocaleDateString() } <
                            /p>
                        ) : null
                    } {
                        product.created_by_name ? ( <
                            p className = "text-gray-700 dark:text-gray-300" > 👤Added by: { product.created_by_name }({ product.admin_role }) < /p>
                        ) : null
                    } {
                        product.region_name ? ( <
                            p className = "text-gray-700 dark:text-gray-300" > 📍Location: { product.region_name } { product.zone_name ? " / " + product.zone_name : "" } { product.woreda_name ? " / " + product.woreda_name : "" } { product.kebele_name ? " / " + product.kebele_name : "" } <
                            /p>
                        ) : null
                    } <
                    p className = "text-gray-700 dark:text-gray-300" > 📅Created: { new Date(product.created_at).toLocaleDateString() } < /p> < /
                    div >

                    {
                        product.created_by_admin_id === user.id ? ( <
                            div className = "flex gap-2" >
                            <
                            button onClick = {
                                function() {
                                    handleEditProduct(product);
                                }
                            }
                            className = "bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm dark:bg-blue-600 dark:hover:bg-blue-700" > ✏️Edit <
                            /button> <
                            button onClick = {
                                function() {
                                    handleDeleteProduct(product.id);
                                }
                            }
                            className = "bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm dark:bg-red-600 dark:hover:bg-red-700" > 🗑️Delete <
                            /button> < /
                            div >
                        ) : null
                    } <
                    /div>
                );
            })
    } {
        getFilteredProducts().length === 0 ? ( <
            p className = "col-span-full text-center py-8 text-gray-500 dark:text-gray-400" > { productFilter === "own" ? "You haven't added any products yet." : productFilter === "others" ? "No products from other admins." : "No products found." } <
            /p>
        ) : null
    } <
    /div> < /
    div >
): null
}

{ /* Zone Admins */ } {
    activeTab === "zoneAdmins" ? ( <
        div >
        <
        div className = "flex justify-between items-center mb-6" >
        <
        div >
        <
        h2 className = "text-2xl font-bold text-gray-900 dark:text-white" > Zone Admins < /h2> <
        p className = "text-gray-600 dark:text-gray-300" > Create, edit, and delete Zone admins in { user.region_name }. < /p> < /
        div > <
        button onClick = {
            function() {
                openAdminModal(null);
            }
        }
        className = "bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded dark:bg-green-600 dark:hover:bg-green-700" > ➕Add Zone Admin <
        /button> < /
        div >

        <
        div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" > {
            zoneAdmins.map(function(a) {
                return ( <
                    div key = { a.id }
                    className = {
                        (darkMode ? "bg-gray-800" : "bg-white") + " p-4 rounded shadow"
                    } >
                    <
                    h3 className = "text-lg font-semibold text-gray-900 dark:text-white" > { a.full_name } < /h3> <
                    p className = "text-gray-600 dark:text-gray-300" > 📞{ a.phone_number } < /p> <
                    p className = "text-gray-600 dark:text-gray-300" > 🧭Zone: { a.zone_name ? a.zone_name : "—" } < /p> <
                    p className = "text-gray-600 dark:text-gray-300" > 📍Region: { a.region_name } < /p> <
                    p className = "text-gray-600 dark:text-gray-300" > 🕒Created: { new Date(a.created_at).toLocaleDateString() } < /p>

                    <
                    div className = "flex gap-2 mt-3" >
                    <
                    button onClick = {
                        function() {
                            openAdminModal(a);
                        }
                    }
                    className = "bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm dark:bg-blue-600 dark:hover:bg-blue-700" > ✏️Edit <
                    /button> <
                    button onClick = {
                        function() {
                            deleteZoneAdmin(a.id);
                        }
                    }
                    className = "bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm dark:bg-red-600 dark:hover:bg-red-700" > 🗑️Delete <
                    /button> < /
                    div > <
                    /div>
                );
            })
        } {
            zoneAdmins.length === 0 ? ( <
                p className = "col-span-full text-center py-8 text-gray-500 dark:text-gray-400" > No zone admins found
                for this region. < /p>
            ) : null
        } <
        /div> < /
        div >
    ) : null
} <
/main> < /
div >

    { /* Request Modal (single action or details) */ } {
        showRequestModal ? ( <
            div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
            <
            div className = {
                (darkMode ? "bg-gray-800" : "bg-white") + " w-full max-w-3xl p-6 rounded shadow max-h-[90vh] overflow-y-auto"
            } >
            <
            div className = "flex justify-between items-center mb-4" >
            <
            h2 className = "text-xl font-bold text-gray-900 dark:text-white" > { requestAction !== "" ? requestAction + " Request" : "Request Details" } <
            /h2> <
            button onClick = {
                function() {
                    setShowRequestModal(false);
                    setSelectedRequest(null);
                    setRequestAction("");
                    setDecisionReason("");
                }
            }
            className = "text-gray-600 dark:text-gray-300 hover:underline" >
            Close <
            /button> < /
            div >

            {
                selectedRequest !== null ? ( <
                    div >
                    <
                    div className = "mb-4 grid grid-cols-1 md:grid-cols-2 gap-3" >
                    <
                    div className = "p-3 rounded bg-gray-50 dark:bg-gray-700" >
                    <
                    p className = "text-gray-700 dark:text-gray-300" > < strong > Product: < /strong> {selectedRequest.product_name}</p >
                    <
                    p className = "text-gray-700 dark:text-gray-300" > < strong > Farmer: < /strong> {selectedRequest.farmer_name}</p >
                    <
                    p className = "text-gray-700 dark:text-gray-300" > < strong > Phone: < /strong> {selectedRequest.farmer_phone}</p >
                    <
                    p className = "text-gray-700 dark:text-gray-300" > < strong > Amount: < /strong> {selectedRequest.amount}</p >
                    <
                    p className = "text-gray-700 dark:text-gray-300" > < strong > Requested On: < /strong> {new Date(selectedRequest.created_at).toLocaleString()}</p >
                    <
                    /div> <
                    div className = "p-3 rounded bg-gray-50 dark:bg-gray-700" >
                    <
                    p className = "text-gray-700 dark:text-gray-300" > < strong > Region Status: < /strong> {selectedRequest.region_status ? selectedRequest.region_status : "Pending"}</p >
                    <
                    p className = "text-gray-700 dark:text-gray-300" > < strong > Zone Status: < /strong> {selectedRequest.zone_status ? selectedRequest.zone_status : "Pending"}</p >
                    <
                    p className = "text-gray-700 dark:text-gray-300" > < strong > Woreda Status: < /strong> {selectedRequest.woreda_status ? selectedRequest.woreda_status : "Pending"}</p >
                    <
                    p className = "text-gray-700 dark:text-gray-300" > < strong > Kebele Status: < /strong> {selectedRequest.kebele_status ? selectedRequest.kebele_status : "Pending"}</p >
                    <
                    /div> < /
                    div >

                    <
                    div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4" > { LevelBlock("kebele", selectedRequest) } { LevelBlock("woreda", selectedRequest) } { LevelBlock("zone", selectedRequest) } { LevelBlock("region", selectedRequest) } { LevelBlock("federal", selectedRequest) } <
                    /div>

                    {
                        requestAction !== "" ? ( <
                            div className = "mt-4" >
                            <
                            label className = "block mb-1 text-gray-700 dark:text-gray-300" > Feedback(optional) < /label> <
                            textarea value = { decisionReason }
                            onChange = {
                                function(e) {
                                    setDecisionReason(e.target.value);
                                }
                            }
                            rows = { 3 }
                            className = {
                                (darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border border-gray-300 text-gray-900") + " p-2 rounded w-full"
                            }
                            /> <
                            div className = "mt-3 flex gap-2" >
                            <
                            button onClick = { confirmRequestAction }
                            className = {
                                (requestAction === "Approved" ?
                                    "bg-blue-500 hover:bg-blue-600" :
                                    requestAction === "Accepted" ?
                                    "bg-green-500 hover:bg-green-600" :
                                    "bg-red-500 hover:bg-red-600") + " text-white py-2 px-4 rounded"
                            } >
                            Confirm { requestAction } <
                            /button> <
                            button onClick = {
                                function() {
                                    setShowRequestModal(false);
                                    setSelectedRequest(null);
                                    setRequestAction("");
                                    setDecisionReason("");
                                }
                            }
                            className = "bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded" >
                            Cancel <
                            /button> < /
                            div > <
                            /div>
                        ) : null
                    } <
                    /div>
                ) : null
            } <
            /div> < /
            div >
        ) : null
    }

{ /* Product Modal */ } {
    showProductModal ? ( <
            div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
            <
            div className = {
                (darkMode ? "bg-gray-800" : "bg-white") + " w-full max-w-3xl p-6 rounded shadow max-h-[90vh] overflow-y-auto"
            } >
            <
            div className = "flex justify-between items-center mb-4" >
            <
            h2 className = "text-xl font-bold text-gray-900 dark:text-white" > { editingProduct === null ? "Add Product" : "Edit Product" } < /h2> <
            button onClick = {
                function() {
                    setShowProductModal(false);
                    setEditingProduct(null);
                }
            }
            className = "text-gray-600 dark:text-gray-300 hover:underline" >
            Close <
            /button> < /
            div >

            <
            form onSubmit = { handleProductSubmit } >
            <
            div className = "grid grid-cols-1 md:grid-cols-2 gap-4" >
            <
            div >
            <
            label className = "block mb-1 text-gray-700 dark:text-gray-300" > Name * < /label> <
            input type = "text"
            value = { productForm.name }
            onChange = {
                function(e) {
                    setProductForm({...productForm, name: e.target.value });
                }
            }
            required className = {
                (darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border border-gray-300 text-gray-900") + " p-2 rounded w-full"
            }
            /> < /
            div > <
            div >
            <
            label className = "block mb-1 text-gray-700 dark:text-gray-300" > Category * < /label> <
            select value = { productForm.category }
            onChange = {
                function(e) {
                    const cat = e.target.value;
                    setProductForm({...productForm, category: cat, subCategory: "" });
                }
            }
            required className = {
                (darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border border-gray-300 text-gray-900") + " p-2 rounded w-full"
            } >
            <
            option value = "" > Select category < /option> {
            Object.keys(productCategories).map(function(c) {
                return ( <
                    option key = { c }
                    value = { c } > { c } <
                    /option>
                );
            })
        } <
        /select> < /
    div > <
        div >
        <
        label className = "block mb-1 text-gray-700 dark:text-gray-300" > Subcategory < /label> <
    select value = { productForm.subCategory }
    onChange = {
        function(e) {
            setProductForm({...productForm, subCategory: e.target.value });
        }
    }
    className = {
            (darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border border-gray-300 text-gray-900") + " p-2 rounded w-full"
        } >
        <
        option value = "" > — < /option> {
    productForm.category !== "" && productCategories[productForm.category] ?
        productCategories[productForm.category].subcategories.map(function(s) {
            return ( <
                option key = { s }
                value = { s } > { s } <
                /option>
            );
        }) :
        null
} <
/select> < /
div > <
    div >
    <
    label className = "block mb-1 text-gray-700 dark:text-gray-300" > Unit < /label> <
select value = { productForm.unit }
onChange = {
    function(e) {
        setProductForm({...productForm, unit: e.target.value });
    }
}
className = {
        (darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border border-gray-300 text-gray-900") + " p-2 rounded w-full"
    } >
    <
    option value = "" > — < /option> {
productForm.category !== "" && productCategories[productForm.category] ?
    productCategories[productForm.category].units.map(function(u) {
        return ( <
            option key = { u }
            value = { u } > { u } <
            /option>
        );
    }) :
    null
} <
/select> < /
div > <
    div >
    <
    label className = "block mb-1 text-gray-700 dark:text-gray-300" > Amount * < /label> <
input type = "number"
min = "0"
value = { productForm.amount }
onChange = {
    function(e) {
        setProductForm({...productForm, amount: e.target.value });
    }
}
required className = {
    (darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border border-gray-300 text-gray-900") + " p-2 rounded w-full"
}
/> < /
div > <
    div >
    <
    label className = "block mb-1 text-gray-700 dark:text-gray-300" > Price * < /label> <
input type = "number"
min = "0"
step = "0.01"
value = { productForm.price }
onChange = {
    function(e) {
        setProductForm({...productForm, price: e.target.value });
    }
}
required className = {
    (darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border border-gray-300 text-gray-900") + " p-2 rounded w-full"
}
/> < /
div > <
    div className = "md:col-span-2" >
    <
    label className = "block mb-1 text-gray-700 dark:text-gray-300" > Description < /label> <
textarea rows = { 3 }
value = { productForm.description }
onChange = {
    function(e) {
        setProductForm({...productForm, description: e.target.value });
    }
}
className = {
    (darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border border-gray-300 text-gray-900") + " p-2 rounded w-full"
}
/> < /
div > <
    div >
    <
    label className = "block mb-1 text-gray-700 dark:text-gray-300" > Manufacturer < /label> <
input type = "text"
value = { productForm.manufacturer }
onChange = {
    function(e) {
        setProductForm({...productForm, manufacturer: e.target.value });
    }
}
className = {
    (darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border border-gray-300 text-gray-900") + " p-2 rounded w-full"
}
/> < /
div > <
    div >
    <
    label className = "block mb-1 text-gray-700 dark:text-gray-300" > Expiry Date < /label> <
input type = "date"
value = { productForm.expiryDate }
onChange = {
    function(e) {
        setProductForm({...productForm, expiryDate: e.target.value });
    }
}
className = {
    (darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border border-gray-300 text-gray-900") + " p-2 rounded w-full"
}
/> < /
div > <
    /div>

<
div className = "mt-4" >
    <
    button type = "submit"
className = "bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded" > { editingProduct === null ? "Add Product" : "Save Changes" } <
    /button> < /
div > <
    /form> < /
div > <
    /div>
): null
}

{ /* Zone Admin Modal */ } {
    showAdminModal ? ( <
        div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" >
        <
        div className = {
            (darkMode ? "bg-gray-800" : "bg-white") + " w-full max-w-2xl p-6 rounded shadow max-h-[90vh] overflow-y-auto"
        } >
        <
        div className = "flex justify-between items-center mb-4" >
        <
        h2 className = "text-xl font-bold text-gray-900 dark:text-white" > { editingAdmin === null ? "Add Zone Admin" : "Edit Zone Admin" } < /h2> <
        button onClick = {
            function() {
                setShowAdminModal(false);
            }
        }
        className = "text-gray-600 dark:text-gray-300 hover:underline" >
        Close <
        /button> < /
        div >

        <
        form onSubmit = { saveZoneAdmin } >
        <
        div className = "grid grid-cols-1 md:grid-cols-2 gap-4" >
        <
        div >
        <
        label className = "block mb-1 text-gray-700 dark:text-gray-300" > Full Name * < /label> <
        input type = "text"
        value = { adminForm.fullName }
        onChange = {
            function(e) {
                setAdminForm({...adminForm, fullName: e.target.value });
            }
        }
        required className = {
            (darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border border-gray-300 text-gray-900") + " p-2 rounded w-full"
        }
        /> < /
        div > <
        div >
        <
        label className = "block mb-1 text-gray-700 dark:text-gray-300" > Phone Number * < /label> <
        input type = "text"
        value = { adminForm.phoneNumber }
        onChange = {
            function(e) {
                setAdminForm({...adminForm, phoneNumber: e.target.value });
            }
        }
        required className = {
            (darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border border-gray-300 text-gray-900") + " p-2 rounded w-full"
        }
        /> < /
        div > <
        div >
        <
        label className = "block mb-1 text-gray-700 dark:text-gray-300" > Zone * < /label> <
        input type = "text"
        value = { adminForm.zone_name }
        onChange = {
            function(e) {
                setAdminForm({...adminForm, zone_name: e.target.value });
            }
        }
        required className = {
            (darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border border-gray-300 text-gray-900") + " p-2 rounded w-full"
        }
        /> < /
        div > <
        div >
        <
        label className = "block mb-1 text-gray-700 dark:text-gray-300" > Password { editingAdmin === null ? "*" : "(leave blank to keep)" } < /label> <
        input type = "password"
        value = { adminForm.password }
        onChange = {
            function(e) {
                setAdminForm({...adminForm, password: e.target.value });
            }
        }
        className = {
            (darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border border-gray-300 text-gray-900") + " p-2 rounded w-full"
        }
        /> <
        input type = "password"
        placeholder = "Confirm password"
        value = { adminForm.confirmPassword }
        onChange = {
            function(e) {
                setAdminForm({...adminForm, confirmPassword: e.target.value });
            }
        }
        className = {
            (darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white border border-gray-300 text-gray-900") + " p-2 rounded w-full mt-2"
        }
        /> < /
        div > <
        /div>

        <
        div className = "mt-4" >
        <
        button type = "submit"
        className = "bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded" > { editingAdmin === null ? "Create Admin" : "Save Changes" } <
        /button> < /
        div > <
        /form> < /
        div > <
        /div>
    ) : null
} <
/div>
);
};

export default RegionDashboard;