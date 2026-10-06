/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import dotenv from 'dotenv';
dotenv.config();

export interface DatabaseConfig {
  dialect: 'sqlite' | 'mysql';
  mysql: {
    host: string;
    port: number;
    user: string;
    password?: string;
    database: string;
  };
  jwtSecret: string;
  port: number;
}

export const config: DatabaseConfig = {
  dialect: (process.env.DB_DIALECT as 'sqlite' | 'mysql') || 'sqlite',
  mysql: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'stayease_db',
  },
  jwtSecret: process.env.JWT_SECRET || 'stayease_secure_jwt_secret_key_2026',
  port: parseInt(process.env.PORT || '3000', 10),
};
