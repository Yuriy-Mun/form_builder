
export default function Home() {
  return (
    <div className="space-y-8">
      <section className="py-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Welcome to Our App</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            A modern application built with Next.js and Supabase.
          </p>
          <div className="flex justify-center gap-4 mt-8">
            <a 
              href="#features" 
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Learn More
            </a>
            <a 
              href="/public/contact" 
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
      
      <section id="features" className="py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Features</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-lg border p-6">
            <h3 className="text-xl font-bold mb-2">Feature One</h3>
            <p className="text-muted-foreground">Description of the first amazing feature of your application.</p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="text-xl font-bold mb-2">Feature Two</h3>
            <p className="text-muted-foreground">Description of the second amazing feature of your application.</p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="text-xl font-bold mb-2">Feature Three</h3>
            <p className="text-muted-foreground">Description of the third amazing feature of your application.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
