import React from 'react';

function SubscriberList({ subscribers, onRemoveSubscriber, error, isLoading }) {
    if (isLoading) return <p className="sub-list-loading">Loading subscribers...</p>;
    if (error) return <p className="sub-list-error">Error fetching subscribers: {error}</p>;
    if (!subscribers || subscribers.length === 0) return <p className="sub-list-empty">No subscribers found.</p>;

    return (
        <div className="subscriber-list">
            <h3 className="sub-list-title">Subscribers</h3>
            <ul className="sub-list-ul">
                {subscribers.map((subscriber) => (
                    <li key={subscriber.email} className="sub-list-li">
                        <span>
                            {subscriber.name} <span className="sub-list-email">({subscriber.email})</span>
                        </span>
                        <button
                            onClick={() => onRemoveSubscriber(subscriber.email)}
                            className="sub-list-remove-btn"
                        >
                            Remove
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default SubscriberList;
