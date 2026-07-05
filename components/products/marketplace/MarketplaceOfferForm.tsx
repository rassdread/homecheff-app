'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import SimpleImageUploader from '@/components/products/SimpleImageUploader';
import VideoUploader from '@/components/ui/VideoUploader';
import DynamicAddressFields, { type AddressData } from '@/components/ui/DynamicAddressFields';
import PaymentMethodCheckboxes from '@/components/products/marketplace/PaymentMethodCheckboxes';
import FulfillmentCheckboxes from '@/components/products/marketplace/FulfillmentCheckboxes';
import {
  defaultFulfillmentForCategory,
  legacyUrlCategoryToMarketplace,
  normalizeSpecializations,
  primarySpecialization,
  PRICE_MODELS,
  type FulfillmentOptions,
  type ListingIntentValue,
} from '@/lib/marketplace/listing-taxonomy';
import {
  MARKETPLACE_ENTRY_CATEGORY_KEY,
  MARKETPLACE_ERROR_KEYS,
  PRICE_MODEL_KEY,
  specializationI18nKey,
} from '@/lib/marketplace/i18n-keys';
import AcceptedValuesPicker from '@/components/products/marketplace/AcceptedValuesPicker';
import { TaxonomyLucideIcon } from '@/components/products/marketplace/TaxonomyLucideIcon';
import StripeConnectPaymentsBanner from '@/components/seller/StripeConnectPaymentsBanner';
import { normalizeAcceptedTaxonomyIds } from '@/lib/marketplace/taxonomy-normalize';
import { getMarketplaceTaxonomyItem } from '@/lib/marketplace/taxonomy-resolve';
import { fulfillmentOptionsToApiString } from '@/lib/marketplace/fulfillment';
import {
  formFieldsForCategory,
  priceRequiredForModel,
} from '@/lib/marketplace/form-config';
import {
  productHasUsableLocation,
  validateProductLocationForPublish,
} from '@/lib/geo/product-location-requirements';
import { fulfillmentIsDigitalOnly } from '@/lib/marketplace/listing-taxonomy';
import type { MarketplaceCategory, PriceModel } from '@prisma/client';
import { tryShowAccountRequirementsFromApiBody } from '@/lib/client/consume-account-requirements-response';
import { useHcpRewardUi } from '@/components/gamification/HcpRewardProvider';
import { getProfileHrefAfterProductSave } from '@/lib/profileProductTab';
import { useTranslation } from '@/hooks/useTranslation';

type Uploaded = { url: string; uploading?: boolean; error?: string };

type Props = {
  editMode?: boolean;
  existingProduct?: Record<string, unknown> | null;
  onSave?: (product: unknown) => void;
  onCancel?: () => void;
  initialPhoto?: string;
  initialLegacyCategory?: 'CHEFF' | 'GARDEN' | 'DESIGNER';
  /** V3 entry flow — pre-filled from MarketplaceEntryFlow */
  initialListingIntent?: ListingIntentValue;
  initialMarketplaceCategory?: MarketplaceCategory;
  initialSpecializations?: string[];
  onRestartEntry?: () => void;
};

