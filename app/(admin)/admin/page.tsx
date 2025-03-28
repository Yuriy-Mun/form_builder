export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      <p className="text-muted-foreground">
        Manage your application settings and content from here.
      </p>
      
      <div className="rounded-lg border bg-card p-3 my-4 text-sm">
        <p className="text-green-600">✓ Эта страница защищена. Доступ только для пользователей с правом admin.access</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-xl font-semibold">Users</h3>
          <p className="text-sm text-muted-foreground">Manage users and permissions</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-xl font-semibold">Content</h3>
          <p className="text-sm text-muted-foreground">Manage application content</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-xl font-semibold">Settings</h3>
          <p className="text-sm text-muted-foreground">Configure application settings</p>
        </div>
      </div>
    </div>
  )
} 