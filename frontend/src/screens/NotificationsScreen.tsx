import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { useAuth } from '../context/AuthContext';
import { useRealTime } from '../context/RealTimeContext';
import { Colors } from '../theme/colors';
import { Logger } from '../utils/logger';

const GET_NOTIFICATIONS_QUERY = gql`
  query GetNotifications {
    notifications {
      _id
      type
      read
      createdAt
      postId
      commentId
      senderId {
        _id
        username
        displayName
        avatarUrl
      }
    }
  }
`;

const READ_NOTIFICATION_MUTATION = gql`
  mutation ReadNotification($id: String!) {
    readNotification(id: $id) {
      _id
      read
    }
  }
`;

const NOTIFICATION_TYPES = {
  REACTION: { label: 'reacted to your post', emoji: '❤️', color: Colors.love },
  COMMENT: { label: 'commented on your post', emoji: '💬', color: Colors.primary },
  REPLY: { label: 'replied to your comment', emoji: '↩️', color: Colors.secondary },
  FOLLOW: { label: 'started following you', emoji: '👤', color: Colors.success },
};

export const NotificationsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { subscribe } = useRealTime();

  const { data, loading, error, refetch } = useQuery(GET_NOTIFICATIONS_QUERY, {
    fetchPolicy: 'network-only',
  });

  const [readNotification] = useMutation(READ_NOTIFICATION_MUTATION, {
    onError: (err) => Logger.gqlError('NotificationsScreen', 'ReadNotification', err),
  });

  // Listen for real-time notifications
  useEffect(() => {
    if (!user?._id) return;

    const unsubscribe = subscribe(`user-${user._id}`, 'notification:new', (newNotification: any) => {
      // In-app visual popup/banner alert
      Alert.alert(
        'New Notification',
        `${newNotification.senderId.displayName} ${NOTIFICATION_TYPES[newNotification.type as keyof typeof NOTIFICATION_TYPES]?.label || ''}`
      );
      refetch();
    });

    return () => {
      unsubscribe();
    };
  }, [user?._id]);

  const handleNotificationPress = async (item: any) => {
    // 1. Mark as read
    if (!item.read) {
      readNotification({
        variables: { id: item._id },
        optimisticResponse: {
          readNotification: {
            __typename: 'Notification',
            _id: item._id,
            read: true,
          },
        },
      });
    }

    // 2. Navigate based on type
    if (item.type === 'FOLLOW') {
      navigation.navigate('Profile', { username: item.senderId.username });
    } else if (item.postId) {
      navigation.navigate('PostDetail', { postId: item.postId });
    }
  };

  if (loading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading notifications: {error.message}</Text>
      </View>
    );
  }

  const notifications = data?.notifications || [];

  const renderNotificationItem = ({ item }: { item: any }) => {
    const sender = item.senderId;
    const typeInfo = NOTIFICATION_TYPES[item.type as keyof typeof NOTIFICATION_TYPES] || {
      label: 'sent you a notification',
      emoji: '🔔',
      color: Colors.primary,
    };

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.read && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
      >
        {/* Unread Accent Line */}
        {!item.read && <View style={styles.unreadIndicator} />}

        {/* Sender Avatar */}
        {sender.avatarUrl ? (
          <Image source={{ uri: sender.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarPlaceholderText}>
              {sender.displayName?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Text Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.text}>
            <Text style={styles.displayName}>{sender.displayName}</Text>{' '}
            <Text style={styles.actionLabel}>{typeInfo.label}</Text>
          </Text>
          <Text style={styles.time}>
            {(() => {
              const num = Number(item.createdAt);
              const date = isNaN(num) ? new Date(item.createdAt) : new Date(num);
              if (isNaN(date.getTime())) return '';
              return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            })()}
          </Text>
        </View>

        {/* Emoji Indicator */}
        <View style={[styles.iconContainer, { backgroundColor: typeInfo.color + '15' }]}>
          <Text style={styles.icon}>{typeInfo.emoji}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderNotificationItem}
        onRefresh={refetch}
        refreshing={loading}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You're all caught up! ✨</Text>
            <Text style={styles.emptySubtext}>When people react, comment, or follow you, it will appear here.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
    position: 'relative',
  },
  unreadCard: {
    backgroundColor: Colors.surfaceCard,
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.primary,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 18,
  },
  displayName: {
    fontWeight: 'bold',
  },
  actionLabel: {
    color: Colors.textMuted,
  },
  time: {
    fontSize: 11,
    color: Colors.textDim,
    marginTop: 4,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
