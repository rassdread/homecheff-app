# Warning disposition

| Warning | State | Blocking? | Owner |
|---------|-------|-----------|-------|
| Development missing GOOGLE_CLIENT_ID | still present (dev) | non-blocking for Production | Eng |
| Preview redirect maintenance | still present | non-blocking | Eng |
| No iOS native Google | still present | non-blocking for Android/web phase | Product |
| `.homecheff.eu` session Domain | still present | non-blocking if apex-only OAuth held | Eng |
| Host-only PKCE depends on apex-only OAuth | mitigated by www→apex | non-blocking | Eng |
| System-browser fallback device behaviour | unproven on device | non-blocking until native proof | Eng + QA |
| Firebase/Play Signing fingerprint coverage | unverified this session | **blocking for Android PASS** | Operator |
| Stale `com.homecheff.app` registration | unknown | non-blocking | Operator (do not delete blindly) |
| Duplicate Firebase Android registration | unknown | non-blocking | Operator |
| `GOOGLE_NATIVE_CLIENT_ID` server allowlist absent | still present | non-blocking | Eng (optional harden) |
| Native public ID may share web-client lineage | observe | non-blocking pending device aud proof | Operator |
| Interactive web Google matrix incomplete | still present | **blocking for full SUCCESS** | Operator |
| Android APK + device proof incomplete | still present | **blocking for Android PASS** | Operator |
