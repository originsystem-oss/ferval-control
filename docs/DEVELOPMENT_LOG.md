# FERVAL CONTROL — Registro de desarrollo

## Hito 2026-09-29 — N1 Dirección conversacional validada

**Estado:** VALIDADO EN PRUEBA REAL  
**UI:** CORE 1.5 Guardia Dirección  
**Backend Yayo:** v23 ACTIVE  
**Punto UI de rescate:** `stable/core-1.5-guardia`

### Comportamiento validado
Dirección N1 puede comunicar información en lenguaje natural. Yayo:
- identifica obra y contexto;
- estructura realizado / previsto / pendiente / incidencia;
- detecta información faltante;
- pregunta sólo lo imprescindible;
- diferencia dato comunicado de dato validado;
- señala contradicciones;
- no inventa estados;
- mantiene continuidad de Dirección.

Principio operativo validado: **“Tú habla natural; yo pongo el orden.”**

### Prueba real
**Obra 002 — Reforma Elche Martín**
- Realizado: yeso terminado.
- Previsto: Carlos, Erik y Ramón.
- Trabajo: sanear y regularizar hormigón en mal estado.
- Fase posterior: aplicación de autonivelante.
- Pendiente de confirmar: horarios y resultado de jornada.

### Arquitectura congelada
- CORE 1.2: recuperación estable.
- CORE 1.3: Equipo y permisos.
- CORE 1.4: Historial.
- CORE 1.5: Guardia Dirección.
- Backend v23: comportamiento N1 validado; conservar como baseline antes de cambios posteriores.

### Siguiente hito
Conectar conversación N1 con **Control Diario estructurado**, de modo que la información organizada por Yayo persista fuera del chat y alimente las fichas de Obras.


## Hito 2026-09-29 — CORE 1.6 Control Diario operativo

**Estado:** VALIDADO EN PRODUCCIÓN  
**UI:** CORE 1.6 Control Diario N1  
**Punto de rescate:** `stable/core-1.6-control-diario`

### Circuito validado
Conversación N1 → Yayo estructura información → Dirección valida contenido → registro persistente en `fer_control_diario` → panel Control Diario.

### Primer registro real
**ID 1 · Obra 002 — Reforma Elche Martín · 29/09/2026 · estado abierto**
- Yeso terminado.
- Superficie informada aprox. 80 m².
- Problema informado: nivelación/amaestrado y diferencias de cota/espesor; no deterioro confirmado.
- Referencia comunicada: 9 m³ de hormigón solicitados y material sobrante.
- Previsto 30/09: Carlos, Erik y Ramón, 08:00–16:00.
- Trabajo: preparación/limpieza del hormigón y definición de cotas.
- Cuba para jueves: previsión condicionada, no confirmada.
- Siguiente acción: revisar preparación/cotas y decidir si procede contratar cuba.

### Regla aprendida
`PARTE:` no sustituye a Control Diario. Los partes/check-ins y el Control Diario son circuitos distintos. Control Diario pertenece a N1 + Yayo y debe persistir en su tabla específica.
