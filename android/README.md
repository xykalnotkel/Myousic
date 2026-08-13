# Myousic untuk Redmi A2 (APK)

WebView yang membungkus https://myousic.vercel.app + widget layar utama.
Dibuat khusus HP Android Go / MIUI (Redmi A2) yang sering gagal pasang PWA.

**APK jadi:** `android/Myousic.apk` (v1.2).

Khusus Redmi A2 / Android Go: aplikasi tidak di-pause saat Home. Kalau tetap mati, Autostart ON + Battery No restrictions.

## Pasang di HP

1. Kirim `Myousic.apk` ke HP (Telegram / USB / Drive).
2. Buka file → izinkan **Install unknown apps** untuk aplikasi pengirim.
3. Buka Myousic. Kalau muncul izin “abaikan hemat baterai” → **Izinkan**. Itu wajib di MIUI biar lagu tidak mati.
4. Settings → Apps → Myousic → **Autostart ON**, Battery saver → **No restrictions**.
5. Widget: tekan lama layar utama → Widget → **Myousic**.

Jangan *Force stop* kalau mau tetap bunyi.

## Build sendiri

Tanpa Android Studio (butuh JDK 11 + Android build-tools 33):

```bash
export ANDROID_BUILD_TOOLS=/path/to/build-tools
./android/build-apk.sh
```

Atau buka folder `android` di Android Studio → Build APK.
