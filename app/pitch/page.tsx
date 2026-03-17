import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileDown, AlertCircle, Lightbulb, Target, TrendingUp, MapPin, Package, Briefcase, Globe, Euro } from 'lucide-react';
import Logo from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Investor overview – HomeCheff',
  description: 'HomeCheff investor pitch deck and company overview for interested investors.',
  robots: 'noindex, nofollow',
};

const PITCH_PDF_DOWNLOAD_URL = '/api/pitch-pdf';

export default function PitchPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden />
          Terug naar home
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <Logo size="md" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Investor overview – HomeCheff
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          The digital marketplace for neighbourhood economies. Pilot with Municipality of Vlaardingen.
        </p>

        <div className="mb-10">
          <a
            href={PITCH_PDF_DOWNLOAD_URL}
            download="Investor pitch HomeCheff.pdf"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors text-sm font-medium shadow-sm"
          >
            <FileDown className="w-4 h-4" aria-hidden />
            Download pitch deck (PDF)
          </a>
        </div>

        {/* The Problem */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-8 h-8 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900">The Problem</h2>
          </div>
          <ul className="space-y-3 text-gray-700 prose prose-lg list-disc list-inside">
            <li>Local creators struggle to reach buyers in their own neighbourhood.</li>
            <li>Global marketplaces are not built for hyper-local discovery.</li>
            <li>Communities lack digital infrastructure for neighbourhood commerce.</li>
          </ul>
        </section>

        {/* The Solution */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-8 h-8 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900">The Solution</h2>
          </div>
          <p className="text-gray-700 mb-4 prose prose-lg">
            HomeCheff is a community marketplace enabling neighbours to buy and sell locally.
          </p>
          <ul className="space-y-2 text-gray-700 prose prose-lg">
            <li><strong className="text-emerald-700">HomeCheff</strong> – home cooked meals</li>
            <li><strong className="text-emerald-700">HomeGarden</strong> – locally grown produce</li>
            <li><strong className="text-emerald-700">HomeDesigner</strong> – handmade creative products</li>
          </ul>
          <p className="text-gray-700 mt-4 prose prose-lg">
            Together these create local microneconomies within neighbourhoods.
          </p>
        </section>

        {/* Impact */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-8 h-8 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900">Impact</h2>
          </div>
          <p className="text-gray-700 mb-4 prose prose-lg">HomeCheff enables:</p>
          <ul className="space-y-2 text-gray-700 prose prose-lg list-disc list-inside mb-4">
            <li>Local entrepreneurship</li>
            <li>Community interaction</li>
            <li>Neighbourhood food production</li>
            <li>Accessible income opportunities</li>
          </ul>
          <p className="text-gray-700 prose prose-lg">
            Impact areas: local economic resilience, social cohesion and micro-entrepreneurship.
          </p>
        </section>

        {/* Pilot – Municipality of Vlaardingen */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-8 h-8 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900">Pilot – Municipality of Vlaardingen</h2>
          </div>
          <p className="text-gray-700 mb-4 prose prose-lg">
            Preparing a pilot with the municipality of Vlaardingen.
          </p>
          <p className="text-gray-700 font-medium mb-2">Goal:</p>
          <p className="text-gray-700 mb-4 prose prose-lg">
            Test whether a digital neighbourhood marketplace can strengthen local microneconomies.
          </p>
          <p className="text-gray-700 font-medium mb-2">Metrics:</p>
          <ul className="space-y-2 text-gray-700 prose prose-lg list-disc list-inside">
            <li>Number of local sellers</li>
            <li>Community participation</li>
            <li>Economic activity in neighbourhoods</li>
          </ul>
        </section>

        {/* Market Opportunity */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900">Market Opportunity</h2>
          </div>
          <ul className="space-y-2 text-gray-700 prose prose-lg mb-4">
            <li>Local food economy: ~€1T globally</li>
            <li>Creator economy: ~€300B</li>
            <li>Peer-to-peer marketplaces continue to grow rapidly.</li>
          </ul>
          <p className="text-gray-700 font-medium mb-2">HomeCheff sits at the intersection of:</p>
          <ul className="space-y-2 text-gray-700 prose prose-lg list-disc list-inside">
            <li>Local food</li>
            <li>Creator economy</li>
            <li>Community commerce</li>
          </ul>
        </section>

        {/* Product */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Package className="w-8 h-8 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900">Product</h2>
          </div>
          <p className="text-gray-700 mb-4 prose prose-lg">
            Marketplace platform already live: <a href="https://homecheff.eu" className="text-emerald-600 hover:text-emerald-700 font-medium">homecheff.eu</a>
          </p>
          <p className="text-gray-700 font-medium mb-2">Features:</p>
          <ul className="space-y-2 text-gray-700 prose prose-lg list-disc list-inside mb-4">
            <li>Seller profiles</li>
            <li>Product listings</li>
            <li>Local discovery</li>
            <li>Community marketplace</li>
          </ul>
          <p className="text-gray-700 font-medium mb-2">Early traction:</p>
          <ul className="space-y-2 text-gray-700 prose prose-lg list-disc list-inside">
            <li>Platform live</li>
            <li>Preparing municipal pilot</li>
          </ul>
        </section>

        {/* Business Model */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Briefcase className="w-8 h-8 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900">Business Model</h2>
          </div>
          <p className="text-gray-700 font-medium mb-2">Revenue streams:</p>
          <ul className="space-y-2 text-gray-700 prose prose-lg list-disc list-inside">
            <li>Transaction commissions</li>
            <li>Seller subscriptions</li>
            <li>Affiliate referral program</li>
            <li>Local delivery partnerships</li>
          </ul>
        </section>

        {/* Vision */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-8 h-8 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900">Vision</h2>
          </div>
          <p className="text-gray-700 mb-4 prose prose-lg">
            HomeCheff aims to become the digital infrastructure for neighbourhood economies.
          </p>
          <p className="text-gray-700 prose prose-lg">
            Neighbourhood marketplaces → Cities → European network. A scalable platform enabling local microneconomies across thousands of communities.
          </p>
        </section>

        {/* Funding */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Euro className="w-8 h-8 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900">Funding</h2>
          </div>
          <p className="text-gray-700 mb-4 prose prose-lg">
            Currently raising <strong className="text-emerald-700">€250k pre-seed</strong>. Open to strategic early investors. Tickets starting from €50k.
          </p>
          <p className="text-gray-700 font-medium mb-2">Use of funds:</p>
          <ul className="space-y-2 text-gray-700 prose prose-lg list-disc list-inside">
            <li>Platform development</li>
            <li>Municipal pilots</li>
            <li>Community growth</li>
            <li>Expansion to additional cities</li>
          </ul>
        </section>

        {/* Contact / CTA */}
        <section className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sm:p-8">
          <p className="text-gray-700 mb-4">
            <strong>Founder:</strong> Sergio Arrias
          </p>
          <p className="text-gray-700 mb-6">
            <strong>Platform:</strong>{' '}
            <a href="https://homecheff.eu" className="text-emerald-600 hover:text-emerald-700 font-medium">
              homecheff.eu
            </a>
          </p>
          <a
            href={PITCH_PDF_DOWNLOAD_URL}
            download="Investor pitch HomeCheff.pdf"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors text-sm font-medium shadow-sm"
          >
            <FileDown className="w-4 h-4" />
            Download pitch deck (PDF)
          </a>
        </section>
      </div>
    </main>
  );
}
