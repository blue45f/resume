import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { VersionsController } from './versions.controller';
import { VersionsService } from './versions.service';

const mockService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  restore: jest.fn(),
};

const reqWith = (user?: { id?: string; role?: string }): any => ({ user });

describe('VersionsController', () => {
  let controller: VersionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VersionsController],
      providers: [{ provide: VersionsService, useValue: mockService }],
    }).compile();
    controller = module.get(VersionsController);
    jest.clearAllMocks();
  });

  it('findAll: 비로그인 Unauthorized', () => {
    expect(() => controller.findAll('r1', reqWith())).toThrow(UnauthorizedException);
  });

  it('findAll: resumeId + userId + role 전달', () => {
    controller.findAll('r1', reqWith({ id: 'u1', role: 'user' }));
    expect(mockService.findAll).toHaveBeenCalledWith('r1', 'u1', 'user');
  });

  it('findOne: 비로그인 Unauthorized', () => {
    expect(() => controller.findOne('r1', 'v1', reqWith())).toThrow(UnauthorizedException);
  });

  it('findOne: 모든 인자 전달', () => {
    controller.findOne('r1', 'v1', reqWith({ id: 'u1', role: 'admin' }));
    expect(mockService.findOne).toHaveBeenCalledWith('r1', 'v1', 'u1', 'admin');
  });

  it('restore: 비로그인 Unauthorized', () => {
    expect(() => controller.restore('r1', 'v1', reqWith())).toThrow(UnauthorizedException);
  });

  it('restore: 정상 위임', () => {
    controller.restore('r1', 'v1', reqWith({ id: 'u1', role: 'user' }));
    expect(mockService.restore).toHaveBeenCalledWith('r1', 'v1', 'u1', 'user');
  });
});
