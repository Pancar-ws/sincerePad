// server.js - Backend untuk sincerePad
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Data file
const DATA_FILE = path.join(__dirname, 'notes.json');

// Middleware
app.use(cors({
    origin: '*', // Mengizinkan akses dari semua origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(express.static('public'));

// Ensure the notes.json file exists
function ensureDataFileExists() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([]));
    }
}

// Read notes from file
function readNotes() {
    ensureDataFileExists();
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// Write notes to file
function writeNotes(notes) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2));
}

// API Routes

// Get all notes
app.get('/api/notes', (req, res) => {
    try {
        const notes = readNotes();
        
        // Log untuk debugging
        console.log(`Mengirim ${notes.length} catatan ke client`);
        
        res.json(notes);
    } catch (error) {
        console.error('Error getting notes:', error);
        res.status(500).json({ error: 'Gagal memuat catatan' });
    }
});

// Get a single note
app.get('/api/notes/:id', (req, res) => {
    try {
        const notes = readNotes();
        const note = notes.find(note => note.id === req.params.id);
        
        if (!note) {
            return res.status(404).json({ error: 'Catatan tidak ditemukan' });
        }
        
        res.json(note);
    } catch (error) {
        console.error('Error getting note:', error);
        res.status(500).json({ error: 'Gagal memuat catatan' });
    }
});

// Create a new note
app.post('/api/notes', (req, res) => {
    try {
        const { title, content, timestamp, formattedDate } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: 'Judul dan isi catatan diperlukan' });
        }
        
        const notes = readNotes();
        
        const newNote = {
            id: uuidv4(),
            title,
            content,
            timestamp,
            formattedDate,
            createdAt: new Date().toISOString()
        };
        
        console.log('Catatan baru dibuat:', newNote.title);
        
        notes.push(newNote);
        writeNotes(notes);
        
        res.status(201).json(newNote);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ error: 'Gagal membuat catatan' });
    }
});

// Update a note
app.put('/api/notes/:id', (req, res) => {
    try {
        const { title, content, timestamp, formattedDate } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: 'Judul dan isi catatan diperlukan' });
        }
        
        let notes = readNotes();
        const index = notes.findIndex(note => note.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Catatan tidak ditemukan' });
        }
        
        // Update the note
        notes[index] = {
            ...notes[index],
            title,
            content,
            timestamp,
            formattedDate,
            updatedAt: new Date().toISOString()
        };
        
        console.log('Catatan diperbarui:', notes[index].title);
        
        writeNotes(notes);
        
        res.json(notes[index]);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ error: 'Gagal memperbarui catatan' });
    }
});

// Delete a note
app.delete('/api/notes/:id', (req, res) => {
    try {
        let notes = readNotes();
        const noteToDelete = notes.find(note => note.id === req.params.id);
        
        if (!noteToDelete) {
            return res.status(404).json({ error: 'Catatan tidak ditemukan' });
        }
        
        console.log('Catatan dihapus:', noteToDelete.title);
        
        const filteredNotes = notes.filter(note => note.id !== req.params.id);
        writeNotes(filteredNotes);
        
        res.json({ message: 'Catatan berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ error: 'Gagal menghapus catatan' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log(`sincerePad API siap melayani permintaan dari semua pengguna`);
});