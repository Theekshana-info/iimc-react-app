// Phase 2: Enhanced payhere_webhook_handler
// Supports: event_registration (single + multi-session), donation, subscription
// HIGH-2: capacity race condition via RPC
// HIGH-3: upsert payments
// MEDIUM-6: CORS
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import CryptoJS from 'https://esm.sh/crypto-js@4.2.0';

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
    const recurringId = body.get('recurring_id')?.toString() || '';

    console.log('PayHere webhook received:', {
      orderId, paymentId, statusCode, customFields, statusMessage, recurringId,
    });

    // ─── SECURITY: Verify merchant_id matches ───
    if (receivedMerchantId !== merchantId) {
      console.error('Merchant ID mismatch:', { received: receivedMerchantId, expected: merchantId });
      return new Response('INVALID MERCHANT', { status: 403 });
    }

    // ─── SECURITY: Verify md5sig checksum ───
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

    // ─── Parse custom_1 field ───
    // Formats:
    //   event_registration:{eventId}
    //   event_sessions:{eventId}:{sessionId1},{sessionId2},...
    //   donation:{donationId}
    //   subscription:{subscriptionId}
    let paymentType: string = 'donation';
    let eventId: string | null = null;
    let donationId: string | null = null;
    let subscriptionId: string | null = null;
    let sessionIds: string[] = [];

    if (customFields) {
      const parts = customFields.split(':');
      paymentType = parts[0] || 'donation';

      if (paymentType === 'event_registration' && parts[1]) {
        eventId = parts[1];
      } else if (paymentType === 'event_sessions' && parts[1]) {
        eventId = parts[1];
        if (parts[2]) {
          sessionIds = parts[2].split(',').filter(Boolean);
        }
        paymentType = 'event_registration'; // normalize for payment record
      } else if (paymentType === 'donation' && parts[1]) {
        donationId = parts[1];
      } else if (paymentType === 'subscription' && parts[1]) {
        subscriptionId = parts[1];
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

    // ─── Process successful payments ───
    // IMPORTANT: Registration/donation/subscription actions happen BEFORE
    // the payment record is committed. This prevents data inconsistency where
    // a payment is recorded but the user is not registered.
    if (attemptStatus === 'success') {
      let paymentRelatedId = eventId || donationId || subscriptionId;

      // ─── SUCCESS: Event Registration (process BEFORE payment record) ───
      if (paymentType === 'event_registration' && eventId && userId) {
        if (sessionIds.length > 0) {
          // Multi-session registration: register all sessions atomically.
          // Track failures to avoid partial registration.
          const registrationErrors: { sessionId: string; error: string }[] = [];
          for (const sessionId of sessionIds) {
            const { error: registrationError } = await supabaseAdmin
              .rpc('create_paid_registration', {
                p_event_id: eventId,
                p_user_id: userId,
                p_session_id: sessionId,
              });

            if (registrationError) {
              registrationErrors.push({ sessionId, error: registrationError.message });
            } else {
              console.log(`Session registration created: ${sessionId}`);
            }
          }

          // If any session registrations failed, rollback all successful ones
          if (registrationErrors.length > 0) {
            console.error('Multi-session registration had failures:', registrationErrors);
            // Attempt to rollback successful registrations
            const succeededIds = sessionIds.filter(
              sid => !registrationErrors.find(r => r.sessionId === sid)
            );
            for (const sid of succeededIds) {
              await supabaseAdmin
                .from('event_registrations')
                .delete()
                .eq('event_id', eventId)
                .eq('user_id', userId)
                .eq('session_id', sid);
              console.log(`Rolled back session registration: ${sid}`);
            }
            // Log a payment attempt with the failure info
            await supabaseAdmin
              .from('payment_attempts')
              .update({
                status: 'failed',
                failure_reason: `Registration failed for sessions: ${registrationErrors.map(r => r.sessionId).join(',')}`
              })
              .eq('payhere_order_id', paymentId || orderId);
            return new Response('REGISTRATION_FAILED', { status: 409 });
          }
        } else {
          // Single (non-session) registration
          const { error: registrationError } = await supabaseAdmin
            .rpc('create_paid_registration', {
              p_event_id: eventId,
              p_user_id: userId,
            });

          if (registrationError) {
            console.error('Error creating registration via RPC:', registrationError);
            // Log the failure but don't record a completed payment
            await supabaseAdmin
              .from('payment_attempts')
              .update({
                status: 'failed',
                failure_reason: `Registration failed: ${registrationError.message}`
              })
              .eq('payhere_order_id', paymentId || orderId);
            return new Response('CAPACITY_FULL', { status: 409 });
          } else {
            console.log('Event registration created via RPC for event:', eventId);
          }
        }
      }

      // ─── SUCCESS: Donation (process BEFORE payment record) ───
      if (paymentType === 'donation' && donationId) {
        const { error: donationError } = await supabaseAdmin
          .from('donations')
          .update({ status: 'completed' })
          .eq('id', donationId);

        if (donationError) {
          console.error('Error updating donation:', donationError);
          await supabaseAdmin
            .from('payment_attempts')
            .update({
              status: 'failed',
              failure_reason: `Donation update failed: ${donationError.message}`
            })
            .eq('payhere_order_id', paymentId || orderId);
          return new Response('DONATION_UPDATE_FAILED', { status: 500 });
        } else {
          console.log('Donation marked as completed:', donationId);
        }
      }

      // ─── SUCCESS: Subscription (process BEFORE payment record) ───
      if (paymentType === 'subscription' && subscriptionId) {
        const nextChargeDate = new Date();
        nextChargeDate.setMonth(nextChargeDate.getMonth() + 1);

        const { error: subError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'active',
            gateway_subscription_id: recurringId || paymentId,
            next_charge_date: nextChargeDate.toISOString(),
            retry_count: 0,
            grace_until: null,
          })
          .eq('id', subscriptionId);

        if (subError) {
          console.error('Error activating subscription:', subError);
          await supabaseAdmin
            .from('payment_attempts')
            .update({
              status: 'failed',
              failure_reason: `Subscription activation failed: ${subError.message}`
            })
            .eq('payhere_order_id', paymentId || orderId);
          return new Response('SUBSCRIPTION_ACTIVATION_FAILED', { status: 500 });
        } else {
          console.log('Subscription activated:', subscriptionId);
        }

        // Log successful subscription attempt
        await supabaseAdmin
          .from('subscription_attempts')
          .insert({
            subscription_id: subscriptionId,
            amount: parseFloat(payhereAmount),
            status: 'success',
            gateway_tx_id: paymentId,
          });
      }

      // ─── NOW create payment record (after all business logic succeeded) ───
      // HIGH-3: UPSERT on transaction_id to prevent duplicate records from webhook replays
      const { data: paymentData, error: paymentError } = await supabaseAdmin
        .from('payments')
        .upsert(
          {
            transaction_id: paymentId,
            user_id: userId,
            amount: parseFloat(payhereAmount),
            currency: payhereCurrency,
            status: 'completed',
            payment_type: paymentType,
            related_id: paymentRelatedId,
            related_type: paymentType,
            payment_gateway: 'payhere',
          },
          { onConflict: 'transaction_id', ignoreDuplicates: false }
        )
        .select()
        .single();

      if (paymentError) {
        console.error('Error upserting payment:', paymentError);
        // Payment record creation failed but the business logic (registration/donation/subscription)
        // succeeded. This is a partial failure — alert for manual reconciliation.
        return new Response('ERROR', { status: 500 });
      }

      // Link payment_id to donation record (needs paymentData.id which is only available now)
      if (paymentType === 'donation' && donationId) {
        await supabaseAdmin
          .from('donations')
          .update({ payment_id: paymentData.id })
          .eq('id', donationId);
      }

      console.log('Payment record upserted:', { id: paymentData.id });
    }

    // ─── Handle subscription renewal failures ───
    if (attemptStatus === 'failed' && paymentType === 'subscription' && subscriptionId) {
      // Increment retry count, apply grace period logic
      const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('retry_count, status')
        .eq('id', subscriptionId)
        .single();

      if (sub) {
        const newRetryCount = (sub.retry_count || 0) + 1;
        const graceUntil = new Date();
        graceUntil.setDate(graceUntil.getDate() + 7); // 7-day grace period

        if (newRetryCount >= 3) {
          // Max retries reached — suspend subscription
          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: 'suspended',
              retry_count: newRetryCount,
            })
            .eq('id', subscriptionId);
          console.log('Subscription suspended after max retries:', subscriptionId);
        } else {
          // Still within retry window — update retry count and set grace
          const nextRetryDate = new Date();
          nextRetryDate.setDate(nextRetryDate.getDate() + 3); // retry every 3 days

          await supabaseAdmin
            .from('subscriptions')
            .update({
              retry_count: newRetryCount,
              next_charge_date: nextRetryDate.toISOString(),
              grace_until: graceUntil.toISOString(),
            })
            .eq('id', subscriptionId);
          console.log(`Subscription retry ${newRetryCount}/3:`, subscriptionId);
        }

        // Log failed subscription attempt
        await supabaseAdmin
          .from('subscription_attempts')
          .insert({
            subscription_id: subscriptionId,
            amount: parseFloat(payhereAmount),
            status: 'failed',
            gateway_tx_id: paymentId,
            failure_reason: statusMessage || 'Payment failed',
          });
      }
    }

    // ─── Handle chargebacks ───
    if (attemptStatus === 'chargeback') {
      // Revoke event registrations
      if (paymentType === 'event_registration' && eventId && userId) {
        await supabaseAdmin
          .from('event_registrations')
          .update({ status: 'cancelled' })
          .eq('event_id', eventId)
          .eq('user_id', userId);
        console.log('Registrations revoked due to chargeback');
      }

      // Suspend subscriptions
      if (paymentType === 'subscription' && subscriptionId) {
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('id', subscriptionId);
        console.log('Subscription cancelled due to chargeback');
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing PayHere webhook:', error);
    return new Response('ERROR', { status: 500 });
  }
});
