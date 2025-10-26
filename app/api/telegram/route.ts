import { NextResponse } from 'next/server';
import { z } from 'zod';

const payloadSchema = z.object({
  token: z.string().min(10, 'Bot token is required'),
  chatId: z.string().min(1, 'Channel or chat ID is required'),
  text: z.string().min(1, 'Message text is required')
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { token, chatId, text } = payloadSchema.parse(data);

    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: false
      })
    });

    const body = await telegramResponse.json();

    if (!telegramResponse.ok || !body.ok) {
      return NextResponse.json(
        {
          error: body.description || 'Telegram API returned an error.'
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid payload.' }, { status: 400 });
    }

    console.error('Telegram dispatch failed', error);
    return NextResponse.json({ error: 'Failed to contact Telegram.' }, { status: 500 });
  }
}
