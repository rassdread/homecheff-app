/**
 * Digital Asset Links voor eu.homecheff.mobile.
 *
 * Rechtstreekse APK en uploadsleutel zijn hetzelfde certificaat:
 * android/homecheff-release-key.jks, alias homecheff, gecontroleerd tegen
 * public/downloads/homecheff-beta.apk 1.0.15 en config/android-release.json.
 *
 * Play App Signing is een ander certificaat. SHA-256 komt uit Play Console,
 * App-ondertekening, en de bijbehorende SHA-1 staat in Firebase.
 */
export const ANDROID_APP_LINK_PACKAGE = "eu.homecheff.mobile";

export const DIRECT_APK_SHA256_HEX =
  "9e992c2909f16f0a049d800abe7ea450990f72a797440af086c0779b15e9f28b";

export const PLAY_APP_SIGNING_SHA256_HEX =
  "4a195670e4a7e925f34bd601a5d094cae29392013b444a22756acc1a5f3fa9f2";

export function sha256Fingerprint(hex: string): string {
  const clean = hex.replace(/[^0-9a-f]/gi, "").toUpperCase();
  if (!/^[0-9A-F]{64}$/.test(clean)) {
    throw new Error("sha256 fingerprint must be 32 bytes");
  }
  return clean.match(/.{2}/g)!.join(":");
}

export function androidAssetLinksStatement(): Array<{
  relation: string[];
  target: {
    namespace: "android_app";
    package_name: string;
    sha256_cert_fingerprints: string[];
  };
}> {
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: ANDROID_APP_LINK_PACKAGE,
        sha256_cert_fingerprints: [
          sha256Fingerprint(DIRECT_APK_SHA256_HEX),
          sha256Fingerprint(PLAY_APP_SIGNING_SHA256_HEX),
        ],
      },
    },
  ];
}

export function androidAssetLinksJson(): string {
  return JSON.stringify(androidAssetLinksStatement());
}
