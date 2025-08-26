import { NextResponse } from 'next/server'

// Handle all HTTP methods for any undefined API route
export function GET() {
  return NextResponse.json({ error: 'API route not found' }, { status: 404 })
}

export function POST() {
  return NextResponse.json({ error: 'API route not found' }, { status: 404 })
}

export function PUT() {
  return NextResponse.json({ error: 'API route not found' }, { status: 404 })
}

export function DELETE() {
  return NextResponse.json({ error: 'API route not found' }, { status: 404 })
}

export function PATCH() {
  return NextResponse.json({ error: 'API route not found' }, { status: 404 })
}

export function HEAD() {
  return NextResponse.json({ error: 'API route not found' }, { status: 404 })
}

export function OPTIONS() {
  return NextResponse.json({ error: 'API route not found' }, { status: 404 })
}