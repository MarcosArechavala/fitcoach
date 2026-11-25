import type { NextFunction, Request, Response } from 'express'

export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
