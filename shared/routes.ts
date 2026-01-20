import { z } from 'zod';
import { insertRecordingSchema, insertUserSchema, recordings, users } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  users: {
    create: {
      method: 'POST' as const,
      path: '/api/users',
      input: z.object({
        avatarSeed: z.string().optional(),
      }).optional(),
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/users/:id',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  recordings: {
    list: {
      method: 'GET' as const,
      path: '/api/recordings',
      input: z.object({
        mood: z.string().optional(),
        sort: z.enum(['latest', 'popular']).optional(),
        userId: z.string().optional(), // To check isLiked status
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof recordings.$inferSelect & { user?: typeof users.$inferSelect, isLiked?: boolean }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/recordings/:id',
      responses: {
        200: z.custom<typeof recordings.$inferSelect & { user?: typeof users.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
    getRandom: {
      method: 'GET' as const,
      path: '/api/recordings/random',
      responses: {
        200: z.custom<typeof recordings.$inferSelect & { user?: typeof users.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/recordings',
      input: insertRecordingSchema,
      responses: {
        201: z.custom<typeof recordings.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    like: {
      method: 'POST' as const,
      path: '/api/recordings/:id/like',
      input: z.object({
        userId: z.string(),
      }),
      responses: {
        200: z.object({ success: z.boolean(), likesCount: z.number() }),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type CreateUserInput = z.infer<typeof api.users.create.input>;
export type CreateRecordingInput = z.infer<typeof api.recordings.create.input>;
export type LikeRecordingInput = z.infer<typeof api.recordings.like.input>;
