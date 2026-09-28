# I9A · YAYO PLATFORM — ARCHITECTURE DECISIONS

Registro de decisiones técnicas que afectan al diseño estructural del producto.

---

## ADR-001 — FERVAL como laboratorio, no como producto final
**Estado:** aceptada.

FERVAL CONTROL valida capacidades reales en producción.  
El producto comercial futuro debe desacoplar identidad, datos, memoria, reglas y rutinas de FERVAL.

---

## ADR-002 — Separar memoria, reglas y acciones
**Estado:** aceptada.

No todo lo que Yayo “aprende” tiene el mismo efecto.

Se distinguen:
1. Memoria / conocimiento.
2. Regla de comportamiento.
3. Rutina programada.
4. Acción ejecutable permitida.

Esto evita convertir texto libre en código ejecutable.

---

## ADR-003 — Aprendizaje gobernado
**Estado:** aceptada.

El botón Aprende sólo puede generar capacidades previamente autorizadas por la plataforma.

No se permite:
- ejecución arbitraria de código;
- modificación libre del backend;
- escalada de privilegios;
- exposición de secretos;
- acceso transversal entre organizaciones o usuarios.

---

## ADR-004 — Reglas de Dirección invisibles a niveles inferiores
**Estado:** aceptada.

N2/N3 pueden verse afectados por reglas internas de Dirección, pero no tienen acceso a su contenido.

Las reglas se evalúan en servidor.

---

## ADR-005 — Acciones disciplinarias con aprobación humana
**Estado:** aceptada.

El sistema puede:
- detectar incumplimiento;
- registrar evidencia;
- escalar;
- preparar propuesta de amonestación.

La sanción laboral efectiva requiere validación N1.

---

## ADR-006 — Multi-tenant como destino arquitectónico
**Estado:** planificada.

El futuro YAYO PLATFORM deberá tener un organization_id/tenant_id en toda entidad empresarial relevante.

Cada empresa tendrá:
- usuarios;
- memoria;
- reglas;
- rutinas;
- documentos;
- integraciones;
- módulos;
- auditoría;
- identidad visual.

---

## ADR-007 — Auditoría como requisito de producto
**Estado:** aceptada.

Toda acción relevante de Yayo deberá poder responder:
- quién la originó;
- qué regla o rutina la provocó;
- qué dato utilizó;
- qué acción ejecutó;
- cuándo ocurrió;
- qué resultado produjo;
- si hubo aprobación humana.

Esta trazabilidad será necesaria para operación, seguridad, soporte, comercialización y futura protección de IP.
