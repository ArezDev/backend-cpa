import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export default function handler(req: NextApiRequest, res: NextApiResponse) {

  const memberToken = req.headers.authorization?.split(' ')[1];

  if (!memberToken) {
    return res.status(401).json({ message: "Sesi Login tidak ditemukan." });
  }

  try {

    if (memberToken) {
      const decoded = jwt.verify(memberToken, JWT_SECRET);
      if (!decoded || typeof decoded === 'string') {
            return res.status(401).json({
                status: false,
                data: null,
                message: 'Token Invalid!'
            });
        }
      if (decoded.role === "ketua") {
        return res.status(200).json({ user: decoded, expiredIn: decoded?.exp });
      }
      return res.status(200).json({ user: decoded, role: "member" });
    }

    return res.status(401).json({ message: "Invalid role" });
  } catch (err:unknown) {
    return res.status(401).json({ 
        details: err instanceof Error ? err.message : 'Error API',
        message: "Invalid token"
    });
  }
}
