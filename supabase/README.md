# Schema — Fase 0

## Tablas

| Tabla | Propósito |
|---|---|
| `profiles` | Datos personales (edad, peso, altura, actividad, objetivo). Se crea automáticamente al registrarse vía trigger. |
| `macro_goals` | Objetivos diarios calculados o editados manualmente (`is_custom`). Un registro por usuario. |
| `meals` | Agrupa alimentos por tipo (desayuno/almuerzo/cena/snack) y fecha. |
| `food_entries` | Alimentos individuales. `logged_at` es el timestamp que va a alimentar el gráfico tipo "trading". |
| `ai_chats` | Conversaciones de IA. |
| `ai_messages` | Mensajes de cada chat. Los mensajes `assistant` se insertan solo desde el backend con `service_role`. |

## Decisiones clave de seguridad

1. **RLS en todas las tablas, sin excepción.** Ninguna tabla es accesible sin `auth.uid() = user_id`.
2. **`user_id` nunca se confía desde el frontend.** Las policies fuerzan que coincida con `auth.uid()`, y en las Edge Functions/API routes del backend vas a volver a validar el `user_id` desde el JWT de la sesión, nunca desde el body del request.
3. **La IA no toca la base de datos directamente.** Los mensajes `assistant` se insertan con la `service_role` key desde una función backend, que primero valida que el chat pertenezca al usuario autenticado.
4. **Los objetivos de macros no se sobreescriben solos.** Si el usuario los edita a mano (`is_custom = true`), el recálculo automático al editar el perfil no los pisa (esa lógica va en el backend, no en el schema).

## Qué falta para completar la Fase 0

- [ ] Crear el proyecto en Supabase y correr este `schema.sql`
- [ ] Configurar Supabase Auth (email/password como mínimo)
- [ ] Scaffold de Next.js + TypeScript + Tailwind
- [ ] Cliente de Supabase separado para browser (`anon key`) y server (`service_role key`, solo en backend)
- [ ] Generar tipos TypeScript desde el schema (`supabase gen types typescript`)
- [ ] Variables de entorno: `.env.local` con las keys, y confirmar que `service_role` **nunca** tenga el prefijo `NEXT_PUBLIC_`

## Siguiente fase

Fase 1: formulario de perfil + fórmula de cálculo de macros (Mifflin-St Jeor + factor de actividad), conectado a `profiles` y `macro_goals`.
