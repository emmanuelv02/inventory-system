/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@repo/shared';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { UserEntity } from '../entities/user.entity';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<UserEntity>;
  let jwtService: JwtService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return an access token when credentials are valid', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
      };
      const user = { id: 1, username: 'testuser', role: UserRole.USER };
      const token = 'jwt-token';

      jest.spyOn(service as any, 'validateUser').mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(loginDto);

      expect(service['validateUser']).toHaveBeenCalledWith(
        loginDto.username,
        loginDto.password,
      );

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ accessToken: token });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      jest.spyOn(service as any, 'validateUser').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(service['validateUser']).toHaveBeenCalledWith(
        loginDto.username,
        loginDto.password,
      );
    });
  });

  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const registerDto: RegisterDto = {
        username: 'newuser',
        password: 'password123',
        role: UserRole.USER,
      };
      const hashedPassword = 'hashed-password';
      const createdUser = {
        id: 1,
        username: registerDto.username,
        password: hashedPassword,
        role: registerDto.role,
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...savedUser } = createdUser;

      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockReturnValue(createdUser);
      mockUserRepository.save.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: registerDto.username },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        username: registerDto.username,
        password: hashedPassword,
        role: registerDto.role,
      });
      expect(userRepository.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(savedUser);
    });

    it('should set the default role to USER when not provided', async () => {
      const registerDto: RegisterDto = {
        username: 'newuser',
        password: 'password123',
      };
      const hashedPassword = 'hashed-password';

      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockReturnValue({
        username: registerDto.username,
        password: hashedPassword,
        role: UserRole.USER,
      });
      mockUserRepository.save.mockImplementation((user) =>
        Promise.resolve(user),
      );

      await service.register(registerDto);

      expect(userRepository.create).toHaveBeenCalledWith({
        username: registerDto.username,
        password: hashedPassword,
        role: UserRole.USER,
      });
    });

    it('should throw BadRequestException when user already exists', async () => {
      const registerDto: RegisterDto = {
        username: 'existinguser',
        password: 'password123',
      };
      const existingUser = { id: 1, username: 'existinguser' };

      mockUserRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: registerDto.username },
      });
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const username = 'testuser';
      const password123 = 'password123';
      const user = {
        id: 1,
        username,
        password: 'hashed-password',
        role: UserRole.USER,
      };

      const userPassword = user.password;
      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service['validateUser'](username, password123);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
      expect(user.password).toBe(undefined);
      expect(bcrypt.compare).toHaveBeenCalledWith(password123, userPassword);
    });

    it('should return null when user is not found', async () => {
      const username = 'nonexistentuser';
      const password = 'password123';

      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service['validateUser'](username, password);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      const username = 'testuser';
      const password = 'wrongpassword';
      const user = {
        id: 1,
        username,
        password: 'hashed-password',
        role: UserRole.USER,
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service['validateUser'](username, password);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
      expect(result).toBeNull();
    });
  });
});
