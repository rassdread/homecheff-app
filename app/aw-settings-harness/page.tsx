import { notFound } from "next/navigation";
import SettingsWorkspaceRoot from "@/components/adaptive-workspace/SettingsWorkspaceRoot";
import SettingsWorkspaceHarnessChild from "@/components/adaptive-workspace/SettingsWorkspaceHarnessChild";
import { resolveSettingsWorkspaceMode } from "@/lib/adaptive-workspace-react/settings-mode";

export const dynamic = "force-dynamic";

/**
 * Phase 2G browser verification harness — NOT a product route.
 * Enabled only when HOMECHEFF_AW_SETTINGS_HARNESS=1.
 * Uses the same SettingsWorkspaceRoot + mode config as /settings.
 */
export default function AwSettingsHarnessPage() {
  if (process.env.HOMECHEFF_AW_SETTINGS_HARNESS !== "1") {
    notFound();
  }

  const { mode } = resolveSettingsWorkspaceMode();

  return (
    <div data-aw-settings-harness-page="" className="min-h-screen">
      <SettingsWorkspaceRoot mode={mode}>
        <SettingsWorkspaceHarnessChild />
      </SettingsWorkspaceRoot>
    </div>
  );
}
