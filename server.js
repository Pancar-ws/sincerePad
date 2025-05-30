// server.js - Backend untuk sincerePad
require('dotenv').config(); // Memuat variabel dari file .env di paling atas

const express = require('express');
const cors = require('cors'); //
const path = require('path'); //
const { v4: uuidv4 } = require('uuid'); //
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express(); //
const PORT = process.env.PORT || 3001; // Menggunakan port dari .env atau default 3001

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "sincerePad_db"; // Ambil nama DB dari .env atau default
const COLLECTION_NAME = "notes";

console.log('[DEBUG] MONGODB_URI yang terbaca:', MONGODB_URI);
console.log('[DEBUG] Nama Database yang akan digunakan:', DB_NAME);

let db;
let notesCollection;
let client; // Definisikan client di scope yang lebih luas

if (MONGODB_URI) {
    client = new MongoClient(MONGODB_URI, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });
} else {
    console.warn("PERINGATAN: MONGODB_URI tidak ditemukan di variabel lingkungan.");
    console.warn("Aplikasi TIDAK AKAN BISA terhubung ke MongoDB dan operasi database akan gagal.");
    console.warn("Pastikan file .env ada di root proyek dan berisi MONGODB_URI yang benar.");
}

async function connectDB() {
    if (!client) {
        console.error("KRITIS: MongoClient tidak diinisialisasi karena MONGODB_URI tidak ada.");
        return; // Jangan lanjutkan jika client tidak ada
    }
    try {
        await client.connect();
        db = client.db(DB_NAME);
        notesCollection = db.collection(COLLECTION_NAME);
        console.log(`INFO: Berhasil terhubung ke MongoDB Atlas! Database: ${DB_NAME}, Collection: ${COLLECTION_NAME}`);
    } catch (err) {
        console.error("KRITIS: Gagal terhubung ke MongoDB Atlas:", err);
        // Pertimbangkan untuk tidak keluar dari proses agar nodemon bisa restart,
        // tetapi log error ini sangat penting.
        // process.exit(1);
    }
}

// Middleware
app.use(cors({ //
    origin: '*', // Mengizinkan akses dari semua origin //
    methods: ['GET', 'POST', 'PUT', 'DELETE'], //
    allowedHeaders: ['Content-Type'] //
}));
app.use(express.json()); //

// Menyajikan file statis dari folder 'public' jika ada, atau root jika tidak.
// Berdasarkan struktur Anda sebelumnya, mungkin tidak ada folder 'public' khusus untuk HTML.
// Jika index.html ada di root, Anda bisa menggunakan:
// app.use(express.static(__dirname));
// Namun, jika file frontend (HTML, CSS, JS klien) ada di folder 'public':
app.use(express.static(path.join(__dirname, 'public'))); //


// API Routes

// Get all notes
app.get('/api/notes', async (req, res) => { //
    if (!notesCollection) {
        return res.status(503).json({ error: 'Koneksi database tidak siap. Silakan coba lagi nanti.' });
    }
    try {
        const notes = await notesCollection.find({})
                                        .sort({ createdAt: -1 }) // Urutkan dari yang terbaru berdasarkan createdAt
                                        .toArray();
        console.log(`Mengirim ${notes.length} catatan ke client (dari MongoDB)`); //
        res.json(notes); //
    } catch (error) {
        console.error('Error getting notes from MongoDB:', error); //
        res.status(500).json({ error: 'Gagal memuat catatan dari database' }); //
    }
});

// Get a single note by MongoDB _id
app.get('/api/notes/:id', async (req, res) => { //
    if (!notesCollection) {
        return res.status(503).json({ error: 'Koneksi database tidak siap.' });
    }
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID catatan tidak valid.' });
        }
        const note = await notesCollection.findOne({ _id: new ObjectId(id) }); //
        
        if (!note) { //
            return res.status(404).json({ error: 'Catatan tidak ditemukan' }); //
        }
        res.json(note); //
    } catch (error) {
        console.error('Error getting single note from MongoDB:', error); //
        res.status(500).json({ error: 'Gagal memuat catatan dari database' }); //
    }
});

