export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, opts: { status: number; body: unknown }) {
    super(message)
    this.name = 'ApiError'
    this.status = opts.status
    this.body = opts.body
  }
}

