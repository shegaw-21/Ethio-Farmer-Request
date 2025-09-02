// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import FederalDashboard from './dashboards/FederalDashboard';
import RegionDashboard from './dashboards/RegionDashboard';
import ZoneDashboard from './dashboards/ZoneDashboard';
import WoredaDashboard from './dashboards/WoredaDashboard';
import KebeleDashboard from './dashboards/KebeleDashboard';
import FarmerDashboard from './dashboards/FarmerDashboard';

function App() {
    return ( <
        Router >
        <
        div className = "App" >
        <
        Routes >
        <
        Route path = "/"
        element = { < Navigate to = "/login"
            replace / > }
        /> <
        Route path = "/login"
        element = { < Login / > }
        /> <
        Route path = "/federal-dashboard"
        element = { < FederalDashboard / > }
        /> <
        Route path = "/region-dashboard"
        element = { < RegionDashboard / > }
        /> <
        Route path = "/zone-dashboard"
        element = { < ZoneDashboard / > }
        /> <
        Route path = "/woreda-dashboard"
        element = { < WoredaDashboard / > }
        /> <
        Route path = "/kebele-dashboard"
        element = { < KebeleDashboard / > }
        /> <
        Route path = "/farmer-dashboard"
        element = { < FarmerDashboard / > }
        /> <
        /Routes> <
        /div> <
        /Router>
    );
}

export default App;