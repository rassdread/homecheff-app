package com.homecheff.app;

import android.app.DownloadManager;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

/**
 * Start het Android-pakketinstallatie-scherm voor een lokale APK (content:// via FileProvider).
 * Geen stille install — alleen {@link Intent#ACTION_VIEW} met user-facing installer.
 *
 * <p>Gebruik {@code cacheRelativePath} (t.o.v. {@link android.content.Context#getCacheDir()}) zodat
 * {@link FileProvider#getUriForFile} altijd dezelfde authority gebruikt als in het manifest
 * ({@link BuildConfig#APPLICATION_ID}.fileprovider). Capacitor {@code Filesystem.getUri} kan een
 * {@code file://} of andere {@code content://} leveren die sommige toestellen weigeren.
 */
@CapacitorPlugin(name = "HomecheffApkInstaller")
public class HomecheffApkInstallerPlugin extends Plugin {

    private static final String TAG = "apk-installer";

    private static void logLine(String stage, String detail) {
        Log.i(TAG, "[" + stage + "] " + detail);
    }

    @PluginMethod
    public void openPackageInstaller(PluginCall call) {
        String cacheRelativePath = call.getString("cacheRelativePath");
        String uriString = call.getString("uri");

        String authorityExpected = BuildConfig.APPLICATION_ID + ".fileprovider";
        logLine("authority_expected", authorityExpected);

        if (getActivity() == null) {
            logLine("fail", "activity_null");
            call.reject("no_activity", "Activity is null", (Exception) null);
            return;
        }

        File apkFile = null;
        Uri contentUri = null;

        try {
            if (cacheRelativePath != null && !cacheRelativePath.isEmpty()) {
                apkFile = new File(getContext().getCacheDir(), cacheRelativePath);
                String abs = apkFile.getAbsolutePath();
                boolean exists = apkFile.exists();
                long len = exists ? apkFile.length() : -1;
                logLine("cache_file", "abs=" + abs + " exists=" + exists + " length=" + len);
                if (!exists || !apkFile.isFile()) {
                    call.reject("apk_not_found", "Cached APK missing: " + abs, (Exception) null);
                    return;
                }
                contentUri = FileProvider.getUriForFile(getContext(), authorityExpected, apkFile);
            } else if (uriString != null && !uriString.isEmpty()) {
                Uri parsed = Uri.parse(uriString);
                String scheme = parsed.getScheme() != null ? parsed.getScheme() : "";
                String auth = parsed.getAuthority() != null ? parsed.getAuthority() : "";
                logLine("from_uri", "scheme=" + scheme + " authority=" + auth + " uri=" + uriString);

                if ("file".equalsIgnoreCase(scheme)) {
                    String path = parsed.getPath();
                    if (path == null || path.isEmpty()) {
                        call.reject("bad_file_uri", "Empty file path", (Exception) null);
                        return;
                    }
                    apkFile = new File(path);
                    logLine(
                        "file_uri_path",
                        "abs=" + apkFile.getAbsolutePath() + " exists=" + apkFile.exists());
                    if (!apkFile.exists() || !apkFile.isFile()) {
                        call.reject("apk_not_found", "File URI path not found", (Exception) null);
                        return;
                    }
                    contentUri = FileProvider.getUriForFile(getContext(), authorityExpected, apkFile);
                } else if ("content".equalsIgnoreCase(scheme)) {
                    if (!authorityExpected.equals(auth)) {
                        logLine(
                            "authority_mismatch",
                            "expected=" + authorityExpected + " got=" + auth
                                    + " — using URI as-is (may fail on OEM)");
                    }
                    contentUri = parsed;
                } else {
                    call.reject("unsupported_uri_scheme", "Scheme: " + scheme, (Exception) null);
                    return;
                }
            } else {
                call.reject("uri_required", "Missing uri and cacheRelativePath", (Exception) null);
                return;
            }

            logLine(
                    "content_uri",
                    "uri=" + contentUri
                            + " authority="
                            + (contentUri.getAuthority() != null ? contentUri.getAuthority() : "null"));

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(contentUri, "application/vnd.android.package-archive");
            int flags = Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION;
            intent.addFlags(flags);
            intent.setClipData(ClipData.newUri(getContext().getContentResolver(), "", contentUri));

            logLine("intent", "action=ACTION_VIEW mime=application/vnd.android.package-archive flags=0x"
                    + Integer.toHexString(flags));

            PackageManager pm = getActivity().getPackageManager();
            ResolveInfo ri;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                ri = pm.resolveActivity(
                        intent, PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_DEFAULT_ONLY));
            } else {
                ri = pm.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY);
            }

            if (ri == null) {
                logLine("resolveActivity", "result=null (no handler)");
                call.reject("no_install_handler", "No app can handle this APK intent", (Exception) null);
                return;
            }

            String res =
                    ri.activityInfo != null
                            ? ri.activityInfo.packageName + "/" + ri.activityInfo.name
                            : "(resolveInfo without activityInfo)";
            logLine("resolveActivity", "ok=" + res);

            getActivity().startActivity(intent);
            logLine("startActivity", "dispatched");
            call.resolve();
        } catch (Exception e) {
            logLine("exception", e.getClass().getName() + ": " + e.getMessage());
            Log.e(TAG, "[apk-installer] stack", e);
            call.reject("open_installer_failed", e.getMessage() != null ? e.getMessage() : "open failed", e);
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
