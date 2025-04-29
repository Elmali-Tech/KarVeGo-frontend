import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Shopify-Hmac-SHA256, X-Shopify-Topic',
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
  }[];
  shipping_address: {
    city: string;
    province: string;
    address1: string;
    phone: string;
  };
  total_weight: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Handle webhook verification
    if (path === 'verify') {
      const { shop_url, access_token } = await req.json();

      // Verify Shopify credentials
      const shopifyResponse = await fetch(`https://${shop_url}/admin/api/2024-01/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': access_token,
        },
      });

      if (!shopifyResponse.ok) {
        throw new Error('Invalid Shopify credentials');
      }

      // Create webhook
      const webhookResponse = await fetch(
        `https://${shop_url}/admin/api/2024-01/webhooks.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': access_token,
          },
          body: JSON.stringify({
            webhook: {
              topic: 'orders/create',
              address: `${url.origin}/shopify/webhook`,
              format: 'json',
            },
          }),
        }
      );

      if (!webhookResponse.ok) {
        throw new Error('Failed to create webhook');
      }

      const webhookData = await webhookResponse.json();

      return new Response(JSON.stringify(webhookData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle incoming webhooks
    if (path === 'webhook') {
      const shopifyHmac = req.headers.get('X-Shopify-Hmac-SHA256');
      const topic = req.headers.get('X-Shopify-Topic');

      if (!shopifyHmac || topic !== 'orders/create') {
        throw new Error('Invalid webhook request');
      }

      const order: ShopifyOrder = await req.json();

      // Create customer if not exists
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: `${order.customer.first_name} ${order.customer.last_name}`,
          phone: order.customer.phone || order.shipping_address.phone,
          city: order.shipping_address.city,
          district: order.shipping_address.province,
          address: order.shipping_address.address1,
        })
        .select()
        .single();

      if (customerError) throw customerError;

      // Create order
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: customer.id,
          status: 'NEW',
          total_weight: order.total_weight / 1000, // Convert to kg
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = order.line_items.map((item) => ({
        order_id: newOrder.id,
        quantity: item.quantity,
        // Note: You'll need to match Shopify products with your local products
        // This is just a basic example
        product_name: item.name,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid endpoint');
  } catch (err) {
    console.error('Error:', err.message);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'An error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});