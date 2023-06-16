import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser';
import getOpenAIBaseUrl from './getOpenAIBaseUrl';

export const OpenAIStream = async (prompt: string, apiKey: string) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();


  const res = await fetch('https://joyxof.openai.azure.com/openai/deployments/redfox1/chat/completions?api-version=2023-05-15', {
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      // model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:  `You are aknowledgeable assistant that accurately answers queries. 
          Use the text provided to form your answer, but avoid copying word-for-word
          from the context.Please answer in concise Chinese and keep it within 400 words.
          If you are unsure and the answer is not explicitly writtenin the text, \
          say "Sorry, I don't know."
          `
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 512,
      stream: true
    })
  });

  if (res.status !== 200) {
    throw new Error('OpenAI API returned an error');
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;

          if (data === '[DONE]') {
            controller.close();
            return;
          }

          try {
            const json = JSON.parse(data);
            const text = json.choices[0].text;
            // const text = json.choices[0].delta.content;
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    }
  });

  return stream;
};