// Create a new note
app.post('/api/notes', async (req, res) => { //
    if (!notesCollection) {
        return res.status(503).json({ error: 'Koneksi database tidak siap.' });
    }
    try {
        // Sesuaikan field dengan apa yang dikirim oleh frontend Anda.
        // Berdasarkan server.js lama, fieldnya adalah title, content, timestamp, formattedDate.
        const { title, content, timestamp, formattedDate } = req.body; //
        
        if (!title || !content) { //
            return res.status(400).json({ error: 'Judul dan isi catatan diperlukan' }); //
        }
        
        const newNoteDocument = { //
            customId: uuidv4(), // Jika Anda masih ingin menggunakan UUID untuk referensi frontend
            title, //
            content, //
            timestamp: timestamp ? new Date(timestamp) : new Date(), //
            formattedDate, //
            createdAt: new Date(), //
            updatedAt: new Date()
        };
        
        const result = await notesCollection.insertOne(newNoteDocument);
        // Mengambil dokumen yang baru saja dimasukkan dari database untuk dikirim kembali
        const insertedNote = await notesCollection.findOne({ _id: result.insertedId });

        console.log('Catatan baru dibuat (di MongoDB):', insertedNote.title); //
        res.status(201).json(insertedNote); //
    } catch (error) {
        console.error('Error creating note in MongoDB:', error); //
        res.status(500).json({ error: 'Gagal membuat catatan di database' }); //
    }
});

// Update a note by MongoDB _id
app.put('/api/notes/:id', async (req, res) => { //
    if (!notesCollection) {
        return res.status(503).json({ error: 'Koneksi database tidak siap.' });
    }
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID catatan tidak valid.' });
        }

        const { title, content, timestamp, formattedDate } = req.body; //
        
        if (!title || !content) { //
            return res.status(400).json({ error: 'Judul dan isi catatan diperlukan' }); //
        }

        const updateFields = { //
            title, //
            content, //
            timestamp: timestamp ? new Date(timestamp) : new Date(), //
            formattedDate, //
            updatedAt: new Date() //
        };
        
        const result = await notesCollection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateFields },
            { returnDocument: 'after' } // Mengembalikan dokumen setelah diupdate
        );
                
        if (!result) { // `findOneAndUpdate` akan mengembalikan null jika tidak ada dokumen yang cocok
            return res.status(404).json({ error: 'Catatan tidak ditemukan untuk diperbarui' }); //
        }
        
        console.log('Catatan diperbarui (di MongoDB):', result.title); //
        res.json(result); //
    } catch (error) {
        console.error('Error updating note in MongoDB:', error); //
        res.status(500).json({ error: 'Gagal memperbarui catatan di database' }); //
    }
});

// Delete a note by MongoDB _id
app.delete('/api/notes/:id', async (req, res) => { //
    if (!notesCollection) {
        return res.status(503).json({ error: 'Koneksi database tidak siap.' });
    }
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID catatan tidak valid.' });
        }

        const result = await notesCollection.deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) { //
            return res.status(404).json({ error: 'Catatan tidak ditemukan untuk dihapus' }); //
        }
        
        console.log(`Catatan dengan ID ${id} dihapus (dari MongoDB)`); //
        res.json({ message: 'Catatan berhasil dihapus' }); //
    } catch (error) {
        console.error('Error deleting note from MongoDB:', error); //
        res.status(500).json({ error: 'Gagal menghapus catatan dari database' }); //
    }
});

// Serve index.html untuk root path jika diperlukan
// Ini mungkin sudah ditangani oleh express.static('public') jika index.html ada di public
// Jika index.html ada di root, dan tidak ada folder 'public', baris ini berguna.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Fungsi untuk memulai server setelah koneksi DB (atau jika tidak ada URI)
async function startServer() {
    if (MONGODB_URI && client) { // Hanya coba konek jika URI dan client ada
        await connectDB();
    }

    app.listen(PORT, () => { //
        console.log(`Server berjalan di http://localhost:${PORT}`); //
        if (MONGODB_URI && notesCollection) {
            console.log(`sincerePad API (MongoDB) siap melayani permintaan.`);
        } else {
            console.log(`sincerePad API (notes.json) siap melayani permintaan.`); //
        }
    });
}

startServer();

// Handle penutupan server dengan baik
process.on('SIGINT', async () => {
    console.log('Menerima SIGINT. Menutup server...');
    if (MONGODB_URI && client) {
        try {
            await client.close();
            console.log('Koneksi MongoDB ditutup.');
        } catch (err) {
            console.error('Error saat menutup koneksi MongoDB:', err);
        }
    }
    process.exit(0);
});