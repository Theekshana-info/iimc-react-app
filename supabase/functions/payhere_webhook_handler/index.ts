import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import CryptoJS from 'https://esm.sh/crypto-js@4.2.0';

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
    const merchantId = Deno.env.get('PAYHERE_MERCHANT_ID')!;
    const merchantSecret = Deno.env.get('PAYHERE_MERCHANT_SECRET')!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // PayHere sends webhook data as application/x-www-form-urlencoded
    const body = await req.formData();
    const receivedMerchantId = body.get('merchant_id')?.toString() || '';
    const orderId = body.get('order_id')?.toString() || '';
    const paymentId = body.get('payment_id')?.toString() || '';
    const payhereAmount = body.get('payhere_amount')?.toString() || '0';
    const payhereCurrency = body.get('payhere_currency')?.toString() || 'LKR';
    const statusCode = body.get('status_code')?.toString() || '';
    const receivedMd5sig = body.get('md5sig')?.toString() || '';
    const customFields = body.get('custom_1')?.toString() || '';
    const statusMessage = body.get('status_message')?.toString() || '';

    console.log('PayHere webhook received:', {
      orderId, paymentId, statusCode, customFields, statusMessage,
    });

    // ─── SECURITY: Verify merchant_id matches ───
    if (receivedMerchantId !== merchantId) {
      console.error('Merchant ID mismatch:', { received: receivedMerchantId, expected: merchantId });
      return new Response('INVALID MERCHANT', { status: 403 });
    }

    // ─── SECURITY: Verify md5sig checksum ───
    // md5sig = UPPER(MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + UPPER(MD5(merchant_secret))))
    const hashedSecret = CryptoJS.MD5(merchantSecret).toString().toUpperCase();
    const localMd5sig = CryptoJS.MD5(
      receivedMerchantId + orderId + payhereAmount + payhereCurrency + statusCode + hashedSecret
    ).toString().toUpperCase();

    if (localMd5sig !== receivedMd5sig) {
      console.error('md5sig verification FAILED:', {
        local: localMd5sig,
        received: receivedMd5sig,
      });
      return new Response('INVALID SIGNATURE', { status: 403 });
    }

    console.log('md5sig verification PASSED');

    // ─── Determine payment status from status_code ───
    // 2 = success, 0 = pending, -1 = canceled, -2 = failed, -3 = chargedback
    let attemptStatus: string;
    switch (statusCode) {
      case '2':
        attemptStatus = 'success';
        break;
      case '0':
        attemptStatus = 'pending';
        break;
      case '-1':
        attemptStatus = 'cancelled';
        break;
      case '-2':
        attemptStatus = 'failed';
        break;
      case '-3':
        attemptStatus = 'chargeback';
        break;
      default:
        attemptStatus = 'failed';
    }

    // Parse custom_1: format is "type:eventId:donationId" or "type:donationId" or just "type"
    // custom_1 for event_registration: "event_registration:eventId"
    // custom_1 for donation: "donation:donationId"
    let paymentType: string = 'donation';
    let eventId: string | null = null;
    let donationId: string | null = null;

    if (customFields) {
      const parts = customFields.split(':');
      paymentType = parts[0] || 'donation';

      if (paymentType === 'event_registration' && parts[1]) {
        eventId = parts[1];
      } else if (paymentType === 'donation' && parts[1]) {
        donationId = parts[1];
      }
    }

    const userId = body.get('custom_2')?.toString() || null;

    // ─── Log to payment_attempts (ALWAYS, regardless of status) ───
    const { error: attemptError } = await supabaseAdmin
      .from('payment_attempts')
      .insert({
        user_id: userId || null,
        type: paymentType,
        event_id: eventId,
        amount: parseFloat(payhereAmount),
        currency: payhereCurrency,
        status: attemptStatus,
        failure_reason: attemptStatus !== 'success' ? (statusMessage || null) : null,
        payhere_order_id: paymentId || orderId,
        donation_id: donationId,
      });

    if (attemptError) {
      console.error('Error logging payment attempt:', attemptError);
    } else {
      console.log('Payment attempt logged:', { status: attemptStatus, paymentType });
    }

    // ─── Create payment record (for completed/successful payments) ───
    if (attemptStatus === 'success') {
      const { data: paymentData, error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          transaction_id: paymentId,
          user_id: userId,
          amount: parseFloat(payhereAmount),
          currency: payhereCurrency,
          status: 'completed',
          payment_type: paymentType,
          related_id: eventId || donationId,
          related_type: paymentType,
          payment_gateway: 'payhere',
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Error inserting payment:', paymentError);
        return new Response('ERROR', { status: 500 });
      }

      console.log('Payment record created:', { id: paymentData.id });

      // ─── SUCCESS: Create/update event registration (spot allocated NOW) ───
      // Uses UPSERT to handle the UNIQUE(event_id, user_id) constraint.
      // If a pending record exists from a previous attempt, it gets updated to 'paid'.
      if (paymentType === 'event_registration' && eventId && userId) {
        const { error: registrationError } = await supabaseAdmin
          .from('event_registrations')
          .upsert(
            {
              event_id: eventId,
              user_id: userId,
              status: 'paid',
              registered_at: new Date().toISOString(),
            },
            { onConflict: 'event_id,user_id' }
          );

        if (registrationError) {
          console.error('Error creating/updating registration:', registrationError);
        } else {
          console.log('Event registration upserted with paid status for event:', eventId);
        }
      }

      // ─── SUCCESS: Update donation record ───
      if (paymentType === 'donation' && donationId) {
        const { error: donationError } = await supabaseAdmin
          .from('donations')
          .update({ status: 'completed', payment_id: paymentData.id })
          .eq('id', donationId);

        if (donationError) {
          console.error('Error updating donation:', donationError);
        } else {
          console.log('Donation marked as completed:', donationId);
        }
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing PayHere webhook:', error);
    return new Response('ERROR', { status: 500 });
  }
});
