import { Request, Response, NextFunction } from "express";

export const responseHandler = (req: Request, res: Response, next: NextFunction) => {
  next();
};