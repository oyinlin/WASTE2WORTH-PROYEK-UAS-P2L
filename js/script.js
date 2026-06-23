/* ============================================================
   WASTE2WORTH - JAVASCRIPT LENGKAP Upload semua JS CRUD, DOM, Event Handling (Olin)
   
/* ============================================================
   1. INISIALISASI DATA
   Baca data pesanan dari localStorage browser
   Jika belum ada (pertama kali buka), buat array kosong
   Format penyimpanan: JSON string di key 'waste2worth_pickups'
   ============================================================ */
let pickupData = JSON.parse(localStorage.getItem('waste2worth_pickups')) || [];


/* ============================================================
   2. FUNGSI UTILITY: NOTIFIKASI
   Menampilkan popup notifikasi kanan bawah layar
   
   Parameter:
   - message (string): teks notifikasi
   - type (string): 'success' (hijau) atau 'error' (merah)
   
   CSS class yang dipakai: .notification, .notification.success, .notification.error
   Animasi: transform translateX dari 400px → 0 (geser dari kanan)
   ============================================================ */
function showNotification(message, type = 'success') {
    // Hapus notifikasi lama jika masih ada (hindari tumpuk)
    const existingNotif = document.querySelector('.notification');
    if (existingNotif) existingNotif.remove();

    // Buat elemen notifikasi
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // Delay 100ms sebelum tambah class 'show' agar CSS transition berjalan
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto-hapus setelah 3 detik
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300); // tunggu animasi keluar selesai
    }, 3000);
}


/* ============================================================
   3. HEADER SCROLL EFFECT
   Tambah class 'scrolled' saat scroll > 50px
   Class ini membuat bayangan header lebih tebal (via CSS)
   ============================================================ */
window.addEventListener('scroll', function () {
    const header = document.getElementById('header');
    if (header) {
        header.classList.toggle('scrolled', window.scrollY > 50);
    }
});


/* ============================================================
   4. HAMBURGER MENU (Mobile)
   Toggle class 'active' pada hamburger dan navMenu
   .nav-menu.active → left: 0 (menu geser masuk dari kiri)
   ============================================================ */
function initHamburger() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Klik link menu → tutup hamburger menu
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}


/* ============================================================
   5. BACK TO TOP
   Tampilkan tombol saat scroll > 300px
   Klik → smooth scroll ke atas
   ============================================================ */
function initBackToTop() {
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            backToTop.classList.toggle('show', window.scrollY > 300);
        });

        backToTop.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}


/* ============================================================
   6. MODAL LOGIN / REGISTER
   Fungsi buka/tutup modal popup auth
   ============================================================ */
const modal = document.getElementById('authModal');

/** Buka modal dan langsung ke tab yang diminta (login/register) */
function openModal(type) {
    if (modal) {
        modal.style.display = 'flex';
        switchAuthTab(type);
    }
}

/** Tutup modal */
function closeModal() {
    if (modal) modal.style.display = 'none';
}

/**
 * Ganti tab aktif di modal (Masuk ↔ Daftar)
 * Cara kerja: hapus class 'active' dari semua tab+form, lalu tambah ke yang dipilih
 */
function switchAuthTab(tab) {
    const tabs  = document.querySelectorAll('.tab-auth');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));

    if (tab === 'login') {
        tabs[0]?.classList.add('active');
        document.getElementById('loginForm')?.classList.add('active');
    } else {
        tabs[1]?.classList.add('active');
        document.getElementById('registerForm')?.classList.add('active');
    }
}

// Klik area overlay (di luar kotak modal) → tutup modal
window.onclick = function (event) {
    if (event.target === modal) closeModal();
    if (event.target === document.getElementById('editModal')) closeEditModal();
};


/* ============================================================
   7. ANIMASI COUNTER ANGKA
   Menghitung dari 0 ke angka target secara animasi
   Dipakai di hero section (data-count="15234" dll)
   ============================================================ */

/**
 * Animasikan satu elemen counter dari 0 ke target
 * @param {HTMLElement} element - elemen yang ditampilkan
 * @param {number} target - angka akhir yang dituju
 */
