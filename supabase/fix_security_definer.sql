-- =========================================================
-- FIX: Revocar EXECUTE público en funciones SECURITY DEFINER
-- Resuelve el warning de Supabase Advisor sobre
-- handle_new_user() y set_updated_at() siendo llamables
-- vía /rest/v1/rpc/... por el rol anon.
-- =========================================================

-- handle_new_user: solo debe dispararse por el trigger,
-- nunca ser invocable directamente vía API.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

-- set_updated_at: mismo caso, solo debe dispararse por los
-- triggers de updated_at, no ser invocable vía API.
revoke execute on function public.set_updated_at() from public;
revoke execute on function public.set_updated_at() from anon;
revoke execute on function public.set_updated_at() from authenticated;

-- Nota: esto NO rompe los triggers. Los triggers se ejecutan
-- con los permisos del dueño de la función (por eso son
-- SECURITY DEFINER), sin importar los permisos del rol que
-- disparó el INSERT/UPDATE. Lo único que se bloquea es la
-- posibilidad de llamarlas directamente vía RPC.
