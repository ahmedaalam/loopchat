import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import io from "socket.io-client";
import LoopChatLogo from "../components/LoopChatLogo";
import CallModal from "../components/CallModal";
import { MinusCircle } from "lucide-react";

const ENDPOINT = "http://localhost:5000";

// ─── SVG Helper Icons ────────────────────────────────────────────────────────
function PhoneCallIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function PhoneOffIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67M22 2L2 22" />
    </svg>
  );
}

function VideoOffIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M21 21l-4.35-4.35M23 7l-7 5 7 5V7z" />
      <path d="M16 16a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h7" />
    </svg>
  );
}

function MissedCallIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* plain phone icon, no arrow */}
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MissedVideoCallIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* plain video camera icon, no arrow */}
      <rect x="1" y="6" width="14" height="12" rx="2" ry="2" />
      <polygon points="23 7 16 12 23 17 23 7" />
    </svg>
  );
}

function UsersIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CrownIcon({ size = 12, color = "#f59e0b" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      style={{ verticalAlign: "middle", marginRight: "4px" }}
    >
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 14h14v2H5v-2z" />
    </svg>
  );
}

function VideoIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
    >
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function AudioIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function FileTextIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function CrossIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckIcon({ size = 16, color = "var(--accent)" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="3"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ZoomIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function DownloadIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function TrashIcon({ size = 13, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function ChevronDownIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ForwardIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 14 20 9 15 4" />
      <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
    </svg>
  );
}

function MoreVerticalIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

function MicIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function SendIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function SunIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function ArrowLeftIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

// Filled solid phone icon (Material Design)
function FilledPhoneIcon({ size = 18, color = "#ffffff" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      stroke="none"
    >
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  );
}

// Filled solid video camera icon (Material Design)
function FilledVideoIcon({ size = 18, color = "#ffffff" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      stroke="none"
    >
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
    </svg>
  );
}

// ─── Format Bytes Helper ──────────────────────────────────────────────────────
function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// ─── Sidebar Message Preview Helper ──────────────────────────────────────────
function getSidebarMessageContent(message) {
  if (!message) return "";
  if (message.callInfo && message.callInfo.isCall) {
    return message.callInfo.isVideoCall
      ? "↙ Missed video call"
      : "↙ Missed voice call";
  }
  if (message.content) return message.content;
  if (message.file) {
    if (message.file.fileType === "image") return "📷 Photo";
    if (message.file.fileType === "video") return "📹 Video";
    if (message.file.fileType === "audio") return "🎤 Voice note";
    return `📄 ${message.file.fileName || "File"}`;
  }
  return "Message";
}

// ─── Web Audio notification beep (no audio file needed) ───────────────────────
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.1);
    gain1.gain.setValueAtTime(0.25, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(660, ctx.currentTime);
    osc2.frequency.setValueAtTime(784, ctx.currentTime + 0.1);
    gain2.gain.setValueAtTime(0.12, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // AudioContext not supported
  }
}

// ─── Show browser (OS-level) notification ─────────────────────────────────────
function showBrowserNotification(senderName, messageContent, chatName) {
  if (Notification.permission !== "granted") return;
  const title = chatName ? `${chatName} • ${senderName}` : senderName;
  const notification = new Notification(title, {
    body: messageContent || "Sent an attachment",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: "loopchat-msg",
    renotify: true,
  });
  setTimeout(() => notification.close(), 5000);
}

function SearchIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function LogOutIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function ChatsTabIcon({ size = 22, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CallsTabIcon({ size = 22, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function GroupsTabIcon({ size = 22, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ProfileTabIcon({ size = 22, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ReplyIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

function EditIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function CameraIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function BlockIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

const formatLastSeen = (dateStr) => {
  if (!dateStr) return "offline";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "offline";

  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const timeStr = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (isToday) {
    return `Last seen today at ${timeStr}`;
  }
  return `Last seen ${d.toLocaleDateString()} at ${timeStr}`;
};

// ─── Reusable tick icon ───────────────────────────────────────────────────────
function TickIcon({ tickState, size = 9 }) {
  const isDouble = tickState !== "sent";
  const className = `tick-icon tick-${tickState}`;

  return (
    <span className={className}>
      {isDouble ? (
        <svg
          viewBox="0 0 22 11"
          fill="none"
          width={size * 1.8}
          height={size}
          style={{ overflow: "visible" }}
        >
          <path
            d="M1 5.5L5.5 10L15 1"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 5.5L11.5 10L21 1"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          viewBox="0 0 16 11"
          fill="none"
          width={size * 1.3}
          height={size}
          style={{ overflow: "visible" }}
        >
          <path
            d="M1 5.5L5.5 10L15 1"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

// ─── Render File Attachment inside Chat Bubble ──────────────────────────────
function AttachmentView({
  file,
  isSentByMe,
  onOpenLightbox,
  onToggleMenu,
  timeText,
  tickState,
  showTimeOverlay,
  isGroupChat,
}) {
  if (!file || !file.url) return null;
  const fullUrl = `http://localhost:5000${file.url}`;

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (onToggleMenu) onToggleMenu();
  };

  if (file.fileType === "image") {
    return (
      <div
        className="chat-media-image-wrapper"
        onClick={() => onOpenLightbox(file)}
        onDoubleClick={handleDoubleClick}
      >
        <img
          src={fullUrl}
          alt={file.fileName || "Image"}
          className="chat-media-image"
        />
        <div className="chat-media-hover-overlay">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <ZoomIcon size={14} /> View Full
          </span>
        </div>
        {showTimeOverlay && (
          <div className="media-time-badge">
            <span>{timeText}</span>
            {isSentByMe && !isGroupChat && (
              <TickIcon tickState={tickState} size={9} />
            )}
          </div>
        )}
      </div>
    );
  }

  if (file.fileType === "video") {
    return (
      <div
        className="chat-media-video-wrapper"
        onDoubleClick={handleDoubleClick}
      >
        <video src={fullUrl} controls className="chat-media-video" />
        {showTimeOverlay && (
          <div className="media-time-badge">
            <span>{timeText}</span>
            {isSentByMe && !isGroupChat && (
              <TickIcon tickState={tickState} size={9} />
            )}
          </div>
        )}
      </div>
    );
  }

  if (file.fileType === "audio") {
    return (
      <div
        className="chat-media-audio-wrapper"
        onDoubleClick={handleDoubleClick}
      >
        <audio src={fullUrl} controls className="chat-media-audio" />
        {showTimeOverlay && (
          <div className="media-time-badge inline-badge">
            <span>{timeText}</span>
            {isSentByMe && !isGroupChat && (
              <TickIcon tickState={tickState} size={9} />
            )}
          </div>
        )}
      </div>
    );
  }

  // Fallback / Document Card (PDF, ZIP, DOCX, TXT)
  return (
    <div
      className={`chat-doc-card ${isSentByMe ? "sent-doc" : "received-doc"}`}
      onDoubleClick={handleDoubleClick}
    >
      <div className="doc-icon-container">
        <FileTextIcon size={24} />
      </div>
      <div className="doc-details">
        <div className="doc-name" title={file.fileName}>
          {file.fileName}
        </div>
        <div className="doc-meta-row">
          <span className="doc-size">{formatBytes(file.fileSize)}</span>
          {showTimeOverlay && (
            <span className="doc-time-inline">
              • {timeText}
              {isSentByMe && !isGroupChat && (
                <TickIcon tickState={tickState} size={8} />
              )}
            </span>
          )}
        </div>
      </div>
      <a
        href={fullUrl}
        download={file.fileName}
        target="_blank"
        rel="noopener noreferrer"
        className="doc-download-btn"
        title="Download file"
        onClick={(e) => e.stopPropagation()}
      >
        <DownloadIcon size={16} />
      </a>
    </div>
  );
}

function Chat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Attachment & Media state
  const [pendingFile, setPendingFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mediaLightbox, setMediaLightbox] = useState(null);
  const fileInputRef = useRef(null);

  // WhatsApp-style Action Context Menu State
  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null);
  const [showChatHeaderMenu, setShowChatHeaderMenu] = useState(false);
  const [showSidebarHeaderMenu, setShowSidebarHeaderMenu] = useState(false);
  const [forwardingMsg, setForwardingMsg] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardSearch, setForwardSearch] = useState("");

  // Left Navigation Rail Active Tab ('chats' | 'calls' | 'groups' | 'profile')
  const [activeNavTab, setActiveNavTab] = useState("chats");

  // Calls tab & New Call modal state
  const [callsSearchQuery, setCallsSearchQuery] = useState("");
  const [showNewCallModal, setShowNewCallModal] = useState(false);
  const [newCallSearch, setNewCallSearch] = useState("");
  const [newCallSearchResults, setNewCallSearchResults] = useState([]);

  // Sidebar search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Socket.io & UX state
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [localTyping, setLocalTyping] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Group chat modal state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [groupSearchResults, setGroupSearchResults] = useState([]);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [groupCreating, setGroupCreating] = useState(false);

  // Voice Notes Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // WebRTC Voice & Video Call State
  const [callState, setCallState] = useState({
    isCalling: false,
    isIncoming: false,
    isConnected: false,
    callerName: "",
    isVideoCall: false,
    peerId: null,
    offer: null,
  });

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const peerConnectionRef = useRef(null);
  const callTimerRef = useRef(null);

  const messagesEndRef = useRef(null);
  const selectedChatRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Profile Edit & View Modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Contact Info Modal & Blocking State
  const [showContactInfoModal, setShowContactInfoModal] = useState(false);
  const [contactInfoData, setContactInfoData] = useState(null);
  const [isBlockingActionLoading, setIsBlockingActionLoading] = useState(false);

  // Presence & Replying State
  const [isPeerRecordingAudio, setIsPeerRecordingAudio] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const renderUserAvatar = (user, size = 40) => {
    if (user?.avatar) {
      const url = user.avatar.startsWith("http")
        ? user.avatar
        : `http://localhost:5000${user.avatar}`;
      return (
        <img
          src={url}
          alt={user.name || "User"}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      );
    }
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          background: "var(--accent)",
          color: "var(--avatar-text-color, #0078d4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: `${Math.round(size * 0.42)}px`,
        }}
      >
        {user?.name?.charAt(0).toUpperCase() || "?"}
      </div>
    );
  };

  // ─── Theme: light is default, dark is opt-in ─────────────────────────────
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("lc-theme") === "dark",
  );

  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("lc-theme", theme);
  }, [isDark]);

  // ─── Mobile panel state ───────────────────────────────────────────────────
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // ─── Call-back confirmation modal ────────────────────────────────────────
  const [callBackModal, setCallBackModal] = useState(null); // { isVideoCall, callerName }

  // Close context menus on window click
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuMsgId(null);
      setShowChatHeaderMenu(false);
      setShowSidebarHeaderMenu(false);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Mark messages in chat as read
  const markChatAsRead = useCallback(
    async (chatId) => {
      if (!currentUser || !chatId) return;

      // Clear notifications locally for this chat
      setNotifications((prev) =>
        prev.filter(
          (n) => (typeof n.chat === "object" ? n.chat?._id : n.chat) !== chatId,
        ),
      );

      // Update chats list state so latestMessage.readBy contains current user
      setChats((prev) =>
        prev.map((c) => {
          if (c._id === chatId && c.latestMessage) {
            const readBy = c.latestMessage.readBy || [];
            const currentUserId = currentUser.user._id;
            if (
              !readBy.some(
                (id) =>
                  (typeof id === "object" ? id._id : id) === currentUserId,
              )
            ) {
              return {
                ...c,
                latestMessage: {
                  ...c.latestMessage,
                  readBy: [...readBy, currentUserId],
                },
              };
            }
          }
          return c;
        }),
      );

      try {
        await axios.put(
          `http://localhost:5000/api/message/${chatId}/read`,
          {},
          { headers: { Authorization: `Bearer ${currentUser.token}` } },
        );
        socket?.emit("read messages", {
          chatId,
          readerId: currentUser.user._id,
        });
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }
    },
    [currentUser, socket],
  );

  useEffect(() => {
    selectedChatRef.current = selectedChat;
    if (selectedChat) {
      setNotifications((prev) =>
        prev.filter((n) => n.chat !== selectedChat._id),
      );
      markChatAsRead(selectedChat._id);
      // Reset block state; will be updated when user opens contact info
      if (!selectedChat.isGroupChat) {
        const recipient = selectedChat.users?.find(
          (u) => (typeof u === "object" ? u._id : u) !== currentUser?.user?._id,
        );
        setIsRecipientBlocked(recipient?.isBlocked ?? false);
      } else {
        setIsRecipientBlocked(false);
      }
    }
  }, [selectedChat, markChatAsRead]);

  // Auth setup & load chats
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      window.location.href = "/";
    } else {
      setCurrentUser(storedUser);
      fetchChats(storedUser.token);
    }

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Socket.io init
  useEffect(() => {
    if (!currentUser) return;
    const socketInstance = io(ENDPOINT);
    setSocket(socketInstance);
    socketInstance.emit("setup", currentUser.user._id);
    socketInstance.on("online users", (users) => setOnlineUsers(users));
    return () => socketInstance.disconnect();
  }, [currentUser]);

  // Helper: Get recipient user in DM chat
  const getRecipientUser = useCallback(
    (chatUsers) => {
      if (!currentUser || !chatUsers || !Array.isArray(chatUsers)) return null;
      return chatUsers.find(
        (u) => (typeof u === "object" ? u._id : u) !== currentUser.user._id,
      );
    },
    [currentUser],
  );

  // WebRTC Cleanup Helper
  const cleanupCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((t) => t.stop());
      setRemoteStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setCallDuration(0);
    setIsMicMuted(false);
    setIsVideoOff(false);
    setCallState({
      isCalling: false,
      isIncoming: false,
      isConnected: false,
      callerName: "",
      isVideoCall: false,
      peerId: null,
      offer: null,
    });
  }, [localStream, remoteStream]);

  // Socket handlers
  useEffect(() => {
    if (!socket) return;

    const handleReceivedMessage = (receivedMsg) => {
      const activeChat = selectedChatRef.current;
      const isTabVisible = document.visibilityState === "visible";
      const isActiveChat = activeChat && activeChat._id === receivedMsg.chat;

      if (isActiveChat) {
        setMessages((prev) => [...prev, receivedMsg]);
        markChatAsRead(receivedMsg.chat);
      } else {
        setNotifications((prev) => {
          if (prev.some((n) => n._id === receivedMsg._id)) return prev;
          return [...prev, receivedMsg];
        });
      }

      setChats((prev) => {
        const updated = prev.map((c) =>
          c._id === receivedMsg.chat ? { ...c, latestMessage: receivedMsg } : c,
        );
        return updated.sort((a, b) =>
          a._id === receivedMsg.chat ? -1 : b._id === receivedMsg.chat ? 1 : 0,
        );
      });

      if (!isTabVisible || !isActiveChat) {
        playNotificationSound();
        const sender = receivedMsg.sender;
        const senderName = typeof sender === "object" ? sender.name : "Someone";
        const chatName = activeChat?.isGroupChat ? activeChat.chatName : null;
        showBrowserNotification(senderName, receivedMsg.content, chatName);
      }
    };

    const handleMessagesRead = ({ chatId, readerId }) => {
      const activeChat = selectedChatRef.current;
      if (activeChat && activeChat._id === chatId) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (!msg.readBy.includes(readerId)) {
              return { ...msg, readBy: [...msg.readBy, readerId] };
            }
            return msg;
          }),
        );
      }

      setChats((prev) =>
        prev.map((c) => {
          if (c._id === chatId && c.latestMessage) {
            const sender = c.latestMessage.sender;
            const senderId = typeof sender === "object" ? sender._id : sender;
            if (
              senderId !== readerId &&
              !c.latestMessage.readBy.includes(readerId)
            ) {
              return {
                ...c,
                latestMessage: {
                  ...c.latestMessage,
                  readBy: [...c.latestMessage.readBy, readerId],
                },
              };
            }
          }
          return c;
        }),
      );
    };

    const handleMessageDeleted = ({ messageId, chatId }) => {
      const activeChat = selectedChatRef.current;
      if (activeChat && activeChat._id === chatId) {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      }

      setChats((prev) =>
        prev.map((c) => {
          if (c._id === chatId && c.latestMessage?._id === messageId) {
            return { ...c, latestMessage: null };
          }
          return c;
        }),
      );
    };

    const handleChatCleared = ({ chatId }) => {
      if (selectedChatRef.current?._id === chatId) {
        setMessages([]);
      }
      setChats((prev) =>
        prev.map((c) => (c._id === chatId ? { ...c, latestMessage: null } : c)),
      );
    };

    const handleChatDeleted = ({ chatId }) => {
      if (selectedChatRef.current?._id === chatId) {
        setSelectedChat(null);
        setMessages([]);
      }
      setChats((prev) => prev.filter((c) => c._id !== chatId));
    };

    const handleTyping = (room) => {
      if (selectedChatRef.current?._id === room) setIsTyping(true);
    };
    const handleStopTyping = (room) => {
      if (selectedChatRef.current?._id === room) setIsTyping(false);
    };

    const handleIncomingCall = ({ offer, from, callerName, isVideoCall }) => {
      setCallState({
        isCalling: false,
        isIncoming: true,
        isConnected: false,
        callerName,
        isVideoCall,
        peerId: from,
        offer,
      });
    };

    const handleCallAccepted = async ({ answer }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(answer),
          );
          setCallState((prev) => ({
            ...prev,
            isCalling: false,
            isConnected: true,
          }));
          setCallDuration(0);
          callTimerRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
          }, 1000);
        } catch (err) {
          console.error("Error setting remote description:", err);
        }
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (candidate && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate),
          );
        } catch (err) {
          console.error("Error adding ice candidate:", err);
        }
      }
    };

    const handleCallRejected = () => {
      alert("Call was declined.");
      cleanupCall();
    };

    const handleCallEnded = () => {
      cleanupCall();
      // Refetch so the call record (voice/video message) appears
      // instantly in the chat pane and sidebar for the receiver
      const activeChatId = selectedChatRef.current?._id;
      if (activeChatId) {
        setTimeout(() => fetchMessages(activeChatId), 800);
      }
    };

    const handleRecordingAudio = (room) => {
      if (selectedChatRef.current?._id === room) setIsPeerRecordingAudio(true);
    };
    const handleStopRecordingAudio = (room) => {
      if (selectedChatRef.current?._id === room) setIsPeerRecordingAudio(false);
    };

    socket.on("receive message", handleReceivedMessage);
    socket.on("messages read", handleMessagesRead);
    socket.on("message deleted", handleMessageDeleted);
    socket.on("chat cleared", handleChatCleared);
    socket.on("chat deleted", handleChatDeleted);
    socket.on("typing", handleTyping);
    socket.on("stop typing", handleStopTyping);
    socket.on("recording audio", handleRecordingAudio);
    socket.on("stop recording audio", handleStopRecordingAudio);
    socket.on("incoming call", handleIncomingCall);
    socket.on("call accepted", handleCallAccepted);
    socket.on("ice candidate", handleIceCandidate);
    socket.on("call rejected", handleCallRejected);
    socket.on("call ended", handleCallEnded);

    return () => {
      socket.off("receive message", handleReceivedMessage);
      socket.off("messages read", handleMessagesRead);
      socket.off("message deleted", handleMessageDeleted);
      socket.off("chat cleared", handleChatCleared);
      socket.off("chat deleted", handleChatDeleted);
      socket.off("typing", handleTyping);
      socket.off("stop typing", handleStopTyping);
      socket.off("recording audio", handleRecordingAudio);
      socket.off("stop recording audio", handleStopRecordingAudio);
      socket.off("incoming call", handleIncomingCall);
      socket.off("call accepted", handleCallAccepted);
      socket.off("ice candidate", handleIceCandidate);
      socket.off("call rejected", handleCallRejected);
      socket.off("call ended", handleCallEnded);
    };
  }, [socket, markChatAsRead, cleanupCall]);

  // Initiate Call
  const initiateCall = async (isVideo) => {
    if (!selectedChat || selectedChat.isGroupChat || !currentUser) return;
    const recipient = getRecipientUser(selectedChat.users);
    if (!recipient || !recipient._id) {
      alert("Recipient is unavailable for call.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });
      setLocalStream(stream);

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket?.emit("ice candidate", {
            to: recipient._id,
            candidate: e.candidate,
          });
        }
      };

      pc.ontrack = (e) => {
        if (e.streams && e.streams[0]) {
          setRemoteStream(e.streams[0]);
        }
      };

      peerConnectionRef.current = pc;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Join the chat room so we receive the missed-call message broadcast
      // when the server saves it after an unanswered call
      socket?.emit("join chat", selectedChat._id);

      socket?.emit("call user", {
        userToCall: recipient._id,
        offer,
        from: currentUser.user._id,
        callerName: currentUser.user.name,
        isVideoCall: isVideo,
        chatId: selectedChat._id,
      });

      setCallState({
        isCalling: true,
        isIncoming: false,
        isConnected: false,
        callerName: recipient.name,
        isVideoCall: isVideo,
        peerId: recipient._id,
        offer: null,
      });
    } catch (err) {
      console.error("Camera/Microphone access error:", err);
      alert("Camera and Microphone permissions are required to start a call.");
      cleanupCall();
    }
  };

  // Accept Incoming Call
  const acceptCall = async () => {
    if (!callState.isIncoming || !callState.peerId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callState.isVideoCall,
      });
      setLocalStream(stream);

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket?.emit("ice candidate", {
            to: callState.peerId,
            candidate: e.candidate,
          });
        }
      };

      pc.ontrack = (e) => {
        if (e.streams && e.streams[0]) {
          setRemoteStream(e.streams[0]);
        }
      };

      peerConnectionRef.current = pc;

      await pc.setRemoteDescription(new RTCSessionDescription(callState.offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket?.emit("answer call", { to: callState.peerId, answer });

      setCallState((prev) => ({
        ...prev,
        isIncoming: false,
        isConnected: true,
      }));

      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Accept call error:", err);
      alert("Camera and Microphone permissions are required to accept call.");
      rejectCall();
    }
  };

  // Reject Incoming Call
  const rejectCall = () => {
    if (callState.peerId) {
      socket?.emit("reject call", { to: callState.peerId });
    }
    cleanupCall();
    // Refetch so the missed-call record appears instantly in sidebar
    const chatId = selectedChatRef.current?._id;
    if (chatId) {
      setTimeout(() => {
        fetchMessages(chatId);
        fetchChats(currentUser?.token);
      }, 800);
    }
  };

  // End Call
  const endCall = () => {
    const chatId = selectedChatRef.current?._id;
    if (callState.peerId) {
      socket?.emit("end call", { to: callState.peerId });
    }
    cleanupCall();
    // Always refetch after any call ends (missed, rejected, or connected).
    // The server saves a call-record message and broadcasts 'receive message'
    // via socket, but we refetch as a reliable safety-net so the call message
    // appears instantly in the chat pane and the sidebar preview.
    if (chatId) {
      setTimeout(() => {
        fetchMessages(chatId);
        fetchChats(currentUser?.token);
      }, 800);
    }
  };

  // Toggle Mic Mute
  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Video Camera
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Voice Notes Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);

      if (selectedChat) {
        socket?.emit("recording audio", selectedChat._id);
      }

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Microphone permission is required to record voice notes.");
    }
  };

  const cancelRecording = () => {
    if (selectedChat) {
      socket?.emit("stop recording audio", selectedChat._id);
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      mediaRecorderRef.current.stop();
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const stopAndSendRecording = () => {
    if (selectedChat) {
      socket?.emit("stop recording audio", selectedChat._id);
    }
    if (!mediaRecorderRef.current || !isRecording) return;

    mediaRecorderRef.current.onstop = async () => {
      clearInterval(recordingTimerRef.current);
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, {
        type: "audio/webm",
      });

      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
      setRecordingTime(0);

      try {
        const formData = new FormData();
        formData.append("file", audioFile);

        const uploadRes = await axios.post(
          "http://localhost:5000/api/upload",
          formData,
          {
            headers: {
              Authorization: `Bearer ${currentUser.token}`,
              "Content-Type": "multipart/form-data",
            },
          },
        );

        const { data } = await axios.post(
          "http://localhost:5000/api/message",
          {
            content: "",
            chatId: selectedChat._id,
            file: uploadRes.data,
          },
          { headers: { Authorization: `Bearer ${currentUser.token}` } },
        );

        setMessages((prev) => [...prev, data]);
        setChats((prev) => {
          const updated = prev.map((c) =>
            c._id === selectedChat._id ? { ...c, latestMessage: data } : c,
          );
          return updated.sort((a, b) =>
            a._id === selectedChat._id
              ? -1
              : b._id === selectedChat._id
                ? 1
                : 0,
          );
        });

        socket?.emit("send message", data);
      } catch (err) {
        console.error("Error sending voice note:", err);
      }
    };

    mediaRecorderRef.current.stop();
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, pendingFile]);

  // Fetch chats
  const fetchChats = async (token) => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/chat", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats(data);
    } catch (err) {
      console.error("Error fetching chats:", err);
    }
  };

  // Fetch messages
  const fetchMessages = async (chatId) => {
    if (!currentUser) return;
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/message/${chatId}`,
        {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        },
      );
      setMessages(data);
      socket?.emit("join chat", chatId);
      markChatAsRead(chatId);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  // Sidebar user search (debounced)
  useEffect(() => {
    if (!currentUser) return;
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/users?search=${searchQuery}`,
          { headers: { Authorization: `Bearer ${currentUser.token}` } },
        );
        setSearchResults(data);
      } catch (err) {
        console.error("Error searching users:", err);
      }
    };
    const t = setTimeout(searchUsers, 400);
    return () => clearTimeout(t);
  }, [searchQuery, currentUser]);

  // Group modal user search (debounced)
  useEffect(() => {
    if (!currentUser || !groupSearch.trim()) {
      setGroupSearchResults([]);
      return;
    }
    const searchUsers = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/users?search=${groupSearch}`,
          { headers: { Authorization: `Bearer ${currentUser.token}` } },
        );
        setGroupSearchResults(data);
      } catch (err) {
        console.error("Error searching group users:", err);
      }
    };
    const t = setTimeout(searchUsers, 400);
    return () => clearTimeout(t);
  }, [groupSearch, currentUser]);

  // Drag and Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Process Selected File
  const processSelectedFile = (file) => {
    if (file.size > 25 * 1024 * 1024) {
      alert("File size exceeds maximum limit of 25MB.");
      return;
    }

    let fileType = "document";
    if (file.type.startsWith("image/")) fileType = "image";
    else if (file.type.startsWith("video/")) fileType = "video";
    else if (file.type.startsWith("audio/")) fileType = "audio";

    const previewUrl = fileType === "image" ? URL.createObjectURL(file) : null;
    setPendingFile({ file, previewUrl, fileType });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const clearPendingFile = () => {
    if (pendingFile?.previewUrl) {
      URL.revokeObjectURL(pendingFile.previewUrl);
    }
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Open 1-to-1 chat
  const handleSelectUser = async (userId) => {
    if (!currentUser) return;
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/chat",
        { userId },
        { headers: { Authorization: `Bearer ${currentUser.token}` } },
      );
      if (!chats.some((c) => c._id === data._id)) {
        setChats((prev) => [data, ...prev]);
      }
      setSelectedChat(data);
      fetchMessages(data._id);
      setSearchQuery("");
      setSearchResults([]);
      setMobileChatOpen(true);
    } catch (err) {
      console.error("Error accessing chat:", err);
    }
  };

  // Select existing chat
  const handleSelectChat = (chat) => {
    if (!chat) return;
    setSelectedChat(chat);
    fetchMessages(chat._id);
    markChatAsRead(chat._id);
    setMobileChatOpen(true);
  };

  // Typing handler
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !selectedChat) return;
    if (!localTyping) {
      setLocalTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop typing", selectedChat._id);
      setLocalTyping(false);
    }, 2000);
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !pendingFile) || !selectedChat || !currentUser)
      return;

    try {
      let uploadedFilePayload = null;

      if (pendingFile) {
        const formData = new FormData();
        formData.append("file", pendingFile.file);

        const uploadRes = await axios.post(
          "http://localhost:5000/api/upload",
          formData,
          {
            headers: {
              Authorization: `Bearer ${currentUser.token}`,
              "Content-Type": "multipart/form-data",
            },
          },
        );

        uploadedFilePayload = uploadRes.data;
      }

      const content = newMessage.trim();
      setNewMessage("");
      clearPendingFile();

      socket?.emit("stop typing", selectedChat._id);
      setLocalTyping(false);

      const { data } = await axios.post(
        "http://localhost:5000/api/message",
        {
          content,
          chatId: selectedChat._id,
          file: uploadedFilePayload,
          replyTo: replyingTo ? replyingTo._id : null,
        },
        { headers: { Authorization: `Bearer ${currentUser.token}` } },
      );

      setMessages((prev) => [...prev, data]);
      setReplyingTo(null);
      setChats((prev) => {
        const updated = prev.map((c) =>
          c._id === selectedChat._id ? { ...c, latestMessage: data } : c,
        );
        return updated.sort((a, b) =>
          a._id === selectedChat._id ? -1 : b._id === selectedChat._id ? 1 : 0,
        );
      });

      socket?.emit("send message", data);
    } catch (err) {
      console.error("Error sending message:", err);
      const msg =
        err.response?.data?.message ||
        "Failed to send message/file. Please try again.";
      alert(msg);
    }
  };

  // Profile & Contact Info Handlers
  const openProfileEditModal = () => {
    if (!currentUser?.user) return;
    setEditName(currentUser.user.name || "");
    setEditBio(currentUser.user.bio || "Hey there! I am using LoopChat.");
    setEditAvatar(currentUser.user.avatar || "");
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsUpdatingProfile(true);
    try {
      const { data } = await axios.put(
        "http://localhost:5000/api/users/profile",
        { name: editName, bio: editBio, avatar: editAvatar },
        { headers: { Authorization: `Bearer ${currentUser.token}` } },
      );
      const updatedUser = { ...currentUser, user: data };
      setCurrentUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setShowProfileModal(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/upload",
        formData,
        { headers: { Authorization: `Bearer ${currentUser.token}` } },
      );
      setEditAvatar(data.url);
    } catch (err) {
      console.error("Error uploading avatar:", err);
      alert("Failed to upload image");
    }
  };

  const openContactInfoModal = async () => {
    if (!selectedChat || selectedChat.isGroupChat || !currentUser) return;
    const recipient = getRecipientUser(selectedChat.users);
    if (!recipient || !recipient._id) return;
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/users/profile/${recipient._id}`,
        { headers: { Authorization: `Bearer ${currentUser.token}` } },
      );
      setContactInfoData(data);
      setShowContactInfoModal(true);
    } catch (err) {
      console.error("Error fetching contact info:", err);
    }
  };

  const handleToggleBlockContact = async () => {
    if (!contactInfoData || !currentUser) return;
    setIsBlockingActionLoading(true);
    try {
      const endpoint = contactInfoData.isBlocked
        ? `http://localhost:5000/api/users/unblock/${contactInfoData._id}`
        : `http://localhost:5000/api/users/block/${contactInfoData._id}`;
      await axios.post(
        endpoint,
        {},
        { headers: { Authorization: `Bearer ${currentUser.token}` } },
      );
      setContactInfoData((prev) => ({
        ...prev,
        isBlocked: !prev.isBlocked,
      }));
    } catch (err) {
      console.error("Error blocking/unblocking user:", err);
    } finally {
      setIsBlockingActionLoading(false);
    }
  };

  // Block/unblock recipient directly from chat header 3-dot menu
  const [isRecipientBlocked, setIsRecipientBlocked] = useState(false);

  const handleBlockFromChatHeader = async () => {
    if (!selectedChat || selectedChat.isGroupChat || !currentUser) return;
    const recipient = getRecipient(selectedChat.users);
    if (!recipient) return;
    setIsBlockingActionLoading(true);
    try {
      const endpoint = isRecipientBlocked
        ? `http://localhost:5000/api/users/unblock/${recipient._id}`
        : `http://localhost:5000/api/users/block/${recipient._id}`;
      await axios.post(
        endpoint,
        {},
        { headers: { Authorization: `Bearer ${currentUser.token}` } },
      );
      setIsRecipientBlocked((prev) => !prev);
      // Also keep contactInfoData in sync if the modal has been opened
      if (contactInfoData?._id === recipient._id) {
        setContactInfoData((prev) => ({
          ...prev,
          isBlocked: !isRecipientBlocked,
        }));
      }
    } catch (err) {
      console.error("Error blocking/unblocking user from header:", err);
    } finally {
      setIsBlockingActionLoading(false);
      setShowChatHeaderMenu(false);
    }
  };

  const scrollToMessage = (msgId) => {
    const element = document.getElementById(`msg-${msgId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("highlight-msg");
      setTimeout(() => element.classList.remove("highlight-msg"), 1500);
    }
  };

  // Delete message / media
  const handleDeleteMessage = async (messageId) => {
    if (!currentUser || !selectedChat) return;
    if (!window.confirm("Delete this message/attachment for everyone?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/message/${messageId}`, {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });

      setMessages((prev) => prev.filter((m) => m._id !== messageId));

      socket?.emit("delete message", { messageId, chatId: selectedChat._id });

      setChats((prev) =>
        prev.map((c) => {
          if (
            c._id === selectedChat._id &&
            c.latestMessage?._id === messageId
          ) {
            const remaining = messages.filter((m) => m._id !== messageId);
            return {
              ...c,
              latestMessage:
                remaining.length > 0 ? remaining[remaining.length - 1] : null,
            };
          }
          return c;
        }),
      );
    } catch (err) {
      console.error("Error deleting message:", err);
      alert("Failed to delete message.");
    }
  };

  // Clear Chat (WhatsApp style)
  const handleClearChat = async () => {
    if (!selectedChat || !currentUser) return;
    if (
      !window.confirm(
        `Clear all messages in "${getChatName(selectedChat)}"? This action cannot be undone.`,
      )
    )
      return;

    try {
      await axios.put(
        `http://localhost:5000/api/chat/${selectedChat._id}/clear`,
        {},
        { headers: { Authorization: `Bearer ${currentUser.token}` } },
      );

      setMessages([]);
      setChats((prev) =>
        prev.map((c) =>
          c._id === selectedChat._id ? { ...c, latestMessage: null } : c,
        ),
      );
      socket?.emit("clear chat", { chatId: selectedChat._id });
      setShowChatHeaderMenu(false);
    } catch (err) {
      console.error("Error clearing chat:", err);
      alert("Failed to clear chat.");
    }
  };

  // Delete Chat (WhatsApp style)
  const handleDeleteChat = async () => {
    if (!selectedChat || !currentUser) return;
    if (
      !window.confirm(
        `Delete chat with "${getChatName(selectedChat)}"? All messages will be permanently removed.`,
      )
    )
      return;

    try {
      await axios.delete(`http://localhost:5000/api/chat/${selectedChat._id}`, {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });

      const deletedChatId = selectedChat._id;
      setChats((prev) => prev.filter((c) => c._id !== deletedChatId));
      setSelectedChat(null);
      setMessages([]);
      socket?.emit("delete chat", { chatId: deletedChatId });
      setShowChatHeaderMenu(false);
    } catch (err) {
      console.error("Error deleting chat:", err);
      alert("Failed to delete chat.");
    }
  };

  // Forward message to another chat
  const handleForwardMessage = async (targetChat) => {
    if (!forwardingMsg || !currentUser) return;
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/message",
        {
          content: forwardingMsg.content || "",
          chatId: targetChat._id,
          file: forwardingMsg.file || null,
        },
        { headers: { Authorization: `Bearer ${currentUser.token}` } },
      );

      if (selectedChat?._id === targetChat._id) {
        setMessages((prev) => [...prev, data]);
      }

      setChats((prev) => {
        const updated = prev.map((c) =>
          c._id === targetChat._id ? { ...c, latestMessage: data } : c,
        );
        return updated.sort((a, b) =>
          a._id === targetChat._id ? -1 : b._id === targetChat._id ? 1 : 0,
        );
      });

      socket?.emit("send message", data);

      setShowForwardModal(false);
      setForwardingMsg(null);
      setForwardSearch("");
    } catch (err) {
      console.error("Error forwarding message:", err);
      alert("Failed to forward message.");
    }
  };

  // Create group chat
  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedGroupMembers.length < 2) return;
    setGroupCreating(true);
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/chat/group",
        {
          name: groupName,
          users: selectedGroupMembers.map((u) => u._id),
        },
        { headers: { Authorization: `Bearer ${currentUser.token}` } },
      );
      setChats((prev) => [data, ...prev]);
      setSelectedChat(data);
      fetchMessages(data._id);
      setShowGroupModal(false);
      setGroupName("");
      setGroupSearch("");
      setGroupSearchResults([]);
      setSelectedGroupMembers([]);
    } catch (err) {
      console.error("Error creating group:", err);
    } finally {
      setGroupCreating(false);
    }
  };

  // Toggle member in group creation
  const toggleGroupMember = (user) => {
    if (selectedGroupMembers.some((m) => m._id === user._id)) {
      setSelectedGroupMembers((prev) => prev.filter((m) => m._id !== user._id));
    } else {
      setSelectedGroupMembers((prev) => [...prev, user]);
    }
  };

  // Leave group
  const handleLeaveGroup = async () => {
    if (!selectedChat || !currentUser) return;
    if (!window.confirm(`Leave "${selectedChat.chatName}"?`)) return;
    try {
      await axios.put(
        "http://localhost:5000/api/chat/group/remove",
        { chatId: selectedChat._id, userId: currentUser.user._id },
        { headers: { Authorization: `Bearer ${currentUser.token}` } },
      );
      setChats((prev) => prev.filter((c) => c._id !== selectedChat._id));
      setSelectedChat(null);
      setMessages([]);
    } catch (err) {
      console.error("Error leaving group:", err);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // Helpers
  const getRecipient = (chatUsers) => {
    if (!currentUser || !chatUsers) return {};
    return chatUsers[0]._id === currentUser.user._id
      ? chatUsers[1]
      : chatUsers[0];
  };

  const getChatName = (chat) => {
    if (!chat) return "";
    if (chat.isGroupChat) return chat.chatName;
    return getRecipient(chat.users)?.name || "Unknown";
  };

  const getChatAvatarText = (chat) => {
    if (!chat) return "?";
    return getRecipient(chat.users)?.name?.charAt(0).toUpperCase() || "?";
  };

  const isRecipientOnline = (chat) => {
    if (!chat || chat.isGroupChat) return false;
    return onlineUsers.includes(getRecipient(chat.users)?._id);
  };

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatCallTime = (dateStr) => {
    if (!dateStr) return "";
    const msgDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    const timeStr = msgDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (sameDay(msgDate, today)) return timeStr;
    if (sameDay(msgDate, yesterday)) return `Yesterday`;

    const daysAgo = Math.floor((today - msgDate) / 86400000);
    if (daysAgo < 7) {
      return msgDate.toLocaleDateString([], { weekday: "long" });
    }
    return msgDate.toLocaleDateString([], {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getDateLabel = (dateStr) => {
    const msgDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (sameDay(msgDate, today)) return "Today";
    if (sameDay(msgDate, yesterday)) return "Yesterday";

    const daysAgo = Math.floor((today - msgDate) / 86_400_000);
    if (daysAgo < 7) {
      return msgDate.toLocaleDateString([], { weekday: "long" });
    }
    return msgDate.toLocaleDateString([], {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const isSameDay = (a, b) => {
    const da = new Date(a),
      db = new Date(b);
    return (
      da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate()
    );
  };

  function CameraIcon({ size = 16, color = "currentColor" }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        style={{ flexShrink: 0 }}
      >
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    );
  }

  const getSidebarMessageContent = (msg) => {
    if (!msg) return "No messages yet";
    if (msg.callInfo?.isCall) {
      const isMeSender =
        (typeof msg.sender === "object" ? msg.sender._id : msg.sender) ===
        currentUser?.user?._id;
      if (msg.callInfo.isVideoCall) {
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <FilledVideoIcon
              size={16}
              color={
                isDark
                  ? isMeSender
                    ? "var(--accent-text)"
                    : "#ef4444"
                  : "#626262"
              }
            />
            <span>{isMeSender ? "Video call" : "Missed video call"}</span>
          </span>
        );
      }
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          <FilledPhoneIcon
            size={16}
            color={
              isDark
                ? isMeSender
                  ? "var(--accent-text)"
                  : "#ef4444"
                : "#626262"
            }
          />
          <span>{isMeSender ? "Voice call" : "Missed voice call"}</span>
        </span>
      );
    }
    if (msg.content) return msg.content;
    if (msg.file) {
      const type = msg.file.fileType;
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          {type === "image" ? (
            <CameraIcon size={12} color="var(--accent-text)" />
          ) : type === "video" ? (
            <VideoIcon size={12} color="var(--accent-text)" />
          ) : type === "audio" ? (
            <AudioIcon size={12} color="var(--accent-text)" />
          ) : (
            <FileTextIcon size={12} color="var(--accent-text)" />
          )}
          <span>
            {type === "image"
              ? "Photo"
              : type === "video"
                ? "Video"
                : type === "audio"
                  ? "Audio note"
                  : msg.file.fileName || "Document"}
          </span>
        </span>
      );
    }
    return "Attachment";
  };

  const filteredForwardChats = chats.filter((chat) =>
    getChatName(chat).toLowerCase().includes(forwardSearch.toLowerCase()),
  );

  return (
    <>
      {/* Forward Message Modal */}
      {showForwardModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForwardModal(false);
          }}
        >
          <div className="modal-card">
            <h3
              className="modal-title"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <ForwardIcon size={18} color="var(--accent-text)" /> Forward
              Message
            </h3>

            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-2)",
                marginBottom: "1rem",
              }}
            >
              Select a chat to forward{" "}
              {forwardingMsg?.file
                ? forwardingMsg.file.fileName || "attachment"
                : "message"}
              :
            </p>

            <input
              className="modal-input"
              placeholder="Search chat or group..."
              value={forwardSearch}
              onChange={(e) => setForwardSearch(e.target.value)}
            />

            <ul className="modal-user-list" style={{ maxHeight: "240px" }}>
              {filteredForwardChats.map((chat) => (
                <li
                  key={chat._id}
                  className="modal-user-item"
                  onClick={() => handleForwardMessage(chat)}
                >
                  <div
                    className={`avatar ${chat.isGroupChat ? "avatar-group" : isRecipientOnline(chat) ? "avatar-online" : ""}`}
                    style={{ width: 34, height: 34 }}
                  >
                    {chat.isGroupChat ? (
                      <UsersIcon size={16} />
                    ) : (
                      getChatAvatarText(chat)
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.92rem", fontWeight: 500 }}>
                      {getChatName(chat)}
                    </div>
                    <div
                      style={{
                        fontSize: "0.76rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {chat.isGroupChat ? "Group Chat" : "Direct Message"}
                    </div>
                  </div>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: "0.8rem",
                      color: "var(--accent-text)",
                      fontWeight: 500,
                    }}
                  >
                    Forward ↪
                  </span>
                </li>
              ))}
              {filteredForwardChats.length === 0 && (
                <div
                  style={{
                    padding: "1.5rem",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "0.88rem",
                  }}
                >
                  No matching chats found
                </div>
              )}
            </ul>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowForwardModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Lightbox Modal */}
      {mediaLightbox && (
        <div
          className="lightbox-overlay"
          onClick={() => setMediaLightbox(null)}
        >
          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="lightbox-close-btn"
              onClick={() => setMediaLightbox(null)}
            >
              <CrossIcon size={16} />
            </button>
            <img
              src={mediaLightbox.url}
              alt={mediaLightbox.fileName}
              className="lightbox-image"
            />
            <div className="lightbox-footer">
              <span className="lightbox-filename">
                {mediaLightbox.fileName}
              </span>
              <a
                href={mediaLightbox.url}
                download={mediaLightbox.fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="lightbox-download-link"
              >
                <DownloadIcon size={14} /> Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showGroupModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGroupModal(false);
          }}
        >
          <div className="modal-card">
            <h3 className="modal-title">Create New Group</h3>

            <input
              className="modal-input"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            {selectedGroupMembers.length > 0 && (
              <div className="chips-container">
                {selectedGroupMembers.map((u) => (
                  <span key={u._id} className="member-chip">
                    {u.name}
                    <button
                      className="chip-remove"
                      onClick={() => toggleGroupMember(u)}
                    >
                      <CrossIcon size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              className="modal-input"
              placeholder="Search users to add"
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
            />

            {groupSearchResults.length > 0 && (
              <ul className="modal-user-list">
                {groupSearchResults.map((user) => {
                  const isSelected = selectedGroupMembers.some(
                    (m) => m._id === user._id,
                  );
                  return (
                    <li
                      key={user._id}
                      className={`modal-user-item ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleGroupMember(user)}
                    >
                      <div
                        className="avatar"
                        style={{ width: 32, height: 32, fontSize: "0.8rem" }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>
                          {user.name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {user.email}
                        </div>
                      </div>
                      {isSelected && (
                        <span style={{ marginLeft: "auto" }}>
                          <CheckIcon size={16} />
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: "1.25rem",
              }}
            >
              {selectedGroupMembers.length} member
              {selectedGroupMembers.length !== 1 ? "s" : ""} selected
              {selectedGroupMembers.length < 2 && " — need at least 2"}
            </p>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowGroupModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-create"
                onClick={handleCreateGroup}
                disabled={
                  !groupName.trim() ||
                  selectedGroupMembers.length < 2 ||
                  groupCreating
                }
              >
                {groupCreating ? "Creating..." : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CALL-BACK CONFIRMATION MODAL (WhatsApp-style) ===== */}
      {callBackModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCallBackModal(null);
          }}
        >
          <div className="callback-confirm-modal">
            {/* Avatar circle */}
            <div className="callbackmodal-avatar">
              {callBackModal.callerName?.charAt(0).toUpperCase() || "?"}
            </div>

            {/* Name */}
            <div className="callbackmodal-name">{callBackModal.callerName}</div>

            {/* Action buttons */}
            <div className="callbackmodal-actions">
              <button
                className="callbackmodal-btn callbackmodal-cancel"
                onClick={() => setCallBackModal(null)}
              >
                Cancel
              </button>
              <button
                className="callbackmodal-btn callbackmodal-accept"
                onClick={() => {
                  setCallBackModal(null);
                  initiateCall(callBackModal.isVideoCall);
                }}
              >
                {callBackModal.isVideoCall ? (
                  <>
                    <FilledVideoIcon size={16} color="#fff" />
                    <span>Video call</span>
                  </>
                ) : (
                  <>
                    <FilledPhoneIcon size={16} color="#fff" />
                    <span>Voice call</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Layout */}
      <div
        className={`chat-container${mobileChatOpen && selectedChat ? " mobile-chat-active" : ""}`}
      >
        {/* ===== WHATSAPP WEB-STYLE LEFT VERTICAL NAVIGATION RAIL ===== */}
        <div className="nav-rail">
          <div className="nav-rail-top">
            <button
              type="button"
              className={`nav-rail-item ${activeNavTab === "chats" ? "active" : ""}`}
              onClick={() => setActiveNavTab("chats")}
              title="Chats"
            >
              <ChatsTabIcon size={22} />
              {notifications.length > 0 && (
                <span className="nav-rail-badge">{notifications.length}</span>
              )}
            </button>

            <button
              type="button"
              className={`nav-rail-item ${activeNavTab === "calls" ? "active" : ""}`}
              onClick={() => setActiveNavTab("calls")}
              title="Calls History"
            >
              <CallsTabIcon size={22} />
            </button>

            <button
              type="button"
              className={`nav-rail-item ${activeNavTab === "groups" ? "active" : ""}`}
              onClick={() => setActiveNavTab("groups")}
              title="Groups & Communities"
            >
              <GroupsTabIcon size={22} />
            </button>
          </div>

          <div className="nav-rail-bottom">
            <button
              type="button"
              className="nav-rail-item"
              onClick={() => setIsDark((prev) => !prev)}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <SunIcon size={20} color="currentColor" />
              ) : (
                <MoonIcon size={20} color="currentColor" />
              )}
            </button>

            <button
              type="button"
              className={`nav-rail-item profile-rail-thumb ${activeNavTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveNavTab("profile")}
              title="Your Profile"
            >
              {renderUserAvatar(currentUser?.user, 32)}
            </button>
          </div>
        </div>

        {/* ===== SIDEBAR ===== */}
        <div className="chat-sidebar">
          {/* TAB 1: CHATS VIEW */}
          {activeNavTab === "chats" && (
            <>
              <div className="sidebar-top">
                <LoopChatLogo size={22} textSize="0.98rem" />
                <div
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    gap: "0.4rem",
                    position: "relative",
                  }}
                >
                  <button
                    type="button"
                    className="sidebar-menu-dots-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSidebarHeaderMenu((prev) => !prev);
                    }}
                    title="Menu"
                  >
                    <MoreVerticalIcon size={22} />
                  </button>

                  {showSidebarHeaderMenu && (
                    <>
                      <div
                        className="dropdown-backdrop"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSidebarHeaderMenu(false);
                        }}
                      />
                      <div
                        className="header-dropdown-menu"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "2.4rem",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border)",
                          borderRadius: "10px",
                          boxShadow: "var(--shadow-lg)",
                          padding: "0.4rem",
                          zIndex: 100,
                          minWidth: "160px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.2rem",
                        }}
                      >
                        <button
                          type="button"
                          className="context-menu-item"
                          onClick={() => {
                            setShowSidebarHeaderMenu(false);
                            setShowGroupModal(true);
                          }}
                        >
                          <UsersIcon size={16} />
                          <span>Create group</span>
                        </button>

                        <button
                          type="button"
                          className="context-menu-item danger"
                          onClick={() => {
                            setShowSidebarHeaderMenu(false);
                            handleLogout();
                          }}
                        >
                          <LogOutIcon size={16} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="sidebar-search">
                <div className="search-input-wrapper">
                  <span className="search-icon-left">
                    <SearchIcon
                      size={16}
                      color={isDark ? "#a5a5a5" : "#626262"}
                    />
                  </span>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search or start new chat"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="search-clear"
                      onClick={() => setSearchQuery("")}
                    >
                      <CrossIcon size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div className="sidebar-list-container">
                {searchQuery ? (
                  <>
                    <div className="list-section-title">Search Results</div>
                    <ul className="sidebar-list">
                      {searchResults.map((user) => (
                        <li
                          key={user._id}
                          className="sidebar-item"
                          onClick={() => handleSelectUser(user._id)}
                        >
                          <div
                            className={`avatar ${onlineUsers.includes(user._id) ? "avatar-online" : ""}`}
                          >
                            {renderUserAvatar(user, 40)}
                          </div>
                          <div className="item-details">
                            <div className="item-name">{user.name}</div>
                            <div
                              className="item-msg"
                              style={{ fontSize: "0.8rem" }}
                            >
                              {user.email}
                            </div>
                          </div>
                        </li>
                      ))}
                      {searchResults.length === 0 && (
                        <div
                          style={{
                            padding: "1.5rem",
                            color: "var(--text-muted)",
                            fontSize: "0.9rem",
                          }}
                        >
                          No users found
                        </div>
                      )}
                    </ul>
                  </>
                ) : (
                  <>
                    <div className="list-section-title">Recent Chats</div>
                    <ul className="sidebar-list">
                      {chats.map((chat) => {
                        const isSelected = selectedChat?._id === chat._id;
                        const chatNotifications = notifications.filter((n) => {
                          const nChatId =
                            typeof n.chat === "object" ? n.chat?._id : n.chat;
                          return nChatId === chat._id;
                        });
                        const online = isRecipientOnline(chat);

                        const latestSenderId = chat.latestMessage?.sender
                          ? typeof chat.latestMessage.sender === "object"
                            ? chat.latestMessage.sender._id
                            : chat.latestMessage.sender
                          : null;
                        const currentUserId = currentUser?.user?._id;
                        const isLatestFromOther =
                          latestSenderId && latestSenderId !== currentUserId;
                        const readByList = chat.latestMessage?.readBy || [];
                        const isLatestReadByMe = readByList.some(
                          (id) =>
                            (typeof id === "object" ? id._id : id) ===
                            currentUserId,
                        );
                        const isLatestUnread =
                          isLatestFromOther && !isLatestReadByMe;

                        const unreadCount = isSelected
                          ? 0
                          : chatNotifications.length > 0
                            ? chatNotifications.length
                            : isLatestUnread
                              ? 1
                              : 0;

                        return (
                          <li
                            key={chat._id}
                            className={`sidebar-item ${isSelected ? "active" : ""}`}
                            onClick={() => handleSelectChat(chat)}
                          >
                            <div
                              className={`avatar ${chat.isGroupChat ? "avatar-group" : online ? "avatar-online" : ""}`}
                            >
                              {chat.isGroupChat ? (
                                <UsersIcon size={16} />
                              ) : (
                                renderUserAvatar(getRecipient(chat.users), 40)
                              )}
                            </div>
                            <div className="item-details">
                              <div className="item-name-row">
                                <span className="item-name">
                                  {getChatName(chat)}
                                  {chat.isGroupChat && (
                                    <span
                                      className="group-badge"
                                      style={{ marginLeft: "0.4rem" }}
                                    >
                                      Group
                                    </span>
                                  )}
                                </span>
                                <span
                                  className="item-meta"
                                  style={{
                                    color:
                                      unreadCount > 0 ? "#0078D4" : "#a5a5a5",
                                    fontWeight: unreadCount > 0 ? "600" : "400",
                                  }}
                                >
                                  {formatTime(chat.updatedAt)}
                                </span>
                              </div>
                              <div className="item-subtext-row">
                                <span
                                  className="item-msg"
                                  style={{
                                    fontWeight: unreadCount > 0 ? "600" : "400",
                                    color:
                                      unreadCount > 0
                                        ? "var(--text-1)"
                                        : "var(--text-2)",
                                  }}
                                >
                                  {chatNotifications.length > 0 ? (
                                    <span
                                      style={{
                                        color: "var(--accent-text)",
                                        fontWeight: "600",
                                      }}
                                    >
                                      {getSidebarMessageContent(
                                        chatNotifications[
                                          chatNotifications.length - 1
                                        ],
                                      )}
                                    </span>
                                  ) : chat.latestMessage ? (
                                    (() => {
                                      const sender = chat.latestMessage.sender;
                                      const senderId =
                                        typeof sender === "object"
                                          ? sender._id
                                          : sender;
                                      const senderName =
                                        typeof sender === "object"
                                          ? sender.name
                                          : "User";
                                      const isMe =
                                        senderId === currentUser?.user?._id;
                                      const latestReadBy =
                                        chat.latestMessage.readBy || [];
                                      const sidebarIsRead = latestReadBy.some(
                                        (id) =>
                                          (typeof id === "object"
                                            ? id._id
                                            : id) !== currentUser?.user?._id,
                                      );
                                      const sidebarIsDelivered =
                                        !chat.isGroupChat &&
                                        isRecipientOnline(chat);
                                      const sidebarTickState = sidebarIsRead
                                        ? "read"
                                        : sidebarIsDelivered
                                          ? "delivered"
                                          : "sent";
                                      return (
                                        <span
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "0.3rem",
                                          }}
                                        >
                                          {isMe &&
                                            !chat.isGroupChat &&
                                            !chat.latestMessage?.callInfo
                                              ?.isCall && (
                                              <TickIcon
                                                tickState={sidebarTickState}
                                                size={8}
                                              />
                                            )}
                                          {chat.isGroupChat && (
                                            <span style={{ fontWeight: 500 }}>
                                              {isMe
                                                ? "You: "
                                                : `${senderName}: `}
                                            </span>
                                          )}
                                          {getSidebarMessageContent(
                                            chat.latestMessage,
                                          )}
                                        </span>
                                      );
                                    })()
                                  ) : (
                                    "No messages yet"
                                  )}
                                </span>
                                {unreadCount > 0 && (
                                  <span
                                    className="notification-badge"
                                    title={`${unreadCount} unread`}
                                  >
                                    {unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                      {chats.length === 0 && (
                        <div
                          style={{
                            padding: "2rem",
                            color: "var(--text-muted)",
                            fontSize: "0.9rem",
                          }}
                        >
                          No active chats.
                        </div>
                      )}
                    </ul>
                  </>
                )}
              </div>
            </>
          )}

          {/* TAB 2: CALLS HISTORY VIEW */}
          {activeNavTab === "calls" && (
            <>
              <div className="sidebar-top">
                <h2 className="sidebar-tab-title">Calls</h2>
                <button
                  type="button"
                  className="new-group-btn"
                  onClick={() => setShowNewCallModal(true)}
                  style={{
                    marginLeft: "auto",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <span>+ Call</span>
                </button>
              </div>

              <div className="sidebar-search">
                <div className="search-input-wrapper">
                  <span className="search-icon-left">
                    <SearchIcon
                      size={16}
                      color={isDark ? "#a5a5a5" : "#626262"}
                    />
                  </span>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search call history"
                    value={callsSearchQuery}
                    onChange={(e) => setCallsSearchQuery(e.target.value)}
                  />
                  {callsSearchQuery && (
                    <button
                      className="search-clear"
                      onClick={() => setCallsSearchQuery("")}
                    >
                      <CrossIcon size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div className="sidebar-list-container">
                <div className="list-section-title">Recent Call Logs</div>
                <ul className="sidebar-list">
                  {(() => {
                    const logs = [];
                    chats.forEach((chat) => {
                      if (chat.latestMessage?.callInfo?.isCall) {
                        logs.push({ chat, msg: chat.latestMessage });
                      }
                    });
                    messages.forEach((msg) => {
                      if (msg.callInfo?.isCall && selectedChat) {
                        if (!logs.some((l) => l.msg._id === msg._id)) {
                          logs.push({ chat: selectedChat, msg });
                        }
                      }
                    });

                    const filteredLogs = logs.filter((item) => {
                      if (!callsSearchQuery.trim()) return true;
                      const partner = getRecipient(item.chat.users);
                      return partner?.name
                        ?.toLowerCase()
                        .includes(callsSearchQuery.toLowerCase());
                    });

                    if (filteredLogs.length === 0) {
                      return (
                        <div
                          style={{
                            padding: "2rem",
                            color: "var(--text-muted)",
                            fontSize: "0.9rem",
                            textAlign: "center",
                          }}
                        >
                          No call history found. Click <strong>+ Call</strong>{" "}
                          to make your first call!
                        </div>
                      );
                    }

                    return filteredLogs.map(({ chat, msg }) => {
                      const partner = getRecipient(chat.users);
                      const callSenderId =
                        typeof msg.sender === "object"
                          ? msg.sender._id
                          : msg.sender;
                      const iMadeCall = callSenderId === currentUser?.user?._id;

                      return (
                        <li
                          key={msg._id}
                          className="sidebar-item call-log-item"
                        >
                          <div className="avatar">
                            {renderUserAvatar(partner, 40)}
                          </div>
                          <div className="item-details">
                            <div className="item-name-row">
                              <span className="item-name">
                                {partner?.name || getChatName(chat)}
                              </span>
                              <span className="item-meta">
                                {formatCallTime(msg.createdAt)}
                              </span>
                            </div>
                            <div className="item-subtext-row">
                              <span
                                className="item-msg"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.35rem",
                                  color:
                                    !iMadeCall && msg.callInfo?.isMissed
                                      ? "#ef4444"
                                      : "var(--text-2)",
                                }}
                              >
                                {msg.callInfo?.isVideoCall ? (
                                  <FilledVideoIcon
                                    size={14}
                                    color={
                                      !iMadeCall && msg.callInfo?.isMissed
                                        ? "#ef4444"
                                        : "var(--text-3)"
                                    }
                                  />
                                ) : (
                                  <FilledPhoneIcon
                                    size={14}
                                    color={
                                      !iMadeCall && msg.callInfo?.isMissed
                                        ? "#ef4444"
                                        : "var(--text-3)"
                                    }
                                  />
                                )}
                                {iMadeCall ? "Outgoing" : "Missed"}
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    });
                  })()}
                </ul>
              </div>
            </>
          )}

          {/* TAB 3: GROUPS VIEW */}
          {activeNavTab === "groups" && (
            <>
              <div className="sidebar-top">
                <h2 className="sidebar-tab-title">Groups</h2>
                <button
                  type="button"
                  className="new-group-btn"
                  onClick={() => setShowGroupModal(true)}
                  style={{ marginLeft: "auto" }}
                >
                  + Create Group
                </button>
              </div>

              <div className="sidebar-search">
                <div className="search-input-wrapper">
                  <span className="search-icon-left">
                    <SearchIcon
                      size={16}
                      color={isDark ? "#a5a5a5" : "#626262"}
                    />
                  </span>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search groups"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="search-clear"
                      onClick={() => setSearchQuery("")}
                    >
                      <CrossIcon size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div className="sidebar-list-container">
                <div className="list-section-title">Your Groups</div>
                <ul className="sidebar-list">
                  {(() => {
                    const groupChats = chats.filter((c) => c.isGroupChat);
                    const filtered = searchQuery.trim()
                      ? groupChats.filter((c) =>
                          c.chatName
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()),
                        )
                      : groupChats;

                    if (filtered.length === 0) {
                      return (
                        <div
                          style={{
                            padding: "2rem",
                            color: "var(--text-muted)",
                            fontSize: "0.9rem",
                            textAlign: "center",
                          }}
                        >
                          No groups found. Click <strong>+ Create Group</strong>{" "}
                          to make one!
                        </div>
                      );
                    }

                    return filtered.map((chat) => (
                      <li
                        key={chat._id}
                        className={`sidebar-item ${selectedChat?._id === chat._id ? "active" : ""}`}
                        onClick={() => handleSelectChat(chat)}
                      >
                        <div className="avatar avatar-group">
                          <UsersIcon size={18} />
                        </div>
                        <div className="item-details">
                          <div className="item-name-row">
                            <span className="item-name">{chat.chatName}</span>
                            <span className="item-meta">
                              {chat.users?.length || 0} members
                            </span>
                          </div>
                          <div className="item-subtext-row">
                            <span className="item-msg">
                              {chat.latestMessage
                                ? getSidebarMessageContent(chat.latestMessage)
                                : "Group created"}
                            </span>
                          </div>
                        </div>
                      </li>
                    ));
                  })()}
                </ul>
              </div>
            </>
          )}

          {/* TAB 4: INLINE PROFILE VIEW */}
          {activeNavTab === "profile" && (
            <>
              <div className="sidebar-top">
                <h2 className="sidebar-tab-title">Profile</h2>
              </div>

              <div
                className="sidebar-list-container"
                style={{ padding: "1.2rem 1rem" }}
              >
                <form
                  onSubmit={handleSaveProfile}
                  className="sidebar-profile-form"
                >
                  <div
                    className="profile-avatar-wrapper"
                    style={{ margin: "0 auto 1.2rem auto" }}
                  >
                    {editAvatar ? (
                      <img
                        src={
                          editAvatar.startsWith("http")
                            ? editAvatar
                            : `http://localhost:5000${editAvatar}`
                        }
                        alt="Avatar"
                        className="profile-avatar-img"
                      />
                    ) : (
                      <div className="profile-avatar-placeholder">
                        {currentUser?.user?.name?.charAt(0).toUpperCase() ||
                          "?"}
                      </div>
                    )}
                    <label
                      className="profile-avatar-edit-label"
                      title="Change photo"
                    >
                      <CameraIcon size={16} color="#fff" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileUpload}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>

                  <div
                    className="profile-input-group"
                    style={{ marginBottom: "1rem" }}
                  >
                    <label>Your Name</label>
                    <input
                      type="text"
                      className="profile-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  <div
                    className="profile-input-group"
                    style={{ marginBottom: "1.2rem" }}
                  >
                    <label>About / Bio</label>
                    <input
                      type="text"
                      className="profile-input"
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Hey there! I am using LoopChat."
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-create"
                    style={{
                      width: "100%",
                      padding: "0.7rem",
                      borderRadius: "10px",
                      fontWeight: "600",
                    }}
                    disabled={isUpdatingProfile}
                  >
                    {isUpdatingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </form>

                <div
                  className="contact-detail-box"
                  style={{ marginTop: "1.2rem" }}
                >
                  <span className="contact-detail-title">Account Email</span>
                  <p className="contact-detail-text">
                    {currentUser?.user?.email}
                  </p>
                </div>

                <button
                  className="logout-btn"
                  type="button"
                  onClick={handleLogout}
                >
                  <LogOutIcon />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>

        {/* ===== CHAT WINDOW ===== */}
        <div
          className={`chat-window ${isDragging ? "dragging-over" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag & Drop Visual Overlay */}
          {isDragging && (
            <div className="drag-drop-overlay">
              <div className="drag-drop-card">
                <FileTextIcon size={44} color="var(--accent-text)" />
                <h3>Drop file to send</h3>
                <p>Images, videos, audio, or documents up to 25MB</p>
              </div>
            </div>
          )}

          {selectedChat ? (
            <>
              {/* Header */}
              <div className="chat-header">
                <div
                  className="chat-user-info"
                  onClick={openContactInfoModal}
                  title={
                    selectedChat.isGroupChat
                      ? ""
                      : "Click to view contact info & profile"
                  }
                  style={{
                    cursor: selectedChat.isGroupChat ? "default" : "pointer",
                  }}
                >
                  {/* Mobile back button */}
                  <button
                    type="button"
                    className="mobile-back-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMobileChatOpen(false);
                    }}
                    title="Back to chats"
                  >
                    <ArrowLeftIcon size={20} />
                  </button>
                  <div
                    className={`avatar ${selectedChat.isGroupChat ? "avatar-group" : isRecipientOnline(selectedChat) ? "avatar-online" : ""}`}
                  >
                    {selectedChat.isGroupChat ? (
                      <UsersIcon size={18} />
                    ) : (
                      renderUserAvatar(getRecipient(selectedChat.users), 40)
                    )}
                  </div>
                  <div className="chat-user-details">
                    <span className="chat-user-name">
                      {getChatName(selectedChat)}
                    </span>
                    {selectedChat.isGroupChat ? (
                      <div className="group-members-list">
                        {selectedChat.users?.map((u) => {
                          const isAdmin =
                            u._id ===
                            (typeof selectedChat.groupAdmin === "object"
                              ? selectedChat.groupAdmin?._id
                              : selectedChat.groupAdmin);
                          return (
                            <span
                              key={u._id}
                              className={`group-member-tag ${isAdmin ? "admin-tag" : ""}`}
                            >
                              {isAdmin && <CrownIcon size={11} />}
                              {u.name}
                            </span>
                          );
                        })}
                      </div>
                    ) : isTyping ? (
                      <div className="typing-status-indicator">
                        <span>typing</span>
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                      </div>
                    ) : isPeerRecordingAudio ? (
                      <div className="typing-status-indicator">
                        <span>recording audio</span>
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                      </div>
                    ) : (
                      <span
                        className={`chat-user-status ${isRecipientOnline(selectedChat) ? "online" : ""}`}
                      >
                        {isRecipientOnline(selectedChat)
                          ? "online"
                          : formatLastSeen(
                              getRecipient(selectedChat.users)?.lastSeen,
                            )}
                      </span>
                    )}
                  </div>
                </div>

                <div className="chat-header-actions">
                  {!selectedChat.isGroupChat && (
                    <>
                      <button
                        type="button"
                        className="call-header-btn"
                        onClick={() => initiateCall(false)}
                        title="Start Voice Call"
                      >
                        <PhoneCallIcon size={22} />
                      </button>

                      <button
                        type="button"
                        className="call-header-btn"
                        onClick={() => initiateCall(true)}
                        title="Start Video Call"
                      >
                        <VideoIcon size={22} />
                      </button>
                    </>
                  )}

                  {selectedChat.isGroupChat && (
                    <button
                      className="leave-group-btn"
                      onClick={handleLeaveGroup}
                    >
                      Leave Group
                    </button>
                  )}

                  {/* 3-Dot WhatsApp Header Action Menu */}
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      className="chat-header-menu-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowChatHeaderMenu((prev) => !prev);
                      }}
                      title="More options"
                    >
                      <MoreVerticalIcon size={22} />
                    </button>

                    {showChatHeaderMenu && (
                      <>
                        <div
                          className="dropdown-backdrop"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowChatHeaderMenu(false);
                          }}
                        />
                        <div
                          className="chat-header-dropdown-menu"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="context-menu-item"
                            onClick={handleClearChat}
                          >
                            <MinusCircle size={14} />
                            <span>Clear Chat</span>
                          </button>
                          {!selectedChat.isGroupChat && (
                            <button
                              type="button"
                              className="context-menu-item danger"
                              onClick={handleBlockFromChatHeader}
                              disabled={isBlockingActionLoading}
                            >
                              <BlockIcon size={14} />
                              <span>
                                {isBlockingActionLoading
                                  ? "Please wait..."
                                  : isRecipientBlocked
                                    ? "Unblock Contact"
                                    : "Block Contact"}
                              </span>
                            </button>
                          )}
                          <button
                            type="button"
                            className="context-menu-item danger"
                            onClick={handleDeleteChat}
                          >
                            <TrashIcon size={14} />
                            <span>Delete Chat</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages pane */}
              <div className="messages-pane">
                {messages.map((msg, idx) => {
                  const senderId =
                    typeof msg.sender === "object"
                      ? msg.sender._id
                      : msg.sender;
                  const senderName =
                    typeof msg.sender === "object" ? msg.sender.name : "User";
                  const isSentByMe = senderId === currentUser.user._id;

                  const readBy = msg.readBy || [];
                  const isRead = readBy.some(
                    (id) =>
                      (typeof id === "object" ? id._id : id) !==
                      currentUser.user._id,
                  );
                  const recipient = !selectedChat.isGroupChat
                    ? getRecipient(selectedChat.users)
                    : null;
                  const isDelivered =
                    recipient && onlineUsers.includes(recipient._id);

                  let tickState = "sent";
                  if (isRead) tickState = "read";
                  else if (isDelivered) tickState = "delivered";

                  const showDateSep =
                    idx === 0 ||
                    !isSameDay(messages[idx - 1].createdAt, msg.createdAt);

                  const hasMedia = Boolean(msg.file);
                  const isMediaOnly =
                    hasMedia && (!msg.content || !msg.content.trim());
                  const isMenuOpen = activeMenuMsgId === msg._id;

                  return (
                    <div key={msg._id || idx}>
                      {showDateSep && (
                        <div className="date-separator">
                          <span className="date-separator-label">
                            {getDateLabel(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      <div
                        id={`msg-${msg._id}`}
                        className={`message-wrapper ${isSentByMe ? "sent" : "received"}`}
                      >
                        <div
                          className={`message-bubble ${hasMedia ? "has-media" : ""} ${isMediaOnly ? "media-only-bubble" : ""}`}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuMsgId(isMenuOpen ? null : msg._id);
                          }}
                        >
                          {/* WhatsApp-Style Chevron Action Menu Trigger */}
                          <button
                            type="button"
                            className="message-menu-trigger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuMsgId(isMenuOpen ? null : msg._id);
                            }}
                            title="Message options"
                          >
                            <ChevronDownIcon size={13} />
                          </button>

                          {/* WhatsApp-Style Floating Action Context Menu */}
                          {isMenuOpen && (
                            <div
                              className="message-context-menu"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="context-menu-item"
                                onClick={() => {
                                  setActiveMenuMsgId(null);
                                  setReplyingTo(msg);
                                }}
                              >
                                <ReplyIcon size={14} />
                                <span>Reply</span>
                              </button>

                              <button
                                type="button"
                                className="context-menu-item"
                                onClick={() => {
                                  setActiveMenuMsgId(null);
                                  setForwardingMsg(msg);
                                  setShowForwardModal(true);
                                }}
                              >
                                <ForwardIcon size={14} />
                                <span>Forward</span>
                              </button>

                              {msg.file && (
                                <a
                                  href={`http://localhost:5000${msg.file.url}`}
                                  download={msg.file.fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="context-menu-item"
                                  onClick={() => setActiveMenuMsgId(null)}
                                >
                                  <DownloadIcon size={14} />
                                  <span>Download</span>
                                </a>
                              )}

                              {isSentByMe && (
                                <button
                                  type="button"
                                  className="context-menu-item danger"
                                  onClick={() => {
                                    setActiveMenuMsgId(null);
                                    handleDeleteMessage(msg._id);
                                  }}
                                >
                                  <TrashIcon size={14} />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Render Quoted Reply Box if replying to a message */}
                          {msg.replyTo && (
                            <div
                              className={`quoted-message-box ${isSentByMe ? "my-quote" : "other-quote"}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                scrollToMessage(msg.replyTo._id || msg.replyTo);
                              }}
                              title="Click to jump to quoted message"
                            >
                              <div className="quoted-sender">
                                {typeof msg.replyTo === "object" &&
                                msg.replyTo.sender
                                  ? typeof msg.replyTo.sender === "object"
                                    ? msg.replyTo.sender.name
                                    : "User"
                                  : "Original message"}
                              </div>

                              <div
                                className={`quoted-text ${isSentByMe ? "my-quoted-text" : "other-quoted-text"}`}
                              >
                                {typeof msg.replyTo === "object"
                                  ? msg.replyTo.content ||
                                    (msg.replyTo.file
                                      ? `[${msg.replyTo.file.fileType || "Attachment"}]`
                                      : "Message")
                                  : "Quoted message"}
                              </div>
                            </div>
                          )}

                          {/* Render Missed Call Card if system call message */}
                          {msg.callInfo?.isCall ? (
                            (() => {
                              const callSenderId =
                                typeof msg.sender === "object"
                                  ? msg.sender._id
                                  : msg.sender;
                              const iMadethisCall =
                                callSenderId === currentUser?.user?._id;
                              const callLabel = iMadethisCall
                                ? msg.callInfo.isVideoCall
                                  ? "Video call"
                                  : "Voice call"
                                : msg.callInfo.isVideoCall
                                  ? "Missed video call"
                                  : "Missed voice call";
                              const senderNameForBack =
                                typeof msg.sender === "object"
                                  ? msg.sender.name
                                  : "them";
                              return (
                                <div
                                  className="missed-call-card missed-call-card-clickable"
                                  onClick={() =>
                                    setCallBackModal({
                                      isVideoCall: msg.callInfo.isVideoCall,
                                      callerName: senderNameForBack,
                                    })
                                  }
                                  title="Click to call back"
                                >
                                  <div
                                    className={
                                      iMadethisCall
                                        ? "missed-call-icon missed-call-icon-sender"
                                        : "missed-call-icon"
                                    }
                                    style={{ position: "relative" }}
                                  >
                                    {/* ── VOICE CALL: icon + arrow ── */}
                                    {!msg.callInfo.isVideoCall && (
                                      <>
                                        <FilledPhoneIcon
                                          size={24}
                                          color={
                                            iMadethisCall
                                              ? isDark
                                                ? "#ffffff"
                                                : "#0a1929"
                                              : "#ef4444"
                                          }
                                        />
                                        {/* Voice call arrow badge */}
                                        <svg
                                          style={{
                                            position: "absolute",
                                            ...(iMadethisCall
                                              ? { top: "12px", right: "12px" }
                                              : {
                                                  bottom: "22px",
                                                  left: "22px",
                                                }),
                                          }}
                                          width="10"
                                          height="10"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke={
                                            iMadethisCall
                                              ? isDark
                                                ? "#ffffff"
                                                : "#0a1929"
                                              : "#ef4444"
                                          }
                                          strokeWidth="5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          {iMadethisCall ? (
                                            <>
                                              <line
                                                x1="5"
                                                y1="19"
                                                x2="19"
                                                y2="5"
                                              />
                                              <polyline points="9 5 19 5 19 15" />
                                            </>
                                          ) : (
                                            <>
                                              <line
                                                x1="19"
                                                y1="5"
                                                x2="5"
                                                y2="19"
                                              />
                                              <polyline points="15 19 5 19 5 9" />
                                            </>
                                          )}
                                        </svg>
                                      </>
                                    )}

                                    {/* ── VIDEO CALL: icon + arrow ── */}
                                    {msg.callInfo.isVideoCall && (
                                      <>
                                        <FilledVideoIcon
                                          size={26}
                                          color={
                                            iMadethisCall
                                              ? isDark
                                                ? "#ffffff"
                                                : "#0a1929"
                                              : "#ef4444"
                                          }
                                        />
                                        {/* Video call arrow badge */}
                                        <svg
                                          style={{
                                            position: "absolute",
                                            ...(iMadethisCall
                                              ? { top: "17px", right: "19px" }
                                              : {
                                                  bottom: "17px",
                                                  left: "15px",
                                                }),
                                          }}
                                          width="10"
                                          height="10"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke={
                                            isDark
                                              ? "rgba(0, 0, 0, 0.755)"
                                              : "#ffffff"
                                          }
                                          strokeWidth="5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          {iMadethisCall ? (
                                            <>
                                              <line
                                                x1="5"
                                                y1="19"
                                                x2="19"
                                                y2="5"
                                              />
                                              <polyline points="9 5 19 5 19 15" />
                                            </>
                                          ) : (
                                            <>
                                              <line
                                                x1="19"
                                                y1="5"
                                                x2="5"
                                                y2="19"
                                              />
                                              <polyline points="15 19 5 19 5 9" />
                                            </>
                                          )}
                                        </svg>
                                      </>
                                    )}
                                  </div>
                                  <div className="missed-call-details">
                                    {iMadethisCall ? (
                                      <span className="call-not-answered-title">
                                        {callLabel}
                                      </span>
                                    ) : (
                                      <span className="missed-call-title">
                                        {callLabel}
                                      </span>
                                    )}
                                    <span className="missed-call-tap-hint">
                                      Tap to call back
                                    </span>
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <>
                              {/* Render File Attachment if present */}
                              {msg.file && (
                                <AttachmentView
                                  file={msg.file}
                                  isSentByMe={isSentByMe}
                                  onOpenLightbox={(f) =>
                                    setMediaLightbox({
                                      url: `http://localhost:5000${f.url}`,
                                      fileType: f.fileType,
                                      fileName: f.fileName,
                                    })
                                  }
                                  onToggleMenu={() =>
                                    setActiveMenuMsgId(
                                      isMenuOpen ? null : msg._id,
                                    )
                                  }
                                  timeText={formatTime(msg.createdAt)}
                                  tickState={tickState}
                                  showTimeOverlay={isMediaOnly}
                                  isGroupChat={selectedChat.isGroupChat}
                                />
                              )}

                              {/* Render Text Content if present */}
                              {msg.content && (
                                <div className="message-text-content">
                                  {msg.content}
                                </div>
                              )}
                            </>
                          )}

                          {!isMediaOnly && (
                            <div className="message-info">
                              <span>{formatTime(msg.createdAt)}</span>
                              {isSentByMe && !selectedChat.isGroupChat && (
                                <TickIcon tickState={tickState} size={9} />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator bubble */}
                {isTyping && !selectedChat.isGroupChat && (
                  <div className="message-wrapper received">
                    <div
                      className="message-bubble"
                      style={{
                        display: "flex",
                        gap: "4px",
                        padding: "0.8rem 1rem",
                        alignItems: "center",
                      }}
                    >
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input pane with File Attachment Drawer */}
              <div className="input-pane">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                />

                {/* Quoted Reply Preview Bar */}
                {replyingTo && (
                  <div className="reply-preview-bar">
                    <div className="reply-preview-content">
                      <span className="reply-preview-sender">
                        Replying to{" "}
                        {typeof replyingTo.sender === "object"
                          ? replyingTo.sender.name
                          : "User"}
                      </span>
                      <span className="reply-preview-text">
                        {replyingTo.content ||
                          (replyingTo.file
                            ? `[${replyingTo.file.fileType || "Attachment"}]`
                            : "Message")}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="reply-preview-close"
                      onClick={() => setReplyingTo(null)}
                      title="Cancel reply"
                    >
                      <CrossIcon size={12} />
                    </button>
                  </div>
                )}

                {/* Pending File Attachment Bar */}
                {pendingFile && (
                  <div className="pending-file-bar">
                    <div className="pending-file-info">
                      {pendingFile.fileType === "image" ? (
                        <img
                          src={pendingFile.previewUrl}
                          alt="Preview"
                          className="pending-thumb"
                        />
                      ) : (
                        <div className="pending-doc-icon">
                          {pendingFile.fileType === "video" ? (
                            <VideoIcon size={20} color="var(--accent-text)" />
                          ) : pendingFile.fileType === "audio" ? (
                            <AudioIcon size={20} color="var(--accent-text)" />
                          ) : (
                            <FileTextIcon
                              size={20}
                              color="var(--accent-text)"
                            />
                          )}
                        </div>
                      )}
                      <div className="pending-details">
                        <span className="pending-name">
                          {pendingFile.file.name}
                        </span>
                        <span className="pending-size">
                          {formatBytes(pendingFile.file.size)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="pending-remove-btn"
                      onClick={clearPendingFile}
                      title="Remove attachment"
                    >
                      <CrossIcon size={12} />
                    </button>
                  </div>
                )}

                {contactInfoData?.isBlocked ? (
                  <div className="blocked-banner">
                    <span>You have blocked this contact.</span>
                    <button
                      type="button"
                      className="unblock-btn-small"
                      onClick={handleToggleBlockContact}
                      disabled={isBlockingActionLoading}
                    >
                      {isBlockingActionLoading ? "Unblocking..." : "Unblock"}
                    </button>
                  </div>
                ) : contactInfoData?.isBlockedBy ? (
                  <div className="blocked-banner">
                    <span>You cannot send messages to this contact.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="input-form">
                    {isRecording ? (
                      <div className="recording-bar">
                        <div className="recording-dot" />
                        <span className="recording-timer">
                          {formatTimer(recordingTime)}
                        </span>
                        <span
                          style={{
                            fontSize: "0.82rem",
                            color: "var(--text-2)",
                            marginLeft: "auto",
                          }}
                        >
                          Recording audio note...
                        </span>
                        <button
                          type="button"
                          className="recording-cancel-btn"
                          onClick={cancelRecording}
                          title="Discard recording"
                        >
                          <TrashIcon size={16} />
                        </button>
                        <button
                          type="button"
                          className="recording-send-btn"
                          onClick={stopAndSendRecording}
                          title="Send voice note"
                        >
                          <SendIcon size={16} color="#ffffff" />
                        </button>
                      </div>
                    ) : (
                      <div className="chat-input-container">
                        <button
                          type="button"
                          className="attach-button-inside"
                          onClick={() => fileInputRef.current?.click()}
                          title="Attach file or media"
                          disabled={isRecording}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                          </svg>
                        </button>

                        <input
                          type="text"
                          className="chat-input"
                          placeholder={
                            pendingFile
                              ? "Add a caption (optional)..."
                              : selectedChat.isGroupChat
                                ? `Message ${selectedChat.chatName}...`
                                : "Type a message"
                          }
                          value={newMessage}
                          onChange={handleInputChange}
                        />

                        {!newMessage.trim() && !pendingFile ? (
                          <button
                            type="button"
                            className="mic-button-inside"
                            onClick={startRecording}
                            title="Record voice note"
                          >
                            <MicIcon size={20} color="currentColor" />
                          </button>
                        ) : (
                          <button
                            type="submit"
                            className="send-button-inside"
                            disabled={!newMessage.trim() && !pendingFile}
                            title="Send message"
                          >
                            <SendIcon size={16} color="currentColor" />
                          </button>
                        )}
                      </div>
                    )}
                  </form>
                )}
              </div>
            </>
          ) : (
            <div
              className="chat-placeholder"
              style={
                isDark
                  ? { backgroundColor: "#000000" }
                  : { backgroundColor: "#F7F5F3" }
              }
            >
              <div className="placeholder-icon">
                <svg
                  width="52"
                  height="52"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent-text)"
                  strokeWidth="1.5"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="placeholder-title">
                Select a chat to start looping
              </h3>
              <p style={{ maxWidth: "340px", fontSize: "0.95rem" }}>
                Choose a chat from the sidebar, search for someone to message,
                or click{" "}
                <strong style={{ color: "var(--accent-purple)" }}>
                  + Group
                </strong>{" "}
                to start a group conversation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===== EDIT PROFILE MODAL ===== */}
      {showProfileModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowProfileModal(false);
          }}
        >
          <div className="profile-edit-modal">
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowProfileModal(false)}
              >
                <CrossIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="profile-edit-form">
              <div className="profile-avatar-wrapper">
                {editAvatar ? (
                  <img
                    src={
                      editAvatar.startsWith("http")
                        ? editAvatar
                        : `http://localhost:5000${editAvatar}`
                    }
                    alt="Avatar"
                    className="profile-avatar-img"
                  />
                ) : (
                  <div className="profile-avatar-placeholder">
                    {editName?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <label
                  className="profile-avatar-edit-label"
                  title="Change photo"
                >
                  <CameraIcon size={16} color="#fff" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileUpload}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              <div className="profile-input-group">
                <label>Your Name</label>
                <input
                  type="text"
                  className="profile-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="profile-input-group">
                <label>About / Bio</label>
                <input
                  type="text"
                  className="profile-input"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Hey there! I am using LoopChat."
                />
              </div>

              <div className="modal-actions" style={{ marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowProfileModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-create"
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== CONTACT INFO / PROFILE CARD MODAL ===== */}
      {showContactInfoModal && contactInfoData && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowContactInfoModal(false);
          }}
        >
          <div className="contact-info-modal">
            <div className="contact-modal-top">
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowContactInfoModal(false)}
                style={{ marginLeft: "auto" }}
              >
                <CrossIcon size={24} />
              </button>
            </div>

            <div className="contact-profile-card">
              <div className="contact-avatar-lg">
                {renderUserAvatar(contactInfoData, 90)}
              </div>
              <h2 className="contact-name">{contactInfoData.name}</h2>
              <p className="contact-email">{contactInfoData.email}</p>

              <div className="contact-detail-box">
                <span className="contact-detail-title">About / Bio</span>
                <p className="contact-detail-text">
                  {contactInfoData.bio || "Hey there! I am using LoopChat."}
                </p>
              </div>

              <div className="contact-detail-box">
                <span className="contact-detail-title">Status</span>
                <p className="contact-detail-text">
                  {onlineUsers.includes(contactInfoData._id)
                    ? "Online"
                    : formatLastSeen(contactInfoData.lastSeen)}
                </p>
              </div>

              <div className="contact-actions" style={{ marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className={`btn-block-contact ${contactInfoData.isBlocked ? "blocked" : ""}`}
                  onClick={handleToggleBlockContact}
                  disabled={isBlockingActionLoading}
                >
                  <BlockIcon size={16} />
                  <span>
                    {isBlockingActionLoading
                      ? "Updating..."
                      : contactInfoData.isBlocked
                        ? "Unblock Contact"
                        : "Block Contact"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== NEW CALL SELECTOR MODAL ===== */}
      {showNewCallModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewCallModal(false);
          }}
        >
          <div className="contact-info-modal" style={{ maxWidth: "420px" }}>
            <div className="modal-header" style={{ marginBottom: "1rem" }}>
              <h3>Start a New Call</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowNewCallModal(false)}
              >
                <CrossIcon size={24} />
              </button>
            </div>

            <div
              className="search-input-wrapper"
              style={{ marginBottom: "1rem" }}
            >
              <span className="search-icon-left">
                <SearchIcon size={16} color="#a5a5a5" />
              </span>
              <input
                type="text"
                className="search-input"
                placeholder="Search contact to call"
                value={newCallSearch}
                onChange={async (e) => {
                  const q = e.target.value;
                  setNewCallSearch(q);
                  if (q.trim()) {
                    try {
                      const token = localStorage.getItem("token");
                      const res = await axios.get(
                        `${ENDPOINT}/api/users?search=${q}`,
                        { headers: { Authorization: `Bearer ${token}` } },
                      );
                      setNewCallSearchResults(res.data);
                    } catch (err) {
                      console.error("Error searching users for call:", err);
                    }
                  } else {
                    setNewCallSearchResults([]);
                  }
                }}
              />
            </div>

            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {newCallSearch.trim()
                ? newCallSearchResults.map((user) => (
                    <div
                      key={user._id}
                      className="sidebar-item"
                      style={{ cursor: "default" }}
                    >
                      <div className="avatar">{renderUserAvatar(user, 36)}</div>
                      <div className="item-details">
                        <div className="item-name">{user.name}</div>
                        <div
                          className="item-msg"
                          style={{ fontSize: "0.78rem" }}
                        >
                          {user.email}
                        </div>
                      </div>
                      <div
                        className="call-quick-actions"
                        style={{ marginLeft: "auto" }}
                      >
                        <button
                          type="button"
                          className="call-quick-btn"
                          title="Voice call"
                          onClick={async () => {
                            setShowNewCallModal(false);
                            try {
                              const token = localStorage.getItem("token");
                              const res = await axios.post(
                                `${ENDPOINT}/api/chat`,
                                { userId: user._id },
                                {
                                  headers: { Authorization: `Bearer ${token}` },
                                },
                              );
                              setSelectedChat(res.data);
                              setCallBackModal({
                                isVideoCall: false,
                                callerName: user.name,
                              });
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                        >
                          <PhoneCallIcon size={16} color="var(--accent)" />
                        </button>
                        <button
                          type="button"
                          className="call-quick-btn"
                          title="Video call"
                          onClick={async () => {
                            setShowNewCallModal(false);
                            try {
                              const token = localStorage.getItem("token");
                              const res = await axios.post(
                                `${ENDPOINT}/api/chat`,
                                { userId: user._id },
                                {
                                  headers: { Authorization: `Bearer ${token}` },
                                },
                              );
                              setSelectedChat(res.data);
                              setCallBackModal({
                                isVideoCall: true,
                                callerName: user.name,
                              });
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                        >
                          <VideoIcon size={16} color="var(--accent)" />
                        </button>
                      </div>
                    </div>
                  ))
                : chats
                    .filter((c) => !c.isGroupChat)
                    .map((chat) => {
                      const partner = getRecipient(chat.users);
                      if (!partner) return null;
                      return (
                        <div
                          key={chat._id}
                          className="sidebar-item"
                          style={{ cursor: "default" }}
                        >
                          <div className="avatar">
                            {renderUserAvatar(partner, 36)}
                          </div>
                          <div className="item-details">
                            <div className="item-name">{partner.name}</div>
                            <div
                              className="item-msg"
                              style={{ fontSize: "0.78rem" }}
                            >
                              {partner.email}
                            </div>
                          </div>
                          <div
                            className="call-quick-actions"
                            style={{ marginLeft: "auto" }}
                          >
                            <button
                              type="button"
                              className="call-quick-btn"
                              title="Voice call"
                              onClick={() => {
                                setShowNewCallModal(false);
                                handleSelectChat(chat);
                                setCallBackModal({
                                  isVideoCall: false,
                                  callerName: partner.name,
                                });
                              }}
                            >
                              <PhoneCallIcon size={16} color="var(--accent)" />
                            </button>
                            <button
                              type="button"
                              className="call-quick-btn"
                              title="Video call"
                              onClick={() => {
                                setShowNewCallModal(false);
                                handleSelectChat(chat);
                                setCallBackModal({
                                  isVideoCall: true,
                                  callerName: partner.name,
                                });
                              }}
                            >
                              <VideoIcon size={16} color="var(--accent)" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
            </div>
          </div>
        </div>
      )}

      {/* WebRTC Voice & Video Call Overlay Modal */}
      <CallModal
        callState={callState}
        localStream={localStream}
        remoteStream={remoteStream}
        onAccept={acceptCall}
        onReject={rejectCall}
        onEnd={endCall}
        isMicMuted={isMicMuted}
        isVideoOff={isVideoOff}
        onToggleMic={toggleMic}
        onToggleVideo={toggleVideo}
        callDuration={callDuration}
      />
    </>
  );
}

export default Chat;
