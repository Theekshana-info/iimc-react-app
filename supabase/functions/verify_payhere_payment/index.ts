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
    const { registrationId, action } = body;

    if (!registrationId) {
      return new Response(JSON.stringify({ error: 'registrationId is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // ── ACTION: confirm ──────────────────────────────────────────────────────
    // Called directly from the frontend when PayHere's onCompleted fires.
    // Uses service_role to bypass RLS and mark the registration as paid.
    if (action === 'confirm') {
      console.log('Confirming registration as paid:', registrationId);

      const { error } = await supabaseAdmin
        .from('event_registrations')
        .update({ status: 'paid' })
        .eq('id', registrationId);

      if (error) {
        console.error('Error confirming registration:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      console.log('Registration confirmed as paid:', registrationId);
      return new Response(JSON.stringify({ success: true, status: 'completed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── ACTION: verify (default poll check) ─────────────────────────────────
    // Check the event_registrations table first (service_role bypasses RLS)
    const { data: reg } = await supabaseAdmin
      .from('event_registrations')
      .select('status')
      .eq('id', registrationId)
      .maybeSingle();

    if (reg?.status === 'paid') {
      return new Response(JSON.stringify({ verified: true, status: 'completed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Also check the payments table (webhook may have inserted a record here)
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('status')
      .eq('related_id', registrationId)
      .eq('payment_type', 'event_registration')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (payment?.status && payment.status !== 'pending') {
      // Sync the registration status to match the payment
      await supabaseAdmin
        .from('event_registrations')
        .update({ status: payment.status === 'completed' ? 'paid' : payment.status })
        .eq('id', registrationId);

      return new Response(JSON.stringify({ verified: payment.status === 'completed', status: payment.status === 'completed' ? 'completed' : payment.status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
