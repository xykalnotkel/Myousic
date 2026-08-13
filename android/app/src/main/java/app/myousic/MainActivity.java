package app.myousic;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.view.Gravity;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

public class MainActivity extends Activity {
    private WebView web;
    private FrameLayout splash;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window w = getWindow();
        w.setStatusBarColor(Color.parseColor("#050505"));
        w.setNavigationBarColor(Color.parseColor("#050505"));

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#050505"));

        try {
            web = MyousicApp.get().attach(this);
        } catch (Throwable t) {
            try {
                MyousicApp.get().reset();
                web = MyousicApp.get().attach(this);
            } catch (Throwable ignored) {}
        }

        if (web != null) {
            root.addView(web, new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT));
        }

        splash = makeSplash();
        root.addView(splash, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        MyousicApp.get().setReady(new MyousicApp.Ready() {
            @Override
            public void onReady() {
                hideSplash();
            }
        });
        root.postDelayed(new Runnable() {
            @Override
            public void run() {
                hideSplash();
            }
        }, 7000);

        setContentView(root);
        startKeepAlive();
        maybeAskBattery();
    }

    private FrameLayout makeSplash() {
        FrameLayout s = new FrameLayout(this);
        s.setBackgroundColor(Color.parseColor("#050505"));
        s.setClickable(true);
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.ic_logo);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(dp(76), dp(76));
        lp.gravity = Gravity.CENTER_HORIZONTAL;
        box.addView(logo, lp);
        TextView name = new TextView(this);
        name.setText("Myousic");
        name.setTextColor(Color.WHITE);
        name.setTextSize(22);
        name.setTypeface(Typeface.DEFAULT_BOLD);
        name.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams np = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        np.topMargin = dp(16);
        np.gravity = Gravity.CENTER_HORIZONTAL;
        box.addView(name, np);
        TextView sub = new TextView(this);
        sub.setText("MUSIC");
        sub.setTextColor(Color.parseColor("#989898"));
        sub.setTextSize(10);
        sub.setLetterSpacing(0.28f);
        sub.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        sp.topMargin = dp(4);
        sp.gravity = Gravity.CENTER_HORIZONTAL;
        box.addView(sub, sp);
        FrameLayout.LayoutParams bp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER);
        s.addView(box, bp);
        return s;
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    private void hideSplash() {
        if (splash == null) return;
        splash.animate().alpha(0f).setDuration(380).withEndAction(new Runnable() {
            @Override
            public void run() {
                if (splash != null && splash.getParent() instanceof ViewGroup) {
                    ((ViewGroup) splash.getParent()).removeView(splash);
                }
                splash = null;
            }
        }).start();
    }

    private void startKeepAlive() {
        Intent i = new Intent(this, KeepAliveService.class);
        try {
            if (Build.VERSION.SDK_INT >= 26) startForegroundService(i);
            else startService(i);
        } catch (Exception ignored) {}
    }

    private void maybeAskBattery() {
        if (Build.VERSION.SDK_INT < 23) return;
        SharedPreferences p = getSharedPreferences(PlayerWidget.PREFS, MODE_PRIVATE);
        if (p.getBoolean("asked_battery", false)) return;
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm != null && pm.isIgnoringBatteryOptimizations(getPackageName())) return;
        p.edit().putBoolean("asked_battery", true).apply();
        try {
            Intent i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            i.setData(Uri.parse("package:" + getPackageName()));
            startActivity(i);
        } catch (Exception ignored) {}
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) {
            try {
                web.onResume();
                web.resumeTimers();
            } catch (Throwable ignored) {}
        }
        startKeepAlive();
    }

    @Override
    protected void onPause() {
        // Jangan web.onPause() — itu yang matiin audio di Go Edition
        super.onPause();
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else moveTaskToBack(true);
    }

    @Override
    protected void onDestroy() {
        MyousicApp.get().setReady(null);
        MyousicApp.get().onActivityGone();
        web = null;
        splash = null;
        super.onDestroy();
    }
}
