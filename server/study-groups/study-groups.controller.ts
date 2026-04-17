import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/auth.guard';
import {
  StudyGroupsService,
  CreateStudyGroupDto,
  CreateStudyGroupQuestionDto,
} from './study-groups.service';

@ApiTags('study-groups')
@Controller('study-groups')
export class StudyGroupsController {
  constructor(private readonly service: StudyGroupsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '스터디 그룹 목록' })
  findAll(
    @Req() req: any,
    @Query('q') q?: string,
    @Query('companyName') companyName?: string,
    @Query('jobPostId') jobPostId?: string,
    @Query('jobKey') jobKey?: string,
    @Query('mine') mine?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({
      q,
      companyName,
      jobPostId,
      jobKey,
      mine: mine === 'true' || mine === '1',
      userId: req.user?.id,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Post()
  @ApiOperation({ summary: '스터디 그룹 생성' })
  create(@Body() body: CreateStudyGroupDto, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.create(req.user.id, body);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '스터디 그룹 상세' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(id, req.user?.id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: '스터디 그룹 가입' })
  join(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.join(id, req.user.id);
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: '스터디 그룹 탈퇴' })
  leave(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.leave(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '스터디 그룹 삭제' })
  remove(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.remove(id, req.user.id, req.user?.role);
  }

  @Get(':id/questions')
  @Public()
  @ApiOperation({ summary: '스터디 그룹 질문 목록' })
  listQuestions(@Param('id') id: string, @Req() req: any) {
    return this.service.listQuestions(id, req.user?.id);
  }

  @Post(':id/questions')
  @ApiOperation({ summary: '스터디 그룹 질문 추가' })
  addQuestion(
    @Param('id') id: string,
    @Body() body: CreateStudyGroupQuestionDto,
    @Req() req: any,
  ) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.addQuestion(id, req.user.id, body);
  }
}
