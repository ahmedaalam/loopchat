import { useEffect, useRef } from "react";

function PhoneOffIcon({ size = 20, color = "#ffffff" }) {
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

function PhoneCallIcon({ size = 20, color = "#ffffff" }) {
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
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MicIcon({ size = 18, color = "#ffffff" }) {
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

function MicOffIcon({ size = 18, color = "#ffffff" }) {
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
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function VideoIcon({ size = 18, color = "#ffffff" }) {
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
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function VideoOffIcon({ size = 18, color = "#ffffff" }) {
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
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M21 21l-4.35-4.35M23 7l-7 5 7 5V7z" />
      <path d="M16 16a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h7" />
    </svg>
  );
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function CallModal({
  callState,
  localStream,
  remoteStream,
  onAccept,
  onReject,
  onEnd,
  isMicMuted,
  isVideoOff,
  onToggleMic,
  onToggleVideo,
  callDuration,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Attach streams to video/audio tags
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream]);

  if (!callState || (!callState.isCalling && !callState.isIncoming && !callState.isConnected)) {
    return null;
  }

  const { isCalling, isIncoming, isConnected, callerName, isVideoCall } = callState;

  return (
    <div className="call-modal-overlay">
      <div className={`call-modal-card ${isVideoCall && isConnected ? "video-active" : ""}`}>
        {/* Remote Audio output stream */}
        <audio ref={remoteAudioRef} autoPlay />

        {/* Video Mode Active View */}
        {isVideoCall && isConnected ? (
          <div className="call-video-container">
            {/* Remote Video (Full Card) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="remote-video-element"
            />

            {/* Local Video Thumbnail (PIP) */}
            <div className="local-video-pip">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="local-video-element"
              />
            </div>

            {/* Overlay Header Info */}
            <div className="call-overlay-header">
              <span className="call-overlay-name">{callerName}</span>
              <span className="call-overlay-duration">{formatDuration(callDuration)}</span>
            </div>
          </div>
        ) : (
          /* Voice Call / Ringing View */
          <div className="call-voice-container">
            <div className="call-avatar-wrapper">
              <div className={`call-avatar-circle ${isCalling || isIncoming ? "pulsing" : ""}`}>
                {callerName?.charAt(0).toUpperCase() || "U"}
              </div>
            </div>

            <h3 className="call-user-name">{callerName}</h3>

            <p className="call-status-text">
              {isIncoming
                ? isVideoCall
                  ? "Incoming Video Call..."
                  : "Incoming Voice Call..."
                : isCalling
                ? "Calling..."
                : formatDuration(callDuration)}
            </p>
          </div>
        )}

        {/* Call Controls Toolbar */}
        <div className="call-controls-bar">
          {isIncoming ? (
            /* Incoming Call Actions (Accept / Reject) */
            <div className="call-action-group">
              <button
                type="button"
                className="call-btn btn-reject"
                onClick={onReject}
                title="Decline Call"
              >
                <PhoneOffIcon size={20} />
              </button>
              <button
                type="button"
                className="call-btn btn-accept"
                onClick={onAccept}
                title="Accept Call"
              >
                <PhoneCallIcon size={20} />
              </button>
            </div>
          ) : (
            /* Active / Outgoing Call Actions */
            <div className="call-action-group">
              <button
                type="button"
                className={`call-btn btn-toggle ${isMicMuted ? "active-off" : ""}`}
                onClick={onToggleMic}
                title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMicMuted ? <MicOffIcon size={18} /> : <MicIcon size={18} />}
              </button>

              {isVideoCall && (
                <button
                  type="button"
                  className={`call-btn btn-toggle ${isVideoOff ? "active-off" : ""}`}
                  onClick={onToggleVideo}
                  title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
                >
                  {isVideoOff ? <VideoOffIcon size={18} /> : <VideoIcon size={18} />}
                </button>
              )}

              <button
                type="button"
                className="call-btn btn-end"
                onClick={onEnd}
                title="End Call"
              >
                <PhoneOffIcon size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CallModal;
