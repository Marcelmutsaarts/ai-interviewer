'use client'

import {
  CLOSING_KEYWORDS,
  OPENAI_REALTIME_MODEL_DEFAULT,
  CLOSING_MESSAGE_MATCH_LENGTH,
  CLOSING_DETECTION_DELAY_MS,
} from '@/lib/utils/constants'

// Configuration for the realtime connection
// Note: Voice options are OpenAI Realtime API voices (not OpenRouter)
export interface RealtimeConfig {
  systemPrompt: string
  welcomeMessage: string
  closingMessage: string
  voice?: 'alloy' | 'echo' | 'shimmer' | 'ash' | 'ballad' | 'coral' | 'sage' | 'verse'
  maxQuestions: number
}

// Event types for the connection manager
export type ConnectionEvent =
  | { type: 'status'; status: 'connecting' | 'connected' | 'disconnected' | 'error' }
  | { type: 'speaking'; isSpeaking: boolean }
  | { type: 'listening'; isListening: boolean }
  | { type: 'transcript'; role: 'ai' | 'participant'; content: string; isComplete: boolean }
  | { type: 'error'; message: string }
  | { type: 'closing_detected' }

export type EventHandler = (event: ConnectionEvent) => void

/**
 * Manages the WebRTC connection to OpenAI's Realtime API for voice interviews.
 * Note: This uses OpenAI directly, not OpenRouter. The Realtime API is a proprietary
 * WebRTC-based protocol that only works with OpenAI's servers.
 * Handles audio input/output, transcription, and event propagation.
 */
export class RealtimeConnectionManager {
  private pc: RTCPeerConnection | null = null
  private dc: RTCDataChannel | null = null
  private audioElement: HTMLAudioElement | null = null
  private mediaStream: MediaStream | null = null
  private eventHandlers: Set<EventHandler> = new Set()
  private config: RealtimeConfig | null = null
  private isConnected = false
  private isMuted = false
  private closingMessage = ''
  private sessionConfigured = false

  /**
   * Subscribe to connection events
   */
  onEvent(handler: EventHandler): () => void {
    this.eventHandlers.add(handler)
    return () => {
      this.eventHandlers.delete(handler)
    }
  }

  /**
   * Emit an event to all subscribed handlers
   */
  private emit(event: ConnectionEvent) {
    this.eventHandlers.forEach((handler) => handler(event))
  }

