import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';

// pusher-js webpack bundles export the class as module.exports.Pusher (node/react-native build)
// or module.exports.default (web build). We handle all variants.
function getPusherClass() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('pusher-js');
  // Try all known export shapes from the webpack builds
  const cls = (mod && mod.Pusher) || (mod && mod.default) || mod;
  if (typeof cls !== 'function') {
    throw new Error(`Pusher constructor not found. Got: ${typeof mod} keys: ${mod ? Object.keys(mod).join(',') : 'null'}`);
  }
  return cls;
}

interface RealTimeContextType {
  subscribe: (channelName: string, eventName: string, callback: (data: any) => void) => () => void;
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined);

export const RealTimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const pusherRef = useRef<any>(null);

  useEffect(() => {
    if (!user) {
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
      return;
    }

    // Initialize Pusher client connecting to our NestJS backend
    const PusherClass = getPusherClass();
    const client = new PusherClass('app_c6fad2d05b55e41f43150c83237cadae70031e43', {
      cluster: 'us',
      wsHost: '10.0.0.2', // Points to computer's local network IP
      wsPort: 3000,
      wssPort: 3000,
      forceTLS: false,
      disableStats: true,
      enabledTransports: ['ws', 'wss'],
    });

    pusherRef.current = client;

    // Optional debug events
    client.connection.bind('state_change', (states: any) => {
      console.log('RealTime Socket state changed:', states.current);
    });

    client.connection.bind('error', (err: any) => {
      console.error('RealTime Socket connection error:', err);
    });

    return () => {
      client.disconnect();
      pusherRef.current = null;
    };
  }, [user]);

  const subscribe = (channelName: string, eventName: string, callback: (data: any) => void) => {
    if (!pusherRef.current) {
      console.warn('RealTime client not connected. Call subscribe ignored.');
      return () => {};
    }

    const channel = pusherRef.current.subscribe(channelName);
    channel.bind(eventName, callback);

    return () => {
      channel.unbind(eventName, callback);
      if (pusherRef.current) {
        pusherRef.current.unsubscribe(channelName);
      }
    };
  };

  return (
    <RealTimeContext.Provider value={{ subscribe }}>
      {children}
    </RealTimeContext.Provider>
  );
};

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};
