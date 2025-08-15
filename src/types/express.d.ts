import type { User } from '../users/user.entity'; // adjust path

declare module 'express-serve-static-core' {
  interface Request {
    user?: User & { userId?: string }; // or whatever your payload has
  }
}
