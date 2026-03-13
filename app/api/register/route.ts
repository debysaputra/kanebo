import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { error: "Pendaftaran publik dinonaktifkan. Hubungi admin." },
    { status: 403 }
  )
}
