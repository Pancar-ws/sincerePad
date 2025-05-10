// document.addEventListener('DOMContentLoaded', function() {
//     // Elements
//     const noteTitle = document.getElementById('note-title');
//     const noteContent = document.getElementById('note-content');
//     const saveBtn = document.getElementById('save-btn');
//     const clearBtn = document.getElementById('clear-btn');
//     const charCount = document.getElementById('char-count');
//     const lastSaved = document.getElementById('last-saved');
//     const notesList = document.getElementById('notes-list');
    
//     // Load saved notes
//     loadNotes();
    
//     // Event listeners
//     noteContent.addEventListener('input', updateCharCount);
//     saveBtn.addEventListener('click', saveNote);
//     clearBtn.addEventListener('click', clearNote);
    
//     // Functions
//     function updateCharCount() {
//         const count = noteContent.value.length;
//         charCount.textContent = `${count} karakter`;
//     }
    
//     function saveNote() {
//         const title = noteTitle.value.trim() || 'Catatan Tanpa Judul';
//         const content = noteContent.value.trim();
        
//         if (content === '') {
//             alert('Catatan kosong tidak dapat disimpan');
//             return;
//         }
        
//         const timestamp = new Date();
//         const noteId = 'note_' + Date.now();
        
//         const note = {
//             id: noteId,
//             title: title,
//             content: content,
//             timestamp: timestamp.toISOString()
//         };
        
//         // Get existing notes or initialize empty array
//         let notes = JSON.parse(localStorage.getItem('sincerePadNotes')) || [];
        
//         // Add new note to array
//         notes.unshift(note);
        
//         // Save to localStorage
//         localStorage.setItem('sincerePadNotes', JSON.stringify(notes));
        
//         // Update last saved time
//         const formattedTime = formatTime(timestamp);
//         lastSaved.textContent = `Disimpan: ${formattedTime}`;
        
//         // Refresh notes list
//         loadNotes();
//     }
    
//     function loadNotes() {
//         // Clear current list
//         notesList.innerHTML = '';
        
//         // Get notes from localStorage
//         const notes = JSON.parse(localStorage.getItem('sincerePadNotes')) || [];
        
//         if (notes.length === 0) {
//             notesList.innerHTML = '<p class="empty-note">Belum ada catatan tersimpan</p>';
//             return;
//         }
        
//         // Create note elements
//         notes.forEach(note => {
//             const noteCard = document.createElement('div');
//             noteCard.className = 'note-card';
//             noteCard.dataset.id = note.id;
            
//             const date = new Date(note.timestamp);
//             const formattedTime = formatTime(date);
            
//             // Preview content (first 50 characters)
//             const contentPreview = note.content.length > 50 
//                 ? note.content.substring(0, 50) + '...' 
//                 : note.content;
            
//             noteCard.innerHTML = `
//                 <h4>${note.title}</h4>
//                 <p>${contentPreview}</p>
//                 <span class="note-time">${formattedTime}</span>
//             `;
            
//             // Add click event to load note
//             noteCard.addEventListener('click', () => loadNoteToEditor(note));
            
//             notesList.appendChild(noteCard);
//         });
//     }
    
//     function loadNoteToEditor(note) {
//         noteTitle.value = note.title;
//         noteContent.value = note.content;
//         updateCharCount();
        
//         // Smooth scroll to editor
//         document.querySelector('.paper').scrollIntoView({ 
//             behavior: 'smooth' 
//         });
//     }
    
//     function clearNote() {
//         noteTitle.value = '';
//         noteContent.value = '';
//         updateCharCount();
//         lastSaved.textContent = 'Belum disimpan';
//     }
    
//     function formatTime(date) {
//         const day = date.getDate().toString().padStart(2, '0');
//         const month = (date.getMonth() + 1).toString().padStart(2, '0');
//         const year = date.getFullYear();
//         const hours = date.getHours().toString().padStart(2, '0');
//         const minutes = date.getMinutes().toString().padStart(2, '0');
        
//         return `${day}/${month}/${year} ${hours}:${minutes}`;
//     }
    
