import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Bell, BellOff, Trash2, ExternalLink, Clock, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Database } from '../types/supabase';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

type Domain = Database['public']['Tables']['domains']['Row'];

interface DomainListProps {
  domains: Domain[];
  isLoading: boolean;
  onDelete: (id: number) => void;
  onToggleNotification: (id: number, currentValue: boolean) => void;
  onRefresh: (domainId: number) => void;
}

const DomainList = ({ domains, isLoading, onDelete, onToggleNotification, onRefresh }: DomainListProps) => {
  const [expandedDomainId, setExpandedDomainId] = useState<number | null>(null);
  const [checkingDomains, setCheckingDomains] = useState<number[]>([]);

  const toggleExpand = (id: number) => {
    setExpandedDomainId(expandedDomainId === id ? null : id);
  };

  const handleCheckNow = async (domainId: number) => {
    // Prevent multiple checks on the same domain
    if (checkingDomains.includes(domainId)) return;
    
    // Add domain to checking list
    setCheckingDomains(prev => [...prev, domainId]);
    
    try {
      // Call the onRefresh callback to update the domain in the parent component
      onRefresh(domainId);
    } catch (error) {
      console.error('Error checking domain:', error);
      toast.error('Failed to check domain status');
    } finally {
      // Remove domain from checking list
      setCheckingDomains(prev => prev.filter(id => id !== domainId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-status-available';
      case 'taken':
        return 'bg-status-taken';
      case 'pending':
        return 'bg-status-pending';
      default:
        return 'bg-status-unknown';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'taken':
        return 'Taken';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md p-10 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9-9v18"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No domains</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding a domain to your watchlist.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        <AnimatePresence>
          {domains.map((domain) => (
            <motion.li 
              key={domain.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="block hover:bg-gray-50"
            >
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className={`h-4 w-4 rounded-full ${getStatusColor(domain.status)}`}></div>
                    </div>
                    <div className="min-w-0 flex-1 px-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-blue-600 truncate">{domain.domain}</p>
                        <a
                          href={`https://${domain.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                      <p className="mt-1 flex items-center text-sm text-gray-500">
                        <span className="truncate">Status: {getStatusText(domain.status)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="sm:flex sm:flex-col sm:items-end">
                    {domain.last_checked && (
                      <p className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(domain.last_checked), { addSuffix: true })}
                      </p>
                    )}
                    <div className="mt-2 flex items-center space-x-2">
                      <button
                        onClick={() => handleCheckNow(domain.id)}
                        disabled={checkingDomains.includes(domain.id)}
                        className={`p-1 rounded-full ${
                          checkingDomains.includes(domain.id) 
                            ? 'text-blue-300' 
                            : 'text-blue-600 hover:text-blue-800'
                        }`}
                        title="Check availability now"
                      >
                        <RefreshCw 
                          className={`h-5 w-5 ${checkingDomains.includes(domain.id) ? 'animate-spin' : ''}`} 
                        />
                      </button>
                      <button
                        onClick={() => onToggleNotification(domain.id, domain.notify_if_available)}
                        className={`p-1 rounded-full ${domain.notify_if_available ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {domain.notify_if_available ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => onDelete(domain.id)}
                        className="p-1 rounded-full text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => toggleExpand(domain.id)}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-600"
                      >
                        {expandedDomainId === domain.id ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Expandable area */}
                <AnimatePresence>
                  {expandedDomainId === domain.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4 pt-4 border-t border-gray-100"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Details</h4>
                          <dl className="mt-2 text-sm text-gray-600">
                            <div className="mt-1">
                              <dt className="inline font-medium text-gray-500">Status: </dt>
                              <dd className="inline ml-1">{getStatusText(domain.status)}</dd>
                            </div>
                            <div className="mt-1">
                              <dt className="inline font-medium text-gray-500">Added: </dt>
                              <dd className="inline ml-1">{new Date(domain.created_at).toLocaleDateString()}</dd>
                            </div>
                            <div className="mt-1">
                              <dt className="inline font-medium text-gray-500">Notifications: </dt>
                              <dd className="inline ml-1">{domain.notify_if_available ? 'Enabled' : 'Disabled'}</dd>
                            </div>
                          </dl>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                          <p className="mt-2 text-sm text-gray-600">
                            {domain.notes || 'No notes added'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
};

export default DomainList;
