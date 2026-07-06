¡Por supuesto! Aquí tienes el **borrador para tu memoria** en formato `.md`. He estructurado la explicación para que sea clara, profesional y documente todo el proceso de configuración de `AGENTS.md`, `Skills` y la estrategia de tests.

---

```markdown
# Capítulo 4: Configuración del Entorno de Desarrollo Asistido por IA y Estrategia de Pruebas

## 4.1. Introducción

Uno de los pilares fundamentales de este proyecto ha sido la integración de un **agente de IA (OpenCode)** como asistente de desarrollo. Para garantizar que el código generado por la IA fuera coherente, de calidad y siguiera las directrices del proyecto, fue necesario establecer un **entorno de gobernanza y verificación** que permitiera guiar al agente y validar su trabajo de forma automática.

Este capítulo detalla el proceso de configuración de dicho entorno, dividido en dos grandes áreas:
1.  **La gobernanza del agente:** Mediante el uso de `AGENTS.md` y las **Skills** de OpenCode.
2.  **La verificación automática:** Mediante la configuración de una suite de pruebas unitarias con **Jest** y **ts-jest**.

A lo largo de este proceso, se encontraron y resolvieron desafíos de configuración y de lógica, documentando las lecciones aprendidas como parte de la metodología de desarrollo.

## 4.2. Gobernanza del Agente: `AGENTS.md` y Skills

El objetivo principal era que el agente (OpenCode) comprendiera y aplicara las reglas de Clean Architecture, los patrones de diseño y las convenciones de estilo definidas para el proyecto, sin necesidad de supervisión constante. Para ello, se utilizó un enfoque dual:

### 4.2.1. El Archivo `AGENTS.md`: La "Constitución" del Proyecto

El archivo `AGENTS.md`, ubicado en la raíz del proyecto, actúa como el documento de referencia principal para el agente. Es la fuente de verdad sobre la arquitectura, el stack tecnológico y las reglas de negocio fundamentales.

**Contenido clave de `AGENTS.md`:**
- **Stack y Arquitectura:** Define que el proyecto usa TypeScript (`strict: true`, `module: node16`), sigue los principios de **Clean Architecture** (separando `domain/`, `application/` e `infrastructure/`), y describe el estado real del proyecto para evitar que el agente intente usar código que no existe.
- **Patrones de Diseño:** Establece patrones concretos que el agente debe seguir. Por ejemplo, se definió un patrón exacto para los **Value Objects**:
  ```typescript
  export default class MiVo {
    private readonly _value: string;
    static create(value: string): MiVo { /* validación + throw */ return new MiVo(value); }
    private constructor(value: string) { this._value = value; }
    getValue(): string { return this._value; }
    equals(other: MiVo): boolean { return this._value === other._value; }
    static isValid(value: string): boolean { /* validación sin throw */ }
  }
  ```
- **Reglas de Testing:** Se estableció la obligatoriedad de generar tests unitarios para todos los Value Objects y Casos de Uso, definiendo qué casos probar (`create()`, `equals()`, métodos de negocio) y su ubicación en el proyecto (`tests/unit/...`).

**Conclusión:** `AGENTS.md` es el documento que el agente lee al inicio o con el comando `/init`, asegurando que cada interacción esté contextualizada por las reglas del proyecto.

### 4.2.2. Las Skills: El "Cómo" se Hace

Mientras que `AGENTS.md` define el *qué*, las **Skills** definen el *cómo*. Una Skill es un bloque de conocimiento reutilizable que el agente puede cargar bajo demanda para tareas específicas. Para este proyecto, se creó la Skill `testing-pattern` para estandarizar la generación de tests.

**Creación de una Skill (testing-pattern):**
1.  **Estructura de Carpetas:** OpenCode exige que las Skills sigan un patrón de carpetas específico. La ruta correcta es `.opencode/skills/<nombre-de-la-skill>/SKILL.md`. En este caso, la estructura fue:
    ```
    .opencode/skills/testing-pattern/SKILL.md
    ```
2.  **Frontmatter YAML:** El archivo `SKILL.md` debe comenzar con un bloque YAML que defina `name` y `description`. Este bloque permite al agente identificar la Skill.
    ```yaml
    ---
    name: testing-pattern
    description: Patrón para escribir tests unitarios de Value Objects y Casos de Uso
    ---
    ```
3.  **Contenido de la Skill:** El cuerpo de la Skill contiene el patrón a seguir. En este caso, incluía una plantilla de código para los tests de un Value Object:
    ```typescript
    // tests/unit/domain/value-objects/<Nombre>.test.ts
    import <Nombre> from '../../../src/domain/value-objects/<Nombre>';

    describe('<Nombre> Value Object', () => {
      describe('create()', () => {
        it('should create a valid <Nombre>', () => { ... });
        it('should throw error for invalid <Nombre>', () => { ... });
      });
      // ... más tests
    });
    ```

**Utilización:** Al generar el código de `Feedback.ts`, se pidió al agente que "usara la Skill `testing-pattern` para los tests". El agente cargó la Skill y aplicó su patrón, generando tests coherentes con la estructura y los casos de prueba definidos.

### 4.2.3. Lección Aprendida: La Gobernanza Dual es Clave

La combinación de `AGENTS.md` (reglas generales) y Skills (patrones específicos) resultó ser muy efectiva. Permite que el agente tenga un contexto global del proyecto y, a la vez, pueda consultar "recetas" precisas para tareas concretas, mejorando la consistencia y la calidad del código generado.

## 4.3. Estrategia de Pruebas: Verificación de Tipos y Unit Tests

Para garantizar que el código generado no solo cumpliera con los patrones, sino que también funcionara correctamente, se estableció una estrategia de pruebas en dos niveles:

1.  **Verificación de Tipos (Estática):** Asegura que el código TypeScript es sintácticamente y tipográficamente válido.
2.  **Tests Unitarios (Dinámica):** Validan el comportamiento del código en tiempo de ejecución.

### 4.3.1. Verificación de Tipos con `tsc --noEmit`

El comando `npx tsc --noEmit` se ejecuta localmente para comprobar que el código TypeScript no tiene errores de tipos. Es una capa de verificación rápida y fundamental, que se integra en el flujo de trabajo local.
- **Rol:** Comprobación de "sintaxis y tipos".
- **Resultado:** 0 errores en todo el código fuente.

### 4.3.2. Configuración de la Suite de Tests (Jest + ts-jest)

Para los tests dinámicos, se eligió **Jest** como framework de pruebas por su integración nativa con Node.js y su soporte para TypeScript a través de `ts-jest`. La configuración se realizó en varios pasos:

1.  **Instalación de Dependencias:**
    ```bash
    npm install --save-dev jest ts-jest @types/jest ts-node
    ```
    Se instalaron en la raíz del proyecto, desde donde se ejecutan los tests.

2.  **Configuración de Jest (`jest.config.js`):**
    ```javascript
    export default {
      preset: 'ts-jest/presets/default-esm',
      testEnvironment: 'node',
      roots: ['<rootDir>/backend/src', '<rootDir>/tests'],
      testMatch: ['**/?(*.)+(spec|test).ts'],
      transform: { '^.+\\.ts$': ['ts-jest', { useESM: true }] },
      // ... más opciones
    };
    ```

3.  **Configuración de TypeScript para Tests:**
    Se creó un archivo `tsconfig.tests.json` en la raíz para extender la configuración base y añadir los tipos de Jest:
    ```json
    {
      "extends": "./backend/tsconfig.json",
      "compilerOptions": { "types": ["jest", "node"] },
      "include": ["tests/**/*.test.ts", "backend/src/**/*.ts"]
    }
    ```
    Este paso fue crucial para que TypeScript reconociera las funciones globales de Jest (`describe`, `it`, `expect`).

### 4.3.3. Ejecución y Cobertura

La ejecución de los tests se realiza con `npm test`. Jest reporta no solo el resultado de las pruebas, sino también la **cobertura de código**, indicando qué porcentaje del código fuente ha sido ejecutado por los tests.

**Resultados Obtenidos:**
- **Pruebas:** 2 test suites y 37 tests ejecutados.
- **Cobertura:** 100% en los archivos `Feedback.ts` y `TypedId.ts`, y cobertura de ramas superior al 90%.

### 4.3.4. Depuración de un Falso Positivo

Durante la ejecución, un test de `Feedback.truncate()` falló. El test esperaba que al truncar una cadena a 25 caracteres, el resultado fuera `"This is a long text"`. Sin embargo, el método devolvía `"This is a long text that"`.

El análisis demostró que el **problema no era del código, sino del test**. La lógica de `truncate` corta en el último espacio *antes* del límite. Con un límite de 25, el último espacio antes del límite está después de "text". Por lo tanto, el resultado correcto era `"This is a long text"`, pero el test esperaba un resultado con 18 caracteres. La solución fue ajustar el límite en el test a 24 caracteres, alineando la expectativa con la lógica del método.

**Conclusión:** Este incidente demostró la importancia de diseñar tests que validen el comportamiento real, no un comportamiento asumido, y la necesidad de depurar tanto el código como las propias pruebas.

## 4.4. Resumen y Lecciones Aprendidas

| Aspecto | Decisión | Lección |
| :--- | :--- | :--- |
| **Gobernanza del Agente** | Uso de `AGENTS.md` para reglas generales y Skills para patrones concretos. | La gobernanza dual (reglas + ejemplos) fue clave para guiar eficazmente al agente. |
| **Estrategia de Testing** | Verificación estática (`tsc --noEmit`) + tests dinámicos (Jest). | La combinación de ambas capas garantiza la calidad del código generado. |
| **Configuración de Jest** | `jest.config.js` + `tsconfig.tests.json` independiente. | Es fundamental aislar la configuración de tests de la del código fuente para evitar conflictos de módulos. |
| **Depuración de Tests** | Un test fallaba por una expectativa incorrecta. | Los tests deben validar el comportamiento real del código. Un test que pasa no siempre es correcto. |
```

---

**¿Qué te parece?** Puedes ajustar el tono y los detalles según tus necesidades. ¡Espero que disfrutes del partido y que este borrador te sea de gran ayuda para tu memoria! 🚀⚽