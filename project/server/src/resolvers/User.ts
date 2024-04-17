import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import jwt from 'jsonwebtoken';
import { MyContext } from '../apollo/createApolloServer';
import { IsEmail, IsString } from 'class-validator'; //타입스크립트 클래스 필드에 유효성 검사에 대한 메타 정보 추가
import argon2 from 'argon2'; //bcrypt 보다 GPU 병렬 연산에서 안전성 확보된 암호화 알고리즘
import { isAuthenticated } from '../middlewares/isAuthenticated';
import User from '../entities/User';

import {
  createAccessToken,
  createRefreshToken,
  REFRESH_JWT_SECRET_KEY,
  setRefreshTokenHeader,
} from '../utils/jwt-auth';

//회원가입 인자 타입
@InputType()
export class SignUpInput {
  @Field() @IsEmail() email: string;
  @Field() @IsString() username: string;
  @Field() @IsString() password: string;
}
//로그인 인자 타입
@InputType({ description: '로그인 인풋 데이터' })
export class LoginInput {
  @Field() @IsString() emailOrUsername: string;
  @Field() @IsString() password: string;
}
//로그인 에러 타입
@ObjectType({ description: '필드 에러 타입' })
class FieldError {
  @Field() field: string;
  @Field() message: string;
}
//로그인 리턴 타입
@ObjectType({ description: '로그인 반환 데이터' })
class LoginResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;

  @Field({ nullable: true })
  accessToken?: string;
}
//리프레시 토큰으로 액세스 토큰 재발급 리턴 타입
@ObjectType({ description: '액세스 토큰 새로고침 반환 데이터' })
class RefreshAccessTokenResponse {
  @Field() accessToken: string;
}

@Resolver(User)
export class UserResolver {
  //로그인된 유저 정보 반환하는 me 쿼리
  @UseMiddleware(isAuthenticated)
  @Query(() => User, { nullable: true })
  async me(@Ctx() ctx: MyContext): Promise<User | undefined> {
    if (!ctx.verifiedUser) return undefined;
    const user = await User.findOne({ where: { id: ctx.verifiedUser.userId } });
    return user ?? undefined;
  }

  //회원가입 뮤테이션
  @Mutation(() => User)
  async signUp(@Arg('signUpInput') signUpInput: SignUpInput): Promise<User> {
    const { email, username, password } = signUpInput;

    const hashedPw = await argon2.hash(password);
    const newUser = User.create({
      email,
      username,
      password: hashedPw,
    });

    await User.insert(newUser);

    return newUser;
  }

  //로그인 뮤테이션
  @Mutation(() => LoginResponse)
  public async login(
    @Arg('loginInput') loginInput: LoginInput,
    @Ctx() { res, redis }: MyContext,
  ): Promise<LoginResponse> {
    const { emailOrUsername, password } = loginInput;

    const user = await User.findOne({ where: [{ email : emailOrUsername }, {username : emailOrUsername}] });
    if (!user)
      return {
        errors: [
          { field: 'emailOrUsername', message: '해당하는 유저가 없습니다.' },
        ],
      };

    const isValid = await argon2.verify(user.password, password);
    if (!isValid)
      return {
        errors: [
          { field: 'password', message: '비밀번호를 올바르게 입력해주세요.' },
        ],
      };

    // 액세스 토큰, 리프레시 토큰 발급
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    // 레디스에 리프레시 토큰 저장
    await redis.set(String(user.id), refreshToken);

    // 쿠키로 리프레시 토큰 전송
    setRefreshTokenHeader(res, refreshToken);

    return { user, accessToken };
  }

  //리프레시 토큰으로 액세스 토큰 재발급 뮤테이션
  @Mutation(() => RefreshAccessTokenResponse, { nullable: true })
  async refreshAccessToken(
    @Ctx() { req, redis, res }: MyContext,
  ): Promise<RefreshAccessTokenResponse | null> {
    const refreshToken = req.cookies.refreshtoken;
    if (!refreshToken) return null;

    let tokenData: any = null;
    try {
      tokenData = jwt.verify(refreshToken, REFRESH_JWT_SECRET_KEY);
    } catch (e) {
      console.error(e);
      return null;
    }
    if (!tokenData) return null;

    // 레디스 상에 user.id 로 저장된 토큰 조회
    const storedRefreshToken = await redis.get(String(tokenData.userId));
    if (!storedRefreshToken) return null;
    if (!(storedRefreshToken === refreshToken)) return null;

    const user = await User.findOne({ where: { id: tokenData.userId } });
    if (!user) return null;

    const newAccessToken = createAccessToken(user); // 액세스토큰생성
    const newRefreshToken = createRefreshToken(user); // 리프레시토큰생성
    // 리프레시토큰 redis저장
    await redis.set(String(user.id), newRefreshToken);

    // 쿠키로 리프레시 토큰 전송
    setRefreshTokenHeader(res, newRefreshToken);

    return { accessToken: newAccessToken };
  }

  //로그아웃 뮤테이션
  @Mutation(() => Boolean)
  @UseMiddleware(isAuthenticated)
  async logout(
    @Ctx() { verifiedUser, res, redis }: MyContext,
  ): Promise<boolean> {
    if (verifiedUser) {
      setRefreshTokenHeader(res, ''); // 리프레시 토큰 쿠키 제거
      await redis.del(String(verifiedUser.userId)); // 레디스 리프레시 토큰 제거
    }
    return true;
  }
}
