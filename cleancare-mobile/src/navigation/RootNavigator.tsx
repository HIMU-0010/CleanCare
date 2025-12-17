import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import { HomeScreen } from '../screens/citizen/HomeScreen';
import { NewComplaintScreen } from '../screens/citizen/NewComplaintScreen';
import { ComplaintListScreen } from '../screens/citizen/ComplaintListScreen';
import { ComplaintDetailScreen } from '../screens/citizen/ComplaintDetailScreen';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminComplaintDetailScreen } from '../screens/admin/AdminComplaintDetailScreen';
import { AdminManagementScreen } from '../screens/admin/AdminManagementScreen';
import { CreateAdminScreen } from '../screens/admin/CreateAdminScreen';
import { AdminDetailScreen } from '../screens/admin/AdminDetailScreen';
import { ManageCorporationsScreen } from '../screens/admin/ManageCorporationsScreen';
import { CreateCorporationScreen } from '../screens/admin/CreateCorporationScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create Account' }} />
        <Stack.Screen name="CitizenHome" component={HomeScreen} options={{ title: 'Home' }} />
        <Stack.Screen name="NewComplaint" component={NewComplaintScreen} options={{ title: 'Report Issue' }} />
        <Stack.Screen name="ComplaintList" component={ComplaintListScreen} options={{ title: 'My Complaints' }} />
        <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} options={{ title: 'Details' }} />
        
        {/* Admin Screens */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AdminComplaintDetail" component={AdminComplaintDetailScreen} options={{ title: 'Complaint Detail' }} />
        <Stack.Screen name="AdminManagement" component={AdminManagementScreen} options={{ title: 'Manage Admins' }} />
        <Stack.Screen name="ManageCorporations" component={ManageCorporationsScreen} options={{ title: 'Manage Corporations' }} />
        <Stack.Screen name="CreateCorporation" component={CreateCorporationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreateAdmin" component={CreateAdminScreen} options={{ title: 'Create New Admin' }} />
        <Stack.Screen name="AdminDetail" component={AdminDetailScreen} options={{ title: 'Admin Details' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
