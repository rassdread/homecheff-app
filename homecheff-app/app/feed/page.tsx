import GeoFeed from "@/components/feed/GeoFeed";

export const metadata = { title: "Feed | HomeCheff" };

export default function FeedPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">In de buurt</h1>
      <p className="text-sm text-muted-foreground">We tonen eerst gerechten bij jou in de buurt. Verder weg komt lager in de lijst.</p>
      <GeoFeed />
    </div>
  );
}
