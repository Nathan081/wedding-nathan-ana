// ╔══════════════════════════════════════════════════════════════════╗
// ║              WEDDING CONFIG — EDIT SEMUA DI SINI                ║
// ║   File ini satu-satunya yang perlu kamu ubah untuk ganti        ║
// ║   nama, tanggal, cerita, foto, rekening, dll.                   ║
// ╚══════════════════════════════════════════════════════════════════╝

const CONFIG = {

  // ════════════════════════════════════════════════════
  // 1. NAMA PASANGAN
  //    groom  = nama mempelai pria
  //    bride  = nama mempelai wanita
  // ════════════════════════════════════════════════════
  groom: 'Nathan',
  bride: 'Ana',

  // eventName otomatis dari groom & bride, tapi bisa di-override manual:
  // eventName: 'Nathan & Ana Wedding',
  get eventName() { return this.groom + ' & ' + this.bride + ' Wedding'; },


  // ════════════════════════════════════════════════════
  // 2. TANGGAL & JAM ACARA
  //    eventDate    → format ISO, dipakai countdown timer
  //    eventDateStr → teks yang tampil di undangan
  //    eventTime    → jam ceremony & reception
  // ════════════════════════════════════════════════════
  eventDate:    '2026-12-26T09:00:00',   // ← ubah YYYY-MM-DD dan jam
  eventDateStr: '26 December 2026',      // ← teks bebas, tampil di undangan
  eventTime:    'Ceremony: 09.00 WIB  ·  Reception: 11.00 WIB',


  // ════════════════════════════════════════════════════
  // 3. VENUE
  //    venueName    → nama gedung/ballroom
  //    venueAddress → alamat lengkap
  //    venuePhone   → nomor telepon venue (opsional)
  //    venueMapsUrl → link Google Maps (klik "Buka di Maps" pakai ini)
  //    venueEmbed   → URL embed Google Maps iframe
  //                   cara dapat: buka maps → Share → Embed a map → copy src="..."
  // ════════════════════════════════════════════════════
  venueName:    'GSJS Pakuwon Mall Surabaya',
  venueAddress: 'Pakuwon Mall, Jl. Puncak Indah Lontar No.2, Surabaya',
  venuePhone:   '+62 31 000-0000',
  venueMapsUrl: 'https://maps.google.com/?q=Pakuwon+Mall+Surabaya',
  venueEmbed:   'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3957.795!2d112.6654!3d-7.2878!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd7fbd0b5d0c9a5%3A0x6b5a0d834f38e22b!2sPakuwon+Mall!5e0!3m2!1sen!2sid!4v1620000000000!5m2!1sen!2sid',


  // ════════════════════════════════════════════════════
  // 4. OUR STORY
  //    Tambah / hapus / ubah chapter sesuka hati.
  //    Setiap chapter punya:
  //      year  → tahun (tampil kecil di atas)
  //      emoji → ikon
  //      title → judul chapter
  //      text  → cerita / paragraf panjang
  // ════════════════════════════════════════════════════
  story: [
    {
      year:  '2018',
      emoji: '☕',
      title: 'First Met',
      text:  'Kami pertama kali bertemu di sebuah kafe kecil di Surabaya. Satu cangkir kopi, satu obrolan panjang — dan dunia terasa berbeda sejak hari itu.'
    },
    {
      year:  '2020',
      emoji: '💌',
      title: 'Fell in Love',
      text:  'Jarak dan waktu tak menghalangi perasaan yang tumbuh perlahan. Setiap pesan, setiap tawa, semakin menguatkan bahwa ini adalah cinta yang sesungguhnya.'
    },
    {
      year:  '2023',
      emoji: '💍',
      title: 'The Proposal',
      text:  'Di bawah langit berbintang, dengan jantung yang berdegup kencang, Nathan berlutut dan mengucapkan kata-kata yang akan dikenang seumur hidup: "Maukah kamu menjadi istriku?"'
    },
    {
      year:  '2026',
      emoji: '💒',
      title: 'Wedding Day',
      text:  'Dan kini tibalah hari yang paling dinantikan. Dua hati, satu janji — untuk selamanya bersama dalam suka dan duka.'
    }
  ],


  // ════════════════════════════════════════════════════
  // 5. GALLERY
  //    6 foto yang muncul satu per satu saat di-scroll.
  //    src     → nama file foto di folder public/photos/
  //    caption → teks hover di bawah foto
  //    Urutan di sini = urutan tampil di halaman.
  // ════════════════════════════════════════════════════
  gallery: [
    { src: 'photos/photo1.jpg', caption: 'Momen pertama bersama' },
    { src: 'photos/photo2.jpg', caption: 'Kenangan indah' },
    { src: 'photos/photo3.jpg', caption: 'Tawa dan canda' },
    { src: 'photos/photo4.jpg', caption: 'Perjalanan cinta' },
    { src: 'photos/photo5.jpg', caption: 'Tak terlupakan' },
    { src: 'photos/photo6.jpg', caption: 'Menuju hari bahagia' }
  ],


  // ════════════════════════════════════════════════════
  // 6. WEDDING GIFT — rekening & e-wallet
  //    Tambah / hapus baris sesuai kebutuhan.
  //    icon        → emoji ikon bank/dompet
  //    bank        → nama bank atau e-wallet
  //    accountName → nama pemilik rekening
  //    accountNo   → nomor rekening / nomor HP
  // ════════════════════════════════════════════════════
  gifts: [
    {
      icon:        '🏦',
      bank:        'Bank BCA',
      accountName: 'Nathan Wijaya',
      accountNo:   '1234567890'
    },
    {
      icon:        '🏦',
      bank:        'Bank Mandiri',
      accountName: 'Anastasia Putri',
      accountNo:   '0987654321'
    },
    {
      icon:        '💚',
      bank:        'GoPay / OVO',
      accountName: 'Nathan Wijaya',
      accountNo:   '0812-3456-7890'
    }
  ],


  // ════════════════════════════════════════════════════
  // 7. SERVER URL
  //    Ganti ini kalau kamu deploy ke VPS / cloud.
  //    Kalau index.html dan server jalan di tempat sama,
  //    tidak perlu diubah.
  // ════════════════════════════════════════════════════
  serverUrl: 'http://localhost:3000'

};

// ── jangan ubah di bawah ini ──────────────────────────────────────
function getAPIBase() {
  const origin = window.location.origin;
  if (!origin || origin === 'null' || window.location.protocol === 'file:') return CONFIG.serverUrl;
  const staticHosts = ['netlify.app', 'github.io', 'vercel.app', 'pages.dev', 'surge.sh'];
  if (staticHosts.some(h => origin.includes(h))) return CONFIG.serverUrl;
  return origin;
}
const API_BASE = getAPIBase();
