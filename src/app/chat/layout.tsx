import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user profile exists and is active
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_active')
    .eq('id', user.id)
    .single()

  if (profile && !profile.is_active) {
    // User has been deactivated
    await supabase.auth.signOut()
    redirect('/login?error=account_disabled')
  }

  return <>{children}</>
}
