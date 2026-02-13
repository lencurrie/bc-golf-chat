import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import prisma from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.profile.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user
    const user = await prisma.profile.create({
      data: {
        email,
        password: hashedPassword,
        fullName: fullName || null,
        isAdmin: false,
        isActive: true
      }
    })

    // Add user to General channel if it exists
    const generalChannel = await prisma.channel.findFirst({
      where: { name: 'General' }
    })

    if (generalChannel) {
      await prisma.channelMember.create({
        data: {
          channelId: generalChannel.id,
          userId: user.id
        }
      })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