export default function MarketplaceOfferForm({
  editMode = false,
  existingProduct = null,
  onSave,
  onCancel,
  initialPhoto,
  initialLegacyCategory = 'CHEFF',
  initialListingIntent,
  initialMarketplaceCategory,
  initialSpecializations = [],
  onRestartEntry,
}: Props) {
  const { data: session } = useSession();
  const { showHcpRewardToast } = useHcpRewardUi();
  const { t } = useTranslation();

  const resolvedCategory =
    initialMarketplaceCategory ??
    legacyUrlCategoryToMarketplace(initialLegacyCategory);

  const [listingIntent, setListingIntent] = useState<ListingIntentValue>(
    initialListingIntent ?? 'OFFER',
  );
  const [marketplaceCategory, setMarketplaceCategory] =
    useState<MarketplaceCategory>(resolvedCategory);
  const [specializations, setSpecializations] = useState<string[]>(
    initialSpecializations,
  );
  const [acceptedSpecializations, setAcceptedSpecializations] = useState<string[]>(
    [],
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceModel, setPriceModel] = useState<PriceModel>('FIXED');
  const [acceptHomeCheffPayment, setAcceptHomeCheffPayment] = useState(true);
  const [acceptDirectContact, setAcceptDirectContact] = useState(false);
  const [fulfillment, setFulfillment] = useState<FulfillmentOptions>(() =>
    defaultFulfillmentForCategory(resolvedCategory),
  );
  const [sellerCanDeliver, setSellerCanDeliver] = useState(false);
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState('5');
  const [useProfileLocation, setUseProfileLocation] = useState(true);
  const [placeName, setPlaceName] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [profilePlace, setProfilePlace] = useState<string | null>(null);
  const [profileCity, setProfileCity] = useState<string | null>(null);
  const [profileLat, setProfileLat] = useState<number | null>(null);
  const [profileLng, setProfileLng] = useState<number | null>(null);
  const [stock, setStock] = useState('1');
  const [maxStock, setMaxStock] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<Uploaded[]>(
    initialPhoto ? [{ url: initialPhoto }] : [],
  );
  const [video, setVideo] = useState<{
    url: string;
    thumbnail?: string | null;
    duration?: number | null;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fieldConfig = useMemo(
    () =>
      formFieldsForCategory(
        marketplaceCategory,
        specializations,
        primarySpecialization(specializations),
      ),
    [marketplaceCategory, specializations],
  );

  const digitalOnly = fulfillmentIsDigitalOnly(fulfillment);
  const locationRequired =
    isActive && !digitalOnly && (listingIntent === 'OFFER');

  useEffect(() => {
    if (!session?.user) return;
    void fetch('/api/profile/me')
      .then((r) => r.json())
      .then((data) => {
        const u = data?.user ?? data;
        if (!u) return;
        setProfilePlace(u.place ?? u.city ?? null);
        setProfileCity(u.city ?? null);
        setProfileLat(u.lat ?? null);
        setProfileLng(u.lng ?? null);
        if (!placeName && (u.place || u.city)) {
          setPlaceName(String(u.place || u.city || ''));
        }
        if (useProfileLocation && u.address) {
          setPickupAddress(String(u.address));
          if (u.lat != null) setPickupLat(Number(u.lat));
          if (u.lng != null) setPickupLng(Number(u.lng));
        }
      })
      .catch(() => undefined);
  }, [session?.user, useProfileLocation, placeName]);

  useEffect(() => {
    if (!editMode || !existingProduct) return;
    setTitle(String(existingProduct.title ?? ''));
    setDescription(String(existingProduct.description ?? ''));
    const specs = normalizeSpecializations(
      existingProduct.specializations ??
        (existingProduct.subcategory ? [existingProduct.subcategory] : []),
      (existingProduct.marketplaceCategory as MarketplaceCategory) ?? marketplaceCategory,
    );
    setSpecializations(specs);
    setAcceptedSpecializations(
      normalizeAcceptedTaxonomyIds(existingProduct.acceptedSpecializations ?? []),
    );
    if (existingProduct.listingIntent) {
      setListingIntent(existingProduct.listingIntent as ListingIntentValue);
    }
    if (existingProduct.marketplaceCategory) {
      setMarketplaceCategory(existingProduct.marketplaceCategory as MarketplaceCategory);
    }
    if (existingProduct.priceCents != null) {
      setPrice(String(Number(existingProduct.priceCents) / 100));
    }
  }, [editMode, existingProduct, marketplaceCategory]);

  const resolveLocationPayload = () => {
    if (digitalOnly) {
      return {
        pickupAddress: null as string | null,
        pickupLat: null as number | null,
        pickupLng: null as number | null,
        placeName: placeName.trim() || null,
      };
    }
    if (useProfileLocation) {
      return {
        pickupAddress: pickupAddress.trim() || profilePlace || profileCity || null,
        pickupLat: pickupLat ?? profileLat,
        pickupLng: pickupLng ?? profileLng,
        placeName: placeName.trim() || profilePlace || profileCity || null,
      };
    }
    return {
      pickupAddress: pickupAddress.trim() || null,
      pickupLat: pickupLat,
      pickupLng: pickupLng,
      placeName: placeName.trim() || null,
    };
  };

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!acceptHomeCheffPayment && !acceptDirectContact) {
      setMessage(t(MARKETPLACE_ERROR_KEYS.paymentMethodRequired));
      return;
    }
    if (!title.trim() || !description.trim()) {
      setMessage(t(MARKETPLACE_ERROR_KEYS.titleDescriptionRequired));
      return;
    }
    if (images.length === 0 || images.some((i) => i.uploading)) {
      setMessage(t(MARKETPLACE_ERROR_KEYS.photosRequired));
      return;
    }

    const priceNum = price.trim() ? Number(price.replace(',', '.')) : 0;
    let priceCents = 0;
    if (priceModel === 'ON_REQUEST' || priceModel === 'VOLUNTARY') {
      priceCents = 0;
    } else if (priceRequiredForModel(priceModel)) {
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        if (acceptHomeCheffPayment) {
          setMessage(t(MARKETPLACE_ERROR_KEYS.invalidPrice));
          return;
        }
      } else {
        priceCents = Math.round(priceNum * 100);
      }
    } else if (Number.isFinite(priceNum) && priceNum > 0) {
      priceCents = Math.round(priceNum * 100);
    }

    const loc = resolveLocationPayload();
    if (locationRequired) {
      if (!loc.placeName) {
        setMessage(t(MARKETPLACE_ERROR_KEYS.placeNameRequired));
        return;
      }
      const locCheck = validateProductLocationForPublish({
        pickupAddress: loc.pickupAddress,
        pickupLat: loc.pickupLat,
        pickupLng: loc.pickupLng,
        seller: {
          User: {
            place: loc.placeName,
            city: loc.placeName,
            lat: loc.pickupLat,
            lng: loc.pickupLng,
          },
        },
      });
      if (!locCheck.ok) {
        setMessage(t(MARKETPLACE_ERROR_KEYS.locationRequired));
        return;
      }
      if (
        !productHasUsableLocation({
          pickupAddress: loc.pickupAddress,
          pickupLat: loc.pickupLat,
          pickupLng: loc.pickupLng,
          seller: {
            User: { place: loc.placeName, city: loc.placeName },
          },
        })
      ) {
        setMessage(t(MARKETPLACE_ERROR_KEYS.locationRequired));
        return;
      }
    }

    const imageUrls = images
      .filter((i) => i.url?.trim() && !i.uploading)
      .map((i) => i.url.trim());

    const payload = {
      title: title.trim(),
      description: description.trim(),
      priceCents,
      priceModel,
      listingIntent,
      marketplaceCategory,
      specializations,
      acceptedSpecializations,
      subcategory: primarySpecialization(specializations),
      acceptHomeCheffPayment,
      acceptDirectContact,
      fulfillmentOptions: fulfillment,
      deliveryMode: fulfillmentOptionsToApiString(fulfillment),
      sellerCanDeliver: fulfillment.delivery ? sellerCanDeliver : false,
      deliveryRadiusKm: fulfillment.delivery ? Number(deliveryRadiusKm) || 5 : null,
      useProfileLocation,
      placeName: loc.placeName,
      pickupAddress: loc.pickupAddress,
      pickupLat: loc.pickupLat,
      pickupLng: loc.pickupLng,
      stock: fieldConfig.showStock ? Number(stock) || 0 : 0,
      maxStock: fieldConfig.showMaxStock && maxStock ? Number(maxStock) : null,
      isActive,
      images: imageUrls,
      video,
      category: marketplaceCategory === 'GROW' ? 'GARDEN' : marketplaceCategory === 'DESIGN' || marketplaceCategory === 'ARTISTIC_SERVICE' ? 'DESIGNER' : 'CHEFF',
    };

    setBusy(true);
    try {
      const url = editMode && existingProduct?.id
        ? `/api/products/${existingProduct.id}`
        : '/api/products/create';
      const method = editMode ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (tryShowAccountRequirementsFromApiBody(data)) return;
        const errKey =
          typeof data.errorKey === 'string' ? data.errorKey : null;
        const detailsKey =
          typeof data.detailsKey === 'string' ? data.detailsKey : null;
        setMessage(
          detailsKey
            ? t(detailsKey)
            : errKey
              ? t(errKey)
              : typeof data.error === 'string'
                ? data.error
                : t(MARKETPLACE_ERROR_KEYS.saveFailed),
        );
        return;
      }
      if (data.hcpReward) showHcpRewardToast(data.hcpReward);
      if (data.publishBlocked && data.publishBlockReason === 'PAYMENTS_REQUIRED') {
        setMessage(t('marketplace.stripeRecommendation.message'));
      }
      onSave?.(data.product ?? data);
      if (!editMode && data.product?.id) {
        window.location.href = getProfileHrefAfterProductSave(data.product.id);
      }
    } catch {
      setMessage(t(MARKETPLACE_ERROR_KEYS.saveFailed));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void validateAndSubmit(e)} className="space-y-6">
      {!editMode ? (
        <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-900">
          <span className="font-medium">
            {listingIntent === 'REQUEST'
              ? t('marketplace.summary.request')
              : t('marketplace.summary.offer')}
          </span>
          {' · '}
          <span className="font-medium">
            {t(MARKETPLACE_ENTRY_CATEGORY_KEY[marketplaceCategory])}
          </span>
          {specializations.length > 0 ? (
            <span className="ml-1 inline-flex flex-wrap items-center gap-1">
              {' · '}
              {specializations.map((id) => {
                const item = getMarketplaceTaxonomyItem(id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-0.5"
                  >
                    <TaxonomyLucideIcon
                      name={item?.icon ?? 'Tag'}
                      className="h-3.5 w-3.5"
                    />
                    {t(specializationI18nKey(marketplaceCategory, id))}
                  </span>
                );
              })}
            </span>
          ) : null}
          {onRestartEntry ? (
            <button
              type="button"
              className="ml-2 text-emerald-700 underline text-xs"
              onClick={onRestartEntry}
            >
              {t('marketplace.summary.edit')}
            </button>
          ) : null}
        </div>
      ) : null}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('marketplace.form.videoLabel')}
        </label>
        <p className="text-xs text-gray-500 mb-2">
          {t('marketplace.form.videoHint')}
        </p>
        <VideoUploader
          value={video}
          onChange={setVideo}
          maxDuration={30}
          uploadContext="dish"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('marketplace.form.photosLabel')}
        </label>
        <SimpleImageUploader
          value={images}
          onChange={setImages}
          max={5}
          category="CHEFF"
        />
      </div>

      <PaymentMethodCheckboxes
        acceptHomeCheffPayment={acceptHomeCheffPayment}
        acceptDirectContact={acceptDirectContact}
        onChange={({ acceptHomeCheffPayment: hc, acceptDirectContact: dc }) => {
          setAcceptHomeCheffPayment(hc);
          setAcceptDirectContact(dc);
        }}
      />

      {acceptHomeCheffPayment && priceModel !== 'ON_REQUEST' && priceModel !== 'VOLUNTARY' ? (
        <StripeConnectPaymentsBanner />
      ) : null}

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {t('marketplace.priceModel.heading')}
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {PRICE_MODELS.map((model) => (
            <label
              key={model}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 cursor-pointer"
            >
              <input
                type="radio"
                name="priceModel"
                checked={priceModel === model}
                onChange={() => setPriceModel(model)}
              />
              <span className="text-sm">{t(PRICE_MODEL_KEY[model])}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('marketplace.form.titleLabel')}
          </label>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('marketplace.form.priceLabel')}
          </label>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            placeholder={
              priceModel === 'ON_REQUEST'
                ? t('marketplace.form.pricePlaceholderOptional')
                : t('marketplace.form.pricePlaceholderExample')
            }
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('marketplace.form.descriptionLabel')}
        </label>
        <textarea
          className="w-full rounded-lg border border-gray-300 px-3 py-2 h-24 resize-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <FulfillmentCheckboxes value={fulfillment} onChange={setFulfillment} />

      <AcceptedValuesPicker
        value={acceptedSpecializations}
        onChange={setAcceptedSpecializations}
      />

      {fulfillment.delivery ? (
        <div className="rounded-lg border border-gray-200 p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sellerCanDeliver}
              onChange={(e) => setSellerCanDeliver(e.target.checked)}
            />
            {t('marketplace.fulfillment.sellerCanDeliver')}
          </label>
          {sellerCanDeliver ? (
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                {t('marketplace.fulfillment.deliveryRadiusKm')}
              </label>
              <input
                type="number"
                min={1}
                max={50}
                className="w-24 rounded border border-gray-300 px-2 py-1"
                value={deliveryRadiusKm}
                onChange={(e) => setDeliveryRadiusKm(e.target.value)}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {!digitalOnly ? (
        <div className="rounded-lg border border-gray-200 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">
            {t('marketplace.form.locationHeading')}
          </h3>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              {t('marketplace.form.placeNameLabel')}{' '}
              <span className="text-red-500">
                {t('marketplace.form.placeNameRequired')}
              </span>
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              placeholder={t('marketplace.form.placeNamePlaceholder')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={useProfileLocation}
                onChange={() => setUseProfileLocation(true)}
              />
              {t('marketplace.form.useProfileAddress')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={!useProfileLocation}
                onChange={() => setUseProfileLocation(false)}
              />
              {t('marketplace.form.useCustomAddress')}
            </label>
          </div>
          {!useProfileLocation ? (
            <DynamicAddressFields
              value={{
                address: pickupAddress,
                lat: pickupLat ?? undefined,
                lng: pickupLng ?? undefined,
              }}
              onChange={(data: AddressData) => {
                setPickupAddress(data.address ?? '');
                setPickupLat(data.lat ?? null);
                setPickupLng(data.lng ?? null);
              }}
              geocodingEnabled
            />
          ) : (
            <p className="text-xs text-gray-500">
              {pickupAddress || profilePlace || profileCity
                ? t('marketplace.form.profileAddressLoaded', {
                    address: pickupAddress || profilePlace || profileCity || '',
                  })
                : t('marketplace.form.profileAddressLoading')}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500">
          {t('marketplace.form.locationOptionalDigital')}
        </p>
      )}

      {fieldConfig.showStock ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t(fieldConfig.stockLabelKey)}
            </label>
            <input
              type="number"
              min={0}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>
          {fieldConfig.showMaxStock ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('marketplace.form.maxStock')}
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                value={maxStock}
                onChange={(e) => setMaxStock(e.target.value)}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        {t('marketplace.form.publishLive')}
      </label>

      {message ? (
        <p className="text-sm text-red-600" role="alert">
          {message}
        </p>
      ) : null}

      <div className="flex gap-3 pt-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium"
          >
            {t('marketplace.form.cancel')}
          </button>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          ) : editMode ? (
            t('marketplace.form.save')
          ) : (
            t('marketplace.form.submit')
          )}
        </button>
      </div>
    </form>
  );
}
