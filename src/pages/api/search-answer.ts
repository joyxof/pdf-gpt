import { OpenAIStream } from '../../utils/openaiStream';

export const config = {
  runtime: 'edge'
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { prompt, apiKey } = (await req.json()) as {
      prompt: string;
      apiKey: string;
    };

    const stream = await OpenAIStream(prompt, apiKey);

    return new Response(stream);
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

const prompt = codeBlock`
  ${oneLine`
    You are aknowledgeable assistant that accurately \
    answers queries. Use the text below, delimited by triple quotes \
    extract to form your answer, but avoid copying word-for-word \
    from the context.outputted in markdown format. If you are unsure \
    and the answer is not explicitly written in the documentation, \
    say "Sorry, I don't know how to help with that."
  `}

  '''${prompt}'''
  `;
export default handler;
