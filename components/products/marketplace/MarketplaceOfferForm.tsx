'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import SimpleImageUploader from '@/components/products/SimpleImageUploader';
import VideoUploader from '@/components/ui/VideoUploader';
import { ListingPhotoVideoBlock } from '@/components/products/marketplace/ListingPhotoVideoBlock';
import DynamicAddressFields, { type AddressData } from '@/components/ui/DynamicAddressFields';
import { PlaceResolveFeedback } from '@/components/geo/PlaceResolveFeedback';
import { usePlaceAutoResolve } from '@/hooks/usePlaceAutoResolve';
import PaymentMethodCheckboxes from '@/components/products/marketplace/PaymentMethodCheckboxes';
import FulfillmentCheckboxes from '@/components/products/marketplace/FulfillmentCheckboxes';
import {
  defaultFulfillmentForCategory,
  legacyUrlCategoryToMarketplace,
  normalizeSpecializations,
  parseFulfillmentOptions,
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
import BarterOpennessSelector from '@/components/products/marketplace/BarterOpennessSelector';
import TaxonomySpecializationPicker from '@/components/products/marketplace/TaxonomySpecializationPicker';
import { TaxonomyLucideIcon } from '@/components/products/marketplace/TaxonomyLucideIcon';
import SettlementConnectGuidance from '@/components/products/marketplace/SettlementConnectGuidance';
import { normalizeAcceptedTaxonomyIds } from '@/lib/marketplace/taxonomy-normalize';
import { getMarketplaceTaxonomyItem } from '@/lib/marketplace/taxonomy-resolve';
import { fulfillmentOptionsToApiString } from '@/lib/marketplace/fulfillment';
import {
  formFieldsForCategory,
  priceRequiredForModel,
} from '@/lib/marketplace/form-config';
import {
  validateProductLocationForPublish,
} from '@/lib/geo/product-location-requirements';
import { fulfillmentIsDigitalOnly } from '@/lib/marketplace/listing-taxonomy';
import {
  barterOpennessRequiresAcceptedValues,
  resolveBarterOpennessForFormPrefill,
  resolveBarterOpennessForSave,
  suggestBarterOpennessAfterAcceptedValuesChange,
  type BarterOpennessValue,
} from '@/lib/marketplace/resolve-barter-openness-for-save';
import type { MarketplaceCategory, PriceModel } from '@prisma/client';
import { tryShowAccountRequirementsFromApiBody } from '@/lib/client/consume-account-requirements-response';
import { useHcpRewardUi } from '@/components/gamification/HcpRewardProvider';
import { getProfileHrefAfterProductSave } from '@/lib/profileProductTab';
import { useTranslation } from '@/hooks/useTranslation';
import {
  clearPx4aItemFormDraft,
  readPx4aItemFormDraft,
  shouldRestorePx4aItemFormDraft,
  writePx4aItemFormDraft,
} from '@/lib/studio/px4a-item-form-draft';
import {
  clearPx4aExportVideo,
  readPx4aExportVideo,
} from '@/lib/studio/px4a-export-attach';
import { attachPx4aExportVideo } from '@/lib/studio/px4a-listing-video-upload';
import { resolveSettlementOptions } from '@/lib/marketplace/settlement/settlement-options';
import { offerRequiresCommerceDeclaration } from '@/lib/legal/commerce-declaration-gate';
import CommerceDeclarationModal, {
  type CommerceDeclarationChoice,
} from '@/components/legal/CommerceDeclarationModal';
import FoodAllergenSelector from '@/components/legal/FoodAllergenSelector';
import { productRequiresAllergenConfirmation } from '@/lib/legal/food-allergen-applicability';
import type { EuFoodAllergenId } from '@/lib/legal/eu-food-allergens';
import { sanitizeEuFoodAllergenIds } from '@/lib/legal/eu-food-allergens';
import SellerContributionSelector from '@/components/trust/SellerContributionSelector';
import {
  contributionRequiredForPublish,
  parseSellerContributionTypes,
  suggestedContributionTypes,
  type SellerContributionType,
} from '@/lib/trust/seller-contribution';

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
  const [barterOpenness, setBarterOpenness] = useState<BarterOpennessValue>('MONEY');
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
  const [coordsSource, setCoordsSource] = useState<
    'none' | 'place' | 'address' | 'profile'
  >('none');
  const [profilePlace, setProfilePlace] = useState<string | null>(null);
  const [profileCity, setProfileCity] = useState<string | null>(null);
  const [profileLat, setProfileLat] = useState<number | null>(null);
  const [profileLng, setProfileLng] = useState<number | null>(null);
  const [profileCountry, setProfileCountry] = useState<string>('NL');
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
  const [commerceDeclarationKnown, setCommerceDeclarationKnown] = useState<
    string | null
  >(null);
  const [commerceModalOpen, setCommerceModalOpen] = useState(false);
  const [commerceBusy, setCommerceBusy] = useState(false);
  const [commerceError, setCommerceError] = useState<string | null>(null);
  const [allergens, setAllergens] = useState<EuFoodAllergenId[]>([]);
  const [allergensConfirmed, setAllergensConfirmed] = useState(false);
  const [sellerContributionTypes, setSellerContributionTypes] = useState<
    SellerContributionType[]
  >([]);
  const [sellerContributionNote, setSellerContributionNote] = useState('');
  const [madeToConsumerSpecifications, setMadeToConsumerSpecifications] =
    useState(false);
  const [rapidlyPerishable, setRapidlyPerishable] = useState(false);
  const [exportPending, setExportPending] = useState(false);
  const exportAttachStarted = React.useRef(false);

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
        setProfileLat(u.lat != null ? Number(u.lat) : null);
        setProfileLng(u.lng != null ? Number(u.lng) : null);
        if (u.country) setProfileCountry(String(u.country));
        if (!placeName && (u.place || u.city)) {
          setPlaceName(String(u.place || u.city || ''));
        }
        if (useProfileLocation && u.address) {
          setPickupAddress(String(u.address));
        }
        if (
          useProfileLocation &&
          u.lat != null &&
          u.lng != null &&
          Number.isFinite(Number(u.lat)) &&
          Number.isFinite(Number(u.lng))
        ) {
          setPickupLat(Number(u.lat));
          setPickupLng(Number(u.lng));
          setCoordsSource('profile');
        }
      })
      .catch(() => undefined);
  }, [session?.user, useProfileLocation, placeName]);

  useEffect(() => {
    if (editMode || typeof window === 'undefined') return;
    const pendingExport = readPx4aExportVideo();
    if (!shouldRestorePx4aItemFormDraft() && !pendingExport) return;
    setExportPending(Boolean(pendingExport));
    const snap = readPx4aItemFormDraft();
    if (snap) {
      setListingIntent(snap.listingIntent as ListingIntentValue);
      setMarketplaceCategory(snap.marketplaceCategory as MarketplaceCategory);
      setSpecializations(snap.specializations);
      setAcceptedSpecializations(snap.acceptedSpecializations);
      setBarterOpenness(snap.barterOpenness as BarterOpennessValue);
      setTitle(snap.title);
      setDescription(snap.description);
      setPrice(snap.price);
      setPriceModel(snap.priceModel as PriceModel);
      setAcceptHomeCheffPayment(snap.acceptHomeCheffPayment);
      setAcceptDirectContact(snap.acceptDirectContact);
      if (snap.fulfillment && typeof snap.fulfillment === 'object') {
        setFulfillment(snap.fulfillment as FulfillmentOptions);
      }
      setSellerCanDeliver(snap.sellerCanDeliver);
      setDeliveryRadiusKm(snap.deliveryRadiusKm);
      setUseProfileLocation(snap.useProfileLocation);
      setPlaceName(snap.placeName);
      setPickupAddress(snap.pickupAddress);
      setPickupLat(snap.pickupLat);
      setPickupLng(snap.pickupLng);
      setCoordsSource(snap.coordsSource as typeof coordsSource);
      setStock(snap.stock);
      setMaxStock(snap.maxStock);
      setIsActive(snap.isActive);
      setImages(snap.images.map((image) => ({ url: image.url })));
      setVideo(snap.video);
      setAllergens(snap.allergens as EuFoodAllergenId[]);
      setAllergensConfirmed(snap.allergensConfirmed);
      setSellerContributionTypes(snap.sellerContributionTypes as SellerContributionType[]);
      setSellerContributionNote(snap.sellerContributionNote);
      setMadeToConsumerSpecifications(snap.madeToConsumerSpecifications);
      setRapidlyPerishable(snap.rapidlyPerishable);
    }
    if (pendingExport && !exportAttachStarted.current) {
      exportAttachStarted.current = true;
      void attachPx4aExportVideo(pendingExport)
        .then((next) => {
          setVideo(next);
          clearPx4aExportVideo();
          setExportPending(false);
          if (snap) {
            writePx4aItemFormDraft({
              ...snap,
              images: snap.images.map((image) => ({ url: image.url })),
              video: next,
            });
          }
        })
        .catch(() => {
          setExportPending(false);
          setMessage(t('marketplace.form.videoExportAttachError'));
        });
    }
  }, [editMode, t]);

  const persistItemDraft = (): boolean => {
    if (images.some((image) => image.uploading)) {
      return false;
    }
    return writePx4aItemFormDraft({
      listingIntent,
      marketplaceCategory,
      specializations,
      acceptedSpecializations,
      barterOpenness,
      title,
      description,
      price,
      priceModel,
      acceptHomeCheffPayment,
      acceptDirectContact,
      fulfillment,
      sellerCanDeliver,
      deliveryRadiusKm,
      useProfileLocation,
      placeName,
      pickupAddress,
      pickupLat,
      pickupLng,
      coordsSource,
      stock,
      maxStock,
      isActive,
      images: images.map((image) => ({ url: image.url })),
      video,
      allergens,
      allergensConfirmed,
      sellerContributionTypes,
      sellerContributionNote,
      madeToConsumerSpecifications,
      rapidlyPerishable,
    });
  };

  const profileHasCoords =
    profileLat != null &&
    profileLng != null &&
    Number.isFinite(profileLat) &&
    Number.isFinite(profileLng) &&
    !(profileLat === 0 && profileLng === 0);

  const placeAutoResolveEnabled =
    !digitalOnly &&
    locationRequired &&
    placeName.trim().length >= 2 &&
    coordsSource !== 'address' &&
    (!useProfileLocation || !profileHasCoords);

  const { state: placeResolveState, selectCandidate } = usePlaceAutoResolve({
    query: placeName,
    countryCode: profileCountry || 'NL',
    enabled: placeAutoResolveEnabled,
    onInvalidate: () => {
      // Changing place must never keep stale coordinates.
      setPickupLat(null);
      setPickupLng(null);
      setCoordsSource('none');
      if (!useProfileLocation) {
        setPickupAddress('');
      }
    },
    onResolved: (result) => {
      setPickupLat(result.lat);
      setPickupLng(result.lng);
      setCoordsSource('place');
    },
  });

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
    const normalizedAccepted = normalizeAcceptedTaxonomyIds(
      existingProduct.acceptedSpecializations ?? [],
    );
    setAcceptedSpecializations(normalizedAccepted);
    setBarterOpenness(
      resolveBarterOpennessForFormPrefill(
        existingProduct.barterOpenness,
        normalizedAccepted,
      ),
    );
    const settlementPrefill = resolveSettlementOptions({
      acceptHomeCheffPayment:
        existingProduct.acceptHomeCheffPayment as boolean | null | undefined,
      acceptDirectContact:
        existingProduct.acceptDirectContact as boolean | null | undefined,
      orderMethod: existingProduct.orderMethod as string | null | undefined,
      priceCents: existingProduct.priceCents as number | null | undefined,
      priceModel: existingProduct.priceModel as string | null | undefined,
      listingIntent: existingProduct.listingIntent as string | null | undefined,
    });
    setAcceptHomeCheffPayment(settlementPrefill.acceptsHomeCheffCheckout);
    setAcceptDirectContact(settlementPrefill.acceptsDirectContact);
    if (existingProduct.listingIntent) {
      setListingIntent(existingProduct.listingIntent as ListingIntentValue);
    }
    if (existingProduct.marketplaceCategory) {
      setMarketplaceCategory(existingProduct.marketplaceCategory as MarketplaceCategory);
    } else if (existingProduct.category) {
      setMarketplaceCategory(
        legacyUrlCategoryToMarketplace(
          String(existingProduct.category) as 'CHEFF' | 'GARDEN' | 'DESIGNER',
        ),
      );
    }
    if (existingProduct.priceCents != null) {
      setPrice(String(Number(existingProduct.priceCents) / 100));
    }
    if (existingProduct.priceModel) {
      setPriceModel(existingProduct.priceModel as PriceModel);
    }
    if (existingProduct.stock != null) {
      setStock(String(existingProduct.stock));
    }
    if (existingProduct.maxStock != null) {
      setMaxStock(String(existingProduct.maxStock));
    }
    if (existingProduct.isActive != null) {
      setIsActive(Boolean(existingProduct.isActive));
    }
    if (existingProduct.sellerCanDeliver != null) {
      setSellerCanDeliver(Boolean(existingProduct.sellerCanDeliver));
    }
    if (existingProduct.deliveryRadiusKm != null) {
      setDeliveryRadiusKm(String(existingProduct.deliveryRadiusKm));
    }
    if (existingProduct.placeName) {
      setPlaceName(String(existingProduct.placeName));
    }
    if (existingProduct.useProfileLocation != null) {
      setUseProfileLocation(Boolean(existingProduct.useProfileLocation));
    }
    if (existingProduct.pickupAddress) {
      setPickupAddress(String(existingProduct.pickupAddress));
    }
    if (existingProduct.pickupLat != null) {
      setPickupLat(Number(existingProduct.pickupLat));
      setCoordsSource('place');
    }
    if (existingProduct.pickupLng != null) {
      setPickupLng(Number(existingProduct.pickupLng));
    }
    if (existingProduct.fulfillmentOptions) {
      setFulfillment(
        parseFulfillmentOptions(existingProduct.fulfillmentOptions) as FulfillmentOptions,
      );
    } else if (existingProduct.deliveryMode) {
      const dm = String(existingProduct.deliveryMode).toUpperCase();
      setFulfillment({
        pickup: dm === 'PICKUP' || dm === 'BOTH',
        delivery: dm === 'DELIVERY' || dm === 'BOTH',
        shipping: false,
        digital: false,
        onSiteClient: false,
        onSiteProvider: false,
      });
    }
    const imgs = existingProduct.Image ?? existingProduct.images;
    if (Array.isArray(imgs) && imgs.length > 0) {
      setImages(
        imgs.map((img: { fileUrl?: string; url?: string }) => ({
          url: String(img.fileUrl ?? img.url ?? ''),
        })),
      );
    }
    const vid = existingProduct.Video ?? existingProduct.video;
    if (vid && typeof vid === 'object' && 'url' in vid) {
      setVideo({
        url: String((vid as { url: string }).url),
        thumbnail: (vid as { thumbnail?: string }).thumbnail ?? null,
      });
    }
    if (existingProduct.allergensConfirmedAt) {
      setAllergens(sanitizeEuFoodAllergenIds(existingProduct.allergens));
      setAllergensConfirmed(true);
    } else {
      setAllergens(sanitizeEuFoodAllergenIds(existingProduct.allergens));
      setAllergensConfirmed(false);
    }
    setSellerContributionTypes(
      parseSellerContributionTypes(existingProduct.sellerContributionTypes),
    );
    setSellerContributionNote(
      typeof existingProduct.sellerContributionNote === 'string'
        ? existingProduct.sellerContributionNote
        : '',
    );
    setMadeToConsumerSpecifications(
      Boolean(existingProduct.madeToConsumerSpecifications),
    );
    setRapidlyPerishable(Boolean(existingProduct.rapidlyPerishable));
  }, [editMode, existingProduct, marketplaceCategory]);

  const showFoodAllergens = useMemo(
    () =>
      productRequiresAllergenConfirmation({
        category:
          marketplaceCategory === 'GROW'
            ? 'GARDEN'
            : marketplaceCategory === 'DESIGN' ||
                marketplaceCategory === 'ARTISTIC_SERVICE'
              ? 'DESIGNER'
              : 'CHEFF',
        marketplaceCategory,
        specializations,
      }),
    [marketplaceCategory, specializations],
  );

  const showSellerContribution = listingIntent !== 'REQUEST';
  const contributionRequired = contributionRequiredForPublish({
    listingIntent,
    isEdit: editMode,
    integrityStatus: editMode
      ? (existingProduct?.integrityStatus as string | null | undefined)
      : undefined,
  });
  const contributionSuggestions = useMemo(
    () =>
      suggestedContributionTypes({
        marketplaceCategory,
        listingIntent,
      }),
    [marketplaceCategory, listingIntent],
  );

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
    if (specializations.length === 0) {
      setMessage(t(MARKETPLACE_ERROR_KEYS.specializationsRequired));
      return;
    }
    if (
      barterOpennessRequiresAcceptedValues(barterOpenness) &&
      acceptedSpecializations.length === 0
    ) {
      setMessage(t(MARKETPLACE_ERROR_KEYS.barterAcceptedRequired));
      return;
    }
    if (images.length === 0 || images.some((i) => i.uploading)) {
      setMessage(t(MARKETPLACE_ERROR_KEYS.photosRequired));
      return;
    }

    if (showFoodAllergens && !allergensConfirmed) {
      setMessage(
        'Bevestig de allergeneninformatie (checkbox) voordat je opslaat. Zonder bevestiging kunnen kopers dit voedselaanbod niet bestellen.',
      );
      return;
    }

    if (
      showSellerContribution &&
      contributionRequired &&
      sellerContributionTypes.length === 0
    ) {
      setMessage(t('trust.contribution.required'));
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
      if (
        useProfileLocation &&
        (loc.pickupLat == null || loc.pickupLng == null)
      ) {
        setMessage(t(MARKETPLACE_ERROR_KEYS.locationCoordsRequired));
        return;
      }
      if (placeResolveState.status === 'resolving') {
        setMessage('Locatie wordt nog opgezocht… even geduld.');
        return;
      }
      if (placeResolveState.status === 'ambiguous') {
        setMessage('Welke locatie bedoel je? Kies een van de opties.');
        return;
      }
      const locCheck = validateProductLocationForPublish({
        pickupAddress: loc.pickupAddress,
        pickupLat: loc.pickupLat,
        pickupLng: loc.pickupLng,
        seller: {
          lat: loc.pickupLat,
          lng: loc.pickupLng,
          User: {
            place: loc.placeName,
            city: loc.placeName,
            lat: loc.pickupLat,
            lng: loc.pickupLng,
          },
        },
      });
      if (!locCheck.ok) {
        setMessage(
          t(
            locCheck.errorCode === 'location_coords_required'
              ? MARKETPLACE_ERROR_KEYS.locationCoordsRequired
              : MARKETPLACE_ERROR_KEYS.locationRequired
          )
        );
        return;
      }
    }

    const imageUrls = images
      .filter((i) => i.url?.trim() && !i.uploading)
      .map((i) => i.url.trim());

    const resolvedBarterOpenness = resolveBarterOpennessForSave({
      barterOpenness,
      acceptedSpecializations,
    });

    const payload = {
      title: title.trim(),
      description: description.trim(),
      priceCents,
      priceModel,
      listingIntent,
      marketplaceCategory,
      specializations,
      acceptedSpecializations,
      barterOpenness: resolvedBarterOpenness,
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
      ...(showFoodAllergens
        ? {
            allergens,
            allergensConfirmed,
          }
        : {}),
      ...(showSellerContribution
        ? {
            sellerContributionTypes,
            sellerContributionNote: sellerContributionNote.trim() || null,
          }
        : {}),
      madeToConsumerSpecifications,
      rapidlyPerishable,
    };

    const needsCommerceGate = offerRequiresCommerceDeclaration({
      priceCents,
      priceModel,
      barterOpenness: resolvedBarterOpenness,
      acceptHomeCheffPayment,
    });

    if (needsCommerceGate) {
      let declaration = commerceDeclarationKnown;
      if (!declaration) {
        try {
          const cRes = await fetch('/api/seller/commerce-declaration');
          if (cRes.ok) {
            const cData = await cRes.json();
            declaration = cData?.commerce?.declaration ?? 'UNDECLARED';
            setCommerceDeclarationKnown(declaration);
          } else {
            declaration = 'UNDECLARED';
          }
        } catch {
          declaration = 'UNDECLARED';
        }
      }
      if (declaration === 'UNDECLARED') {
        setCommerceError(null);
        setCommerceModalOpen(true);
        return;
      }
    }

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
        clearPx4aItemFormDraft();
        window.location.href = getProfileHrefAfterProductSave(data.product.id);
      }
    } catch {
      setMessage(t(MARKETPLACE_ERROR_KEYS.saveFailed));
    } finally {
      setBusy(false);
    }
  };

  const confirmCommerceDeclaration = async (
    declaration: CommerceDeclarationChoice,
  ) => {
    setCommerceBusy(true);
    setCommerceError(null);
    try {
      const res = await fetch('/api/seller/commerce-declaration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ declaration }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCommerceError(
          typeof data.error === 'string' ? data.error : 'Opslaan mislukt',
        );
        return;
      }
      setCommerceDeclarationKnown(declaration);
      setCommerceModalOpen(false);
      await validateAndSubmit({
        preventDefault() {},
      } as React.FormEvent);
    } catch {
      setCommerceError('Opslaan mislukt');
    } finally {
      setCommerceBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void validateAndSubmit(e)} className="space-y-6">
      <CommerceDeclarationModal
        open={commerceModalOpen}
        busy={commerceBusy}
        error={commerceError}
        onCancel={() => setCommerceModalOpen(false)}
        onConfirm={(d) => void confirmCommerceDeclaration(d)}
      />      {!editMode ? (
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
                      tone={item?.tone}
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

      {editMode ? (
        <TaxonomySpecializationPicker
          marketplaceCategory={marketplaceCategory}
          role={listingIntent === 'REQUEST' ? 'request' : 'offer'}
          value={specializations}
          onChange={setSpecializations}
        />
      ) : null}

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

      {editMode ? (
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
            hideHeading
          />
        </div>
      ) : (
        <ListingPhotoVideoBlock
          video={video}
          onVideoChange={setVideo}
          photoUrls={images
            .map((image) => image.url)
            .filter((url): url is string => Boolean(url?.startsWith('https://')))}
          onPersistDraft={persistItemDraft}
          exportPending={exportPending}
          disabled={busy || exportPending}
        />
      )}

      <p className="text-xs text-gray-600 leading-relaxed">
        {t('marketplace.form.settlementIntro')}
      </p>

      {showFoodAllergens ? (
        <FoodAllergenSelector
          selected={allergens}
          confirmed={allergensConfirmed}
          onChangeSelected={setAllergens}
          onChangeConfirmed={setAllergensConfirmed}
          disabled={busy}
        />
      ) : null}

      {showSellerContribution ? (
        <SellerContributionSelector
          selected={sellerContributionTypes}
          note={sellerContributionNote}
          onChangeSelected={setSellerContributionTypes}
          onChangeNote={setSellerContributionNote}
          required={contributionRequired}
          disabled={busy}
          suggested={contributionSuggestions}
        />
      ) : null}

      {showSellerContribution && listingIntent === 'OFFER' ? (
        <div
          data-hc-legal3-listing-flags=""
          className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 space-y-3"
        >
          <p className="text-sm font-semibold text-gray-900">
            {t('legal3.sellerFlags.title')}
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            {t('legal3.sellerFlags.help')}
          </p>
          <label className="flex items-start gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              className="mt-1"
              checked={madeToConsumerSpecifications}
              disabled={busy}
              data-hc-made-to-spec=""
              onChange={(e) => setMadeToConsumerSpecifications(e.target.checked)}
            />
            <span>{t('legal3.sellerFlags.madeToSpec')}</span>
          </label>
          {showFoodAllergens ? (
            <label className="flex items-start gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                className="mt-1"
                checked={rapidlyPerishable}
                disabled={busy}
                data-hc-rapidly-perishable=""
                onChange={(e) => setRapidlyPerishable(e.target.checked)}
              />
              <span>{t('legal3.sellerFlags.rapidlyPerishable')}</span>
            </label>
          ) : null}
        </div>
      ) : null}

      <PaymentMethodCheckboxes
        acceptHomeCheffPayment={acceptHomeCheffPayment}
        acceptDirectContact={acceptDirectContact}
        onChange={({ acceptHomeCheffPayment: hc, acceptDirectContact: dc }) => {
          setAcceptHomeCheffPayment(hc);
          setAcceptDirectContact(dc);
        }}
      />

      <SettlementConnectGuidance active={acceptHomeCheffPayment} />

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

      <BarterOpennessSelector
        value={barterOpenness}
        onChange={setBarterOpenness}
      />

      <AcceptedValuesPicker
        value={acceptedSpecializations}
        onChange={(ids) => {
          setAcceptedSpecializations(ids);
          setBarterOpenness((current) =>
            suggestBarterOpennessAfterAcceptedValuesChange(current, ids.length),
          );
        }}
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
              autoComplete="address-level2"
            />
            {placeAutoResolveEnabled || placeResolveState.status !== 'idle' ? (
              <div className="mt-2">
                <PlaceResolveFeedback
                  state={placeResolveState}
                  onSelect={(c) => {
                    selectCandidate(c);
                    setPickupLat(c.lat);
                    setPickupLng(c.lng);
                    setCoordsSource('place');
                  }}
                />
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={useProfileLocation}
                onChange={() => {
                  setUseProfileLocation(true);
                  if (profileHasCoords) {
                    setPickupLat(profileLat);
                    setPickupLng(profileLng);
                    setCoordsSource('profile');
                  } else {
                    setPickupLat(null);
                    setPickupLng(null);
                    setCoordsSource('none');
                  }
                }}
              />
              {t('marketplace.form.useProfileAddress')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={!useProfileLocation}
                onChange={() => {
                  setUseProfileLocation(false);
                  setPickupLat(null);
                  setPickupLng(null);
                  setCoordsSource('none');
                }}
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
                if (data.lat != null && data.lng != null) {
                  setPickupLat(data.lat);
                  setPickupLng(data.lng);
                  setCoordsSource('address');
                } else {
                  setPickupLat(null);
                  setPickupLng(null);
                  setCoordsSource('none');
                }
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
