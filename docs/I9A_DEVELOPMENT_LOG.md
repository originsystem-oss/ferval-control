# I9A · YAYO / FERVAL CONTROL — DEVELOPMENT LOG

Registro cronológico de evolución técnica y funcional del producto.

## Norma de documentación
Cada cambio estructural deberá registrar:
- fecha;
- versión;
- problema detectado;
- solución aplicada;
- componentes afectados;
- efecto funcional;
- seguridad/privacidad;
- prueba realizada;
- commit o migración asociada;
- limitaciones o trabajo pendiente.

---

## 2026-09-28 — Base de historial de conversaciones
**Objetivo:** separar conversación actual, nueva conversación e historial persistente por usuario.

**Solución:**
- Metadatos de sesión.
- Título, fecha de actualización y archivo.
- Apertura de conversaciones antiguas.
- Creación de conversación nueva sin borrar memoria validada.

**Resultado:** historial por usuario con aislamiento RLS.

---

## 2026-09-28 — Aprendizaje validado por Dirección
**Objetivo:** permitir que N1 enseñe a Yayo sin depender de texto efímero del chat.

**Solución:**
- Botón Aprende.
- Tipos de aprendizaje: instrucción, conocimiento y código/regla literal.
- Memoria validada de Dirección.
- Separación entre memoria N1 y reglas globales.

**Seguridad:** N2/N3 no acceden a memoria privada de Dirección.

---

## 2026-09-28 — Reglas ocultas de Dirección
**Objetivo:** aplicar barreras y acciones a N2/N3 sin revelar las reglas internas.

**Solución:**
- Tabla yayo_policy_rules.
- Acciones seguras: bloquear, escalar, bloquear+escalar, respuesta forzada y registro de seguridad.
- Evaluación en servidor antes de respuesta del modelo.

**Seguridad:** no se permite ejecutar código arbitrario pegado por el usuario.

---

## 2026-09-28 — Rutinas programadas de Dirección
**Objetivo:** enseñar a Yayo procesos empresariales repetitivos.

**Solución:**
- Tabla yayo_direction_routines.
- Ejecuciones yayo_routine_runs.
- Notificaciones.
- Evidencias.
- Eventos de cumplimiento.
- Programador pg_cron cada 5 minutos.
- Tipos de evidencia: parte, check-in, foto o sin evidencia.
- Acciones ante incumplimiento: registrar, escalar o proponer amonestación.

**Control humano:** las sanciones disciplinarias efectivas requieren revisión N1.

**Prueba:** rutina simulada con usuario N3 generó 1 incumplimiento y 1 escalado al vencer sin parte; prueba revertida en transacción.

---

## 2026-09-28 — Visión de producto I9A
**Objetivo:** separar FERVAL CONTROL como laboratorio del producto comercial futuro.

**Documentos creados:**
- I9A_YAYO_PLATFORM_VISION.md
- I9A_IP_AND_INVENTION_LOG.md
- I9A_SAAS_MULTI_TENANT_ROADMAP.md

**Principio:** FERVAL será cliente/laboratorio de referencia; el producto futuro será multiempresa y configurable.
