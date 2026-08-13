package app.myousic;

import android.app.Application;
import android.content.MutableContextWrapper;
import android.graphics.Color;
import android.os.Build;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** WebView hidup di Application — Activity cuma nempel. Audio tetap jalan saat Home. */
public class MyousicApp extends Application {
    public static final String HOME = "https://myousic.vercel.app/";
    private static MyousicApp instance;
    private WebView web;

    public static MyousicApp get() {
        return instance;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
    }

    public synchronized WebView web() {
        if (web == null) {
            // Application context + wrapper: WebView tidak ikut mati sama Activity.
            web = new WebView(new MutableContextWrapper(this));
            web.setBackgroundColor(Color.parseColor("#050505"));
            WebSettings s = web.getSettings();
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
            if (Build.VERSION.SDK_INT >= 23) s.setOffscreenPreRaster(true);
            CookieManager cm = CookieManager.getInstance();
            cm.setAcceptCookie(true);
            cm.setAcceptThirdPartyCookies(web, true);
            web.setWebViewClient(new WebViewClient());
            web.setWebChromeClient(new WebChromeClient());
            web.addJavascriptInterface(new NativeBridge(this), "MyousicNative");
            web.loadUrl(HOME);
        }
        return web;
    }

    public static void detach(WebView w) {
        if (w == null) return;
        if (w.getParent() instanceof ViewGroup) {
            ((ViewGroup) w.getParent()).removeView(w);
        }
    }
}
