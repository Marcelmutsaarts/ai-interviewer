export const CONFIG_ASSISTANT_PROMPT = `Je bent een configuratie-assistent voor het AI Interviewer platform.
Je helpt beheerders om interviewconfiguraties te maken door vriendelijke gesprekken.

JOUW TAKEN:
1. Vraag de beheerder wat voor interview ze willen afnemen
2. Stel verduidelijkende vragen om de volgende informatie te verzamelen:
   - Doel van het interview (VERPLICHT)
   - Specifieke onderwerpen of vragen (VERPLICHT)
   - Gewenste tone-of-voice (friendly/formal/informal/neutral/empathetic)
   - Maximum aantal vragen (standaard: 8, range: 1-20)
   - Welkomstbericht (optioneel - anders genereer je een passend bericht)
   - Afsluitbericht (optioneel - anders genereer je een passend bericht)
   - Extra instructies voor de AI (optioneel)

3. Zodra je genoeg informatie hebt, genereer de configuratie

CONFIGURATIE OUTPUT FORMAT:
Wanneer de configuratie compleet is, voeg dit exacte blok toe aan je antwoord:

---CONFIGURATIE_START---
DOEL: [het interviewdoel in 1-3 zinnen]
TONE: [friendly|formal|informal|neutral|empathetic]
MAX_VRAGEN: [nummer 1-20]
WELKOM: [welkomstbericht]
AFSLUITING: [afsluitbericht]
ONDERWERPEN:
- [onderwerp/vraag 1]
- [onderwerp/vraag 2]
- [etc.]
EXTRA_INSTRUCTIES: [eventuele extra instructies of GEEN]
---CONFIGURATIE_EINDE---

GESPREKSSTIJL:
- Wees vriendelijk en behulpzaam
- Stel een of twee vragen per keer
- Geef voorbeelden en suggesties waar nuttig
- Bevestig dat je de beheerder begrijpt
- Vat kort samen voordat je de configuratie genereert
- Spreek Nederlands

VOORBEELD GESPREK:
Beheerder: "Ik wil studenten interviewen over hun stage"
Jij: "Interessant! Wat wil je specifiek weten over hun stage-ervaringen? Denk aan leermomenten, uitdagingen, begeleiding..."

Beheerder: "Vooral wat ze geleerd hebben en wat beter kon"
Jij: "Prima! Welke toon past bij jouw organisatie? Kies uit:
- Vriendelijk (warm, toegankelijk)
- Formeel (zakelijk, u-vorm)
- Informeel (casual, relaxed)
- Neutraal (objectief, direct)
- Empathisch (begripvol, ondersteunend)"

[Na voldoende info:]
Jij: "Perfect! Op basis van ons gesprek heb ik de volgende configuratie:
[configuratie blok]
Je kunt de link nu delen met studenten!"
`

export interface ParsedConfiguration {
  goal?: string
  toneOfVoice?: 'friendly' | 'formal' | 'informal' | 'neutral' | 'empathetic'
  maxQuestions?: number
  welcomeMessage?: string
  closingMessage?: string
  topics?: string[]
  additionalInstructions?: string
}

export function parseConfigurationFromResponse(response: string): ParsedConfiguration | null {
  const configMatch = response.match(
    /---CONFIGURATIE_START---([\s\S]*?)---CONFIGURATIE_EINDE---/
  )

  if (!configMatch) return null

  const configText = configMatch[1]
  const config: ParsedConfiguration = {}

  // Parse DOEL - use [\s\S] instead of s flag for ES2017 compatibility
  const goalMatch = configText.match(/DOEL:\s*([\s\S]+?)(?=\n[A-Z_]+:|$)/)
  if (goalMatch) config.goal = goalMatch[1].trim()

  // Parse TONE - accepts both English and Dutch values
  const toneMatch = configText.match(/TONE:\s*(friendly|vriendelijk|formal|formeel|informal|informeel|neutral|neutraal|empathetic|empathisch)/i)
  if (toneMatch) {
    const toneValue = toneMatch[1].toLowerCase()
    // Map Dutch values to English
    const toneMap: Record<string, string> = {
      'vriendelijk': 'friendly',
      'formeel': 'formal',
      'informeel': 'informal',
      'neutraal': 'neutral',
      'empathisch': 'empathetic',
    }
    config.toneOfVoice = (toneMap[toneValue] || toneValue) as ParsedConfiguration['toneOfVoice']
  }

  // Parse MAX_VRAGEN
  const maxQMatch = configText.match(/MAX_VRAGEN:\s*(\d+)/)
  if (maxQMatch) {
    config.maxQuestions = Math.min(20, Math.max(1, parseInt(maxQMatch[1])))
  }

  // Parse WELKOM - use [\s\S] instead of s flag
  const welcomeMatch = configText.match(/WELKOM:\s*([\s\S]+?)(?=\n[A-Z_]+:|$)/)
  if (welcomeMatch && !welcomeMatch[1].trim().toUpperCase().includes('GENEREER')) {
    config.welcomeMessage = welcomeMatch[1].trim()
  }

  // Parse AFSLUITING - use [\s\S] instead of s flag
  const closingMatch = configText.match(/AFSLUITING:\s*([\s\S]+?)(?=\n[A-Z_]+:|$)/)
  if (closingMatch && !closingMatch[1].trim().toUpperCase().includes('GENEREER')) {
    config.closingMessage = closingMatch[1].trim()
  }

  // Parse ONDERWERPEN
  const topicsMatch = configText.match(/ONDERWERPEN:\s*([\s\S]*?)(?=EXTRA_INSTRUCTIES:|---CONFIGURATIE_EINDE---|$)/)
  if (topicsMatch) {
    config.topics = topicsMatch[1]
      .split('\n')
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(line => line.length > 0)
  }

  // Parse EXTRA_INSTRUCTIES - use [\s\S] instead of s flag
  const extraMatch = configText.match(/EXTRA_INSTRUCTIES:\s*([\s\S]+?)(?=\n---|$)/)
  if (extraMatch && !extraMatch[1].trim().toUpperCase().includes('GEEN')) {
    config.additionalInstructions = extraMatch[1].trim()
  }

  // Validate required fields
  if (!config.goal || !config.topics || config.topics.length === 0) {
    return null
  }

  return config
}
