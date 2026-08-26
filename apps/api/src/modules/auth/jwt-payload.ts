/** Shared between AuthService (signs these) and JwtAuthGuard (verifies them). */
export interface JwtPayload {
  sub: string;
  type: 'access' | 'refresh';
}
