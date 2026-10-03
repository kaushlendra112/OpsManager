import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from './api';
import { ArrowLeft, MessageSquare, Clock, AlertCircle, RefreshCw, Send, CheckCircle2, Plus } from 'lucide-react';

export default function WorkItem({ user }) {
    const { id } = useParams();
    const [item, setItem] = useState(null);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [comment, setComment] = useState('');

    const loadData = async () => {
        try {
            const [itemRes, usersRes] = await Promise.all([
                api.get(`/work-items/${id}`),
                api.get('/users')
            ]);
            setItem(itemRes.data);
            setUsers(usersRes.data);
            setError('');
        } catch (err) {
            setError('Failed to load work item.');
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const handleUpdate = async (field, value) => {
        try {
            await api.put(`/work-items/${id}`, {
                ...item,
                [field]: value,
                version: item.version
            });
            loadData();
        } catch (err) {
            if (err.response?.status === 409) {
                setError(err.response.data.error);
            } else {
                setError('Failed to update. ' + (err.response?.data?.error || ''));
            }
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        try {
            await api.post(`/work-items/${id}/comments`, { content: comment });
            setComment('');
            loadData();
        } catch (err) {
            setError('Failed to add comment');
        }
    };

    if (!item) {
        if (error) {
            return (
                <div className="max-w-5xl mx-auto space-y-6 pb-12 mt-8 px-4">
                    <Link to="/" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-4">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Dashboard
                    </Link>
                    <div className="rounded-md bg-red-50 p-4 border border-red-200">
                        <div className="flex">
                            <div className="shrink-0">
                                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const canEdit = user.role !== 'Viewer';

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            <Link to="/" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
            </Link>
            
            {error && (
                <div className="rounded-md bg-red-50 p-4 border border-red-200">
                    <div className="flex">
                        <div className="shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3 flex-1 flex items-center justify-between">
                            <h3 className="text-sm font-medium text-red-800">{error}</h3>
                            {error.includes('Conflict') && (
                                <button onClick={loadData} className="ml-4 flex items-center text-sm font-medium text-red-800 hover:text-red-900 bg-red-100 px-3 py-1 rounded-md transition-colors">
                                    <RefreshCw className="w-4 h-4 mr-1" />
                                    Refresh Data
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200">
                    <div>
                        <h3 className="text-2xl font-bold leading-6 text-gray-900 flex items-center">
                            <span className="text-gray-400 mr-2">#{item.id}</span>
                            {item.title}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Created on {new Date(item.created_at).toLocaleString()}
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center">
                        <label className="mr-2 text-sm font-medium text-gray-700">State:</label>
                        <select 
                            disabled={!canEdit} 
                            value={item.state} 
                            onChange={e => handleUpdate('state', e.target.value)}
                            className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border bg-white disabled:bg-gray-100 disabled:text-gray-500"
                        >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Blocked">Blocked</option>
                            <option value="Closed">Closed</option>
                        </select>
                    </div>
                </div>
                
                <div className="px-4 py-5 sm:p-6 bg-gray-50">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="sm:col-span-1 lg:col-span-3">
                            <dt className="text-sm font-medium text-gray-500">Description</dt>
                            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap bg-white p-4 rounded border border-gray-200 min-h-25">
                                {item.description || <span className="text-gray-400 italic">No description provided.</span>}
                            </dd>
                        </div>

                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500 mb-1">Priority</dt>
                            <dd>
                                <select 
                                    disabled={!canEdit} 
                                    value={item.priority} 
                                    onChange={e => handleUpdate('priority', e.target.value)}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border bg-white disabled:bg-gray-100 disabled:text-gray-500"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </dd>
                        </div>
                        
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500 mb-1">Assignee</dt>
                            <dd>
                                <select 
                                    disabled={!canEdit} 
                                    value={item.assignee_id || ''} 
                                    onChange={e => handleUpdate('assignee_id', e.target.value ? Number(e.target.value) : null)}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border bg-white disabled:bg-gray-100 disabled:text-gray-500"
                                >
                                    <option value="">Unassigned</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.username} ({u.team})</option>
                                    ))}
                                </select>
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Comments Section */}
                <div className="bg-white shadow sm:rounded-lg border border-gray-200 flex flex-col h-125">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center">
                        <MessageSquare className="w-5 h-5 text-gray-500 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Comments</h3>
                    </div>
                    
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {item.comments.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">No comments yet.</div>
                        ) : (
                            item.comments.map(c => (
                                <div key={c.id} className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold text-indigo-900 text-sm">{c.username}</span>
                                        <span className="text-xs text-indigo-400">{new Date(c.created_at).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.content}</p>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div className="p-4 border-t border-gray-200 bg-white">
                        <form onSubmit={handleComment} className="flex space-x-3">
                            <input 
                                className="flex-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border" 
                                value={comment} 
                                onChange={e => setComment(e.target.value)} 
                                placeholder="Type a comment..." 
                                required 
                            />
                            <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                <Send className="w-4 h-4 mr-2" />
                                Send
                            </button>
                        </form>
                    </div>
                </div>

                {/* Audit Trail Section */}
                <div className="bg-white shadow sm:rounded-lg border border-gray-200 flex flex-col h-125">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center">
                        <Clock className="w-5 h-5 text-gray-500 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Audit Trail</h3>
                    </div>
                    
                    <div className="flex-1 p-4 overflow-y-auto">
                        <div className="flow-root">
                            <ul className="-mb-8">
                                {item.audit_logs.map((log, logIdx) => (
                                    <li key={log.id}>
                                        <div className="relative pb-8">
                                            {logIdx !== item.audit_logs.length - 1 ? (
                                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                            ) : null}
                                            <div className="relative flex space-x-3">
                                                <div>
                                                    <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white border border-gray-200">
                                                        {log.action === 'CREATED' ? <Plus className="w-4 h-4 text-green-500" /> : 
                                                         log.action === 'COMMENT_ADDED' ? <MessageSquare className="w-4 h-4 text-blue-500" /> : 
                                                         <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500">
                                                            <span className="font-medium text-gray-900">{log.action}</span> by <span className="font-medium text-gray-900">{log.username}</span>
                                                        </p>
                                                        <p className="text-sm text-gray-700 mt-1">{log.details}</p>
                                                    </div>
                                                    <div className="text-right text-xs whitespace-nowrap text-gray-400">
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
