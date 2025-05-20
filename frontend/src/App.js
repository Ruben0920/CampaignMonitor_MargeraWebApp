// src/App.js
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ViewSubscribersPage from './pages/ViewSubscribersPage';
import AddSubscriberPage from './pages/AddSubscriberPage';
import { XCircle, CheckCircle } from 'lucide-react';

function App() {
    const [currentPage, setCurrentPage] = useState('home'); // 'home', 'view', 'add'
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const handleNavigate = (page) => {
        setCurrentPage(page);
        setNotification(null);
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage onNavigate={handleNavigate} />;
            case 'view':
                return <ViewSubscribersPage showSuccessMessage={showNotification} showErrorMessage={msg => showNotification(msg, 'error')} />;
            case 'add':
                return (
                    <AddSubscriberPage
                        showSuccessMessage={showNotification}
                        onNavigateToView={() => setCurrentPage('view')}
                    />
                );
            default:
                return <HomePage onNavigate={handleNavigate} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Navbar onNavigate={handleNavigate} currentPage={currentPage} />

            {/* Notification Area */}
            {notification && (
                <div className={`fixed top-20 right-5 z-50 p-4 rounded-md shadow-lg animate-fadeIn
                    ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                >
                    <div className="flex items-center">
                        {notification.type === 'success' ? <CheckCircle className="mr-2" /> : <XCircle className="mr-2" />}
                        <span>{notification.message}</span>
                        <button onClick={() => setNotification(null)} className="ml-4 text-xl font-bold hover:opacity-75">&times;</button>
                    </div>
                </div>
            )}

            <main className="flex-grow py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {renderPage()}
                </div>
            </main>
            <footer className="bg-gray-800 text-white text-center p-6 mt-auto">
                <p>Campaign Monitor Manager. Built with React & Flask. Candidate Name: Ruben Goginyan</p>
            </footer>
        </div>
    );
}

export default App;
