import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import getOpenAIBaseUrl from '../../utils/getOpenAIBaseUrl';
import { supabaseClient } from '../../utils/supabaseClient';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { query, apiKey, matches } = req.body;

    const input = query.replace(/\n/g, ' ');

    const embedRes = await fetch(`${getOpenAIBaseUrl()}redfox2/embeddings?api-version=2023-05-15`, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
       },
      method: 'POST',
      body: JSON.stringify({
        input,
      }),
    });
    
    // const embedRes = await axios(`${getOpenAIBaseUrl()}redfox2/embeddings?api-version=2023-05-15`, {
      // headers: {
        // 'Content-Type': 'application/json',
        // 'api-key': `Bearer ${apiKey}`
      // },
      // method: 'POST',
      // data: {
        // model: 'text-embedding-ada-002',
        // input
      // }
    // });

    const {
      data: [{ embedding }],
    } = await embedRes.json()
    // const { embedding } = await embedRes.json();

    const { data: chunks, error } = await supabaseClient.rpc('chatgpt_search', {
      query_embedding: embedding,
      similarity_threshold: 0.01,
      match_count: matches
    });

    if (error) {
      console.error(error);
      return new Response('Error', { status: 500 });
    }

    res.status(200).json(chunks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'error' });
  }
};

export default handler;
