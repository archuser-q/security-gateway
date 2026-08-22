type OverviewField = {
  label: string;
  value: React.ReactNode;
};

type OverviewProps = {
  title?: string;
  fields: OverviewField[];
};

export const Overview = ({ title = 'Overview', fields }: OverviewProps) => {
  return (
    <fieldset className="rounded-lg border border-gray-200 px-6 pb-5 pt-0">
      <legend className="px-1 text-sm text-gray-500">{title}</legend>
      <div className="flex flex-wrap gap-x-12 gap-y-4 pt-1">
        {fields.map((field) => (
          <div key={field.label} className="min-w-[90px]">
            <div className="mb-1 text-sm text-gray-400">{field.label}</div>
            <div className="text-sm font-semibold text-gray-900">
              {field.value}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
};