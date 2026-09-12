export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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

        // Mengambil teks balasan dari struktur data Gemini
        const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, tidak ada balasan dari model.";

        return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: textResponse }] } }] }), {
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

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('File statis tidak ditemukan', { status: 404 });
  }
};
