# Undanganku

Undangan pernikahan interaktif, mobile-first, dan sengaja dibuat ringan. Visualnya memakai pendekatan editorial + cinematic motion tanpa framework, WebGL, atau library animasi berat.

## Yang sudah ada

- Opening **Two Paths**: dua titik bisa disentuh/ditarik sampai bertemu.
- Reveal nama + tanggal setelah dua jalur menyatu.
- Story timeline dengan progress line mengikuti scroll.
- Fullscreen story moment dengan parallax ringan.
- Constellation date scene.
- Amplop interaktif yang bisa disentuh / swipe untuk dibuka.
- Detail akad dan resepsi.
- Gallery horizontal native-scroll + scroll snap.
- RSVP interaktif.
- Guestbook berbentuk constellation.
- Easter egg tersembunyi di footer.
- Menu fullscreen dan kontrol musik opsional.
- `prefers-reduced-motion` untuk aksesibilitas.
- Canvas starfield dengan DPR dan jumlah partikel dibatasi agar tetap ringan.

## Struktur

```text
index.html   # konten dan struktur section
styles.css   # seluruh visual + responsive + motion
script.js    # interaksi tanpa dependency
```

Tidak ada proses build. Untuk development cukup buka dengan local server, misalnya:

```bash
npx serve .
```

atau VS Code Live Server.

## Data yang masih demo

Saat ini nama pasangan, tanggal, lokasi, cerita, dan foto masih berupa data demo. Cari `Alief`, `Naya`, `12 · 12 · 2026`, `The Harmony Hall`, dan URL `images.unsplash.com` pada `index.html` untuk menggantinya.

Foto demo menggunakan gambar dari Unsplash. Untuk versi final sebaiknya foto asli dikompresi menjadi AVIF/WebP dan disimpan lokal di `assets/images/`.

## Musik

Elemen audio sengaja tidak memiliki `src` supaya browser tidak mengunduh audio yang belum diperlukan. Setelah punya musik yang legal untuk digunakan, simpan misalnya di:

```text
assets/audio/wedding-theme.mp3
```

lalu ubah bagian audio pada `index.html` menjadi:

```html
<audio id="backgroundMusic" preload="none" loop src="./assets/audio/wedding-theme.mp3"></audio>
```

Musik tidak autoplay. Pengunjung harus menekan tombol Play Music terlebih dahulu.

## RSVP dan Guestbook

Versi awal menyimpan RSVP dan ucapan di `localStorage`, jadi sudah bisa didemokan tanpa backend tetapi belum tersinkron antar perangkat/tamu.

Untuk production, bagian ini sebaiknya dihubungkan ke database/API seperti Supabase, Firebase, atau backend sendiri.

## Prinsip performa

- Motion utama hanya memakai `transform` dan `opacity`.
- Scroll animation dijadwalkan dengan `requestAnimationFrame`.
- Gallery memakai native scrolling, bukan physics library.
- Gambar di bawah fold memakai `loading="lazy"` dan `decoding="async"`.
- Canvas starfield dibatasi sekitar 34–52 titik dan DPR maksimal 1.5.
- Animasi canvas berhenti ketika tab tidak aktif.
- Tidak ada Three.js / Spline / video background.
- Reduced motion didukung.

Targetnya bukan memenangkan lomba "siapa paling banyak efek", tapi memberi kesan mewah sambil tetap nyaman di HP biasa.
