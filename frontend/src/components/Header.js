// components/Header.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LoginModal from './LoginModal';

const Header = ({ showLoginButton = true, showAboutButton = true }) => {
    const [language, setLanguage] = useState('en'); // 'en' or 'am'
    const [showLoginModal, setShowLoginModal] = useState(false);

    const translations = {
        en: {
            systemName: 'Ethiopian Agricultural Product Request System',
            home: 'Home',
            about: 'About System',
            login: 'Login',
            languageToggle: 'አማ'
        },
        am: {
            systemName: 'የኢትዮጵያ የግብርና ምርት ጥያቄ ስርዓት',
            home: 'መነሻ',
            about: 'ስለ ስርዓቱ',
            login: 'ግባ',
            languageToggle: 'EN'
        }
    };

    const t = translations[language];

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'am' : 'en');
    };

    return (
        <>
            <div className="bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        {/* Logo and System Name */}
                        <div className="flex items-center space-x-3">
                            <div className="text-2xl">🇪🇹</div>
                            <div>
                                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                                    {t.systemName}
                                </h1>
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center space-x-4">
                            {/* Language Toggle */}
                            <button
                                onClick={toggleLanguage}
                                className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                title={language === 'en' ? 'Switch to Amharic' : 'Switch to English'}
                            >
                                {t.languageToggle}
                            </button>

                            {/* Home Button */}
                            <Link
                                to="/"
                                className="text-green-600 hover:text-green-800 text-sm font-medium px-3 py-2 rounded-md hover:bg-green-50 transition-colors"
                            >
                                {t.home}
                            </Link>

                            {/* About Button */}
                            {showAboutButton && (
                                <Link
                                    to="/about"
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-2 rounded-md hover:bg-blue-50 transition-colors"
                                >
                                    {t.about}
                                </Link>
                            )}

                            {/* Login Button */}
                            {showLoginButton && (
                                <button
                                    onClick={() => setShowLoginModal(true)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                    {t.login}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Login Modal */}
            {showLoginModal && (
                <LoginModal 
                    isOpen={showLoginModal} 
                    onClose={() => setShowLoginModal(false)}
                    language={language}
                />
            )}
        </>
    );
};

export default Header;
