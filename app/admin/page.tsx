export default function AdminHome() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Admin Console</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        If you can read this without being admin, the middleware isn’t wired.
      </p>
    </main>
  );
}
