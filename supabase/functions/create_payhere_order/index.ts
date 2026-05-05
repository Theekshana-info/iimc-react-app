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
    const { amount, orderId, itemName, notifyUrl } = await req.json();

    const merchantId = Deno.env.get('PAYHERE_MERCHANT_ID')!;
    const merchantSecret = Deno.env.get('PAYHERE_MERCHANT_SECRET')!;
    const currency = 'LKR';

    // Format amount to exactly 2 decimal places, no commas
    // PayHere JS SDK sample: parseFloat(amount).toLocaleString('en-us', {minimumFractionDigits: 2}).replaceAll(',', '')
    const amountFormatted = parseFloat(amount)
      .toLocaleString('en-us', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      .replaceAll(',', '');

    // Generate hash per PayHere docs (using their recommended CryptoJS approach):
    // hash = UPPER(MD5(merchant_id + order_id + amount + currency + UPPER(MD5(merchant_secret))))
    const hashedSecret = CryptoJS.MD5(merchantSecret).toString().toUpperCase();
    const hashString = merchantId + orderId + amountFormatted + currency + hashedSecret;
    const hash = CryptoJS.MD5(hashString).toString().toUpperCase();

    console.log('PayHere order created:', {
      merchantId,
      orderId,
      amountFormatted,
      currency,
      hash: hash.substring(0, 8) + '...',  // Log partial hash for debugging
      secretLength: merchantSecret.length,
    });

    return new Response(
      JSON.stringify({
        merchant_id: merchantId,
        order_id: orderId,
        amount: amountFormatted,
        currency: currency,
        hash: hash,
        items: itemName,
        notify_url: notifyUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating PayHere order:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
