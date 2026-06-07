import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type MerchCheckoutBody = {
  productId?: string;
  selectedSize?: string | null;
  customerEmail?: string;
};

type InventoryItem = {
  name: string;
  amountCents: number;
  requiresSize: boolean;
};

const CLOTHING_SIZES = new Set(["S", "M", "L", "XL", "2XL"]);

function getAppUrl(request: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    request.headers.get("origin") ??
    "http://localhost:3000"
  );
}

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Payment processing is not configured." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as MerchCheckoutBody;
    const productId = body.productId?.trim();
    const selectedSize = body.selectedSize?.trim() || "N/A";
    const customerEmail = body.customerEmail?.trim();

    if (!productId) {
      return NextResponse.json({ error: "Product is required." }, { status: 400 });
    }

    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return NextResponse.json(
        { error: "A valid customer email is required." },
        { status: 400 },
      );
    }

    const inventory: Record<string, InventoryItem> = {
      "cd-preorder": {
        name: "Awakening Live Recording CD Pre-order",
        amountCents: 2000,
        requiresSize: false,
      },
      "concert-tee": {
        name: "300 Awakening Concert Tee",
        amountCents: 2500,
        requiresSize: true,
      },
      "choir-hoodie": {
        name: "The Sound of Healing Hoodie",
        amountCents: 5000,
        requiresSize: true,
      },
      "live-pass": {
        name: "Awakening Live Stream Virtual Access Ticket",
        amountCents: 1000,
        requiresSize: false,
      },
    };

    const product = inventory[productId];

    if (!product) {
      return NextResponse.json({ error: "Invalid product." }, { status: 400 });
    }

    if (product.requiresSize && !CLOTHING_SIZES.has(selectedSize)) {
      return NextResponse.json(
        { error: "A valid size is required for this item." },
        { status: 400 },
      );
    }

    const lineItemName =
      product.requiresSize && selectedSize !== "N/A"
        ? `${product.name} — Size ${selectedSize}`
        : product.name;

    const stripe = new Stripe(stripeSecretKey);
    const appUrl = getAppUrl(request);
    const successPath =
      productId === "live-pass"
        ? "/dashboard/live?success=true"
        : "/dashboard/merch?success=true";
    const cancelPath =
      productId === "live-pass"
        ? "/dashboard/live?canceled=true"
        : "/dashboard/merch?canceled=true";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "link"],
      customer_email: customerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: product.amountCents,
            product_data: {
              name: lineItemName,
            },
          },
        },
      ],
      metadata: {
        productId,
        selectedSize,
        checkout_type: "merch",
      },
      success_url: `${appUrl}${successPath}`,
      cancel_url: `${appUrl}${cancelPath}`,
    });

    const supabase = getSupabaseAdmin();
    const { error: insertError } = await supabase.from("orders").insert({
      customer_email: customerEmail,
      product_id: productId,
      selected_size: selectedSize,
      status: "pending",
      stripe_session_id: session.id,
    });

    if (insertError) {
      console.error("Failed to stage order record:", insertError.message);
      return NextResponse.json(
        { error: "Unable to initialize order record." },
        { status: 500 },
      );
    }

    if (!session.url) {
      return NextResponse.json(
        { error: "Unable to create checkout session." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Merch checkout session error:", error);
    return NextResponse.json(
      { error: "Unable to start checkout. Please try again." },
      { status: 500 },
    );
  }
}
