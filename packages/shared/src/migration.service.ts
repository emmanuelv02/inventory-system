import {Injectable, Logger, OnApplicationBootstrap} from '@nestjs/common';
import {DataSource} from 'typeorm';

@Injectable()
export class MigrationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MigrationService.name);

  constructor(private dataSource: DataSource) {}

  async onApplicationBootstrap() {
    try {
      const pendingMigrations = await this.dataSource.showMigrations();

      if (pendingMigrations) {
        this.logger.log('Running pending migrations...');

        await this.dataSource.runMigrations();
        this.logger.log('Migrations completed successfully');
      } else {
        this.logger.log('No pending migrations');
      }
    } catch (error) {
      this.logger.error('Migration failed', error);
    }
  }
}
