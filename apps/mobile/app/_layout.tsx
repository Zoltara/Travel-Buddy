import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchProvider } from '@/lib/search-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../nativewind-env';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 60, retry: 1 } },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SearchProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#0284c7' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: '700' },
              contentStyle: { backgroundColor: '#f8fafc' },
            }}
          >
            <Stack.Screen name="(search)/location" options={{ title: '🗺️ Travel Buddy', headerLargeTitle: true }} />
            <Stack.Screen name="(search)/dates" options={{ title: 'When & Budget' }} />
            <Stack.Screen name="(search)/type" options={{ title: 'Resort Type' }} />
            <Stack.Screen name="(search)/priorities" options={{ title: 'Your Priorities' }} />
            <Stack.Screen name="(search)/results" options={{ title: '✨ Your Top Picks', headerLargeTitle: true }} />
          </Stack>
        </SearchProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
