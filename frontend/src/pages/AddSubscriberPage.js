import React from 'react';
import AddSubscriberForm from '../components/AddSubscriberForm';

function AddSubscriberPage({ showSuccessMessage, onNavigateToView }) {
    const handleSuccess = (msg) => {
        if (showSuccessMessage) showSuccessMessage(msg);
        if (onNavigateToView) onNavigateToView(); 
    };

    return (
        <div className="page-container">
            <AddSubscriberForm
                showSuccessMessage={handleSuccess}
            />
        </div>
    );
}

export default AddSubscriberPage;
