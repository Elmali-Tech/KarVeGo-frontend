import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'false',
};

interface ShopifyOrder {
  id: number;
  name: string;
  created_at: string;
  total_weight: number;
  tracking_number?: string;
  package_height?: number;
  package_width?: number;
  package_length?: number;
  package_weight?: number;
  customer: {
    name: string;
    email?: string;
    phone?: string;
  };
  shipping_address?: {
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
    phone?: string;
  };
  billing_address?: {
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
  };
  products: Array<{
    sku: string;
    quantity: number;
    title: string;
    name: string;
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
    const fields = [
      'id',
      'name',
      'created_at',
      'total_weight',
      'fulfillments',
      'customer',
      'shipping_address',
      'billing_address',
      'line_items',
      'total_price',
      'subtotal_price',
      'total_tax',
      'total_discounts',
      'note',
      'tags',
      'source_name',
      'financial_status'
    ].join(',');

    const shopifyResponse = await fetch(
      `https://${integration.shop_url}/admin/api/2024-01/orders.json?status=any&fields=${fields}`,
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
        body: errorBody,
      });
      throw new Error(`Shopify API error: ${shopifyResponse.status}`);
    }

    const shopifyData = await shopifyResponse.json();
    
    // Log the first order for debugging
    if (shopifyData.orders && shopifyData.orders.length > 0) {
      console.log('Example order data:', JSON.stringify(shopifyData.orders[0], null, 2));
    }
    
    const orders = shopifyData.orders.map((order: any) => {
      console.log(`Processing order ${order.name}:`, {
        customer: order.customer,
        shipping_address: order.shipping_address,
        billing_address: order.billing_address
      });
      
      return {
        id: order.id,
        name: order.name,
        created_at: order.created_at,
        total_weight: order.total_weight,
        tracking_number: order.fulfillments?.[0]?.tracking_number,
        package_height: order.fulfillments?.[0]?.package_height,
        package_width: order.fulfillments?.[0]?.package_width,
        package_length: order.fulfillments?.[0]?.package_length,
        package_weight: order.fulfillments?.[0]?.package_weight,
        customer: {
          name: order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : '',
          email: order.customer?.email || '',
          phone: order.customer?.phone || order.shipping_address?.phone || '',
        },
        shipping_address: order.shipping_address ? {
          address1: order.shipping_address.address1 || '',
          address2: order.shipping_address.address2 || '',
          city: order.shipping_address.city || '',
          province: order.shipping_address.province || '',
          zip: order.shipping_address.zip || '',
          country: order.shipping_address.country || '',
          phone: order.shipping_address.phone || order.customer?.phone || '',
          name: order.shipping_address.name || '',
          company: order.shipping_address.company || '',
          latitude: order.shipping_address.latitude,
          longitude: order.shipping_address.longitude,
        } : null,
        billing_address: order.billing_address ? {
          address1: order.billing_address.address1 || '',
          address2: order.billing_address.address2 || '',
          city: order.billing_address.city || '',
          province: order.billing_address.province || '',
          zip: order.billing_address.zip || '',
          country: order.billing_address.country || '',
          name: order.billing_address.name || '',
          company: order.billing_address.company || '',
        } : null,
        products: order.line_items.map((item: any) => ({
          sku: item.sku || '',
          quantity: item.quantity,
          title: item.title || '',
          name: item.name || item.title || 'İsimsiz Ürün',
          price: item.price,
          total_discount: item.total_discount,
          vendor: item.vendor,
          requires_shipping: item.requires_shipping,
          properties: item.properties || []
        })),
        total_price: order.total_price,
        subtotal_price: order.subtotal_price,
        total_tax: order.total_tax,
        total_discounts: order.total_discounts,
        note: order.note || '',
        tags: order.tags || [],
        source_name: order.source_name || '',
        financial_status: order.financial_status || ''
      };
    });

    console.log(`✅ Successfully fetched ${orders.length} orders`);

    return new Response(JSON.stringify(orders), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}); 