import fs from 'fs';
import path from 'path';

const STATUS_FILE = path.join('/tmp', 'vbiv-sessions.json');

export function readSessions() {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
    }
  } catch (e) {}
  return {};
}

export function writeSessions(data) {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {}
}

export function getSession(adId) {
  const sessions = readSessions();
  return sessions[adId] || null;
}

export function setSessionStatus(adId, status, data) {
  const sessions = readSessions();
  if (!sessions[adId]) sessions[adId] = {};
  sessions[adId].status = status;
  sessions[adId].data = data || null;
  sessions[adId].updatedAt = Date.now();
  writeSessions(sessions);
}

export function clearSessionStatus(adId) {
  const sessions = readSessions();
  if (sessions[adId]) {
    sessions[adId].status = 'wait';
    sessions[adId].data = null;
    sessions[adId].updatedAt = Date.now();
    writeSessions(sessions);
  }
}
