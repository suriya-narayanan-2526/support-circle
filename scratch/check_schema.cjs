
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lruucxtuedaffqugvrcj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxydXVjeHR1ZWRhZmZxdWd2cmNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDM1ODEsImV4cCI6MjA4OTMxOTU4MX0.Eti4WQpSGdOF_ohYiZTDKgyOMPT_YkJ0UVeRx1zmKH0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: requests } = await supabase.from('orphan_requests').select('id, category').limit(5);
  console.log('Sample Request IDs:', requests);
  
  const { data: donations } = await supabase.from('donations').select('campaign_id, category').not('campaign_id', 'is', null).limit(5);
  console.log('Sample Donation Campaign IDs:', donations);
}

check();