  /**
   * Connect to the OpenAI Realtime API
   */
  async connect(ephemeralToken: string, config: RealtimeConfig): Promise<void> {
    this.config = config
    this.closingMessage = config.closingMessage

    this.emit({ type: 'status', status: 'connecting' })

    try {
      // Create peer connection
      this.pc = new RTCPeerConnection()

      // Set up audio output
      this.audioElement = document.createElement('audio')
      this.audioElement.autoplay = true

      this.pc.ontrack = (e) => {
        if (this.audioElement && e.streams[0]) {
          this.audioElement.srcObject = e.streams[0]
        }
      }

      // Monitor ICE connection state for better error handling
      this.pc.oniceconnectionstatechange = () => {
        const state = this.pc?.iceConnectionState
        console.log('[ConnectionManager] ICE state:', state)

        if (state === 'failed' || state === 'disconnected') {
          this.emit({ type: 'error', message: 'Verbinding verbroken' })
        }

        if (state === 'connected') {
          this.emit({ type: 'status', status: 'connected' })
        }
      }

      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      // Add audio track to peer connection
      const audioTrack = this.mediaStream.getAudioTracks()[0]
      this.pc.addTrack(audioTrack, this.mediaStream)

      // Create data channel for events
      this.dc = this.pc.createDataChannel('oai-events')
      this.setupDataChannel()

      // Create and set local description
      const offer = await this.pc.createOffer()
      await this.pc.setLocalDescription(offer)

      // Send offer to OpenAI Realtime API (not OpenRouter - Realtime is OpenAI-specific)
      const baseUrl = 'https://api.openai.com/v1/realtime'
      const model = OPENAI_REALTIME_MODEL_DEFAULT

      const response = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralToken}`,
          'Content-Type': 'application/sdp',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to connect to OpenAI: ${response.status} - ${errorText}`)
      }

      // Set remote description from OpenAI's answer
      const answerSdp = await response.text()
      await this.pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      })

      this.isConnected = true
    } catch (error) {
      console.error('Connection error:', error)
      this.emit({ type: 'status', status: 'error' })
      this.emit({
        type: 'error',
        message: error instanceof Error ? error.message : 'Verbinding mislukt',
      })
      this.disconnect()
      throw error
    }
  }

  /**
   * Set up the data channel event handlers
   */
  private setupDataChannel() {
    if (!this.dc) return

    this.dc.onopen = () => {
      this.emit({ type: 'status', status: 'connected' })
      // Configure the session
      this.configureSession()
    }

    this.dc.onclose = () => {
      if (this.isConnected) {
        this.emit({ type: 'status', status: 'disconnected' })
        this.isConnected = false
      }
    }

    this.dc.onerror = (error) => {
      console.error('DataChannel error:', error)
      this.emit({ type: 'status', status: 'error' })
      this.emit({ type: 'error', message: 'Verbinding verbroken' })
    }

    this.dc.onmessage = (event) => {
      this.handleServerEvent(JSON.parse(event.data))
    }
  }

  /**
   * Configure the session with system prompt and settings
   */
  private configureSession() {
    if (!this.dc || !this.config) return

    // Reset session configured flag
    this.sessionConfigured = false

    // Update session configuration
    const sessionUpdate = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: this.config.systemPrompt,
        voice: this.config.voice || 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      },
    }

    this.dc.send(JSON.stringify(sessionUpdate))
    // Welcome message is sent after receiving session.updated event in handleServerEvent
  }

  /**
   * Send the welcome message after session is configured
   */
  private sendWelcomeMessage() {
    if (!this.dc || !this.config?.welcomeMessage) return

    const welcomeItem = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: this.config.welcomeMessage,
          },
        ],
      },
    }
    this.dc.send(JSON.stringify(welcomeItem))

    // Trigger AI to speak the welcome message
    const responseCreate = {
      type: 'response.create',
    }
    this.dc.send(JSON.stringify(responseCreate))
  }

  /**
   * Handle events from the OpenAI Realtime API
   */
  private handleServerEvent(event: Record<string, unknown>) {
    const eventType = event.type as string

    switch (eventType) {
      case 'session.updated':
        // Session configuration has been applied by the server
        // Now it's safe to send the welcome message
        if (!this.sessionConfigured) {
          this.sessionConfigured = true
          console.log('[ConnectionManager] Session configured, sending welcome message')
          this.sendWelcomeMessage()
        }
        break

      case 'response.audio_transcript.delta':
        // AI is speaking - partial transcript
        this.emit({
          type: 'transcript',
          role: 'ai',
          content: (event.delta as string) || '',
          isComplete: false,
        })
        break

      case 'response.audio_transcript.done':
        // AI finished speaking - complete transcript
        const aiTranscript = (event.transcript as string) || ''
        this.emit({
          type: 'transcript',
          role: 'ai',
          content: aiTranscript,
          isComplete: true,
        })
        // Check for closing keywords
        this.checkForClosing(aiTranscript)
        break

      case 'conversation.item.input_audio_transcription.completed':
        // Participant finished speaking
        this.emit({
          type: 'transcript',
          role: 'participant',
          content: (event.transcript as string) || '',
          isComplete: true,
        })
        break

      case 'input_audio_buffer.speech_started':
        // Participant started speaking
        this.emit({ type: 'listening', isListening: true })
        break

      case 'input_audio_buffer.speech_stopped':
        // Participant stopped speaking
        this.emit({ type: 'listening', isListening: false })
        break

      case 'response.audio.started':
        // AI started speaking audio
        this.emit({ type: 'speaking', isSpeaking: true })
        break

      case 'response.audio.done':
      case 'response.done':
        // AI finished speaking audio
        this.emit({ type: 'speaking', isSpeaking: false })
        break

      case 'error':
        console.error('Server error:', event)
        this.emit({
          type: 'error',
          message: (event.error as { message?: string })?.message || 'Er is een fout opgetreden',
        })
        break

      default:
        // In development, log event types only (not full event data to avoid sensitive info exposure)
        if (process.env.NODE_ENV === 'development') {
          console.log('Server event type:', eventType)
        }
    }
  }

  /**
   * Check if the AI's message contains closing keywords
   */
  private checkForClosing(transcript: string) {
    const lowerTranscript = transcript.toLowerCase()

    // Check for configured closing message (match first N characters to handle variations)
    if (
      this.closingMessage &&
      lowerTranscript.includes(
        this.closingMessage.toLowerCase().substring(0, CLOSING_MESSAGE_MATCH_LENGTH)
      )
    ) {
      setTimeout(() => {
        this.emit({ type: 'closing_detected' })
      }, CLOSING_DETECTION_DELAY_MS)
      return
    }

    // Check for standard closing keywords
    const hasClosingKeyword = CLOSING_KEYWORDS.some((keyword) =>
      lowerTranscript.includes(keyword.toLowerCase())
    )

    if (hasClosingKeyword) {
      setTimeout(() => {
        this.emit({ type: 'closing_detected' })
      }, CLOSING_DETECTION_DELAY_MS)
    }
  }

  /**
   * Mute or unmute the microphone
   */
  setMuted(muted: boolean) {
    this.isMuted = muted
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted
      })
    }
  }

  /**
   * Check if currently muted
   */
  getMuted(): boolean {
    return this.isMuted
  }

  /**
   * Set the audio output volume (0-1)
   */
  setVolume(volume: number) {
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume))
    }
  }

  /**
   * Mute or unmute the audio output
   */
  setOutputMuted(muted: boolean) {
    if (this.audioElement) {
      this.audioElement.muted = muted
    }
  }

  /**
   * Send a text message to the AI (for testing or accessibility)
   */
  sendTextMessage(text: string) {
    if (!this.dc || this.dc.readyState !== 'open') {
      console.error('Cannot send message: data channel not open')
      return
    }

    // Add user message to conversation
    const userItem = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text,
          },
        ],
      },
    }
    this.dc.send(JSON.stringify(userItem))

    // Trigger AI response
    const responseCreate = {
      type: 'response.create',
    }
    this.dc.send(JSON.stringify(responseCreate))
  }

  /**
   * Disconnect from the Realtime API and clean up resources
   */
  disconnect() {
    this.isConnected = false

    // Stop all media tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop())
      this.mediaStream = null
    }

    // Close data channel
    if (this.dc) {
      this.dc.close()
      this.dc = null
    }

    // Close peer connection
    if (this.pc) {
      this.pc.close()
      this.pc = null
    }

    // Remove audio element
    if (this.audioElement) {
      this.audioElement.srcObject = null
      this.audioElement = null
    }

    this.emit({ type: 'status', status: 'disconnected' })
  }

  /**
   * Check if currently connected
   */
  isCurrentlyConnected(): boolean {
    return this.isConnected && this.dc?.readyState === 'open'
  }
}

// Singleton instance for the connection manager
let connectionManagerInstance: RealtimeConnectionManager | null = null

/**
 * Get or create the singleton connection manager instance
 */
export function getConnectionManager(): RealtimeConnectionManager {
  if (!connectionManagerInstance) {
    connectionManagerInstance = new RealtimeConnectionManager()
  }
  return connectionManagerInstance
}

/**
 * Reset the connection manager instance (useful for testing)
 */
export function resetConnectionManager() {
  if (connectionManagerInstance) {
    connectionManagerInstance.disconnect()
    connectionManagerInstance = null
  }
}
