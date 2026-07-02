import { getSecureItem, setSecureItem, deleteSecureItem } from '../storage';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('Storage Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call SecureStore.setItemAsync on native platforms', async () => {
    await setSecureItem('test_key', 'test_value');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('test_key', 'test_value');
  });

  it('should call SecureStore.getItemAsync on native platforms', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test_value');
    const val = await getSecureItem('test_key');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('test_key');
    expect(val).toBe('test_value');
  });

  it('should call SecureStore.deleteItemAsync on native platforms', async () => {
    await deleteSecureItem('test_key');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('test_key');
  });
});
