# UX Brief — Creator OS (v1)

**Nombre provisional:** Creator OS  
**Fecha:** 26 de julio de 2026  
**Estado:** Brief de experiencia (pre-código, sin stack técnico)  
**Documentos hermanos:** `PRODUCT_VISION.md` · `PRODUCT_SYSTEM.md` · `BRAND_VOICE.md` · `BRAND_AND_ROADMAP.md`

---

## 1. Objetivo de este brief

Definir las **pantallas mínimas** para que el loop sea obvio:

> Contexto → Home → Capturar → 3 enfoques → Borrador → Lista para grabar

Si una pantalla no empuja ese camino, no existe en v1.

**Principio de layout:** un camino dominante, no un dashboard. Continuidad creativa, no teatro.

---

## 2. Mapa de pantallas (inventario v1)

| # | Pantalla | Obligatoria | Entrada desde |
|---|---|---|---|
| 0 | Onboarding — contexto | Sí (solo 1ª vez) | Primera apertura |
| 1 | Home | Sí | Tras onboarding / siempre |
| 2 | Capturar idea | Sí | Home (CTA primario) |
| 3 | Detalle de idea | Sí | Home (cualquier idea) |
| 4 | Tres enfoques | Sí | Detalle (idea Capturada o regenerar) |
| 5 | Ajuste corto (puede ser sheet/modal) | Sí | Tras elegir enfoque |
| 6 | Elegir formato de salida | Sí | Tras ajuste (o junto al ajuste) |
| 7 | Borrador (guion / guía / ambos) | Sí | Tras generar |
| 8 | Mi contenido (perfil mínimo) | Sí | Home / settings ligeros |
| — | Archivar confirmación | Ligero | Detalle de idea |

**Fuera de v1 (no diseñar ahora):** analytics, calendario, chat libre, feed motivacional, conexiones a redes, editor de video.

---

## 3. Flujo feliz (wire narrativo)

```text
[Primera vez]  Onboarding (¿De qué va tu contenido?)
       ↓
     Home  ←——————————————————————————————┐
       ↓                                  │
  Capturar idea → Idea (Capturada)        │
       ↓                                  │
  Tres enfoques → Elegir uno              │
       ↓                                  │
  Ajuste (opcional) + Formato             │
       ↓                                  │
  Borrador editable                       │
       ↓                                  │
  Marcar «Lista para grabar» → Home ------┘
```

Retomar: Home → Continuar (En curso) → Borrador → Listo.

---

## 4. Pantalla por pantalla

### 0 — Onboarding: contexto

**Trabajo:** dar a la IA el nicho del creador en &lt; 1 minuto.

**Elementos**
- Título + sub (ver `BRAND_VOICE.md`)
- Chips de nicho (multi-select)
- Campo “Otro” / texto libre
- CTA único: **Continuar**

**Reglas**
- No se avanza sin al menos 1 chip **o** texto libre
- Una sola pantalla; cero pasos siguientes de “cuéntanos más”
- Tras Continuar → Home

**Éxito:** el usuario entiende *para qué* sirve (mejores enfoques), no “completar perfil”.

---

### 1 — Home

**Trabajo:** continuidad — capturar o retomar. No motivar.

**Elementos (orden de prioridad visual)**
1. **Capturar idea** (acción primaria, siempre visible)
2. Bloque **Continuar** — ideas `En curso` (más reciente primero)
3. Bloque **Listas para grabar**
4. Bloque **Capturadas**
5. Acceso discreto a **Mi contenido**

**Estados vacíos**
- Sin ideas: mensaje de vacío + CTA Capturar (copy en `BRAND_VOICE.md`)
- Sin “En curso”: ocultar sección o no inventar placeholders falsos

**Reglas**
- Sin frases motivacionales, rachas, rankings ni stats
- Cada fila de idea muestra: texto corto / título derivado + **estado**
- Tap en idea → Detalle (o directo a Borrador si `En curso` / `Lista para grabar`)

**Atajo útil:** tap en idea `En curso` o `Lista para grabar` puede abrir el **Borrador** directamente (menos fricción).

---

### 2 — Capturar idea

**Trabajo:** guardar la chispa sin fricción.

**Elementos**
- Campo de texto grande (placeholder: idea imperfecta bienvenida)
- CTA: **Guardar idea** / **Capturar**
- Cancelar / atrás

**Reglas**
- Sin categorías, tags, ni “título obligatorio”
- Al guardar → estado **Capturada** → Detalle de idea (o Home con feedback “Idea capturada”)
- **Voz:** no en uso v1, pero el layout reserva el mismo acto “capturar” (un control futuro de micrófono junto al campo, no otra pantalla)

---

### 3 — Detalle de idea

**Trabajo:** punto de decisión según estado.

