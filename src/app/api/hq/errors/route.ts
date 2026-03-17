import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';

/**
 * API route for fetching error logs (HQ only)
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is staff/owner
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['staff', 'owner'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query = supabase
      .from('error_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (resolved !== null) {
      query = query.eq('resolved', resolved === 'true');
    }

    const { data: errors, error } = await query;

    if (error) {
      console.error('Failed to fetch errors:', error);
      return NextResponse.json(
        { error: 'Failed to fetch errors' },
        { status: 500 }
      );
    }

    // Get stats
    const { data: stats } = await supabase
      .from('error_logs')
      .select('severity, resolved')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const errorStats = {
      total: stats?.length || 0,
      critical: stats?.filter((e: { severity: string; resolved: boolean }) => e.severity === 'critical' && !e.resolved).length || 0,
      high: stats?.filter((e: { severity: string; resolved: boolean }) => e.severity === 'high' && !e.resolved).length || 0,
      medium: stats?.filter((e: { severity: string; resolved: boolean }) => e.severity === 'medium' && !e.resolved).length || 0,
      low: stats?.filter((e: { severity: string; resolved: boolean }) => e.severity === 'low' && !e.resolved).length || 0,
      resolved: stats?.filter((e: { resolved: boolean }) => e.resolved).length || 0,
    };

    return NextResponse.json({
      errors,
      stats: errorStats,
    });
  } catch (err) {
    console.error('Error in errors endpoint:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Mark error as resolved
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createRouteClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is staff/owner
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['staff', 'owner'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { error_id, resolved, notes } = body;

    const { error } = await supabase
      .from('error_logs')
      .update({
        resolved,
        resolved_at: resolved ? new Date().toISOString() : null,
        resolved_by: resolved ? user.id : null,
        notes,
      })
      .eq('id', error_id);

    if (error) {
      console.error('Failed to update error:', error);
      return NextResponse.json(
        { error: 'Failed to update error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in errors PATCH endpoint:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
