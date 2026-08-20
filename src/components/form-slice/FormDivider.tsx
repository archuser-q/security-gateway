export const FormDivider = ({ label }: { label?: string }) => {
  if (!label) {
    return <hr className="my-4 border-gray-100" />;
  }
  return (
    <div className="my-4 flex items-center gap-3">
      <hr className="flex-1 border-gray-100" />
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <hr className="flex-1 border-gray-100" />
    </div>
  );
};