import { describe, it, expect } from "vitest";
import { parseSchedaListParams } from "./schedaQueries";

describe("parseSchedaListParams", () => {
  it("applica i default su input vuoto", () => {
    const p = parseSchedaListParams({});
    expect(p).toEqual({
      q: "",
      status: undefined,
      page: 1,
      pageSize: 20,
      sort: "updatedAt",
      dir: "desc",
    });
  });

  it("legge e normalizza i valori validi", () => {
    const p = parseSchedaListParams({
      q: "  rossi ",
      status: "DRAFT",
      page: "3",
      pageSize: "50",
      sort: "cognome",
      dir: "asc",
    });
    expect(p.q).toBe("rossi");
    expect(p.status).toBe("DRAFT");
    expect(p.page).toBe(3);
    expect(p.pageSize).toBe(50);
    expect(p.sort).toBe("cognome");
    expect(p.dir).toBe("asc");
  });

  it("ricade sui default per valori non validi (niente throw)", () => {
    const p = parseSchedaListParams({
      page: "0",
      pageSize: "999",
      sort: "nonEsiste",
      dir: "su",
      status: "BOH",
    });
    expect(p.page).toBe(1);
    expect(p.pageSize).toBe(20);
    expect(p.sort).toBe("updatedAt");
    expect(p.dir).toBe("desc");
    expect(p.status).toBeUndefined();
  });

  it("prende il primo valore se il parametro è ripetuto", () => {
    const p = parseSchedaListParams({ q: ["primo", "secondo"] });
    expect(p.q).toBe("primo");
  });
});
