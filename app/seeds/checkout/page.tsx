import { redirect } from "next/navigation";

/** Legacy fullscreen live seed checkout now forwards to the working seed store. */
export default async function SeedsCheckoutPage() {
  redirect("/buy-seeds");
}
