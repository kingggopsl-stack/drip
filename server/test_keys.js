const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function testKeys() {
  console.log('--- Key Diagnostic ---');
  
  // Test OpenAI
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    console.log('Testing OpenAI embedding API...');
    await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: "test",
    });
    console.log('✅ OpenAI Key: VALID');
  } catch (err) {
    console.log('❌ OpenAI Key: INVALID');
    console.log('   Error:', err.message);
  }

  // Test Gemini
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
  
  try {
    console.log('Testing Gemini API...');
    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
    });
    const data = await res.json();
    if (data.error) {
      console.log('❌ Gemini Key: INVALID');
      console.log('   Error:', data.error.message);
    } else {
      console.log('✅ Gemini Key: VALID');
    }
  } catch (err) {
    console.log('❌ Gemini API Connection Failed');
    console.log('   Error:', err.message);
  }
  // Test Supabase
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('Testing Supabase Authentication...');
    const { data, error } = await supabase.from('proposals').select('id').limit(1);
    
    if (error) {
      if (error.message.includes('Invalid API Key')) {
        console.log('❌ Supabase Key: INVALID (Invalid API Key)');
      } else {
        console.log('❌ Supabase Error:', error.message);
      }
    } else {
      console.log('✅ Supabase Connection: SUCCESSful');
    }
  } catch (err) {
    console.log('❌ Supabase Connection Failed');
    console.log('   Error:', err.message);
  }
}

(async () => {
  try {
    await testKeys();
  } catch (err) {
    console.error('Diagnostic Script Fatal Error:', err);
  }
})();
