import type { ToneOfVoice } from '@/types/database'

export interface DirectInputForm {
  interviewGoal: string
  topicsQuestions: string
  toneOfVoice: ToneOfVoice
  maxQuestions: number
  welcomeMessage?: string | null
  closingMessage?: string | null
  extraInstructions?: string | null
}

export interface GeneratedConfigInput {
  goal: string
  toneOfVoice: ToneOfVoice
  maxQuestions: number
  welcomeMessage?: string | null
  closingMessage?: string | null
  topics?: string[] | null
  additionalInstructions?: string | null
}

const TONE_DESCRIPTIONS: Record<ToneOfVoice, string> = {
  friendly: 'Vriendelijk en toegankelijk. Gebruik een warme, open toon. Wees geinteresseerd en bemoedigend.',
  formal: 'Formeel en professioneel. Gebruik u-vorm. Blijf zakelijk maar respectvol.',
  informal: 'Informeel en casual. Gebruik je-vorm. Wees relaxed en benaderbaar.',
  neutral: 'Neutraal en objectief. Geen sterke emotie. Directe, heldere communicatie.',
  empathetic: 'Empathisch en begripvol. Toon begrip voor gevoelens. Wees ondersteunend en geduldig.',
}

const WELCOME_TEMPLATES: Record<ToneOfVoice, string> = {
  friendly: 'Hallo! Fijn dat je er bent. Ik ga je een paar vragen stellen over {topic}. Voel je vrij om zo uitgebreid te antwoorden als je wilt.',
  formal: 'Goedendag. Welkom bij dit interview over {topic}. Ik zal u enkele vragen stellen. Neemt u alstublieft de tijd om uitgebreid te antwoorden.',
  informal: 'Hey! Leuk dat je meedoet aan dit interview over {topic}. Ik ga je wat vragen stellen, gewoon relaxed antwoorden!',
  neutral: 'Welkom bij dit interview over {topic}. Ik zal je enkele vragen stellen. Geef alsjeblieft zo volledig mogelijk antwoord.',
  empathetic: 'Welkom, fijn dat je de tijd neemt voor dit gesprek over {topic}. Ik begrijp dat sommige vragen misschien lastig zijn - neem gerust je tijd.',
}

const CLOSING_TEMPLATES: Record<ToneOfVoice, string> = {
  friendly: 'Heel erg bedankt voor je openheid en eerlijke antwoorden! Je input is echt waardevol. Fijne dag verder!',
  formal: 'Dank u wel voor uw deelname aan dit interview. Uw input wordt zeer gewaardeerd. Nog een prettige dag.',
  informal: 'Top, dat was het! Bedankt voor je antwoorden, echt super! Fijne dag nog!',
  neutral: 'Bedankt voor je deelname. Het interview is nu afgerond. Je antwoorden zijn opgeslagen.',
  empathetic: 'Dank je wel voor het delen van je ervaringen en gedachten. Ik waardeer je openheid enorm. Zorg goed voor jezelf!',
}

function extractMainTopic(goal: string): string {
  const words = goal.toLowerCase().split(/\s+/)
  const stopWords = ['een', 'het', 'de', 'om', 'te', 'over', 'van', 'met', 'voor', 'naar', 'bij', 'in', 'en', 'of']

  const meaningfulWords = words
    .filter(w => !stopWords.includes(w) && w.length > 2)
    .slice(0, 3)
    .join(' ')

  return meaningfulWords || 'het onderwerp'
}

/**
 * Generate a welcome message based on tone of voice and goal
 */
export function generateWelcomeMessage(toneOfVoice: ToneOfVoice, goal: string): string {
  const mainTopic = extractMainTopic(goal)
  return WELCOME_TEMPLATES[toneOfVoice].replace('{topic}', mainTopic)
}

/**
 * Generate a closing message based on tone of voice
 */
export function generateClosingMessage(toneOfVoice: ToneOfVoice): string {
  return CLOSING_TEMPLATES[toneOfVoice]
}

export function generateSystemPrompt(config: GeneratedConfigInput): string {
  const mainTopic = extractMainTopic(config.goal)

  // Generate welcome message if not provided
  const welcomeMessage = config.welcomeMessage?.trim() ||
    WELCOME_TEMPLATES[config.toneOfVoice].replace('{topic}', mainTopic)

  // Generate closing message if not provided
  const closingMessage = config.closingMessage?.trim() ||
    CLOSING_TEMPLATES[config.toneOfVoice]

  // Build topics string
  const topicsString = config.topics && config.topics.length > 0
    ? config.topics.map(t => `- ${t}`).join('\n')
    : ''

  return `Je bent een AI interviewer die spraakinterviews afneemt.

CONTEXT EN DOEL:
${config.goal}

${topicsString ? `ONDERWERPEN EN VRAGEN DIE AAN BOD MOETEN KOMEN:\n${topicsString}` : ''}

INTERVIEW INSTRUCTIES:
- Je voert een interview via spraak
- Tone-of-voice: ${config.toneOfVoice} - ${TONE_DESCRIPTIONS[config.toneOfVoice]}
- Stel maximaal ${config.maxQuestions} vragen
- Taal: Nederlands
- Begin met: "${welcomeMessage}"
- Sluit af met: "${closingMessage}"

GESPREKSRICHTLIJNEN:
- Luister actief en stel doorvragen waar relevant
- Houd je antwoorden beknopt (2-3 zinnen per beurt)
- Wees empathisch en geinteresseerd
- Tel het aantal vragen dat je stelt
- Als je ${config.maxQuestions} vragen hebt gesteld, rond dan netjes af
- Reageer natuurlijk op korte of lange antwoorden
- Bij interessante antwoorden, vraag door voor meer detail
- Bij korte antwoorden, moedig de deelnemer aan om uit te weiden

VRAAGVOLGORDE:
- Begin met een makkelijke opwarmvraag
- Werk naar complexere of gevoeligere onderwerpen
- Sluit af met een open vraag voor aanvullingen

${config.additionalInstructions ? `EXTRA INSTRUCTIES:\n${config.additionalInstructions}` : ''}

BELANGRIJK:
- Spreek altijd in het Nederlands
- Wacht op het antwoord voordat je de volgende vraag stelt
- Als de deelnemer afdwaalt, leid het gesprek vriendelijk terug
- Bij onduidelijke antwoorden, vraag om verduidelijking`
}

export function generateConfiguration(form: DirectInputForm): {
  systemPrompt: string
  welcomeMessage: string
  closingMessage: string
  topics: string[]
} {
  const mainTopic = extractMainTopic(form.interviewGoal)

  // Generate welcome message if not provided
  const welcomeMessage = form.welcomeMessage?.trim() ||
    WELCOME_TEMPLATES[form.toneOfVoice].replace('{topic}', mainTopic)

  // Generate closing message if not provided
  const closingMessage = form.closingMessage?.trim() ||
    CLOSING_TEMPLATES[form.toneOfVoice]

  // Parse topics from string
  const topics = form.topicsQuestions
    .split('\n')
    .map(line => line.replace(/^[-*]\s*/, '').trim())
    .filter(line => line.length > 0)

  // Build the system prompt
  const systemPrompt = generateSystemPrompt({
    goal: form.interviewGoal,
    toneOfVoice: form.toneOfVoice,
    maxQuestions: form.maxQuestions,
    welcomeMessage,
    closingMessage,
    topics,
    additionalInstructions: form.extraInstructions,
  })

  return {
    systemPrompt,
    welcomeMessage,
    closingMessage,
    topics,
  }
}
