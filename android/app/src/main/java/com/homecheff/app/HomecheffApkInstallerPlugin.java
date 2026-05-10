package com.homecheff.app;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
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
            call.reject("uri_required", "Missing uri", null);
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
                call.reject("no_install_handler", "No app can handle this APK intent", null);
                return;
            }

            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("open_installer_failed", e.getMessage(), e);
        }
    }
}
