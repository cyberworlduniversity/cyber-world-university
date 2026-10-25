-- Keep public certificate verification available without granting the RPC to signed-in users.
revoke execute on function public.cwu_verify_certificate(text) from public;
grant execute on function public.cwu_verify_certificate(text) to anon;
