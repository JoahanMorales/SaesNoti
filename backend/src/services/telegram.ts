import axios from 'axios'

export class TelegramNotifier {
  private botToken: string
  private chatId: string
  private enabled: boolean

  constructor(botToken?: string, chatId?: string) {
    this.botToken = botToken || ''
    this.chatId = chatId || ''
    this.enabled = !!(this.botToken && this.chatId)
  }

  isEnabled(): boolean {
    return this.enabled
  }

  async send(message: string): Promise<boolean> {
    if (!this.enabled) return false

    try {
      await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          chat_id: this.chatId,
          text: message,
          parse_mode: 'HTML'
        }
      )
      return true
    } catch (error) {
      console.error('Error enviando mensaje de Telegram:', (error as Error).message)
      return false
    }
  }

  async sendGradeUpdate(username: string, materia: string, anterior: string, nueva: string, campus: string): Promise<boolean> {
    const message = `📚 <b>SaesNoti - Actualización de Calificación</b>

👤 Alumno: ${username}
🏫 Campus: ${campus}

📖 <b>${materia}</b>
Anterior: ${anterior} → Nueva: ${nueva}

⏰ ${new Date().toLocaleString('es-MX')}`

    return this.send(message)
  }

  async sendNewSubject(username: string, materia: string, campus: string): Promise<boolean> {
    const message = `🆕 <b>SaesNoti - Nueva Materia Registrada</b>

👤 Alumno: ${username}
🏫 Campus: ${campus}

📖 <b>${materia}</b>

⏰ ${new Date().toLocaleString('es-MX')}`

    return this.send(message)
  }

  async sendSessionRefresh(username: string, campus: string): Promise<boolean> {
    const message = `🔄 <b>SaesNoti - Sesión Actualizada</b>

👤 ${username} (${campus})
Sesión renovada automáticamente

⏰ ${new Date().toLocaleString('es-MX')}`

    return this.send(message)
  }
}

export const telegram = new TelegramNotifier(
  process.env.TELEGRAM_BOT_TOKEN,
  process.env.TELEGRAM_CHAT_ID
)
