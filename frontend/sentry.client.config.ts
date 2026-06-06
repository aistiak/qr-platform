import * as Sentry from '@sentry/nextjs';
import { getBugsinkClientInitOptions } from './lib/bugsink';

Sentry.init(getBugsinkClientInitOptions());
