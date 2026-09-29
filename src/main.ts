import 'dotenv/config';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: () =>
        new BadRequestException({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data.',
          },
        }),
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Appointment Booking API')
    .setDescription(
      'API for viewing available appointment slots, creating bookings, and cancelling bookings.',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document);

  app.getHttpAdapter().get('/openapi.json', (_req, res) => {
    res.json(document);
  });
  await app.listen(process.env.PORT ?? 3002);
}

bootstrap();
