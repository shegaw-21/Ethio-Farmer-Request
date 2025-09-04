import React from 'react';
import { Moon, Sun, User, Package, FileText, Users, Settings, LogOut } from 'lucide-react';

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  userType, 
  user, 
  darkMode, 
  setDarkMode, 
  onLogout 
}) => {
  const getMenuItems = () => {
    const baseItems = [
      { id: 'requests', label: 'Requests', icon: FileText },
      { id: 'profile', label: 'Profile', icon: User }
    ];

    switch (userType) {
      case 'Farmer':
        return [
          ...baseItems,
          { id: 'products', label: 'Available Products', icon: Package }
        ];
      case 'Kebele':
        return [
          ...baseItems,
          { id: 'products', label: 'Manage Products', icon: Package },
          { id: 'farmers', label: 'Farmers', icon: Users }
        ];
      default:
        return [
          ...baseItems,
          { id: 'farmers', label: 'Farmers', icon: Users }
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className={`fixed left-0 top-0 h-full w-64 transition-colors duration-200 ${
      darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
    } border-r shadow-lg z-50`}>
      {/* Header */}
      <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          {userType} Dashboard
        </h2>
        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Welcome, {user?.fullName}
        </p>
      </div>

      {/* Navigation */}
      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                    activeTab === item.id
                      ? darkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                      : darkMode
                        ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`w-full flex items-center px-4 py-3 rounded-lg mb-3 transition-colors duration-200 ${
            darkMode
              ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          {darkMode ? <Sun className="w-5 h-5 mr-3" /> : <Moon className="w-5 h-5 mr-3" />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
            darkMode
              ? 'text-red-400 hover:bg-red-900/20'
              : 'text-red-600 hover:bg-red-50'
          }`}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;