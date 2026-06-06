import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import { getBugsinkInitOptions } from './lib/bugsink';

dotenv.config();

Sentry.init(getBugsinkInitOptions());
