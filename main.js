document.addEventListener('DOMContentLoaded', () => {
    const noteInput = document.getElementById('noteInput');
    const saveNoteButton = document.getElementById('saveNoteButton');
    const notesHistory = document.getElementById('notesHistory');

    // Fungsi untuk memuat dan menampilkan histori catatan dari server
    async function loadHistory() {
        try {
            const response = await fetch('/api/notes'); // Panggil API GET /api/notes
            if (!response.ok) {
                // Jika respons tidak OK (misalnya error 404 atau 500)
                throw new Error(`Gagal memuat histori: ${response.status} ${response.statusText}`);
            }
            const notes = await response.json(); // Parse respons JSON menjadi array of notes
            renderHistory(notes); // Tampilkan catatan di halaman
        } catch (error) {
            console.error('Error saat memuat histori:', error);
            notesHistory.innerHTML = '<li>Gagal memuat histori. Coba muat ulang halaman.</li>';
        }
    }

    // Fungsi untuk merender (menampilkan) semua catatan histori di halaman
    function renderHistory(notes) {
        notesHistory.innerHTML = ''; // Kosongkan list histori sebelum menambahkan yang baru

        if (!notes || notes.length === 0) {
            notesHistory.innerHTML = '<li>Belum ada kalimat yang disimpan.</li>';
            return;
        }

        // Loop melalui setiap catatan dan tambahkan ke DOM
        // Catatan sudah diurutkan dari server (terbaru dulu), jadi kita bisa langsung append
        // atau jika ingin memastikan urutan di client (meski redundan jika server sudah urut):
        // notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        notes.forEach(note => {
            addNoteToDOM(note.text, note.timestamp, false); // 'false' berarti tidak di-prepend
        });
    }

    // Fungsi untuk menambahkan satu item catatan ke tampilan histori (DOM)
    // prepend: boolean, jika true, tambahkan ke awal list (untuk catatan baru)
    // jika false, tambahkan ke akhir list (untuk memuat histori awal)
    function addNoteToDOM(text, timestamp, prepend = true) {
        const listItem = document.createElement('li');

        // Format timestamp agar lebih mudah dibaca pengguna
        const formattedTimestamp = new Date(timestamp).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        listItem.textContent = `[${formattedTimestamp}] ${text}`;

        if (prepend) {
            // Tambahkan item baru di awal list (catatan terbaru di atas)
            notesHistory.insertBefore(listItem, notesHistory.firstChild);
        } else {
            // Tambahkan item ke akhir list (saat memuat histori awal)
            notesHistory.appendChild(listItem);
        }
    }

    // Event listener untuk tombol "Simpan Kalimat"
    saveNoteButton.addEventListener('click', async () => {
        const noteText = noteInput.value.trim(); // Ambil teks dari textarea dan hapus spasi

        if (noteText === '') {
            alert('Mohon masukkan kalimat terlebih dahulu.');
            return; // Hentikan jika input kosong
        }

        try {
            // Kirim data ke server menggunakan API POST /api/notes
            const response = await fetch('/api/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Beritahu server bahwa body adalah JSON
                },
                body: JSON.stringify({ text: noteText }), // Ubah objek JavaScript menjadi string JSON
            });

            if (!response.ok) {
                // Jika respons tidak OK, coba baca pesan error dari server
                const errorData = await response.json().catch(() => null); // Tangkap error jika body bukan JSON
                const errorMessage = errorData ? errorData.message : `Gagal menyimpan catatan: ${response.status} ${response.statusText}`;
                throw new Error(errorMessage);
            }

            const newNote = await response.json(); // Parse respons JSON dari server (catatan yang baru disimpan)

            // Jika ini adalah catatan pertama, hapus pesan "Belum ada kalimat yang disimpan."
            if (notesHistory.children.length === 1 && notesHistory.firstChild.textContent === 'Belum ada kalimat yang disimpan.') {
                notesHistory.innerHTML = '';
            }

            addNoteToDOM(newNote.text, newNote.timestamp, true); // Tambahkan catatan baru ke tampilan (di paling atas)
            noteInput.value = ''; // Kosongkan input field setelah berhasil disimpan
            // alert('Kalimat berhasil disimpan!'); // Pemberitahuan (opsional, bisa diganti UI feedback lain)

        } catch (error) {
            console.error('Error saat menyimpan kalimat:', error);
            alert(`Terjadi kesalahan: ${error.message}`);
        }
    });

    // Muat histori catatan saat halaman pertama kali dibuka
    loadHistory();
});