package com.homecheff.app;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebView;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

/**
 * Cold start: Android 12+ vereist {@link SplashScreen#installSplashScreen} bij Theme.SplashScreen.
 * Daarna zet BridgeActivity een Capacitor-theme zonder windowBackground → wit window + WebView voorkomt zwarte flash.
 * Resume: hogere renderer-prioriteit vermindert volledige pagina-reset bij korte achtergrond (remote WebView).
 */
public class MainActivity extends BridgeActivity {

    private static final String TAG = "HomeCheffMain";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        applyLightSystemChrome();
        tintWebViewShellWhite();
    }

    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "onResume");
        tintWebViewShellWhite();
    }

    @Override
    public void onPause() {
        Log.d(TAG, "onPause");
        super.onPause();
    }

    private void applyLightSystemChrome() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        getWindow().setBackgroundDrawable(new ColorDrawable(Color.WHITE));
        getWindow().setStatusBarColor(Color.WHITE);
        getWindow().setNavigationBarColor(Color.WHITE);
        WindowInsetsControllerCompat controller =
            new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(true);
        controller.setAppearanceLightNavigationBars(true);
        getWindow().getDecorView().setBackgroundColor(Color.WHITE);
    }

    private void tintWebViewShellWhite() {
        if (getBridge() == null) {
            return;
        }
        WebView webView = getBridge().getWebView();
        if (webView == null) {
            return;
        }
        webView.setBackgroundColor(Color.WHITE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                webView.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);
            } catch (Exception e) {
                Log.w(TAG, "WebView renderer priority not applied", e);
            }
        }
    }
}
