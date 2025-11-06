import { subHours, subMinutes } from 'date-fns'

const tenants = ['Alloy Corp', 'Nebula Labs', 'Skyline Systems', 'Quantify', 'Vertex IO']
const users = ['jane.smith', 'alice.jones', 'john.doe', 'charlie.brown', 'bob.wilson', 'maria.lopez', 'li.wei']
const ips = ['192.168.1.100', '10.0.0.45', '172.16.0.23', '10.0.0.150', '192.168.1.200', '172.16.5.12', '10.0.5.99']
const sourceTypes = ['login', 'logout', 'file_access', 'config_change', 'error', 'system_alert']
const severityBySource = {
  login: 'info',
  logout: 'info',
  file_access: 'warning',
  config_change: 'warning',
  error: 'error',
  system_alert: 'error',
}
const sourceMessages = {
  login: 'User successfully authenticated.',
  logout: 'Session terminated for user.',
  file_access: 'File accessed from secured directory.',
  config_change: 'Configuration change applied to service.',
  error: 'Unhandled exception caught in service.',
  system_alert: 'Security alert raised for policy breach.',
}

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)]
}

export function generateMockLogs(count = 120) {
  const now = new Date()
  const logs = Array.from({ length: count }, (_, index) => {
    const hoursBack = Math.floor(Math.random() * 24)
    const minutesBack = Math.floor(Math.random() * 60)
    const timestamp = subMinutes(subHours(now, hoursBack), minutesBack)

    const sourceType = randomItem(sourceTypes)
    const severity = Math.random() > 0.85 ? 'error' : severityBySource[sourceType] || 'info'
    const tenant = randomItem(tenants)
    const user = randomItem(users)
    const ip = randomItem(ips)

    return {
      id: `${timestamp.getTime()}-${index}`,
      timestamp,
      severity,
      user,
      ip,
      sourceType,
      tenant,
      message: sourceMessages[sourceType],
    }
  })

  return logs.sort((a, b) => b.timestamp - a.timestamp)
}

function getTopItems(logs, key, limit = 5) {
  const counts = new Map()
  logs.forEach((log) => {
    const value = log[key]
    if (!value) return
    counts.set(value, (counts.get(value) || 0) + 1)
  })

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }))
}

export function getTopIPs(logs) {
  return getTopItems(logs, 'ip')
}

export function getTopUsers(logs) {
  return getTopItems(logs, 'user')
}

export function getTopSourceTypes(logs) {
  return getTopItems(logs, 'sourceType')
}

export function getTimelineData(logs) {
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }))
  logs.forEach((log) => {
    const hour = log.timestamp.getHours()
    hours[hour].count += 1
  })

  return hours.map(({ hour, count }) => ({
    time: `${hour.toString().padStart(2, '0')}:00`,
    count,
  }))
}

export function getTenants(logs) {
  const unique = new Set(logs.map((log) => log.tenant))
  return ['All', ...Array.from(unique).sort()]
}

export function getSourceTypes(logs) {
  const unique = new Set(logs.map((log) => log.sourceType))
  return ['All', ...Array.from(unique).sort()]
}
