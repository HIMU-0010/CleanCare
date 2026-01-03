import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { StorageService } from '../../services/StorageService';
import { COLORS } from '../../styles/theme';

export const CreateAdminScreen = ({ navigation, route }: any) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('WARD_ADMIN');
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);

    // Hierarchy Data
    const [corporations, setCorporations] = useState<any[]>([]);

    // Selections
    const [selectedCorpId, setSelectedCorpId] = useState('');
    const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
    const [selectedWardId, setSelectedWardId] = useState('');

    useEffect(() => {
        fetchLocations();
    }, []);

    // Handle Prefill from Navigation
    const prefillResponse = route.params?.prefillResponse;

    useEffect(() => {
        if (prefillResponse && corporations.length > 0) {
            const { role, corpId, wardId } = prefillResponse;
            setRole(role);

            if (role === 'SUPER_ADMIN' && corpId) {
                setSelectedCorpId(corpId);
            } else if (role === 'WARD_ADMIN' && wardId) {
                // Find Corp and Zone for this Ward to auto-expand UI
                let foundCorpId = '';
                let foundZoneId = '';

                for (const corp of corporations) {
                    for (const zone of corp.zones) {
                        const foundWard = zone.wards.find((w: any) => w.id === wardId);
                        if (foundWard) {
                            foundCorpId = corp.id;
                            foundZoneId = zone.id;
                            break;
                        }
                    }
                    if (foundCorpId) break;
                }

                if (foundCorpId) {
                    setSelectedCorpId(foundCorpId);
                    setSelectedZoneIds([foundZoneId]); // Array for zones
                    setSelectedWardId(wardId);
                }
            }
        }
    }, [prefillResponse, corporations]); // Run when data is loaded
    const fetchLocations = async () => {
        try {
            const token = await StorageService.getItem('userToken');

            const response = await axios.get(`${API_URL}/locations/corporations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCorporations(response.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch location data');
        } finally {
            setDataLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!name || !phone || !password) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const token = await StorageService.getItem('userToken');

            const payload: any = {
                name,
                phone,
                password,
                role,
            };

            if (role === 'SUPER_ADMIN') {
                payload.corporationId = selectedCorpId;
                payload.zoneIds = selectedZoneIds;
            } else if (role === 'WARD_ADMIN') {
                payload.wardId = selectedWardId;
            }

            await axios.post(`${API_URL}/admins/create`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Success', 'Admin created successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            console.log(error.response?.data);
            Alert.alert('Error', error.response?.data?.message || 'Failed to create admin');
        } finally {
            setLoading(false);
        }
    };

    const toggleZoneSelection = (zoneId: string) => {
        if (selectedZoneIds.includes(zoneId)) {
            setSelectedZoneIds(prev => prev.filter(id => id !== zoneId));
        } else {
            setSelectedZoneIds(prev => [...prev, zoneId]);
        }
    };

    const renderJurisdictionSelectors = () => {
        if (dataLoading) return <ActivityIndicator />;

        const selectedCorp = corporations.find(c => c.id === selectedCorpId);

        return (
            <View style={styles.section}>
                <Text style={styles.label}>Assign Jurisdiction</Text>

                {/* Corporation Selector */}
                <Text style={styles.subLabel}>Corporation</Text>
                <View style={styles.row}>
                    {corporations.map(corp => (
                        <TouchableOpacity
                            key={corp.id}
                            style={[styles.chip, selectedCorpId === corp.id && styles.chipSelected]}
                            onPress={() => {
                                setSelectedCorpId(corp.id);
                                setSelectedZoneIds([]);
                                setSelectedWardId('');
                            }}
                        >
                            <Text style={[styles.chipText, selectedCorpId === corp.id && styles.chipTextSelected]}>
                                {corp.code}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Zone Selector (Multi for Super, Single Context for Ward) */}
                {selectedCorp && (
                    <>
                        <Text style={styles.subLabel}>Zones {role === 'SUPER_ADMIN' ? '(Multi-Select)' : ''}</Text>
                        <View style={styles.row}>
                            {selectedCorp.zones.map((zone: any) => {
                                const isSelected = role === 'SUPER_ADMIN'
                                    ? selectedZoneIds.includes(zone.id)
                                    : false; // Ward Admin selection handled via Ward list, just showing context? 
                                // Actually need to select Zone to filter Wards
                                return (
                                    <TouchableOpacity
                                        key={zone.id}
                                        style={[styles.chip, (isSelected || (role === 'WARD_ADMIN' && selectedZoneIds[0] === zone.id)) && styles.chipSelected]}
                                        onPress={() => {
                                            if (role === 'SUPER_ADMIN') {
                                                toggleZoneSelection(zone.id);
                                            } else {
                                                setSelectedZoneIds([zone.id]);
                                                setSelectedWardId('');
                                            }
                                        }}
                                    >
                                        <Text style={[styles.chipText, (isSelected || (role === 'WARD_ADMIN' && selectedZoneIds[0] === zone.id)) && styles.chipTextSelected]}>
                                            {zone.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </>
                )}

                {/* Ward Selector (Only for Ward Admin) */}
                {role === 'WARD_ADMIN' && selectedZoneIds.length > 0 && selectedCorp && (
                    <>
                        <Text style={styles.subLabel}>Ward</Text>
                        <View style={styles.row}>
                            {selectedCorp.zones
                                .find((z: any) => z.id === selectedZoneIds[0])
                                ?.wards.map((ward: any) => (
                                    <TouchableOpacity
                                        key={ward.id}
                                        style={[styles.chip, selectedWardId === ward.id && styles.chipSelected]}
                                        onPress={() => setSelectedWardId(ward.id)}
                                    >
                                        <Text style={[styles.chipText, selectedWardId === ward.id && styles.chipTextSelected]}>
                                            {ward.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                        </View>
                    </>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Create New Admin</Text>

                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: John Doe"
                    value={name}
                    onChangeText={setName}
                />

                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                    style={styles.input}
                    placeholder="+8801700000000"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />

                <Text style={styles.label}>Password</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter password (min 6 chars)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <Text style={styles.label}>Role</Text>
                <View style={styles.row}>
                    {['SUPER_ADMIN', 'WARD_ADMIN'].map(r => (
                        <TouchableOpacity
                            key={r}
                            style={[styles.chip, role === r && styles.chipSelected]}
                            onPress={() => {
                                setRole(r);
                                setSelectedCorpId('');
                                setSelectedZoneIds([]);
                                setSelectedWardId('');
                            }}
                        >
                            <Text style={[styles.chipText, role === r && styles.chipTextSelected]}>
                                {r.replace('_', ' ')}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {renderJurisdictionSelectors()}

                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create Admin</Text>}
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 12,
    },
    subLabel: {
        fontSize: 14,
        color: 'gray',
        marginBottom: 8,
        marginTop: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    section: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#e0e0e0',
        marginRight: 8,
        marginBottom: 8,
    },
    chipSelected: {
        backgroundColor: COLORS.primary,
    },
    chipText: {
        color: '#333',
    },
    chipTextSelected: {
        color: 'white',
        fontWeight: 'bold',
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 30,
    },
    submitText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    }
});
