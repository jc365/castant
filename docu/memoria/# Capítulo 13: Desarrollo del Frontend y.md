# Capítulo 13: Desarrollo del Frontend y Prototipado Visual

## 13.1. Introducción

Tras consolidar el backend con una API robusta y un sistema de autenticación completo, el siguiente paso fue dotar al sistema de una interfaz de usuario que permitiera realizar pruebas funcionales de forma ágil. Para ello, se exploraron diferentes herramientas de prototipado visual, optando finalmente por **Google Stitch** y su integración con el agente de IA **OpenCode**.

El objetivo de esta fase fue:
1.  **Definir una especificación visual clara** para el frontend.
2.  **Generar un prototipo funcional** que sirviera como guía para el desarrollo.
3.  **Utilizar el agente de IA** para traducir ese prototipo en código React funcional.

## 13.2. Diseño del Sistema Visual

### 13.2.1. Herramienta de Prototipado: Google Stitch

Se utilizó **Google Stitch** como herramienta de prototipado visual. Sus principales ventajas fueron:
- **Generación rápida:** Permite describir en lenguaje natural la interfaz deseada y obtener un prototipo en minutos.
- **Modo `thinking`:** Ofrece una modalidad de generación más detallada y coherente, ideal para obtener un diseño de alta fidelidad.
- **Exportación de especificaciones:** Genera un archivo `DESIGN.md` que contiene el sistema de diseño completo (colores, tipografía, espaciado, componentes, etc.).
- **Exportación de HTML:** Genera maquetas HTML exactas de cada página, que sirven como referencia visual para el desarrollo.

### 13.2.2. El Sistema de Diseño (`DESIGN.md`)

El sistema de diseño generado por Stitch se materializó en un archivo `DESIGN.md`, que define:

- **Paleta de colores:** Con soporte para modo oscuro (primario) y modo claro, basada en una estética "Studio Noir".
- **Tipografía:** Uso de la fuente **Inter** con una escala tipográfica completa (display-lg, headline-md, title-sm, body-lg, body-sm, label-caps).
- **Layout y espaciado:** Sistema de grid de 12 columnas, márgenes y un máximo de ancho de 1440px.
- **Elevación y profundidad:** Uso de capas tonales y bordes de bajo contraste en lugar de sombras pesadas.
- **Formas:** Bordes redondeados (4px, 8px, 12px) para mantener un estilo contemporáneo.
- **Componentes:** Definición de botones, tarjetas de talento, inputs, navegación lateral y "status chips".

### 13.2.3. Maquetas HTML

Stitch generó tres maquetas HTML que representan las pantallas principales del sistema:

1.  **Dashboard:** Vista general de castings con tarjetas y contadores.
2.  **Detalle de Casting:** Formulario de edición/creación con gestión de participantes a nivel de casting.
3.  **Detalle de Ronda:** Grid de videos con valoraciones y gestión de participantes a nivel de ronda.

## 13.3. Gestión del Diseño con OpenCode

### 13.3.1. Creación de una Skill de Diseño

Para que el agente de IA (OpenCode) pudiera aplicar el diseño de forma consistente, se creó una **Skill** (`frontend-design`) que referencia el archivo `DESIGN.md` y las maquetas HTML.

**Estructura de la Skill:**
```markdown
---
name: frontend-design
description: Sistema de diseño y maquetas HTML para el frontend del sistema de casting
---

# Sistema de Diseño - Slate Casting

## Guía de Estilo
La guía de estilo completa está definida en `frontend/design/DESIGN.md`.

## Maquetas HTML
- **Dashboard:** `frontend/design/dashboard.html`
- **Detalle de Casting:** `frontend/design/casting-detail.html`
- **Detalle de Ronda:** `frontend/design/round-detail.html`

**Instrucción:** Al generar cualquier página del frontend, consulta primero el `DESIGN.md` para los estilos y la maqueta HTML correspondiente para la estructura y el layout.



13.3.2. Generación del Frontend con OpenCode

Con la Skill de diseño cargada, se utilizó OpenCode para generar el frontend en React. Los prompts utilizados fueron:

Para el Dashboard:
bash

/skill frontend-design

Genera la página de Dashboard del sistema de casting en React, usando la maqueta `frontend/design/dashboard.html` como referencia visual exacta y el `DESIGN.md` para los estilos.

Requisitos:
- Usa React con TypeScript y Vite.
- Usa Tailwind v3 para los estilos.
- Conecta con la API del backend para obtener los datos reales (GET /api/v1/castings).
- Implementa la barra lateral de navegación según el diseño.
- Las tarjetas de casting deben mostrar el título, descripción, número de rondas y contador de submissions.
- El botón "Create New Session" debe navegar a la página de creación de casting.

13.4. Resultados del Frontend

OpenCode generó el frontend con las siguientes características:

    Configuración de Tailwind: Traducción completa del DESIGN.md a un archivo tailwind.config.js con 60+ colores personalizados y una escala tipográfica exacta.

    Layout: Barra lateral fija de 280px con navegación, logo, indicadores de estado activo y botón de logout.

    Dashboard: Conectado a la API GET /api/v1/castings, mostrando tarjetas de casting con título, descripción, contadores de rondas y participantes.

    Tema oscuro: Aplicado por defecto con class="dark" en index.html.

    Calidad de código: 0 errores de TypeScript y compatibilidad total con el backend.

13.5. Trabajo Pendiente
Tarea	Estado
Navegación entre páginas	⏳ Pendiente (conectar "Create New Session" a la página de creación).
Detalle de Casting	⏳ Pendiente de generar.
Detalle de Ronda	⏳ Pendiente de generar.
Modo claro/oscuro	⏳ Pendiente de implementar (toggle).
Autenticación	✅ Implementada (redirección a login).
13.6. Conclusión

El flujo de trabajo basado en Google Stitch y la Skill de OpenCode ha demostrado ser una forma eficaz de pasar de un prototipo visual a un código funcional. El agente de IA ha sido capaz de interpretar el sistema de diseño (DESIGN.md) y las maquetas HTML para generar un frontend coherente y bien estructurado. Esta metodología reduce la fricción entre diseño y desarrollo, y permite iterar rápidamente sobre la interfaz de usuario.

El resultado es un frontend que, aunque aún incompleto, sienta las bases para un desarrollo ágil y centrado en la experiencia de usuario, con un backend sólido y probado.