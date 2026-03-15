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

    // For now, we'll use Morning's payment page URL
    // You'll need to create a product in Morning and get the URL
    const morningPaymentUrl = process.env.MORNING_PAYMENT_URL || 'https://www.greeninvoice.co.il/pay/YOUR_PAYMENT_ID';

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
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Add user metadata to the URL
    const paymentUrl = `${morningPaymentUrl}?userId=${userId}&email=${encodeURIComponent(email)}&plan=${plan}`;

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
