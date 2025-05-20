import React from 'react';

function HomePage({onNavigate}) {
    return (
        <div className="home-container">
            <h1 className="home-title">
                Welcome to Campaign Monitor List Manager
            </h1>
            <p className="home-intro">
                Interact with on of your Campaign Monitor mailing lists. View your current subscribers, add new ones, or remove them as needed.
            </p>
            <div className="home-grid">
                <div className="home-card home-card-indigo">
                    <h2 className="home-card-title indigo">View Subscribers</h2>
                     <p className="home-card-desc">
                    <button
                    className="home-card-link"
                    type="button"
                    onClick={() => onNavigate('view')}
                    style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        textDecoration: "underline",
                        cursor: "pointer",
                        font: "inherit"
                    }}
                    >
                    Get an overview of everyone on your mailing list. 
                    See names and email addresses.
                    </button>
                </p>
                </div>
                <div className="home-card home-card-purple">
                    <h2 className="home-card-title purple">Add Subscribers</h2>

                    <p className="home-card-desc">
                              <button
                    className="home-card-link"
                    type="button"
                    onClick={() => onNavigate('add')}
                    style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        textDecoration: "underline",
                        cursor: "pointer",
                        font: "inherit"
                    }}
                    >
                    Add new members to your list with a simple form. Keep your audience growing.
                    </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
