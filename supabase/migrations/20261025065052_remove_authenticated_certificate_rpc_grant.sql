-- Certificate verification is intentionally public, but signed-in users do not need direct RPC execution.
revoke execute on function public.cwu_verify_certificate(text) from authenticated;
grant execute on function public.cwu_verify_certificate(text) to anon;
