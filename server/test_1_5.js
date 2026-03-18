
require('dotenv').config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.models) {
    console.log(JSON.stringify(data.models.filter(m => m.name.includes('1.5')), null, 2));
  } else {
    console.log('Error:', data);
  }
}
test();
