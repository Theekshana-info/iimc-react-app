import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

async function checkAttempts() {
  const { data, error } = await supabase
    .from('payment_attempts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) console.error('Error fetching attempts:', error);
  else console.log('Latest attempts:', JSON.stringify(data, null, 2));

  const { data: payData, error: payError } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (payError) console.error('Error fetching payments:', payError);
  else console.log('Latest payments:', JSON.stringify(payData, null, 2));
}

checkAttempts();
