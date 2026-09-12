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
        const body = await request.json();
        
        // Memastikan format contents sesuai standar Gemini API
        let formattedContents = body.contents;
        if (typeof body.contents === 'string') {
          formattedContents = [{ parts: [{ text: body.contents }] }];
        }

        const payload = {
          contents: formattedContents
        };

        if (body.system_instruction) {
          payload.system_instruction = typeof body.system_instruction === 'string'
            ? { parts: [{ text: body.system_instruction }] }
            : body.system_instruction;
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        // Jika API Google Gemini mengembalikan error
        if (data.error) {
          return new Response(JSON.stringify({
            candidates: [{ content: { parts: [{ text: `Google API Error: ${data.error.message}` }] } }]
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text 
          || `Model tidak memberikan teks. Response: ${JSON.stringify(data)}`;

        return new Response(JSON.stringify({
          candidates: [{ content: { parts: [{ text: textResponse }] } }]
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          candidates: [{ content: { parts: [{ text: `Worker Exception: ${error.message}` }] } }]
        }), {
          status: 200,
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
          
