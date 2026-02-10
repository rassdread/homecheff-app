'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Mail, Send, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function ContactPage() {
  const { t, language } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          language: language
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Er is een fout opgetreden. Probeer het later opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <Logo size="md" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('contact.title')}
          </h1>
          <p className="text-gray-600">
            {t('contact.description')}
          </p>
        </div>

        {/* Success Message */}
        {submitStatus === 'success' && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-emerald-900 mb-1">
                {t('contact.successTitle')}
              </h3>
              <p className="text-sm text-emerald-700">
                {t('contact.successMessage')}
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {submitStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">
                {t('contact.errorTitle')}
              </h3>
              <p className="text-sm text-red-700">
                {errorMessage || t('contact.errorMessage')}
              </p>
            </div>
          </div>
        )}

        {/* Contact Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                {t('contact.name')} *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder={t('contact.namePlaceholder')}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('contact.email')} *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder={t('contact.emailPlaceholder')}
              />
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                {t('contact.subject')} *
              </label>
              <select
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              >
                <option value="">{t('contact.selectSubject')}</option>
                <option value="general">{t('contact.subjectGeneral')}</option>
                <option value="technical">{t('contact.subjectTechnical')}</option>
                <option value="payment">{t('contact.subjectPayment')}</option>
                <option value="delivery">{t('contact.subjectDelivery')}</option>
                <option value="account">{t('contact.subjectAccount')}</option>
                <option value="other">{t('contact.subjectOther')}</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                {t('contact.message')} *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                value={formData.message}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                placeholder={t('contact.messagePlaceholder')}
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('contact.sending')}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t('contact.send')}
                  </>
                )}
              </button>
              <Link
                href="/faq"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('contact.backToFAQ')}
              </Link>
            </div>
          </form>
        </div>

        {/* Alternative Contact Methods */}
        <div className="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('contact.alternativeTitle')}
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:support@homecheff.nl"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              <Mail className="w-5 h-5 text-emerald-600" />
              <div className="flex flex-col">
                <span className="text-emerald-700 font-medium">support@homecheff.nl</span>
                <span className="text-xs text-gray-500">{t('contact.supportDescription')}</span>
              </div>
            </a>
            <a
              href="mailto:info@homecheff.nl"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              <Mail className="w-5 h-5 text-emerald-600" />
              <div className="flex flex-col">
                <span className="text-emerald-700 font-medium">info@homecheff.nl</span>
                <span className="text-xs text-gray-500">{t('contact.infoDescription')}</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

