import TodaysServiceClient from "@/components/todays-service/TodaysServiceClient";
import { getTodaysServiceForPage } from "@/lib/todays-service/get-todays-service-cached";

type TodaysServiceDashboardLoaderProps = {
  operatorEmail: string;
  serviceId: string;
};

/** Loads full dashboard payload once (deduped via React cache) inside Suspense. */
export default async function TodaysServiceDashboardLoader({
  operatorEmail,
  serviceId,
}: TodaysServiceDashboardLoaderProps) {
  const initialData = await getTodaysServiceForPage(serviceId);

  return (
    <TodaysServiceClient
      operatorEmail={operatorEmail}
      initialData={initialData}
      headerLayout="actions-only"
    />
  );
}
