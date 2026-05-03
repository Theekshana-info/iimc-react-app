import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.formData();
    const orderId = body.get('order_id')?.toString();
    const paymentId = body.get('payment_id')?.toString();
    const statusCode = body.get('status_code')?.toString();
    const amount = parseFloat(body.get('payhere_amount')?.toString() || '0');
    const currency = body.get('payhere_currency')?.toString() || 'LKR';
    const customFields = body.get('custom_1')?.toString(); // Contains type:id format

    console.log('PayHere webhook received:', { orderId, paymentId, statusCode, customFields });

    // Parse custom fields to get related_type and related_id
    let relatedType = null;
    let relatedId = null;
    
    if (customFields) {
      const [type, id] = customFields.split(':');
      relatedType = type;
      relatedId = id;
    }

    // Determine payment status
    const status = statusCode === '2' ? 'completed' : 'pending';

    // Upsert payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .upsert({
        transaction_id: paymentId,
        amount,
        currency,
        status,
        payment_type: relatedType || 'donation',
        related_id: relatedId,
        related_type: relatedType,
      }, { 
        onConflict: 'transaction_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error upserting payment:', paymentError);
      return new Response('ERROR', { status: 500 });
    }

    // If this is an event registration payment, update the registration status
    if (relatedType === 'event_registration' && relatedId && status === 'completed') {
      const { error: registrationError } = await supabaseAdmin
        .from('event_registrations')
        .update({ status: 'paid' })
        .eq('id', relatedId);

      if (registrationError) {
        console.error('Error updating registration:', registrationError);
      } else {
        console.log('Event registration marked as paid:', relatedId);
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing PayHere webhook:', error);
    return new Response('ERROR', { status: 500 });
  }
});
