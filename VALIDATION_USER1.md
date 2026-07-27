# Validación — Usuario 1 (fundador)

**Fecha:** 26 de julio de 2026  
**Actualizado:** 27 de julio de 2026 (lanzamiento Ideazo)  
**Estrategia:** Dogfooding primero. Visibilidad y venta **solo después** de que el fundador (creador de contenido) lo use de verdad y lo encuentre útil.

**Herramienta in-app:** diferida por ahora (ya no está en Perfil).  
**Checklist operativa:** [`LAUNCH.md`](LAUNCH.md)  
**Documento hermano:** `VALIDATION.md` — entrevistas externas.

---

## 1. Por qué esta estrategia tiene sentido

- Eres el usuario primario que definimos: creador short-form que intenta publicar con regularidad y se frena en idea → grabable.
- El wedge es íntimo (proceso creativo). Si **tú** no lo usas para tus videos reales, no lo venderemos con honestidad.
- Retrasa marketing agresivo hasta tener evidencia vivida — correcto para no vender vapor.
- El build de marca/billing/PWA **sí** puede avanzar en paralelo (ver `LAUNCH.md`).

---

## 2. Empuje de cofundador (no lo ignores)

Dogfooding **no** es “me emociona mi propia idea”. Es:

> ¿Esta app cambió cómo paso de idea a video **esta semana**, frente a Notes + ChatGPT?

Riesgo: perdonas bugs y fricción porque “ya sé cómo debería funcionar”.  
Antídoto: criterios escritos **antes** de construir, y un diario corto de uso.

Cuando el producto te sirva a ti, **entonces** 2–3 creadores externos (guion en `VALIDATION.md`) antes de empujar venta en serio.

---

## 3. Protocolo Usuario 1

### Fase A — Build del loop mínimo
Construir solo lo de `PRODUCT_VISION` + `UX_BRIEF` (contexto → captura → 3 enfoques → borrador → listo para grabar).  
**Estado:** hecho (app v1.5+).

### Fase B — Uso real (sugerido: 2–4 semanas)
Reglas:
1. **Todas** las ideas de contenido short-form del periodo se capturan aquí (no en Notes), salvo emergencia.
2. Al menos **N piezas** intentan el loop completo hasta “lista para grabar”  
   *(propuesta: mínimo 8 ideas capturadas, 5 con enfoques, 3 grabadas a partir del borrador)*.
3. ChatGPT suelto solo si Ideazo no puede; anotar por qué.
4. No añadir features de visión lejana a mitad del test salvo bugs que bloqueen el loop.

### Fase C — Decisión go / no-go
Usar la checklist de la sección 5 (también en la app).  
- **Go (visibilidad / soft launch):** checklist en verde.  
- **Iterate:** dolor claro pero fricción de producto.  
- **No-go / replantear wedge:** no lo usaste o Notes+IA ganó siempre.

**Registro del fundador (rellenar):**

| Campo | Valor |
|---|---|
| Fase B iniciada | |
| Ideas capturadas (meta ≥8) | |
| Con enfoques (meta ≥5) | |
| Grabadas desde borrador (meta ≥3) | |
| Veredicto | [ ] Go · [ ] Iterate · [ ] No-go |
| Fecha veredicto | |

---

## 4. Diario de uso (plantilla semanal)

```text
Semana:
Ideas capturadas:
Loops hasta «lista para grabar»:
Videos grabados usando el borrador:
Veces que volví a Notes/ChatGPT (por qué):
Lo que más alivió:
Lo que más irritó / faltó:
¿Lo abriría mañana sin obligarme? Sí / No / A veces:
```

---

## 5. Checklist — “me gusta y la veo útil”

Marca con honestidad brutal después de la Fase B (o en `/profile/validacion`):

| # | Criterio | Sí / No |
|---|---|---|
| 1 | Capturé ideas en contexto real (fuera del escritorio) al menos varias veces | |
| 2 | Las 3 direcciones me ayudaron a **decidir** más rápido que un chat en blanco | |
| 3 | Al menos 3 videos salieron de un borrador de la app (aunque yo editara el texto) | |
| 4 | El tiempo idea → claridad grabable bajó vs mi método anterior | |
| 5 | El contexto de nicho (onboarding) se notó en los enfoques (no genéricos) | |
| 6 | Abrí la app por costumbre, no solo “para probar el proyecto” | |
| 7 | La fricción que queda es tolerable (bugs ≠ “no es el producto”) | |
| 8 | En una frase, se lo recomendaría a un creador amigo sin inventar features futuras | |

**Barra sugerida para pasar a visibilidad:** al menos **6 de 8** en Sí, incluyendo el **3** y el **6**.

---

## 6. Qué no hacer en Usuario 1

- Contar likes de una landing como validación del wedge
- Cambiar el wedge cada dos días según un capricho de una sesión
- Pedir feedback masivo en redes antes de completar la checklist
- Bloquear billing/rebrand “hasta que termine el dogfood” — van en paralelo

---

## 7. Después del go

1. Soft launch 5–10 creadores (`INVITE_ONLY` + códigos) — ver `LAUNCH.md`
2. 2–3 entrevistas externas (`VALIDATION.md`)
3. Activar Stripe en vivo + primer objetivo de Pro pagando

---

## 8. Contexto del fundador como Usuario 1

- **Nicho / de qué va tu contenido:** Roblox — *Anime Fighting Simulator*. Guías, showcases, opiniones. El universo es **videojuegos** (Roblox / ese juego).
- **Plataformas:** TikTok, Shorts; de vez en cuando YouTube largo.
- **Frecuencia objetivo:** mínimo cada 3 días.
- **Dolor #1 (sus palabras):** No poder ejecutar bien las ideas y tardar demasiado en armar un guion y tener un horizonte listo para grabar / saber qué hacer.
- **Herramientas actuales / pasado:**
  - Notion conectado a ChatGPT (antes también Claude): la IA usaba Notion como “base de datos” de contexto y videos anteriores → **complejo**; Notion no sirve bien para esto.
  - Querían algo **más personalizado e intuitivo** que ese setup.
  - Hoy: ChatGPT también para **miniaturas** (fuera del core v1).
- **Implicación de producto:**
  - El dolor valida el loop idea → 3 enfoques → guía/guion grabable.
  - Rechazo vivido a “segundo cerebro en Notion” = no construir otro Notion.
  - Memoria de videos anteriores = visión (compañero que aprende); **no** bloquear v1.
  - YouTube largo = ocasional; **v1 sigue anclado a vertical corto**.
  - Miniaturas = fuera de v1.

---

*Esta estrategia reemplaza “entrevistar antes de codear” como puerta obligatoria. No elimina validación externa: la **pospone** hasta después de dogfooding serio.*
