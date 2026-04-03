import { checkSchema, validationResult } from "express-validator";
import { createTaskSchema } from "../validators/task";

const runCreateTaskValidation = async (body: Record<string, unknown>) => {
  const req = { body } as any;
  const chains = checkSchema(createTaskSchema);

  await Promise.all(chains.map((chain) => chain.run(req)));

  return validationResult(req).array().map((error: any) => ({
    field: error.path,
    message: error.msg,
  }));
};

describe("createTaskSchema priority validation", () => {
  it("accepts the exact UI priority value", async () => {
    const errors = await runCreateTaskValidation({
      title: "Create task priority test",
      description: "Validate that the exact UI priority value passes backend checks.",
      priority: "Medium",
      project_id: "9333bda6-334c-4605-99fe-ee9cf3021684",
    });

    expect(errors.find((error) => error.field === "priority")).toBeUndefined();
  });

  it("rejects lowercase priority values", async () => {
    const errors = await runCreateTaskValidation({
      title: "Create task priority test",
      description: "Validate that lowercase priority values fail backend checks.",
      priority: "medium",
      project_id: "9333bda6-334c-4605-99fe-ee9cf3021684",
    });

    expect(errors).toContainEqual({
      field: "priority",
      message: "Priority must be one of: Low, Medium, High",
    });
  });
});
