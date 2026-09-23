'use client';

/**
 * PHASE 8C — seller cost administration on /verdiensten.
 *
 * Shows the year at a glance, then the costs behind it, then a form that asks
 * the minimum number of questions. The form is progressive: amount, date and
 * category always; the business-share and investment questions only when the
 * answer could actually change the outcome.
 *
 * The result shown here is explicitly partial. HomeCheff sees its own sales and
 * its own commission and nothing else, so the copy says "geschat resultaat" and
 * any amount we could not classify is named rather than quietly dropped.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, X, AlertTriangle, Receipt, Paperclip } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import ExpenseEvidencePanel from '@/components/seller/ExpenseEvidencePanel';
import {
  EXPENSE_CATEGORIES,
  FULL_BUSINESS_USE_BP,
  OFFICIAL_FACTS_2026,
  type ExpenseCategory,
  type ExpenseFiscalTreatment,
} from '@/lib/finance/seller-expense';

type Deductible =
  | { status: 'KNOWN'; cents: number; ruleKey: string }
  | { status: 'UNKNOWN'; reason: string };

type ExpenseRow = {
  id: string;
  expenseDate: string;
  amountCents: number;
  currency: string;
  category: ExpenseCategory;
  businessUseBp: number | null;
  businessAmountCents: number;
  fiscalTreatment: ExpenseFiscalTreatment;
  deductible: Deductible;
  source: string;
  confirmationStatus: 'DRAFT' | 'CONFIRMED' | 'NEEDS_REVIEW';
  investmentQuestionApplies: boolean;
  merchantName: string | null;
  description: string | null;
  notes: string | null;
  /** PHASE 8D — attached private evidence. Presentational only. */
  evidenceCount?: number;
};

type FiscalResult = {
  grossSalesCents: number;
  refundCents: number;
  platformFeeCents: number;
  sellerNetProceedsCents: number;
  sellerDeductibleCostCents: number;
  partialResultCents: number;
  unresolvedCostCents: number;
  investmentCostCents: number;
  completeness: string;
  notices: Array<{ code: string; amountCents: number | null }>;
};

const eur = (cents: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);

