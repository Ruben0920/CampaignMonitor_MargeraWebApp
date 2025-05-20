import React from 'react';

function HomePage() {
    return (
        <div className="home-container">
            <h1 className="home-title">
                Welcome to Campaign Monitor List Manager
            </h1>
            <p className="home-intro">
                This application allows you to seamlessly interact with your Campaign Monitor mailing lists.
                View your current subscribers, add new ones, or remove them as needed, all from a simple and intuitive interface.
            </p>
            <div className="home-grid">
                <div className="home-card home-card-indigo">
                    <h2 className="home-card-title indigo">View Subscribers</h2>
                    <p className="home-card-desc">
                        Get a clear overview of everyone on your mailing list. See names and email addresses at a glance.
                    </p>
                </div>
                <div className="home-card home-card-purple">
                    <h2 className="home-card-title purple">Add Subscribers</h2>
                    <p className="home-card-desc">
                        Quickly add new members to your list with a simple form. Keep your audience growing.
                    </p>
                </div>
            </div>
            <p className="home-hint">
                Use the navigation bar above to get started.
            </p>
        </div>
    );
}

export default HomePage;
