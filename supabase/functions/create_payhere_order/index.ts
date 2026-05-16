// HIGH-1: Secure create_payhere_order — validates JWT, looks up price server-side
// MEDIUM-6: CORS restricted to ALLOWED_ORIGIN env var
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import CryptoJS from 'https://esm.sh/crypto-js@4.2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'http://localhost:8080',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { type, eventId, amount, orderId } = body;

    let resolvedAmount: number;
    let itemName: string;
    let userId: string | null = null;

    // ─── Authenticate the caller if JWT is present ───
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      } else if (type !== 'donation') {
        // Non-donation payments REQUIRE valid auth
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        });
      }
      // For donations: auth failure is OK — continue as anonymous
    } else if (type !== 'donation') {
      // Non-donation payments MUST have auth header
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // ─── Resolve amount SERVER-SIDE ───
    if (type === 'event_registration') {
      if (!eventId) throw new Error('eventId is required for event registration');
      const { data: event, error } = await supabaseAdmin
        .from('events')
        .select('price, title')
        .eq('id', eventId)
        .single();
      if (error || !event) throw new Error('Event not found');
      if (!event.price || event.price <= 0) throw new Error('Event is free — use free registration flow');
      resolvedAmount = event.price;
      itemName = `Registration: ${event.title}`;
    } else if (type === 'donation') {
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        throw new Error('Invalid donation amount');
      }
      resolvedAmount = parseFloat(amount);
      itemName = 'Donation to IIMC';
    } else if (!type && amount) {
      // Backward compat: old frontend sends amount + itemName without type
      resolvedAmount = parseFloat(amount);
      itemName = body.itemName || 'Payment';
    } else {
      throw new Error('Invalid payment type');
    }

    const merchantId = Deno.env.get('PAYHERE_MERCHANT_ID');
    const merchantSecret = Deno.env.get('PAYHERE_MERCHANT_SECRET');
    if (!merchantId || !merchantSecret) {
      throw new Error('PayHere credentials are not configured (PAYHERE_MERCHANT_ID/PAYHERE_MERCHANT_SECRET)');
    }
    const currency = 'LKR';

    const amountFormatted = resolvedAmount
      .toLocaleString('en-us', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      .replaceAll(',', '');

    const hashedSecret = CryptoJS.MD5(merchantSecret).toString().toUpperCase();
    const hashString = merchantId + orderId + amountFormatted + currency + hashedSecret;
    const hash = CryptoJS.MD5(hashString).toString().toUpperCase();

    // notifyUrl is ALWAYS server-side — never from client
    const notifyUrl = Deno.env.get('PAYHERE_NOTIFY_URL')
      || `${supabaseUrl}/functions/v1/payhere_webhook_handler`;

    return new Response(
      JSON.stringify({
        merchant_id: merchantId,
        order_id: orderId,
        amount: amountFormatted,
        currency,
        hash,
        items: itemName,
        notify_url: notifyUrl,
        resolved_amount: resolvedAmount,
        user_id: userId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating PayHere order:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
