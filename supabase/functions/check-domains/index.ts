// Domain checking edge function
// This function checks domain availability using WHOIS
// It's designed to be triggered on a schedule (e.g., daily)

import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

// Environment variables are automatically available
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper function to check domain availability with WHOIS API
async function checkDomainAvailability(domain: string) {
  try {
    // For demonstration purposes, this is a mock implementation
    // In production, you would use a real WHOIS API or service
    const response = await fetch(`https://whois-api.example.com/check?domain=${domain}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      // If API call fails, return 'unknown'
      return {
        status: 'unknown',
        details: { error: 'API call failed', statusCode: response.status }
      };
    }
    
    const data = await response.json();
    
    // Determine status based on API response
    // This is an example logic - adjust according to actual API
    const isAvailable = data.available === true;
    
    return {
      status: isAvailable ? 'available' : 'taken',
      details: data
    };
  } catch (error) {
    console.error(`Error checking domain ${domain}:`, error);
    return {
      status: 'unknown',
      details: { error: error.message }
    };
  }
}

// Main handler for the edge function
Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
  
  try {
    // Parse request body if it exists
    let specificDomain = null;
    let limit = 50;
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body && body.domain) {
          specificDomain = body.domain;
        }
        if (body && body.limit) {
          limit = parseInt(body.limit, 10);
        }
      } catch (e) {
        console.error('Error parsing request body:', e);
      }
    }
    
    // For GET requests or fallback, check URL parameters
    if (!specificDomain && req.method === 'GET') {
      const url = new URL(req.url);
      specificDomain = url.searchParams.get('domain');
      const limitParam = url.searchParams.get('limit');
      if (limitParam) {
        limit = parseInt(limitParam, 10);
      }
    }
    
    let domains;
    
    if (specificDomain) {
      // Fetch a specific domain
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('domain', specificDomain)
        .limit(1);
      
      if (error) throw error;
      domains = data;
    } else {
      // Otherwise, fetch domains due for checking
      // Priority:
      // 1. Domains that have never been checked (last_checked is null)
      // 2. Domains that haven't been checked in the longest time
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .order('last_checked', { ascending: true, nullsFirst: true })
        .limit(limit);
      
      if (error) throw error;
      domains = data;
    }
    
    if (!domains || domains.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No domains to check' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    // Process each domain
    const results = await Promise.all(
      domains.map(async (domain) => {
        const { status, details } = await checkDomainAvailability(domain.domain);
        
        // Update domain status
        const { error: updateError } = await supabase
          .from('domains')
          .update({
            status,
            last_checked: new Date().toISOString()
          })
          .eq('id', domain.id);
        
        if (updateError) {
          console.error(`Error updating domain ${domain.domain}:`, updateError);
        }
        
        // Record the check in domain_checks table
        const { error: insertError } = await supabase
          .from('domain_checks')
          .insert({
            domain_id: domain.id,
            status,
            details
          });
        
        if (insertError) {
          console.error(`Error recording check for ${domain.domain}:`, insertError);
        }
        
        // Send notification if domain becomes available and user has notifications enabled
        if (status === 'available' && domain.notify_if_available) {
          // Check previous status to see if this is a status change
          const { data: prevChecks, error: prevCheckError } = await supabase
            .from('domain_checks')
            .select('status')
            .eq('domain_id', domain.id)
            .order('created_at', { ascending: false })
            .limit(2);
          
          if (!prevCheckError && prevChecks && prevChecks.length > 1 && prevChecks[1].status !== 'available') {
            // This is a status change to available - send notification
            // In a real implementation, you would call a notification service or send an email
            console.log(`Domain ${domain.domain} is now available! Notification would be sent to user ${domain.user_id}`);
            
            // Get user email for notification
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('email, notifications_enabled')
              .eq('id', domain.user_id)
              .single();
            
            if (!userError && userData && userData.notifications_enabled) {
              // Send email notification (placeholder)
              console.log(`Sending notification to ${userData.email} about ${domain.domain}`);
              
              // Actual email sending would happen here in production
              // For example, using a service like SendGrid, Mailgun, etc.
            }
          }
        }
        
        return {
          domain: domain.domain,
          status,
          checked: new Date().toISOString()
        };
      })
    );
    
    return new Response(
      JSON.stringify({
        message: 'Domain checks completed',
        checked: results.length,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in check-domains function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred during domain checking'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
