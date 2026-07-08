import ColemanAppLayout from "@/app/enterprise/coleman/components/ColemanAppLayout";

export default function ColemanMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ColemanAppLayout>{children}</ColemanAppLayout>;
}
