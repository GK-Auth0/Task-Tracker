import Defect, { generateDefectReferenceCode } from "../models/defect";

describe("defect reference code generation", () => {
  it("generates a DEF-prefixed reference code", () => {
    const code = generateDefectReferenceCode();

    expect(code).toMatch(/^DEF-[A-Z0-9]+$/);
  });

  it("assigns a reference code when one is missing", () => {
    const defect = { reference_code: undefined } as unknown as Defect;

    Defect.ensureReferenceCode(defect);

    expect(defect.reference_code).toMatch(/^DEF-[A-Z0-9]+$/);
  });

  it("keeps an existing reference code unchanged", () => {
    const defect = { reference_code: "DEF-0007" } as unknown as Defect;

    Defect.ensureReferenceCode(defect);

    expect(defect.reference_code).toBe("DEF-0007");
  });
});
