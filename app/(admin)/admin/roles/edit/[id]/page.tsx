import { Suspense } from 'react'
import EditRoleClient from './page.client'

// Серверный компонент для обработки параметров и рендеринга клиентского компонента
export default async function EditRolePage({params}: {params: Promise<{id: string}>}) {
  // В серверном компоненте можно безопасно обращаться к Promise параметрам
  const { id } = await params

  return (
    <Suspense fallback={<div className="p-8 text-center">Загрузка...</div>}>
      <EditRoleClient id={id} />
    </Suspense>
  )
} 