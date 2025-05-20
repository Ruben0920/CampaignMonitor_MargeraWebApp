import React from 'react';
import AddSubscriberForm from '../components/AddSubscriberForm';

function AddSubscriberPage({ onSubscriberAdded, showSuccessMessage }) {
    return (
        <div className="page-container">
            <AddSubscriberForm
                onSubscriberAdded={onSubscriberAdded}
                showSuccessMessage={showSuccessMessage}
            />
        </div>
    );
}

export default AddSubscriberPage;
