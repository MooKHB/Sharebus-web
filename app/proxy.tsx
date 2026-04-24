import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();

  // لو مش admin route سيبه يعدي
  if (!url.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const token = req.cookies.get("sb-access-token")?.value;

    if (!token) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // جيب بيانات المستخدم
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
      },
    });

    if (!userRes.ok) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    const user = await userRes.json();

    // fallback email (اختياري)
    const ADMIN_EMAIL = "mohamed.k.basheer@gmail.com";

    let isAdmin = false;

    // 1) check من profiles
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=role`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (profileRes.ok) {
      const profile = await profileRes.json();
      if (profile?.[0]?.role === "admin") {
        isAdmin = true;
      }
    }

    // 2) fallback email
    if (user.email === ADMIN_EMAIL) {
      isAdmin = true;
    }

    if (!isAdmin) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (err) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}