function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50; // 50 langkah

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString(); // format ribuan
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 20); // interval 20ms = total ~1 detik
}

/** Setup IntersectionObserver untuk trigger counter saat section hero terlihat */
function initCounters() {
    const statsSection = document.querySelector('.hero-stats');
    if (!statsSection) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.stat-number[data-count]').forEach(num => {
                    const target = parseInt(num.getAttribute('data-count'));
                    if (!isNaN(target)) animateCounter(num, target);
                });
                observer.unobserve(entry.target); // hanya sekali
            }
        });
    }, { threshold: 0.5 });

    observer.observe(statsSection);
}


/* ============================================================
   8. KALKULATOR NILAI SAMPAH (layanan.html)
   
   Data harga (Rp/kg) per kecamatan × jenis sampah
   Key kecamatan: nilai dari select#locationSelect
   Key jenis: nilai dari select#wasteType
   ============================================================ */
const priceData = {
    'medan-barat':      { plastik: 5000,  kardus: 3000,  aluminium: 12000, kaca: 1500,  besi: 3500,  elektronik: 8000  },
    'medan-timur':      { plastik: 4800,  kardus: 2800,  aluminium: 11500, kaca: 1400,  besi: 3300,  elektronik: 7500  },
    'medan-sunggal':    { plastik: 5200,  kardus: 3200,  aluminium: 12500, kaca: 1600,  besi: 3700,  elektronik: 8500  },
    'medan-helvetia':   { plastik: 4900,  kardus: 2900,  aluminium: 11800, kaca: 1450,  besi: 3400,  elektronik: 7800  },
    'medan-tembung':    { plastik: 4700,  kardus: 2700,  aluminium: 11000, kaca: 1350,  besi: 3200,  elektronik: 7200  },
    'medan-perjuangan': { plastik: 5100,  kardus: 3100,  aluminium: 12200, kaca: 1550,  besi: 3600,  elektronik: 8200  },
    'medan-area':       { plastik: 4850,  kardus: 2850,  aluminium: 11600, kaca: 1420,  besi: 3350,  elektronik: 7600  },
    'medan-kota':       { plastik: 5050,  kardus: 3050,  aluminium: 12100, kaca: 1520,  besi: 3550,  elektronik: 8100  },
    'medan-marelan':    { plastik: 4600,  kardus: 2600,  aluminium: 10800, kaca: 1300,  besi: 3100,  elektronik: 7000  },
    'medan-labuhan':    { plastik: 4550,  kardus: 2550,  aluminium: 10500, kaca: 1250,  besi: 3000,  elektronik: 6800  }
};

/** Rekomendasi bank sampah berdasarkan lokasi */
const bankNames = {
    'medan-barat':      '🏦 Bank Sampah Medan Barat - Jl. Gajah Mada No.123 (500m dari Anda)',
    'medan-timur':      '🏦 Bank Sampah Medan Timur - Jl. Krakatau No.45 (700m dari Anda)',
    'medan-sunggal':    '🏦 Bank Sampah Medan Sunggal - Jl. Kapten Muslim No.78 (300m dari Anda)',
    'medan-helvetia':   '🏦 Bank Sampah Medan Helvetia - Jl. Cemara No.90 (1km dari Anda)',
    'medan-tembung':    '🏦 Bank Sampah Medan Tembung - Jl. Pancing No.12 (800m dari Anda)',
    'medan-perjuangan': '🏦 Bank Sampah Medan Perjuangan - Jl. Bunga Raya No.34 (600m dari Anda)'
};

/**
 * hitungNilai(): Dipanggil saat tombol "HITUNG NILAI" diklik
 * Rumus: total = priceData[lokasi][jenis] × berat
 * Hasil ditampilkan di div#calcResult
 */
