# Rollback Plan

1. Revert feature branch commits (or redeploy previous Production deployment).
2. www→apex redirect removal would re-expose non-canonical Google `redirect_uri` — keep Google Cloud apex URI either way.
3. Cookie name / getToken alignment should **not** be rolled back independently (would restore middleware session blind spot).
4. No database migrations to roll back.
