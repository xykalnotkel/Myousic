package app.myousic;

import android.app.Activity;
import android.app.ActivityManager;
import android.app.Application;
import android.content.Context;
import android.content.MutableContextWrapper;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** WebView disimpan di Application. Activity cuma nempel — jangan recreate. */
public class MyousicApp extends Application {
    public static final String HOME = "https://myousic.vercel.app/";
    private static MyousicApp instance;
    private WebView web;
    private MutableContextWrapper webCtx;
    private Ready ready;

    public interface Ready {
        void onReady();
    }

    public static MyousicApp get() {
        return instance;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        try {
            WebView.setWebContentsDebuggingEnabled(false);
        } catch (Throwable ignored) {}
    }

    public void setReady(Ready r) {
        ready = r;
    }

    public synchronized WebView attach(Activity a) {
        if (web == null) {
            webCtx = new MutableContextWrapper(a);
            web = new WebView(webCtx);
            setup(web);
            String url = lastUrl();
            web.loadUrl(url);
        } else {
            try {
                webCtx.setBaseContext(a);
            } catch (Throwable ignored) {}
            detach(web);
            try {
                web.onResume();
                web.resumeTimers();
            } catch (Throwable ignored) {}
        }
        return web;
    }

    public synchronized void onActivityGone() {
        if (webCtx != null) {
            try {
                webCtx.setBaseContext(getApplicationContext());
            } catch (Throwable ignored) {}
        }
        if (web != null) {
            detach(web);
            try {
                web.onResume();
                web.resumeTimers();
                web.evaluateJavascript(
                        "(function(){try{var a=document.querySelector('audio');if(a&&a.src)a.play().catch(function(){})}catch(e){}})()",
                        null);
            } catch (Throwable ignored) {}
        }
    }

    public synchronized void reset() {
        if (web != null) {
            try {
                detach(web);
                web.stopLoading();
                web.destroy();
            } catch (Throwable ignored) {}
        }
        web = null;
        webCtx = null;
    }

    private void setup(WebView w) {
        w.setBackgroundColor(Color.parseColor("#050505"));
        WebSettings s = w.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        boolean low = false;
        try {
            ActivityManager am = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
            low = am != null && am.isLowRamDevice();
        } catch (Throwable ignored) {}
        if (Build.VERSION.SDK_INT >= 23) s.setOffscreenPreRaster(!low);
        if (Build.VERSION.SDK_INT >= 26) {
            try {
                w.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);
            } catch (Throwable ignored) {}
        }
        CookieManager cm = CookieManager.getInstance();
        cm.setAcceptCookie(true);
        cm.setAcceptThirdPartyCookies(w, true);
        w.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                return false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (url != null && url.contains("myousic.vercel.app")) {
                    prefs().edit().putString("last_url", url).apply();
                }
                Ready r = ready;
                if (r != null) r.onReady();
            }
        });
        w.setWebChromeClient(new WebChromeClient());
        w.addJavascriptInterface(new NativeBridge(this), "MyousicNative");
    }

    private String lastUrl() {
        String u = prefs().getString("last_url", HOME);
        if (u == null || !u.startsWith(HOME)) return HOME;
        return u;
    }

    private SharedPreferences prefs() {
        return getSharedPreferences(PlayerWidget.PREFS, MODE_PRIVATE);
    }

    public static void detach(WebView w) {
        if (w == null) return;
        if (w.getParent() instanceof ViewGroup) {
            ((ViewGroup) w.getParent()).removeView(w);
        }
    }
}
