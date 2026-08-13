package app.myousic;

import android.content.Context;
import android.webkit.JavascriptInterface;

public class NativeBridge {
    private final Context app;

    public NativeBridge(Context ctx) {
        this.app = ctx.getApplicationContext();
    }

    @JavascriptInterface
    public void nowPlaying(String title, String artist, String playing) {
        PlayerWidget.pushTrack(app, title, artist);
        boolean on = "1".equals(playing) || "true".equalsIgnoreCase(playing);
        app.getSharedPreferences(PlayerWidget.PREFS, Context.MODE_PRIVATE)
                .edit()
                .putBoolean("playing", on)
                .apply();
        KeepAliveService.refresh(app);
    }
}
