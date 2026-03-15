import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface MorningWebhookData {
  customer_id?: string;
  customerId?: string;
  subscription_id?: string;
  subscriptionId?: string;
  payment_method?: { last4?: string };
  last4?: string;
  next_billing_date?: string;
  nextBillingDate?: string;
  metadata?: {
    userId?: string;
  };
  userId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract event data
    const { type, data } = body;

    // Get user ID from metadata
    const userId = data?.metadata?.userId || data?.userId;

    if (!userId) {
      console.error('No userId in webhook data');
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    console.log(`Morning webhook: ${type} for user ${userId}`);

    switch (type) {
      case 'payment.success':
      case 'payment.completed':
        await handlePaymentSuccess(userId, data);
        break;

      case 'subscription.created':
        await handleSubscriptionCreated(userId, data);
        break;

      case 'subscription.cancelled':
      case 'subscription.canceled':
        await handleSubscriptionCancelled(userId);
        break;

      case 'payment.failed':
        await handlePaymentFailed(userId);
        break;

      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(userId: string, data: MorningWebhookData) {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const { error } = await supabase
    .from('profiles')
    .update({
      plan: 'premium',
      subscription_status: 'trialing',
      trial_ends_at: trialEndsAt.toISOString(),
      morning_customer_id: data.customer_id || data.customerId,
      morning_subscription_id: data.subscription_id || data.subscriptionId,
      payment_method_last4: data.payment_method?.last4 || data.last4,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating profile after payment:', error);
  } else {
    console.log(`User ${userId} upgraded to Premium (trialing)`);
  }
}

async function handleSubscriptionCreated(userId: string, data: MorningWebhookData) {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'active',
      morning_subscription_id: data.subscription_id || data.subscriptionId,
      next_billing_date: data.next_billing_date || data.nextBillingDate,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating subscription:', error);
  } else {
    console.log(`Subscription created for user ${userId}`);
  }
}

async function handleSubscriptionCancelled(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({
      plan: 'starter',
      subscription_status: 'cancelled',
      trial_ends_at: null,
      next_billing_date: null,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error cancelling subscription:', error);
  } else {
    console.log(`Subscription cancelled for user ${userId}`);
  }
}

async function handlePaymentFailed(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating payment failed status:', error);
  } else {
    console.log(`Payment failed for user ${userId}`);
  }
}
