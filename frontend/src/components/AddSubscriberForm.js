import React, { useState } from 'react';
import { addSubscriber as apiAddSubscriber } from '../services/api';

function AddSubscriberForm({ onSubscriberAdded, showSuccessMessage }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!name || !email) {
            setError('Name and Email are required.');
            return;
        }
        setIsLoading(true);
        try {
            const newSubscriber = await apiAddSubscriber({ name, email });
            if (onSubscriberAdded) {
                onSubscriberAdded(newSubscriber);
            }
            setName('');
            setEmail('');
            if (showSuccessMessage) {
                showSuccessMessage('Subscriber added successfully!');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.cm_error?.Message ||
                                 err.response?.data?.message ||
                                 err.response?.data?.error ||
                                 'Failed to add subscriber.';
            const cmErrorCode = err.response?.data?.cm_error?.Code;

            if (cmErrorCode) {
                 setError(`Error: ${errorMessage} (Code: ${cmErrorCode})`);
            } else {
                setError(errorMessage);
            }
            console.error("Add subscriber error:", err.response || err.message || err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="add-subscriber-form">
            <h3 className="form-title">Add New Subscriber</h3>
            {error && <p className="form-error">{error}</p>}
            <div className="form-group">
                <label htmlFor="name-add" className="form-label">Name:</label>
                <input
                    type="text"
                    id="name-add"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="form-input"
                    placeholder="Jane Doe"
                />
            </div>
            <div className="form-group">
                <label htmlFor="email-add" className="form-label">Email:</label>
                <input
                    type="email"
                    id="email-add"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-input"
                    placeholder="jane.doe@example.com"
                />
            </div>
            <button
                type="submit"
                disabled={isLoading}
                className="form-button"
            >
                {isLoading ? (
                    <>
                        <span className="spinner"></span>
                        Adding...
                    </>
                ) : 'Add Subscriber'}
            </button>
        </form>
    );
}

export default AddSubscriberForm;
