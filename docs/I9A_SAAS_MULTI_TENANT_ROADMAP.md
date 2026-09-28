# I9A · ROADMAP DE PRODUCTO MULTIEMPRESA

## Fase 0 — FERVAL como laboratorio
Objetivo: conseguir que YAYO funcione de forma fiable en una empresa real.

## Fase 1 — Desacoplar FERVAL
Crear entidad ORGANIZATION/TENANT.
Todo dato operativo deberá pertenecer a una organización.

Entidades objetivo:
- organizations
- organization_users
- organization_roles
- organization_settings
- organization_memory
- organization_rules
- organization_routines
- organization_integrations
- organization_audit

## Fase 2 — Personalización
Cada empresa podrá configurar:
- marca;
- colores;
- denominación del asistente;
- jerarquías;
- módulos;
- plantillas;
- horarios;
- reglas;
- políticas;
- automatizaciones.

## Fase 3 — Administración SaaS
Panel I9A para:
- alta/baja de empresas;
- planes;
- límites;
- módulos;
- facturación;
- soporte;
- monitorización;
- incidencias;
- backups;
- versiones.

## Fase 4 — Onboarding
Asistente para crear una empresa nueva:
1. identidad;
2. estructura;
3. usuarios;
4. reglas;
5. rutinas;
6. módulos;
7. datos iniciales;
8. pruebas;
9. puesta en producción.

## Fase 5 — Comercialización
Definir:
- SaaS mensual;
- licencia privada;
- implantación;
- personalización;
- soporte;
- módulos premium;
- integraciones.

## Principio de producto
Nunca clonar una base de datos FERVAL para un cliente.
Crear siempre una organización nueva y vacía con configuración propia.

## Criterio de salida
YAYO PLATFORM estará lista para primera empresa externa cuando:
- FERVAL funcione de forma estable;
- exista aislamiento multi-tenant probado;
- onboarding no requiera tocar código;
- roles y reglas sean configurables;
- backups y auditoría estén resueltos;
- documentación legal y contractual esté preparada;
- exista una estrategia IP definida.
