import { useSuspenseQuery } from '@tanstack/react-query';
import { getAdminQueryOptions } from '@/apis/hooks';
import { Avatar, Box, Stack, Text, SimpleGrid } from '@mantine/core';

type Props = {
  username: string;
}

export const ProfileViewModal = ({ username }: Props) => {
  const { data: adminData } = useSuspenseQuery(getAdminQueryOptions(username));
  const v = adminData?.value;

  return (
    <Stack>
      {/* Avatar */}
      <Stack align="center" gap="xs">
        <Avatar size={100} radius={80} />
        <Text fw={700} size="xl">{v?.username}</Text>
      </Stack>

      {/* Label-value */}
      <SimpleGrid cols={2} spacing="sm">
        <LabelValue label="Full name" value={v?.fullname} />
        <LabelValue label="Username" value={v?.username} />
        <LabelValue label="Date of Birth" value={v?.dob} />
        <LabelValue label="Description" value={v?.desc} />
        <LabelValue label="Status" value={v?.status ? 'Active' : 'Inactive'} />
      </SimpleGrid>
    </Stack>
  );
};

const LabelValue = ({ label, value }: { label: string; value?: string }) => (
  <Box>
    <Text size="xs" c="dimmed">{label}</Text>
    <Text size="sm" fw={500}>{value ?? '-'}</Text>
  </Box>
);