function hitungNilai() {
    const location  = document.getElementById('locationSelect')?.value;
    const wasteType = document.getElementById('wasteType')?.value;
    const weight    = parseFloat(document.getElementById('weight')?.value);

    if (!location || !wasteType) return;

    if (!weight || weight <= 0) {
        alert('⚠️ Masukkan berat sampah terlebih dahulu!');
        return;
    }

    const price = priceData[location]?.[wasteType];
    if (!price) return;

    const total = price * weight;

    // Tampilkan hasil ke DOM
    const resultDiv   = document.getElementById('calcResult');
    const resultValue = document.getElementById('resultValue');
    const pricePerKg    = document.getElementById('pricePerKg');
    const weightDisplay = document.getElementById('weightDisplay');
    const bankSpan      = document.getElementById('bankName');

    if (resultValue)   resultValue.textContent   = total.toLocaleString('id-ID');
    if (pricePerKg)    pricePerKg.textContent    = price.toLocaleString();
    if (weightDisplay) weightDisplay.textContent = weight;
    if (bankSpan && bankNames[location]) bankSpan.innerHTML = bankNames[location];

    // Tampilkan kotak hasil (dari display:none → display:block)
    if (resultDiv) {
        resultDiv.style.display   = 'block';
        resultDiv.style.animation = 'fadeInUp 0.5s ease';
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}


/* ============================================================
   9. FORM PICKUP (layanan.html)
   Mengumpulkan data form, memvalidasi, dan menyimpan ke localStorage
   ============================================================ */

/**
 * Ambil semua pilihan yang dipilih dari select multiple
 * Return: array nilai yang dipilih (misal: ["Botol Plastik PET", "Kardus / Kertas"])
 */
function getSelectedJenisSampah() {
    const select = document.getElementById('pickupJenisSampah');
    if (!select) return [];
    return Array.from(select.options).filter(o => o.selected).map(o => o.value);
}

/**
 * Validasi data form sebelum disimpan
 * Return: true jika valid, false jika ada error
 */
function validatePickupForm(formData) {
    if (formData.nama.length < 3) {
        showNotification('Nama lengkap minimal 3 karakter!', 'error');
        return false;
    }

    const phoneRegex = /^[0-9]{10,13}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
        showNotification('Nomor HP tidak valid! (10-13 digit)', 'error');
        return false;
    }

    if (formData.alamat.length < 10) {
        showNotification('Alamat terlalu pendek! Minimal 10 karakter.', 'error');
        return false;
    }

    if (formData.berat < 5) {
        showNotification('Minimal berat sampah 5 kg untuk penjemputan gratis!', 'error');
        return false;
    }

    // Validasi tanggal: harus hari ini atau setelahnya
    const today = new Date().toISOString().split('T')[0];
    if (formData.tanggal < today) {
        showNotification('Tanggal penjemputan tidak boleh kurang dari hari ini!', 'error');
        return false;
    }

    return true;
}

/**
 * Simpan data pesanan baru ke localStorage
 * Menambahkan: id (timestamp), tanggalDibuat, status awal 'pending'
 */
function savePickupData(data) {
    const newData = {
        id: Date.now(),   // ID unik berdasarkan timestamp millisecond
        ...data,
        tanggalDibuat: new Date().toLocaleDateString('id-ID'),
        status: 'pending'
    };

    pickupData.push(newData);
    localStorage.setItem('waste2worth_pickups', JSON.stringify(pickupData));
    return newData;
}

/**
 * Handler submit form penjemputan
 * Dipasang sebagai event listener pada pickupForm di DOMContentLoaded
 */
