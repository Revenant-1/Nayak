const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

const GEMINI_MODEL =
  import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/interactions'

const MAX_RETRIES = 3

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function extractGeminiText(data) {
  // New Interactions API response format
  const stepText = data?.steps
    ?.filter((step) => step?.type === 'model_output')
    ?.flatMap((step) => step?.content || [])
    ?.filter((content) => content?.type === 'text')
    ?.map((content) => content?.text)
    ?.filter(Boolean)
    ?.join('\n')
    ?.trim()

  if (stepText) {
    return stepText
  }

  // Some responses may expose output_text directly
  if (typeof data?.output_text === 'string') {
    const text = data.output_text.trim()

    if (text) {
      return text
    }
  }

  // Legacy/alternate output format
  const outputText = data?.outputs
    ?.filter((output) => output?.type === 'text')
    ?.map((output) => output?.text)
    ?.filter(Boolean)
    ?.join('\n')
    ?.trim()

  if (outputText) {
    return outputText
  }

  return ''
}

async function requestGemini(prompt) {
  let lastError = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          model: GEMINI_MODEL,
          input: prompt,
        }),
      })

      if (response.ok) {
        return await response.json()
      }

      let errorMessage =
        `AI request failed with status ${response.status}.`

      try {
        const errorData = await response.json()

        const apiMessage =
          errorData?.error?.message ||
          errorData?.message

        if (apiMessage) {
          errorMessage = apiMessage
        }
      } catch {
        // Keep default error message.
      }

      const temporaryError =
        response.status === 429 ||
        response.status === 500 ||
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504

      if (!temporaryError || attempt === MAX_RETRIES) {
        throw new Error(errorMessage)
      }

      const delay = 1000 * Math.pow(2, attempt)

      console.warn(
        `[gemini] temporary error ${response.status}. ` +
        `Retrying in ${delay / 1000}s...`
      )

      await sleep(delay)

      lastError = new Error(errorMessage)
    } catch (error) {
      lastError = error

      // Retry network failures.
      if (
        error instanceof TypeError &&
        attempt < MAX_RETRIES
      ) {
        const delay = 1000 * Math.pow(2, attempt)

        console.warn(
          `[gemini] network error. ` +
          `Retrying in ${delay / 1000}s...`
        )

        await sleep(delay)
        continue
      }

      throw error
    }
  }

  throw lastError || new Error('Gemini request failed.')
}

export async function askGemini({
  text,
  language = 'en-IN',
} = {}) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'AI fallback is not configured.'
    )
  }

  if (!text || !text.trim()) {
    throw new Error(
      'Question cannot be empty.'
    )
  }

  const prompt = `
You are Nayak, a helpful Indian legal and public-services assistant.

Answer the user's question clearly, accurately, and naturally.

Rules:
- Respond as Nayak. Never mention Gemini, Google, AI models, APIs, fallback systems, backend issues, or technical details.
- Keep every answer short, clear, and concise.
- Give only the information needed to answer the user's question.
- Avoid long explanations, unnecessary background, and repetition.
- Answer in the user's language when possible.
- English → English.
- Hindi → Hindi.
- Mixed language → naturally use the same style.
- For Indian legal, government, public-service, or scheme questions, do not invent laws, sections, schemes, eligibility, deadlines, or procedures.
- If unsure about a fact, say so briefly rather than guessing.
- Prefer 2–5 short sentences or concise bullet points when appropriate.
- Only give a longer answer when the user explicitly asks for details.


Preferred language: ${language}

User question:
${text.trim()}
`.trim()

  const data = await requestGemini(prompt)

  const reply = extractGeminiText(data)

  if (!reply) {
    console.error(
      '[gemini] API returned no usable text:',
      data
    )

    throw new Error(
      'The assistant returned an empty response.'
    )
  }

  return reply
}

export default askGemini
