"use client";
import React from 'react';
import { FaTiktok, FaYoutube, FaSpotify, FaAmazon, FaMusic, FaInstagram, FaFacebook } from 'react-icons/fa';

interface SocialIconsBarProps {
  links?: Record<string,string | undefined>;
  className?: string;
  size?: number;
}

const iconMap: { key: string; Icon: React.ComponentType<{ size?: number; className?: string }>; label: string }[] = [
  { key: 'tiktok', Icon: FaTiktok, label: 'TikTok' },
  { key: 'youtube', Icon: FaYoutube, label: 'YouTube' },
  { key: 'spotify', Icon: FaSpotify, label: 'Spotify' },
  { key: 'amazon', Icon: FaAmazon, label: 'Amazon' },
  { key: 'music', Icon: FaMusic, label: 'Music' },
  { key: 'instagram', Icon: FaInstagram, label: 'Instagram' },
  { key: 'facebook', Icon: FaFacebook, label: 'Facebook' },
];

export function SocialIconsBar({ links = {}, className = '', size = 20 }: SocialIconsBarProps) {
  const resolveValue = (key: string) => {
    const variations = [key, key.toLowerCase(), key.toUpperCase(), `${key.charAt(0).toUpperCase()}${key.slice(1)}`];
    const raw = variations.map((variant) => links[variant]).find((value) => Boolean(value));
    if (!raw) return undefined;

    let value = raw.trim();
    if (!value) return undefined;

    // Prefix with protocol if missing and build sensible defaults for handles.
    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    const sanitizeHandle = (handle: string) => handle.replace(/^@/, '').replace(/\s+/g, '');

    switch (key) {
      case 'instagram':
        return `https://instagram.com/${sanitizeHandle(value)}`;
      case 'tiktok':
        return `https://www.tiktok.com/@${sanitizeHandle(value)}`;
      case 'youtube':
        return `https://www.youtube.com/${value.startsWith('channel/') || value.startsWith('@') ? value.replace(/^@/, '') : `@${sanitizeHandle(value)}`}`;
      case 'spotify':
        return value.startsWith('artist/') || value.startsWith('show/') ? `https://open.spotify.com/${value}` : `https://open.spotify.com/${sanitizeHandle(value)}`;
      case 'facebook':
        return `https://www.facebook.com/${sanitizeHandle(value)}`;
      default:
        return `https://${value.replace(/^https?:\/\//i, '')}`;
    }
  };

  const entries = iconMap
    .map(({ key, Icon, label }) => {
      const href = resolveValue(key);
      return href ? ({ key, Icon, label, href }) : undefined;
    })
    .filter((entry): entry is { key: string; Icon: React.ComponentType<{ size?: number; className?: string }>; label: string; href: string } => Boolean(entry));

  const seen = new Set<string>();
  const active = entries.filter(({ href }) => {
    if (seen.has(href)) return false;
    seen.add(href);
    return true;
  });

  if (active.length === 0) return null;
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {active.map(({ key, Icon, label, href }) => (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="text-gray-500 hover:text-gray-900 transition-colors">
          <Icon size={size} />
        </a>
      ))}
    </div>
  );
}
