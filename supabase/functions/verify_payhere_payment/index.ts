import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { eventId, userId, donationId, paymentType } = body;

    // ── Verify event registration payment ──
    if (paymentType === 'event_registration' && eventId && userId) {
      const { data: reg } = await supabaseAdmin
        .from('event_registrations')
        .select('status')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .eq('status', 'paid')
        .maybeSingle();

      if (reg) {
        return new Response(JSON.stringify({ verified: true, status: 'success' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ── Verify donation payment ──
    if (paymentType === 'donation' && donationId) {
      const { data: payment } = await supabaseAdmin
        .from('payments')
        .select('status')
        .eq('related_id', donationId)
        .eq('payment_type', 'donation')
        .eq('status', 'completed')
        .maybeSingle();

      if (payment) {
        return new Response(JSON.stringify({ verified: true, status: 'success' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Not confirmed yet
    return new Response(JSON.stringify({ verified: false, status: 'pending' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in verify_payhere_payment:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
