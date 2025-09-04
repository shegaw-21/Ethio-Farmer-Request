// pages/Home.js
import React, { useState } from 'react';
import Header from '../components/Header';

const Home = () => {
    const [language, setLanguage] = useState('en');

    const translations = {
        en: {
            welcome: 'Welcome to the Ethiopian Agricultural Product Request System',
            amharicTitle: 'የኢትዮጵያ የግብርና ምርት ጥያቄ ስርዓት',
            description: 'Streamlining agricultural machinery and product requests across Ethiopia\'s administrative hierarchy with secure, efficient, and transparent digital management.',
            forFarmers: 'For Farmers',
            farmersDesc: 'Submit product requests, track status, and manage applications',
            forAdmins: 'For Administrators',
            adminsDesc: 'Approve requests, manage users, and oversee administrative areas'
        },
        am: {
            welcome: 'ወደ ኢትዮጵያ የግብርና ምርት ጥያቄ ስርዓት እንኳን በደህና መጡ',
            amharicTitle: 'የኢትዮጵያ የግብርና ምርት ጥያቄ ስርዓት',
            description: 'በኢትዮጵያ የአስተዳደር ተዋረድ ውስጥ የግብርና ማሽነሪዎችን እና የምርት ጥያቄዎችን በደህንነት፣ በብቃት እና በግልጽነት ዲጂታል አስተዳደር ማቀላጠፍ።',
            forFarmers: 'ለገበሬዎች',
            farmersDesc: 'የምርት ጥያቄዎችን ያስገቡ፣ ሁኔታን ይከታተሉ እና ማመልከቻዎችን ያስተዳድሩ',
            forAdmins: 'ለአስተዳዳሪዎች',
            adminsDesc: 'ጥያቄዎችን ያጽድቁ፣ ተጠቃሚዎችን ያስተዳድሩ እና የአስተዳደር አካባቢዎችን ይቆጣጠሩ'
        }
    };

    const t = translations[language];

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'am' : 'en');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50">
            <Header />
            
            {/* Language Toggle Button */}
            <div className="fixed top-20 right-4 z-50">
                <button
                    onClick={toggleLanguage}
                    className="bg-white shadow-lg rounded-full px-4 py-2 border border-gray-200 hover:shadow-xl transition-all duration-200 font-medium text-sm"
                >
                    {language === 'en' ? 'አማ' : 'EN'}
                </button>
            </div>
            
            <div className="flex min-h-screen items-center justify-center">
                {/* Welcome Content */}
                <div className="w-full flex items-center justify-center p-8">
                    <div className="max-w-md text-center">
                        <div className="text-6xl mb-6">🇪🇹</div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">
                            {t.welcome}
                        </h1>
                        <h2 className="text-xl text-gray-600 mb-8">
                            {t.amharicTitle}
                        </h2>
                        <p className="text-gray-600 mb-8">
                            {t.description}
                        </p>
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                <h3 className="font-semibold text-gray-800 mb-2">🚜 {t.forFarmers}</h3>
                                <p className="text-sm text-gray-600">{t.farmersDesc}</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                <h3 className="font-semibold text-gray-800 mb-2">👨‍💼 {t.forAdmins}</h3>
                                <p className="text-sm text-gray-600">{t.adminsDesc}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