function handlePickupSubmit(event) {
    event.preventDefault();

    const formData = {
        nama:        document.getElementById('pickupNama')?.value        || '',
        phone:       document.getElementById('pickupPhone')?.value       || '',
        alamat:      document.getElementById('pickupAlamat')?.value      || '',
        kecamatan:   document.getElementById('pickupKecamatan')?.value   || '',
        jenisSampah: getSelectedJenisSampah(),
        berat:       parseFloat(document.getElementById('pickupBerat')?.value)   || 0,
        tanggal:     document.getElementById('pickupTanggal')?.value     || '',
        waktu:       document.getElementById('pickupWaktu')?.value       || '',
        catatan:     document.getElementById('pickupCatatan')?.value     || ''
    };

    if (!validatePickupForm(formData)) return;

    const savedData = savePickupData(formData);
    showNotification(`✅ Pesanan berhasil dibuat! ID: ${savedData.id}`);
    event.target.reset(); // kosongkan form

    // Setelah 1.5 detik, tawarkan redirect ke riwayat
    setTimeout(() => {
        if (confirm('Lihat riwayat penjemputan Anda sekarang?')) {
            window.location.href = 'riwayat.html';
        }
    }, 1500);
}


/* ============================================================
   10. TABEL RIWAYAT (riwayat.html)
   Fungsi untuk menampilkan, memfilter, dan memperbarui data tabel
   ============================================================ */

/**
 * Ubah format tanggal dari YYYY-MM-DD ke DD/MM/YYYY
 * Contoh: "2026-03-15" → "15/03/2026"
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Buat HTML badge status berwarna
 * pending → oranye, proses → biru, selesai → hijau
 */
function getStatusBadge(status) {
    const statusMap = {
        'pending': '<span class="status-badge status-pending"><i class="fas fa-clock"></i> Menunggu</span>',
        'proses':  '<span class="status-badge status-proses"><i class="fas fa-spinner"></i> Diproses</span>',
        'selesai': '<span class="status-badge status-selesai"><i class="fas fa-check"></i> Selesai</span>'
    };
    return statusMap[status] || statusMap.pending;
}

/**
 * Update angka statistik di 3 kartu atas halaman riwayat
 * Dipanggil setiap kali data berubah (tampil, edit, hapus)
 */
function updateStatistics() {
    // Total pengiriman: jumlah semua pesanan
    const elTotal = document.getElementById('totalPengiriman');
    if (elTotal) elTotal.textContent = pickupData.length;

    // Total berat: sum semua item.berat
    const elBerat = document.getElementById('totalBerat');
    if (elBerat) {
        const totalBerat = pickupData.reduce((sum, item) => sum + (item.berat || 0), 0);
        elBerat.textContent = totalBerat.toLocaleString();
    }

    // Estimasi pendapatan: sum(berat × 5000)
    const elEstimasi = document.getElementById('totalEstimasi');
    if (elEstimasi) {
        const totalEstimasi = pickupData.reduce((sum, item) => sum + ((item.berat || 0) * 5000), 0);
        elEstimasi.textContent = `Rp ${totalEstimasi.toLocaleString('id-ID')}`;
    }
}

/**
 * Tampilkan data ke tabel (dengan filter pencarian dan status)
 * Dipanggil:
 * - Pertama kali saat halaman riwayat dimuat
 * - Setiap kali user mengetik di searchInput
 * - Setiap kali user memilih statusFilter
 * - Setiap kali data berubah (edit/hapus)
 */
