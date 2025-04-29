import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface ShopifyOrder {
  id: number;
  order_number: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    default_address: {
      city: string;
      province: string;
      address1: string;
    };
  };
  line_items: {
    id: number;
    quantity: number;
    name: string;
    price: string;
    weight: number;
    weight_unit: string;
  }[];
  shipping_address: {
    city: string;
    province: string;
    address1: string;
    phone: string;
  };
  total_weight: number;
  created_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log('🚀 Starting Shopify orders import...');

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

    // Fetch orders from Shopify
    console.log('📦 Fetching orders from Shopify...');
    const shopifyResponse = await fetch(
      `https://${integration.shop_url}/admin/api/2024-01/orders.json?status=any`,
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

    const { orders } = await shopifyResponse.json();
    console.log(`✅ Found ${orders.length} orders`);

    // Process each order
    console.log('🔄 Processing orders...');
    for (const order of orders) {
      try {
        // Create or update customer
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .upsert({
            user_id: user.id,
            name: `${order.customer.first_name} ${order.customer.last_name}`,
            phone: order.customer.phone || order.shipping_address?.phone,
            city: order.shipping_address?.city || order.customer.default_address?.city,
            district: order.shipping_address?.province || order.customer.default_address?.province,
            address: order.shipping_address?.address1 || order.customer.default_address?.address1,
          })
          .select()
          .single();

        if (customerError) throw customerError;

        // Calculate total weight in kg
        const totalWeight = order.total_weight ? order.total_weight / 1000 : null;

        // Create order
        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .upsert({
            user_id: user.id,
            customer_id: customer.id,
            status: 'NEW',
            total_weight: totalWeight,
            created_at: order.created_at,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = order.line_items.map((item) => ({
          order_id: newOrder.id,
          quantity: item.quantity,
          product_name: item.name,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .upsert(orderItems);

        if (itemsError) throw itemsError;
      } catch (err) {
        console.error(`❌ Error processing order ${order.order_number}:`, err);
        // Continue with next order
        continue;
      }
    }

    console.log('✨ Import completed successfully');
    return new Response(
      JSON.stringify({
        success: true,
        count: orders.length,
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