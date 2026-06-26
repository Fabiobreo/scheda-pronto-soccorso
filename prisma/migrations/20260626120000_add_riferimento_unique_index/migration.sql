-- Indice univoco parziale: il riferimento deve essere unico tra le schede non eliminate,
-- ma le schede con riferimento vuoto ("") sono escluse (possono coesistere più bozze senza codice).
CREATE UNIQUE INDEX "scheda_riferimento_unique"
  ON "Scheda" (riferimento)
  WHERE riferimento != '' AND "deletedAt" IS NULL;
