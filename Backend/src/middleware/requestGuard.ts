import { NextFunction, Request, Response } from "express";

const REQUEST_TIMEOUT_MS = 30000;

export const requestTimeoutGuard = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.setTimeout(REQUEST_TIMEOUT_MS, () => {
    if (res.headersSent) return;
    res.status(503).json({
      success: false,
      message: "Request timed out. Please retry.",
    });
  });
  next();
};
