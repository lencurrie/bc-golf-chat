import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Check if user profile exists and is active
  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: { isActive: true }
  })

  if (profile && !profile.isActive) {
    // User has been deactivated - they'll be logged out on next request
    redirect('/login?error=account_disabled')
  }

  return <>{children}</>
}
