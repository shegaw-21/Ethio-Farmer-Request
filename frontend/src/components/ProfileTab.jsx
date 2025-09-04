import React from 'react';
import { User, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react';

const ProfileTab = ({ user, userType, darkMode }) => {
  if (!user) {
    return (
      <div className={`p-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>No profile information available</p>
      </div>
    );
  }

  const profileFields = [
    { label: 'Full Name', value: user.fullName, icon: User },
    { label: 'Email', value: user.email, icon: Mail },
    { label: 'Phone', value: user.phone, icon: Phone },
    { label: 'Address', value: user.address, icon: MapPin },
    { label: 'User Type', value: userType, icon: Shield },
    { label: 'Member Since', value: new Date(user.created_at || Date.now()).toLocaleDateString(), icon: Calendar }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className={`rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
        {/* Header */}
        <div className={`px-6 py-8 ${darkMode ? 'bg-gray-700' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}>
          <div className="flex items-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              darkMode ? 'bg-gray-600' : 'bg-white/20'
            }`}>
              <User className={`w-10 h-10 ${darkMode ? 'text-gray-300' : 'text-white'}`} />
            </div>
            <div className="ml-6">
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-white'}`}>
                {user.fullName}
              </h1>
              <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-blue-100'}`}>
                {userType}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="p-6">
          <h2 className={`text-xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Profile Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profileFields.map((field, index) => {
              const Icon = field.icon;
              return (
                <div key={index} className={`p-4 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center mb-2">
                    <Icon className={`w-5 h-5 mr-2 ${
                      darkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <span className={`font-medium ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {field.label}
                    </span>
                  </div>
                  <p className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {field.value || 'Not provided'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;