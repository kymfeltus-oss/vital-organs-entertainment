import { NextResponse } from "next/server";
import { generateGuestEmail, generateGuestPassword } from "@/lib/access";
import {
  CREATE_ACCOUNT_MIN_PASSWORD_LENGTH,
} from "@/lib/auth/create-account-validation";
import {
  DEFAULT_ATTENDEE_NEXT,
  resolveAttendeeDestination,
} from "@/lib/auth/routing";
import { buildAuthCallbackUrl } from "@/lib/auth/server";
import { isValidUsStateCode } from "@/lib/auth/us-states";
import { syncUserProfileIdentity } from "@/lib/auth/sync-attendee-profile";
import { normalizePhoneDigits, isValidPhone } from "@/lib/auth/validation";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type AuthAction = "signup" | "login" | "guest";

type AuthRequestBody = {
  action?: AuthAction;
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  state?: string;
  next?: string;
};

function normalizeNamePart(value: string | undefined): string {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AuthRequestBody;
    const action = body.action;

    if (!action || !["signup", "login", "guest"].includes(action)) {
      return NextResponse.json({ error: "Invalid auth action." }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    if (action === "login") {
      const email = body.email?.trim().toLowerCase();
      const password = body.password;

      if (!email || !password || !isValidEmail(email)) {
        return NextResponse.json(
          { error: "Valid email and password are required." },
          { status: 400 },
        );
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return NextResponse.json(
          { error: error?.message ?? "Unable to sign in." },
          { status: 401 },
        );
      }

      await syncUserProfileIdentity(data.user);

      return NextResponse.json({
        success: true,
        email: data.user.email,
        isGuest: data.user.user_metadata?.is_guest === true,
      });
    }

    if (action === "signup") {
      const email = body.email?.trim().toLowerCase();
      const password = body.password;
      const confirmPassword = body.confirmPassword;
      const firstName = normalizeNamePart(body.firstName);
      const lastName = normalizeNamePart(body.lastName);
      const phone = normalizePhoneDigits(body.phone ?? "");
      const city = body.city?.trim() ?? "";
      const state = body.state?.trim().toUpperCase() ?? "";

      if (!email || !password || password.length < CREATE_ACCOUNT_MIN_PASSWORD_LENGTH || !isValidEmail(email)) {
        return NextResponse.json(
          { error: `Valid email and a ${CREATE_ACCOUNT_MIN_PASSWORD_LENGTH}+ character password are required.` },
          { status: 400 },
        );
      }

      if (confirmPassword !== undefined && confirmPassword !== password) {
        return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
      }

      if (!firstName || !lastName) {
        return NextResponse.json(
          { error: "First and last name are required to create an account." },
          { status: 400 },
        );
      }

      if (!phone || !isValidPhone(phone)) {
        return NextResponse.json(
          { error: "A valid 10-digit US phone number is required." },
          { status: 400 },
        );
      }

      if (!city) {
        return NextResponse.json({ error: "City is required." }, { status: 400 });
      }

      if (!state || !isValidUsStateCode(state)) {
        return NextResponse.json({ error: "A valid US state is required." }, { status: 400 });
      }

      const signupNext = resolveAttendeeDestination(
        body.next ?? DEFAULT_ATTENDEE_NEXT,
      );
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            is_guest: false,
            first_name: firstName,
            last_name: lastName,
            phone,
            city,
            state,
          },
          emailRedirectTo: buildAuthCallbackUrl(signupNext, request),
        },
      });

      if (error || !data.user) {
        return NextResponse.json(
          { error: error?.message ?? "Unable to create account." },
          { status: 400 },
        );
      }

      let activeUser = data.user;

      if (!data.session) {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (signInError) {
          return NextResponse.json(
            {
              error:
                "Account created. Confirm your email or retry sign-in if confirmation is disabled.",
            },
            { status: 202 },
          );
        }

        activeUser = signInData.user ?? activeUser;
      }

      if (activeUser) {
        await syncUserProfileIdentity(activeUser);
      }

      return NextResponse.json({
        success: true,
        email,
        isGuest: false,
      });
    }

    const guestEmail = generateGuestEmail();
    const guestPassword = generateGuestPassword();
    const contactEmail = body.email?.trim().toLowerCase();
    const contactPhone = body.phone?.trim();
    const admin = getSupabaseAdmin();

    const guestMetadata: Record<string, unknown> = { is_guest: true };
    if (contactEmail && isValidEmail(contactEmail)) {
      guestMetadata.contact_email = contactEmail;
    }
    if (contactPhone) {
      guestMetadata.contact_phone = contactPhone;
    }

    const { data: createdUser, error: createError } =
      await admin.auth.admin.createUser({
        email: guestEmail,
        password: guestPassword,
        email_confirm: true,
        user_metadata: guestMetadata,
      });

    if (createError || !createdUser.user) {
      return NextResponse.json(
        { error: createError?.message ?? "Unable to create guest session." },
        { status: 500 },
      );
    }

    const { data: guestSession, error: guestSignInError } =
      await supabase.auth.signInWithPassword({
        email: guestEmail,
        password: guestPassword,
      });

    if (guestSignInError || !guestSession.user) {
      return NextResponse.json(
        { error: guestSignInError?.message ?? "Unable to start guest session." },
        { status: 500 },
      );
    }

      return NextResponse.json({
        success: true,
        email: contactEmail && isValidEmail(contactEmail) ? contactEmail : guestEmail,
        isGuest: true,
      });
  } catch (error) {
    console.error("Auth route error:", error);
    const message =
      error instanceof Error ? error.message : "Authentication failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