export default function SellerExpensePanel({ year }: { year: number }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [result, setResult] = useState<FiscalResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseRow | 'NEW' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/seller/expenses?year=${year}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setRows(data.expenses ?? []);
      setResult(data.fiscalResult ?? null);
    } catch {
      setError(t('sellerExpenses.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [year, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const notice = useCallback(
    (code: string) => result?.notices.find((n) => n.code === code) ?? null,
    [result],
  );

  const needsReview = notice('COSTS_NEED_CLASSIFICATION');
  const investment = notice('INVESTMENT_NEEDS_DEPRECIATION');
  const duplicate = notice('PLATFORM_COSTS_MAY_BE_DUPLICATED');

  if (loading && !result) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6" aria-busy="true">
        <div className="h-5 w-48 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <section className="bg-white rounded-xl shadow-sm border p-4 sm:p-6" aria-labelledby="hc-expense-heading">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 id="hc-expense-heading" className="text-lg sm:text-xl font-bold text-gray-900">
            {t('sellerExpenses.title')}{' '}
            <span className="text-gray-400 tabular-nums font-semibold">{year}</span>
          </h2>
          <p className="text-sm text-gray-600">{t('sellerExpenses.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing('NEW')}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          {t('sellerExpenses.addCost')}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {result ? (
        <dl className="divide-y divide-gray-100 border-y border-gray-100">
          <Line label={t('sellerExpenses.revenueLine')} value={eur(result.grossSalesCents)} />
          {result.refundCents > 0 ? (
            <Line label={t('sellerExpenses.refundsLine')} value={`-${eur(result.refundCents)}`} tone="muted" />
          ) : null}
          <Line label={t('sellerExpenses.platformCostsLine')} value={`-${eur(result.platformFeeCents)}`} tone="muted" />
          <Line label={t('sellerExpenses.ownCostsLine')} value={`-${eur(result.sellerDeductibleCostCents)}`} tone="muted" />
          <Line label={t('sellerExpenses.resultLine')} value={eur(result.partialResultCents)} tone="strong" />
        </dl>
      ) : null}

      <p className="mt-3 text-xs text-gray-500">{t('sellerExpenses.resultHint')}</p>

      <div className="mt-3 space-y-2">
        {needsReview?.amountCents ? (
          <Notice tone="amber">
            {t('sellerExpenses.needsReviewNotice', { amount: eur(needsReview.amountCents) })}
          </Notice>
        ) : null}
        {investment?.amountCents ? (
          <Notice tone="amber">
            {t('sellerExpenses.investmentNotice', { amount: eur(investment.amountCents) })}
          </Notice>
        ) : null}
        {duplicate?.amountCents ? (
          <Notice tone="amber">
            {t('sellerExpenses.platformDuplicateNotice', { amount: eur(duplicate.amountCents) })}
          </Notice>
        ) : null}
        <Notice tone="neutral">{t('sellerExpenses.externalRevenueNotice')}</Notice>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setListOpen((v) => !v)}
          aria-expanded={listOpen}
          aria-controls="hc-expense-list"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
        >
          {t('sellerExpenses.viewCosts')} ({rows.length})
        </button>
      </div>

      {listOpen ? (
        <div id="hc-expense-list" className="mt-4">
          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
              <Receipt className="mx-auto mb-2 h-6 w-6 text-gray-400" aria-hidden="true" />
              <p className="font-medium text-gray-900">{t('sellerExpenses.emptyTitle')}</p>
              <p className="mt-1 text-sm text-gray-600">{t('sellerExpenses.emptyBody')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {rows.map((row) => (
                <ExpenseListItem
                  key={row.id}
                  row={row}
                  onEdit={() => setEditing(row)}
                  onChanged={load}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {editing ? (
        <ExpenseDialog
          year={year}
          row={editing === 'NEW' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            setListOpen(true);
            await load();
          }}
        />
      ) : null}
    </section>
  );
}

function Line({ label, value, tone }: { label: string; value: string; tone?: 'muted' | 'strong' }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className={tone === 'strong' ? 'text-sm font-semibold text-gray-900' : 'text-sm text-gray-600'}>
        {label}
      </dt>
      <dd
        className={
          tone === 'strong'
            ? 'text-lg font-bold text-gray-900 tabular-nums'
            : tone === 'muted'
              ? 'text-sm font-semibold text-orange-600 tabular-nums'
              : 'text-sm font-semibold text-gray-900 tabular-nums'
        }
      >
        {value}
      </dd>
    </div>
  );
}

function Notice({ tone, children }: { tone: 'amber' | 'neutral'; children: React.ReactNode }) {
  return (
    <p
      role="status"
      className={
        tone === 'amber'
          ? 'flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900'
          : 'rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-600'
      }
    >
      {tone === 'amber' ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : null}
      <span>{children}</span>
    </p>
  );
}

function ExpenseListItem({
  row,
  onEdit,
  onChanged,
}: {
  row: ExpenseRow;
  onEdit: () => void;
  onChanged: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  // Seeded from the list response so the badge is right before the row is
  // expanded, then kept live by the evidence panel itself.
  const [evidenceCount, setEvidenceCount] = useState(row.evidenceCount ?? 0);

  const remove = async () => {
    if (!window.confirm(t('sellerExpenses.formDeleteConfirm'))) return;
    setBusy(true);
    try {
      await fetch(`/api/seller/expenses/${row.id}`, { method: 'DELETE' });
      await onChanged();
    } finally {
      setBusy(false);
    }
  };

  const statusLabel =
    row.confirmationStatus === 'CONFIRMED'
      ? t('sellerExpenses.statusConfirmed')
      : row.confirmationStatus === 'NEEDS_REVIEW'
        ? t('sellerExpenses.statusNeedsReview')
        : t('sellerExpenses.statusDraft');

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm tabular-nums text-gray-500 w-24 shrink-0">{row.expenseDate}</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="min-w-0 flex-1 text-left text-sm font-medium text-gray-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
        >
          <span className="block truncate">
            {row.description || row.merchantName || t(`sellerExpenses.category${row.category}`)}
          </span>
        </button>
        <span className="hidden sm:inline text-xs text-gray-500">
          {t(`sellerExpenses.category${row.category}`)}
        </span>
        {evidenceCount > 0 ? (
          <span
            className="inline-flex items-center gap-1 text-xs text-gray-500"
            title={t('sellerExpenses.evidenceCount', { count: String(evidenceCount) })}
          >
            <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="tabular-nums">{evidenceCount}</span>
            <span className="sr-only">
              {t('sellerExpenses.evidenceCount', { count: String(evidenceCount) })}
            </span>
          </span>
        ) : null}
        <span className="text-sm font-semibold tabular-nums text-gray-900">{eur(row.amountCents)}</span>
        <span
          className={
            row.confirmationStatus === 'CONFIRMED'
              ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700'
              : 'rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800'
          }
        >
          {statusLabel}
        </span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`${t('sellerExpenses.formTitleEdit')} ${row.description ?? ''}`.trim()}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            aria-label={`${t('sellerExpenses.formDelete')} ${row.description ?? ''}`.trim()}
            className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </span>
      </div>

      {open ? (
        <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 rounded-lg bg-gray-50 p-3 text-sm sm:grid-cols-2">
          <Detail label={t('sellerExpenses.detailBusinessShare')}>
            {((row.businessUseBp ?? FULL_BUSINESS_USE_BP) / 100).toFixed(2).replace('.', ',')}%
          </Detail>
          <Detail label={t('sellerExpenses.detailBusinessAmount')}>{eur(row.businessAmountCents)}</Detail>
          <Detail label={t('sellerExpenses.detailTreatment')}>
            {t(`sellerExpenses.treatment${row.fiscalTreatment}`)}
          </Detail>
          <Detail label={t('sellerExpenses.detailDeductible')}>
            {row.deductible.status === 'KNOWN'
              ? eur(row.deductible.cents)
              : t('sellerExpenses.deductibleUnknown')}
          </Detail>
          <Detail label={t('sellerExpenses.detailSource')}>{t('sellerExpenses.sourceUserProvided')}</Detail>
          {row.notes ? <Detail label={t('sellerExpenses.formNotes')}>{row.notes}</Detail> : null}
        </dl>
      ) : null}

      {/* PHASE 8D — the receipt drawer. Mounted only when the row is expanded,
          so opening the list does not fetch evidence for every expense. */}
      {open ? <ExpenseEvidencePanel expenseId={row.id} onCountChange={setEvidenceCount} /> : null}
    </li>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-600">{label}</dt>
      <dd className="font-medium text-gray-900 text-right">{children}</dd>
    </div>
  );
}

/** Cents from a Dutch or plain decimal string, without float drift. */
function parseEuroToCents(raw: string): number | null {
  const cleaned = raw.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [whole, frac = ''] = cleaned.split('.');
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'));
}

function ExpenseDialog({
  year,
  row,
  onClose,
  onSaved,
}: {
  year: number;
  row: ExpenseRow | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState(row?.description ?? '');
  const [merchantName, setMerchantName] = useState(row?.merchantName ?? '');
  const [amount, setAmount] = useState(row ? (row.amountCents / 100).toFixed(2).replace('.', ',') : '');
  const [expenseDate, setExpenseDate] = useState(
    row?.expenseDate ?? `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
  );
  const [category, setCategory] = useState<ExpenseCategory>(row?.category ?? 'MATERIALS');
  const [fullBusiness, setFullBusiness] = useState(
    row ? row.businessUseBp === null || row.businessUseBp === FULL_BUSINESS_USE_BP : true,
  );
  const [sharePercent, setSharePercent] = useState(
    row?.businessUseBp != null ? String(row.businessUseBp / 100) : '50',
  );
  const [treatment, setTreatment] = useState<ExpenseFiscalTreatment>(row?.fiscalTreatment ?? 'UNKNOWN');
  const [notes, setNotes] = useState(row?.notes ?? '');
  const [confirmed, setConfirmed] = useState(row?.confirmationStatus === 'CONFIRMED');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const amountCents = useMemo(() => parseEuroToCents(amount), [amount]);

  // The investment question is asked only when the official €450 threshold is
  // crossed in a category that plausibly holds durable assets. It prompts; the
  // seller answers. Crossing the threshold never classifies anything by itself.
  const investmentQuestionApplies =
    amountCents !== null &&
    amountCents >= OFFICIAL_FACTS_2026.INVESTMENT_THRESHOLD_CENTS &&
    (category === 'EQUIPMENT' || category === 'OTHER');

  const canConfirm = treatment !== 'UNKNOWN';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (amountCents === null || amountCents <= 0) {
      setErrors([t('sellerExpenses.formAmount')]);
      return;
    }

    const share = fullBusiness ? null : Math.round(Number(sharePercent.replace(',', '.')) * 100);
    const effectiveTreatment: ExpenseFiscalTreatment =
      investmentQuestionApplies && treatment === 'UNKNOWN' ? 'UNKNOWN' : treatment;

    setSaving(true);
    try {
      const body = {
        expenseDate,
        amountCents,
        currency: 'EUR',
        category,
        businessUseBp: share,
        fiscalTreatment: effectiveTreatment,
        confirmationStatus: confirmed && canConfirm ? 'CONFIRMED' : 'DRAFT',
        merchantName: merchantName || null,
        description: description || null,
        notes: notes || null,
      };
      const res = await fetch(
        row ? `/api/seller/expenses/${row.id}` : '/api/seller/expenses',
        {
          method: row ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrors(data?.details ?? [t('sellerExpenses.saveFailed')]);
        return;
      }
      await onSaved();
    } catch {
      setErrors([t('sellerExpenses.saveFailed')]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      // z-[100] matches the app's modal convention and clears the bottom
      // navigation at z-[65], which otherwise covers the foot of the sheet.
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hc-expense-dialog-title"
        className="w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 id="hc-expense-dialog-title" className="text-lg font-bold text-gray-900">
            {row ? t('sellerExpenses.formTitleEdit') : t('sellerExpenses.formTitleNew')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('sellerExpenses.formCancel')}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {errors.length > 0 ? (
          <ul role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
            {errors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        ) : null}

        <form onSubmit={submit} className="space-y-4">
          <Field id="hc-exp-what" label={t('sellerExpenses.formWhat')}>
            <input
              ref={firstFieldRef}
              id="hc-exp-what"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('sellerExpenses.formWhatPlaceholder')}
              maxLength={200}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="hc-exp-amount" label={t('sellerExpenses.formAmount')}>
              <input
                id="hc-exp-amount"
                type="text"
                inputMode="decimal"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className={inputClass}
              />
            </Field>
            <Field id="hc-exp-date" label={t('sellerExpenses.formDate')}>
              <input
                id="hc-exp-date"
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field id="hc-exp-category" label={t('sellerExpenses.formCategory')}>
            <select
              id="hc-exp-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className={inputClass}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`sellerExpenses.category${c}`)}
                </option>
              ))}
            </select>
          </Field>

          <Field id="hc-exp-merchant" label={t('sellerExpenses.formMerchant')}>
            <input
              id="hc-exp-merchant"
              type="text"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              maxLength={200}
              className={inputClass}
            />
          </Field>

          <fieldset>
            <legend className="text-sm font-medium text-gray-900">
              {t('sellerExpenses.formFullBusiness')}
            </legend>
            <div className="mt-2 flex gap-4">
              <Radio
                name="hc-exp-full"
                checked={fullBusiness}
                onChange={() => setFullBusiness(true)}
                label={t('sellerExpenses.formFullBusinessYes')}
              />
              <Radio
                name="hc-exp-full"
                checked={!fullBusiness}
                onChange={() => setFullBusiness(false)}
                label={t('sellerExpenses.formFullBusinessPartly')}
              />
            </div>
          </fieldset>

          {!fullBusiness ? (
            <Field id="hc-exp-share" label={t('sellerExpenses.formBusinessShare')} hint={t('sellerExpenses.formBusinessShareHint')}>
              <div className="flex items-center gap-2">
                <input
                  id="hc-exp-share"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={sharePercent}
                  onChange={(e) => setSharePercent(e.target.value)}
                  className={`${inputClass} max-w-28`}
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
            </Field>
          ) : null}

          {investmentQuestionApplies ? (
            <fieldset>
              <legend className="text-sm font-medium text-gray-900">
                {t('sellerExpenses.formInvestmentQuestion')}
              </legend>
              <p className="mt-1 text-xs text-gray-500">{t('sellerExpenses.formInvestmentHint')}</p>
              <div className="mt-2 flex flex-wrap gap-4">
                <Radio
                  name="hc-exp-inv"
                  checked={treatment === 'ORDINARY_EXPENSE'}
                  onChange={() => setTreatment('ORDINARY_EXPENSE')}
                  label={t('sellerExpenses.formInvestmentNo')}
                />
                <Radio
                  name="hc-exp-inv"
                  checked={treatment === 'INVESTMENT'}
                  onChange={() => setTreatment('INVESTMENT')}
                  label={t('sellerExpenses.formInvestmentYes')}
                />
                <Radio
                  name="hc-exp-inv"
                  checked={treatment === 'UNKNOWN'}
                  onChange={() => setTreatment('UNKNOWN')}
                  label={t('sellerExpenses.formInvestmentUnsure')}
                />
              </div>
            </fieldset>
          ) : (
            <Field id="hc-exp-treatment" label={t('sellerExpenses.formTreatment')}>
              <select
                id="hc-exp-treatment"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value as ExpenseFiscalTreatment)}
                className={inputClass}
              >
                <option value="UNKNOWN">{t('sellerExpenses.treatmentUNKNOWN')}</option>
                <option value="ORDINARY_EXPENSE">{t('sellerExpenses.treatmentORDINARY_EXPENSE')}</option>
                <option value="INVESTMENT">{t('sellerExpenses.treatmentINVESTMENT')}</option>
                <option value="NON_DEDUCTIBLE">{t('sellerExpenses.treatmentNON_DEDUCTIBLE')}</option>
                <option value="LIMITED_DEDUCTIBLE">{t('sellerExpenses.treatmentLIMITED_DEDUCTIBLE')}</option>
              </select>
            </Field>
          )}

          <Field id="hc-exp-notes" label={t('sellerExpenses.formNotes')}>
            <textarea
              id="hc-exp-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={2000}
              className={inputClass}
            />
          </Field>

          <div>
            <label className="flex items-start gap-2 text-sm text-gray-900">
              <input
                type="checkbox"
                checked={confirmed && canConfirm}
                disabled={!canConfirm}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-50"
              />
              <span>{t('sellerExpenses.formConfirm')}</span>
            </label>
            <p className="mt-1 text-xs text-gray-500">{t('sellerExpenses.formConfirmHint')}</p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
            >
              {t('sellerExpenses.formCancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              {t('sellerExpenses.formSave')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-emerald-700';

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-900">
        {label}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-gray-500">{hint}</p> : null}
      {children}
    </div>
  );
}

function Radio({
  name,
  checked,
  onChange,
  label,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-gray-900">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 border-gray-300 text-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
      />
      {label}
    </label>
  );
}
