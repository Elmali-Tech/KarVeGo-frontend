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
    sku: string;
    variant_id: number;
    product_id: number;
    title: string;
    variant_title: string;
    vendor: string;
    requires_shipping: boolean;
    taxable: boolean;
    gift_card: boolean;
    price_set: {
      shop_money: {
        amount: string;
        currency_code: string;
      };
    };
    total_discount: string;
    fulfillment_status: string | null;
    properties: Array<{
      name: string;
      value: string;
    }>;
  }[];
  shipping_address: {
    city: string;
    province: string;
    address1: string;
    phone: string;
  };
  total_weight: number;
  created_at: string;
  financial_status: string;
  fulfillment_status: string | null;
}

interface ImportLog {
  logs: string[];
  addLog: (message: string) => void;
}

function createLogger(): ImportLog {
  const logs: string[] = [];
  const addLog = (message: string) => {
    console.log(message);
    logs.push(message);
  };
  return { logs, addLog };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const logger = createLogger();
  const { addLog, logs } = logger;

  try {
    addLog('🚀 Starting Shopify orders import...');

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
    addLog('🔑 Verifying user authentication...');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      addLog('❌ Authentication error');
      throw new Error('Unauthorized');
    }

    addLog('👤 User authenticated: ' + user.id);

    // Get Shopify integration
    addLog('🔍 Fetching Shopify integration...');
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('shop_url, access_token')
      .eq('user_id', user.id)
      .eq('type', 'SHOPIFY')
      .eq('is_active', true)
      .single();

    if (integrationError) {
      addLog('❌ Integration error: ' + integrationError.message);
      throw new Error('Failed to fetch Shopify integration');
    }

    if (!integration) {
      addLog('❌ No active Shopify integration found');
      throw new Error('No active Shopify integration found');
    }

    addLog('🏪 Found Shopify store: ' + integration.shop_url);

    // Fetch orders from Shopify
    addLog('📦 Fetching orders from Shopify...');
    
    const shopifyUrl = `https://${integration.shop_url}/admin/api/2024-01/orders.json`;
    addLog('📡 Shopify API URL: ' + shopifyUrl);
    
    const shopifyResponse = await fetch(shopifyUrl, {
      headers: {
        'X-Shopify-Access-Token': integration.access_token,
        'Content-Type': 'application/json',
      },
    });

    if (!shopifyResponse.ok) {
      const errorBody = await shopifyResponse.text();
      addLog('❌ Shopify API error: ' + shopifyResponse.statusText);
      addLog('Response: ' + errorBody);
      throw new Error(`Shopify API error: ${shopifyResponse.statusText}`);
    }

    const responseData = await shopifyResponse.json();
    addLog('📥 Shopify API response received');
    
    if (!responseData.orders || !Array.isArray(responseData.orders)) {
      addLog('❌ Invalid response format from Shopify API');
      throw new Error('Invalid response format from Shopify API');
    }

    const orders = responseData.orders;
    addLog(`✅ Found ${orders.length} orders`);

    // Process each order
    addLog('🔄 Processing orders...');
    let importedCount = 0;

    for (const order of orders) {
      try {
        addLog(`\n📝 Processing order ${order.order_number}...`);
        addLog('📦 Raw order data:');
        addLog(JSON.stringify(order, null, 2));

        // Skip orders without customer information
        if (!order.customer) {
          addLog(`⚠️ Skipping order ${order.order_number} - No customer information`);
          continue;
        }

        // Create or update customer
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .upsert({
            user_id: user.id,
            name: `${order.customer.first_name} ${order.customer.last_name}`,
            phone: order.customer.phone || order.shipping_address?.phone,
            city: order.shipping_address?.city || order.customer.default_address?.city || '',
            district: order.shipping_address?.province || order.customer.default_address?.province || '',
            address: order.shipping_address?.address1 || order.customer.default_address?.address1 || '',
          })
          .select()
          .single();

        if (customerError) {
          addLog(`❌ Customer error for order ${order.order_number}: ${customerError.message}`);
          continue;
        }

        addLog(`✅ Customer created/updated: ${customer.name}`);

        // Map Shopify order status to our status
        let status = 'NEW';
        if (order.fulfillment_status === 'fulfilled') {
          status = 'DELIVERED';
        } else if (order.fulfillment_status === 'partial') {
          status = 'IN_TRANSIT';
        } else if (order.financial_status === 'paid') {
          status = 'READY';
        }

        // Calculate total weight in kg (Shopify uses grams)
        const totalWeight = order.total_weight ? order.total_weight / 1000 : null;

        // Create order with raw data
        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .upsert({
            user_id: user.id,
            customer_id: customer.id,
            status,
            total_weight: totalWeight,
            created_at: order.created_at,
            raw_data: order // Store the complete order object
          })
          .select()
          .single();

        if (orderError) {
          addLog(`❌ Order error for ${order.order_number}: ${orderError.message}`);
          continue;
        }

        addLog(`✅ Order created/updated with status: ${status}`);

        // Process line items
        if (order.line_items && order.line_items.length > 0) {
          const orderItems = order.line_items.map(item => ({
            order_id: newOrder.id,
            quantity: item.quantity,
            product_name: item.title,
            variant_title: item.variant_title,
            sku: item.sku,
            vendor: item.vendor,
            unit_price: parseFloat(item.price),
            raw_data: item // Store complete line item data
          }));

          const { error: itemsError } = await supabase
            .from('order_items')
            .upsert(orderItems);

          if (itemsError) {
            addLog(`❌ Failed to create order items: ${itemsError.message}`);
            continue;
          }

          addLog(`✅ Created ${orderItems.length} order items`);
        }

        importedCount++;
        addLog(`✨ Successfully imported order ${order.order_number}`);
      } catch (err) {
        addLog(`❌ Error processing order ${order.order_number}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        continue;
      }
    }

    addLog(`✨ Import completed successfully. Imported ${importedCount} orders.`);
    return new Response(
      JSON.stringify({
        success: true,
        count: importedCount,
        logs,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    addLog(`❌ Error: ${err instanceof Error ? err.message : 'An unexpected error occurred'}`);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'An unexpected error occurred',
        logs,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});