// Berisi    : Fungsi global, kalkulator nilai, handler form pickup dasar
// Belum ada: CRUD tabel riwayat (akan ditambah commit 8 Olin)
// ============================================================ */


/* ============================================================
   INISIALISASI DATA
   Ambil data pesanan dari localStorage, atau buat array kosong
   localStorage menyimpan data secara permanen di browser user
   ============================================================ */
let pickupData = JSON.parse(localStorage.getItem('waste2worth_pickups')) || [];


/* ============================================================
   FUNGSI UTILITY: NOTIFIKASI
   Menampilkan notifikasi kecil di pojok kanan bawah layar
   Parameter:
   - message : teks yang ditampilkan
   - type    : 'success' (hijau) atau 'error' (merah)
   ============================================================ */
function showNotification(message, type = 'success') {
    // Hapus notifikasi lama jika masih ada
    const existingNotif = document.querySelector('.notification');
    if (existingNotif) existingNotif.remove();

    // Buat elemen notifikasi baru
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    // Tambahkan ke body
    document.body.appendChild(notification);

    // Animasi muncul: tambah class 'show' setelah 100ms (perlu delay agar CSS transition jalan)
    setTimeout(() => notification.classList.add('show'), 100);

    // Hapus otomatis setelah 3 detik
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300); // tunggu animasi selesai
    }, 3000);
}


/* ============================================================
   HEADER: efek scroll
   Tambah class 'scrolled' saat pengguna scroll > 50px
   Class 'scrolled' membuat bayangan header lebih tebal (lihat CSS)
   ============================================================ */
window.addEventListener('scroll', function () {
    const header = document.getElementById('header');
    if (header) {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
});


/* ============================================================
   HAMBURGER MENU (Mobile Navigation)
   Klik hamburger → toggle class 'active' pada navMenu
   Class 'active' menggeser menu dari kiri layar (lihat CSS: left: 0)
   ============================================================ */
function initHamburger() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    if (hamburger && navMenu) {
        // Toggle menu saat hamburger diklik
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Tutup menu saat link navigasi diklik
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

/* ============================================================
   MODAL LOGIN / REGISTER
   - openModal(type)     : buka modal dan tampilkan tab yang sesuai
   - closeModal()        : tutup modal
   - switchAuthTab(tab)  : ganti antara tab 'login' dan 'register'
   ============================================================ */
const modal = document.getElementById('authModal');

function openModal(type) {
    if (modal) {
        modal.style.display = 'flex'; // tampilkan modal (flex untuk centering)
        switchAuthTab(type);           // langsung ke tab yang diminta
    }
}

function closeModal() {
    if (modal) {
        modal.style.display = 'none';
    }
}

function switchAuthTab(tab) {
    const tabs = document.querySelectorAll('.tab-auth');
    const forms = document.querySelectorAll('.auth-form');

    // Reset semua tab dan form
    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));

    // Aktifkan tab dan form yang dipilih
    if (tab === 'login') {
        if (tabs[0]) tabs[0].classList.add('active');
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.classList.add('active');
    } else {
        if (tabs[1]) tabs[1].classList.add('active');
        const registerForm = document.getElementById('registerForm');
        if (registerForm) registerForm.classList.add('active');
    }
}

// Tutup modal jika klik di area luar kotak modal (overlay)
window.onclick = function (event) {
    if (event.target === modal) closeModal();
};


/* ============================================================
   ANIMASI COUNTER ANGKA
   Menghitung dari 0 ke angka target secara bertahap
   Dipakai untuk statistik di hero section (15.234 pengguna, 8.567 ton, dll)
   
   Cara kerja:
   - animateCounter(elemen, target) : animasi satu elemen
   - initCounters()                 : setup IntersectionObserver agar
     animasi hanya jalan saat section hero masuk viewport
   ============================================================ */
function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50; // dibagi 50 langkah

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString(); // format angka (titik ribuan)
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 20); // setiap 20ms → total ±1 detik untuk 50 langkah
}

