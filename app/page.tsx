import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { AlertTriangle } from "lucide-react";
import { FoodPicker } from "@/components/picker/food-picker";
import { PickerSkeleton } from "@/components/picker/picker-skeleton";
import { Button } from "@/components/ui/button";
import { getPlaces } from "@/lib/places";

export default function Home() {
  return (
    <div className="flex flex-col gap-10">
      <section className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
          Lapar tapi tak tahu nak makan apa?
        </p>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
          Let the wheel decide what&apos;s for makan.
        </h1>
        <p className="mt-4 text-muted-foreground">
          Spin across every food spot we know, or pick the malls you&apos;re
          near to narrow it down.
        </p>
      </section>

      <Suspense fallback={<PickerSkeleton />}>
        <PickerSection />
      </Suspense>
    </div>
  );
}

async function PickerSection() {
  await connection();
  const result = await getPlaces();

  if (!result.ok) {
    console.error("Failed to load places:", result.error);
    return (
      <StatusCard
        title="Couldn't load the food directory"
        body="Something went wrong talking to the database. Try again in a moment."
        retry
      />
    );
  }

  if (result.places.length === 0) {
    return (
      <StatusCard
        title="No food spots yet"
        body="The directory is empty. Add a mall and its shops to the places table to get spinning."
      />
    );
  }

  return <FoodPicker places={result.places} />;
}

function StatusCard({
  title,
  body,
  retry,
}: {
  title: string;
  body: string;
  retry?: boolean;
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border bg-card p-8 text-center shadow-sm"
    >
      <AlertTriangle className="size-8 text-primary" aria-hidden />
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{body}</p>
      {retry && (
        <Button asChild variant="outline" size="sm">
          <Link href="/">Try again</Link>
        </Button>
      )}
    </div>
  );
}
