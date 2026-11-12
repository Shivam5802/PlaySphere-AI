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
  // Auto-correct common malformed googleapis URL
  if (apiUrl === 'https://googleapis.com' || apiUrl === 'https://googleapis.com/') {
    apiUrl = 'https://generativelanguage.googleapis.com/v1beta/openai';
  }
  // Strip trailing /chat/completions, /models, or trailing slashes if accidentally appended
  apiUrl = apiUrl.replace(/\/chat\/completions\/?$/i, '');
  apiUrl = apiUrl.replace(/\/models\/?$/i, '');
  apiUrl = apiUrl.replace(/\/+$/, '');
  const apiKey = process.env.LLM_API_KEY;
  const defaultModel = process.env.LLM_MODEL || 'qwen/qwen3.8-27b';
  const fallbackModels = Array.from(new Set([
    defaultModel,
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b'
  ]));
  
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
        console.error(`LLM API Error (${response.status}):`, errorText);

        // If model not found (404) or decommissioned/invalid (400), switch model immediately if available
        const isModelIssue = response.status === 404 || (response.status === 400 && (errorText.includes('decommissioned') || errorText.includes('model')));
        if (isModelIssue && currentModelIndex < fallbackModels.length - 1) {
          currentModelIndex++;
          console.warn(`[callLLM] Model "${currentModel}" failed with HTTP ${response.status}. Switching to fallback model: ${fallbackModels[currentModelIndex]}`);
          continue;
        }

        // Only retry on rate-limit (429) or server errors (5xx)
        const isRetryable = response.status === 429 || response.status >= 500;
        if (isRetryable && attempt < maxRetries) {
          if (response.status === 429 && currentModelIndex < fallbackModels.length - 1) {
            currentModelIndex++;
            console.warn(`[callLLM] HTTP 429. Switching to fallback model: ${fallbackModels[currentModelIndex]}`);
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
      const choice = data.choices?.[0]?.message;
      return choice?.content || choice?.reasoning || '';
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
