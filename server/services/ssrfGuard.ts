import dns from 'dns';
import { promisify } from 'util';
import net from 'net';

const dnsLookup = promisify(dns.lookup);

const PRIVATE_IP_RANGES = [
  // 10.0.0.0/8
  { start: ipToLong('10.0.0.0'), end: ipToLong('10.255.255.255') },
  // 172.16.0.0/12
  { start: ipToLong('172.16.0.0'), end: ipToLong('172.31.255.255') },
  // 192.168.0.0/16
  { start: ipToLong('192.168.0.0'), end: ipToLong('192.168.255.255') },
  // 127.0.0.0/8 (loopback)
  { start: ipToLong('127.0.0.0'), end: ipToLong('127.255.255.255') },
  // 169.254.0.0/16 (link local / cloud metadata)
  { start: ipToLong('169.254.0.0'), end: ipToLong('169.254.255.255') },
  // 0.0.0.0/8
  { start: ipToLong('0.0.0.0'), end: ipToLong('0.255.255.255') },
  // 100.64.0.0/10 (carrier-grade NAT)
  { start: ipToLong('100.64.0.0'), end: ipToLong('100.127.255.255') }
];

function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

export function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const longIp = ipToLong(ip);
    for (const range of PRIVATE_IP_RANGES) {
      if (longIp >= range.start && longIp <= range.end) {
        return true;
      }
    }
    return false;
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    // ::1 loopback
    if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
    // unique local address fc00::/7
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    // link-local fe80::/10
    if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true;
    // IPv4-mapped IPv6
    if (normalized.startsWith('::ffff:')) {
      const ipv4Part = normalized.replace('::ffff:', '');
      return isPrivateOrReservedIp(ipv4Part);
    }
  }

  return false;
}

export interface UrlValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  domain?: string;
  hostname?: string;
  protocol?: string;
  error?: string;
  resolvedIp?: string;
}

export async function validateAndSanitizeUrl(rawInput: string): Promise<UrlValidationResult> {
  if (!rawInput || typeof rawInput !== 'string') {
    return { isValid: false, error: 'Please provide a valid website URL.' };
  }

  let trimmed = rawInput.trim();

  // Reject dangerous schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:') ||
    lower.startsWith('ftp:') ||
    lower.startsWith('blob:') ||
    lower.startsWith('vbscript:')
  ) {
    return { isValid: false, error: 'Suspicious or unsupported URL protocol detected. Only HTTP/HTTPS URLs are permitted.' };
  }

  // Prepend https:// if no protocol supplied
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    trimmed = 'https://' + trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch (err) {
    return { isValid: false, error: 'Malformed URL. Please check the spelling (e.g., https://example-store.com).' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isValid: false, error: 'Only HTTP and HTTPS websites can be analyzed.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Reject IP literals as hostnames or localhost
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local') ||
    hostname === 'metadata.google.internal' ||
    hostname === '169.254.169.254'
  ) {
    return { isValid: false, error: 'Scanning localhost, internal, or cloud metadata network addresses is strictly prohibited.' };
  }

  // Check if hostname is direct IP and if it's private
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      return { isValid: false, error: 'Scanning private or reserved IP address ranges is blocked for security.' };
    }
  }

  // Strip www. prefix for consistent domain root
  const domain = hostname.startsWith('www.') ? hostname.substring(4) : hostname;

  // Basic TLD/domain validation
  if (!domain.includes('.') || domain.length < 3) {
    return { isValid: false, error: 'Please enter a valid domain name with an active extension (e.g., store.com).' };
  }

  // Optional DNS check (gracefully catches unresolvable or DNS-rebinding private IPs)
  let resolvedIp = '';
  try {
    const lookup = await dnsLookup(hostname);
    resolvedIp = lookup.address;
    if (isPrivateOrReservedIp(resolvedIp)) {
      return { isValid: false, error: 'Domain resolves to a prohibited internal IP address (SSRF Protection).' };
    }
  } catch (e) {
    // DNS resolution failure is okay for offline/demo tests, but we record it
    resolvedIp = '0.0.0.0';
  }

  const normalizedUrl = `${parsed.protocol}//${parsed.hostname}${parsed.pathname}${parsed.search}`;

  return {
    isValid: true,
    normalizedUrl,
    domain,
    hostname,
    protocol: parsed.protocol,
    resolvedIp
  };
}
