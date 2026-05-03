import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from "https://deno.land/std@0.224.0/crypto/crypto.ts";

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
    const { amount, orderId, itemName, returnUrl, cancelUrl, notifyUrl } = await req.json();

    const merchantId = Deno.env.get('PAYHERE_MERCHANT_ID')!;
    const merchantSecret = Deno.env.get('PAYHERE_MERCHANT_SECRET')!;
    const currency = 'LKR';

    // Create SHA-1 hash
    const hashString = `${merchantId}${orderId}${amount}${currency}${merchantSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(hashString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashValue = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    console.log('PayHere order created:', { orderId, amount, hashValue });

    return new Response(
      JSON.stringify({
        merchant_id: merchantId,
        order_id: orderId,
        amount: amount.toFixed(2),
        currency: currency,
        hash: hashValue,
        items: itemName,
        return_url: returnUrl,
        cancel_url: cancelUrl,
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
