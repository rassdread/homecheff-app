package com.homecheff.app;

import android.app.DownloadManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Start het Android-pakketinstallatie-scherm voor een lokale APK (content:// via FileProvider).
 * Geen stille install — alleen {@link Intent#ACTION_VIEW} met user-facing installer.
 */
@CapacitorPlugin(name = "HomecheffApkInstaller")
public class HomecheffApkInstallerPlugin extends Plugin {

    @PluginMethod
    public void openPackageInstaller(PluginCall call) {
        String uriString = call.getString("uri");
        if (uriString == null || uriString.isEmpty()) {
            call.reject("uri_required", "Missing uri", (Exception) null);
            return;
        }
        try {
            Uri uri = Uri.parse(uriString);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            PackageManager pm = getActivity().getPackageManager();
            if (intent.resolveActivity(pm) == null) {
                call.reject("no_install_handler", "No app can handle this APK intent", (Exception) null);
                return;
            }

            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("open_installer_failed", e.getMessage(), e);
        }
    }

    /**
     * Instellingen om “installeren uit onbekende bron” toe te staan (Android 8+).
     * Fallback: algemene beveiligingsinstellingen.
     */
    @PluginMethod
    public void openManageUnknownAppSources(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.reject("unsupported_api", "Requires Android 8+", (Exception) null);
            return;
        }
        try {
            Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
            intent.setData(Uri.parse("package:" + getActivity().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            try {
                Intent fallback = new Intent(Settings.ACTION_SECURITY_SETTINGS);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getActivity().startActivity(fallback);
                call.resolve();
            } catch (Exception e2) {
                call.reject("open_settings_failed", e2.getMessage(), e2);
            }
        }
    }

    /** Systeem-downloadlijst (fabrikanten verschillen; kan falen op sommige toestellen). */
    @PluginMethod
    public void openSystemDownloads(PluginCall call) {
        try {
            Intent i = new Intent(DownloadManager.ACTION_VIEW_DOWNLOADS);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("open_downloads_failed", e.getMessage(), e);
        }
    }
}
