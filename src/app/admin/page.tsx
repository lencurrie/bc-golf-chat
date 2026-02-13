import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminPanel from '@/components/AdminPanel'

export default async function AdminPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/chat')
  }

  // Fetch all users
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch all channels
  const { data: channels } = await supabase
    .from('channels')
    .select('*, channel_members(*)')
    .order('name')

  return (
    <AdminPanel
      currentUser={profile}
      users={users || []}
      channels={channels || []}
    />
  )
}
