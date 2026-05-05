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
    const paymentMethod = body.get('method')?.toString() || '';
    const statusMessage = body.get('status_message')?.toString() || '';

    console.log('PayHere webhook received:', {
      orderId, paymentId, statusCode, customFields, paymentMethod,
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
    let status: string;
    switch (statusCode) {
      case '2':
        status = 'completed';
        break;
      case '0':
        status = 'pending';
        break;
      case '-1':
        status = 'canceled';
        break;
      case '-2':
        status = 'failed';
        break;
      case '-3':
        status = 'chargedback';
        break;
      default:
        status = 'unknown';
    }

    // Parse custom fields to get related_type and related_id
    let relatedType: string | null = null;
    let relatedId: string | null = null;

    if (customFields && customFields.includes(':')) {
      const [type, id] = customFields.split(':');
      relatedType = type;
      relatedId = id;
    }

    // Upsert payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .upsert({
        transaction_id: paymentId,
        amount: parseFloat(payhereAmount),
        currency: payhereCurrency,
        status,
        payment_type: relatedType || 'donation',
        related_id: relatedId,
        related_type: relatedType,
        payment_gateway: 'payhere',
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

    console.log('Payment record upserted:', { id: payment.id, status });

    // If this is a successful event registration payment, update the registration status
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

    // If this is a donation and completed, update the donation record
    if (relatedType === 'donation' && relatedId && status === 'completed') {
      const { error: donationError } = await supabaseAdmin
        .from('donations')
        .update({ status: 'completed', payment_id: payment.id })
        .eq('id', relatedId);

      if (donationError) {
        console.error('Error updating donation:', donationError);
      } else {
        console.log('Donation marked as completed:', relatedId);
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing PayHere webhook:', error);
    return new Response('ERROR', { status: 500 });
  }
});