function initCounters() {
    const statsSection = document.querySelector('.hero-stats');
    if (statsSection) {
        // IntersectionObserver: jalankan animasi saat elemen masuk tampilan
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Cari semua elemen dengan data-count dan animasikan
                    const numbers = document.querySelectorAll('.stat-number');
                    numbers.forEach(num => {
                        const target = parseInt(num.getAttribute('data-count'));
                        if (!isNaN(target)) animateCounter(num, target);
                    });
                    observer.unobserve(entry.target); // jalankan hanya sekali
                }
            });
        }, { threshold: 0.5 }); // trigger saat 50% elemen terlihat

        observer.observe(statsSection);
    }
}

/* ============================================================
   KALKULATOR NILAI SAMPAH
   
   Data harga disimpan dalam objek priceData:
   - Key level 1: nama kecamatan (nilai dari select#locationSelect)
   - Key level 2: jenis sampah (nilai dari select#wasteType)
   - Value: harga per kg dalam rupiah
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

/* Nama bank sampah yang direkomendasikan per kecamatan */
const bankNames = {
    'medan-barat':      '🏦 Bank Sampah Medan Barat - Jl. Gajah Mada No.123 (500m dari Anda)',
    'medan-timur':      '🏦 Bank Sampah Medan Timur - Jl. Krakatau No.45 (700m dari Anda)',
    'medan-sunggal':    '🏦 Bank Sampah Medan Sunggal - Jl. Kapten Muslim No.78 (300m dari Anda)',
    'medan-helvetia':   '🏦 Bank Sampah Medan Helvetia - Jl. Cemara No.90 (1km dari Anda)',
    'medan-tembung':    '🏦 Bank Sampah Medan Tembung - Jl. Pancing No.12 (800m dari Anda)',
    'medan-perjuangan': '🏦 Bank Sampah Medan Perjuangan - Jl. Bunga Raya No.34 (600m dari Anda)'
};

/**
 * hitungNilai(): Dipanggil saat tombol "HITUNG NILAI" diklik di layanan.html
 * 
 * Langkah:
 * 1. Ambil nilai location, wasteType, weight dari form
 * 2. Cek priceData[location][wasteType] untuk mendapat harga/kg
 * 3. Hitung total = harga × berat
 * 4. Tampilkan hasil di div#calcResult
 */
function hitungNilai() {
    const locationSelect = document.getElementById('locationSelect');
    const wasteTypeSelect = document.getElementById('wasteType');
    const weightInput = document.getElementById('weight');

    // Guard: pastikan elemen ada (fungsi ini hanya ada di layanan.html)
    if (!locationSelect || !wasteTypeSelect || !weightInput) return;

    const location  = locationSelect.value;
    const wasteType = wasteTypeSelect.value;
    const weight    = parseFloat(weightInput.value);

    // Validasi: berat harus diisi dan > 0
    if (!weight || weight <= 0) {
        alert('⚠️ Masukkan berat sampah terlebih dahulu!');
        return;
    }

    // Ambil harga dari objek priceData
    const price = priceData[location][wasteType];
    const total = price * weight;

    // Isi elemen hasil dengan data yang dihitung
    const resultValue  = document.getElementById('resultValue');
    const pricePerKg   = document.getElementById('pricePerKg');
    const weightDisplay = document.getElementById('weightDisplay');
    const bankSpan     = document.getElementById('bankName');
    const resultDiv    = document.getElementById('calcResult');

    if (resultValue)  resultValue.textContent  = total.toLocaleString('id-ID'); // format Rp
    if (pricePerKg)   pricePerKg.textContent   = price.toLocaleString();
    if (weightDisplay) weightDisplay.textContent = weight;
    if (bankSpan && bankNames[location]) bankSpan.innerHTML = bankNames[location];

    // Tampilkan kotak hasil (dari display:none → display:block)
    if (resultDiv) {
        resultDiv.style.display   = 'block';
        resultDiv.style.animation = 'fadeInUp 0.5s ease'; // animasi muncul
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}


/* ============================================================
   FUNGSI HELPER FORM PICKUP
   ============================================================ */

/**
 * getSelectedJenisSampah(): Ambil semua pilihan dari select multiple
 * Return: array string (misal: ["Botol Plastik PET", "Kardus / Kertas"])
 */
function getSelectedJenisSampah() {
    const select = document.getElementById('pickupJenisSampah');
    if (!select) return [];

    const selected = [];
    for (let option of select.options) {
        if (option.selected) selected.push(option.value);
    }
    return selected;
}

/**
 * validatePickupForm(formData): Validasi data form sebelum disimpan
 * Return: true jika valid, false jika ada error (dan tampilkan notifikasi)
 * 
 * Validasi yang dilakukan:
 * 1. Nama minimal 3 karakter
 * 2. No HP valid 10-13 digit
 * 3. Alamat minimal 10 karakter
 * 4. Berat minimal 5 kg
 * 5. Tanggal tidak boleh hari ini atau sebelumnya
 */
function validatePickupForm(formData) {
    // Validasi nama
    if (formData.nama.length < 3) {
        showNotification('Nama lengkap minimal 3 karakter!', 'error');
        return false;
    }

    // Validasi no HP: strip karakter non-digit, cek 10-13 digit
    const phoneRegex = /^[0-9]{10,13}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
        showNotification('Nomor HP tidak valid!', 'error');
        return false;
    }

    // Validasi alamat
    if (formData.alamat.length < 10) {
        showNotification('Alamat terlalu pendek!', 'error');
        return false;
    }

    // Validasi berat minimal 5kg (penjemputan gratis)
    if (formData.berat < 5) {
        showNotification('Minimal berat sampah 5 kg untuk penjemputan gratis!', 'error');
        return false;
    }

    // Validasi tanggal: harus hari ini atau setelahnya
    const today = new Date().toISOString().split('T')[0]; // format YYYY-MM-DD
    if (formData.tanggal < today) {
        showNotification('Tanggal penjemputan tidak boleh kurang dari hari ini!', 'error');
        return false;
    }

    return true; // semua validasi lulus
}

