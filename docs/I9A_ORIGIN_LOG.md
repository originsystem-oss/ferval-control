# I9A ORIGIN LOG

Registro de origen y evolución metodológica de I9A dentro de FERVAL CONTROL.

Este documento conserva **por qué** nace cada principio, qué problema pretende resolver, qué hipótesis se formula, qué prueba real se realiza y qué se aprende. No sustituye al registro técnico `DEVELOPMENT_LOG.md`.

---

## Principio 001 — Retroceder para avanzar

**Idea de origen:** ante una evolución que rompe un sistema funcional, volver al último estado estable, identificar qué cambio introdujo la desviación y reconstruir desde allí de forma incremental.

**Aplicación real:** recuperación de FERVAL CONTROL tras los bloqueos de login/PWA. Se establecieron versiones congeladas y se avanzó mediante una función → una prueba → congelación.

**Resultado observado:** permitió recuperar el sistema y construir CORE 1.2 → 1.8 sin perder puntos de retorno.

**Aprendizaje:** el historial de estados no es sólo respaldo técnico; es información para razonar sobre la cadena causal del sistema.

---

## Principio 002 — Estado presente + caminos alternativos

**Problema:** un control empresarial tradicional registra qué ocurrió, pero no conserva de forma estructurada qué otras decisiones razonables podían haberse tomado con la información disponible en aquel momento.

**Hipótesis I9A:** para una decisión operativa, conservar:
1. información conocida en T0;
2. decisión adoptada;
3. alternativas razonables disponibles en T0;
4. resultado real posterior T1;
5. análisis retrospectivo sin introducir en T0 información conocida sólo en T1.

**Regla:** una alternativa no es un hecho ni una recomendación. Debe permanecer identificada como escenario hipotético.

---

## Caso 001 — Obra 002 · Reforma Elche — Martín

**T0 / información registrada:**
- yeso terminado;
- superficie informada aproximada 80 m²;
- problemas informados de nivelación/amaestrado y diferencias de cota/espesor;
- no está confirmado que el hormigón esté deteriorado;
- referencia comunicada de 9 m³ de hormigón solicitados y material sobrante;
- siguiente jornada: Carlos, Erik y Ramón, 08:00–16:00;
- preparar/limpiar soporte y comprobar cotas;
- posible cuba para jueves condicionada a que la preparación y ejecución queden definidas.

**Decisión/acción registrada:** preparar primero, comprobar estado/cotas y condicionar la contratación de la cuba al resultado.

**Pulse 0.1:** detectó el asunto como abierto sin intervención previa de N1.

**Pulse 0.2 / I9A:** debe generar variantes razonables basadas únicamente en T0, mostrando tradeoffs y sin seleccionar un ganador.

**T1:** pendiente de incorporar cuando Dirección comunique el resultado real.

---

## Principio 003 — Yayo recuerda, Pulse observa, I9A abre caminos, Dirección decide

Separación funcional:
- **Yayo:** conversación, contexto, estructuración y continuidad.
- **Control Diario:** estado empresarial persistente.
- **Pulse:** detección transversal de ciclos abiertos.
- **I9A:** análisis de alternativas y aprendizaje temporal.
- **N1 Dirección:** autoridad final sobre validación y decisiones sensibles.

Esta separación evita que la generación de escenarios se convierta accidentalmente en ejecución empresarial.
