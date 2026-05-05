export function LoadingState({
  label = "Cargando información...",
}: {
  label?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-8 text-center shadow-sm backdrop-blur">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#0f766e]/20 border-t-[#0f766e]" />
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>
  );
}
