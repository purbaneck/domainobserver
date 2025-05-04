import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (domain: string, notifyIfAvailable: boolean) => void;
}

const AddDomainModal = ({ isOpen, onClose, onAdd }: AddDomainModalProps) => {
  const [domain, setDomain] = useState('');
  const [notifyIfAvailable, setNotifyIfAvailable] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateDomain = (domain: string) => {
    const pattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
    return pattern.test(domain);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsValidating(true);
    setValidationError('');
    
    const trimmedDomain = domain.trim().toLowerCase();
    
    // Remove http(s):// and www. prefixes if present
    const cleanedDomain = trimmedDomain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '');
    
    if (!cleanedDomain) {
      setValidationError('Please enter a domain');
      setIsValidating(false);
      return;
    }
    
    if (!validateDomain(cleanedDomain)) {
      setValidationError('Please enter a valid domain (e.g., example.com)');
      setIsValidating(false);
      return;
    }
    
    onAdd(cleanedDomain, notifyIfAvailable);
    setDomain('');
    setNotifyIfAvailable(true);
    setIsValidating(false);
    onClose();
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 500 } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={onClose}
          ></motion.div>

          <div className="flex min-h-screen items-center justify-center p-4 text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={modalVariants}
              className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute right-0 top-0 block pr-4 pt-4">
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={onClose}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    Add Domain to Watchlist
                  </h3>
                  <div className="mt-4">
                    <form onSubmit={handleSubmit}>
                      <div className="mb-4">
                        <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
                          Domain Name
                        </label>
                        <input
                          type="text"
                          name="domain"
                          id="domain"
                          value={domain}
                          onChange={(e) => setDomain(e.target.value)}
                          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 ${
                            validationError ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="example.com"
                          autoComplete="off"
                          autoFocus
                        />
                        {validationError && (
                          <p className="mt-2 text-sm text-red-600">{validationError}</p>
                        )}
                      </div>

                      <div className="flex items-start mb-4">
                        <div className="flex h-5 items-center">
                          <input
                            id="notifyIfAvailable"
                            name="notifyIfAvailable"
                            type="checkbox"
                            checked={notifyIfAvailable}
                            onChange={(e) => setNotifyIfAvailable(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="notifyIfAvailable" className="font-medium text-gray-700">
                            Notify me when available
                          </label>
                          <p className="text-gray-500">
                            You'll receive an email notification if this domain becomes available.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button
                          type="submit"
                          disabled={isValidating}
                          className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-start-2"
                        >
                          {isValidating ? 'Adding...' : 'Add Domain'}
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddDomainModal;
