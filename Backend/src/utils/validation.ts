import { Request, Response } from "express";
import { validationResult, ValidationError } from "express-validator";

export const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error: ValidationError) => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
    }));

    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errorMessages,
    });
    return true;
  }
  
  return false;
};