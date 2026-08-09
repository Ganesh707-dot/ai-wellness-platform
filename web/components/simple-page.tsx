import Link from "next/link";

export default function SimplePage({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-serif text-4xl text-stone-900">{title}</h1>
      <p className="mt-4 text-stone-600">{body}</p>
      <Link href="/" className="mt-8 inline-block text-teal-800 hover:underline">
        Back to home
      </Link>
    </div>
  );
}
