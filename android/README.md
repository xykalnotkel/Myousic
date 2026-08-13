# Myousic untuk Redmi A2 (APK Android)

Redmi A2 (Android Go / MIUI) **sering tidak bisa install PWA** dan **tidak punya widget web**. APK WebView ini membungkus https://myousic.vercel.app jadi aplikasi biasa + widget layar utama.

## Cara build APK (di komputer)

1. Install [Android Studio](https://developer.android.com/studio).
2. **Open** folder `android` di repo ini.
3. Tunggu Gradle sync.
4. Menu **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
5. File APK: `android/app/build/outputs/apk/debug/app-debug.apk`
6. Kirim ke HP (Telegram/USB), buka file, izinkan *Install unknown apps*.

Minimum SDK 24 (Android 7). Redmi A2 (Android 12 Go) didukung.

## Widget

Setelah install: tekan lama layar utama → **Widget** → **Myousic**. Ketuk widget = buka aplikasi.

## Catatan

- Audio tetap dari situs (butuh internet).
- Jangan *Force stop* aplikasi kalau mau tetap bunyi di background.
- MIUI: Settings → Apps → Myousic → Autostart **ON**, Battery saver **No restrictions**.
