import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rgfajvnkrszwksiidspm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnZmFqdm5rcnN6d2tzaWlkc3BtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg3ODU2MCwiZXhwIjoyMDg3NDU0NTYwfQ.hSAgJNXgFjF8-WbFwMVqSPxFRi1LSQyXICxCArI-QdU'
);

async function createProfile() {
  console.log('🔧 Creating premium admin profile...');

  // First, let's check if profile already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'almog@compakt.com')
    .single();

  if (existingProfile) {
    console.log('✅ Profile already exists, updating to premium...');
    // Update existing profile to premium
    const { data, error } = await supabase
      .from('profiles')
      .update({
        plan: 'premium',
        role: 'owner',
        is_active: true,
        feature_overrides: {
          spotify_import: true,
          analytics: true,
          couple_links: true,
          google_calendar_sync: true,
          image_uploads: true,
          upsells: true,
          custom_branding: true,
          team_access: true
        }
      })
      .eq('email', 'almog@compakt.com')
      .select();

    if (error) {
      console.error('❌ Error updating profile:', error);
    } else {
      console.log('✅ Profile updated to premium:', data);
    }
    return;
  }

  // Create new profile with UUID
  const userId = crypto.randomUUID();
  const profileData = {
    user_id: userId,
    email: 'almog@compakt.com',
    full_name: 'אלמוג כהן',
    role: 'owner',
    plan: 'premium',
    is_active: true,
    onboarding_complete: true,
    feature_overrides: {
      spotify_import: true,
      analytics: true,
      couple_links: true,
      google_calendar_sync: true,
      image_uploads: true,
      upsells: true,
      custom_branding: true,
      team_access: true
    },
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('profiles')
    .insert(profileData)
    .select();

  if (error) {
    console.error('❌ Error creating profile:', error);
  } else {
    console.log('✅ Premium profile created successfully:', data);
  }
}

createProfile().catch(console.error);
