import { redirect } from "next/navigation";
import { HOME_PATH } from "@/lib/auth/paths";

// The proxy sends signed-out visitors to /sign-in first.
export default function Root() {
  redirect(HOME_PATH);
}
