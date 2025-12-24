import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(private dataSource: DataSource) {}

  async getHealth(): Promise<any> {
    try {
      if (this.dataSource.isInitialized) {
        return {
           status: 'UP',
           database: 'Connected',
           timestamp: new Date().toISOString(),
        };
      } else {
         return {
           status: 'DOWN',
           database: 'Disconnected',
           timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
       return {
           status: 'DOWN',
           database: 'Error',
           error: error.message,
           timestamp: new Date().toISOString(),
        };
    }
  }
}
