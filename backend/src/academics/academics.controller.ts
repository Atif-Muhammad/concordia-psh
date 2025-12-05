import {
    Body,
    Controller,
    Delete,
    Get,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ProgramDto } from './dtos/programs/program.dto';
import { AcademicsService } from './academics.service';
import { ClassDto } from './dtos/classes/class.dto';
import { SectionDto } from './dtos/sections/section.dto';
import { SubjectDto } from './dtos/subjects/subject.dto';
import { TsmDto } from './dtos/tsms/tsm.dto';
import { TimetableDto } from './dtos/timetable/timetable.dto';
import { TcsmDto } from './dtos/tcms/tcm.dto';

@Controller('academics')
export class AcademicsController {
    constructor(private readonly academicService: AcademicsService) { }

    // PROGRAM
    @Get('program/get/all/names')
    async getProgramNames() {
        return await this.academicService.getProgramNames();
    }
    @Get('program/get/all')
    async getPrograms() {
        return await this.academicService.getPrograms();
    }
    @Post('program/create')
    async createProgram(@Body() payload: ProgramDto) {
        return await this.academicService.createProgram(payload);
    }
    @Patch('program/update')
    async updateProgram(
        @Query() programID: { programID: string },
        @Body() payload: Partial<ProgramDto>,
    ) {
        return await this.academicService.updateProgram(
            Number(programID.programID),
            payload,
        );
    }
    @Delete('program/remove')
    async deleteProgram(@Query() programID: { programID: string }) {
        return await this.academicService.deleteProgram(
            Number(programID.programID),
        );
    }

    // CLASSES
    @Get('class/get/all')
    async getClasses() {
        return await this.academicService.getClasses();
    }
    @Post('class/create')
    async createClass(@Body() payload: ClassDto) {
        return await this.academicService.createClass(payload);
    }
    @Patch('class/update')
    async updateClass(
        @Query() classID: { classID: string },
        @Body() payload: ClassDto,
    ) {
        return await this.academicService.updateClass(
            Number(classID.classID),
            payload,
        );
    }
    @Delete('class/remove')
    async removeClass(@Query() classID: { classID: string }) {
        return await this.academicService.deleteClass(Number(classID.classID));
    }

    // Section
    @Get('section/get/all')
    async getSections() {
        return await this.academicService.getSections();
    }
    @Post('section/create')
    async createSection(@Body() payload: SectionDto) {
        return await this.academicService.createSection(payload);
    }
    @Patch('section/update')
    async updateSection(
        @Query() secID: { secID: string },
        @Body() payload: Partial<SectionDto>,
    ) {
        return await this.academicService.updateSection(
            Number(secID.secID),
            payload,
        );
    }
    @Delete('section/remove')
    async removeSection(@Query() secID: { secID: string }) {
        return await this.academicService.removeSection(Number(secID.secID));
    }


    // Subject
    @Get('subject/get/all')
    async getSubjects() {
        return await this.academicService.getSubjects();
    }
    @Post('subject/create')
    async createSubject(@Body() payload: SubjectDto) {
        return await this.academicService.createSubject(payload);
    }
    @Patch('subject/update')
    async updateSubject(
        @Query() subID: { subID: string },
        @Body() payload: Partial<SubjectDto>,
    ) {
        return await this.academicService.updateSubject(
            Number(subID.subID),
            payload,
        );
    }
    @Delete('subject/remove')
    async removeSubject(@Query() subID: { subID: string }) {
        return await this.academicService.removeSubject(Number(subID.subID));
    }

    // tsm
    @Get('tsm/get/all')
    async getTsms() {
        return await this.academicService.getTsms();
    }
    @Post('tsm/create')
    async createTsm(@Body() payload: TsmDto) {
        return await this.academicService.createTsm(payload);
    }
    @Patch('tsm/update')
    async updateTsm(
        @Query() tsmID: { tsmID: string },
        @Body() payload: Partial<TsmDto>,
    ) {
        return await this.academicService.updateTsm(
            Number(tsmID.tsmID),
            payload,
        );
    }
    @Delete('tsm/remove')
    async removeTsm(@Query() tsmID: { tsmID: string }) {
        return await this.academicService.removeTsm(Number(tsmID.tsmID));
    }

    // tcm
    @Get('tcm/get/all')
    async getTcms() {
        return await this.academicService.getTcsms();
    }
    @Post('tcm/create')
    async createTcm(@Body() payload: TcsmDto) {
        return await this.academicService.createTcsm(payload);
    }
    @Patch('tcm/update')
    async updateTcm(
        @Query() tcmID: { tcmID: string },
        @Body() payload: Partial<TcsmDto>,
    ) {
        return await this.academicService.updateTcsm(
            Number(tcmID.tcmID),
            payload,
        );
    }
    @Delete('tcm/remove')
    async removeTcm(@Query() tcmID: { tcmID: string }) {
        return await this.academicService.removeTcsm(Number(tcmID.tcmID));
    }

    // timetable
    @Get('timetable/get/all')
    async getTimetables() {
        return await this.academicService.getTimetables();
    }
    @Post('timetable/create')
    async createTimetable(@Body() payload: TimetableDto) {
        return await this.academicService.createTimetable(payload);
    }
    @Patch('timetable/update')
    async updateTimetable(
        @Query() timetableId: { timetableId: string },
        @Body() payload: Partial<TimetableDto>,
    ) {
        return await this.academicService.updateTimetable(
            Number(timetableId.timetableId),
            payload,
        );
    }
    @Delete('timetable/remove')
    async removeTimetable(@Query() timetableId: { timetableId: string }) {
        return await this.academicService.removeTimetable(Number(timetableId.timetableId));
    }
}