function displayPickupData() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return; // hanya jalan di riwayat.html

    // Refresh data dari localStorage (pastikan terbaru)
    pickupData = JSON.parse(localStorage.getItem('waste2worth_pickups')) || [];

    // Ambil nilai filter
    const searchTerm   = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';

    // Filter data berdasarkan pencarian dan status
    let filteredData = pickupData;

    if (searchTerm) {
        filteredData = filteredData.filter(item =>
            item.nama.toLowerCase().includes(searchTerm) ||
            item.id.toString().includes(searchTerm)
        );
    }

    if (statusFilter) {
        filteredData = filteredData.filter(item => item.status === statusFilter);
    }

    // Tampilkan empty state jika tidak ada data
    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <i class="fas fa-recycle"></i>
                        <h3>${pickupData.length === 0 ? 'Belum ada data penjemputan' : 'Tidak ada hasil yang cocok'}</h3>
                        <p>${pickupData.length === 0 ? 'Silakan buat pesanan penjemputan di halaman Layanan' : 'Coba ubah kata kunci atau filter status'}</p>
                        ${pickupData.length === 0 ? `<a href="layanan.html" class="btn btn-primary" style="margin-top:15px;"><i class="fas fa-plus"></i> Buat Pesanan</a>` : ''}
                    </div>
                </td>
            </tr>
        `;
        updateStatistics(); // tetap update statistik (akan jadi 0)
        return;
    }

    // Buat baris HTML untuk setiap item
    tbody.innerHTML = filteredData.map(item => `
        <tr data-id="${item.id}">
            <td><small style="color:var(--text-light)">#${item.id.toString().slice(-6)}</small></td>
            <td>${formatDate(item.tanggal)}</td>
            <td>${item.nama}</td>
            <td>${item.kecamatan}</td>
            <td>${Array.isArray(item.jenisSampah) ? item.jenisSampah.join(', ') : item.jenisSampah}</td>
            <td>${item.berat} kg</td>
            <td>${getStatusBadge(item.status)}</td>
            <td>
                <!-- Tombol edit: buka modal edit dengan data terisi -->
                <button class="action-btn edit" onclick="editPickup(${item.id})" title="Edit pesanan">
                    <i class="fas fa-edit"></i>
                </button>
                <!-- Tombol hapus: konfirmasi lalu hapus dari localStorage -->
                <button class="action-btn delete" onclick="deletePickup(${item.id})" title="Hapus pesanan">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    // Perbarui statistik setelah data tampil
    updateStatistics();
}


/* ============================================================
   11. CRUD: EDIT PESANAN
   ============================================================ */

/** ID pesanan yang sedang dalam mode edit (null jika tidak ada) */
let editingId = null;

/**
 * editPickup(id): Buka modal edit dan isi dengan data pesanan yang dipilih
 * Dipanggil oleh tombol ✏️ pada setiap baris tabel
 */
function editPickup(id) {
    const item = pickupData.find(i => i.id === id);
    if (!item) {
        showNotification('Data tidak ditemukan!', 'error');
        return;
    }

    editingId = id; // simpan ID yang sedang diedit

    // Isi semua field modal edit dengan data lama
    const setVal = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val || ''; };
    setVal('editNama',    item.nama);
    setVal('editPhone',   item.phone);
    setVal('editAlamat',  item.alamat);
    setVal('editBerat',   item.berat);
    setVal('editTanggal', item.tanggal);
    setVal('editWaktu',   item.waktu);
    setVal('editCatatan', item.catatan);

    // Set kecamatan: cocokkan teks pilihan
    const editKecamatan = document.getElementById('editKecamatan');
    if (editKecamatan && item.kecamatan) {
        Array.from(editKecamatan.options).forEach((opt, i) => {
            if (opt.text === item.kecamatan) editKecamatan.selectedIndex = i;
        });
    }

    // Set jenis sampah (multiple select): reset dulu, lalu pilih yang sesuai
    const editJenisSampah = document.getElementById('editJenisSampah');
    if (editJenisSampah && item.jenisSampah) {
        Array.from(editJenisSampah.options).forEach(opt => {
            opt.selected = item.jenisSampah.includes(opt.value) || item.jenisSampah.includes(opt.text);
        });
    }

    // Set status pesanan
    const editStatus = document.getElementById('editStatus');
    if (editStatus && item.status) {
        Array.from(editStatus.options).forEach((opt, i) => {
            if (opt.value === item.status) editStatus.selectedIndex = i;
        });
    }

    // Tampilkan modal edit
    const editModal = document.getElementById('editModal');
    if (editModal) editModal.style.display = 'flex';
}

/**
 * Ambil pilihan dari select multiple di modal edit
 * Return: array teks pilihan yang dipilih
 */
function getSelectedEditJenisSampah() {
    const select = document.getElementById('editJenisSampah');
    if (!select) return [];
    return Array.from(select.options).filter(o => o.selected).map(o => o.value || o.text);
}

/**
 * saveEditPickup(): Simpan perubahan dari modal edit ke localStorage
 * Dipanggil oleh tombol "Simpan Perubahan" di modal edit
 */
