import React, { useState, useEffect, useCallback } from 'react';
import { getSubscribers, removeSubscriber as apiRemoveSubscriber } from '../services/api';
import { Trash2, AlertCircle, RefreshCw, List  } from 'lucide-react';

function ViewSubscribersPage({ showSuccessMessage, showErrorMessage }) {
    const [subscribers, setSubscribers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const loadSubscribers = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        setError('');
        try {
            const data = await getSubscribers();
            setSubscribers(Array.isArray(data) ? data : []);
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to fetch subscribers.';
            setError(errorMessage);
            if (showErrorMessage) showErrorMessage(errorMessage);
            setSubscribers([]);
            console.error("Fetch subscribers error:", err.response || err);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [showErrorMessage]);

    useEffect(() => {
        loadSubscribers();
    }, [loadSubscribers]);

    const handleRemoveSubscriber = async (email, name) => {
        if (!window.confirm(`Are you sure you want to remove ${name} (${email})? This action cannot be undone.`)) return;
        try {
            await apiRemoveSubscriber(email);
            setSubscribers(prevSubscribers => prevSubscribers.filter(sub => sub.email !== email));
            if (showSuccessMessage) showSuccessMessage(`Subscriber '${name}' removed successfully!`);
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to remove subscriber.';
            if (showErrorMessage) showErrorMessage(errorMessage);
            console.error("Remove subscriber error:", err.response || err);
        }
    };

    return (
        <div className="sub-list-container">
            <div className="sub-list-header">
                <h2 className="sub-list-title">Subscriber List</h2>
                <button
                    onClick={() => loadSubscribers(true)}
                    disabled={isLoading}
                    className="sub-list-refresh-btn"
                >
                    <RefreshCw size={18} className={isLoading ? 'sub-list-spinner-icon' : ''} />
                    Refresh List
                </button>
            </div>

            {error && (
                 <div className="sub-list-error-box" role="alert">
                    <div className="sub-list-error-content">
                        <AlertCircle size={20} className="sub-list-error-icon"/>
                        <div>
                            <p className="sub-list-error-title">Error Fetching Subscribers</p>
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {subscribers.length === 0 && !isLoading && !error ? (
                <div className="sub-list-empty-container">
                    <List size={48} className="sub-list-empty-icon" />
                    <p className="sub-list-empty-title">No subscribers found.</p>
                    <p className="sub-list-empty-desc">Try adding some subscribers or refreshing the list.</p>
                </div>
            ) : (
                <div className="sub-list-table-wrapper">
                    <table className="sub-list-table">
                        <thead className="sub-list-table-head">
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th className="sub-list-th-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscribers.map((subscriber) => (
                                <tr key={subscriber.email} className="sub-list-row">
                                    <td>{subscriber.name}</td>
                                    <td>{subscriber.email}</td>
                                    <td className="sub-list-actions">
                                        <button
                                            onClick={() => handleRemoveSubscriber(subscriber.email, subscriber.name)}
                                            className="sub-list-remove-btn"
                                            title="Remove Subscriber"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <p style={{ fontSize: "0.9em", color: "#888", marginTop: 8 }}>
                    <em>
                        Note: Campaign Monitor processing may cause delays. Changes may take up to 1 minute to appear here and in their dashboard.
                        Please manually Reload after some time, if the table does not reflect the change immediately.
                    </em>
            </p>
        </div>
    );
}

export default ViewSubscribersPage;
