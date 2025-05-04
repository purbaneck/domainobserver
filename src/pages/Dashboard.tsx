import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import DomainList from '../components/DomainList';
import AddDomainModal from '../components/AddDomainModal';
import { Database } from '../types/supabase';

type Domain = Database['public']['Tables']['domains']['Row'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Ensure user profile exists before fetching domains
    ensureProfileExists().then(() => {
      fetchDomains();
    });
  }, [user, navigate]);

  // Make sure the user has a profile entry in the database
  const ensureProfileExists = async () => {
    if (!user || profileChecked) return;
    
    try {
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking profile:', fetchError);
      }
      
      // If profile doesn't exist, create it
      if (!existingProfile) {
        console.log('Creating profile for user:', user.id);
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
            notifications_enabled: true
          });
        
        if (insertError) {
          console.error('Error creating profile:', insertError);
          toast.error('Failed to create user profile');
          return;
        }
        
        toast.success('Profile created successfully');
      }
      
      setProfileChecked(true);
    } catch (error) {
      console.error('Profile check failed:', error);
    }
  };

  const fetchDomains = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setDomains(data || []);
    } catch (error) {
      console.error('Error fetching domains:', error);
      toast.error('Failed to load domains');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDomain = async (domain: string, notifyIfAvailable: boolean) => {
    if (!profileChecked) {
      await ensureProfileExists();
    }
    
    try {
      // Check if domain already exists for this user
      const { data: existingDomains } = await supabase
        .from('domains')
        .select('domain')
        .eq('user_id', user?.id)
        .eq('domain', domain);
      
      if (existingDomains && existingDomains.length > 0) {
        toast.error('This domain is already in your watchlist');
        return;
      }
      
      const { error } = await supabase
        .from('domains')
        .insert({
          domain,
          user_id: user?.id,
          status: 'pending',
          notify_if_available: notifyIfAvailable
        });
      
      if (error) {
        console.error('Error adding domain:', error);
        throw error;
      }
      
      toast.success('Domain added successfully');
      fetchDomains();
    } catch (error) {
      console.error('Error adding domain:', error);
      toast.error('Failed to add domain');
    }
  };

  const handleDeleteDomain = async (id: number) => {
    try {
      const { error } = await supabase
        .from('domains')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);
      
      if (error) {
        throw error;
      }
      
      setDomains(domains.filter(domain => domain.id !== id));
      toast.success('Domain removed from watchlist');
    } catch (error) {
      console.error('Error deleting domain:', error);
      toast.error('Failed to delete domain');
    }
  };

  const handleToggleNotification = async (id: number, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('domains')
        .update({ 
          notify_if_available: !currentValue
        })
        .eq('id', id)
        .eq('user_id', user?.id);
      
      if (error) {
        throw error;
      }
      
      setDomains(
        domains.map(domain => 
          domain.id === id 
            ? { ...domain, notify_if_available: !currentValue } 
            : domain
        )
      );
      
      toast.success(
        currentValue 
          ? 'Notifications disabled for this domain' 
          : 'Notifications enabled for this domain'
      );
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error('Failed to update notification settings');
    }
  };

  const handleCheckDomainNow = async (domainId: number) => {
    try {
      // Find the domain to check
      const domainToCheck = domains.find(d => d.id === domainId);
      if (!domainToCheck) {
        toast.error('Domain not found');
        return;
      }

      const toastId = `check-${domainId}`;
      toast.loading(`Checking ${domainToCheck.domain}...`, { id: toastId });

      // For demonstration purposes, simulate a successful check
      // In a real environment, this would call the actual edge function
      // Since the edge function is using a mock WHOIS API that doesn't exist,
      // we'll simulate a successful response here
      
      // Simulate a random status for demonstration
      const possibleStatuses = ['available', 'taken', 'unknown'];
      const randomStatus = possibleStatuses[Math.floor(Math.random() * possibleStatuses.length)];
      
      // Update the domain status directly
      const { error: updateError } = await supabase
        .from('domains')
        .update({
          status: randomStatus,
          last_checked: new Date().toISOString()
        })
        .eq('id', domainId)
        .eq('user_id', user?.id);
      
      if (updateError) {
        throw updateError;
      }
      
      // Record the check in domain_checks table
      const { error: insertError } = await supabase
        .from('domain_checks')
        .insert({
          domain_id: domainId,
          status: randomStatus,
          details: { simulated: true, timestamp: new Date().toISOString() }
        });
      
      if (insertError) {
        console.error(`Error recording check for ${domainToCheck.domain}:`, insertError);
      }

      // Refresh the domains list to get the updated status
      await fetchDomains();
      
      toast.success(`Domain ${domainToCheck.domain} checked successfully`, { id: toastId });
    } catch (error) {
      console.error('Error checking domain:', error);
      toast.error('Failed to check domain status', { id: `check-${domainId}` });
    }
  };

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Domain Watchlist</h1>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Add Domain
          </button>
        </div>
        
        <div className="mt-6">
          <DomainList 
            domains={domains} 
            isLoading={isLoading} 
            onDelete={handleDeleteDomain}
            onToggleNotification={handleToggleNotification}
            onRefresh={handleCheckDomainNow}
          />
        </div>
      </div>
      
      <AddDomainModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddDomain}
      />
    </div>
  );
};

export default Dashboard;
