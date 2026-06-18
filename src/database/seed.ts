import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from './data-source';
import { Company } from '../company/entities/company.entity';
import { User } from '../users/entities/user.entity';
import { SportEvent } from '../sport-event/entities/sport-event.entity';
import { SportSubEvent } from '../sport-sub-event/entities/sport-sub-event.entity';
import { Follow } from '../follow/entities/follow.entity';
import { Post } from '../post/entities/post.entity';
import { PostComment } from '../post/entities/post-comment.entity';
import { PostLike } from '../post/entities/post-like.entity';
import { PostType } from '../post/entities/post-type.enum';
import { UserRole } from '../auth/decorators/userRole.enum';
import { SportEventStatus } from '../sport-event/entities/sport.event-status.enum';
import { SportSubEventStatus } from '../sport-sub-event/entities/sport-sub-evet-status.enum';
import { Registration } from '../registration/entities/registration.entity';
import { RegistrationStatus } from '../registration/entities/registration-status.enum';
import { Payment } from '../payment/entities/payment.entity';
import { PaymentStatus } from '../payment/entities/payment-status.enum';
import { PaymentMethod } from '../payment/entities/payment-method.enum';
import { Result } from '../result/entities/result.entity';
import { ResultStatus } from '../result/entities/result-status.enum';

// ── R2 upload helper ──────────────────────────────────────────────────────────

