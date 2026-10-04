import { useLocalSearchParams } from 'expo-router';
import { ExampleDetailScreen } from '@/features/examples/example-detail-screen';

export default function ExampleDetailRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  return <ExampleDetailScreen id={Array.isArray(id) ? id[0] : id} />;
}
