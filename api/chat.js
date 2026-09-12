export default {
  async fetch(request, env) {
    // Tangani Request Method
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Ambil API Key dari Environment Variable Cloudflare
    const API_KEY = env.GCP_API_KEY;

    if (!API_KEY) {
      return new Response(JSON.stringify({ error: 'API Key belum dikonfigurasi di Cloudflare' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const { contents, system_instruction } = await request.json();
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_instruction, contents })
      });

      const responseText = await response.text();
      
      if (!responseText) {
        return new Response(JSON.stringify({ error: 'Server AI mengembalikan respons kosong' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const data = JSON.parse(responseText);

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message || 'Gagal terhubung ke API' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
      
