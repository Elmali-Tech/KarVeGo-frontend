import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const { code, shop } = body;

    if (!shop || typeof shop !== 'string') {
      throw new Error('Shop parametresi geçersiz');
    }

    if (!code || typeof code !== 'string') {
      throw new Error('Code parametresi geçersiz');
    }

    const clientId = Deno.env.get('SHOPIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SHOPIFY_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Shopify credentials not configured');
    }

    console.log('🔄 Token exchange starting for shop:', shop);

    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    console.log('📥 Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        body: errorText,
      });
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.error('❌ No access token in response:', tokenData);
      throw new Error('No access token in response');
    }

    console.log('✅ Access token obtained successfully');

    return new Response(JSON.stringify({
      access_token: tokenData.access_token,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('❌ Error in token endpoint:', err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'An error occurred during token exchange',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});