**Elementos comunes**
- Texto de la idea (editable)
- Chip de estado
- Acciones secundarias: Archivar · (más adelante: duplicar — no v1)

**Según estado**

| Estado | CTA primario |
|---|---|
| **Capturada** | **Ver tres enfoques** |
| **En curso** | **Seguir con el borrador** |
| **Lista para grabar** | **Abrir guía / guion** (+ secundario: Seguir editando) |
| **Archivada** | **Restaurar** |

**Reglas**
- Si aún no hay enfoques, no mostrar borrador vacío fingido
- Una CTA primaria dominante; el resto secundario

---

### 4 — Tres enfoques

**Trabajo:** decidir el ángulo. Corazón del producto.

**Elementos**
- Título / sub de pantalla
- **3 tarjetas de enfoque**, cada una con:
  - Nombre corto
  - Promesa al viewer
  - Ángulo
  - Hook (1 línea)
  - Por qué este enfoque (1 frase)
- Por tarjeta: CTA **Usar este enfoque**
- Secundario: **Probar otros enfoques** (regenerar las 3)

**Reglas**
- Las 3 visibles a la vez (scroll ok en móvil); no un carrusel que esconda diferencias
- No numerar como “la mejor”; son opciones iguales en jerarquía
- Loading: mensaje sobrio (*“Armando enfoques…”*), no confeti
- Error: copy de reintento (ver `BRAND_VOICE.md`)

**Criterio UX de calidad:** el usuario debe poder descartar 2 en segundos porque se sienten distintas.

---

### 5–6 — Elegir formato / ajuste previo
**Eliminado.** Al elegir enfoque se genera la guía. Los ajustes viven en la vista previa del borrador.

### 7 — Guía para grabar (vista previa)

**Trabajo:** revisar + ajustes con IA.

**Elementos**
- Vista previa solo lectura (hook, guion, cierre, tomas sugeridas)
- Panel **Ajustes con IA**
- CTA: **Continuar** → pantalla de guion editable

### 7b — Tu guion

**Trabajo:** decidir si editar a mano y marcar listo.

**Elementos**
- Pregunta: *¿Quieres hacer algún cambio?*
- Si sí → un cuadro de guion unificado editable
- Si no / al terminar → **Marcar lista para grabar**

---

### 8 — Mi contenido (perfil mínimo)

**Trabajo:** ver/editar el contexto del onboarding.

**Elementos**
- Mismos chips + texto libre que el onboarding
- Guardar
- Copy: se puede cambiar cuando quieras

**Reglas**
- No añadir aquí settings de notificaciones, billing, temas, etc. en v1 (si hace falta un “más”, mínimo)
- Cambiar nicho afecta **futuras** generaciones; no reescribe borradores viejos en silencio (opcional: avisar)

---

## 5. Navegación (v1)

- **Sin tab bar de 5 ítems.** El producto no es un hub.
- Home es el centro. Capturar es la acción.
- Atrás siempre predecible: Borrador → Detalle/Home; Enfoques → Detalle; Capturar → Home.
- Profundidad máxima razonable: Home → Idea → Enfoques → Borrador (3–4 pasos).

---

## 6. Prioridad móvil

El journey crítico (chispa + retomar) ocurre en **móvil**.  
Diseñar primero para una mano / una sesión corta. Desktop puede existir después como mismo flujo, no como “workspace”.

---

## 7. Estados de sistema (UI, no estados de Idea)

| Momento | Comportamiento |
|---|---|
| Generando enfoques | Bloquear doble tap; texto de espera claro |
| Generando borrador | Igual |
| Sin red / error | Mensaje + reintentar; no perder el texto de la idea ni el enfoque elegido |
| Primera visita post-onboarding | Home vacío con CTA Capturar |

---

## 8. Checklist de aceptación UX

El brief se cumple si:

- [ ] Un usuario nuevo completa contexto en una pantalla y llega al Home
- [ ] Puede capturar una idea en &lt; 3 taps desde Home
- [ ] Ve 3 enfoques distintos y elige uno sin tutorial
- [ ] Obtiene borrador en el formato que eligió y lo edita
- [ ] Marca “Lista para grabar” y lo ve reflejado en Home
- [ ] No encuentra dashboard motivacional, analytics ni chat como camino principal
- [ ] “Mi contenido” permite cambiar el nicho

---

## 9. Qué diseñar después (no ahora)

- Wireframes de alta fidelidad / visual brand
- Microinteracciones y motion
- Captura por voz (mismo patrón de Capturar)
- Empty states ilustrados
- Onboarding de valor (tour, demos) — distinto del contexto de nicho

---

*Este brief manda sobre gustos de UI ornamentales. Si hay conflicto con simplicidad del loop, gana el loop.*
