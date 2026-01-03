// pages/api/short/ix.sk
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import qs from 'querystring';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ message: 'Invalid URL' });
  }

  try {
    const payload = qs.stringify({ longurl: url, action: "create" });
    const response = await axios.post('https://ix.sk/', payload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded'},
    });
    const data = response.data;
    if (data.match(/value="(https:\/\/ix\.sk\/[^"]+)"/)[1]) {
    return res.status(200).json({ shortUrl: data.match(/value="(https:\/\/ix\.sk\/[^"]+)"/)[1] });
    }
    return res.status(400).json({ shortUrl: "" });
  } catch (error: unknown) {
    return res.status(500).json({
    message: 'Shortening failed',
    error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}