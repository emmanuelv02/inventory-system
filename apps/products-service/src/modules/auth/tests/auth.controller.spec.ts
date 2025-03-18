/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { UserRole } from '@repo/shared';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call authService.login with the loginDto and return the result', async () => {
      // Arrange
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
      };
      const expectedResult = { access_token: 'test-jwt-token' };
      mockAuthService.login.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate exceptions from authService.login', async () => {
      // Arrange
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'wrongpassword',
      };
      const error = new Error('Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(error);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('register', () => {
    it('should call authService.register with the registerDto and return the result', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        username: 'newuser',
        password: 'password123',
        role: UserRole.USER,
      };
      const expectedResult = {
        id: 1,
        username: 'newuser',
        role: UserRole.USER,
      };
      mockAuthService.register.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.register(registerDto);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate exceptions from authService.register', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        username: 'existinguser',
        password: 'password123',
      };
      const error = new Error('User already exists');
      mockAuthService.register.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.register(registerDto)).rejects.toThrow(error);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });
});
