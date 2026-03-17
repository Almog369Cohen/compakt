import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * API route for logging errors
 * Alternative to Sentry - stores errors in Supabase
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      error_message,
      error_stack,
      error_type,
      page_url,
      severity = 'medium',
      metadata = {},
    } = body;
    
    // Get user info from headers
    const user_agent = request.headers.get('user-agent') || 'unknown';
    
    // Insert error log
    const { data, error } = await supabase
      .from('error_logs')
      .insert({
        error_message,
        error_stack,
        error_type,
        page_url,
        user_agent,
        severity,
        metadata,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Failed to log error:', error);
      return NextResponse.json(
        { error: 'Failed to log error' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error('Error in log endpoint:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
