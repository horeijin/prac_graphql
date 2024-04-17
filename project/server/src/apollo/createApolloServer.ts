import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import { Request, Response } from 'express';
import { buildSchema } from 'type-graphql';

import { CutResolver } from '../resolvers/Cut';
import { FilmResolver } from '../resolvers/Film';
import { UserResolver } from '../resolvers/User';

import { createCutVoteLoader } from '../dataloaders/cutVoteLoader';

import {
  JwtVerifiedUser,
  verifyAccessTokenFromReqHeaders,
} from '../utils/jwt-auth';
import redis from '../redis/redis-client';

export interface MyContext {
  req: Request;
  res: Response;
  verifiedUser: JwtVerifiedUser;
  redis: typeof redis;
  cutVoteLoader: ReturnType<typeof createCutVoteLoader>;
}

const createApolloServer = async(): Promise<ApolloServer> => {
  return new ApolloServer<MyContext>({
    schema: await buildSchema({
        resolvers: [FilmResolver, CutResolver, UserResolver],
    }),
    plugins: [ApolloServerPluginLandingPageLocalDefault()],
    context: ({req, res}) => {
      const verifed = verifyAccessTokenFromReqHeaders(req.headers);
      return { req, res, verifiedUser: verifed, redis, cutVoteLoader: createCutVoteLoader() };
    }
  });
};

export default createApolloServer;