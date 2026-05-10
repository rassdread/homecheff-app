package com.homecheff.app;

import android.app.DownloadManager;
import android.content.ClipData;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Log;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * APK-installatie via FileProvider / MediaStore, plus kopiëren naar Downloads voor fallback.
 */
@CapacitorPlugin(name = "HomecheffApkInstaller")
public class HomecheffApkInstallerPlugin extends Plugin {

    private static final String TAG = "apk-installer";
    private static final String DOWNLOAD_SUBDIR = "HomeCheff";

    private static void logLine(String stage, String detail) {
        Log.i(TAG, "[" + stage + "] " + detail);
    }

    private static void copyStream(InputStream in, OutputStream out) throws IOException {
        byte[] buf = new byte[8192];
        int n;
        while ((n = in.read(buf)) != -1) {
            out.write(buf, 0, n);
        }
        out.flush();
    }

    /** @return null if call was rejected */
    private File requireCacheApkFile(PluginCall call, String cacheRelativePath) {
        if (cacheRelativePath == null || cacheRelativePath.isEmpty()) {
            call.reject("cache_path_required", "cacheRelativePath is required", (Exception) null);
            return null;
        }
        File apkFile = new File(getContext().getCacheDir(), cacheRelativePath);
        String abs = apkFile.getAbsolutePath();
        boolean exists = apkFile.exists();
        long len = exists ? apkFile.length() : -1;
        logLine("cache_file", "abs=" + abs + " exists=" + exists + " length=" + len);
        if (!exists || !apkFile.isFile() || len <= 0) {
            call.reject("apk_not_found", "Cached APK missing or empty: " + abs, (Exception) null);
            return null;
        }
        return apkFile;
    }

    private void launchPackageInstallerForUri(PluginCall call, Uri contentUri) throws Exception {
        logLine(
                "content_uri",
                "uri="
                        + contentUri
                        + " authority="
                        + (contentUri.getAuthority() != null ? contentUri.getAuthority() : "null"));

        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(contentUri, "application/vnd.android.package-archive");
        int flags = Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION;
        intent.addFlags(flags);
        intent.setClipData(ClipData.newUri(getContext().getContentResolver(), "", contentUri));

        logLine("intent", "action=ACTION_VIEW mime=application/vnd.android.package-archive flags=0x"
                + Integer.toHexString(flags));

        if (getActivity() == null) {
            logLine("fail", "activity_null");
            call.reject("no_activity", "Activity is null", (Exception) null);
            return;
        }

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
    }

