// Phase 2: Enhanced create_payhere_order
// Supports: event_registration (single + multi-session), donation, subscription
// HIGH-1: Secure — validates JWT, resolves price server-side
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
    const { type, eventId, sessionIds, amount, orderId, subscriptionId } = body;

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
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        });
      }
    } else if (type !== 'donation') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // ─── Resolve amount SERVER-SIDE based on payment type ───
    if (type === 'event_registration') {
      if (!eventId) throw new Error('eventId is required for event registration');
      const { data: event, error } = await supabaseAdmin
        .from('events')
        .select('price, title')
        .eq('id', eventId)
        .single();
      if (error || !event) throw new Error('Event not found');
      if (!event.price || event.price <= 0) throw new Error('Event is free — use free registration flow');

      // Multi-session checkout: price × session count
      if (sessionIds && Array.isArray(sessionIds) && sessionIds.length > 0) {
        // Validate all session IDs belong to this event and are active
        const { data: sessions, error: sessError } = await supabaseAdmin
          .from('event_sessions')
          .select('id, status')
          .eq('event_id', eventId)
          .in('id', sessionIds);

        if (sessError) throw new Error('Failed to validate sessions');
        if (!sessions || sessions.length !== sessionIds.length) {
          throw new Error('One or more session IDs are invalid');
        }

        const inactiveSessions = sessions.filter(s => s.status !== 'active');
        if (inactiveSessions.length > 0) {
          throw new Error('One or more selected sessions are not active');
        }

        resolvedAmount = event.price * sessionIds.length;
        itemName = `Registration: ${event.title} (${sessionIds.length} session${sessionIds.length > 1 ? 's' : ''})`;
      } else {
        // Single registration (no session)
        resolvedAmount = event.price;
        itemName = `Registration: ${event.title}`;
      }
    } else if (type === 'subscription') {
      // Recurring donation subscription
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        throw new Error('Invalid subscription amount');
      }
      resolvedAmount = parseFloat(amount);
      itemName = 'Monthly Donation to IIMC';
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

    // Build response — include recurrence params for subscriptions
    const responsePayload: Record<string, unknown> = {
      merchant_id: merchantId,
      order_id: orderId,
      amount: amountFormatted,
      currency,
      hash,
      items: itemName,
      notify_url: notifyUrl,
      resolved_amount: resolvedAmount,
      user_id: userId,
    };

    // For subscription payments, include PayHere recurrence parameters
    if (type === 'subscription') {
      responsePayload.recurrence = '1 Month';
      responsePayload.duration = 'Forever';
    }

    return new Response(
      JSON.stringify(responsePayload),
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
