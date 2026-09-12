export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Endpoint API untuk Chat
    if (url.pathname === '/api/chat') {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const API_KEY = env.GCP_API_KEY;
      if (!API_KEY) {
        return new Response(JSON.stringify({ error: 'API Key belum dikonfigurasi' }), {
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

        const data = await response.json();
        return new Response(JSON.stringify(data), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Melayani file statis (index.html)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('File statis tidak ditemukan', { status: 404 });
  }
};
