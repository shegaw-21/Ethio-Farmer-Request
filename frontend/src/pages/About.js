// pages/About.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

const About = () => {
    const [language, setLanguage] = useState('en'); // 'en' or 'am'

    const translations = {
        en: {
            title: 'Ethiopian Agricultural Product Request System',
            subtitle: 'Streamlining agricultural machinery and product requests through Ethiopia\'s administrative hierarchy with secure, efficient, and transparent digital management.',
            systemPurpose: 'System Purpose',
            purposeDesc1: 'The Ethiopian Agricultural Product Request System is designed to revolutionize how farmers access agricultural machinery and products across Ethiopia\'s complex administrative structure.',
            purposeDesc2: 'Our system eliminates bureaucratic delays, ensures transparency, and provides real-time tracking of requests from submission to delivery.',
            mission: 'Mission:',
            missionDesc: 'To empower Ethiopian farmers with efficient access to agricultural resources through digital transformation and streamlined approval processes.',
            approvalWorkflow: 'Approval Workflow',
            workflowDesc: 'Requests flow through Ethiopia\'s administrative hierarchy from local to federal level:',
            decisionTypes: 'Decision Types at Each Level:',
            approve: 'Approve',
            approveDesc: 'Request is supported and moves to the next administrative level for further review',
            reject: 'Reject',
            rejectDesc: 'Request is not supported and the process stops immediately',
            accept: 'Accept',
            acceptDesc: 'Request is supported AND the product is available at this administrative level for delivery',
            lowerLevelNote: 'Note: Administrators can only process requests that have been approved from lower administrative levels.',
            accessSystem: 'Access System',
            userRoles: 'User Roles & Responsibilities',
            farmers: 'Farmers',
            farmersResponsibilities: [
                'Submit product requests',
                'Track request status',
                'Update pending requests',
                'Cancel requests if needed',
                'View delivery notifications'
            ],
            kebeleReps: 'Kebele Representatives',
            kebeleResponsibilities: [
                'Submit requests for farmers',
                'Review local requests',
                'Provide community feedback',
                'Coordinate with farmers',
                'Local resource management'
            ],
            woredaAdmins: 'Woreda Administrators',
            woredaResponsibilities: [
                'Approve/reject kebele requests',
                'Manage district resources',
                'Mark requests as delivered',
                'Oversee multiple kebeles',
                'District-level reporting'
            ],
            zoneAdmins: 'Zone Administrators',
            zoneResponsibilities: [
                'Zone-level approvals',
                'Coordinate multiple woredas',
                'Resource allocation planning',
                'Zone-wide reporting',
                'Strategic oversight'
            ],
            regionAdmins: 'Region Administrators',
            regionResponsibilities: [
                'Regional-level approvals',
                'Multi-zone coordination',
                'Regional policy implementation',
                'Large-scale resource planning',
                'Regional analytics'
            ],
            federalAdmins: 'Federal Administrators',
            federalResponsibilities: [
                'Final approvals & oversight',
                'Master data management',
                'System-wide administration',
                'Policy implementation',
                'National-level reporting'
            ],
            keyFeatures: 'Key System Features',
            secureAuth: 'Secure Authentication',
            secureAuthDesc: 'Role-based access control with JWT tokens ensuring secure access to appropriate system functions.',
            realTimeTracking: 'Real-Time Tracking',
            realTimeTrackingDesc: 'Monitor request status at each administrative level with detailed feedback and timestamps.',
            workflowManagement: 'Workflow Management',
            workflowManagementDesc: 'Structured multi-level approval process ensuring proper oversight and accountability.',
            mobileResponsive: 'Mobile Responsive',
            mobileResponsiveDesc: 'Fully responsive design ensuring accessibility across all devices and screen sizes.',
            comprehensiveReporting: 'Comprehensive Reporting',
            comprehensiveReportingDesc: 'Role-specific dashboards with analytics and reporting tools for informed decision-making.',
            highPerformance: 'High Performance',
            highPerformanceDesc: 'Optimized for speed and scalability to handle growing numbers of users and requests.',
            techSpecs: 'Technical Specifications',
            supportContact: 'Support & Contact',
            supportDesc: 'For technical support, training, or inquiries about the Ethiopian Agricultural Product Request System, please contact your system administrator or the technical support team.',
            farmer: 'Farmer',
            kebele: 'Kebele',
            woreda: 'Woreda',
            zone: 'Zone',
            region: 'Region',
            federal: 'Federal'
        },
        am: {
            title: 'የኢትዮጵያ የግብርና ምርት ጥያቄ ስርዓት',
            subtitle: 'በኢትዮጵያ የአስተዳደር ተዋረድ ውስጥ የግብርና ማሽነሪዎችን እና የምርት ጥያቄዎችን በደህንነት፣ በብቃት እና በግልጽነት ማስተዳደር።',
            systemPurpose: 'የስርዓቱ ዓላማ',
            purposeDesc1: 'የኢትዮጵያ የግብርና ምርት ጥያቄ ስርዓት ገበሬዎች በኢትዮጵያ ውስብስብ የአስተዳደር መዋቅር ውስጥ የግብርና ማሽነሪዎችን እና ምርቶችን እንዴት እንደሚያገኙ ለመቀየር ተዘጋጅቷል።',
            purposeDesc2: 'ስርዓታችን የቢሮክራሲ መዘግየቶችን ያስወግዳል፣ ግልጽነትን ያረጋግጣል፣ እና ከማቅረቢያ እስከ ማድረሻ ድረስ የጥያቄዎችን የእውነተኛ ጊዜ ክትትል ይሰጣል።',
            mission: 'ተልእኮ:',
            missionDesc: 'የኢትዮጵያ ገበሬዎችን በዲጂታል ለውጥ እና በተቀላጠፈ የፈቃድ ሂደቶች በኩል ለግብርና ሀብቶች ቀልጣፋ መዳረሻ ማብቃት።',
            approvalWorkflow: 'የፈቃድ የስራ ሂደት',
            workflowDesc: 'ጥያቄዎች በኢትዮጵያ የአስተዳደር ተዋረድ ከአካባቢ እስከ ፌዴራል ደረጃ ይፈስሳሉ:',
            decisionTypes: 'በእያንዳንዱ ደረጃ የውሳኔ አይነቶች:',
            approve: 'ፈቃድ',
            approveDesc: 'ጥያቄው የተደገፈ ነው እና ለተጨማሪ ግምገማ ወደ ቀጣዩ የአስተዳደር ደረጃ ይሄዳል',
            reject: 'ውድቅ',
            rejectDesc: 'ጥያቄው አልተደገፈም እና ሂደቱ ወዲያውኑ ይቆማል',
            accept: 'ተቀብል',
            acceptDesc: 'ጥያቄው የተደገፈ ነው እና ምርቱ በዚህ የአስተዳደር ደረጃ ለማድረሻ ይገኛል',
            lowerLevelNote: 'ማስታወሻ: አስተዳዳሪዎች ከዝቅተኛ የአስተዳደር ደረጃዎች የተፈቀዱ ጥያቄዎችን ብቻ ማስኬድ ይችላሉ።',
            accessSystem: 'ስርዓቱን ይድረሱ',
            userRoles: 'የተጠቃሚ ሚናዎች እና ኃላፊነቶች',
            farmers: 'ገበሬዎች',
            farmersResponsibilities: [
                'የምርት ጥያቄዎችን ያስገቡ',
                'የጥያቄ ሁኔታን ይከታተሉ',
                'በመጠባበቅ ላይ ያሉ ጥያቄዎችን ያዘምኑ',
                'አስፈላጊ ከሆነ ጥያቄዎችን ይሰርዙ',
                'የማድረሻ ማሳወቂያዎችን ይመልከቱ'
            ],
            kebeleReps: 'ቀበሌ ተወካዮች',
            kebeleResponsibilities: [
                'ለገበሬዎች ጥያቄዎችን ያስገቡ',
                'የአካባቢ ጥያቄዎችን ይገምግሙ',
                'የማህበረሰብ አስተያየት ይስጡ',
                'ከገበሬዎች ጋር ይተባበሩ',
                'የአካባቢ ሀብት አስተዳደር'
            ],
            woredaAdmins: 'ወረዳ አስተዳዳሪዎች',
            woredaResponsibilities: [
                'የቀበሌ ጥያቄዎችን ይፈቅዱ/ይከልክሉ',
                'የወረዳ ሀብቶችን ያስተዳድሩ',
                'ጥያቄዎችን እንደተደረሱ ያመልክቱ',
                'ብዙ ቀበሌዎችን ይቆጣጠሩ',
                'የወረዳ ደረጃ ሪፖርት'
            ],
            zoneAdmins: 'ዞን አስተዳዳሪዎች',
            zoneResponsibilities: [
                'የዞን ደረጃ ፈቃዶች',
                'ብዙ ወረዳዎችን ያስተባብሩ',
                'የሀብት ክፍፍል እቅድ',
                'በዞን ደረጃ ሪፖርት',
                'ስትራቴጂካዊ ቁጥጥር'
            ],
            regionAdmins: 'ክልል አስተዳዳሪዎች',
            regionResponsibilities: [
                'የክልል ደረጃ ፈቃዶች',
                'ብዙ ዞን ቅንጅት',
                'የክልል ፖሊሲ አፈጻጸም',
                'ትልቅ ደረጃ ሀብት እቅድ',
                'የክልል ትንታኔዎች'
            ],
            federalAdmins: 'ፌዴራል አስተዳዳሪዎች',
            federalResponsibilities: [
                'የመጨረሻ ፈቃዶች እና ቁጥጥር',
                'ዋና መረጃ አስተዳደር',
                'በስርዓት ደረጃ አስተዳደር',
                'ፖሊሲ አፈጻጸም',
                'በሀገር ደረጃ ሪፖርት'
            ],
            keyFeatures: 'ዋና የስርዓት ባህሪያት',
            secureAuth: 'ደህንነቱ የተጠበቀ ማረጋገጫ',
            secureAuthDesc: 'በሚና ላይ የተመሰረተ የመዳረሻ ቁጥጥር ከJWT ቶከኖች ጋር ለተገቢ የስርዓት ተግባራት ደህንነቱ የተጠበቀ መዳረሻ ያረጋግጣል።',
            realTimeTracking: 'የእውነተኛ ጊዜ ክትትል',
            realTimeTrackingDesc: 'በእያንዳንዱ የአስተዳደር ደረጃ የጥያቄ ሁኔታን በዝርዝር አስተያየት እና ጊዜ ማህተሞች ይከታተሉ።',
            workflowManagement: 'የስራ ሂደት አስተዳደር',
            workflowManagementDesc: 'የተዋቀረ ባለብዙ ደረጃ የፈቃድ ሂደት ተገቢ ቁጥጥር እና ተጠያቂነትን ያረጋግጣል።',
            mobileResponsive: 'ሞባይል ምላሽ ሰጪ',
            mobileResponsiveDesc: 'በሁሉም መሳሪያዎች እና የስክሪን መጠኖች ላይ ተደራሽነትን የሚያረጋግጥ ሙሉ በሙሉ ምላሽ ሰጪ ዲዛይን።',
            comprehensiveReporting: 'አጠቃላይ ሪፖርት',
            comprehensiveReportingDesc: 'ለመረጃ ላይ የተመሰረተ ውሳኔ አሰጣጥ በሚና ላይ የተመሰረተ ዳሽቦርዶች ከትንታኔ እና ሪፖርት መሳሪያዎች ጋር።',
            highPerformance: 'ከፍተኛ አፈጻጸም',
            highPerformanceDesc: 'እየጨመረ የሚሄደውን የተጠቃሚዎች እና ጥያቄዎች ቁጥር ለመያዝ ለፍጥነት እና ለመጠን መስፋፋት የተመቻቸ።',
            techSpecs: 'ቴክኒካል ዝርዝሮች',
            supportContact: 'ድጋፍ እና ግንኙነት',
            supportDesc: 'ለቴክኒካል ድጋፍ፣ ስልጠና፣ ወይም ስለ ኢትዮጵያ የግብርና ምርት ጥያቄ ስርዓት ጥያቄዎች፣ እባክዎን የስርዓት አስተዳዳሪዎን ወይም የቴክኒካል ድጋፍ ቡድንን ያነጋግሩ።',
            farmer: 'ገበሬ',
            kebele: 'ቀበሌ',
            woreda: 'ወረዳ',
            zone: 'ዞን',
            region: 'ክልል',
            federal: 'ፌዴራል'
        }
    };

    const t = translations[language];

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'am' : 'en');
    };
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50">
            <div className="bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        {/* Logo and System Name */}
                        <div className="flex items-center space-x-3">
                            <div className="text-2xl">🇪🇹</div>
                            <div>
                                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                                    {t.title}
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
                                {language === 'en' ? 'አማ' : 'EN'}
                            </button>

                            {/* Login Button */}
                            <Link
                                to="/"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        🌾 {t.title}
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        {t.subtitle}
                    </p>
                </div>

                {/* System Overview */}
                <div className="grid md:grid-cols-2 gap-12 mb-16">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">🎯 {t.systemPurpose}</h2>
                        <div className="space-y-4 text-gray-600">
                            <p>
                                {t.purposeDesc1}
                            </p>
                            <p>
                                {t.purposeDesc2}
                            </p>
                            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                                <p className="font-semibold text-green-800">{t.mission}</p>
                                <p className="text-green-700">
                                    {t.missionDesc}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">🔄 {t.approvalWorkflow}</h2>
                        <div className="space-y-4 text-gray-600 mb-4">
                            <p>{t.workflowDesc}</p>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                <div className="flex items-center justify-center mb-4">
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">🚜</div>
                                        <div className="text-sm font-medium">{t.farmer}</div>
                                    </div>
                                    <div className="mx-4 text-gray-400">→</div>
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">🏠</div>
                                        <div className="text-sm font-medium">{t.kebele}</div>
                                    </div>
                                    <div className="mx-4 text-gray-400">→</div>
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">🏘️</div>
                                        <div className="text-sm font-medium">{t.woreda}</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">📍</div>
                                        <div className="text-sm font-medium">{t.zone}</div>
                                    </div>
                                    <div className="mx-4 text-gray-400">→</div>
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">🌍</div>
                                        <div className="text-sm font-medium">{t.region}</div>
                                    </div>
                                    <div className="mx-4 text-gray-400">→</div>
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">🏛️</div>
                                        <div className="text-sm font-medium">{t.federal}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-blue-800 mb-3">{t.decisionTypes}</h3>
                                <div className="space-y-3">
                                    <div className="bg-white p-3 rounded border-l-4 border-green-500">
                                        <div className="flex items-center mb-1">
                                            <span className="text-green-600 mr-2">✅</span>
                                            <strong className="text-green-800">{t.approve}:</strong>
                                        </div>
                                        <p className="text-green-700 text-sm ml-6">{t.approveDesc}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded border-l-4 border-red-500">
                                        <div className="flex items-center mb-1">
                                            <span className="text-red-600 mr-2">❌</span>
                                            <strong className="text-red-800">{t.reject}:</strong>
                                        </div>
                                        <p className="text-red-700 text-sm ml-6">{t.rejectDesc}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                                        <div className="flex items-center mb-1">
                                            <span className="text-blue-600 mr-2">🎯</span>
                                            <strong className="text-blue-800">{t.accept}:</strong>
                                        </div>
                                        <p className="text-blue-700 text-sm ml-6">{t.acceptDesc}</p>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                    <p className="text-yellow-800 text-sm font-medium">
                                        <span className="text-yellow-600 mr-2">ℹ️</span>
                                        {t.lowerLevelNote}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Roles */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">👥 {t.userRoles}</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-green-500">
                            <div className="text-4xl mb-4">🚜</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{t.farmers}</h3>
                            <ul className="text-gray-600 space-y-2 text-sm">
                                {t.farmersResponsibilities.map((responsibility, index) => (
                                    <li key={index}>• {responsibility}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-blue-500">
                            <div className="text-4xl mb-4">🏠</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{t.kebeleReps}</h3>
                            <ul className="text-gray-600 space-y-2 text-sm">
                                {t.kebeleResponsibilities.map((responsibility, index) => (
                                    <li key={index}>• {responsibility}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-purple-500">
                            <div className="text-4xl mb-4">🏘️</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{t.woredaAdmins}</h3>
                            <ul className="text-gray-600 space-y-2 text-sm">
                                {t.woredaResponsibilities.map((responsibility, index) => (
                                    <li key={index}>• {responsibility}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-orange-500">
                            <div className="text-4xl mb-4">📍</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{t.zoneAdmins}</h3>
                            <ul className="text-gray-600 space-y-2 text-sm">
                                {t.zoneResponsibilities.map((responsibility, index) => (
                                    <li key={index}>• {responsibility}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-teal-500">
                            <div className="text-4xl mb-4">🌍</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{t.regionAdmins}</h3>
                            <ul className="text-gray-600 space-y-2 text-sm">
                                {t.regionResponsibilities.map((responsibility, index) => (
                                    <li key={index}>• {responsibility}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-red-500">
                            <div className="text-4xl mb-4">🏛️</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{t.federalAdmins}</h3>
                            <ul className="text-gray-600 space-y-2 text-sm">
                                {t.federalResponsibilities.map((responsibility, index) => (
                                    <li key={index}>• {responsibility}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Key Features */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">✨ {t.keyFeatures}</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <div className="text-2xl">🔐</div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.secureAuth}</h3>
                                    <p className="text-gray-600">{t.secureAuthDesc}</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="bg-green-100 p-3 rounded-full">
                                    <div className="text-2xl">📊</div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.realTimeTracking}</h3>
                                    <p className="text-gray-600">{t.realTimeTrackingDesc}</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="bg-purple-100 p-3 rounded-full">
                                    <div className="text-2xl">🔄</div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.workflowManagement}</h3>
                                    <p className="text-gray-600">{t.workflowManagementDesc}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <div className="bg-orange-100 p-3 rounded-full">
                                    <div className="text-2xl">📱</div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.mobileResponsive}</h3>
                                    <p className="text-gray-600">{t.mobileResponsiveDesc}</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="bg-teal-100 p-3 rounded-full">
                                    <div className="text-2xl">📈</div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.comprehensiveReporting}</h3>
                                    <p className="text-gray-600">{t.comprehensiveReportingDesc}</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="bg-red-100 p-3 rounded-full">
                                    <div className="text-2xl">⚡</div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.highPerformance}</h3>
                                    <p className="text-gray-600">{t.highPerformanceDesc}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technical Specifications */}
                <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">🔧 {t.techSpecs}</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-3">Frontend Technologies</h3>
                            <ul className="text-gray-600 space-y-1 text-sm">
                                <li>• React.js with Hooks</li>
                                <li>• Tailwind CSS</li>
                                <li>• React Router</li>
                                <li>• Responsive Design</li>
                                <li>• Modern JavaScript (ES6+)</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-3">Backend Technologies</h3>
                            <ul className="text-gray-600 space-y-1 text-sm">
                                <li>• Node.js & Express.js</li>
                                <li>• MySQL Database</li>
                                <li>• JWT Authentication</li>
                                <li>• RESTful API Design</li>
                                <li>• Bcrypt Security</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-3">Security Features</h3>
                            <ul className="text-gray-600 space-y-1 text-sm">
                                <li>• Role-based Access Control</li>
                                <li>• Password Hashing & Salting</li>
                                <li>• JWT Token Management</li>
                                <li>• Input Validation</li>
                                <li>• Secure API Endpoints</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Contact/Support */}
                <div className="text-center bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl p-8">
                    <h2 className="text-2xl font-bold mb-4">🤝 {t.supportContact}</h2>
                    <p className="text-green-100 mb-6 max-w-2xl mx-auto">
                        {t.supportDesc}
                    </p>
                    <div className="flex justify-center space-x-4">
                        <Link
                            to="/"
                            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                        >
                            {t.accessSystem}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
