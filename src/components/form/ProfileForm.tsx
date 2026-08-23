import { useSuspenseQuery } from '@tanstack/react-query';
import { getAdminQueryOptions } from '@/apis/hooks';
import dayjs from 'dayjs';

type Props = {
  id: string;
}

export const ProfileViewModal = ({ id }: Props) => {
  const { data: adminData } = useSuspenseQuery(getAdminQueryOptions(id));
  const v = adminData?.value;

  return (
    <div className="flex flex-col gap-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200">
          <svg viewBox="0 0 24 24" className="h-14 w-14 text-gray-400" fill="currentColor">
            <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5Z" />
          </svg>
        </div>
        <Text fw={700} size="xl">{v?.username}</Text>
      </div>

      {/* Thông tin cá nhân */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-gray-900">Thông tin cá nhân</h2>
        <div className="grid grid-cols-2 gap-4">
          <LabelValue label="Full name" value={v?.fullname} />
          <LabelValue label="Username" value={v?.username} />
          <LabelValue label="Date of Birth" value={v?.dob} />
          <LabelValue label="Description" value={v?.desc} />
        </div>
      </div>

      {/* Thông tin tài khoản */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-gray-900">Thông tin tài khoản</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text size="xs" c="dimmed">Status</Text>
            <div>
              <StatusBadge active={!!v?.status} />
            </div>
          </div>
          <LabelValue label="Created At" value={formatTimestamp(v?.create_time)} />
          <LabelValue label="Updated At" value={formatTimestamp(v?.update_time)} />
        </div>
      </div>
    </div>
  );
};

const formatTimestamp = (time?: number) => {
  if (!time) return undefined;
  return dayjs(time * 1000).format('YYYY-MM-DD HH:mm:ss');
};

const StatusBadge = ({ active }: { active: boolean }) => (
  <span
    className={`inline-block rounded-md px-2 py-1 text-xs font-medium ${
      active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
    }`}
  >
    {active ? 'Active' : 'Inactive'}
  </span>
);

const Text = ({
  fw,
  size,
  c,
  children,
}: {
  fw?: number;
  size?: 'xs' | 'sm' | 'xl';
  c?: 'dimmed';
  children: React.ReactNode;
}) => {
  const sizeClass = size === 'xl' ? 'text-xl' : size === 'xs' ? 'text-xs' : 'text-sm';
  const weightClass = fw === 700 ? 'font-bold' : fw === 500 ? 'font-medium' : '';
  const colorClass = c === 'dimmed' ? 'text-gray-400' : 'text-gray-900';
  return <span className={`${sizeClass} ${weightClass} ${colorClass}`}>{children}</span>;
};

const LabelValue = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <Text size="xs" c="dimmed">{label}</Text>
    <div>
      <Text size="sm" fw={500}>{value ?? '-'}</Text>
    </div>
  </div>
);