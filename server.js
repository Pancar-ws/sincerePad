const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid'); // Untuk ID unik

const app = express();
const PORT = process.env.PORT || 3000;
const NOTES_FILE_PATH = path.join(__dirname, 'notes.json');

// Middleware
// Menyajikan file statis (HTML, CSS, JS client-side) dari direktori root proyek
app.use(express.static(__dirname));
// Mem-parse body request yang datang sebagai JSON
app.use(bodyParser.json());

// Fungsi untuk membaca catatan dari file notes.json
function getNotesFromFile() {
    try {
        // Cek apakah file notes.json ada
        if (fs.existsSync(NOTES_FILE_PATH)) {
            const data = fs.readFileSync(NOTES_FILE_PATH, 'utf8');
            // Coba parse data JSON, jika kosong atau tidak valid, kembalikan array kosong
            return data ? JSON.parse(data) : [];
        }
        return []; // Kembalikan array kosong jika file tidak ada
    } catch (error) {
        console.error("Gagal membaca notes.json:", error);
        // Jika terjadi error saat membaca atau parsing, kembalikan array kosong
        // Ini untuk mencegah server crash jika file rusak
        return [];
    }
}

// Fungsi untuk menyimpan catatan ke file notes.json
function saveNotesToFile(notes) {
    try {
        // Tulis data catatan ke file notes.json dengan format JSON yang rapi (null, 2 untuk indentasi)
        fs.writeFileSync(NOTES_FILE_PATH, JSON.stringify(notes, null, 2), 'utf8');
    } catch (error) {
        console.error("Gagal menyimpan ke notes.json:", error);
    }
}

// --- API Endpoints ---

// Endpoint untuk mendapatkan semua catatan (GET /api/notes)
app.get('/api/notes', (req, res) => {
    const notes = getNotesFromFile();
    // Urutkan catatan berdasarkan timestamp, dari yang terbaru ke yang terlama
    notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(notes); // Kirim catatan sebagai respons JSON
});

// Endpoint untuk menyimpan catatan baru (POST /api/notes)
app.post('/api/notes', (req, res) => {
    const { text } = req.body; // Ambil 'text' dari body request

    // Validasi input: pastikan 'text' ada, berupa string, dan tidak hanya spasi kosong
    if (!text || typeof text !== 'string' || text.trim() === '') {
        return res.status(400).json({ message: 'Input kalimat tidak valid atau kosong.' });
    }

    const notes = getNotesFromFile(); // Baca catatan yang sudah ada
    const newNote = {
        id: uuidv4(), // Buat ID unik untuk catatan baru
        text: text.trim(), // Hapus spasi di awal dan akhir teks
        timestamp: new Date().toISOString(), // Tambahkan timestamp saat ini dalam format ISO
    };

    notes.push(newNote); // Tambahkan catatan baru ke array
    saveNotesToFile(notes); // Simpan semua catatan (termasuk yang baru) ke file

    // Kirim respons sukses (201 Created) bersama dengan catatan yang baru dibuat
    res.status(201).json(newNote);
});

// Rute utama untuk menyajikan file index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Server SincerePad berjalan di http://localhost:${PORT}`);
    // Pastikan file notes.json ada saat server pertama kali dijalankan
    // Jika tidak ada, buat file kosong agar tidak error saat pertama kali dibaca
    if (!fs.existsSync(NOTES_FILE_PATH)) {
        saveNotesToFile([]); // Buat file notes.json dengan array kosong
        console.log('File notes.json berhasil dibuat.');
    }
});