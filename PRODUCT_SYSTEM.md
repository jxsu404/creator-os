# Product System — Ideazo (v1)

**Nombre de marca:** Ideazo  
**Fecha:** 27 de julio de 2026  
**Estado:** Sistema de producto  
**Documentos hermanos:** `PRODUCT_VISION.md` · `BRAND_AND_ROADMAP.md` · `BRAND_VOICE.md` · `NAMING.md`

Este documento concreta **cómo funciona el loop** en la práctica: estados, calidad de las 3 direcciones, estructura del borrador y escenarios reales.

---

## 0. Perfil mínimo del creador (antes del loop)

Sin un poco de contexto, las 3 direcciones salen genéricas. Con demasiado onboarding, el usuario no llega al valor.

### Qué pedimos (v1)

**Una sola pregunta central:** *¿De qué va tu contenido?*

| Entrada | Detalle |
|---|---|
| **Chips** | Nichos comunes (ej. gaming, vlogs, cocina, fitness, finanzas, educación, belleza, tech, comedia, lifestyle, negocios…) |
| **Otro / texto libre** | Obligatorio permitir descripción propia (“reviews de gadgets con humor”) |
| **Multi-selección** | Permitida — muchos creadores no son un solo nicho |

### Qué no pedimos en v1

Audiencia objetivo, tamaño de cuenta, redes conectadas, frecuencia de publicación, metas de ingresos, “describe tu voz en 5 adjetivos”, etc.

### Cuándo

- **Primera apertura** — una pantalla antes del home (obligatoria, pero &lt; 30–60 s)
- **Después** — editable en “Mi contenido” / perfil mínimo

### Cómo se usa

El contexto condiciona:
- el tono y jerga de las **3 direcciones**
- hooks y ejemplos del **borrador**
- qué se siente “propio” del nicho (sin estereotipar de forma torpe)

### Criterio de calidad

Si dos creadores —uno de cocina, uno de gaming— capturan la misma idea vaga (“errores comunes”), las direcciones deben sentirse **claramente distintas** gracias al perfil.

---

## 1. Objeto central: la Idea

Todo en v1 gira alrededor de una **Idea** (después del perfil mínimo).  
No hay proyectos, boards ni segundo cerebro. Solo ideas que avanzan (o no) hacia “lista para grabar”.

### Estados (vocabulario congelado)

| Estado | Significa | El creador puede… |
|---|---|---|
| **Capturada** | Hay una chispa guardada; aún no se eligió dirección | Verla, editar el texto crudo, iniciar “3 direcciones” |
| **En curso** | Ya hay dirección elegida y/o borrador en marcha | Seguir editando, regenerar borrador / ajustes con IA |
| **Lista para grabar** | El creador declara: “ya puedo grabar con esto” | Abrir guion; marcar **Ya lo grabé** o **Descartar** |
| **Grabada** | Ya se grabó; sale de “Listas para grabar” | Ver guion; volver a lista; archivar |
| **Archivada** | No se hará (o ya no importa) | Restaurar a Capturada si vuelve el interés |

**Reglas de transición**

- `Capturada` → `En curso`: al **elegir una de las 3 direcciones** (no antes).
- `En curso` → `Lista para grabar`: solo por acción explícita del creador (“Marcar lista para grabar”). La IA no lo decide.
- `Lista para grabar` → `En curso`: si reabre y edita de forma sustancial (o “Seguir editando”).
- Cualquier estado activo → `Archivada`: acción explícita.
- `Lista para grabar` → `Grabada`: “Ya lo grabé”.
- `Lista para grabar` → `Archivada`: “Descartar”.
- `Grabada` → `Lista para grabar` o `Archivada`.
- No hay estado “Publicada” en v1.

**Anti-complejidad:** no añadimos “Investigando”, “Esperando IA”, “Borrador v2”, etc. como estados visibles. Si la IA tarda, es un momento de carga dentro del flujo — no un estado de la idea.

---

## 2. Las 3 direcciones — qué las hace buenas

Las 3 direcciones son el **motor de decisión** del producto. Si son genéricas o casi iguales, fallamos.

### Cada dirección debe incluir (mínimo)

1. **Nombre corto** del enfoque (3–6 palabras)
2. **Promesa al viewer** — qué se lleva quien mira
3. **Ángulo** — desde dónde se cuenta (story, mito vs realidad, tutorial rápido, opinión, behind the scenes, etc.)
4. **Hook sugerido** (1 línea)
5. **Por qué este enfoque** (1 frase: cuándo encaja)

### Criterios de calidad (las 3 juntas)

Las tres deben ser **realmente distintas** en al menos dos de estos ejes:

| Eje | Ejemplo de variedad |
|---|---|
| Ángulo | Personal / práctico / controvertido |
| Promesa | Emoción vs utilidad vs curiosidad |
| Tono | Directo / narrativo / humorístico |
| Estructura implícita | Lista rápida vs una sola historia vs “antes/después” |

**Regla de oro:** si el creador podría elegir las tres indistintamente, las direcciones son malas. Debe haber una preferencia clara según su intención.

### Qué no es una dirección

- Tres títulos distintos con el mismo video por dentro
- Tres “estilos de redacción” del mismo guion
- Tres longitudes (30s / 45s / 60s) sin cambio de ángulo
- Preguntas al usuario disfrazadas de opciones

### Personalización post-elección

