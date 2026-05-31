import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter')

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    let message = 'Internal server error'
    let errors: any = null

    if (exception instanceof HttpException) {
      const res = exception.getResponse()
      if (typeof res === 'object' && res !== null) {
        message = (res as any).message || exception.message
        errors = (res as any).error || (res as any).errors || null
      } else {
        message = exception.message
      }
    } else if (exception instanceof Error) {
      message = exception.message
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} failed with status ${status}: ${exception instanceof Error ? exception.stack : JSON.stringify(exception)}`,
      )
    } else {
      this.logger.warn(`${request.method} ${request.url} failed with status ${status}: ${message}`)
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(errors && { errors }),
    })
  }
}
