import { Body, Controller, Inject, Post, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

class RegisterDto {
  @IsString() @MinLength(2) name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
}
class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
}

export function signToken(user: { id: string; role: string }) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 24) throw new Error('JWT_SECRET must contain at least 24 characters');
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 86400 })).toString('base64url');
  const data = `${header}.${payload}`;
  return `${data}.${createHmac('sha256', secret).update(data).digest('base64url')}`;
}

export function verifyToken(token: string): { sub: string; role: string } {
  const secret = process.env.JWT_SECRET;
  const parts = token.split('.');
  if (!secret || secret.length < 24 || parts.length !== 3) throw new UnauthorizedException('JWT không hợp lệ');
  const data = `${parts[0]}.${parts[1]}`;
  const expected = createHmac('sha256', secret).update(data).digest();
  let actual: Buffer;
  try { actual = Buffer.from(parts[2], 'base64url'); } catch { throw new UnauthorizedException('JWT không hợp lệ'); }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new UnauthorizedException('JWT không hợp lệ');
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (typeof payload.sub !== 'string' || payload.exp < Date.now() / 1000) throw new Error();
    return { sub: payload.sub, role: payload.role };
  } catch { throw new UnauthorizedException('JWT hết hạn hoặc không hợp lệ'); }
}

export function bearer(header?: string) {
  if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Cần đăng nhập');
  return verifyToken(header.slice(7));
}

export function requireStaff(header?: string) {
  const user = bearer(header);
  if (!['STAFF', 'MANAGER'].includes(user.role)) throw new ForbiddenException('Chỉ nhân viên hoặc quản lý mới được truy cập');
  return user;
}

@Controller('auth')
export class AuthController {
  constructor(@Inject('PG_POOL') private readonly db: Pool) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const name = body.name.trim();
    const email = body.email.trim().toLowerCase();
    if (!name || name.length > 100) throw new BadRequestException('Tên không hợp lệ');
    const passwordHash = await bcrypt.hash(body.password, 12);
    const id = randomUUID();
    try {
      await this.db.query('INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4)', [id, name, email, passwordHash]);
    } catch (error: any) {
      if (error.code === '23505') throw new ConflictException('Email đã được đăng ký');
      throw error;
    }
    return { user: { id, name, email, role: 'CUSTOMER' }, accessToken: signToken({ id, role: 'CUSTOMER' }) };
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    const email = body.email.trim().toLowerCase();
    const result = await this.db.query('SELECT id,name,email,password_hash,role FROM users WHERE email=$1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(body.password, user.password_hash))) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, accessToken: signToken({ id: user.id, role: user.role }) };
  }
}
