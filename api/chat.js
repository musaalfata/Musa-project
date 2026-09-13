export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const API_KEY = env.GCP_API_KEY || env.GEMINI_API_KEY;

    // Handle API Chat
    if (url.pathname === '/api/chat') {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      try {
        const body = await request.json();
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await response.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Tampilan Web Utama (Frontend & Backend jadi satu)
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Musai AI</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-slate-50 text-slate-900 font-sans antialiased h-screen overflow-hidden">
  <div id="root" class="h-full"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef } = React;
    function App() {
      const [messages, setMessages] = useState([]);
      const [input, setInput] = useState('');
      const [isLoading, setIsLoading] = useState(false);
      const chatEndRef = useRef(null);

      useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, [messages]);

      const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: "Nama kamu Musai, diciptakan oleh Musa Alfata (13 Mei 2013)." }] },
              contents: [{ parts: [{ text: userMsg }] }]
            })
          });
          const data = await res.json();
          const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, terjadi kesalahan pada respons AI.";
          setMessages(prev => [...prev, { role: 'model', text: aiText }]);
        } catch (err) {
          setMessages(prev => [...prev, { role: 'model', text: "Error koneksi: " + err.message }]);
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <div class="flex flex-col h-screen w-full bg-slate-50">
          <header class="h-14 bg-white border-b border-slate-200 flex items-center px-4 shadow-sm">
            <h1 class="text-lg font-medium text-slate-800">Musai AI</h1>
          </header>
          <main class="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div class="text-center mt-20 text-slate-400">
                <p class="text-2xl font-normal">Halo Musa,</p>
                <p class="text-lg">Ada yang bisa saya bantu hari ini?</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} class={\`flex \${m.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
                <div class={\`max-w-[85%] p-3.5 rounded-2xl text-sm \${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}\`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && <div class="text-slate-400 text-sm italic">Musai sedang mengetik...</div>}
            <div ref={chatEndRef} />
          </main>
          <footer class="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input 
              type="text" 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSend()} 
              placeholder="Ketik pesan..." 
              class="flex-1 bg-slate-100 border border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
            <button onClick={handleSend} class="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-700 transition">
              <i class="fa-solid fa-paper-plane text-sm"></i>
            </button>
          </footer>
        </div>
      );
    }
    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
  }
};
