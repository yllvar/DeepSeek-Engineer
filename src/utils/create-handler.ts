import type { NextApiRequest, NextApiResponse } from "next"
import { ZodError } from "zod"

type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>

export function createHandler(handler: Handler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res)
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors })
      } else {
        console.error("Unhandled error:", error)
        res.status(500).json({ error: "Internal server error" })
      }
    }
  }
}