function saveEditPickup() {
    if (!editingId) return;

    // Kumpulkan data baru dari form edit
    const updatedData = {
        nama:        document.getElementById('editNama')?.value    || '',
        phone:       document.getElementById('editPhone')?.value   || '',
        alamat:      document.getElementById('editAlamat')?.value  || '',
        kecamatan:   document.getElementById('editKecamatan')?.value || '',
        jenisSampah: getSelectedEditJenisSampah(),
        berat:       parseFloat(document.getElementById('editBerat')?.value) || 0,
        tanggal:     document.getElementById('editTanggal')?.value || '',
        waktu:       document.getElementById('editWaktu')?.value   || '',
        catatan:     document.getElementById('editCatatan')?.value || '',
        status:      document.getElementById('editStatus')?.value  || 'pending'
    };

    // Validasi dasar
    if (updatedData.nama.length < 3) {
        showNotification('Nama minimal 3 karakter!', 'error'); return;
    }
    const phoneRegex = /^[0-9]{10,13}$/;
    if (!phoneRegex.test(updatedData.phone.replace(/\D/g, ''))) {
        showNotification('Nomor HP tidak valid!', 'error'); return;
    }
    if (updatedData.alamat.length < 10) {
        showNotification('Alamat terlalu pendek!', 'error'); return;
    }
    if (updatedData.berat < 1) {
        showNotification('Berat sampah minimal 1 kg!', 'error'); return;
    }

    // Cari index data yang diedit dan update
    const index = pickupData.findIndex(i => i.id === editingId);
    if (index !== -1) {
        // Pertahankan id dan tanggalDibuat asli
        updatedData.id           = pickupData[index].id;
        updatedData.tanggalDibuat = pickupData[index].tanggalDibuat;

        pickupData[index] = updatedData;
        localStorage.setItem('waste2worth_pickups', JSON.stringify(pickupData));

        displayPickupData(); // refresh tabel
        closeEditModal();
        showNotification(`✅ Pesanan ID #${editingId.toString().slice(-6)} berhasil diupdate!`);
    }

    editingId = null;
}

/** Tutup modal edit tanpa menyimpan */
function closeEditModal() {
    const editModal = document.getElementById('editModal');
    if (editModal) editModal.style.display = 'none';
    editingId = null;
}


/* ============================================================
   12. CRUD: HAPUS PESANAN
   Konfirmasi → hapus dari array → simpan ke localStorage → refresh tabel
   ============================================================ */
function deletePickup(id) {
    if (confirm('Apakah Anda yakin ingin menghapus pesanan ini?')) {
        pickupData = pickupData.filter(item => item.id !== id);
        localStorage.setItem('waste2worth_pickups', JSON.stringify(pickupData));
        displayPickupData(); // refresh tabel
        showNotification(`🗑️ Pesanan berhasil dihapus!`);
    }
}


/* ============================================================
   13. FAQ ACCORDION (layanan.html)
   Buka/tutup jawaban FAQ dengan animasi max-height
   Dipanggil via onclick="toggleFaq(this)" di HTML
   ============================================================ */
