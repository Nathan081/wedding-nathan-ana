require('dotenv').config();

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = 'nathan_ana_wedding';

app.use(cors({
  origin: '*',  // Allow all origins — admin & checkin bisa dari mana saja
  methods: ['GET','POST','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.options('*', cors()); // preflight
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db;
let mongoClient;
let isConnected = false;

async function connectDB(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Attempting MongoDB connection (${i + 1}/${retries})...`);
      
      mongoClient = new MongoClient(MONGO_URI, {
        connectTimeoutMS: 30000,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 60000,
        retryWrites: true,
        maxPoolSize: 10,
        family: 4,
      });
      
      await mongoClient.connect();
      
      // Test connection
      await mongoClient.db('admin').command({ ping: 1 });
      
      db = mongoClient.db(DB_NAME);
      isConnected = true;
      console.log('✅ Connected to MongoDB:', DB_NAME);
      return;
    } catch (error) {
      console.error(`❌ Connection attempt ${i + 1} failed:`, error.message);
      if (i < retries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error('Failed to connect to MongoDB after ' + retries + ' attempts');
}

// Middleware to check DB connection (skip for health check)
app.use((req, res, next) => {
  if (req.path === '/api/health') return next(); // Allow health check always
  if (!db || !isConnected) {
    return res.status(503).json({ error: 'Database connection unavailable' });
  }
  next();
});

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
    // Cari guest dulu untuk dapatkan namanya
    const guest = await db.collection('guests').findOne({ _id: new ObjectId(req.params.id) });
    await db.collection('guests').deleteOne({ _id: new ObjectId(req.params.id) });
    // Hapus RSVP yang berkaitan juga (match by nama)
    if (guest && guest.name) {
      await db.collection('rsvp').deleteOne({ nama: { $regex: new RegExp(`^${guest.name}$`, 'i') } });
    }
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

// GET single RSVP by ticketId
app.get('/api/rsvp/:ticketId', async (req, res) => {
  try {
    const guest = await db.collection('rsvp').findOne({ ticketId: req.params.ticketId });
    if (!guest) return res.status(404).json({ error: 'Guest not found' });
    res.json(guest);
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

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────

app.get('/api/health', async (req, res) => {
  try {
    if (!db || !isConnected) {
      return res.status(503).json({ 
        status: 'error', 
        message: 'Database not connected',
        connected: false 
      });
    }
    
    // Test DB connection
    await db.admin().ping();
    
    res.json({ 
      status: 'ok',
      message: 'Server and database running',
      connected: true,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(503).json({ 
      status: 'error', 
      message: e.message,
      connected: false 
    });
  }
});

// ─── START ───────────────────────────────────────────────────────────────────

async function startServer() {
  try {
    await connectDB(12); // Try up to 12 times with exponential backoff
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📁 Serving static files from ./public`);
      console.log(`📊 Database: ${DB_NAME}`);
      console.log('✅ Ready to receive requests...');
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        if (mongoClient) {
          await mongoClient.close();
          console.log('✅ MongoDB connection closed');
        }
        process.exit(0);
      });
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.error('💡 Check your MONGO_URI in .env file');
    console.error('💡 Make sure MongoDB Atlas allows connections from your IP');
    process.exit(1);
  }
}

startServer();