# I9A · YAYO BUSINESS CONTROL PLATFORM

## 1. Objetivo
Convertir FERVAL CONTROL en banco de pruebas operativo para una plataforma empresarial reutilizable desarrollada por I9A.

El producto final no debe depender de FERVAL. Debe poder desplegarse para otra empresa con su propia identidad, usuarios, datos, reglas, permisos, rutinas y memoria, manteniendo aislamiento total entre organizaciones.

## 2. Núcleo del producto
YAYO es un asistente operativo de Dirección orientado a empresa, no un chatbot generalista.

Capacidades objetivo:
- Conversación con historial persistente.
- Memoria por usuario y memoria de Dirección.
- Niveles de acceso y aislamiento de información.
- Reglas ocultas de Dirección.
- Rutinas programadas.
- Exigencia de evidencias: partes, check-in, fotos y documentos.
- Detección de incumplimientos.
- Escalado a Dirección.
- Preparación de propuestas y acciones sujetas a aprobación.
- Trazabilidad y auditoría de decisiones.
- Integración futura con fuentes externas, normativa, precios y servicios empresariales.
- Motor de aprendizaje validado por Dirección.

## 3. Principio arquitectónico
Separar siempre:
1. Motor general YAYO.
2. Configuración de cada empresa.
3. Datos de cada empresa.
4. Usuarios y permisos.
5. Reglas y rutinas propias de cada empresa.
6. Integraciones opcionales.

FERVAL debe convertirse en un tenant/cliente de referencia, no en el producto completo.

## 4. Producto comercial
Modelo objetivo: plataforma multiempresa configurable.

Cada empresa debe poder tener:
- nombre, logotipo e identidad visual;
- estructura de roles;
- áreas/departamentos;
- reglas de acceso;
- rutinas;
- plantillas;
- memoria corporativa;
- módulos activados;
- integraciones;
- políticas internas;
- historial y auditoría.

## 5. Principio de seguridad
Una organización nunca puede ver datos de otra organización.
Las reglas internas de Dirección pueden aplicarse sin ser visibles para niveles inferiores.
Las acciones disciplinarias o de alto impacto requieren validación humana de Dirección salvo que la legislación y la política interna permitan automatización segura.

## 6. Evolución
FERVAL CONTROL = entorno real de validación.
YAYO PLATFORM = producto reutilizable.
I9A = vehículo empresarial para explotación, licenciamiento, comercialización y desarrollo de la plataforma.

## 7. Estado actual
Ya existen en FERVAL CONTROL:
- autenticación;
- roles N1/N2/N3;
- memoria diferenciada;
- historial de conversaciones;
- reglas ocultas de Dirección;
- rutinas programadas;
- motor de cumplimiento;
- escalados;
- aislamiento de datos económicos;
- voz/transcripción;
- panel N1;
- aprendizaje validado por Dirección.

Este documento debe actualizarse cuando cambie la arquitectura o aparezca una capacidad estructural nueva.
