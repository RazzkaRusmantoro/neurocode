import { NextRequest, NextResponse } from 'next/server';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface OrgContext {
  orgShortId: string;
}

export interface ChatRequestBody {
  message: string;
  history?: ChatMessage[];
  orgContext?: OrgContext;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const { message, history = [], orgContext } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'message is required and must be a string' },
        { status: 400 }
      );
    }

    const pythonPayload = {
      message: message.trim(),
      history: history.map((m) => ({ role: m.role, content: m.content })),
      org_context: orgContext?.orgShortId
        ? { org_short_id: orgContext.orgShortId }
        : null,
    };

    const response = await fetch(`${PYTHON_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pythonPayload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[chat] Python service error:', response.status, errText);
      return NextResponse.json(
        { error: 'Chat service failed', details: errText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ reply: data.reply ?? '' });
  } catch (e) {
    console.error('[chat] Error:', e);
    return NextResponse.json(
      { error: 'Chat request failed', details: String(e) },
      { status: 500 }
    );
  }
}
