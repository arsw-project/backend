import { Controller, Delete, Get, Patch, Post, Put } from '@nestjs/common';

@Controller('health')
export class HealthController {
	@Get()
	check() {
		return { status: '/GET ok' };
	}

	@Post()
	create() {
		return { status: '/POST ok' };
	}

	@Put()
	update() {
		return { status: '/PUT ok' };
	}

	@Patch()
	partialUpdate() {
		return { status: '/PATCH ok' };
	}

	@Delete()
	delete() {
		return { status: '/DELETE ok' };
	}
}
