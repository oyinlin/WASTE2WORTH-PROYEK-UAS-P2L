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