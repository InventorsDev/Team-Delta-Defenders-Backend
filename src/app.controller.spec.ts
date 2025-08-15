<<<<<<< HEAD
import { Test, type TestingModule } from '@nestjs/testing';
=======
import { Test, TestingModule } from '@nestjs/testing';
>>>>>>> 83c413f657eb2717b3f8d8936d913c3092d5a736
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
