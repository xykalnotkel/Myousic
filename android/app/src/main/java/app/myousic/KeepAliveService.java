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

/** Notifikasi pemutar = pengganti widget di HP Go. */
public class KeepAliveService extends Service {
    public static final String CH = "myousic_play";
    public static final int NID = 7;
    public static final String ACT_TOGGLE = "app.myousic.TOGGLE";
    public static final String ACT_NEXT = "app.myousic.NEXT";
    public static final String ACT_PREV = "app.myousic.PREV";
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
        String act = intent != null ? intent.getAction() : null;
        MyousicApp app = MyousicApp.get();
        if (app != null && ACT_TOGGLE.equals(act)) {
            app.runJs("window.__myousic&&window.__myousic.toggle()");
        } else if (app != null && ACT_NEXT.equals(act)) {
            app.runJs("window.__myousic&&window.__myousic.next()");
        } else if (app != null && ACT_PREV.equals(act)) {
            app.runJs("window.__myousic&&window.__myousic.prev()");
        }
        startFg();
        return START_STICKY;
    }

    private PendingIntent svc(String action, int req) {
        Intent i = new Intent(this, KeepAliveService.class).setAction(action);
        return PendingIntent.getService(
                this, req, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private void startFg() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm != null) {
            NotificationChannel ch = new NotificationChannel(
                    CH, "Pemutar Myousic", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Kontrol lagu — pengganti widget di HP Go");
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        }

        SharedPreferences p = getSharedPreferences(PlayerWidget.PREFS, MODE_PRIVATE);
        String track = p.getString(PlayerWidget.KEY_TRACK, "Myousic");
        if (track == null || track.trim().isEmpty()) track = "Myousic";
        boolean playing = p.getBoolean("playing", false);
        String title = "Myousic";
        String text = track;
        int dash = track.indexOf(" — ");
        if (dash > 0) {
            title = track.substring(0, dash);
            text = track.substring(dash + 3);
        }

        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        PendingIntent pi = PendingIntent.getActivity(
                this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) b = new Notification.Builder(this, CH);
        else b = new Notification.Builder(this);
        b.setContentTitle(title)
                .setContentText(text)
                .setSmallIcon(R.drawable.ic_stat)
                .setContentIntent(pi)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .addAction(R.drawable.ic_prev, "Sebelumnya", svc(ACT_PREV, 11))
                .addAction(
                        playing ? R.drawable.ic_pause : R.drawable.ic_play,
                        playing ? "Jeda" : "Putar",
                        svc(ACT_TOGGLE, 12))
                .addAction(R.drawable.ic_next, "Berikutnya", svc(ACT_NEXT, 13));
        try {
            Notification.MediaStyle style = new Notification.MediaStyle();
            style.setShowActionsInCompactView(0, 1, 2);
            b.setStyle(style);
        } catch (Throwable ignored) {}

        Notification n = b.build();
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
