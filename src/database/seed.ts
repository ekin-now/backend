import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from './data-source';
import { Company } from '../company/entities/company.entity';
import { User } from '../users/entities/user.entity';
import { SportEvent } from '../sport-event/entities/sport-event.entity';
import { SportSubEvent } from '../sport-sub-event/entities/sport-sub-event.entity';
import { UserRole } from '../auth/decorators/userRole.enum';
import { SportEventStatus } from '../sport-event/entities/sport.event-status.enum';
import { SportSubEventStatus } from '../sport-sub-event/entities/sport-sub-evet-status.enum';

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

  await AppDataSource.initialize();
  console.log('Connected to database.');

  const companyRepo = AppDataSource.getRepository(Company);
  const userRepo = AppDataSource.getRepository(User);
  const eventRepo = AppDataSource.getRepository(SportEvent);
  const subEventRepo = AppDataSource.getRepository(SportSubEvent);

  // ── Clean previous seed data (reverse FK order) ───────────────────────────

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
    _superAdmin,
    _adminTrail,
    _staffTrail,
    _adminCycling,
    _staffCycling,
    _adminTriatlon,
    _p1,
    _p2,
    _p3,
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
      companyId: compTriatlon.id,
    }),
  ]);

  console.log('Sport events created:', EVENT_SLUGS.join(', '));

  // ── Sport Sub-Events ──────────────────────────────────────────────────────

  await subEventRepo.save([
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
    }),
  ]);

  console.log('Sport sub-events created.');

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
