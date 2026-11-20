/**
 * Digital Asset Links voor eu.homecheff.mobile.
 *
 * Het enige certificaat dat in deze repo te controleren is, is de V2-ondertekening
 * van public/downloads/homecheff-beta.apk (versionName 1.0.15, versionCode 20).
 * Dat is de rechtstreekse APK-sleutel (CN=HomeCheff, OU=Engineering, O=Arrias Beheer BV).
 * Die APK bewijst niet welke versie op een telefoon staat.
 *
 * Play App Signing gebruikt een ander certificaat. Dat SHA-256 staat niet in de
 * repo en wordt hier niet ingevuld. Zonder dat certificaat verifieert Android
 * geen via Play geïnstalleerde app.
 */
export const ANDROID_APP_LINK_PACKAGE = "eu.homecheff.mobile";

export const DIRECT_APK_SHA256_HEX =
  "9e992c2909f16f0a049d800abe7ea450990f72a797440af086c0779b15e9f28b";

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
        sha256_cert_fingerprints: [sha256Fingerprint(DIRECT_APK_SHA256_HEX)],
      },
    },
  ];
}

export function androidAssetLinksJson(): string {
  return JSON.stringify(androidAssetLinksStatement());
}
