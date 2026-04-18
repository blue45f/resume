import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigController } from './system-config.controller';
import { SystemConfigService } from './system-config.service';

const mockService = {
  getPublicConfig: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  getPermissions: jest.fn(),
  setPermissions: jest.fn(),
  getAll: jest.fn(),
  setMany: jest.fn(),
};

const reqWithKey = (key: string): any => ({ params: { key } });

describe('SystemConfigController', () => {
  let controller: SystemConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemConfigController],
      providers: [{ provide: SystemConfigService, useValue: mockService }],
    }).compile();
    controller = module.get(SystemConfigController);
    jest.clearAllMocks();
  });

  it('getPublic → service.getPublicConfig', () => {
    controller.getPublic();
    expect(mockService.getPublicConfig).toHaveBeenCalled();
  });

  describe('getContent', () => {
    it('값 없으면 null', async () => {
      mockService.get.mockResolvedValueOnce(null);
      await expect(controller.getContent(reqWithKey('home'), {})).resolves.toBeNull();
      expect(mockService.get).toHaveBeenCalledWith('content_home');
    });

    it('JSON 파싱 성공 시 객체 반환', async () => {
      mockService.get.mockResolvedValueOnce('{"title":"T"}');
      await expect(controller.getContent(reqWithKey('home'), {})).resolves.toEqual({ title: 'T' });
    });

    it('JSON 파싱 실패 시 원본 문자열 반환', async () => {
      mockService.get.mockResolvedValueOnce('plain text');
      await expect(controller.getContent(reqWithKey('home'), {})).resolves.toBe('plain text');
    });
  });

  describe('setContent', () => {
    it('문자열 body 는 그대로 저장', async () => {
      await controller.setContent(reqWithKey('home'), 'raw');
      expect(mockService.set).toHaveBeenCalledWith('content_home', 'raw');
    });

    it('객체 body 는 JSON.stringify 로 직렬화', async () => {
      await controller.setContent(reqWithKey('home'), { a: 1 });
      expect(mockService.set).toHaveBeenCalledWith('content_home', '{"a":1}');
    });
  });

  it('getPermissions / setPermissions 위임', async () => {
    mockService.setPermissions.mockResolvedValueOnce({});
    controller.getPermissions();
    expect(mockService.getPermissions).toHaveBeenCalled();
    await controller.setPermissions({ 'perm.community.create': 'admin' });
    expect(mockService.setPermissions).toHaveBeenCalledWith({
      'perm.community.create': 'admin',
    });
  });

  it('getAll / setMany: body.configs 전달', () => {
    controller.getAll();
    expect(mockService.getAll).toHaveBeenCalled();

    controller.setMany({ configs: [{ key: 'a', value: '1' }] });
    expect(mockService.setMany).toHaveBeenCalledWith([{ key: 'a', value: '1' }]);
  });
});