async function uploadFromPicsum(
  client: S3Client,
  bucket: string,
  publicUrlBase: string,
  assetType: string,
  picsumSeed: string,
  width: number,
  height: number,
): Promise<string> {
  const response = await fetch(
    `https://picsum.photos/seed/${picsumSeed}/${width}/${height}`,
  );
  if (!response.ok) throw new Error(`Picsum fetch failed: ${picsumSeed}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const key = `${assetType}/${uuidv4()}.jpg`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
    }),
  );
  return `${publicUrlBase}/${key}`;
}

// ── GPX helpers ──────────────────────────────────────────────────────────────

function generateGpx(
  name: string,
  lat: number,
  lon: number,
  distanceKm: number,
): string {
  const POINTS = 80;
  const radiusKm = distanceKm / (2 * Math.PI);
  const latDeg = radiusKm / 111;
  const lonDeg = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  const trackpoints = Array.from({ length: POINTS + 1 }, (_, i) => {
    const angle = (2 * Math.PI * i) / POINTS;
    const ptLat = (lat + latDeg * Math.cos(angle)).toFixed(6);
    const ptLon = (lon + lonDeg * Math.sin(angle)).toFixed(6);
    return `      <trkpt lat="${ptLat}" lon="${ptLon}"/>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Ekinnow" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${name}</name>
    <trkseg>
${trackpoints}
    </trkseg>
  </trk>
</gpx>`;
}

async function uploadGpx(
  client: S3Client,
  bucket: string,
  publicUrlBase: string,
  name: string,
  lat: number,
  lon: number,
  distanceKm: number,
): Promise<string> {
  const content = generateGpx(name, lat, lon, distanceKm);
  const key = `gpx/${uuidv4()}.gpx`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(content, 'utf-8'),
      ContentType: 'application/gpx+xml',
    }),
  );
  return `${publicUrlBase}/${key}`;
}

// ── Slugs / emails used to identify seed rows ────────────────────────────────

const COMPANY_SLUGS = [
  'andalucia-trail-runners',
  'cycling-euskadi',
  'club-triatlo-cat',
];

const USER_EMAILS = [
  'admin@ekinnow.com',
  'admin@andalucia-trail.com',
  'staff@andalucia-trail.com',
  'admin@cycling-euskadi.com',
  'staff@cycling-euskadi.com',
  'admin@triatlo-cat.com',
  'participant1@test.com',
  'participant2@test.com',
  'participant3@test.com',
];

const EVENT_SLUGS = [
  'sierra-nevada-ultra-trail-2026',
  'maraton-sevilla-trail-2026',
  'itzulia-amateur-2026',
  'vuelta-ciclista-alavesa-2026',
  'barcelona-triathlon-2026',
  'aquathlon-castelldefels-2026',
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  const PASSWORD_HASH = await bcrypt.hash('Ekinnow2026!', 10);

  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  const R2_BUCKET = process.env.R2_BUCKET_NAME!;
  const R2_PUBLIC = process.env.R2_PUBLIC_URL!;

  const up = (
    assetType: string,
    seed: string,
    w: number,
    h: number,
  ): Promise<string> =>
    uploadFromPicsum(r2, R2_BUCKET, R2_PUBLIC, assetType, seed, w, h);

  console.log('Uploading assets to R2...');

  const [
    logoTrail,
    bannerTrail,
    logoCycling,
    bannerCycling,
    logoTriatlon,
    bannerTriatlon,
  ] = await Promise.all([
    up('companies', 'trail-logo', 400, 400),
    up('companies', 'trail-banner', 1200, 400),
    up('companies', 'cycling-logo', 400, 400),
    up('companies', 'cycling-banner', 1200, 400),
    up('companies', 'triathlon-logo', 400, 400),
    up('companies', 'triathlon-banner', 1200, 400),
  ]);

  const [
    logoSierraNevada,
    bannerSierraNevada,
    logoSevillaTrail,
    bannerSevillaTrail,
    logoItzulia,
    bannerItzulia,
    logoAlavesa,
    bannerAlavesa,
    logoBarcelona,
    bannerBarcelona,
    logoCastelldefels,
    bannerCastelldefels,
  ] = await Promise.all([
    up('events', 'sierra-nevada-logo', 400, 400),
    up('events', 'sierra-nevada-banner', 1200, 400),
    up('events', 'sevilla-trail-logo', 400, 400),
    up('events', 'sevilla-trail-banner', 1200, 400),
    up('events', 'itzulia-logo', 400, 400),
    up('events', 'itzulia-banner', 1200, 400),
    up('events', 'alavesa-logo', 400, 400),
    up('events', 'alavesa-banner', 1200, 400),
    up('events', 'barcelona-tri-logo', 400, 400),
    up('events', 'barcelona-tri-banner', 1200, 400),
    up('events', 'castelldefels-logo', 400, 400),
    up('events', 'castelldefels-banner', 1200, 400),
  ]);

  const [
    avatarSuperAdmin,
    avatarCarmen,
    avatarMiguel,
    avatarIker,
    avatarAmaia,
    avatarMarc,
    avatarLaura,
    avatarJavier,
    avatarNeus,
  ] = await Promise.all([
    up('users', 'superadmin-av', 200, 200),
    up('users', 'carmen-av', 200, 200),
    up('users', 'miguel-av', 200, 200),
    up('users', 'iker-av', 200, 200),
    up('users', 'amaia-av', 200, 200),
    up('users', 'marc-av', 200, 200),
    up('users', 'laura-av', 200, 200),
    up('users', 'javier-av', 200, 200),
    up('users', 'neus-av', 200, 200),
  ]);

  const [postImageLaura, postImageJavier] = await Promise.all([
    up('posts', 'laura-cycling', 800, 600),
    up('posts', 'javier-trail', 800, 600),
  ]);

  // Sub-event GPX routes (circular tracks around event coordinates)
  const upGpx = (name: string, lat: number, lon: number, km: number) =>
    uploadGpx(r2, R2_BUCKET, R2_PUBLIC, name, lat, lon, km);

  const [
    gpxUltra100,
    gpxClassic50,
    gpxFamily25,
    gpxSevillaMaraton,
    gpxSevillaMedia,
    gpxItzuliaGranFondo,
    gpxItzuliaMediofondo,
    gpxItzuliaCorta,
    gpxAlavesaGranFondo,
    gpxAlavesaMediofondo,
    gpxBarcelonaOlimpica,
    gpxBarcelonaSprint,
    gpxCastelldefelsEstandar,
    gpxCastelldefelsSprint,
  ] = await Promise.all([
    upGpx('Ultra 100K', 37.0948, -3.3926, 100),
    upGpx('Classic 50K', 37.0948, -3.3926, 50),
    upGpx('Family 25K', 37.0948, -3.3926, 25),
    upGpx('Maratón Trail 42K', 37.8504, -5.6142, 42.195),
    upGpx('Media Maratón Trail 21K', 37.8504, -5.6142, 21.097),
    upGpx('Gran Fondo 120km', 42.8469, -2.6727, 120),
    upGpx('Mediofondo 80km', 42.8469, -2.6727, 80),
    upGpx('Marcha Corta 40km', 42.8469, -2.6727, 40),
    upGpx('Gran Fondo 150km', 42.8497, -2.6742, 150),
    upGpx('Mediofondo 75km', 42.8497, -2.6742, 75),
    upGpx('Distancia Olímpica', 41.3879, 2.1965, 51.5),
    upGpx('Distancia Sprint', 41.3879, 2.1965, 25.75),
    upGpx('Distancia Estándar', 41.2762, 1.9758, 6),
    upGpx('Distancia Sprint Castelldefels', 41.2762, 1.9758, 3),
  ]);

  console.log('Assets uploaded.');

  await AppDataSource.initialize();
  console.log('Connected to database.');

  const companyRepo = AppDataSource.getRepository(Company);
  const userRepo = AppDataSource.getRepository(User);
  const eventRepo = AppDataSource.getRepository(SportEvent);
  const subEventRepo = AppDataSource.getRepository(SportSubEvent);
  const followRepo = AppDataSource.getRepository(Follow);
  const postRepo = AppDataSource.getRepository(Post);
  const commentRepo = AppDataSource.getRepository(PostComment);
  const likeRepo = AppDataSource.getRepository(PostLike);
  const registrationRepo = AppDataSource.getRepository(Registration);
  const paymentRepo = AppDataSource.getRepository(Payment);
  const resultRepo = AppDataSource.getRepository(Result);

  // ── Clean previous seed data (reverse FK order) ───────────────────────────

  const existingUsers_precheck = await userRepo.findBy(
    USER_EMAILS.map((email) => ({ email })),
  );
  if (existingUsers_precheck.length) {
    const ids = existingUsers_precheck.map((u) => u.id);
    await resultRepo
      .createQueryBuilder()
      .delete()
      .where('participant_id IN (:...ids)', { ids })
      .execute();
    await registrationRepo
      .createQueryBuilder()
      .delete()
      .where('participant_id IN (:...ids)', { ids })
      .execute();
  }

  const existingEvents = await eventRepo.findBy(
    EVENT_SLUGS.map((slug) => ({ slug })),
  );
  if (existingEvents.length) {
    await subEventRepo
      .createQueryBuilder()
      .delete()
      .where('sportEventId IN (:...ids)', {
        ids: existingEvents.map((e) => e.id),
      })
      .execute();
    await eventRepo.remove(existingEvents);
    console.log(`Removed ${existingEvents.length} existing sport events.`);
  }

  const existingUsers = await userRepo.findBy(
    USER_EMAILS.map((email) => ({ email })),
  );
  if (existingUsers.length) {
    await userRepo.remove(existingUsers);
    console.log(`Removed ${existingUsers.length} existing users.`);
  }

  const existingCompanies = await companyRepo.findBy(
    COMPANY_SLUGS.map((slug) => ({ slug })),
  );
  if (existingCompanies.length) {
    await companyRepo.remove(existingCompanies);
    console.log(`Removed ${existingCompanies.length} existing companies.`);
  }

  // ── Companies ─────────────────────────────────────────────────────────────

  const [compTrail, compCycling, compTriatlon] = await companyRepo.save([
    companyRepo.create({
      name: 'Andalucía Trail Runners',
      slug: 'andalucia-trail-runners',
      description:
        'Organización referente en carreras de montaña y trail running en el sur de España. Más de 15 años organizando eventos en Sierra Nevada y las sierras béticas.',
      website: 'https://andaluciatrailrunners.es',
      email: 'info@andaluciatrailrunners.es',
      phone: '+34 958 000 001',
      country: 'España',
      city: 'Granada',
      sportType: 'trail',
      companyType: 'Club deportivo',
      logoUrl: logoTrail,
      bannerUrl: bannerTrail,
      isActive: true,
    }),
    companyRepo.create({
      name: 'Cycling Euskadi',
      slug: 'cycling-euskadi',
      description:
        'Club ciclista del País Vasco especializado en gran fondo y marchas cicloturistas. Organizamos pruebas por los puertos más icónicos del norte de España.',
      website: 'https://cyclingeuskadi.eus',
      email: 'info@cyclingeuskadi.eus',
      phone: '+34 945 000 002',
      country: 'España',
      city: 'Vitoria-Gasteiz',
      sportType: 'cycling',
      companyType: 'Club deportivo',
      logoUrl: logoCycling,
      bannerUrl: bannerCycling,
      isActive: true,
    }),
    companyRepo.create({
      name: 'Club Triatlón Catalunya',
      slug: 'club-triatlo-cat',
      description:
        'Federación de clubes de triatlón de Cataluña. Organizamos pruebas olímpicas, sprint y de larga distancia en el litoral mediterráneo.',
      website: 'https://triatlocatalunya.cat',
      email: 'info@triatlocatalunya.cat',
      phone: '+34 934 000 003',
      country: 'España',
      city: 'Barcelona',
      sportType: 'triathlon',
      companyType: 'Federación',
      logoUrl: logoTriatlon,
      bannerUrl: bannerTriatlon,
      isActive: true,
    }),
  ]);

  console.log(
    'Companies created:',
    compTrail.slug,
    compCycling.slug,
    compTriatlon.slug,
  );

  // ── Users ─────────────────────────────────────────────────────────────────

  const [
    superAdmin,
    adminTrail,
    _staffTrail,
    adminCycling,
    _staffCycling,
    adminTriatlon,
    p1,
    p2,
    p3,
  ] = await userRepo.save([
    userRepo.create({
      email: 'admin@ekinnow.com',
      passwordHash: PASSWORD_HASH,
      firstName: 'Super',
      lastName: 'Admin',
      username: 'superadmin',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      isVerified: true,
      country: 'España',
      city: 'Madrid',
      avatarUrl: avatarSuperAdmin,
    }),
    userRepo.create({
      email: 'admin@andalucia-trail.com',
      passwordHash: PASSWORD_HASH,
      firstName: 'Carmen',
      lastName: 'Ruiz Torres',
      username: 'carmen.ruiz',
      role: UserRole.COMPANY_ADMIN,
      companyId: compTrail.id,
      isActive: true,
      isVerified: true,
      country: 'España',
      city: 'Granada',
      avatarUrl: avatarCarmen,
    }),
    userRepo.create({
      email: 'staff@andalucia-trail.com',
      passwordHash: PASSWORD_HASH,
      firstName: 'Miguel',
      lastName: 'Fernández López',
      username: 'miguel.fernandez',
      role: UserRole.COMPANY_STAFF,
      companyId: compTrail.id,
      isActive: true,
      isVerified: true,
      country: 'España',
      city: 'Málaga',
      avatarUrl: avatarMiguel,
    }),
    userRepo.create({
      email: 'admin@cycling-euskadi.com',
      passwordHash: PASSWORD_HASH,
      firstName: 'Iker',
      lastName: 'Etxebarria Goikoetxea',
      username: 'iker.etxebarria',
      role: UserRole.COMPANY_ADMIN,
      companyId: compCycling.id,
      isActive: true,
      isVerified: true,
      country: 'España',
      city: 'Vitoria-Gasteiz',
      avatarUrl: avatarIker,
    }),
    userRepo.create({
      email: 'staff@cycling-euskadi.com',
      passwordHash: PASSWORD_HASH,
      firstName: 'Amaia',
      lastName: 'Urrutia Aranda',
      username: 'amaia.urrutia',
      role: UserRole.COMPANY_STAFF,
      companyId: compCycling.id,
      isActive: true,
      isVerified: true,
      country: 'España',
      city: 'Bilbao',
      avatarUrl: avatarAmaia,
    }),
    userRepo.create({
      email: 'admin@triatlo-cat.com',
      passwordHash: PASSWORD_HASH,
      firstName: 'Marc',
      lastName: 'Puig Vidal',
      username: 'marc.puig',
      role: UserRole.COMPANY_ADMIN,
      companyId: compTriatlon.id,
      isActive: true,
      isVerified: true,
      country: 'España',
      city: 'Barcelona',
      avatarUrl: avatarMarc,
    }),
    userRepo.create({
      email: 'participant1@test.com',
      passwordHash: PASSWORD_HASH,
      firstName: 'Laura',
      lastName: 'Gómez Martínez',
      username: 'laura.gomez',
      role: UserRole.PARTICIPANT,
      isActive: true,
      isVerified: true,
      country: 'España',
      city: 'Madrid',
      gender: 'F',
      birthDate: new Date('1992-03-15'),
      avatarUrl: avatarLaura,
    }),
    userRepo.create({
      email: 'participant2@test.com',
      passwordHash: PASSWORD_HASH,
      firstName: 'Javier',
      lastName: 'Moreno Sánchez',
      username: 'javier.moreno',
      role: UserRole.PARTICIPANT,
      isActive: true,
      isVerified: true,
      country: 'España',
      city: 'Sevilla',
      gender: 'M',
      birthDate: new Date('1988-07-22'),
      avatarUrl: avatarJavier,
    }),
    userRepo.create({
      email: 'participant3@test.com',
      passwordHash: PASSWORD_HASH,
      firstName: 'Neus',
      lastName: 'Ferrer Soler',
      username: 'neus.ferrer',
      role: UserRole.PARTICIPANT,
      isActive: true,
      isVerified: true,
      country: 'España',
      city: 'Barcelona',
      gender: 'F',
      birthDate: new Date('1995-11-08'),
      avatarUrl: avatarNeus,
    }),
  ]);

  console.log('Users created:', USER_EMAILS.join(', '));

  // ── Sport Events ──────────────────────────────────────────────────────────

  const [
    evSierraNevada,
    evSevillaTrail,
    evItzulia,
    evAlavesa,
    evBarcelona,
    evCastelldefels,
  ] = await eventRepo.save([
    // ── Andalucía Trail Runners ──────────────────────────────────────────────
    eventRepo.create({
      slug: 'sierra-nevada-ultra-trail-2026',
      name: 'Sierra Nevada Ultra Trail 2026',
      shortDescription:
        'La prueba de ultra trail más exigente de Andalucía entre los picos de Sierra Nevada.',
      description:
        'El Sierra Nevada Ultra Trail es la carrera de referencia del trail running andaluz. Tres distancias para todos los niveles, atravesando los paisajes más espectaculares de la sierra con salida y llegada en Pradollano.',
      sportType: 'trail',
      status: SportEventStatus.REGISTRATION_OPEN,
      eventDate: new Date('2026-09-12'),
      registrationOpenAt: new Date('2026-04-01'),
      registrationCloseAt: new Date('2026-08-31'),
      country: 'España',
      region: 'Andalucía',
      city: 'Granada',
      address: 'Estación de Esquí Sierra Nevada, Pradollano',
      latitude: 37.0948,
      longitude: -3.3926,
      featured: true,
      logoUrl: logoSierraNevada,
      bannerUrl: bannerSierraNevada,
      companyId: compTrail.id,
    }),
    eventRepo.create({
      slug: 'maraton-sevilla-trail-2026',
      name: 'Maratón de Sevilla Trail 2026',
      shortDescription:
        'Carrera de trail running por los pinares de la Sierra Norte de Sevilla.',
      description:
        'La Maratón de Sevilla Trail discurre por los caminos y veredas de la Sierra Norte sevillana, en pleno Parque Natural. Un recorrido técnico con vistas únicas al valle del Guadalquivir.',
      sportType: 'trail',
      status: SportEventStatus.PUBLISHED,
      eventDate: new Date('2026-11-28'),
      registrationOpenAt: new Date('2026-07-01'),
      registrationCloseAt: new Date('2026-11-15'),
      country: 'España',
      region: 'Andalucía',
      city: 'Sevilla',
      address: 'Parque Natural Sierra Norte, Constantina',
      latitude: 37.8504,
      longitude: -5.6142,
      featured: false,
      logoUrl: logoSevillaTrail,
      bannerUrl: bannerSevillaTrail,
      companyId: compTrail.id,
    }),

    // ── Cycling Euskadi ───────────────────────────────────────────────────────
    eventRepo.create({
      slug: 'itzulia-amateur-2026',
      name: 'Itzulia Amateur 2026',
      shortDescription:
        'Gran fondo cicloturista por los puertos míticos de la Itzulia Basque Country.',
      description:
        'Vive la experiencia de pedalear por los mismos puertos que los profesionales de la Itzulia. Tres distancias para cicloturistas y aficionados con control de tiempos y avituallamiento en cada puerto.',
      sportType: 'cycling',
      status: SportEventStatus.REGISTRATION_OPEN,
      eventDate: new Date('2026-04-04'),
      registrationOpenAt: new Date('2026-01-15'),
      registrationCloseAt: new Date('2026-03-25'),
      country: 'España',
      region: 'País Vasco',
      city: 'Vitoria-Gasteiz',
      address: 'Parque de la Florida, Vitoria-Gasteiz',
      latitude: 42.8469,
      longitude: -2.6727,
      featured: true,
      logoUrl: logoItzulia,
      bannerUrl: bannerItzulia,
      companyId: compCycling.id,
    }),
    eventRepo.create({
      slug: 'vuelta-ciclista-alavesa-2026',
      name: 'Vuelta Ciclista Alavesa 2026',
      shortDescription:
        'Marcha cicloturista de verano por la Llanada Alavesa y las sierras de Álava.',
      description:
        'La Vuelta Ciclista Alavesa recorre los valles y sierras de Álava en un evento familiar y de gran ambiente. Dos recorridos para todos los niveles de condición física.',
      sportType: 'cycling',
      status: SportEventStatus.REGISTRATION_CLOSED,
      eventDate: new Date('2026-06-20'),
      registrationOpenAt: new Date('2026-03-01'),
      registrationCloseAt: new Date('2026-06-10'),
      country: 'España',
      region: 'País Vasco',
      city: 'Vitoria-Gasteiz',
      address: 'Plaza de la Virgen Blanca, Vitoria-Gasteiz',
      latitude: 42.8497,
      longitude: -2.6742,
      featured: false,
      logoUrl: logoAlavesa,
      bannerUrl: bannerAlavesa,
      companyId: compCycling.id,
    }),

    // ── Club Triatlón Catalunya ────────────────────────────────────────────────
    eventRepo.create({
      slug: 'barcelona-triathlon-2026',
      name: 'Barcelona Triathlon 2026',
      shortDescription:
        'Triatlón olímpico y sprint en el corazón del Mediterráneo, con natación en el Port Olímpic.',
      description:
        'El Barcelona Triathlon es el evento de triatlón más importante de Cataluña, combinando la natación en el Port Olímpic, ciclismo por el litoral y carrera por la Vila Olímpica. Distancias olímpica y sprint para amateurs y élite.',
      sportType: 'triathlon',
      status: SportEventStatus.REGISTRATION_OPEN,
      eventDate: new Date('2026-07-05'),
      registrationOpenAt: new Date('2026-02-01'),
      registrationCloseAt: new Date('2026-06-20'),
      country: 'España',
      region: 'Cataluña',
      city: 'Barcelona',
      address: 'Port Olímpic de Barcelona',
      latitude: 41.3879,
      longitude: 2.1965,
      featured: true,
      logoUrl: logoBarcelona,
      bannerUrl: bannerBarcelona,
      companyId: compTriatlon.id,
    }),
    eventRepo.create({
      slug: 'aquathlon-castelldefels-2026',
      name: 'Aquathlon Castelldefels 2026',
      shortDescription:
        'Aquatlón en la playa de Castelldefels: natación en el mar y carrera a pie por el paseo.',
      description:
        'El Aquathlon de Castelldefels combina natación en aguas abiertas del Mediterráneo con una carrera a pie por el paseo marítimo. Ideal para iniciarse en el mundo del deporte combinado.',
      sportType: 'triathlon',
      status: SportEventStatus.PUBLISHED,
      eventDate: new Date('2026-05-17'),
      registrationOpenAt: new Date('2026-03-01'),
      registrationCloseAt: new Date('2026-05-10'),
      country: 'España',
      region: 'Cataluña',
      city: 'Castelldefels',
      address: 'Playa de Castelldefels, Paseo Marítimo',
      latitude: 41.2762,
      longitude: 1.9758,
      featured: false,
      logoUrl: logoCastelldefels,
      bannerUrl: bannerCastelldefels,
      companyId: compTriatlon.id,
    }),
  ]);

  console.log('Sport events created:', EVENT_SLUGS.join(', '));

  // ── Sport Sub-Events ──────────────────────────────────────────────────────

  const [
    subUltra100,
    subClassic50,
    subFamily25,
    _subSevillaMaraton,
    _subSevillaMedia,
    subItzuliaGrande,
    subItzuliaMedio,
    subItzuliaCorta,
    _subAlavesaGrande,
    _subAlavesaMedio,
    subBarcelonaOlimpica,
    subBarcelonaSprint,
    subCastelldefelsEstandar,
    _subCastelldefelsSprint,
  ] = await subEventRepo.save([
    // Sierra Nevada Ultra Trail 2026 ─────────────────────────────────────────
    subEventRepo.create({
      sportEventId: evSierraNevada.id,
      name: 'Ultra 100K',
      shortDescription:
        'La distancia reina: 100 km y 6500 m D+ por las cumbres de Sierra Nevada.',
      description:
        'El recorrido de 100 km corona los picos más altos de la Península, superando los 3000 m de altitud en varios puntos. Solo para atletas con experiencia en ultra trail. Obligatorio acreditar carreras de larga distancia.',
      status: SportSubEventStatus.REGISTRATION_OPEN,
      distanceKm: 100,
      elevationGainMeters: 6500,
      capacity: 300,
      registeredParticipants: 187,
      price: 95,
      currency: 'EUR',
      startDateTime: new Date('2026-09-12T06:00:00'),
      timeLimitMinutes: 1440,
      minimumAge: 23,
      bibNumberRequired: true,
      bibStartNumber: 1,
      bibEndNumber: 300,
      registrationOpenAt: new Date('2026-04-01'),
      registrationCloseAt: new Date('2026-08-31'),
      gpxUrl: gpxUltra100,
    }),
    subEventRepo.create({
      sportEventId: evSierraNevada.id,
      name: 'Classic 50K',
      shortDescription:
        '50 km y 3200 m D+ por los valles y crestas de Sierra Nevada.',
      description:
        'El recorrido clásico de la prueba, diseñado para atletas de nivel medio-alto con experiencia en carreras de montaña. Transcurre por los paisajes más fotogénicos de la sierra.',
      status: SportSubEventStatus.REGISTRATION_OPEN,
      distanceKm: 50,
      elevationGainMeters: 3200,
      capacity: 600,
      registeredParticipants: 423,
      price: 65,
      currency: 'EUR',
      startDateTime: new Date('2026-09-12T07:30:00'),
      timeLimitMinutes: 900,
      minimumAge: 18,
      bibNumberRequired: true,
      bibStartNumber: 301,
      bibEndNumber: 900,
      registrationOpenAt: new Date('2026-04-01'),
      registrationCloseAt: new Date('2026-08-31'),
      gpxUrl: gpxClassic50,
    }),
    subEventRepo.create({
      sportEventId: evSierraNevada.id,
      name: 'Family 25K',
      shortDescription:
        '25 km accesibles para iniciarse en el trail running de montaña.',
      description:
        'Recorrido de iniciación al trail running de alta montaña. Sin tramos técnicos pero con vistas espectaculares. Abierto a runners con experiencia básica en carrera a pie.',
      status: SportSubEventStatus.REGISTRATION_OPEN,
      distanceKm: 25,
      elevationGainMeters: 1400,
      capacity: 1000,
      registeredParticipants: 612,
      price: 42,
      currency: 'EUR',
      startDateTime: new Date('2026-09-12T08:30:00'),
      timeLimitMinutes: 480,
      minimumAge: 16,
      bibNumberRequired: true,
      bibStartNumber: 901,
      bibEndNumber: 1900,
      registrationOpenAt: new Date('2026-04-01'),
      registrationCloseAt: new Date('2026-08-31'),
      gpxUrl: gpxFamily25,
    }),

    // Maratón de Sevilla Trail 2026 ───────────────────────────────────────────
    subEventRepo.create({
      sportEventId: evSevillaTrail.id,
      name: 'Maratón Trail 42K',
      shortDescription:
        '42 km por los senderos y cañadas de la Sierra Norte sevillana.',
      description:
        'Recorrido maratón por los caminos de tierra y senderos del Parque Natural Sierra Norte de Sevilla. Desnivel moderado, ideal para atletas que quieren completar su primera maratón de trail.',
      status: SportSubEventStatus.DRAFT,
      distanceKm: 42.195,
      elevationGainMeters: 1800,
      capacity: 500,
      registeredParticipants: 0,
      price: 55,
      currency: 'EUR',
      startDateTime: new Date('2026-11-28T08:00:00'),
      timeLimitMinutes: 600,
      minimumAge: 18,
      bibNumberRequired: true,
      bibStartNumber: 1,
      bibEndNumber: 500,
      registrationOpenAt: new Date('2026-07-01'),
      registrationCloseAt: new Date('2026-11-15'),
      gpxUrl: gpxSevillaMaraton,
    }),
    subEventRepo.create({
      sportEventId: evSevillaTrail.id,
      name: 'Media Maratón Trail 21K',
      shortDescription: '21 km de trail running por la sierra de Constantina.',
      description:
        'Media maratón de trail por los bosques de alcornoques y encinas de la Sierra Norte. Recorrido técnico con paisajes únicos del Parque Natural.',
      status: SportSubEventStatus.DRAFT,
      distanceKm: 21.097,
      elevationGainMeters: 900,
      capacity: 800,
      registeredParticipants: 0,
      price: 38,
      currency: 'EUR',
      startDateTime: new Date('2026-11-28T09:00:00'),
      timeLimitMinutes: 360,
      minimumAge: 16,
      bibNumberRequired: true,
      bibStartNumber: 501,
      bibEndNumber: 1300,
      registrationOpenAt: new Date('2026-07-01'),
      registrationCloseAt: new Date('2026-11-15'),
      gpxUrl: gpxSevillaMedia,
    }),

    // Itzulia Amateur 2026 ────────────────────────────────────────────────────
    subEventRepo.create({
      sportEventId: evItzulia.id,
      name: 'Gran Fondo 120km',
      shortDescription:
        '120 km con los puertos míticos de la Itzulia: Arrate, Jaizkibel y Murgil.',
      description:
        'El recorrido largo de la Itzulia Amateur incluye los puertos más icónicos de la vuelta profesional. Avituallamiento en cada puerto, servicio de bicicletas y escoba final.',
      status: SportSubEventStatus.REGISTRATION_OPEN,
      distanceKm: 120,
      elevationGainMeters: 3200,
      capacity: 800,
      registeredParticipants: 651,
      price: 55,
      currency: 'EUR',
      startDateTime: new Date('2026-04-04T08:00:00'),
      timeLimitMinutes: 480,
      minimumAge: 18,
      bibNumberRequired: true,
      bibStartNumber: 1,
      bibEndNumber: 800,
      registrationOpenAt: new Date('2026-01-15'),
      registrationCloseAt: new Date('2026-03-25'),
      gpxUrl: gpxItzuliaGranFondo,
    }),
    subEventRepo.create({
      sportEventId: evItzulia.id,
      name: 'Mediofondo 80km',
      shortDescription: '80 km para aficionados con experiencia en gran fondo.',
      description:
        'Recorrido intermedio que incluye los puertos más fotogénicos del norte del País Vasco. Salida escalonada para garantizar la seguridad en los primeros kilómetros.',
      status: SportSubEventStatus.REGISTRATION_OPEN,
      distanceKm: 80,
      elevationGainMeters: 1800,
      capacity: 1200,
      registeredParticipants: 943,
      price: 42,
      currency: 'EUR',
      startDateTime: new Date('2026-04-04T08:30:00'),
      timeLimitMinutes: 360,
      minimumAge: 16,
      bibNumberRequired: true,
      bibStartNumber: 801,
      bibEndNumber: 2000,
      registrationOpenAt: new Date('2026-01-15'),
      registrationCloseAt: new Date('2026-03-25'),
      gpxUrl: gpxItzuliaMediofondo,
    }),
    subEventRepo.create({
      sportEventId: evItzulia.id,
      name: 'Marcha Corta 40km',
      shortDescription:
        '40 km de iniciación al cicloturismo por los alrededores de Vitoria.',
      description:
        'Recorrido familiar por el cinturón verde de Vitoria-Gasteiz y los valles alaveses. Sin puertos de montaña, apto para ciclistas de cualquier nivel.',
      status: SportSubEventStatus.REGISTRATION_OPEN,
      distanceKm: 40,
      elevationGainMeters: 600,
      capacity: 2000,
      registeredParticipants: 1432,
      price: 28,
      currency: 'EUR',
      startDateTime: new Date('2026-04-04T09:00:00'),
      timeLimitMinutes: 240,
      minimumAge: 14,
      bibNumberRequired: false,
      registrationOpenAt: new Date('2026-01-15'),
      registrationCloseAt: new Date('2026-03-25'),
      gpxUrl: gpxItzuliaCorta,
    }),

    // Vuelta Ciclista Alavesa 2026 ─────────────────────────────────────────────
    subEventRepo.create({
      sportEventId: evAlavesa.id,
      name: 'Gran Fondo 150km',
      shortDescription:
        '150 km por los valles y sierras del interior de Álava.',
      description:
        'El recorrido largo de la Vuelta Alavesa atraviesa los valles de Ayala y Kuartango, con la Sierra de Entzia como techo de la jornada. Prueba con control de tiempos parciales.',
      status: SportSubEventStatus.REGISTRATION_CLOSED,
      distanceKm: 150,
      elevationGainMeters: 2800,
      capacity: 600,
      registeredParticipants: 600,
      price: 48,
      currency: 'EUR',
      startDateTime: new Date('2026-06-20T07:30:00'),
      timeLimitMinutes: 600,
      minimumAge: 18,
      bibNumberRequired: true,
      bibStartNumber: 1,
      bibEndNumber: 600,
      registrationOpenAt: new Date('2026-03-01'),
      registrationCloseAt: new Date('2026-06-10'),
      gpxUrl: gpxAlavesaGranFondo,
    }),
    subEventRepo.create({
      sportEventId: evAlavesa.id,
      name: 'Mediofondo 75km',
      shortDescription: '75 km por la Llanada Alavesa con final en Vitoria.',
      description:
        'Recorrido de dificultad media por la zona central de Álava. Terreno mixto con tramos de carretera nacional y caminos secundarios de escaso tráfico.',
      status: SportSubEventStatus.REGISTRATION_CLOSED,
      distanceKm: 75,
      elevationGainMeters: 1200,
      capacity: 1000,
      registeredParticipants: 1000,
      price: 32,
      currency: 'EUR',
      startDateTime: new Date('2026-06-20T08:00:00'),
      timeLimitMinutes: 360,
      minimumAge: 16,
      bibNumberRequired: true,
      bibStartNumber: 601,
      bibEndNumber: 1600,
      registrationOpenAt: new Date('2026-03-01'),
      registrationCloseAt: new Date('2026-06-10'),
      gpxUrl: gpxAlavesaMediofondo,
    }),

    // Barcelona Triathlon 2026 ────────────────────────────────────────────────
    subEventRepo.create({
      sportEventId: evBarcelona.id,
      name: 'Distancia Olímpica',
      shortDescription: '1,5 km natación + 40 km bicicleta + 10 km carrera.',
      description:
        'La distancia olímpica de referencia para todos los triatletas. Natación en el Port Olímpic, circuito ciclista por el litoral y carrera a pie por la Vila Olímpica con un ambiente inigualable.',
      status: SportSubEventStatus.REGISTRATION_OPEN,
      distanceKm: 51.5,
      elevationGainMeters: 120,
      capacity: 1500,
      registeredParticipants: 1087,
      price: 95,
      currency: 'EUR',
      startDateTime: new Date('2026-07-05T08:00:00'),
      timeLimitMinutes: 210,
      minimumAge: 18,
      bibNumberRequired: true,
      bibStartNumber: 1,
      bibEndNumber: 1500,
      registrationOpenAt: new Date('2026-02-01'),
      registrationCloseAt: new Date('2026-06-20'),
      gpxUrl: gpxBarcelonaOlimpica,
    }),
    subEventRepo.create({
      sportEventId: evBarcelona.id,
      name: 'Distancia Sprint',
      shortDescription: '750 m natación + 20 km bicicleta + 5 km carrera.',
      description:
        'La distancia sprint es perfecta para debutantes en triatlón o para atletas que buscan un formato más explosivo. Mismo circuito que la olímpica pero en formato reducido.',
      status: SportSubEventStatus.REGISTRATION_OPEN,
      distanceKm: 25.75,
      elevationGainMeters: 60,
      capacity: 1000,
      registeredParticipants: 734,
      price: 65,
      currency: 'EUR',
      startDateTime: new Date('2026-07-05T09:30:00'),
      timeLimitMinutes: 120,
      minimumAge: 16,
      bibNumberRequired: true,
      bibStartNumber: 1501,
      bibEndNumber: 2500,
      registrationOpenAt: new Date('2026-02-01'),
      registrationCloseAt: new Date('2026-06-20'),
      gpxUrl: gpxBarcelonaSprint,
    }),

    // Aquathlon Castelldefels 2026 ─────────────────────────────────────────────
    subEventRepo.create({
      sportEventId: evCastelldefels.id,
      name: 'Distancia Estándar',
      shortDescription:
        '1000 m natación en el mar + 5 km carrera por el paseo marítimo.',
      description:
        'La distancia estándar del aquatlón de Castelldefels combina 1 km de natación en aguas abiertas del Mediterráneo con 5 km de carrera a pie por el paseo. Salida en línea desde la orilla.',
      status: SportSubEventStatus.DRAFT,
      distanceKm: 6,
      elevationGainMeters: 20,
      capacity: 500,
      registeredParticipants: 0,
      price: 35,
      currency: 'EUR',
      startDateTime: new Date('2026-05-17T09:00:00'),
      timeLimitMinutes: 90,
      minimumAge: 16,
      bibNumberRequired: true,
      bibStartNumber: 1,
      bibEndNumber: 500,
      registrationOpenAt: new Date('2026-03-01'),
      registrationCloseAt: new Date('2026-05-10'),
      gpxUrl: gpxCastelldefelsEstandar,
    }),
    subEventRepo.create({
      sportEventId: evCastelldefels.id,
      name: 'Distancia Sprint',
      shortDescription: '500 m natación en el mar + 2,5 km carrera.',
      description:
        'La distancia más corta del aquatlón, ideal para principiantes o para quienes quieran iniciarse en la natación en aguas abiertas. Circuito balizado y con socorristas acuáticos.',
      status: SportSubEventStatus.DRAFT,
      distanceKm: 3,
      elevationGainMeters: 10,
      capacity: 800,
      registeredParticipants: 0,
      price: 22,
      currency: 'EUR',
      startDateTime: new Date('2026-05-17T10:30:00'),
      timeLimitMinutes: 60,
      minimumAge: 14,
      bibNumberRequired: false,
      registrationOpenAt: new Date('2026-03-01'),
      registrationCloseAt: new Date('2026-05-10'),
      gpxUrl: gpxCastelldefelsSprint,
    }),
  ]);

  console.log('Sport sub-events created.');

  // ── Follows ───────────────────────────────────────────────────────────────

  await followRepo.save([
    // Laura sigue a Javier, Neus, Carmen y Marc
    followRepo.create({ followerId: p1.id, followingId: p2.id }),
    followRepo.create({ followerId: p1.id, followingId: p3.id }),
    followRepo.create({ followerId: p1.id, followingId: adminTrail.id }),
    followRepo.create({ followerId: p1.id, followingId: adminTriatlon.id }),
    // Javier sigue a Laura, Iker
    followRepo.create({ followerId: p2.id, followingId: p1.id }),
    followRepo.create({ followerId: p2.id, followingId: adminCycling.id }),
    // Neus sigue a Laura, Marc
    followRepo.create({ followerId: p3.id, followingId: p1.id }),
    followRepo.create({ followerId: p3.id, followingId: adminTriatlon.id }),
    // Carmen sigue a su staff
    followRepo.create({ followerId: adminTrail.id, followingId: p1.id }),
    // Iker sigue a Javier
    followRepo.create({ followerId: adminCycling.id, followingId: p2.id }),
  ]);

  console.log('Follows created.');

  // ── Posts ─────────────────────────────────────────────────────────────────

  const [
    postIker1,
    postMarc1,
    postNeus1,
    postCarmen1,
    postJavier1,
    postLaura1,
    postJavier2,
    postNeus2,
    postLaura2,
    postSuperAdmin1,
  ] = await postRepo.save([
    postRepo.create({
      userId: adminCycling.id,
      type: PostType.EVENT_REF,
      sportEventId: evItzulia.id,
      text: '¡Quedan menos de 300 plazas para el Gran Fondo 120km de la Itzulia Amateur! Este año el recorrido incluye el Jaizkibel y el Arrate. Si estás pensándotelo, no esperes más 🚴‍♂️🏔️',
    }),
    postRepo.create({
      userId: adminTriatlon.id,
      type: PostType.EVENT_REF,
      sportEventId: evBarcelona.id,
      text: 'Orgullosos de presentar el Barcelona Triathlon 2026. Natación en el Port Olímpic, ciclismo por el litoral y carrera por la Vila Olímpica. Será épico 🏊🚴🏃 #BarcelonaTriathlon',
    }),
    postRepo.create({
      userId: p3.id,
      type: PostType.ACTIVITY,
      activityData: {
        sport: 'triathlon',
        distance: 25.75,
        duration: 4320,
        pace: '2:48/km',
        elevation: 60,
      },
      text: 'Entrenamiento de bloque esta mañana. Sprint completo a ritmo de competición, muy contenta con las sensaciones en la carrera 💪 Preparando el Barcelona Triathlon!',
    }),
    postRepo.create({
      userId: adminTrail.id,
      type: PostType.EVENT_REF,
      sportEventId: evSierraNevada.id,
      text: 'Abrimos inscripciones para la Sierra Nevada Ultra Trail 2026 🏔️ Tres distancias, los paisajes más espectaculares de Andalucía y un ambiente que no encontrarás en ningún otro sitio. La Ultra 100K ya supera el 60% de aforo. ¡Corre a inscribirte!',
    }),
    postRepo.create({
      userId: p2.id,
      type: PostType.IMAGE,
      imageUrl: postImageJavier,
      text: 'Tirada larga por Sierra Norte esta mañana. Piernas de hierro y pulmones de cartón 😅 Pero hay que sufrir si quieres llegar en forma a la sierra. Poco a poco.',
    }),
    postRepo.create({
      userId: p1.id,
      type: PostType.TEXT,
      text: 'Semana de carga terminada ✅ 4 sesiones, 68 km y 2800 m D+. El cuerpo pide descanso pero la cabeza ya piensa en el siguiente reto. Alguien más preparando Sierra Nevada? 🏔️',
    }),
    postRepo.create({
      userId: p2.id,
      type: PostType.TEXT,
      text: 'Primer entrenamiento nocturno del año con frontal. Hay algo mágico en correr cuando el monte está en silencio y solo escuchas tus pasos y la respiración. Muy recomendable si nunca lo habéis probado 🌙',
    }),
    postRepo.create({
      userId: p3.id,
      type: PostType.TEXT,
      text: 'Mañana toca piscina a las 6:30, bici al mediodía y carrera a la tarde. La vida del triatleta no es fácil pero tampoco la cambiaría por nada 😂 A por ello!',
    }),
    postRepo.create({
      userId: p1.id,
      type: PostType.IMAGE,
      imageUrl: postImageLaura,
      text: 'Salida en grupo por La Pedriza. Hemos pillado el día perfecto, sin viento y con buenas piernas. Ya tengo ganas de que llegue junio 🚴‍♀️',
    }),
    postRepo.create({
      userId: superAdmin.id,
      type: PostType.TEXT,
      text: 'Ekinnow crece 🚀 Ya somos más de 500 atletas registrados en la plataforma. Gracias a todos los organizadores y participantes que confían en nosotros. Seguimos trabajando para mejorar vuestra experiencia deportiva.',
    }),
  ]);

  console.log('Posts created.');

  // ── Likes ─────────────────────────────────────────────────────────────────

  await likeRepo.save([
    // Post Iker (Itzulia event ref)
    likeRepo.create({ userId: p2.id, postId: postIker1.id }),
    likeRepo.create({ userId: p1.id, postId: postIker1.id }),
    likeRepo.create({ userId: adminTrail.id, postId: postIker1.id }),
    // Post Marc (Barcelona Triathlon)
    likeRepo.create({ userId: p3.id, postId: postMarc1.id }),
    likeRepo.create({ userId: p1.id, postId: postMarc1.id }),
    // Post Neus (actividad triatlón)
    likeRepo.create({ userId: p1.id, postId: postNeus1.id }),
    likeRepo.create({ userId: adminTriatlon.id, postId: postNeus1.id }),
    likeRepo.create({ userId: p2.id, postId: postNeus1.id }),
    // Post Carmen (Sierra Nevada event ref)
    likeRepo.create({ userId: p1.id, postId: postCarmen1.id }),
    likeRepo.create({ userId: p2.id, postId: postCarmen1.id }),
    likeRepo.create({ userId: p3.id, postId: postCarmen1.id }),
    likeRepo.create({ userId: adminCycling.id, postId: postCarmen1.id }),
    // Post Javier (actividad trail)
    likeRepo.create({ userId: p1.id, postId: postJavier1.id }),
    likeRepo.create({ userId: adminTrail.id, postId: postJavier1.id }),
    // Post Laura (texto semana)
    likeRepo.create({ userId: p2.id, postId: postLaura1.id }),
    likeRepo.create({ userId: p3.id, postId: postLaura1.id }),
    likeRepo.create({ userId: adminTrail.id, postId: postLaura1.id }),
    // Post Javier nocturno
    likeRepo.create({ userId: p1.id, postId: postJavier2.id }),
    likeRepo.create({ userId: p3.id, postId: postJavier2.id }),
    // Post Neus (texto triatleta)
    likeRepo.create({ userId: p1.id, postId: postNeus2.id }),
    likeRepo.create({ userId: adminTriatlon.id, postId: postNeus2.id }),
    // Post Laura (actividad ciclismo)
    likeRepo.create({ userId: p2.id, postId: postLaura2.id }),
    likeRepo.create({ userId: adminCycling.id, postId: postLaura2.id }),
    // Post superadmin
    likeRepo.create({ userId: p1.id, postId: postSuperAdmin1.id }),
    likeRepo.create({ userId: p2.id, postId: postSuperAdmin1.id }),
    likeRepo.create({ userId: p3.id, postId: postSuperAdmin1.id }),
  ]);

  console.log('Likes created.');

  // ── Comments ──────────────────────────────────────────────────────────────

  await commentRepo.save([
    // Post Iker (Itzulia)
    commentRepo.create({
      postId: postIker1.id,
      userId: p2.id,
      text: 'Inscrito en el Gran Fondo! Es mi primera vez y estoy emocionado 🎉',
    }),
    commentRepo.create({
      postId: postIker1.id,
      userId: p1.id,
      text: 'Espero que la próxima edición haya también categoría mixta 🙏',
    }),
    commentRepo.create({
      postId: postIker1.id,
      userId: adminCycling.id,
      text: '@laura.gomez estamos trabajando en ello para 2027 👌',
    }),
    // Post Carmen (Sierra Nevada)
    commentRepo.create({
      postId: postCarmen1.id,
      userId: p2.id,
      text: 'Llevo semanas mirando el recorrido de la 50K. Me animo 💪',
    }),
    commentRepo.create({
      postId: postCarmen1.id,
      userId: p1.id,
      text: 'Yo voy a la 25K. ¿Alguien más del grupo?',
    }),
    commentRepo.create({
      postId: postCarmen1.id,
      userId: p3.id,
      text: 'Yo! Mi primer trail de altura, un poco nerviosa pero lista 🙌',
    }),
    commentRepo.create({
      postId: postCarmen1.id,
      userId: adminTrail.id,
      text: 'Os esperamos a todos! Si tenéis dudas sobre el recorrido escribidme directamente.',
    }),
    // Post Neus (actividad)
    commentRepo.create({
      postId: postNeus1.id,
      userId: p1.id,
      text: 'Esos tiempos son una barbaridad, cracks! 🔥',
    }),
    commentRepo.create({
      postId: postNeus1.id,
      userId: adminTriatlon.id,
      text: 'Neus estás volando esta temporada. Te vemos en Barcelona 💪',
    }),
    // Post Javier (actividad trail)
    commentRepo.create({
      postId: postJavier1.id,
      userId: p1.id,
      text: 'Muy buenas sensaciones! 980m de desnivel no es moco de pavo 💪',
    }),
    commentRepo.create({
      postId: postJavier1.id,
      userId: adminTrail.id,
      text: 'Esos entrenamientos por Sierra Norte son perfectos para preparar cualquier trail. Buen trabajo Javier!',
    }),
    // Post Laura (semana de carga)
    commentRepo.create({
      postId: postLaura1.id,
      userId: p2.id,
      text: 'Yo también! Apuntado a la 50K. Nos vemos en la salida 🤙',
    }),
    commentRepo.create({
      postId: postLaura1.id,
      userId: p3.id,
      text: 'Semana brutal Laura! Yo voy a la 25K, así nos vemos 😊',
    }),
    // Post Laura (ciclismo)
    commentRepo.create({
      postId: postLaura2.id,
      userId: adminCycling.id,
      text: '87km por La Pedriza con ese desnivel, brutal! Si algún día vienes al norte te organizamos una salida por los puertos vascos 🏔️',
    }),
  ]);

  console.log('Comments created.');

  // ── Registrations ─────────────────────────────────────────────────────────
  // Past events: Itzulia (Apr 4), Aquathlon Castelldefels (May 17)
  // Future events: Sierra Nevada (Sep 12), Barcelona (Jul 5)

  const [
    regLauraClassic50,
    regLauraBarcelonaSprint,
    regLauraItzuliaMedio,
    regJavierClassic50,
    regJavierItzuliaGrande,
    regJavierItzuliaCorta,
    regNeusBcnOlimpica,
    regNeusCastelldefels,
    regLauraUltra100,
    regJavierFamily25,
    regNeusBcnSprint,
  ] = await registrationRepo.save([
    // Laura → Sierra Nevada 50K (future, APPROVED)
    registrationRepo.create({
      participantId: p1.id,
      sportEventId: evSierraNevada.id,
      subEventId: subClassic50.id,
      status: RegistrationStatus.APPROVED,
    }),
    // Laura → Barcelona Sprint (future, APPROVED)
    registrationRepo.create({
      participantId: p1.id,
      sportEventId: evBarcelona.id,
      subEventId: subBarcelonaSprint.id,
      status: RegistrationStatus.APPROVED,
    }),
    // Laura → Itzulia Mediofondo (past, APPROVED)
    registrationRepo.create({
      participantId: p1.id,
      sportEventId: evItzulia.id,
      subEventId: subItzuliaMedio.id,
      status: RegistrationStatus.APPROVED,
    }),
    // Javier → Sierra Nevada 50K (future, APPROVED)
    registrationRepo.create({
      participantId: p2.id,
      sportEventId: evSierraNevada.id,
      subEventId: subClassic50.id,
      status: RegistrationStatus.APPROVED,
    }),
    // Javier → Itzulia Gran Fondo (past, APPROVED)
    registrationRepo.create({
      participantId: p2.id,
      sportEventId: evItzulia.id,
      subEventId: subItzuliaGrande.id,
      status: RegistrationStatus.APPROVED,
    }),
    // Javier → Itzulia Corta (past, APPROVED)
    registrationRepo.create({
      participantId: p2.id,
      sportEventId: evItzulia.id,
      subEventId: subItzuliaCorta.id,
      status: RegistrationStatus.APPROVED,
    }),
    // Neus → Barcelona Olímpica (future, PENDING)
    registrationRepo.create({
      participantId: p3.id,
      sportEventId: evBarcelona.id,
      subEventId: subBarcelonaOlimpica.id,
      status: RegistrationStatus.PENDING,
    }),
    // Neus → Aquathlon Castelldefels (past, APPROVED)
    registrationRepo.create({
      participantId: p3.id,
      sportEventId: evCastelldefels.id,
      subEventId: subCastelldefelsEstandar.id,
      status: RegistrationStatus.APPROVED,
    }),
    // Laura → Ultra 100K (WAITLIST — capacity near full for seed)
    registrationRepo.create({
      participantId: p1.id,
      sportEventId: evSierraNevada.id,
      subEventId: subUltra100.id,
      status: RegistrationStatus.WAITLIST,
    }),
    // Javier → Sierra Nevada Family 25K (PENDING)
    registrationRepo.create({
      participantId: p2.id,
      sportEventId: evSierraNevada.id,
      subEventId: subFamily25.id,
      status: RegistrationStatus.PENDING,
    }),
    // Neus → Barcelona Sprint (PENDING)
    registrationRepo.create({
      participantId: p3.id,
      sportEventId: evBarcelona.id,
      subEventId: subBarcelonaSprint.id,
      status: RegistrationStatus.PENDING,
    }),
  ]);

  console.log('Registrations created.');

  // ── Payments ──────────────────────────────────────────────────────────────

  await paymentRepo.save([
    // Laura — Sierra Nevada 50K (COMPLETED)
    paymentRepo.create({
      registrationId: regLauraClassic50.id,
      participantId: p1.id,
      amount: 65,
      currency: 'EUR',
      method: PaymentMethod.CARD,
      status: PaymentStatus.COMPLETED,
      transactionId: 'txn_laura_sierra_50k',
    }),
    // Laura — Barcelona Sprint (COMPLETED)
    paymentRepo.create({
      registrationId: regLauraBarcelonaSprint.id,
      participantId: p1.id,
      amount: 65,
      currency: 'EUR',
      method: PaymentMethod.STRIPE,
      status: PaymentStatus.COMPLETED,
      transactionId: 'txn_laura_bcn_sprint',
    }),
    // Laura — Itzulia Mediofondo (COMPLETED)
    paymentRepo.create({
      registrationId: regLauraItzuliaMedio.id,
      participantId: p1.id,
      amount: 42,
      currency: 'EUR',
      method: PaymentMethod.CARD,
      status: PaymentStatus.COMPLETED,
      transactionId: 'txn_laura_itzulia_medio',
    }),
    // Javier — Sierra Nevada 50K (COMPLETED)
    paymentRepo.create({
      registrationId: regJavierClassic50.id,
      participantId: p2.id,
      amount: 65,
      currency: 'EUR',
      method: PaymentMethod.CARD,
      status: PaymentStatus.COMPLETED,
      transactionId: 'txn_javier_sierra_50k',
    }),
    // Javier — Itzulia Gran Fondo (COMPLETED)
    paymentRepo.create({
      registrationId: regJavierItzuliaGrande.id,
      participantId: p2.id,
      amount: 55,
      currency: 'EUR',
      method: PaymentMethod.TRANSFER,
      status: PaymentStatus.COMPLETED,
      transactionId: 'txn_javier_itzulia_grande',
    }),
    // Javier — Itzulia Corta (COMPLETED)
    paymentRepo.create({
      registrationId: regJavierItzuliaCorta.id,
      participantId: p2.id,
      amount: 28,
      currency: 'EUR',
      method: PaymentMethod.CARD,
      status: PaymentStatus.COMPLETED,
      transactionId: 'txn_javier_itzulia_corta',
    }),
    // Neus — Aquathlon Castelldefels (COMPLETED)
    paymentRepo.create({
      registrationId: regNeusCastelldefels.id,
      participantId: p3.id,
      amount: 35,
      currency: 'EUR',
      method: PaymentMethod.STRIPE,
      status: PaymentStatus.COMPLETED,
      transactionId: 'txn_neus_castelldefels',
    }),
    // Neus — Barcelona Olímpica (FAILED — tarjeta rechazada)
    paymentRepo.create({
      registrationId: regNeusBcnOlimpica.id,
      participantId: p3.id,
      amount: 95,
      currency: 'EUR',
      method: PaymentMethod.CARD,
      status: PaymentStatus.FAILED,
      notes: 'Tarjeta rechazada',
    }),
    // Neus — Barcelona Sprint (PENDING — sin pagar)
    paymentRepo.create({
      registrationId: regNeusBcnSprint.id,
      participantId: p3.id,
      amount: 65,
      currency: 'EUR',
      method: PaymentMethod.CARD,
      status: PaymentStatus.PENDING,
    }),
    // Javier — Family 25K (FAILED)
    paymentRepo.create({
      registrationId: regJavierFamily25.id,
      participantId: p2.id,
      amount: 42,
      currency: 'EUR',
      method: PaymentMethod.STRIPE,
      status: PaymentStatus.FAILED,
      notes: 'Error en pasarela de pago',
    }),
    // Laura — Ultra 100K (PENDING — en lista de espera, no pagado)
    paymentRepo.create({
      registrationId: regLauraUltra100.id,
      participantId: p1.id,
      amount: 95,
      currency: 'EUR',
      method: PaymentMethod.CARD,
      status: PaymentStatus.PENDING,
    }),
  ]);

  console.log('Payments created.');

  // ── Results (past events only) ────────────────────────────────────────────
  // Itzulia Amateur 2026 — April 4 (past)
  // Aquathlon Castelldefels 2026 — May 17 (past)

  await resultRepo.save([
    // Itzulia Gran Fondo — Javier (DNF en el Jaizkibel)
    resultRepo.create({
      participantId: p2.id,
      sportEventId: evItzulia.id,
      subEventId: subItzuliaGrande.id,
      status: ResultStatus.DNF,
      bibNumber: 247,
      notes: 'Abandonó en el km 89, calambres',
    }),
    // Itzulia Mediofondo — Laura (FINISHED, posición 18)
    resultRepo.create({
      participantId: p1.id,
      sportEventId: evItzulia.id,
      subEventId: subItzuliaMedio.id,
      position: 18,
      finishTimeSeconds: 11340,
      bibNumber: 892,
      status: ResultStatus.FINISHED,
      category: 'F30-39',
      categoryPosition: 3,
    }),
    // Itzulia Corta — Javier (mismo corredor, sub-evento corto, FINISHED)
    resultRepo.create({
      participantId: p2.id,
      sportEventId: evItzulia.id,
      subEventId: subItzuliaCorta.id,
      position: 312,
      finishTimeSeconds: 5820,
      bibNumber: 1103,
      status: ResultStatus.FINISHED,
      category: 'M35-44',
      categoryPosition: 87,
    }),
    // Aquathlon Castelldefels — Neus (FINISHED, posición 12)
    resultRepo.create({
      participantId: p3.id,
      sportEventId: evCastelldefels.id,
      subEventId: subCastelldefelsEstandar.id,
      position: 12,
      finishTimeSeconds: 2940,
      bibNumber: 78,
      status: ResultStatus.FINISHED,
      category: 'F18-29',
      categoryPosition: 2,
    }),
  ]);

  console.log('Results created.');

  await AppDataSource.destroy();

  console.log('\n✅ Seed completed successfully.\n');
  console.log('Credentials (password: Ekinnow2026!):');
  console.log('  SUPER_ADMIN:   admin@ekinnow.com');
  console.log(
    '  COMPANY_ADMIN: admin@andalucia-trail.com  (Andalucía Trail Runners)',
  );
  console.log('  COMPANY_ADMIN: admin@cycling-euskadi.com  (Cycling Euskadi)');
  console.log(
    '  COMPANY_ADMIN: admin@triatlo-cat.com      (Club Triatlón Catalunya)',
  );
  console.log('  PARTICIPANT:   participant1@test.com');
  console.log('  PARTICIPANT:   participant2@test.com');
  console.log('  PARTICIPANT:   participant3@test.com');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
