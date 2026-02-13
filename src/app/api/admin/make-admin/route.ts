import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// One-time endpoint to make lencurrie@gmail.com admin
// DELETE THIS FILE AFTER USE
export async function POST() {
  try {
    const user = await prisma.profile.update({
      where: { email: 'lencurrie@gmail.com' },
      data: { isAdmin: true },
      select: {
        id: true,
        email: true,
        fullName: true,
        isAdmin: true
      }
    })

    return NextResponse.json({ 
      message: 'lencurrie@gmail.com is now admin',
      user 
    })
  } catch (error) {
    console.error('Make admin error:', error)
    return NextResponse.json({ error: 'User not found or error' }, { status: 500 })
  }
}
