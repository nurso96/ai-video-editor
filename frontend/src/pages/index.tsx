import Link from "next/link";

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">AI Video Editor — Dev UI</h1>
      <p className="mb-4">Development playground: <Link href="/editor" className="text-blue-500">Open Editor</Link></p>
    </main>
  );
}
