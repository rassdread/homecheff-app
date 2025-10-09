'use client';

import { lazy, Suspense } from 'react';

// Lazy load zware components
export const LazyCompleteChat = lazy(() => import('./chat/CompleteChat'));
export const LazyConversationsList = lazy(() => import('./chat/ConversationsList'));
export const LazyUserManagement = lazy(() => import('./admin/UserManagement'));
export const LazyProductManagement = lazy(() => import('./profile/ProductManagement'));
export const LazyAdvancedFiltersPanel = lazy(() => import('./feed/AdvancedFiltersPanel'));
export const LazyGeoFeed = lazy(() => import('./feed/GeoFeed'));

// Loading fallbacks
export const ChatLoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    <span className="ml-2 text-gray-600">Chat laden...</span>
  </div>
);

export const ManagementLoadingFallback = () => (
  <div className="flex items-center justify-center h-32">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
    <span className="ml-2 text-gray-600">Beheer laden...</span>
  </div>
);

export const FeedLoadingFallback = () => (
  <div className="flex items-center justify-center h-48">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    <span className="ml-2 text-gray-600">Feed laden...</span>
  </div>
);

// Wrapper components met Suspense
export const SuspenseChatWindow = (props: any) => (
  <Suspense fallback={<ChatLoadingFallback />}>
    <LazyCompleteChat {...props} />
  </Suspense>
);

export const SuspenseConversationsList = (props: any) => (
  <Suspense fallback={<ChatLoadingFallback />}>
    <LazyConversationsList {...props} />
  </Suspense>
);

export const SuspenseUserManagement = (props: any) => (
  <Suspense fallback={<ManagementLoadingFallback />}>
    <LazyUserManagement {...props} />
  </Suspense>
);

export const SuspenseProductManagement = (props: any) => (
  <Suspense fallback={<ManagementLoadingFallback />}>
    <LazyProductManagement {...props} />
  </Suspense>
);

export const SuspenseAdvancedFiltersPanel = (props: any) => (
  <Suspense fallback={<FeedLoadingFallback />}>
    <LazyAdvancedFiltersPanel {...props} />
  </Suspense>
);

export const SuspenseGeoFeed = (props: any) => (
  <Suspense fallback={<FeedLoadingFallback />}>
    <LazyGeoFeed {...props} />
  </Suspense>
);
