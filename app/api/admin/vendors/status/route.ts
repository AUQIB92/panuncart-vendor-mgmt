import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { vendor_id, status } = body

    if (!vendor_id || !status) {
      return NextResponse.json({ error: "Missing vendor_id or status" }, { status: 400 })
    }

    if (!["approved", "rejected", "suspended", "pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Use SECURITY DEFINER function to bypass RLS
    const { error } = await supabase.rpc("admin_update_vendor_status", {
      vendor_id,
      new_status: status,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)
    return NextResponse.json({
      success: true,
      message: `Vendor ${statusLabel} successfully`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
