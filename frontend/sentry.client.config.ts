import * as Sentry from '@sentry/nextjs';
import { getBugsinkInitOptions } from './lib/bugsink';

Sentry.init(getBugsinkInitOptions());
