import { Request, Response } from "express";

export const errorHandler404 = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
};