import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// HomeCheff kleuren
const emerald50 = '#ecfdf5';
const emerald600 = '#059669';
const emerald700 = '#047857';
const gray700 = '#374151';
const gray600 = '#4b5563';
const white = '#ffffff';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    backgroundColor: white,
    fontFamily: 'Helvetica',
  },
  pageHeader: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: emerald600,
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: emerald600,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 10,
    color: gray600,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: gray700,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: gray600,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: emerald600,
    marginTop: 16,
    marginBottom: 8,
  },
  body: {
    color: gray700,
    marginBottom: 6,
    lineHeight: 1.4,
  },
  bodyBold: {
    color: gray700,
    marginBottom: 6,
    fontWeight: 'bold',
    lineHeight: 1.4,
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 4,
    marginLeft: 12,
  },
  bulletPoint: {
    width: 6,
    marginRight: 8,
    color: emerald600,
  },
  bulletText: {
    flex: 1,
    color: gray700,
    lineHeight: 1.4,
  },
  highlight: {
    color: emerald700,
    fontWeight: 'bold',
  },
  link: {
    color: emerald600,
    textDecoration: 'none',
  },
  footerBlock: {
    marginTop: 24,
    padding: 16,
    backgroundColor: emerald50,
  },
  footerLine: {
    color: gray700,
    marginBottom: 4,
    fontSize: 10,
  },
});

export default function PitchPDFDocument() {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>HomeCheff</Text>
          <Text style={styles.tagline}>The digital marketplace for neighbourhood economies</Text>
        </View>

        <Text style={styles.title}>Investor overview – HomeCheff</Text>
        <Text style={styles.subtitle}>Pilot with Municipality of Vlaardingen · Founder: Sergio Arrias · homecheff.eu</Text>

        <Text style={styles.sectionTitle}>The Problem</Text>
        <Text style={styles.body}>• Local creators struggle to reach buyers in their own neighbourhood.</Text>
        <Text style={styles.body}>Global marketplaces are not built for hyper-local discovery.</Text>
        <Text style={styles.body}>Communities lack digital infrastructure for neighbourhood commerce.</Text>

        <Text style={styles.sectionTitle}>The Solution</Text>
        <Text style={styles.body}>HomeCheff is a community marketplace enabling neighbours to buy and sell locally.</Text>
        <Text style={styles.body}>• HomeCheff – home cooked meals</Text>
        <Text style={styles.body}>• HomeGarden – locally grown produce</Text>
        <Text style={styles.body}>• HomeDesigner – handmade creative products</Text>
        <Text style={styles.body}>Together these create local microneconomies within neighbourhoods.</Text>

        <Text style={styles.sectionTitle}>Impact</Text>
        <Text style={styles.body}>HomeCheff enables: local entrepreneurship, community interaction, neighbourhood food production, accessible income opportunities. Impact areas: local economic resilience, social cohesion and micro-entrepreneurship.</Text>

        <Text style={styles.sectionTitle}>Pilot – Municipality of Vlaardingen</Text>
        <Text style={styles.body}>Preparing a pilot with the municipality of Vlaardingen. Goal: Test whether a digital neighbourhood marketplace can strengthen local microneconomies. Metrics: Number of local sellers, community participation, economic activity in neighbourhoods.</Text>

        <Text style={styles.sectionTitle}>Market Opportunity</Text>
        <Text style={styles.body}>Local food economy: ~€1T globally. Creator economy: ~€300B. Peer-to-peer marketplaces continue to grow rapidly. HomeCheff sits at the intersection of: local food, creator economy, community commerce.</Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Product</Text>
        <Text style={styles.body}>Marketplace platform already live: homecheff.eu. Features: Seller profiles, product listings, local discovery, community marketplace. Early traction: Platform live, preparing municipal pilot.</Text>

        <Text style={styles.sectionTitle}>Business Model</Text>
        <Text style={styles.body}>Revenue streams: Transaction commissions, seller subscriptions, affiliate referral program, local delivery partnerships.</Text>

        <Text style={styles.sectionTitle}>Vision</Text>
        <Text style={styles.body}>HomeCheff aims to become the digital infrastructure for neighbourhood economies. Neighbourhood marketplaces → Cities → European network. A scalable platform enabling local microneconomies across thousands of communities.</Text>

        <Text style={styles.sectionTitle}>Funding</Text>
        <Text style={styles.body}>Currently raising €250k pre-seed. Open to strategic early investors. Tickets starting from €50k. Use of funds: Platform development, municipal pilots, community growth, expansion to additional cities.</Text>

        <View style={styles.footerBlock}>
          <Text style={styles.footerLine}>Founder: Sergio Arrias</Text>
          <Text style={styles.footerLine}>Platform: homecheff.eu</Text>
          <Text style={[styles.footerLine, { color: emerald600, fontWeight: 'bold', marginTop: 8 }]}>HomeCheff – Investor overview</Text>
        </View>
      </Page>
    </Document>
  );
}
