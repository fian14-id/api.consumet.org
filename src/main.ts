require('dotenv').config();
import Redis from 'ioredis';
import Fastify from 'fastify';
import FastifyCors from '@fastify/cors';
import books from './routes/books';
import anime from './routes/anime';
import manga from './routes/manga';
import comics from './routes/comics';
import lightnovels from './routes/light-novels';
import movies from './routes/movies';
import meta from './routes/meta';
import chalk from 'chalk';
import Utils from './utils';
import KamyrollManager from './utils/kamyroll-token';

export const redis =
  process.env.REDIS_HOST &&
  new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    tls: {},
  });

export const tmdbApi = process.env.apiKey && process.env.apiKey;
(async () => {
  const PORT = Number(process.env.PORT) || 3000;

  console.log(chalk.green(`Starting server on port ${PORT}... 🚀`));
  if (!process.env.REDIS_HOST)
    console.warn(chalk.yellowBright('Redis not found. Cache disabled.'));
  if (!process.env.tmdbApi)
    console.warn(
      chalk.yellowBright('TMDB api key not found. the TMDB meta route may not work.')
    );
  if (process.env.ACCESS_TOKEN !== undefined)
    (
      global as typeof globalThis & {
        CrunchyrollToken: string;
      }
    ).CrunchyrollToken = (await KamyrollManager.create()).token!;

  const fastify = Fastify({
    maxParamLength: 1000,
    logger: true,
  });
  await fastify.register(FastifyCors, {
    origin: '*',
    methods: 'GET',
  });

  await fastify.register(books, { prefix: '/books' });
  await fastify.register(anime, { prefix: '/anime' });
  await fastify.register(manga, { prefix: '/manga' });
  //await fastify.register(comics, { prefix: '/comics' });
  await fastify.register(lightnovels, { prefix: '/light-novels' });
  await fastify.register(movies, { prefix: '/movies' });
  await fastify.register(meta, { prefix: '/meta' });

  await fastify.register(Utils, { prefix: '/utils' });

  try {
    fastify.get('/', (_, rp) => {
      rp.status(200).send('Welcome to consumet api! 🎉');
    });
    fastify.get('*', (request, reply) => {
      reply.status(404).send({
        message: '',
        error: 'page not found',
      });
    });

    fastify.listen({ port: PORT, host: '0.0.0.0' }, (e, address) => {
      if (e) throw e;
      console.log(`server listening on ${address}`);
    });
  } catch (err: any) {
    fastify.log.error(err);
    process.exit(1);
  }
})();
