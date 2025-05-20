// src/components/AddSubscriberForm.js
import React, { useState, useRef } from 'react';
// Ensure apiAddSubscriber can handle both single objects and arrays for bulk.
// As per our previous discussion, it should wrap an array payload into { subscribers: [...] }.
import { addSubscriber as apiAddSubscriber } from '../services/api';
import { UploadCloud } from 'lucide-react'; // For the import button icon

function AddSubscriberForm({ showSuccessMessage, onSubscriberAdded }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); 
    const [isImporting, setIsImporting] = useState(false); 

    const fileInputRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!name || !email) {
            setError('Name and Email are required for single add.');
            return;
        }
        setIsLoading(true);
        try {
            const newSubscriber = await apiAddSubscriber({ name, email });
            setName('');
            setEmail('');
            if (showSuccessMessage) {
                const successMsg = typeof newSubscriber.email === 'string' ?
                    `Subscriber '${newSubscriber.name}' (${newSubscriber.email}) added successfully!` :
                    newSubscriber.message || 'Subscriber added successfully!';
                showSuccessMessage(successMsg);
            }
            if (onSubscriberAdded) onSubscriberAdded(); 
        } catch (err) {
            const apiError = err.response?.data;
            let errorMessage = 'Failed to add subscriber.';
            if (apiError?.message) {
                errorMessage = apiError.message;
            } else if (apiError?.error) {
                errorMessage = apiError.error;
            } else if (apiError?.details?.cm_error?.Message) {
                errorMessage = `Error: ${apiError.details.cm_error.Message} (Code: ${apiError.details.cm_error.Code})`;
            }
            setError(errorMessage);
            console.error("Add subscriber error:", err.response || err.message || err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImportCSV = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsImporting(true);
        setError('');

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            const lines = text.split(/\r\n|\n/);
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const emailIndex = headers.indexOf('email');
            const nameIndex = headers.indexOf('name');

            if (emailIndex === -1 || nameIndex === -1) {
                const missingHeaderMsg = "CSV must contain 'email' and 'name' columns.";
                setError(missingHeaderMsg);
                setIsImporting(false);
                if(fileInputRef.current) fileInputRef.current.value = "";
                return;
            }

            const newSubscribers = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(','); 
                if (values.length > Math.max(emailIndex, nameIndex)) {
                    const parsedEmail = values[emailIndex]?.trim();
                    const parsedName = values[nameIndex]?.trim();
                    if (parsedEmail && parsedName) {
                        newSubscribers.push({ email: parsedEmail, name: parsedName });
                    }
                }
            }

            if (newSubscribers.length === 0) {
                const noSubscribersMsg = "No valid subscribers found in CSV to import.";
                setError(noSubscribersMsg);
                setIsImporting(false);
                if(fileInputRef.current) fileInputRef.current.value = "";
                return;
            }

            try {
                const response = await apiAddSubscriber(newSubscribers);
                if (showSuccessMessage) {
                     showSuccessMessage(response.message || `${newSubscribers.length} subscribers submitted for import successfully!`);
                }
                setName('');
                setEmail('');
                if (onSubscriberAdded) onSubscriberAdded(); 
            } catch (err) {
                const apiError = err.response?.data;
                let importErrorMsg = "Failed to import subscribers from CSV.";
                 if (apiError?.message) {
                    importErrorMsg = apiError.message;
                } else if (apiError?.error) {
                    importErrorMsg = apiError.error;
                } else if (apiError?.import_summary?.FailureDetails?.length > 0) {
                    importErrorMsg += ` Some entries failed: ${apiError.import_summary.FailureDetails.map(f => `${f.EmailAddress}: ${f.Message}`).join('; ')}`;
                } else if (apiError?.details?.cm_error?.Message) {
                     importErrorMsg = `Import Error: ${apiError.details.cm_error.Message} (Code: ${apiError.details.cm_error.Code})`;
                }
                setError(importErrorMsg);
                console.error("CSV Import error:", err.response || err.message || err);
            } finally {
                setIsImporting(false);
                if(fileInputRef.current) fileInputRef.current.value = ""; 
            }
        };
        reader.readAsText(file);
    };

    return (
        <form onSubmit={handleSubmit} className="add-subscriber-form">
            <h3 className="form-title">Add New Subscriber</h3>
            {error && <p className="form-error">{error}</p>}
            
            {/* Single Subscriber Fields */}
            <div className="form-group">
                <label htmlFor="name-add" className="form-label">Name:</label>
                <input
                    type="text"
                    id="name-add"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    placeholder="Jane Doe"
                    disabled={isImporting || isLoading}
                />
            </div>
            <div className="form-group">
                <label htmlFor="email-add" className="form-label">Email:</label>
                <input
                    type="email"
                    id="email-add"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="jane.doe@example.com"
                    disabled={isImporting || isLoading}
                />
            </div>
            <button
                type="submit"
                disabled={isLoading || isImporting || !name || !email}
                className="form-button"
            >
                {isLoading ? (
                    <>
                        <span className="spinner"></span>
                        Adding...
                    </>
                ) : 'Add Single Subscriber'}
            </button>

            {/* Divider */}
            <div style={{ textAlign: 'center', margin: '20px 0', color: '#6b7280', fontWeight: '500' }}>
                OR
            </div>

            {/* CSV Import Section */}
            <div className="form-group">
                 <label className="form-label">Import from CSV:</label>
                 <p style={{fontSize: '0.85rem', color: '#4a5568', margin: '0 0 8px 0'}}>
                    CSV file must contain 'name' and 'email' columns.
                </p>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    disabled={isLoading || isImporting}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    disabled={isLoading || isImporting}
                    className="form-button" 
                    style={{ background: '#10b981' }} 
                >
                    <UploadCloud size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    {isImporting ? (
                        <>
                            <span className="spinner" style={{borderColor: 'white', borderTopColor: '#10b981'}}></span>
                            Importing CSV...
                        </>
                    ) : 'Choose CSV File to Import'}
                </button>
            </div>
        </form>
    );
}

export default AddSubscriberForm;