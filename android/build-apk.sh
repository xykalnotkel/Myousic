#!/usr/bin/env bash
# Build Myousic.apk tanpa Android Studio / Gradle (hemat RAM).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
APP="$ROOT/app/src/main"
OUT="$ROOT/build-out"
SDK="${ANDROID_BUILD_TOOLS:-/tmp/androidsdk/android-13}"
ANDROID_JAR="$SDK/android.jar"
AAPT2="$SDK/aapt2"
D8="$SDK/d8"
ZIPALIGN="$SDK/zipalign"
APKSIGNER="$SDK/apksigner"
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/jdk-11}"
export PATH="$JAVA_HOME/bin:$PATH"

if [[ ! -x "$AAPT2" || ! -f "$ANDROID_JAR" ]]; then
  echo "Android build-tools belum ada di $SDK" >&2
  exit 1
fi

rm -rf "$OUT"
mkdir -p "$OUT/gen" "$OUT/obj" "$OUT/dex"

echo "== compile resources =="
"$AAPT2" compile --dir "$APP/res" -o "$OUT/res.zip"
"$AAPT2" link \
  -o "$OUT/unsigned.apk" \
  -I "$ANDROID_JAR" \
  --manifest "$APP/AndroidManifest.xml" \
  --java "$OUT/gen" \
  --auto-add-overlay \
  --min-sdk-version 24 \
  --target-sdk-version 33 \
  --version-code 2 \
  --version-name 1.1 \
  "$OUT/res.zip"

echo "== javac =="
mapfile -t SRC < <(find "$APP/java" "$OUT/gen" -name '*.java')
javac -encoding UTF-8 -source 8 -target 8 \
  -bootclasspath "$ANDROID_JAR" \
  -classpath "$ANDROID_JAR" \
  -d "$OUT/obj" \
  "${SRC[@]}"

echo "== d8 =="
mapfile -t CLS < <(find "$OUT/obj" -name '*.class')
"$D8" --min-api 24 --lib "$ANDROID_JAR" --output "$OUT/dex" "${CLS[@]}"

echo "== pack dex =="
(
  cd "$OUT/dex"
  zip -q -u "$OUT/unsigned.apk" classes.dex
)

echo "== zipalign =="
"$ZIPALIGN" -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"

KS="$ROOT/debug.keystore"
if [[ ! -f "$KS" ]]; then
  keytool -genkeypair -keystore "$KS" -storepass android -keypass android \
    -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Android Debug,O=Android,C=US"
fi

echo "== sign =="
"$APKSIGNER" sign --ks "$KS" --ks-pass pass:android --key-pass pass:android \
  --ks-key-alias androiddebugkey --out "$ROOT/Myousic.apk" "$OUT/aligned.apk"
"$APKSIGNER" verify --verbose "$ROOT/Myousic.apk"

cp -f "$ROOT/Myousic.apk" /home/user/Myousic.apk
ls -lh "$ROOT/Myousic.apk"
echo "OK: $ROOT/Myousic.apk"
