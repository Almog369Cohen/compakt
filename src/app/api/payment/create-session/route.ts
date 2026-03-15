import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { userId, email, plan } = await req.json();

    if (!userId || !email || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const morningApiKey = process.env.MORNING_API_KEY;

    if (!morningApiKey) {
      console.error('Missing MORNING_API_KEY');
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500 }
      );
    }

    // Create payment session with Morning API
    const morningResponse = await fetch('https://api.greeninvoice.co.il/api/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${morningApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 320, // Payment type
        client: {
          name: 'Compakt Customer',
          email: email
        },
        income: [{
          description: 'Compakt Premium - 14 יום ניסיון חינם',
          quantity: 1,
          price: 149,
          currency: 'ILS',
          vatType: 0 // No VAT
        }],
        payment: {
          type: 'credit',
          dealType: 'subscription',
          trialDays: 14
        },
        remarks: `User ID: ${userId}, Plan: ${plan}`,
        lang: 'he'
      })
    });

    if (!morningResponse.ok) {
      const errorData = await morningResponse.json();
      console.error('Morning API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create payment session' },
        { status: 500 }
      );
    }

    const morningData = await morningResponse.json();
    const paymentUrl = morningData.url || morningData.paymentUrl;

    if (!paymentUrl) {
      console.error('No payment URL in Morning response:', morningData);
      return NextResponse.json(
        { error: 'Invalid payment response' },
        { status: 500 }
      );
    }

    // Update user status to pending
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
    }

    return NextResponse.json({
      paymentUrl,
      success: true
    });

  } catch (error) {
    console.error('Payment session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
