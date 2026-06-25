import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TopBar from "@/components/TopBar";
import DashboardCharts from "@/components/DashboardCharts";
import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const stats = await getDashboardStats();

  return (
    <>
      <TopBar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ mb: 3 }}>
          Dashboard
        </Typography>
        <DashboardCharts stats={stats} />
      </Container>
    </>
  );
}
