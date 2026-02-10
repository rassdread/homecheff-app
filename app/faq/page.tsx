'use client';
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, CreditCard, Shield, Truck, User, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

// FAQ categories will be loaded dynamically based on language
const getFAQCategories = (t: (key: string) => string) => [
  {
    id: 'general',
    title: t('faq.categories.general'),
    icon: HelpCircle,
    color: 'blue'
  },
  {
    id: 'features',
    title: t('faq.categories.features'),
    icon: HelpCircle,
    color: 'emerald'
  },
  {
    id: 'sustainability',
    title: t('faq.categories.sustainability'),
    icon: HelpCircle,
    color: 'green'
  },
  {
    id: 'handmade',
    title: t('faq.categories.handmade'),
    icon: AlertTriangle,
    color: 'amber'
  },
  {
    id: 'selling',
    title: t('faq.categories.selling'),
    icon: User,
    color: 'green'
  },
  {
    id: 'buying',
    title: t('faq.categories.buying'),
    icon: CreditCard,
    color: 'purple'
  },
  {
    id: 'payments',
    title: t('faq.categories.payments'),
    icon: CreditCard,
    color: 'emerald'
  },
  {
    id: 'delivery',
    title: t('faq.categories.delivery'),
    icon: Truck,
    color: 'orange'
  },
  {
    id: 'taxes',
    title: t('faq.categories.taxes'),
    icon: FileText,
    color: 'red'
  },
  {
    id: 'safety',
    title: t('faq.categories.safety'),
    icon: Shield,
    color: 'indigo'
  },
  {
    id: 'affiliate',
    title: t('faq.categories.affiliate'),
    icon: TrendingUp,
    color: 'emerald'
  }
];

// Helper function to get FAQ items dynamically based on language
const getFAQData = (t: (key: string) => string) => {
  const getItem = (category: string, index: number) => ({
    question: t(`faq.${category}.${index}.question`),
    answer: t(`faq.${category}.${index}.answer`)
  });

  return {
    general: [
      getItem('general', 0),
      getItem('general', 1),
      getItem('general', 2),
      getItem('general', 3),
      getItem('general', 4),
      getItem('general', 5),
      getItem('general', 6)
    ],
      features: [
      getItem('features', 0),
      getItem('features', 1),
      getItem('features', 2),
      getItem('features', 3),
      getItem('features', 4),
      getItem('features', 5),
      getItem('features', 6)
    ],
    selling: [
      getItem('selling', 0),
      getItem('selling', 1),
      getItem('selling', 2),
      getItem('selling', 3),
      getItem('selling', 4),
      getItem('selling', 5),
      getItem('selling', 6)
    ],
    buying: [
      getItem('buying', 0),
      getItem('buying', 1),
      getItem('buying', 2),
      getItem('buying', 3),
      getItem('buying', 4),
      getItem('buying', 5)
    ],
    payments: [
      getItem('payments', 0),
      getItem('payments', 1),
      getItem('payments', 2),
      getItem('payments', 3),
      getItem('payments', 4)
    ],
    delivery: [
      getItem('delivery', 0),
      getItem('delivery', 1),
      getItem('delivery', 2),
      getItem('delivery', 3),
      getItem('delivery', 4),
      getItem('delivery', 5),
      getItem('delivery', 6),
      getItem('delivery', 7),
      getItem('delivery', 8),
      getItem('delivery', 9),
      getItem('delivery', 10),
      getItem('delivery', 11),
      getItem('delivery', 12),
      getItem('delivery', 13),
      getItem('delivery', 14),
      getItem('delivery', 15),
      getItem('delivery', 16),
      getItem('delivery', 17),
      getItem('delivery', 18),
      getItem('delivery', 19)
    ],
    taxes: [
      getItem('taxes', 0),
      getItem('taxes', 1),
      getItem('taxes', 2),
      getItem('taxes', 3),
      getItem('taxes', 4)
    ],
    handmade: [
      getItem('handmade', 0),
      getItem('handmade', 1),
      getItem('handmade', 2),
      getItem('handmade', 3),
      getItem('handmade', 4),
      getItem('handmade', 5)
    ],
    safety: [
      getItem('safety', 0),
      getItem('safety', 1),
      getItem('safety', 2),
      getItem('safety', 3),
      getItem('safety', 4)
    ],
    sustainability: [
      getItem('sustainability', 0),
      getItem('sustainability', 1),
      getItem('sustainability', 2),
      getItem('sustainability', 3),
      getItem('sustainability', 4),
      getItem('sustainability', 5),
      getItem('sustainability', 6),
      getItem('sustainability', 7),
      getItem('sustainability', 8),
      getItem('sustainability', 9),
      getItem('sustainability', 10)
    ],
    affiliate: [
      getItem('affiliate', 0),
      getItem('affiliate', 1),
      getItem('affiliate', 2),
      getItem('affiliate', 3),
      getItem('affiliate', 4),
      getItem('affiliate', 5)
    ]
  };
};

export default function FAQPage() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('general');
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});
  
  // Get categories with translations
  const faqCategories = getFAQCategories(t);
  const faqData = getFAQData(t);

  const toggleItem = (itemKey: string) => {
    setOpenItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800',
      amber: 'bg-amber-50 border-amber-200 text-amber-800',
      red: 'bg-red-50 border-red-200 text-red-800',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800'
    };
    return colorMap[color] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getIconColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      emerald: 'text-emerald-600',
      orange: 'text-orange-600',
      red: 'text-red-600',
      indigo: 'text-indigo-600'
    };
    return colorMap[color] || 'text-gray-600';
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('faq.title')}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('faq.subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('faq.categoriesTitle')}</h2>
              <nav className="space-y-2">
                {faqCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeCategory === category.id
                          ? getColorClasses(category.color)
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${getIconColor(category.color)}`} />
                      <span className="font-medium">{category.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border p-8">
              <div className="flex items-center space-x-3 mb-8">
                {(() => {
                  const category = faqCategories.find(c => c.id === activeCategory);
                  const Icon = category?.icon || HelpCircle;
                  return (
                    <>
                      <Icon className={`w-6 h-6 ${getIconColor(category?.color || 'blue')}`} />
                      <h2 className="text-2xl font-bold text-gray-900">
                        {category?.title || t('faq.categories.general')}
                      </h2>
                    </>
                  );
                })()}
              </div>

              <div className="space-y-4">
                {faqData[activeCategory as keyof typeof faqData]?.map((item, index) => {
                  const itemKey = `${activeCategory}-${index}`;
                  const isOpen = openItems[itemKey];
                  
                  return (
                    <div key={itemKey} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleItem(itemKey)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 pr-4">
                          {item.question}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                      </button>
                      
                      {isOpen && (
                        <div className="px-6 pb-6">
                          <div className="pt-4 border-t border-gray-100">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Contact CTA */}
              <div className="mt-12 p-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <HelpCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t('faq.contactTitle')}
                    </h3>
                    <p className="text-gray-700 mb-4">
                      {t('faq.contactDescription')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href="mailto:support@homecheff.nl"
                        className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        {t('faq.emailUs')}
                      </a>
                      <a
                        href="/contact"
                        className="inline-flex items-center px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                      >
                        {t('faq.contactForm')}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
