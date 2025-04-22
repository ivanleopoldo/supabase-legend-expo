import { supabase } from '@/utils/supabase';
import { Stack, Link } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export default function Home() {
  React.useEffect(() => {
    getTodos();
  }, []);

  const getTodos = async () => {
    const { data, error } = await supabase.from('todos').select('*');

    if (data) {
      console.log(data);
    }

    if (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Home' }} />
      <View>
        <Text>Hello</Text>
      </View>
    </>
  );
}