function toggleFaq(element) {
    const faqItem = element.parentElement;
    const answer  = faqItem.querySelector('.faq-answer');
    const icon    = element.querySelector('i');

    faqItem.classList.toggle('active');

    if (faqItem.classList.contains('active')) {
        answer.style.maxHeight = answer.scrollHeight + 'px'; // buka (animasi CSS)
        if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
        answer.style.maxHeight = '0'; // tutup
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
}


/* ============================================================
   14. VIDEO EDUKASI (edukasi.html)
   ============================================================ */

/** Buka video modal dan mulai putar video */
function playVideo(videoSrc) {
    const videoModal  = document.getElementById('videoModal');
    const videoPlayer = document.getElementById('videoPlayer');
    if (videoModal && videoPlayer) {
        videoPlayer.src = videoSrc;
        videoModal.classList.add('active');
        videoPlayer.play();
    }
}

/** Tutup video modal dan pause video */
function closeVideoModal() {
    const videoModal  = document.getElementById('videoModal');
    const videoPlayer = document.getElementById('videoPlayer');
    if (videoModal && videoPlayer) {
        videoPlayer.pause();
        videoPlayer.src = '';
        videoModal.classList.remove('active');
    }
}

/**
 * Picture-in-Picture (PiP): video mengapung di atas halaman lain
 * Browser perlu mendukung PiP API (Chrome, Edge, Safari)
 */
function togglePip(videoId) {
    const video = document.getElementById(videoId);
    if (!video) return;

    if (document.pictureInPictureElement) {
        document.exitPictureInPicture(); // keluar dari PiP jika sudah aktif
    } else if (document.pictureInPictureEnabled) {
        video.requestPictureInPicture();
    }
}

/**
 * Fullscreen: tampilkan video fullscreen
 * Mendukung prefix webkit (Safari) dan ms (IE/Edge lama)
 */
function toggleFullscreen(videoId) {
    const video = document.getElementById(videoId);
    if (!video) return;

    if (!document.fullscreenElement) {
        // Masuk fullscreen (coba semua prefix)
        (video.requestFullscreen || video.webkitRequestFullscreen || video.msRequestFullscreen).call(video);
    } else {
        // Keluar fullscreen
        (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document);
    }
}


/* ============================================================
   15. INISIALISASI: DOMContentLoaded
   Dipanggil satu kali saat semua HTML selesai dimuat
   Memasang semua event listener dan menjalankan inisialisasi
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {

    /* ---- Inisialisasi AOS (Animate On Scroll) ---- */
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, once: true, offset: 50 });
    }

    /* ---- Inisialisasi komponen UI ---- */
    initHamburger();
    initBackToTop();
    initCounters();

    /* ---- Handler form login (di semua halaman) ---- */
    document.getElementById('loginForm')?.addEventListener('submit', function (e) {
        e.preventDefault();
        showNotification('Login berhasil! Selamat datang.', 'success');
        closeModal();
    });

    /* ---- Handler form register (di semua halaman) ---- */
    document.getElementById('registerForm')?.addEventListener('submit', function (e) {
        e.preventDefault();
        showNotification('Akun berhasil dibuat! Silakan masuk.', 'success');
        closeModal();
    });

    /* ---- Handler form penjemputan (hanya di layanan.html) ---- */
    document.getElementById('pickupForm')?.addEventListener('submit', handlePickupSubmit);

    /* ---- Inisialisasi tabel + filter (hanya di riwayat.html) ---- */
    if (document.getElementById('tableBody')) {
        displayPickupData(); // isi tabel saat pertama dimuat

        // Filter real-time saat mengetik di kotak pencarian
        document.getElementById('searchInput')?.addEventListener('input', displayPickupData);

        // Filter saat dropdown status berubah
        document.getElementById('statusFilter')?.addEventListener('change', displayPickupData);
    }

    /* ---- Handler tutup video modal (edukasi.html) ---- */
    document.getElementById('closeVideoModal')?.addEventListener('click', closeVideoModal);

    /* ---- Tutup video modal dengan tombol ESC ---- */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeVideoModal();
            closeEditModal();
        }
    });
});


/* ============================================================
   16. EKSPOR FUNGSI KE GLOBAL SCOPE
   Fungsi yang dipanggil via onclick="" di HTML harus ada di global scope
   Tanpa ini, fungsi dalam DOMContentLoaded/module tidak bisa diakses
   ============================================================ */
window.hitungNilai     = hitungNilai;
window.openModal       = openModal;
window.closeModal      = closeModal;
window.switchAuthTab   = switchAuthTab;
window.toggleFaq       = toggleFaq;
window.editPickup      = editPickup;
window.saveEditPickup  = saveEditPickup;
window.closeEditModal  = closeEditModal;
window.deletePickup    = deletePickup;
window.playVideo       = playVideo;
window.closeVideoModal = closeVideoModal;
window.toggleFullscreen = toggleFullscreen;
window.togglePip       = togglePip;
