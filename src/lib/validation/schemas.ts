import { z } from 'zod'

// ============================================
// ERROR MESSAGES (Dutch)
// ============================================
export const errorMessages = {
  // Auth
  nameRequired: 'Naam is verplicht',
  nameMinLength: 'Naam moet minimaal 2 karakters bevatten',
  nameMaxLength: 'Naam mag maximaal 50 karakters bevatten',
  passwordRequired: 'Wachtwoord is verplicht',
  passwordIncorrect: 'Onjuist wachtwoord',

  // Project
  projectNameRequired: 'Projectnaam is verplicht',
  projectNameMinLength: 'Projectnaam moet minimaal 3 karakters bevatten',
  projectNameMaxLength: 'Projectnaam mag maximaal 100 karakters bevatten',
  descriptionMaxLength: 'Beschrijving mag maximaal 500 karakters bevatten',

  // Configuration
  goalRequired: 'Interviewdoel is verplicht',
  goalMinLength: 'Beschrijf het interviewdoel in minimaal 20 karakters',
  goalMaxLength: 'Interviewdoel mag maximaal 1000 karakters bevatten',
  topicsRequired: 'Onderwerpen of vragen zijn verplicht',
  topicsMinLength: 'Voer minimaal 10 karakters aan onderwerpen in',
  topicsMaxLength: 'Onderwerpen/vragen mogen maximaal 2000 karakters bevatten',
  toneRequired: 'Selecteer een tone-of-voice',
  maxQuestionsRange: 'Aantal vragen moet tussen 1 en 20 liggen',
  maxQuestionsInteger: 'Aantal vragen moet een geheel getal zijn',
  welcomeMessageMaxLength: 'Welkomstbericht mag maximaal 300 karakters bevatten',
  closingMessageMaxLength: 'Afsluitbericht mag maximaal 300 karakters bevatten',
  extraInstructionsMaxLength: 'Extra instructies mogen maximaal 1000 karakters bevatten',

  // Interview
  projectNotFound: 'Dit interview bestaat niet. Controleer de link of neem contact op met de beheerder.',
  projectInactive: 'Dit interview is momenteel niet beschikbaar. Neem contact op met de beheerder.',
  microphoneNotFound: 'Geen microfoon gevonden. Sluit een microfoon aan en probeer opnieuw.',
  microphoneDenied: 'Microfoontoestemming geweigerd. Sta toegang tot je microfoon toe in je browserinstellingen om door te gaan.',
  microphoneInUse: 'Je microfoon is in gebruik door een andere applicatie. Sluit andere programma\'s en probeer opnieuw.',
  connectionFailed: 'Kan geen verbinding maken met de server. Controleer je internetverbinding en probeer opnieuw.',
  connectionLost: 'Verbinding verbroken. Proberen opnieuw te verbinden...',
  reconnectionFailed: 'Verbinding kon niet worden hersteld. Je kunt het interview opnieuw starten.',

  // General
  loadFailed: 'Kan gegevens niet laden. Probeer de pagina te vernieuwen.',
  saveFailed: 'Opslaan mislukt. Probeer het opnieuw.',
  deleteFailed: 'Verwijderen mislukt. Probeer het opnieuw.',
  exportFailed: 'Export genereren mislukt. Probeer het opnieuw.',
}

// ============================================
// SCHEMAS
// ============================================

// Auth
export const loginSchema = z.object({
  name: z
    .string()
    .min(1, errorMessages.nameRequired)
    .min(2, errorMessages.nameMinLength)
    .max(50, errorMessages.nameMaxLength),
  password: z.string().min(1, errorMessages.passwordRequired),
})

export type LoginInput = z.infer<typeof loginSchema>

// Project
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, errorMessages.projectNameRequired)
    .min(3, errorMessages.projectNameMinLength)
    .max(100, errorMessages.projectNameMaxLength),
  description: z
    .string()
    .max(500, errorMessages.descriptionMaxLength)
    .optional()
    .nullable(),
})

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(['active', 'inactive']).optional(),
  is_active: z.boolean().optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

// Configuration (Direct Input)
export const directInputConfigSchema = z.object({
  interviewGoal: z
    .string()
    .min(1, errorMessages.goalRequired)
    .min(20, errorMessages.goalMinLength)
    .max(1000, errorMessages.goalMaxLength),
  topicsQuestions: z
    .string()
    .min(1, errorMessages.topicsRequired)
    .min(10, errorMessages.topicsMinLength)
    .max(2000, errorMessages.topicsMaxLength),
  toneOfVoice: z.enum(['friendly', 'formal', 'informal', 'neutral', 'empathetic'], {
    message: errorMessages.toneRequired,
  }),
  maxQuestions: z
    .number({ message: errorMessages.maxQuestionsInteger })
    .int({ message: errorMessages.maxQuestionsInteger })
    .min(1, { message: errorMessages.maxQuestionsRange })
    .max(20, { message: errorMessages.maxQuestionsRange }),
  welcomeMessage: z
    .string()
    .max(300, errorMessages.welcomeMessageMaxLength)
    .optional()
    .nullable(),
  closingMessage: z
    .string()
    .max(300, errorMessages.closingMessageMaxLength)
    .optional()
    .nullable(),
  extraInstructions: z
    .string()
    .max(1000, errorMessages.extraInstructionsMaxLength)
    .optional()
    .nullable(),
})

export type DirectInputConfigInput = z.infer<typeof directInputConfigSchema>

// Full configuration update
export const updateConfigurationSchema = z.object({
  systemPrompt: z.string().optional(),
  goal: z.string().optional(),
  toneOfVoice: z.enum(['friendly', 'formal', 'informal', 'neutral', 'empathetic']).optional(),
  maxQuestions: z.number().int().min(1).max(20).optional(),
  welcomeMessage: z.string().max(300).optional().nullable(),
  closingMessage: z.string().max(300).optional().nullable(),
  topics: z.array(z.string()).optional().nullable(),
  additionalInstructions: z.string().max(1000).optional().nullable(),
  configMethod: z.enum(['ai_chat', 'direct_input']).optional().nullable(),
  isComplete: z.boolean().optional(),
})

export type UpdateConfigurationInput = z.infer<typeof updateConfigurationSchema>