/**
 * savePickupData(data): Simpan data pesanan ke localStorage
 * Menambahkan id (timestamp), tanggalDibuat, dan status awal 'pending'
 * Return: objek data yang sudah disimpan (dengan id)
 */
function savePickupData(data) {
    const newData = {
        id: Date.now(),   // ID unik berdasarkan waktu (timestamp millisecond)
        ...data,          // spread semua properti dari data form
        tanggalDibuat: new Date().toLocaleDateString('id-ID'), // tanggal submit
        status: 'pending' // status awal selalu 'pending' (menunggu)
    };

    pickupData.push(newData);
    // Simpan array ke localStorage sebagai JSON string
    localStorage.setItem('waste2worth_pickups', JSON.stringify(pickupData));
    return newData;
}

/**
 * handlePickupSubmit(event): Handler submit form penjemputan
 * Dipanggil oleh event listener 'submit' pada form#pickupForm
 * 
 * Alur:
 * 1. Cegah refresh halaman (preventDefault)
 * 2. Kumpulkan semua nilai dari field form
 * 3. Validasi data
 * 4. Simpan ke localStorage
 * 5. Tampilkan notifikasi sukses
 * 6. Reset form
 * 7. Tawarkan redirect ke halaman riwayat
 */
function handlePickupSubmit(event) {
    if (event) event.preventDefault(); // cegah form submit biasa (refresh halaman)

    // Kumpulkan semua data dari form
    const formData = {
        nama:        document.getElementById('pickupNama')?.value        || '',
        phone:       document.getElementById('pickupPhone')?.value       || '',
        alamat:      document.getElementById('pickupAlamat')?.value      || '',
        kecamatan:   document.getElementById('pickupKecamatan')?.value   || '',
        jenisSampah: getSelectedJenisSampah(),                              // array
        berat:       parseFloat(document.getElementById('pickupBerat')?.value) || 0,
        tanggal:     document.getElementById('pickupTanggal')?.value     || '',
        waktu:       document.getElementById('pickupWaktu')?.value       || '',
        catatan:     document.getElementById('pickupCatatan')?.value     || ''
    };

    // Stop jika validasi gagal
    if (!validatePickupForm(formData)) return false;

    // Simpan data ke localStorage
    const savedData = savePickupData(formData);

    // Notifikasi sukses
    showNotification(`Pesanan berhasil dibuat! ID: ${savedData.id}`);

    // Reset semua field form ke kosong
    event.target.reset();

    // Tanya apakah mau lihat riwayat (setelah 1.5 detik biar notifikasi sempat terlihat)
    setTimeout(() => {
        if (confirm('Lihat riwayat penjemputan Anda sekarang?')) {
            window.location.href = 'riwayat.html';
        }
    }, 1500);

    return false;
}