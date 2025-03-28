import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <div className="space-y-6">
        <h1 className="text-6xl font-bold text-red-500">403</h1>
        <h2 className="text-3xl font-semibold">Доступ запрещен</h2>
        <p className="text-muted-foreground">
          У вас нет прав для доступа к этой странице
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/">На главную</Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 