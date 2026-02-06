import LoginForm from '@/components/page/LoginForm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/login/')({
  component: LoginForm,
})