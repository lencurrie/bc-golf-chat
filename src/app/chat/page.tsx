import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatInterface from '@/components/ChatInterface'

export default async function ChatPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch channels user is member of
  const { data: channelMemberships } = await supabase
    .from('channel_members')
    .select('channel_id')
    .eq('user_id', user.id)

  const channelIds = channelMemberships?.map(m => m.channel_id) || []

  const { data: channels } = await supabase
    .from('channels')
    .select('*')
    .in('id', channelIds.length > 0 ? channelIds : ['00000000-0000-0000-0000-000000000000'])
    .order('name')

  // Fetch all active users for DMs
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .neq('id', user.id)
    .order('full_name')

  return (
    <ChatInterface
      currentUser={profile!}
      initialChannels={channels || []}
      allUsers={users || []}
    />
  )
}
