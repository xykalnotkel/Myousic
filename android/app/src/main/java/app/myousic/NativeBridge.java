package app.myousic;

import android.content.Context;
import android.webkit.JavascriptInterface;

public class NativeBridge {
    private final Context app;

    public NativeBridge(Context ctx) {
        this.app = ctx.getApplicationContext();
    }

    @JavascriptInterface
    public void nowPlaying(String title, String artist) {
        PlayerWidget.pushTrack(app, title, artist);
        KeepAliveService.refresh(app);
    }
}
