# Capítulo 14: Unificación del Sistema de Autenticación y Refactorización de la Seguridad

## 14.1. Introducción

El sistema de autenticación había evolucionado a lo largo del proyecto, pero presentaba una complejidad innecesaria y, lo que es más grave, una vulnerabilidad de seguridad. Originalmente, se habían implementado dos vías de autenticación:

1. **Modo real:** Basado en JWT, con login mediante email y contraseña.
2. **Modo demo:** Basado en un header `X-User-Id`, con un flag `DEMO_MODE` en el backend y un `demo-mode` en el frontend.

Esta dualidad generaba código redundante, lógica dispersa y, lo más crítico, un coladero de seguridad: si no se enviaba ningún token, el middleware de autenticación usaba `'user-demo'` como fallback, permitiendo el acceso sin autenticación real.

El objetivo de esta sesión fue **unificar el sistema de autenticación en un único flujo basado en JWT**, eliminando la dualidad y cerrando la brecha de seguridad.

## 14.2. Análisis del Problema

El sistema de autenticación presentaba los siguientes problemas:

| Problema | Impacto |
|----------|---------|
| **Dualidad de flujos** | Login real y modo demo usaban mecanismos diferentes (JWT vs `X-User-Id`). |
| **Código redundante** | El frontend gestionaba `demo-mode`, `x-user-id` y `demo-role` en `localStorage`. |
| **Middleware inseguro** | `authMiddleware` permitía el acceso sin token usando `'user-demo'` como fallback. |
| **Endpoint inseguro** | `GET /users/me/participations` devolvía la tabla completa si no había usuario autenticado. |

**La solución:** Unificar ambos flujos en un único mecanismo basado en JWT. El modo demo se convierte en un "login con un clic" que genera un JWT real.

## 14.3. La Nueva Arquitectura de Autenticación

### 14.3.1. Flujo Unificado

| Paso | Login Real | Modo Demo |
|------|------------|-----------|
| **1. Frontend** | `POST /auth/login` con `{ email, password }` | `POST /auth/login` con `{ xUserId: 'director' }` |
| **2. Backend** | `LoginUseCase` valida credenciales | `LoginUseCase` valida `xUserId` contra `DEMO_USERS` y `DEMO_MODE` |
| **3. Backend** | Genera JWT | Genera JWT |
| **4. Frontend** | Guarda `token` y `userId` en `localStorage` | Guarda `token` y `userId` en `localStorage` |
| **5. Petición API** | `Authorization: Bearer <token>` | `Authorization: Bearer <token>` |
| **6. `authMiddleware`** | Decodifica token → `req.user.id` | Decodifica token → `req.user.id` |

**La clave:** Ambos flujos terminan en un JWT válido. El middleware solo valida JWT, y no hay "fallback" sin token.

### 14.3.2. El DTO de Login

El DTO `LoginInput` se modificó para hacer todos los campos opcionales, delegando la validación de la combinación correcta al caso de uso.

```typescript
export interface LoginInput {
  email?: string;
  password?: string;
  xUserId?: string;
}
```

14.3.3. El Mapa de Usuarios Demo

Se creó un mapa DEMO_USERS en el backend para asociar roles a emails reales:
typescript

const DEMO_USERS: Record<string, string> = {
  director: 'director@demo.com',
  actor: 'actor1@demo.com',
  preselector: 'preselector@demo.com',
};

14.3.4. El Middleware de Autenticación (Refactorizado)

El authMiddleware se simplificó para que solo valide JWT, eliminando toda la lógica de DEMO_MODE y X-User-Id.
typescript

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.user = { id: decoded.userId };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

14.3.5. Limpieza del Frontend

Se eliminaron todas las referencias a demo-mode, x-user-id y demo-role en el frontend. El interceptor de Axios solo inyecta Authorization: Bearer <token>.
14.4. Gestión del Agente (OpenCode)

Durante esta sesión, el agente (OpenCode) demostró una capacidad excepcional para:

    Identificar la causa raíz: Detectó que el middleware usaba 'user-demo' como fallback.

    Refactorizar en profundidad: Unificó el flujo de autenticación en todas las capas (backend, frontend, tests).

    Mantener la cobertura de tests: Todos los tests (234 en total) siguieron pasando tras la refactorización.

    Actualizar la documentación: AGENTS.md se actualizó con el nuevo flujo de autenticación y la eliminación de la lógica obsoleta.

14.5. Resultados
Aspecto	Estado
Autenticación	✅ Unificada en JWT
Seguridad	✅ Sin fallback inseguro
Código	✅ Limpio y sin redundancias
Tests	✅ 234 tests pasando
Documentación	✅ AGENTS.md actualizado
14.6. Conclusión

La refactorización del sistema de autenticación ha demostrado que la simplicidad y la seguridad van de la mano. Al unificar el login real y el modo demo en un único flujo basado en JWT, se eliminó la complejidad innecesaria, se cerró la brecha de seguridad y se mejoró la mantenibilidad del sistema.

El modo demo no es un "bypass" de seguridad, sino un "login con un clic" que genera un JWT real, y el middleware es único y solo valida tokens. Esta solución es más segura, más simple y más fácil de mantener que el sistema dual anterior.