    @PluginMethod
    public void openPackageInstaller(PluginCall call) {
        String cacheRelativePath = call.getString("cacheRelativePath");
        String uriString = call.getString("uri");

        String authorityExpected = BuildConfig.APPLICATION_ID + ".fileprovider";
        logLine("authority_expected", authorityExpected);

        File apkFile = null;
        Uri contentUri = null;

        try {
            if (cacheRelativePath != null && !cacheRelativePath.isEmpty()) {
                apkFile = requireCacheApkFile(call, cacheRelativePath);
                if (apkFile == null) {
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
                                "authority_note",
                                "expected=" + authorityExpected + " got=" + auth + " (using provided URI)");
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

            launchPackageInstallerForUri(call, contentUri);
        } catch (Exception e) {
            logLine("exception", e.getClass().getName() + ": " + e.getMessage());
            Log.e(TAG, "[apk-installer] stack", e);
            call.reject("open_installer_failed", e.getMessage() != null ? e.getMessage() : "open failed", e);
        }
    }

    /**
     * Zelfde als cache-pad in {@link #openPackageInstaller}, met expliciete logging voor retry-knop.
     */
    @PluginMethod
    public void openDownloadedApkFromCache(PluginCall call) {
        String cacheRelativePath = call.getString("cacheRelativePath");
        String authorityExpected = BuildConfig.APPLICATION_ID + ".fileprovider";
        logLine("open_cached_installer", "cacheRelativePath=" + cacheRelativePath);

        try {
            File apkFile = requireCacheApkFile(call, cacheRelativePath);
            if (apkFile == null) {
                return;
            }
            Uri contentUri = FileProvider.getUriForFile(getContext(), authorityExpected, apkFile);
            logLine("open_cached_installer", "fileProviderUri=" + contentUri);
            launchPackageInstallerForUri(call, contentUri);
        } catch (Exception e) {
            logLine("open_cached_installer_fail", e.getClass().getName() + ": " + e.getMessage());
            Log.e(TAG, "[apk-installer] open_cached stack", e);
            call.reject("open_installer_failed", e.getMessage() != null ? e.getMessage() : "open failed", e);
        }
    }

    private void resolveCopyResult(PluginCall call, boolean success, String reason, String displayPath, String uriStr, String method) {
        JSObject ret = new JSObject();
        ret.put("success", success);
        if (!success) {
            ret.put("reason", reason != null ? reason : "unknown");
        } else {
            ret.put("displayPath", displayPath);
            ret.put("uri", uriStr);
            ret.put("method", method);
        }
        logLine(
                "copy_to_downloads_result",
                "success=" + success + " method=" + (method != null ? method : "-") + " path=" + displayPath);
        call.resolve(ret);
    }

    private boolean copyFileToDest(File src, File dest) {
        dest.getParentFile().mkdirs();
        try (InputStream in = new FileInputStream(src);
                OutputStream out = new FileOutputStream(dest, false)) {
            copyStream(in, out);
            return true;
        } catch (IOException e) {
            logLine("copy_io", e.getMessage() != null ? e.getMessage() : "copy failed");
            return false;
        }
    }

    /**
     * Cache-APK naar gebruikers-Downloads (MediaStore op API 29+) of app-external Download/HomeCheff.
     */
    @PluginMethod
    public void copyCachedApkToDownloads(PluginCall call) {
        String cacheRelativePath = call.getString("cacheRelativePath");
        String fileName = call.getString("fileName", "homecheff-beta.apk");

        File src = requireCacheApkFile(call, cacheRelativePath);
        if (src == null) {
            return;
        }

        String authorityExpected = BuildConfig.APPLICATION_ID + ".fileprovider";
        String logicalPath = Environment.DIRECTORY_DOWNLOADS + "/" + DOWNLOAD_SUBDIR + "/" + fileName;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            logLine("copy_to_downloads", "try MediaStore (API 29+)");
            ContentResolver resolver = getContext().getContentResolver();
            ContentValues values = new ContentValues();
            values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
            values.put(MediaStore.MediaColumns.MIME_TYPE, "application/vnd.android.package-archive");
            values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/" + DOWNLOAD_SUBDIR);
            values.put(MediaStore.MediaColumns.IS_PENDING, 1);

            Uri collection = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
            Uri itemUri = null;
            try {
                itemUri = resolver.insert(collection, values);
            } catch (Exception e) {
                logLine("mediastore_insert_fail", String.valueOf(e.getMessage()));
            }

            if (itemUri != null) {
                try (OutputStream out = resolver.openOutputStream(itemUri);
                        InputStream in = new FileInputStream(src)) {
                    if (out == null) {
                        throw new IOException("openOutputStream null");
                    }
                    copyStream(in, out);
                    ContentValues done = new ContentValues();
                    done.put(MediaStore.MediaColumns.IS_PENDING, 0);
                    resolver.update(itemUri, done, null, null);
                    logLine("copy_to_downloads", "MediaStore OK uri=" + itemUri);
                    resolveCopyResult(call, true, null, logicalPath, itemUri.toString(), "mediastore");
                    return;
                } catch (Exception e) {
                    logLine("mediastore_write_fail", String.valueOf(e.getMessage()));
                    try {
                        resolver.delete(itemUri, null, null);
                    } catch (Exception ignored) {
                    }
                }
            }
        } else {
            logLine("copy_to_downloads", "try public Download dir (API < 29)");
            try {
                File pubDl = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                File dir = new File(pubDl, DOWNLOAD_SUBDIR);
                File dest = new File(dir, fileName);
                if (copyFileToDest(src, dest)) {
                    Uri fpUri = FileProvider.getUriForFile(getContext(), authorityExpected, dest);
                    logLine("copy_to_downloads", "public_dir OK uri=" + fpUri);
                    resolveCopyResult(call, true, null, logicalPath, fpUri.toString(), "public_dir");
                    return;
                }
            } catch (Exception e) {
                logLine("public_dir_fail", String.valueOf(e.getMessage()));
            }
        }

        logLine("copy_to_downloads", "fallback app external files Download/HomeCheff");
        File base = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (base == null) {
            resolveCopyResult(call, false, "no_external_files_dir", null, null, null);
            return;
        }
        File dir = new File(base, DOWNLOAD_SUBDIR);
        File dest = new File(dir, fileName);
        if (!copyFileToDest(src, dest)) {
            resolveCopyResult(call, false, "copy_failed", null, null, null);
            return;
        }
        Uri fpUri = FileProvider.getUriForFile(getContext(), authorityExpected, dest);
        String appHint = DOWNLOAD_SUBDIR + "/" + fileName + " (app storage)";
        logLine("copy_to_downloads", "app_downloads OK uri=" + fpUri);
        resolveCopyResult(call, true, null, appHint, fpUri.toString(), "app_downloads");
    }

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
