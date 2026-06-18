# Guía de Pagos con Stripe — Para Organizadores

## ¿Cómo funciona?

Ekinnow usa **Stripe Connect Express** como infraestructura de pagos. Esto significa:

- Los participantes pagan directamente desde la app.
- El dinero va a **tu cuenta bancaria** (no a Ekinnow primero).
- Ekinnow retiene una comisión de plataforma del **5%** por cada pago procesado.
- Tú ves tus pagos, balances y transferencias desde tu propio panel de Stripe.

```
Participante paga 65 €
    → Stripe procesa el cobro
        → 61,75 € van a tu cuenta bancaria
        → 3,25 € se quedan en Ekinnow (comisión 5%)
```

---

## Paso 1 — Crear una cuenta Stripe

Ve a [stripe.com](https://stripe.com) y crea una cuenta gratuita con el email de tu organización.

> Stripe es el procesador de pagos. Es quien transfiere el dinero a tu banco. Ekinnow nunca toca tu dinero directamente.

---

## Paso 2 — Conectar tu cuenta a Ekinnow

Desde la app de Ekinnow (o llamando a la API directamente):

```
POST /company/{tu-company-id}/stripe/onboard
Authorization: Bearer <tu-token>
```

La respuesta contiene una `url`. Abre esa URL en el navegador:

```json
{
  "url": "https://connect.stripe.com/setup/e/acct_xxx/..."
}
```

Esta URL te lleva al **formulario de alta de Stripe**. Completa:

1. **Datos personales o de empresa** (nombre, dirección, fecha de nacimiento o CIF)
2. **Número de cuenta bancaria** donde quieres recibir los pagos (IBAN)
3. **Número de teléfono** para verificación
4. **Documento de identidad** (DNI/NIE/Pasaporte) si Stripe lo solicita

> El proceso tarda entre 5 y 15 minutos. Stripe puede pedir documentación adicional si no reconoce tu identidad automáticamente.

---

## Paso 3 — Verificar que el alta está completa

Una vez completado el formulario, Stripe te redirige de vuelta a la app. Puedes verificar el estado:

```
GET /company/{tu-company-id}/stripe/status
Authorization: Bearer <tu-token>
```

Respuesta cuando está todo correcto:

```json
{
  "stripeAccountId": "acct_1ABC...",
  "stripeOnboardingComplete": true
}
```

Si `stripeOnboardingComplete` es `false`, el proceso no se ha completado. Vuelve a llamar al endpoint `/stripe/onboard` — te generará un nuevo enlace para continuar donde lo dejaste.

> Stripe también envía un email de confirmación cuando tu cuenta está verificada y lista para recibir pagos.

---

## Paso 4 — Los participantes ya pueden pagar

Una vez completado el alta, cada vez que un participante paga una inscripción a uno de tus eventos:

1. La app llama a `POST /payments/checkout` con el `registrationId` y el importe.
2. Stripe crea un intento de pago (`PaymentIntent`) asociado a **tu cuenta**.
3. El participante introduce su tarjeta (via Stripe.js en el frontend).
4. Stripe confirma el pago.
5. El dinero menos la comisión aparece en tu balance de Stripe.

### ¿Cuándo llega el dinero al banco?

Stripe transfiere el dinero a tu cuenta bancaria de forma automática. El período por defecto es:

- **Cuentas nuevas:** 7 días después de cada cobro (Stripe aplica esto como medida antifraude inicial).
- **Cuentas establecidas:** entre 2 y 7 días hábiles según el país y el plan de Stripe.

Puedes cambiar la frecuencia de transferencia (diaria, semanal, mensual) desde tu panel de Stripe en **Settings → Payouts**.

---

## Tu panel de Stripe

Una vez conectado, tienes acceso a tu propio dashboard en [dashboard.stripe.com](https://dashboard.stripe.com):

| Sección | Qué puedes ver |
|---|---|
| **Payments** | Todos los cobros individuales, estado, importe |
| **Payouts** | Transferencias a tu banco, fechas, importes |
| **Balance** | Dinero pendiente de transferir |
| **Customers** | Participantes que han pagado |
| **Reports** | Resúmenes mensuales para contabilidad |

> Guarda el acceso al dashboard de Stripe. Es tu fuente de verdad para cualquier discrepancia de pagos.

---

## Reembolsos

Los reembolsos se gestionan desde Ekinnow o directamente desde el dashboard de Stripe.

- Si el reembolso es total, Stripe devuelve el importe íntegro al participante.
- La comisión de plataforma del 5% **no se devuelve** (política estándar de Stripe Connect).
- Para reembolsos parciales, contacta con soporte de Ekinnow.

---

## Preguntas frecuentes

**¿Tengo que pagar algo a Stripe?**
Stripe cobra sus propias tarifas por transacción (aprox. 1,4% + 0,25 € para tarjetas europeas, más para tarjetas internacionales). Estas tarifas las paga Ekinnow de su parte de la comisión; tú recibes siempre el 95% del precio de la inscripción.

**¿Qué pasa si un participante reclama un fraude (chargeback)?**
Stripe gestiona el proceso de disputa. Recibirás un email de Stripe solicitando evidencia (confirmación de inscripción, comunicaciones, etc.). Tienes 7 días para responder desde el dashboard de Stripe.

**¿Puedo tener varios eventos con distintos precios?**
Sí. El importe lo define el organizador al crear el evento. Ekinnow aplica la comisión del 5% independientemente del importe.

**¿Qué pasa si no completo el alta de Stripe?**
Los pagos de tus inscripciones no se procesan automáticamente. Ekinnow puede activarlos manualmente (cobro manual por parte del admin), pero no se transfieren a tu cuenta hasta que completes el onboarding.

**¿Puedo desconectar mi cuenta de Stripe?**
Sí, desde el dashboard de Stripe en **Settings → Connected accounts** puedes revocar el acceso. Contacta también con Ekinnow para gestionar los pagos pendientes antes de desconectar.

**¿El alta de Stripe es por empresa o por evento?**
Por empresa. Una vez conectada tu empresa, todos tus eventos usan la misma cuenta bancaria. Si necesitas cuentas separadas por evento, contacta con soporte.

---

## Solución de problemas comunes

### `stripeOnboardingComplete: false` después de completar el formulario

Stripe puede tardar hasta unos minutos en verificar los datos y notificar a Ekinnow. Espera 5 minutos y vuelve a consultar `/stripe/status`. Si persiste, puede que Stripe esté pidiendo documentación adicional — revisa el email con el que te registraste en Stripe.

### El enlace de onboarding ha expirado

Los enlaces de Stripe Connect caducan a las pocas horas. Llama de nuevo a `POST /company/{id}/stripe/onboard` para generar uno nuevo.

### Los pagos se están procesando pero no llegan al banco

Comprueba en **Stripe Dashboard → Payouts** que no haya ningún pago en disputa o que tu cuenta no esté en modo restringido. Stripe puede retener transferencias si detecta actividad inusual o si falta documentación.

---

## Información para el equipo técnico de Ekinnow

### Variables de entorno necesarias

```env
STRIPE_SECRET_KEY=sk_live_...          # Clave secreta de Stripe (modo producción)
STRIPE_WEBHOOK_SECRET=whsec_...        # Secreto de firma del webhook
STRIPE_PLATFORM_FEE_PERCENT=5          # Comisión de plataforma (%)
FRONTEND_URL=https://app.ekinnow.com   # Para URLs de retorno del onboarding
```

> En desarrollo usa `sk_test_...` y `whsec_...` del modo test de Stripe.

### Endpoints involucrados

| Método | Ruta | Quién lo llama | Para qué |
|---|---|---|---|
| `POST` | `/company/:id/stripe/onboard` | COMPANY_ADMIN / SUPER_ADMIN | Genera URL de onboarding |
| `GET` | `/company/:id/stripe/status` | COMPANY_ADMIN / SUPER_ADMIN | Verifica estado del alta |
| `POST` | `/payments/checkout` | Participante autenticado | Inicia pago (crea PaymentIntent) |
| `POST` | `/payments/webhook` | Stripe (sin auth) | Recibe eventos de pago y cuenta |

### Configuración del webhook en Stripe Dashboard

1. Ve a [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Crea un endpoint apuntando a `https://api.ekinnow.com/payments/webhook`
3. Selecciona los siguientes eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated` ← **activa "Connect events"** (toggle al crear el endpoint)
4. Copia el **Signing secret** (`whsec_...`) y ponlo en `STRIPE_WEBHOOK_SECRET`

> Sin el toggle "Connect events" activado, los eventos `account.updated` de las cuentas conectadas no llegarán al webhook y el onboarding nunca se marcará como completo automáticamente.

### Migraciones pendientes

Ejecutar en orden:

```bash
npm run migration:run
```

Incluye:
- `1750354800000-AddStripePaymentIntentId` — columna `stripe_payment_intent_id` en `payments`
- `1750441200000-AddStripeConnectToCompany` — columnas `stripe_account_id` y `stripe_onboarding_complete` en `company`

### Modo test vs producción

En modo test (desarrollo):
- Usa tarjeta `4242 4242 4242 4242`, fecha futura, CVC cualquiera.
- Los pagos no son reales, el dinero no se mueve.
- El onboarding de Stripe Connect también tiene un modo test — Stripe te permite simular el alta sin datos reales.

Para activar modo producción, reemplaza `sk_test_` por `sk_live_` y asegúrate de que el webhook también apunte al entorno correcto.
