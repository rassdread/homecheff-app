import AffiliateCommissionCatalog from '@/components/affiliate/AffiliateCommissionCatalog';
import AffiliateCountryInterestForm from '@/components/affiliate/AffiliateCountryInterestForm';
import PortfolioExplorer from '@/components/affiliate/PortfolioExplorer';
import { buildAffiliateCommissionCatalog } from '@/lib/affiliate/commission-catalog';
import { individualSaleExamples } from '@/lib/affiliate/marketplace-sale-economics';
import { NETWORK_CAPABILITY } from '@/lib/affiliate/network-capability';
import {
  JOURNEY_NEW_GROWTH_STARTER_PER_MONTH,
  JOURNEY_RETENTION,
  JOURNEY_STUDIO_CROSS_SELL_RATE,
  JOURNEY_STUDIO_FROM_MONTH,
  SCALE_TARGET_EUR,
  alongsideWorkJourneyStages,
  growthStarterCustomersForMonthlyTarget,
  growthStarterShareCents,
} from '@/lib/affiliate/portfolio-scenario';
import { affiliatePropositionFaqs } from '@/lib/affiliate/proposition-faqs';

function eur(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

const STAGE_LABELS: Record<number, { nl: string; en: string }> = {
  1: { nl: 'Maand 1', en: 'Month 1' },
  3: { nl: 'Maand 2–3', en: 'Month 2–3' },
  6: { nl: 'Maand 6', en: 'Month 6' },
  12: { nl: 'Maand 12', en: 'Month 12' },
  24: { nl: 'Jaar 2', en: 'Year 2' },
  36: { nl: 'Jaar 3', en: 'Year 3' },
};

export default function AffiliateBusinessStory({
  lang,
  programName = 'Vroege instap',
  showEarly = true,
}: {
  lang: 'nl' | 'en';
  programName?: string;
  showEarly?: boolean;
}) {
  const en = lang === 'en';
  const stages = alongsideWorkJourneyStages();
  const share = growthStarterShareCents();
  const sales = individualSaleExamples();
  const faqs = affiliatePropositionFaqs(lang);
  const catalog = buildAffiliateCommissionCatalog();

  return (
    <div className="mx-auto mt-8 max-w-3xl space-y-8 text-left">
      <section>
        <h2 className="text-xl font-semibold text-slate-900">
          {en
            ? 'Build your own commercial activity as an affiliate.'
            : 'Bouw als affiliate je eigen commerciële activiteit op.'}
        </h2>
        {showEarly ? (
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            {en
              ? `HomeCheff is building its affiliate network. People who join now, under ${programName}, get the tools to build a customer portfolio and a network.`
              : `HomeCheff bouwt momenteel zijn affiliate-netwerk op. Daarom krijgen affiliates die nu instappen, in ${programName}, extra mogelijkheden om hun eigen klantenportefeuille en netwerk op te bouwen.`}
          </p>
        ) : null}
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          {en
            ? 'You do not have to start big. A few hours a week alongside your current work is enough to begin. The first months are mostly building. Commission can still be modest. A customer who stays active can remain part of your portfolio later. You build on what you already did.'
            : 'Je hoeft niet direct groot te beginnen. Start bijvoorbeeld een paar uur per week naast je huidige werk. De eerste maanden bouw je vooral. Misschien is je commissie dan nog bescheiden. Maar een klant die actief blijft, kan ook later onderdeel van je portefeuille blijven. Zo bouw je verder op wat je eerder hebt gedaan.'}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          {en
            ? 'If you keep adding customers and keep helping the ones you have, a small portfolio can grow into a much larger recurring commission. That is not inevitable. It depends on sales, retention and qualifying paid use.'
            : 'Blijf je nieuwe klanten toevoegen en bestaande klanten goed helpen, dan kan een kleine portefeuille stap voor stap uitgroeien tot een veel grotere terugkerende commissie. Dat gebeurt niet vanzelf. Het hangt af van verkoop, behoud en kwalificerend betaald gebruik.'}
        </p>
      </section>

      <section id="portefeuille-groei">
        <h2 className="text-xl font-semibold text-slate-900">
          {en ? 'How a portfolio could develop' : 'Zo kán een klantenportefeuille zich ontwikkelen'}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {en ? 'Example scenario. Based on these assumptions.' : 'Voorbeeldscenario. Op basis van deze aannames.'}
        </p>
        <ol className="mt-4 space-y-3">
          {stages.map((stage, index) => (
            <li key={stage.months} className="rounded-2xl border border-emerald-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                {en ? STAGE_LABELS[stage.months]?.en : STAGE_LABELS[stage.months]?.nl}
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{eur(stage.ownCents)}</p>
              <p className="mt-1 text-sm text-slate-700">
                {en
                  ? `${stage.activeGrowth} active qualifying Growth Starter customers`
                  : `${stage.activeGrowth} actieve kwalificerende Growth Starter-klanten`}
                {stage.activeStudio > 0
                  ? en
                    ? `, of which ${stage.activeStudio} also on Studio Creator`
                    : `, waarvan ${stage.activeStudio} ook op Studio Creator`
                  : ''}
                .
              </p>
              {index < stages.length - 1 ? (
                <p className="mt-2 text-center text-slate-400" aria-hidden>
                  ↓
                </p>
              ) : null}
            </li>
          ))}
        </ol>
        <ul className="mt-4 space-y-1 text-sm text-slate-600">
          <li>
            {en
              ? `${JOURNEY_NEW_GROWTH_STARTER_PER_MONTH} new Growth Starter customers per month. Not tied to a number of hours.`
              : `${JOURNEY_NEW_GROWTH_STARTER_PER_MONTH} nieuwe Growth Starter-klanten per maand. Niet gekoppeld aan een aantal uren.`}
          </li>
          <li>
            {en
              ? `This scenario keeps ${Math.round(JOURNEY_RETENTION * 100)}% of them qualifying.`
              : `Dit scenario houdt ${Math.round(JOURNEY_RETENTION * 100)}% daarvan kwalificerend.`}
          </li>
          <li>
            {en
              ? `From month ${JOURNEY_STUDIO_FROM_MONTH}, ${Math.round(JOURNEY_STUDIO_CROSS_SELL_RATE * 100)}% of active Growth customers also pay Studio Creator.`
              : `Vanaf maand ${JOURNEY_STUDIO_FROM_MONTH} betaalt ${Math.round(JOURNEY_STUDIO_CROSS_SELL_RATE * 100)}% van de actieve Growth-klanten ook Studio Creator.`}
          </li>
          <li>
            {en
              ? `Each Starter customer is ${eur(share.directCents)} direct commission per qualifying billing period. That is 50% of the margin after the HC reserve, not 50% of the customer price.`
              : `Elke Starter-klant is ${eur(share.directCents)} directe commissie per kwalificerende betaalperiode. Dat is 50% van de marge na de HC-reserve, niet 50% van de klantprijs.`}
          </li>
          <li>
            {en
              ? 'No Marketplace orders and no network in this journey. Those are separate lines in the calculator.'
              : 'Geen Marketplace-orders en geen netwerk in dit traject. Die staan apart in de rekenhulp.'}
          </li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          {en
            ? 'The first few hundred euros may not look spectacular yet. If they come from customers who remain qualifying, they can be the start of a portfolio you keep building. That amount is not guaranteed to return.'
            : 'De eerste paar honderd euro zien er misschien nog niet spectaculair uit. Komen ze van klanten die kwalificerend blijven, dan kunnen ze het begin zijn van een portefeuille waar je op verder bouwt. Dat bedrag komt niet vanzelf terug.'}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-900">{en ? 'And after that?' : 'En daarna?'}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          {en
            ? 'After a year your portfolio does not stop by itself. For as long as a customer you referred keeps using qualifying paid HomeCheff products, that customer can keep generating commission for you.'
            : 'Na een jaar stopt je portefeuille niet automatisch. Zolang een klant die jij hebt aangebracht kwalificerende betaalde HomeCheff-producten blijft gebruiken, kan die klant commissie voor jou blijven opleveren.'}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          {en
            ? 'Whether that is 2 years, 5 years or 20 years: there is no automatic calendar stop on the commission. The customer keeps counting for as long as the relationship qualifies under the current terms.'
            : 'Of dat nu 2 jaar, 5 jaar of 20 jaar is: er is geen automatische kalenderstop op de commissie. De klant blijft meetellen zolang de klantrelatie volgens de geldende voorwaarden kwalificeert.'}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-900">
          {en ? 'Two ways the portfolio grows' : 'Twee manieren waarop de portefeuille groeit'}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          {en
            ? 'Your portfolio does not grow only because you find new customers. Existing customers can later use other HomeCheff products. Commission can arise there too, under that product’s rules.'
            : 'Je portefeuille groeit niet alleen doordat je nieuwe klanten vindt. Bestaande klanten kunnen later ook andere HomeCheff-producten gaan gebruiken. Ook daar kan volgens de regels van dat product commissie uit ontstaan.'}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          {en
            ? 'That is why the work does not stop at the first sale. A customer who stays satisfied and keeps using HomeCheff can keep value in your portfolio later. After-sales does not guarantee that they stay.'
            : 'Daarom stopt het werk niet bij de eerste verkoop. Een klant die tevreden blijft en HomeCheff blijft gebruiken, kan ook later waarde houden binnen je portefeuille. Nazorg garandeert niet dat iemand blijft.'}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-900">
          {en ? 'What a larger result would require' : 'Wat een groter resultaat zou vragen'}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {en
            ? 'With a large, successful portfolio, scenarios of thousands of euros a month can appear. Look at what it would take to move toward €3,000, €10,000 or €20,000 a month in qualifying commission.'
            : 'Bij een grote, succesvolle portefeuille kunnen ook scenario’s van duizenden euro’s per maand ontstaan. Bekijk wat er bijvoorbeeld nodig zou zijn om richting €3.000, €10.000 of €20.000 per maand aan kwalificerende commissie te bouwen.'}
        </p>
        <ul className="mt-3 space-y-2 text-sm text-slate-800">
          {SCALE_TARGET_EUR.map((target) => {
            const need = growthStarterCustomersForMonthlyTarget(target);
            return (
              <li key={target} className="rounded-xl bg-slate-50 px-3 py-2">
                {en
                  ? `About €${target.toLocaleString('en-GB')} / month from Growth Starter alone: ${need.customers} active qualifying customers × ${eur(need.perCustomerCents)}.`
                  : `Ongeveer €${target.toLocaleString('nl-NL')} / maand uit alleen Growth Starter: ${need.customers} actieve kwalificerende klanten × ${eur(need.perCustomerCents)}.`}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          {en
            ? 'The examples are scenarios, not an income promise. Your result depends on your sales, active customers, product use and the current commission rules.'
            : 'De voorbeelden zijn scenario’s, geen inkomensbelofte. Je resultaat hangt af van je verkoop, actieve klanten, productgebruik en de geldende commissieregels.'}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-900">
          {en ? 'Try the assumptions' : 'Bekijk de aannames'}
        </h2>
        <PortfolioExplorer lang={lang} />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-900">
          {en ? 'See what you can earn' : 'Bekijk wat je kunt verdienen'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          {en
            ? `These amounts are the public program for a new affiliate: ${programName}. An affiliate who already joined keeps the program they enrolled in.`
            : `Deze bedragen horen bij het openbare programma voor een nieuwe affiliate: ${programName}. Een affiliate die al is ingestapt, houdt het programma waarin die is ingeschreven.`}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          {en
            ? 'High commission is useful. Customer fit matters more for a portfolio that lasts. Each card says who it suits.'
            : 'Hoge commissie is nuttig. Of het product bij de klant past, telt meer voor een portefeuille die blijft. Op elke kaart staat voor wie het bedoeld is.'}
        </p>
        <div className="mt-4">
          <AffiliateCommissionCatalog rows={catalog} lang={lang} />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-900">
          {en ? 'What a seller keeps' : 'Wat een verkoper overhoudt'}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {en
            ? 'Same fee as the affiliate catalog. Private seller rate. The seller keeps the price minus the platform fee. Affiliate commission is paid from that fee.'
            : 'Dezelfde fee als in de affiliatecatalogus. Particulier tarief. De verkoper houdt de prijs min de platformfee over. Affiliatecommissie komt uit die fee.'}
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {sales.map((sale) => (
            <li key={sale.saleCents} className="rounded-xl border border-slate-200 px-3 py-2">
              {en
                ? `Sale ${eur(sale.saleCents)}: fee ${eur(sale.platformFeeCents)}, seller keeps ${eur(sale.sellerProceedsCents)}. One affiliate ${eur(sale.singleAffiliate.viewerCommissionCents)}. Two affiliates ${eur(sale.twoAffiliates.viewerCommissionCents)} + ${eur(sale.twoAffiliates.otherCommissionCents)}.`
                : `Verkoop ${eur(sale.saleCents)}: fee ${eur(sale.platformFeeCents)}, verkoper houdt ${eur(sale.sellerProceedsCents)}. Eén affiliate ${eur(sale.singleAffiliate.viewerCommissionCents)}. Twee affiliates ${eur(sale.twoAffiliates.viewerCommissionCents)} + ${eur(sale.twoAffiliates.otherCommissionCents)}.`}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-900">
          {en ? 'Your own tools' : 'Je eigen hulpmiddelen'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          {en
            ? 'You get tools to win your own customers: your affiliate link, promo codes for Growth and Marketplace business subscriptions, and a promo library in your dashboard. Not every product has a promo code.'
            : 'Je krijgt hulpmiddelen om je eigen klanten te werven: je affiliatelink, actiecodes voor Growth en zakelijke Marketplace-abonnementen, en een promotiebibliotheek in je dashboard. Niet elk product heeft een actiecode.'}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-900">
          {en ? 'Own customers and network' : 'Eigen klanten en netwerk'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          {en ? NETWORK_CAPABILITY.publicNoteEn : NETWORK_CAPABILITY.publicNoteNl}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          {en
            ? `On a Growth Starter customer the direct share is ${eur(share.directCents)}. Where MAIN/SUB applies, the sub share is ${eur(share.subCents)} and the main share is ${eur(share.mainCents)}. The calculator keeps those lines separate.`
            : `Op een Growth Starter-klant is het directe aandeel ${eur(share.directCents)}. Waar MAIN/SUB geldt, is het sub-aandeel ${eur(share.subCents)} en het main-aandeel ${eur(share.mainCents)}. De rekenhulp houdt die regels apart.`}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-900">
          {en ? 'Build HomeCheff in your country?' : 'HomeCheff in jouw land opbouwen?'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          {en
            ? 'Do you live or work in a country where HomeCheff is not fully active yet? You can register your interest. Strong local affiliates can play an important role in opening a new market.'
            : 'Woon of werk je in een land waar HomeCheff nog niet volledig actief is? Dan kun je je interesse doorgeven. Sterke lokale affiliates kunnen een belangrijke rol spelen bij het opbouwen van een nieuwe markt.'}
        </p>
        <AffiliateCountryInterestForm lang={lang} />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-900">{en ? 'Questions' : 'Vragen'}</h2>
        <div className="mt-3 space-y-3">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">{faq.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
