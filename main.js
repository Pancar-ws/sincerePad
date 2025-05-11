// API URL - Ubah sesuai dengan host server
const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const noteForm = document.getElementById('note-form');
    const noteTitle = document.getElementById('note-title');
    const noteContent = document.getElementById('note-content');
    const noteId = document.getElementById('note-id');
    const saveButton = document.getElementById('save-button');
    const currentDateElement = document.getElementById('current-date');
    const historyContent = document.getElementById('history-content');
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const emptyHistory = document.getElementById('empty-history');
    const statusToast = document.getElementById('status-toast');
    const toastMessage = document.getElementById('toast-message');
    
    // Initialize
    updateCurrentDate();
    loadNotes();
    
    // Auto-reload notes every 30 seconds to keep synchronized with other users
    setInterval(loadNotes, 30000);
    
    // Event listeners
    noteForm.addEventListener('submit', function(event) {
        event.preventDefault();
        saveNote();
    });
    
    // Format tanggal dan waktu dalam Bahasa Indonesia
    function formatDateTime(date) {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        
        const day = days[date.getDay()];
        const dateNum = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        
        return `${day}, ${dateNum} ${month} ${year} • ${hour}:${minute}`;
    }
    
    // Update tanggal saat ini
    function updateCurrentDate() {
        const now = new Date();
        currentDateElement.textContent = formatDateTime(now);
    }
    
    // Fungsi untuk menampilkan toast notification
    function showToast(message, isError = false) {
        toastMessage.textContent = message;
        
        if (isError) {
            statusToast.style.backgroundColor = '#CF6679';
        } else {
            statusToast.style.backgroundColor = '#3C3D37';
        }
        
        statusToast.classList.remove('hide');
        statusToast.classList.add('show');
        
        // Sembunyikan toast setelah 3 detik
        setTimeout(() => {
            statusToast.classList.remove('show');
            statusToast.classList.add('hide');
        }, 3000);
    }
    
    // Fungsi untuk menyimpan catatan
    async function saveNote() {
        const title = noteTitle.value.trim();
        const content = noteContent.value.trim();
        const id = noteId.value;
        
        if (!title || !content) {
            showToast('Mohon isi judul dan isi catatan', true);
            return;
        }
        
        // Save button loading state
        const originalButtonText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        saveButton.disabled = true;
        
        try {
            const now = new Date();
            const note = {
                title: title,
                content: content,
                timestamp: now.getTime(),
                formattedDate: formatDateTime(now)
            };
            
            // Jika ada ID, berarti edit note yang sudah ada
            let endpoint = `${API_URL}/notes`;
            let method = 'POST';
            
            if (id) {
                note.id = id;
                endpoint = `${API_URL}/notes/${id}`;
                method = 'PUT';
            }
            
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(note)
            });
            
            if (!response.ok) {
                throw new Error('Gagal menyimpan catatan');
            }
            
            // Reset form untuk catatan baru
            resetForm();
            
            // Reload notes untuk memperbarui history
            loadNotes();
            
            showToast('Catatan berhasil disimpan');
        } catch (error) {
            console.error('Error saving note:', error);
            showToast('Gagal menyimpan catatan: ' + error.message, true);
        } finally {
            // Restore save button state
            saveButton.innerHTML = originalButtonText;
            saveButton.disabled = false;
        }
    }
    
    // Fungsi untuk memuat catatan dari server
    async function loadNotes() {
        // Tampilkan loading state
        loadingState.style.display = 'flex';
        errorState.style.display = 'none';
        emptyHistory.style.display = 'none';
        
        // Hapus semua catatan sebelumnya
        const historyItems = historyContent.querySelectorAll('.history-item');
        historyItems.forEach(item => item.remove());
        
        try {
            const response = await fetch(`${API_URL}/notes`, {
                cache: 'no-store' // Memastikan browser tidak menyimpan cache
            });
            
            if (!response.ok) {
                throw new Error('Gagal memuat catatan');
            }
            
            const notes = await response.json();
            
            // Sembunyikan loading state
            loadingState.style.display = 'none';
            
            if (notes.length === 0) {
                emptyHistory.style.display = 'flex';
                return;
            }
            
            // Render catatan
            renderNotes(notes);
            
            // Log untuk debugging
            console.log(`Memuat ${notes.length} catatan dari server`);
        } catch (error) {
            console.error('Error loading notes:', error);
            loadingState.style.display = 'none';
            errorState.style.display = 'flex';
        }
    }
    
    // Fungsi untuk render notes ke history panel
    function renderNotes(notes) {
        const template = document.getElementById('history-item-template');
        
        // Sort notes dari yang terbaru
        notes.sort((a, b) => b.timestamp - a.timestamp);
        
        notes.forEach(note => {
            // Clone template untuk setiap note
            const item = document.importNode(template.content, true);
            const historyItem = item.querySelector('.history-item');
            
            // Set attribute data-id
            historyItem.dataset.id = note.id;
            
            // Set judul
            const itemTitle = historyItem.querySelector('.item-title');
            itemTitle.textContent = note.title;
            
            // Set preview isi catatan (maksimal 100 karakter)
            const itemPreview = historyItem.querySelector('.item-preview');
            itemPreview.textContent = note.content.length > 100 
                ? note.content.substring(0, 100) + '...' 
                : note.content;
            
            // Set tanggal
            const itemDate = historyItem.querySelector('.item-date');
            itemDate.textContent = note.formattedDate || formatDateTime(new Date(note.timestamp));
            
            // Event untuk tombol edit
            const editBtn = historyItem.querySelector('.edit-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Hindari trigger event parent
                editNote(note);
            });
            
            // Event untuk tombol delete
            const deleteBtn = historyItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Hindari trigger event parent
                deleteNote(note.id);
            });
            
            // Event ketika klik di area historyItem (selain tombol)
            historyItem.addEventListener('click', () => {
                editNote(note);
            });
            
            // Tambahkan ke history content
            historyContent.appendChild(item);
        });
    }
    
    // Fungsi untuk edit note
    function editNote(note) {
        // Set nilai form
        noteId.value = note.id;
        noteTitle.value = note.title;
        noteContent.value = note.content;
        
        // Scroll ke form editor dan fokus ke title
        document.getElementById('paper-section').scrollIntoView({ behavior: 'smooth' });
        noteTitle.focus();
        
        // Tutup panel history jika layar kecil
        if (window.innerWidth <= 600) {
            document.getElementById('toggle-history').checked = false;
        }
    }
    
    // Fungsi untuk hapus note
    async function deleteNote(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/notes/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Gagal menghapus catatan');
            }
            
            // Reset form jika sedang mengedit note yang dihapus
            if (noteId.value === id) {
                resetForm();
            }
            
            // Reload notes untuk memperbarui history
            loadNotes();
            
            showToast('Catatan berhasil dihapus');
        } catch (error) {
            console.error('Error deleting note:', error);
            showToast('Gagal menghapus catatan: ' + error.message, true);
        }
    }
    
    // Fungsi untuk reset form
    function resetForm() {
        noteForm.reset();
        noteId.value = '';
        updateCurrentDate();
    }
});