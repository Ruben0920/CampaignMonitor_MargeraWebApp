import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    getSubscribers,
    bulkRemoveSubscribers,
    addSubscriber as apiAddSubscriber 
} from '../services/api';
import { Trash2, AlertCircle, RefreshCw, List, UploadCloud, Download, Users, X } from 'lucide-react';

function ViewSubscribersPage({ showSuccessMessage, showErrorMessage }) {
    const [subscribers, setSubscribers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedSubscribers, setSelectedSubscribers] = useState(new Set());
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef(null);

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

    const handleSelectSubscriber = (email) => {
        setSelectedSubscribers(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(email)) {
                newSelected.delete(email);
            } else {
                newSelected.add(email);
            }
            return newSelected;
        });
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const allEmails = new Set(subscribers.map(sub => sub.email));
            setSelectedSubscribers(allEmails);
        } else {
            setSelectedSubscribers(new Set());
        }
    };

    const handleRemoveSingleSubscriber = async (email, name) => {
        if (!window.confirm(`Are you sure you want to remove ${name} (${email})? This action cannot be undone.`)) return;
        try {
            await bulkRemoveSubscribers([{ email }]);
            setSubscribers(prevSubscribers => prevSubscribers.filter(sub => sub.email !== email));
            setSelectedSubscribers(prev => {
                const newSelected = new Set(prev);
                newSelected.delete(email);
                return newSelected;
            });
            if (showSuccessMessage) showSuccessMessage(`Subscriber '${name}' removed successfully!`);
        } catch (err) {
            const apiError = err.response?.data;
            let errorMessage = 'Failed to remove subscriber.';
            if (apiError?.message) {
                errorMessage = apiError.message;
            } else if (apiError?.error) {
                errorMessage = apiError.error;
            }
            if (showErrorMessage) showErrorMessage(errorMessage);
            console.error("Remove subscriber error:", err.response || err);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedSubscribers.size === 0) return;
        if (!window.confirm(`Are you sure you want to remove ${selectedSubscribers.size} selected subscribers? This action cannot be undone.`)) return;

        const emailsToRemove = Array.from(selectedSubscribers).map(email => ({ email }));
        setIsLoading(true);
        try {
            const response = await bulkRemoveSubscribers(emailsToRemove);
            if (showSuccessMessage) {
                showSuccessMessage(response.message || `${emailsToRemove.length} subscribers processed for removal.`);
            }
            
            setSelectedSubscribers(new Set());
            await loadSubscribers(false); 

        } catch (err) {
            const apiError = err.response?.data;
            let errorMessage = `Failed to remove selected subscribers.`;
            if (apiError?.message) {
                 errorMessage = apiError.message;
            } else if (apiError?.error) {
                 errorMessage = apiError.error;
            }
            if (apiError?.results) { 
                const failedEmails = apiError.results.filter(r => r.status === 'error').map(r => r.email);
                if (failedEmails.length > 0) {
                    errorMessage += ` Errors for: ${failedEmails.join(', ')}`;
                }
            }

            if (showErrorMessage) showErrorMessage(errorMessage);
            console.error("Bulk remove error:", err.response || err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportJSON = () => {
        if (subscribers.length === 0) {
            if (showErrorMessage) showErrorMessage("No subscribers to export.");
            return;
        }
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(subscribers, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = "subscribers.json";
        link.click();
        if (showSuccessMessage) showSuccessMessage("Subscribers exported to JSON.");
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
                if (showErrorMessage) showErrorMessage(missingHeaderMsg);
                setIsImporting(false);
                if(fileInputRef.current) fileInputRef.current.value = ""; 
                return;
            }

            const newSubscribers = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                if (values.length > Math.max(emailIndex, nameIndex)) {
                    const email = values[emailIndex]?.trim();
                    const name = values[nameIndex]?.trim();
                    if (email && name) { 
                        newSubscribers.push({ email, name });
                    }
                }
            }

            if (newSubscribers.length === 0) {
                const noSubscribersMsg = "No valid subscribers found in CSV.";
                setError(noSubscribersMsg);
                if (showErrorMessage) showErrorMessage(noSubscribersMsg);
                setIsImporting(false);
                if(fileInputRef.current) fileInputRef.current.value = "";
                return;
            }

            try {
                const response = await apiAddSubscriber(newSubscribers);
                if (showSuccessMessage) showSuccessMessage(response.message || `${newSubscribers.length} subscribers imported successfully/queued for import.`);
                await loadSubscribers(false); 
            } catch (err) {
                const apiError = err.response?.data;
                let importErrorMsg = "Failed to import subscribers from CSV.";
                if (apiError?.message) {
                    importErrorMsg = apiError.message;
                } else if (apiError?.error) {
                    importErrorMsg = apiError.error;
                }
                 if (apiError?.details?.FailureDetails?.length > 0) {
                    importErrorMsg += ` Failures: ${apiError.details.FailureDetails.map(f => `${f.EmailAddress}: ${f.Code} - ${f.Message}`).join('; ')}`;
                }
                setError(importErrorMsg);
                if (showErrorMessage) showErrorMessage(importErrorMsg);
                console.error("CSV Import error:", err.response || err);
            } finally {
                setIsImporting(false);
                if(fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsText(file);
    };


    const isAllSelected = subscribers.length > 0 && selectedSubscribers.size === subscribers.length;

    return (
        <div className="sub-list-container">
            <div className="sub-list-header" style={{ marginBottom: '20px' }}>
                <h2 className="sub-list-title">Subscriber List</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        onClick={() => loadSubscribers(true)}
                        disabled={isLoading || isImporting}
                        className="sub-list-refresh-btn"
                    >
                        <RefreshCw size={18} className={(isLoading || isImporting) ? 'sub-list-spinner-icon' : ''} />
                        Refresh List
                    </button>
                     <button
                        onClick={handleExportJSON}
                        disabled={subscribers.length === 0 || isLoading || isImporting}
                        className="sub-list-refresh-btn" 
                        title="Export current list to JSON"
                    >
                        <Download size={18} />
                        Export JSON
                    </button>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleImportCSV}
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        disabled={isLoading || isImporting}
                    />
                    <button
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        disabled={isLoading || isImporting}
                        className="sub-list-refresh-btn"
                        title="Import subscribers from a CSV file"
                    >
                        <UploadCloud size={18} />
                        {isImporting ? 'Importing...' : 'Import CSV'}
                    </button>
                </div>
            </div>
             {selectedSubscribers.size > 0 && (
                <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#eef2ff', borderRadius: '8px' }}>
                    <span>{selectedSubscribers.size} subscriber(s) selected</span>
                    <button
                    onClick={handleBulkDelete}
                    disabled={isLoading || isImporting || selectedSubscribers.size === 0}
                    className="flat-danger-btn"
                    title="Delete selected subscribers"
                >
            <Trash2 size={18} style={{ marginRight: '5px' }} />
            Delete Selected
        </button>

                </div>
            )}


            {error && !isLoading && (
                 <div className="sub-list-error-box" role="alert">
                    <div className="sub-list-error-content">
                        <AlertCircle size={20} className="sub-list-error-icon"/>
                        <div>
                            <p className="sub-list-error-title">An Error Occurred</p>
                            <p>{error}</p>
                        </div>
                         <button onClick={() => setError('')} title="Clear error" style={{background:'none', border:'none', cursor:'pointer', marginLeft: 'auto'}}><X size={18} /></button>
                    </div>
                </div>
            )}

            {isLoading && subscribers.length === 0 && ( // initial loading state
                <div className="sub-list-loading-container">
                    <RefreshCw size={48} className="sub-list-spinner" />
                    <p className="sub-list-loading-text">Loading subscribers...</p>
                </div>
            )}

            {!isLoading && subscribers.length === 0 && !error ? (
                <div className="sub-list-empty-container">
                    <Users size={48} className="sub-list-empty-icon" />
                    <p className="sub-list-empty-title">No subscribers found.</p>
                    <p className="sub-list-empty-desc">Try adding some subscribers, importing from CSV, or refreshing the list.</p>
                </div>
            ) : subscribers.length > 0 ? ( // only render table if there are subscribers
                <div className="sub-list-table-wrapper">
                    <table className="sub-list-table">
                        <thead className="sub-list-table-head">
                            <tr>
                                <th style={{ width: '50px', textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={isAllSelected}
                                        disabled={isLoading || isImporting}
                                        title={isAllSelected ? "Deselect all" : "Select all"}
                                    />
                                </th>
                                <th>Name</th>
                                <th>Email</th>
                                <th className="sub-list-th-actions" style={{width: '100px'}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscribers.map((subscriber) => (
                                <tr key={subscriber.email} className={`sub-list-row ${selectedSubscribers.has(subscriber.email) ? 'selected' : ''}`}>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedSubscribers.has(subscriber.email)}
                                            onChange={() => handleSelectSubscriber(subscriber.email)}
                                            disabled={isLoading || isImporting}
                                        />
                                    </td>
                                    <td>{subscriber.name}</td>
                                    <td>{subscriber.email}</td>
                                    <td className="sub-list-actions">
                                        <button
                                            onClick={() => handleRemoveSingleSubscriber(subscriber.email, subscriber.name)}
                                            className="sub-list-remove-btn"
                                            title="Remove Subscriber"
                                            disabled={isLoading || isImporting}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null} {/* dont render table structure if loading and empty or error and empty */}
             <p style={{ fontSize: "0.9em", color: "#888", marginTop: 20, textAlign:'center' }}>
                <em>
                    Note: Campaign Monitor processing may cause delays. Changes may take up to 1 minute to appear.
                    Please Refresh if the table does not reflect changes immediately.
                </em>
            </p>
        </div>
    );
}

export default ViewSubscribersPage;