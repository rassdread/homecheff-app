'use client';

import {
  Bell,
  Heart,
  MessageCircle,
  Package,
  Shield,
  Star,
  UserPlus,
} from 'lucide-react';

export type NotificationFeedItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
};

function iconForType(type: string) {
  const t = type.toLowerCase();
  if (t.includes('message') || t.includes('conversation'))
    return MessageCircle;
  if (t.includes('order')) return Package;
  if (t.includes('review')) return Star;
  if (t.includes('favorite')) return Heart;
  if (t.includes('follow') || t.includes('fan')) return UserPlus;
  if (t.includes('admin')) return Shield;
  return Bell;
}

export default function NotificationFeedItems({
  items,
  loading,
  onSelect,
  emptyTitle = 'Geen meldingen',
  emptyHint = 'Je bent helemaal bij.',
}: {
  items: NotificationFeedItem[];
  loading: boolean;
  onSelect: (n: NotificationFeedItem) => void | Promise<void>;
  emptyTitle?: string;
  emptyHint?: string;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        <p className="text-sm text-gray-500">Laden…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <Bell className="mb-4 h-14 w-14 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900">{emptyTitle}</h3>
        <p className="mt-1 text-sm text-gray-500">{emptyHint}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {items.map((n) => {
        const Icon = iconForType(n.type);
        const date = new Date(n.createdAt);
        const isToday = date.toDateString() === new Date().toDateString();
        return (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => void onSelect(n)}
              className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                !n.isRead ? 'border-l-4 border-l-emerald-500 bg-emerald-50/40' : ''
              }`}
            >
              <div
                className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                  !n.isRead ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`text-sm font-semibold leading-snug ${
                      !n.isRead ? 'text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {n.title}
                  </p>
                  <time
                    className="flex-shrink-0 text-xs text-gray-500 tabular-nums"
                    dateTime={n.createdAt}
                  >
                    {isToday
                      ? date.toLocaleTimeString('nl-NL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : date.toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                  </time>
                </div>
                <p
                  className={`mt-1 line-clamp-3 text-sm leading-relaxed ${
                    !n.isRead ? 'text-gray-800' : 'text-gray-600'
                  }`}
                >
                  {n.message}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
