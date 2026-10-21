require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const dataDir = path.join(__dirname, 'data');
const eventsFile = path.join(dataDir, 'time-events.json');
fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(eventsFile)) fs.writeFileSync(eventsFile, '[]', 'utf8');

function readEvents() {
  try { return JSON.parse(fs.readFileSync(eventsFile, 'utf8')); }
  catch { return []; }
}
function writeEvents(events) {
  const temp = eventsFile + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(events, null, 2), 'utf8');
  fs.renameSync(temp, eventsFile);
}
app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'J.A.R.V.I.S. nuevo' }));
app.get('/api/time-events', (_req, res) => res.json(readEvents()));
app.post('/api/time-events', (req, res) => {
  const { type, timestamp, note } = req.body || {};
  if (!['entrada', 'salida', 'inicio_pausa', 'fin_pausa'].includes(type)) {
    return res.status(400).json({ error: 'Tipo de marca no válido.' });
  }
  const events = readEvents();
  const event = {
    id: (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type, timestamp: timestamp || new Date().toISOString(),
    note: typeof note === 'string' ? note.slice(0, 300) : ''
  };
  events.push(event);
  writeEvents(events);
  res.status(201).json(event);
});
app.get('/api/export', (_req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="jarvis-time-events.json"');
  res.type('application/json').send(JSON.stringify(readEvents(), null, 2));
});
app.post('/api/import', (req, res) => {
  const incoming = req.body;
  if (!Array.isArray(incoming) || incoming.some(e => !e || !['entrada','salida','inicio_pausa','fin_pausa'].includes(e.type) || !e.timestamp)) {
    return res.status(400).json({ error: 'Archivo inválido. Se esperaba una lista de marcas con type y timestamp.' });
  }
  // Import is additive and deduplicates by id/type/timestamp; never replaces current records.
  const existing = readEvents();
  const keys = new Set(existing.map(e => `${e.id || ''}|${e.type}|${e.timestamp}`));
  let added = 0;
  for (const e of incoming) {
    const key = `${e.id || ''}|${e.type}|${e.timestamp}`;
    if (!keys.has(key)) {
      existing.push({ id: e.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`, type: e.type, timestamp: e.timestamp, note: typeof e.note === 'string' ? e.note.slice(0,300) : '' });
      keys.add(key); added++;
    }
  }
  writeEvents(existing);
  res.json({ ok: true, added, total: existing.length });
});
app.post('/api/chat', async (req, res) => {
  const message = String((req.body || {}).message || '').trim();
  if (!message) return res.status(400).json({ error: 'Escribe o dicta una pregunta.' });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.json({ reply: 'La voz y el control horario están preparados. Para activar las respuestas inteligentes, configura OPENAI_API_KEY en el servidor. No introduzcas la clave en esta página.' });
  }
  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        instructions: 'Eres J.A.R.V.I.S., un asistente en español. Responde de forma clara y breve. No afirmes que has registrado o consultado horas si no se te han proporcionado datos.',
        input: message
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'La IA no ha podido responder. Comprueba la configuración del servidor.' });
    const reply = data.output?.flatMap(item => item.content || []).filter(c => c.type === 'output_text').map(c => c.text).join('\n') || 'No he recibido una respuesta de texto.';
    res.json({ reply });
  } catch (e) {
    res.status(502).json({ error: 'No se pudo conectar con el servicio de IA.' });
  }
});
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`J.A.R.V.I.S. listo en http://localhost:${port}`));
