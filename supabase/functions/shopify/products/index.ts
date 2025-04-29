import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  variants: Array<{
    sku: string;
    price: string;
    weight: number;
    weight_unit: string;
    height?: number;
    width?: number;
    length?: number;
  }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log('🚀 Starting Shopify products import...');

    // Get auth token from request header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const token = authHeader.replace('Bearer ', '');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    console.log('🔑 Verifying user authentication...');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('❌ Authentication error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('👤 User authenticated:', user.id);

    // Get Shopify integration
    console.log('🔍 Fetching Shopify integration...');
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('shop_url, access_token')
      .eq('user_id', user.id)
      .eq('type', 'SHOPIFY')
      .eq('is_active', true)
      .single();

    if (integrationError) {
      console.error('❌ Integration error:', integrationError);
      throw new Error('Failed to fetch Shopify integration');
    }

    if (!integration) {
      throw new Error('No active Shopify integration found');
    }

    console.log('🏪 Found Shopify store:', integration.shop_url);

    // Fetch products from Shopify
    console.log('📦 Fetching products from Shopify...');
    const shopifyResponse = await fetch(
      `https://${integration.shop_url}/admin/api/2024-01/products.json`,
      {
        headers: {
          'X-Shopify-Access-Token': integration.access_token,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!shopifyResponse.ok) {
      const errorBody = await shopifyResponse.text();
      console.error('❌ Shopify API error:', {
        status: shopifyResponse.status,
        statusText: shopifyResponse.statusText,
        body: errorBody,
      });
      throw new Error(`Shopify API error: ${shopifyResponse.statusText}`);
    }

    const { products } = await shopifyResponse.json();
    console.log(`✅ Found ${products.length} products`);

    // Transform products
    console.log('🔄 Transforming products...');
    const transformedProducts = products.map((product: ShopifyProduct) => {
      const variant = product.variants[0] || {};
      const weight = variant.weight || 0;
      // Convert weight to kg if needed
      const weightInKg = variant.weight_unit === 'g' ? weight / 1000 : weight;

      return {
        user_id: user.id,
        name: product.title,
        code: product.handle,
        sku: variant.sku || '',
        price: parseFloat(variant.price || '0'),
        vat_rate: 18,
        weight: weightInKg,
        height: variant.height || 0,
        width: variant.width || 0,
        length: variant.length || 0,
        shopify_store: integration.shop_url,
      };
    });

    // Insert products into database
    console.log('💾 Saving products to database...');
    const { error: insertError } = await supabase
      .from('products')
      .upsert(transformedProducts, {
        onConflict: 'user_id,sku',
        ignoreDuplicates: false,
      });

    if (insertError) {
      console.error('❌ Database error:', insertError);
      throw new Error('Failed to save products');
    }

    console.log('✨ Import completed successfully');
    return new Response(
      JSON.stringify({
        success: true,
        count: transformedProducts.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('❌ Error:', err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'An unexpected error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});