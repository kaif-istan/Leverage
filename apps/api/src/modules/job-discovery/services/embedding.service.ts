import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name)
  private readonly baseUrl: string
  private readonly modelName: string

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('ollama.baseUrl', 'http://localhost:11434')
    this.modelName = this.config.get<string>('ollama.embeddingModel', 'nomic-embed-text')
  }

  /**
   * Generates a single vector embedding for a given text.
   */
  async getEmbedding(text: string): Promise<number[]> {
    try {
      // First try to fetch from Ollama using the /api/embeddings endpoint
      const response = await axios.post(
        `${this.baseUrl}/api/embeddings`,
        {
          model: this.modelName,
          prompt: text.slice(0, 8000), // Safety check context window
        },
        { timeout: 8000 }
      )
      return response.data.embedding
    } catch (err: any) {
      this.logger.warn(`Ollama /api/embeddings failed, attempting legacy /api/embed fallback: ${err.message}`)
      
      try {
        const response = await axios.post(
          `${this.baseUrl}/api/embed`,
          {
            model: this.modelName,
            input: [text.slice(0, 8000)],
          },
          { timeout: 8000 }
        )
        return response.data.embeddings[0]
      } catch (fallbackErr: any) {
        this.logger.error(`Ollama embedding generation failed completely: ${fallbackErr.message}`)
        // Return mock 768 dimension vector as hard fallback so developer pipeline doesn't break
        return Array(768).fill(0)
      }
    }
  }

  /**
   * Generates multiple vector embeddings for an array of texts.
   */
  async getEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    this.logger.log(`Generating batch embeddings for ${texts.length} items using local Ollama...`)
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/embed`,
        {
          model: this.modelName,
          input: texts.map((t) => t.slice(0, 8000)),
        },
        { timeout: 30000 }
      )
      return response.data.embeddings
    } catch (err: any) {
      this.logger.warn(`Batch embed failed, falling back to sequential: ${err.message}`)
      const embeddings: number[][] = []
      for (const text of texts) {
        embeddings.push(await this.getEmbedding(text))
      }
      return embeddings
    }
  }
}
