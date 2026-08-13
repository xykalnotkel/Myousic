package app.myousic;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class PlayerWidget extends AppWidgetProvider {
    public static final String PREFS = "myousic";
    public static final String KEY_TRACK = "track";

    public static void pushTrack(Context ctx, String title, String artist) {
        Context app = ctx.getApplicationContext();
        String line = title == null ? "" : title.trim();
        if (artist != null && !artist.trim().isEmpty()) {
            if (!line.isEmpty()) line += " — ";
            line += artist.trim();
        }
        if (line.isEmpty()) line = "Ketuk untuk buka Myousic";
        app.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_TRACK, line)
                .apply();

        AppWidgetManager mgr = AppWidgetManager.getInstance(app);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(app, PlayerWidget.class));
        if (ids != null && ids.length > 0) {
            Intent i = new Intent(app, PlayerWidget.class);
            i.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            i.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
            app.sendBroadcast(i);
        }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] ids) {
        SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String track = p.getString(KEY_TRACK, "Ketuk untuk buka Myousic");
        for (int id : ids) {
            RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget);
            v.setTextViewText(R.id.widget_title, "Myousic");
            v.setTextViewText(R.id.widget_track, track);
            Intent i = new Intent(context, MainActivity.class);
            i.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pi = PendingIntent.getActivity(
                    context, 0, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            v.setOnClickPendingIntent(R.id.widget_root, pi);
            mgr.updateAppWidget(id, v);
        }
    }
}
