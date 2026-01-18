import { GoogleGenerativeAI } from '@google/generative-ai'
import type { InterviewSession } from '@/types/database'
import { formatDate } from '@/lib/utils/date'
import { GEMINI_CHAT_MODEL } from '@/lib/utils/constants'

// Partial transcript message without session_id since it's not needed for export
export interface TranscriptMessageForExport {
  id: string
  role: 'ai' | 'participant'
  content: string
  created_at: string
}

export interface SessionWithMessages extends InterviewSession {
  transcript_messages: TranscriptMessageForExport[]
}

interface ClusteredQA {
  sessionId: string
  date: string
  status: string
  theme: string
  mainQuestion: string
  followUpQuestions: string
  answer: string
  questionNumber: number
}

interface ClusterResult {
  theme: string
  mainQuestion: string
  followUpQuestions: string
  answer: string
  questionNumber: number
}

const CLUSTERING_PROMPT = `Je bent een data-analist die interviewtranscripties analyseert.

TAAK:
Analyseer het volgende gesprek en cluster het in vraag-antwoord blokken.

TRANSCRIPT:
{transcript}

OUTPUT FORMAT (JSON):
{
  "clusters": [
    {
      "theme": "Kort thema (max 3 woorden)",
      "mainQuestion": "De hoofdvraag van de AI",
      "followUpQuestions": "Eventuele doorvragen, gescheiden door |",
      "answer": "Samengevat antwoord van de deelnemer (max 150 woorden)",
      "questionNumber": 1
    }
  ]
}

REGELS:
- Groepeer gerelateerde vragen en antwoorden bij elkaar
- Vat lange antwoorden samen, behoud de essentie
- Identificeer het thema van elke cluster
- Doorvragen horen bij de originele vraag
- Lege of non-substantiele antwoorden: noteer als "Geen inhoudelijk antwoord"
- Behoud de chronologische volgorde met questionNumber
- Maximaal 20 clusters per transcript`

/**
 * Generates a CSV export of interview sessions with AI-powered clustering.
 * The function analyzes transcripts and groups related Q&A pairs together.
 */
export async function generateExportCSV(
  projectId: string,
  sessions: SessionWithMessages[]
): Promise<string> {
  // Filter sessions with meaningful content (more than just welcome/goodbye)
  const validSessions = sessions.filter(
    (s) => s.transcript_messages && s.transcript_messages.length > 2
  )

  if (validSessions.length === 0) {
    throw new Error('Geen sessies met inhoud om te exporteren')
  }

  const allClusters: ClusteredQA[] = []

  for (const session of validSessions) {
    try {
      // Format transcript for AI analysis
      const transcript = formatTranscriptForAI(session.transcript_messages)

      // Get AI clustering
      const clusters = await clusterWithAI(transcript)

      // Add session metadata to each cluster
      for (const cluster of clusters) {
        allClusters.push({
          sessionId: session.id.slice(0, 8),
          date: formatDate(session.started_at),
          status: translateStatus(session.status || 'active'),
          theme: cluster.theme,
          mainQuestion: cluster.mainQuestion,
          followUpQuestions: cluster.followUpQuestions || '',
          answer: cluster.answer,
          questionNumber: cluster.questionNumber,
        })
      }
    } catch (error) {
      console.error(`Error clustering session ${session.id}:`, error)
      // Use fallback clustering when AI fails
      const fallbackClusters = fallbackClustering(session.transcript_messages)
      for (const cluster of fallbackClusters) {
        allClusters.push({
          sessionId: session.id.slice(0, 8),
          date: formatDate(session.started_at),
          status: translateStatus(session.status || 'active'),
          ...cluster,
        })
      }
    }
  }

  return generateCSVString(allClusters)
}

/**
 * Formats transcript messages into a readable format for AI analysis.
 */
function formatTranscriptForAI(messages: TranscriptMessageForExport[]): string {
  return messages
    .map((m) => `[${m.role === 'ai' ? 'AI' : 'DEELNEMER'}]: ${m.content}`)
    .join('\n\n')
}

/**
 * Uses Google Gemini to cluster the transcript into Q&A pairs with themes.
 */
async function clusterWithAI(transcript: string): Promise<ClusterResult[]> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY or GOOGLE_API_KEY not configured')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: GEMINI_CHAT_MODEL,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4000,
      responseMimeType: 'application/json',
    },
  })

  const prompt = CLUSTERING_PROMPT.replace('{transcript}', transcript)

  const result = await model.generateContent(prompt)
  const content = result.response.text()
  const parsed = JSON.parse(content)
  return parsed.clusters || []
}

/**
 * Fallback clustering when AI is unavailable.
 * Creates simple Q&A pairs without thematic analysis.
 */
function fallbackClustering(messages: TranscriptMessageForExport[]): ClusterResult[] {
  const clusters: ClusterResult[] = []
  let currentQuestion = ''
  let questionNum = 0

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (msg.role === 'ai') {
      currentQuestion = msg.content
      questionNum++
    } else if (msg.role === 'participant' && currentQuestion) {
      clusters.push({
        theme: 'Algemeen',
        mainQuestion: currentQuestion,
        followUpQuestions: '',
        answer: msg.content.slice(0, 500),
        questionNumber: questionNum,
      })
      currentQuestion = ''
    }
  }

  return clusters
}

/**
 * Generates the final CSV string with UTF-8 BOM for Excel compatibility.
 */
function generateCSVString(data: ClusteredQA[]): string {
  // UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF'

  const headers = [
    'Sessie ID',
    'Datum',
    'Status',
    'Thema',
    'Hoofdvraag',
    'Doorvragen',
    'Antwoord',
    'Vraagnummer',
  ]

  const rows = data.map((row) =>
    [
      escapeCSV(row.sessionId),
      escapeCSV(row.date),
      escapeCSV(row.status),
      escapeCSV(row.theme),
      escapeCSV(row.mainQuestion),
      escapeCSV(row.followUpQuestions),
      escapeCSV(row.answer),
      row.questionNumber.toString(),
    ].join(',')
  )

  return BOM + headers.join(',') + '\n' + rows.join('\n')
}

/**
 * Escapes a value for CSV format.
 * Handles quotes, commas, and newlines.
 */
function escapeCSV(value: string): string {
  if (!value) return ''
  // Replace newlines with spaces and remove carriage returns
  const cleaned = value.replace(/\n/g, ' ').replace(/\r/g, '')
  // Wrap in quotes if contains special characters
  if (cleaned.includes(',') || cleaned.includes('"')) {
    return `"${cleaned.replace(/"/g, '""')}"`
  }
  return cleaned
}

/**
 * Translates session status to Dutch.
 */
function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    completed: 'Voltooid',
    abandoned: 'Afgebroken',
    active: 'Actief',
  }
  return translations[status] || status
}
