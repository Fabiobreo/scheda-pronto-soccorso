import Container from "@mui/material/Container";
import TopBar from "@/components/TopBar";
import SchedaList from "@/components/scheda/SchedaList";
import { listSchede, parseSchedaListParams } from "@/lib/schedaQueries";

// La pagina legge dal DB ad ogni richiesta: niente prerender statico.
export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseSchedaListParams(await searchParams);
  const result = await listSchede(params);

  return (
    <>
      <TopBar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <SchedaList initialResult={result} initialParams={params} />
      </Container>
    </>
  );
}
