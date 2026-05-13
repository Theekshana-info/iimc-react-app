// HIGH-7: JWT verification added — users can only query their own payment status
// MEDIUM-6: CORS restricted
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'http://localhost:8080',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // ─── SECURITY: Verify JWT ───
    const authHeader = req.headers.get('authorization');
    let authenticatedUserId: string | null = null;

    if (authHeader) {
      const supabaseUser = createClient(supabaseUrl, anonKey, {
        global: { headers: { authorization: authHeader } },
      });
      const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
      if (!userError && user) {
        authenticatedUserId = user.id;
      }
    }

    const body = await req.json();
    const { eventId, userId, donationId, paymentType } = body;

    // Enforce: authenticated user can only query their own status
    if (paymentType === 'event_registration') {
      if (!authenticatedUserId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        });
      }
      if (userId && userId !== authenticatedUserId) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }
    }

    // ── Verify event registration payment ──
    if (paymentType === 'event_registration' && eventId && authenticatedUserId) {
      const { data: reg } = await supabaseAdmin
        .from('event_registrations')
        .select('status')
        .eq('event_id', eventId)
        .eq('user_id', authenticatedUserId)
        .eq('status', 'paid')
        .maybeSingle();

      if (reg) {
        return new Response(JSON.stringify({ verified: true, status: 'success' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ── Verify donation payment (can be anonymous) ──
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
