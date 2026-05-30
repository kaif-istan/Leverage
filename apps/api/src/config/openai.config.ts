import { registerAs } from '@nestjs/config'

export default registerAs('openai', () => ({
  apiKey: process.env['OPENAI_API_KEY'] ?? '',
  orgId: process.env['OPENAI_ORG_ID'] ?? '',
  defaultModel: process.env['LLM_DEFAULT_MODEL'] ?? 'gpt-4o-mini',
  qualityModel: process.env['LLM_QUALITY_MODEL'] ?? 'gpt-4o',
  maxTokens: parseInt(process.env['LLM_MAX_TOKENS'] ?? '4096', 10),
  temperature: parseFloat(process.env['LLM_TEMPERATURE'] ?? '0.7'),
}))
