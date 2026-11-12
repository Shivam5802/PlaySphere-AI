export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  max_tokens?: number;
}

/**
 * Calls a hosted LLM API that provides an OpenAI-compatible /chat/completions endpoint.
 * Requires LLM_API_URL, LLM_API_KEY, and LLM_MODEL in environment variables.
 */
export async function callLLM(messages: ChatMessage[], options?: LLMOptions): Promise<string> {
  let apiUrl = (process.env.LLM_API_URL || 'https://api.groq.com/openai/v1').trim();
  // Normalize URL by removing trailing slashes and unintended endpoints
  apiUrl = apiUrl.replace(/\/+$/, '');
  if (apiUrl.endsWith('/models')) {
    apiUrl = apiUrl.replace(/\/models$/, '');
  } else if (apiUrl.endsWith('/chat/completions')) {
    apiUrl = apiUrl.replace(/\/chat\/completions$/, '');
  }

  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error('LLM_API_KEY is not configured in environment variables');
  }

  const defaultModel = process.env.LLM_MODEL || 'qwen/qwen3.8-27b';
  const candidateModels = [
    defaultModel,
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant'
  ];
  const fallbackModels = Array.from(new Set(candidateModels.filter(Boolean)));
  
  const maxRetries = 4;
  let attempt = 0;
  let currentModelIndex = 0;

  while (attempt < maxRetries) {
    attempt++;
    const currentModel = fallbackModels[currentModelIndex];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: currentModel,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.max_tokens ?? 1024,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`LLM API Error (${response.status}) [model: ${currentModel}]:`, errorText);

        // Retry on rate-limit (429) or model-not-found / server errors (5xx)
        const isRetryable = response.status === 429 || response.status === 404 || response.status >= 500;
        if (isRetryable && attempt < maxRetries) {
          if ((response.status === 429 || response.status === 404) && currentModelIndex < fallbackModels.length - 1) {
            currentModelIndex++;
            console.warn(`[callLLM] HTTP ${response.status}. Switching to fallback model: ${fallbackModels[currentModelIndex]}`);
            await new Promise((resolve) => setTimeout(resolve, 500));
            continue;
          }
          
          const delay = response.status === 429 ? 2000 : 1000;
          console.warn(`[callLLM] HTTP ${response.status}. Retrying attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw new Error(`LLM API failed with status ${response.status}: ${errorText.slice(0, 200)}`);
      }

      const data = await response.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error(`LLM API returned unexpected format: ${JSON.stringify(data).slice(0, 200)}`);
      }
      return data.choices[0].message.content || '';
    } catch (error) {
      if (attempt >= maxRetries) {
        console.error('Error calling LLM after max retries:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error('LLM request timed out after 30 seconds.');
        }
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error('LLM API failed after maximum retries');
}
