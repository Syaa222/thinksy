"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface RealtimeEvent {
  type:
    | "NEW_ESSAY_SUBMISSION"
    | "ESSAY_GRADED"
    | "SOAL_PUBLISHED"
    | "ATTENDANCE_CHECKIN"
    | "ATTENDANCE_VERIFIED"
    | "NOTIFICATION_RECEIVED"
    | "TEACHER_ADDED"
    | "STUDENT_ADDED"
    | "CLASS_CREATED"
    | "CHAT_POSTED"
    | "CHAT_LIKED"
    | "CHAT_COMMENTED"
    | "EXAM_STATUS_CHANGED"
    | "POINTS_UPDATED";
  payload?: any;
  timestamp: string;
}

type EventCallback = (event: RealtimeEvent) => void;

// Module-level singleton state to manage a single channel & multiple subscribers
const eventListeners = new Set<EventCallback>();
let globalChannel: any = null;
let globalIsConnected = false;
const connectionListeners = new Set<(connected: boolean) => void>();

function initGlobalChannel() {
  if (globalChannel) return;

  try {
    const supabase = createClient();
    globalChannel = supabase.channel("realtime-dashboard-global", {
      config: {
        broadcast: { self: true },
      },
    });

    globalChannel
      .on("broadcast", { event: "dashboard_action" }, ({ payload }: { payload: any }) => {
        const eventData = payload as RealtimeEvent;
        eventListeners.forEach((listener) => {
          try {
            listener(eventData);
          } catch (e) {
            console.error("[Realtime Dashboard Listener Error]", e);
          }
        });
      })
      .on("postgres_changes", { event: "*", schema: "public" }, (payload: any) => {
        let eventType: RealtimeEvent["type"] = "NEW_ESSAY_SUBMISSION";
        if (payload.table === "presensi") {
          eventType = payload.eventType === "INSERT" ? "ATTENDANCE_CHECKIN" : "ATTENDANCE_VERIFIED";
        } else if (payload.table === "notifikasi") {
          eventType = "NOTIFICATION_RECEIVED";
        } else if (payload.table === "ujian") {
          eventType = "EXAM_STATUS_CHANGED";
        } else if (payload.table === "profil") {
          eventType = "POINTS_UPDATED";
        }

        const eventData: RealtimeEvent = {
          type: eventType,
          payload: payload.new || payload.old,
          timestamp: new Date().toISOString(),
        };
        eventListeners.forEach((listener) => {
          try {
            listener(eventData);
          } catch (e) {
            console.error("[Realtime Dashboard Postgres Listener Error]", e);
          }
        });
      })
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          globalIsConnected = true;
          connectionListeners.forEach((cb) => cb(true));
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          globalIsConnected = false;
          connectionListeners.forEach((cb) => cb(false));
        }
      });
  } catch (err) {
    console.error("[Realtime Dashboard Channel Init Error]", err);
  }
}

function tearDownGlobalChannel() {
  if (eventListeners.size === 0 && globalChannel) {
    try {
      const supabase = createClient();
      supabase.removeChannel(globalChannel);
    } catch {
      // ignore
    }
    globalChannel = null;
    globalIsConnected = false;
    connectionListeners.forEach((cb) => cb(false));
  }
}

export function useRealtimeDashboard(onEventReceived?: EventCallback) {
  const [latestEvent, setLatestEvent] = useState<RealtimeEvent | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(globalIsConnected);

  useEffect(() => {
    // 1. Connection status listener
    const handleConnChange = (connected: boolean) => {
      setIsConnected(connected);
    };
    connectionListeners.add(handleConnChange);

    // 2. Event listener
    const handleEvent: EventCallback = (eventData) => {
      setLatestEvent(eventData);
      if (onEventReceived) {
        onEventReceived(eventData);
      }
    };
    eventListeners.add(handleEvent);

    // 3. Init global channel if not initialized
    initGlobalChannel();
    if (globalIsConnected) {
      setIsConnected(true);
    }

    return () => {
      eventListeners.delete(handleEvent);
      connectionListeners.delete(handleConnChange);
      tearDownGlobalChannel();
    };
  }, [onEventReceived]);

  const broadcastEvent = async (type: RealtimeEvent["type"], payload?: any) => {
    try {
      const supabase = createClient();
      const channel = globalChannel || supabase.channel("realtime-dashboard-global");

      await channel.send({
        type: "broadcast",
        event: "dashboard_action",
        payload: {
          type,
          payload,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error("[Broadcast Event Error]", err);
    }
  };

  return {
    latestEvent,
    isConnected,
    broadcastEvent,
  };
}