Tras elegir, el creador puede ajustar en **una frase corta**, por ejemplo:
- “Más directo, menos storytelling”
- “Enfocado en principiantes”
- “Sin sonar a guru”

Esa frase condiciona el borrador. No abrimos un cuestionario.

---

## 3. Estructura del entregable “listo para grabar”

Siempre una **guía para grabar** (sin elegir formato, **sin tomas**):

1. **Hook** — primeros segundos
2. **Guion** — palabra por palabra
3. **Cierre** — CTA verbal

Todo editable en el **guion unificado** del creador. La vista previa de la IA es de solo lectura; los cambios estructurales van por **ajustes con IA**. No generamos plan de cámara ni beats.

“Listo para grabar” es una **declaración del creador**, no un sello de la IA.

---

## 4. Home mínimo (continuidad, no dashboard)

Al abrir Ideazo, el creador ve como máximo:

1. **Acción primaria:** Capturar idea  
2. **Continuar:** ideas `En curso` (la más reciente primero)  
3. **Listas para grabar:** ideas en ese estado  
4. **Capturadas:** el resto, sin drama visual  

Sin frases motivacionales, sin rankings, sin stats.

---

## 5. Escenarios — día en la vida

### Escenario 0 — Primera entrada (contexto)

**Quién:** Maya, nueva en Ideazo.  
**Flujo**
1. Abre la app por primera vez.
2. Ve una pantalla: *“¿De qué va tu contenido?”*
3. Elige **Fitness** (+ opcional texto: “técnica de gym, sin postureo”).
4. Entra al home y puede capturar.

**Éxito:** &lt; 1 minuto; ya hay contexto para la IA.  
**Fracaso a evitar:** 8 pantallas de onboarding antes de guardar la primera idea.

---

### Escenario A — La chispa en movimiento (solo captura)

**Quién:** Maya, creadora de Reels de fitness, publica ~4 veces/semana.  
**Contexto:** Sale del gym. Se le ocurre: “la gente falla el press no por fuerza, sino por escápulas”.

**Flujo**
1. Abre Ideazo en el móvil.
2. Toca Capturar → escribe 2 frases torpes (texto; más adelante sería voz).
3. Guarda. Estado: **Capturada**.
4. Sigue con su día. No “trabaja” la idea ahora.

**Éxito:** la idea no se pierde; cero fricción; no le pedimos estructura.

**Fracaso a evitar:** obligarla a elegir categoría, título SEO o “completar ficha”.

---

### Escenario B — De niebla a listo para grabar (loop completo)

**Quién:** Maya, misma noche, 25 minutos libres.  
**Contexto:** Quiere grabar mañana temprano. Abre la idea del press.

**Flujo**
1. Abre la idea **Capturada**.
2. Pide 3 direcciones. Recibe, por ejemplo:
   - *Error invisible* — “No es falta de fuerza” (educativo + mito)
   - *Historia de cliente* — transformación en 1 detalle técnico (story)
   - *Reto 10 segundos* — prueba esto ahora en cámara (participativo)
3. Elige *Error invisible*. Ajusta: “Más calle, menos técnico”.
4. Recibe guía (hook + guion + cierre). Edita 2 frases del hook para que suene a ella.
5. Marca **Lista para grabar**.

**Éxito:** mañana graba sin pensar la estructura desde cero. Tiempo total de claridad: minutos, no una hora.

**Fracaso a evitar:** 12 preguntas; 3 direcciones casi iguales; un guion genérico de “guru fitness”.

---

### Escenario C — Retomar sin empezar de cero

**Quién:** Leo, creador de finanzas personales en TikTok.  
**Contexto:** Ayer dejó una idea **En curso** a medias (dirección elegida, borrador a medias). Hoy tiene 10 minutos.

**Flujo**
1. Abre la app → ve **Continuar** con esa idea arriba.
2. Abre el borrador, recorta el cierre, mejora el hook.
3. Marca **Lista para grabar**.

**Éxito:** el home empuja continuidad, no exploración de features.

**Fracaso a evitar:** perdida entre carpetas, chats o un feed de tips.

---

## 6. Definición de “hecho” para el loop v1

El loop está listo cuando un creador real puede, sin explicación larga:

0. Decir de qué va su contenido en &lt; 1 minuto (y editarlo después)  
1. Capturar una idea en &lt; 1 minuto  
2. Obtener 3 direcciones **claramente distintas** y **acordes a su nicho**  
3. Elegir, ajustar en una frase, generar borrador (guion/guía/ambos)  
4. Editar y marcar lista para grabar  
5. Entender en todo momento en qué estado está la idea  

Si eso no es obvio, no añadimos features: **arreglamos el loop**.

---

## 7. Glosario v1

| Término | Significado |
|---|---|
| **Contexto / perfil mínimo** | De qué va el contenido del creador; alimenta a la IA |
| **Idea** | Unidad central del producto |
| **Dirección** | Uno de tres enfoques creativos distintos para la misma idea |
| **Borrador** | Guion y/o guía editable generado tras elegir dirección |
| **Lista para grabar** | Estado declarado por el creador: ya puede ejecutar |
| **Compañero** | Rol del producto: propone y alivia; no sustituye criterio |
| **Trabajo pesado** | Investigar, estructurar, escribir, proponer hook |

---

*Actualizar solo con decisiones conscientes. Si algo aquí choca con `PRODUCT_VISION.md`, gana la visión y se alinea este sistema.*
