import React from 'react';
import { Home, List, UserPlus, Menu } from 'lucide-react';

function Navbar({ onNavigate, currentPage }) {
    const navItems = [
        { name: 'Home', page: 'home', icon: <Home size={18} /> },
        { name: 'View Subscribers', page: 'view', icon: <List size={18} /> },
        { name: 'Add Subscriber', page: 'add', icon: <UserPlus size={18} /> },
    ];

    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <div className="navbar-header">
                    <span className="navbar-title">CM Manager</span>
                </div>
                {/* Desktop Menu */}
                <div className="navbar-links">
                    {navItems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => {
                                onNavigate(item.page);
                                setIsMobileMenuOpen(false);
                            }}
                            className={`navbar-link${currentPage === item.page ? ' active' : ''}`}
                        >
                            {item.icon}
                            {item.name}
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
