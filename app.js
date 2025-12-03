// app.js — versi full dengan fitur jadwal (Updated with EDIT function)
const SUPABASE_URL = "https://jeypuotfapjlgputihgc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleXB1b3RmYXBqbGdwdXRpaGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDc0MDEsImV4cCI6MjA4MDMyMzQwMX0.u_Hf7z01HbFeVlz557vgwPtQk9zbuvlb1zjf-y4znQk";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// REGISTER + AUTO LOGIN
async function registerUser() {
    const email = document.getElementById("reg_email").value.trim();
    const password = document.getElementById("reg_password").value;

    if (!email || !password) {
        document.getElementById("msg").textContent = "Email & password harus diisi!";
        return;
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        document.getElementById("msg").textContent = "Gagal daftar: " + error.message;
    } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (loginError) {
            document.getElementById("msg").textContent = "Daftar sukses, tapi auto-login gagal. Silakan login manual.";
        } else {
            alert("Daftar berhasil & langsung masuk!");
            window.location.href = "index.html"; // Diubah ke index.html jika itu halaman terbaru Anda
        }
    }
}

// LOGIN
async function loginUser() {
    const email = document.getElementById("login_email").value.trim();
    const password = document.getElementById("login_password").value;

    if (!email || !password) {
        alert("Isi email & password dulu ya!");
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        alert("Login gagal: " + error.message);
    } else {
        alert("Login berhasil!");
        window.location.href = "index.html"; // Diubah ke index.html jika itu halaman terbaru Anda
    }
}

// CEK AUTH & LOAD JADWAL (untuk home.html/index.html)
async function initHome() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = "login.html";
        return;
    }

    // Tampilkan email user
    const userEmailElement = document.getElementById("userEmail");
    if (userEmailElement) {
        userEmailElement.textContent = session.user.email;
    }

    // Load jadwal
    await loadJadwal();
}

// TAMBAH JADWAL
async function tambahJadwal() {
    const hari = document.getElementById("hari").value;
    const mata_pelajaran = document.getElementById("mata_pelajaran").value.trim();
    const jam = document.getElementById("jam").value.trim();

    if (!hari || !mata_pelajaran || !jam) {
        alert("Isi semua field dulu ya!");
        return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
        .from('jadwal')
        .insert([{ user_id: user.id, hari, mata_pelajaran, jam }]);

    if (error) {
        alert("Gagal tambah: " + error.message);
    } else {
        alert("Jadwal ditambah!");
        loadJadwal();  // Refresh list
        document.getElementById("hari").value = "";
        document.getElementById("mata_pelajaran").value = "";
        document.getElementById("jam").value = "";
    }
}

// LOAD JADWAL
async function loadJadwal() {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('jadwal')
        .select('*')
        .eq('user_id', user.id)
        .order('hari', { ascending: true });

    if (error) {
        alert("Gagal load: " + error.message);
        // Penting: Kembalikan objek kosong jika gagal agar tidak error di HTML
        return { data: [], error: error };
    }
    
    // Kembalikan data agar bisa diproses oleh fungsi renderTabel di index.html
    return { data, error };
}

// index.html - Ganti seluruh fungsi editJadwal yang lama dengan kode di bawah ini:

// FUNGSI BARU UNTUK EDIT JADWAL DENGAN VALIDASI FLEKSIBEL
async function editJadwal(id) {
    // 1. Ambil data jadwal yang mau diedit
    const { data, error } = await supabase
        .from('jadwal')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error || !data) {
        alert("Gagal mengambil data untuk diedit.");
        return;
    }
    
    const hariKonversi = {
        'monday': 'Senin', 'tuesday': 'Selasa', 'wednesday': 'Rabu',
        'thursday': 'Kamis', 'friday': 'Jumat', 'saturday': 'Sabtu',
        'senin': 'Senin', 'selasa': 'Selasa', 'rabu': 'Rabu',
        'kamis': 'Kamis', 'jumat': 'Jumat', 'sabtu': 'Sabtu'
    };

    let hariBaru;
    let inputHariValid = false;
    
    // 2. Minta input Hari dengan validasi
    do {
        hariBaru = prompt(`Ubah Hari (Saat ini: ${data.hari}). Isi dengan nama Hari (contoh: Senin/Wednesday).`, data.hari);
        if (hariBaru === null) return; // Dibatalkan
        
        hariBaru = hariBaru.trim().toLowerCase();
        
        // Cek apakah input valid (ada di objek konversi)
        if (hariKonversi.hasOwnProperty(hariBaru)) {
            // Jika valid, ambil versi Indonesia (atau format yang Anda inginkan)
            hariBaru = hariKonversi[hariBaru];
            inputHariValid = true;
        } else {
            alert("Input hari tidak valid. Mohon isi dengan nama hari yang benar.");
        }
    } while (!inputHariValid);

    // Minta input Mata Pelajaran
    const mapelBaru = prompt(`Ubah Mata Pelajaran (Saat ini: ${data.mata_pelajaran})`, data.mata_pelajaran);
    if (mapelBaru === null || mapelBaru.trim() === "") return;

    // Minta input Jam
    const jamBaru = prompt(`Ubah Jam (Saat ini: ${data.jam})`, data.jam);
    if (jamBaru === null || jamBaru.trim() === "") return;

    // 3. Panggil fungsi update dari app.js
    await updateJadwal(id, hariBaru, mapelBaru.trim(), jamBaru.trim());
    alert("Perubahan Jadwal disimpan!");
}

// LOGOUT
async function logout() {
    await supabase.auth.signOut();
    window.location.href = "login.html";
}