import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/seo";
import config from "@/lib/automotive-preview-config.json";
import AutomotivePreview from "@/components/automotive/AutomotivePreview";

export const dynamicParams = false;
export function generateStaticParams() { return [{ id: config.id }]; }
export const metadata = {
  ...pageMetadata({ title: "Your Automotive Keytag | Zenki Lab", description: "Your unlisted automotive keytag design review.", path: `/preview/automotive-keytags/${config.id}` }),
  robots: { index: false, follow: false, noarchive: true, googleBot: { index: false, follow: false, noimageindex: true } },
};
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== config.id) notFound();
  return <AutomotivePreview assetRoot={`/preview-assets/${config.id}`} />;
}
