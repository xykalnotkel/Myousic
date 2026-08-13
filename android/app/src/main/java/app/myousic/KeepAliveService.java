package app.myousic;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

/** Notifikasi + wake lock biar MIUI Go tidak bunuh proses. */
public class KeepAliveService extends Service {
    public static final String CH = "myousic_play";
    public static final int NID = 7;
    private PowerManager.WakeLock wake;

    public static void refresh(Context ctx) {
        try {
            Context app = ctx.getApplicationContext();
            Intent i = new Intent(app, KeepAliveService.class);
            if (Build.VERSION.SDK_INT >= 26) app.startForegroundService(i);
            else app.startService(i);
        } catch (Exception ignored) {}
    }

    @Override
    public void onCreate() {
        super.onCreate();
        try {
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            if (pm != null) {
                wake = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "myousic:play");
                wake.setReferenceCounted(false);
                wake.acquire();
            }
        } catch (Exception ignored) {}
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startFg();
        return START_STICKY;
    }

    private void startFg() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm != null) {
            NotificationChannel ch = new NotificationChannel(
                    CH, "Myousic", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Supaya lagu tidak mati di background");
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        }

        SharedPreferences p = getSharedPreferences(PlayerWidget.PREFS, MODE_PRIVATE);
        String track = p.getString(PlayerWidget.KEY_TRACK, "Myousic sedang berjalan");
        if (track == null || track.trim().isEmpty()) track = "Myousic sedang berjalan";

        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        PendingIntent pi = PendingIntent.getActivity(
                this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) b = new Notification.Builder(this, CH);
        else b = new Notification.Builder(this);
        Notification n = b
                .setContentTitle("Myousic")
                .setContentText(track)
                .setSmallIcon(R.drawable.ic_stat)
                .setContentIntent(pi)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .build();

        try {
            if (Build.VERSION.SDK_INT >= 29) {
                startForeground(NID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            } else {
                startForeground(NID, n);
            }
        } catch (Exception e) {
            try {
                startForeground(NID, n);
            } catch (Exception ignored) {}
        }
    }

    @Override
    public void onDestroy() {
        if (wake != null && wake.isHeld()) {
            try {
                wake.release();
            } catch (Exception ignored) {}
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
