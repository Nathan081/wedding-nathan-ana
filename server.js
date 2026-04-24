require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = 'nathan_ana_wedding';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db;

async function connectDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log('✅ Connected to MongoDB:', DB_NAME);
}

// ─── GUESTS ─────────────────────────────────────────────────────────────────

app.get('/api/guests', async (req, res) => {
  try {
    const guests = await db.collection('guests').find().sort({ createdAt: -1 }).toArray();
    res.json(guests);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/guests', async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const existing = await db.collection('guests').findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) return res.status(409).json({ error: 'Guest already exists', guest: existing });
    const guest = { name, phone: phone || '', createdAt: new Date().toISOString() };
    const result = await db.collection('guests').insertOne(guest);
    res.json({ ...guest, _id: result.insertedId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/guests/bulk', async (req, res) => {
  try {
    const { names } = req.body;
    if (!names || !names.length) return res.status(400).json({ error: 'Names array required' });
    let added = 0;
    const results = [];
    for (const name of names) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      const existing = await db.collection('guests').findOne({ name: { $regex: new RegExp(`^${trimmed}$`, 'i') } });
      if (!existing) {
        const guest = { name: trimmed, phone: '', createdAt: new Date().toISOString() };
        const r = await db.collection('guests').insertOne(guest);
        results.push({ ...guest, _id: r.insertedId });
        added++;
      }
    }
    res.json({ added, guests: results });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/guests/:id/phone', async (req, res) => {
  try {
    const { phone } = req.body;
    await db.collection('guests').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { phone: phone || '' } }
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/guests/:id', async (req, res) => {
  try {
    await db.collection('guests').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/guests', async (req, res) => {
  try {
    await db.collection('guests').deleteMany({});
    await db.collection('rsvp').deleteMany({});
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── RSVP ────────────────────────────────────────────────────────────────────
// IMPORTANT: Specific routes must be BEFORE :ticketId param routes

app.get('/api/rsvp', async (req, res) => {
  try {
    const guests = await db.collection('rsvp').find().sort({ registeredAt: -1 }).toArray();
    res.json(guests);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/rsvp', async (req, res) => {
  try {
    const { ticketId, nama, email, hadir, jumlah, alergi } = req.body;
    if (!ticketId || !nama) return res.status(400).json({ error: 'ticketId and nama required' });

    const existing = await db.collection('rsvp').findOne({ ticketId });
    if (existing) {
      await db.collection('rsvp').updateOne(
        { ticketId },
        { $set: {
          hadir: hadir || existing.hadir,
          jumlah: jumlah || existing.jumlah || 1,
          alergi: alergi !== undefined ? alergi : (existing.alergi || '')
        }}
      );
      return res.json({ ok: true, guest: { ...existing, hadir: hadir || existing.hadir }, alreadyExists: true });
    }

    const guest = {
      ticketId,
      nama,
      email: email || '',
      hadir: hadir || 'Hadir',
      jumlah: jumlah || 1,
      alergi: alergi || '',
      checkedIn: false,
      registeredAt: new Date().toISOString()
    };
    const result = await db.collection('rsvp').insertOne(guest);
    res.json({ ok: true, guest: { ...guest, _id: result.insertedId } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── SPECIFIC ROUTES FIRST (before :ticketId) ──

// DELETE all check-ins (reset) — must be before /:ticketId
app.delete('/api/rsvp/checkins', async (req, res) => {
  try {
    await db.collection('rsvp').updateMany({}, { $set: { checkedIn: false }, $unset: { checkedInAt: '' } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH check-in by name — must be before /:ticketId
app.patch('/api/rsvp/checkin-name', async (req, res) => {
  try {
    const { nama } = req.body;
    const guest = await db.collection('rsvp').findOne({
      nama: { $regex: new RegExp(nama, 'i') }
    });
    if (!guest) return res.status(404).json({ error: 'Guest not found' });
    if (guest.checkedIn) return res.status(409).json({ error: 'Already checked in', guest });
    await db.collection('rsvp').updateOne(
      { _id: guest._id },
      { $set: { checkedIn: true, checkedInAt: new Date().toISOString() } }
    );
    res.json({ ok: true, guest });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH check-in by ticketId
app.patch('/api/rsvp/checkin/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const guest = await db.collection('rsvp').findOne({ ticketId });
    if (!guest) return res.status(404).json({ error: 'Guest not found' });
    if (guest.checkedIn) return res.status(409).json({ error: 'Already checked in', guest });
    await db.collection('rsvp').updateOne(
      { ticketId },
      { $set: { checkedIn: true, checkedInAt: new Date().toISOString() } }
    );
    res.json({ ok: true, guest: { ...guest, checkedIn: true } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH undo check-in
app.patch('/api/rsvp/undo/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    await db.collection('rsvp').updateOne(
      { ticketId },
      { $set: { checkedIn: false }, $unset: { checkedInAt: '' } }
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH update RSVP data
app.patch('/api/rsvp/:ticketId', async (req, res) => {
  try {
    const { hadir, jumlah, alergi } = req.body;
    const update = {};
    if (hadir) update.hadir = hadir;
    if (jumlah) update.jumlah = jumlah;
    if (alergi !== undefined) update.alergi = alergi;
    await db.collection('rsvp').updateOne(
      { ticketId: req.params.ticketId },
      { $set: update }
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GREETINGS ───────────────────────────────────────────────────────────────

app.get('/api/greetings', async (req, res) => {
  try {
    const greetings = await db.collection('greetings').find().sort({ createdAt: -1 }).limit(100).toArray();
    res.json(greetings);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/greetings', async (req, res) => {
  try {
    const { name, msg } = req.body;
    if (!name || !msg) return res.status(400).json({ error: 'name and msg required' });
    const greeting = {
      name,
      msg,
      createdAt: new Date().toISOString(),
      time: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) +
            ' · ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
    const result = await db.collection('greetings').insertOne(greeting);
    res.json({ ok: true, greeting: { ...greeting, _id: result.insertedId } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── START ───────────────────────────────────────────────────────────────────

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📁 Serving static files from ./public`);
  });
}).catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err.message);
  process.exit(1);
});
