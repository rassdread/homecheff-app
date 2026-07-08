"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { CREATE_ROLES_SETTINGS_HREF } from "@/lib/create/create-placement-roles";
import Modal from "@/components/ui/Modal";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CreateRolesGateModal({ open, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledById="create-roles-gate-title"
      overlayClassName="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-brand to-primary-600 p-5 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label={t("buttons.close")}
          >
            <X className="w-5 h-5" />
          </button>
          <h2 id="create-roles-gate-title" className="text-xl font-bold pr-10">
            {t("createFlow.rolesGate.title")}
          </h2>
        </div>
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            {t("createFlow.rolesGate.body")}
          </p>
          <Link
            href={CREATE_ROLES_SETTINGS_HREF}
            onClick={onClose}
            className="bg-gradient-to-r from-primary-brand to-primary-600 text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all w-full no-underline"
          >
            {t("createFlow.rolesGate.cta")}
          </Link>
        </div>
      </div>
    </Modal>
  );
}
