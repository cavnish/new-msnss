import { getLogoRowClients } from "@/lib/queries";
import { ClientLogoRow } from "@/components/ClientLogoRow";

/**
 * Server wrapper that resolves the admin-curated logo strip
 * (showInLogoRow / logoRowOrder) and renders the premium card row.
 */
export async function ClientLogoRowSection() {
  const clients = await getLogoRowClients();
  if (!clients.length) return null;
  return <ClientLogoRow clients={clients} />;
}
