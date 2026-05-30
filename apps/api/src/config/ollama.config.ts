import { registerAs } from '@nestjs/config'

export default registerAs('ollama', () => ({
  baseUrl: process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434',
  embeddingModel: process.env['OLLAMA_EMBEDDING_MODEL'] ?? 'nomic-embed-text',
  embeddingDimensions: parseInt(process.env['OLLAMA_EMBEDDING_DIMENSIONS'] ?? '768', 10),
  batchSize: parseInt(process.env['OLLAMA_BATCH_SIZE'] ?? '50', 10),
}))
