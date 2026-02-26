'use client';

type PageProps = {
  params: Promise<{ orgShortId: string }> | { orgShortId: string };
};

export default function TaskCompassPage({ params }: PageProps) {

  return (
    <div className="mx-auto max-w-screen-2xl">
      <h1 className="text-3xl font-bold text-white mb-1">Task Compass</h1>
    </div>
  );
}