//     // Initialize
//     updateCharCount();
// });

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const noteTitle = document.getElementById('note-title');
    const noteContent = document.getElementById('note-content');
    const saveBtn = document.getElementById('save-note');
    const currentDateElement = document.getElementById('current-date');
    const toggleHistoryBtn = document.getElementById('toggle-history');
    const closeHistoryBtn = document.getElementById('close-history');
    const historyPanel = document.getElementById('history-panel');
    const historyContent = document.getElementById('history-content');
    const mainContent = document.querySelector('.main-content');
    
    // Current note ID
    let currentNoteId = null;
    
    // Initialize date display
    updateDateDisplay();
    
    // Load notes from localStorage
    loadNotes();
    
    // Event listeners
    saveBtn.addEventListener('click', saveNote);
    toggleHistoryBtn.addEventListener('click', toggleHistory);
    closeHistoryBtn.addEventListener('click', closeHistory);
    
    // Function to toggle history panel
    function toggleHistory() {
        historyPanel.classList.toggle('active');
        if (historyPanel.classList.contains('active')) {
            mainContent.style.marginLeft = '280px';
        } else {
            mainContent.style.marginLeft = '0';
        }
    }
    
    // Function to close history panel
    function closeHistory() {
        historyPanel.classList.remove('active');
        mainContent.style.marginLeft = '0';
    }
    
    // Function to format date and time
    function formatDateTime(date) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('id-ID', options);
    }
    
    // Function to update current date display
    function updateDateDisplay() {
        const now = new Date();
        currentDateElement.textContent = formatDateTime(now);
    }
    
    // Function to generate unique ID
    function generateId() {
        return Date.now().toString();
    }
    
    // Function to save note
    function saveNote() {
        const title = noteTitle.value.trim();
        const content = noteContent.value.trim();
        
        if (!title || !content) {
            alert('Mohon isi judul dan isi catatan');
            return;
        }
        
        const now = new Date();
        const formattedDate = formatDateTime(now);
        
        const note = {
            id: currentNoteId || generateId(),
            title: title,
            content: content,
            timestamp: now.getTime(),
            formattedDate: formattedDate
        };
        
        // Save to localStorage
        saveNoteToStorage(note);
        
        // Update UI
        updateDateDisplay();
        
        // Reset form if creating new note
        if (!currentNoteId) {
            noteTitle.value = '';
            noteContent.value = '';
            currentNoteId = null;
        }
        
        // Show feedback
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Tersimpan';
        
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
        }, 2000);
        
        // Refresh notes list
        loadNotes();
    }
    
    // Function to save note to localStorage
    function saveNoteToStorage(note) {
        let notes = getNotes();
        
        // Update existing or add new
        const index = notes.findIndex(n => n.id === note.id);
        if (index !== -1) {
            notes[index] = note;
        } else {
            notes.push(note);
        }
        
        // Sort by timestamp (newest first)
        notes.sort((a, b) => b.timestamp - a.timestamp);
        
        // Save to localStorage
        localStorage.setItem('sincerePad_notes', JSON.stringify(notes));
    }
    
    // Function to get notes from localStorage
    function getNotes() {
        const notes = localStorage.getItem('sincerePad_notes');
        return notes ? JSON.parse(notes) : [];
    }
    
    // Function to create history item
    function createHistoryItem(note) {
        const template = document.getElementById('history-item-template');
        const clone = template.content.cloneNode(true);
        
        const historyItem = clone.querySelector('.history-item');
        historyItem.dataset.id = note.id;
        
        const titleElement = clone.querySelector('.item-title');
        titleElement.textContent = note.title;
        
        const previewElement = clone.querySelector('.item-preview');
        // Limit content preview to around 50 characters
        previewElement.textContent = note.content.length > 50 
            ? note.content.substring(0, 50) + '...' 
            : note.content;
        
        const dateElement = clone.querySelector('.item-date');
        dateElement.textContent = note.formattedDate;
        
        // Edit button
        const editBtn = clone.querySelector('.edit-btn');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editNote(note.id);
        });
        
        // Delete button
        const deleteBtn = clone.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteNote(note.id);
        });
        
        // Click on item to edit
        historyItem.addEventListener('click', () => {
            editNote(note.id);
        });
        
        return clone;
    }
    
    // Function to load notes from localStorage
    function loadNotes() {
        const notes = getNotes();
        
        // Clear history content
        while (historyContent.firstChild) {
            historyContent.removeChild(historyContent.firstChild);
        }
        
        if (notes.length === 0) {
            // Show empty state
            const emptyHistory = document.createElement('div');
            emptyHistory.className = 'empty-history';
            
            const emptyText = document.createElement('p');
            emptyText.textContent = 'Belum ada catatan tersimpan';
            
            const emptyIcon = document.createElement('i');
            emptyIcon.className = 'fas fa-book-open';
            
            emptyHistory.appendChild(emptyText);
            emptyHistory.appendChild(emptyIcon);
            
            historyContent.appendChild(emptyHistory);
        } else {
            // Add notes to history
            notes.forEach(note => {
                const historyItem = createHistoryItem(note);
                historyContent.appendChild(historyItem);
            });
        }
    }
    
    // Function to edit note
    function editNote(id) {
        const notes = getNotes();
        const note = notes.find(n => n.id === id);
        
        if (note) {
            noteTitle.value = note.title;
            noteContent.value = note.content;
            currentNoteId = note.id;
            
            // Close history panel on mobile
            if (window.innerWidth <= 600) {
                closeHistory();
            }
            
            // Focus on title
            noteTitle.focus();
            
            // Scroll to top
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }
    
    // Function to delete note
    function deleteNote(id) {
        if (confirm('Yakin ingin menghapus catatan ini?')) {
            let notes = getNotes();
            notes = notes.filter(n => n.id !== id);
            
            // Save to localStorage
            localStorage.setItem('sincerePad_notes', JSON.stringify(notes));
            
            // Clear form if deleting current note
            if (currentNoteId === id) {
                noteTitle.value = '';
                noteContent.value = '';
                currentNoteId = null;
            }
            
            // Refresh notes list
            loadNotes();
        }
    }
    
    // Handle responsive behavior
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 600 && historyPanel.classList.contains('active')) {
            mainContent.style.marginLeft = '0';
        } else if (window.innerWidth > 600 && historyPanel.classList.contains('active')) {
            mainContent.style.marginLeft = '280px';
        }
    });
});