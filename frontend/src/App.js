// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import About from './pages/About';
import FederalDashboard from './dashboards/FederalDashboard';
import RegionDashboard from './dashboards/RegionDashboard';
import ZoneDashboard from './dashboards/ZoneDashboard';
import WoredaDashboard from './dashboards/WoredaDashboard';
import KebeleDashboard from './dashboards/KebeleDashboard';
import FarmerDashboard from './dashboards/FarmerDashboard';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/federal-dashboard" element={<FederalDashboard />} />
                    <Route path="/region-dashboard" element={<RegionDashboard />} />
                    <Route path="/zone-dashboard" element={<ZoneDashboard />} />
                    <Route path="/woreda-dashboard" element={<WoredaDashboard />} />
                    <Route path="/kebele-dashboard" element={<KebeleDashboard />} />
                    <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
