export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const API_KEY = env.GCP_API_KEY;

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (url.pathname === '/api/chat') {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      if (!API_KEY) {
        return new Response(JSON.stringify({ error: 'API Key belum dikonfigurasi' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      try {
        const body = await request.json();
        
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

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
          return new Response(JSON.stringify({
            candidates: [{ content: { parts: [{ text: `Google API Error: ${data.error.message}` }] } }]
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text 
          || `Model tidak memberikan teks. Response: ${JSON.stringify(data)}`;

        return new Response(JSON.stringify({
          candidates: [{ content: { parts: [{ text: textResponse }] } }]
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          candidates: [{ content: { parts: [{ text: `Worker Exception: ${error.message}` }] } }]
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (url.pathname === '/api/edit-image') {
      try {
        let promptText = "A beautiful scenery";
        try {
          const body = await request.json();
          if (body && body.prompt) {
            promptText = body.prompt;
          }
        } catch (e) {
          // Kalau body kosong/bukan json, tetap lanjut pakai default prompt
        }

        const imagenRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptText,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg' }
          })
        });
        const data = await imagenRes.json();
        
        const base64Image = data.predictions?.[0]?.bytesBase64Encoded;
        const resultUrl = base64Image ? `data:image/jpeg;base64,${base64Image}` : null;

        return new Response(JSON.stringify({ resultImageUrl: resultUrl }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ resultImageUrl: null, error: err.message }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('File statis tidak ditemukan', { status: 404 });
  }
};
      
